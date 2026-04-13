"""
Journey Service — Phase 20 v2

Manages the personalised learning roadmap (flat ordered course obstacles).

Public functions:
  generate_roadmap(user_id, intent, goal, timeline_months, db)
      — Gemini-powered roadmap generation; saves to user_roadmaps table
  get_roadmap(user_id, db)
      — fetch active roadmap + overdue check + notification triggers + BPS upgrade flag
  check_roadmap_progress(user_id, completed_course_title, db)
      — called after a course is fully completed; fuzzy-matches against element topics;
        marks element done, awards XP, fires notifications
  check_bps_change(user_id, old_bps, new_bps)
      — called after adaptive quiz BPS recalc; sets Redis flag if level increased
  extend_deadline(user_id, extension_months, db)
      — extends the deadline by 1-3 months; only allowed once per roadmap
  verify_and_delete(user_id, db, password=None, oauth_confirmed=False)
      — verifies identity then soft-deletes (status='deleted')
  regenerate_uncompleted(user_id, db)
      — replaces pending elements with freshly generated ones; keeps completed elements
  dismiss_bps_upgrade(user_id)
      — clears the BPS upgrade Redis flag without regenerating
  get_all_roadmaps_admin(db)
      — admin-only: returns all roadmaps across all users
"""

import asyncio
from datetime import date, datetime, timedelta, timezone
from fuzzywuzzy import fuzz
from uuid import UUID

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.journey import UserRoadmap
from backend.models.progress import WeakPoint
from backend.models.user import User
from backend.services.gemini_service import generate_json
from backend.utils.cache import cache_delete, cache_get, cache_set
from backend.utils.logger import get_logger

logger = get_logger(__name__)


class RoadmapGenerationError(Exception):
    """Raised when Gemini fails to produce a valid roadmap (API error or bad response)."""


# ── Redis key templates ───────────────────────────────────────────────────────

_ROADMAP_CACHE_KEY = "journey:{}"               # cached roadmap response, TTL 1hr
_BPS_UPGRADE_KEY   = "journey_bps_upgrade:{}"   # BPS upgrade flag, TTL 7 days
_HALFWAY_NOTIF_KEY = "journey_halfway_notif:{}"  # halfway reminder sent (no expiry)
_7DAY_NOTIF_KEY    = "journey_7day_notif:{}"     # 7-day warning sent (no expiry)

_ROADMAP_CACHE_TTL = 3600          # 1 hour
_BPS_UPGRADE_TTL   = 7 * 24 * 3600  # 7 days

# Elements per timeline month
_ELEMENTS_PER_MONTH = {1: 4, 2: 6, 3: 9, 4: 12, 5: 15, 6: 18}

# BPS level ordering for comparison
_BPS_ORDER = {"BPS-1": 1, "BPS-2": 2, "BPS-3": 3, "BPS-4": 4}


# ── Context helpers ───────────────────────────────────────────────────────────


async def _fetch_user_context(user_id: UUID, db: AsyncSession) -> dict:
    """Fetch BPS level, native language, learning goal, and top weak points."""
    result = await db.execute(
        select(User.proficiency_level, User.native_language, User.learning_goal)
        .where(User.id == user_id)
    )
    row = result.one_or_none()
    bps_level      = row.proficiency_level if row else "BPS-1"
    native_lang    = row.native_language if row else None
    learning_goal  = row.learning_goal if row else None

    wp_result = await db.execute(
        select(WeakPoint.topic, WeakPoint.type, WeakPoint.strength_score)
        .where(WeakPoint.user_id == user_id)
        .order_by(WeakPoint.strength_score.asc())
        .limit(8)
    )
    weak_points = [
        {"topic": r.topic, "type": r.type, "strength": round(r.strength_score, 2)}
        for r in wp_result.fetchall()
    ]
    return {
        "bps_level": bps_level,
        "native_language": native_lang,
        "learning_goal": learning_goal,
        "weak_points": weak_points,
    }


def _deadline_from_months(months: int) -> date:
    """Return the deadline date = today + timeline_months calendar months."""
    today = datetime.now(timezone.utc).date()
    # Approximate: add 30 days per month
    return today + timedelta(days=months * 30)


# ── Gemini prompt builders ────────────────────────────────────────────────────

_INTENT_LABELS = {
    "casual":    "Casual Learning (general interest, everyday phrases)",
    "academic":  "Academic Purposes (exams, university coursework, formal writing)",
    "work":      "Work & Professional (office communication, presentations, emails)",
    "travel":    "Travel & Culture (tourism, cultural immersion, survival phrases)",
    "other":     "General / Other",
}

_BPS_DESCRIPTIONS = {
    "BPS-1": "complete beginner (knows very little Malay)",
    "BPS-2": "elementary (knows basic greetings and simple phrases)",
    "BPS-3": "intermediate (can handle everyday conversations with some difficulty)",
    "BPS-4": "advanced (can discuss complex topics with near-fluency)",
}


def _build_generation_prompt(
    intent: str,
    goal: str,
    timeline_months: int,
    num_elements: int,
    bps_level: str,
    weak_points: list[dict],
    native_language: str | None,
    intent_other: str | None = None,
) -> str:
    # Use free-text description when user selected "Other"
    if intent == "other" and intent_other and intent_other.strip():
        intent_label = intent_other.strip()
    else:
        intent_label = _INTENT_LABELS.get(intent, intent)
    level_desc    = _BPS_DESCRIPTIONS.get(bps_level, "beginner")

    weak_text = ""
    if weak_points:
        items = [f"  - {wp['topic']} ({wp['type']}, strength {wp['strength']})" for wp in weak_points]
        weak_text = "\nIdentified weak areas to address early:\n" + "\n".join(items)

    native_text = ""
    if native_language:
        native_text = (
            f"\nThe user's native language is {native_language}. "
            "Where helpful, choose topics that draw on similarities or contrasts with that language."
        )

    return f"""You are a Bahasa Melayu (Malaysian Malay) language learning expert.

Create a personalised course-based learning roadmap for the following learner:
- Current proficiency: {bps_level} — {level_desc}
- Learning intent: {intent_label}
- Personal goal: {goal}
- Timeline: {timeline_months} month(s){native_text}{weak_text}

Generate exactly {num_elements} ordered course topics for this learner.
Each topic should be a specific, self-contained lesson subject appropriate for generating
a Bahasa Melayu course (e.g. "Ordering food at a Malaysian restaurant",
"Numbers and counting in Malay", "Polite greetings and farewells").

Rules:
- Topics must be in English (they will be used as course generation prompts)
- Topics must be progressive — earlier topics build foundations for later ones
- Do NOT repeat similar topics
- Distribute estimated_weeks proportionally across the {timeline_months}-month timeline
  (total estimated_weeks must roughly equal {timeline_months * 4} weeks)
- description (1–2 sentences) explains what the learner will be able to do after completing it
- Prioritise the learner's weak areas early in the roadmap

Return ONLY valid JSON as an array — no markdown, no explanation, no wrapper object:
[
  {{
    "order": 1,
    "topic": "Course topic here",
    "description": "What the learner will achieve",
    "estimated_weeks": 2
  }},
  ...
]"""


# ── Validation ────────────────────────────────────────────────────────────────


def _validate_elements(data: object, expected_count: int) -> bool:
    """Basic structural validation of the Gemini-returned elements list."""
    if not isinstance(data, list) or len(data) == 0:
        return False
    for elem in data:
        if not isinstance(elem, dict):
            return False
        if not elem.get("topic") or not isinstance(elem.get("order"), int):
            return False
    return True


def _normalise_elements(raw: list[dict], expected_count: int) -> list[dict]:
    """Attach completion fields and cap to expected_count."""
    result = []
    for i, elem in enumerate(raw[:expected_count], start=1):
        result.append({
            "order":            i,
            "topic":            str(elem.get("topic", "")).strip(),
            "description":      str(elem.get("description", "")).strip(),
            "estimated_weeks":  int(elem.get("estimated_weeks", 1)),
            "completed":        False,
            "completed_at":     None,
        })
    return result


# ── Public API ─────────────────────────────────────────────────────────────────


async def generate_roadmap(
    user_id: UUID,
    intent: str,
    goal: str,
    timeline_months: int,
    db: AsyncSession,
    intent_other: str | None = None,
) -> "UserRoadmap":
    """
    Generate a new personalised course-obstacle roadmap using Gemini.

    Any existing ACTIVE roadmap for this user is soft-deleted first
    (status='deleted') so history is preserved.
    Returns the newly saved UserRoadmap ORM object.
    Raises RoadmapGenerationError if Gemini fails or returns invalid JSON.
    DB insert only occurs after a valid response is received.
    """
    # Soft-delete any existing active roadmap
    existing_result = await db.execute(
        select(UserRoadmap).where(
            UserRoadmap.user_id == user_id,
            UserRoadmap.status == "active",
        )
    )
    for old in existing_result.scalars().all():
        old.status = "deleted"
    await db.flush()

    ctx = await _fetch_user_context(user_id, db)
    num_elements = _ELEMENTS_PER_MONTH.get(timeline_months, 6)
    deadline = _deadline_from_months(timeline_months)

    logger.info(
        "Generating roadmap",
        user_id=str(user_id),
        intent=intent,
        timeline_months=timeline_months,
        num_elements=num_elements,
        bps_level=ctx["bps_level"],
    )

    prompt = _build_generation_prompt(
        intent=intent,
        goal=goal,
        timeline_months=timeline_months,
        num_elements=num_elements,
        bps_level=ctx["bps_level"],
        weak_points=ctx["weak_points"],
        native_language=ctx["native_language"],
        intent_other=intent_other,
    )

    try:
        raw_data = await generate_json(prompt, max_retries=3)
    except Exception as exc:
        logger.error(
            "Gemini roadmap generation failed",
            user_id=str(user_id),
            error=str(exc),
        )
        raise RoadmapGenerationError(
            "We couldn't generate your roadmap right now. Please try again."
        ) from exc

    if not _validate_elements(raw_data, num_elements):
        logger.error(
            "Gemini returned invalid roadmap elements",
            user_id=str(user_id),
            data_type=type(raw_data).__name__,
        )
        raise RoadmapGenerationError(
            "We couldn't generate your roadmap right now. Please try again."
        )

    elements = _normalise_elements(raw_data, num_elements)

    roadmap = UserRoadmap(
        user_id=user_id,
        intent=intent,
        goal=goal,
        timeline_months=timeline_months,
        elements=elements,
        status="active",
        deadline=deadline,
        extended=False,
        bps_level_at_creation=ctx["bps_level"],
        banner_image_url=None,
    )
    db.add(roadmap)
    await db.commit()
    await db.refresh(roadmap)

    logger.info(
        "Roadmap saved",
        user_id=str(user_id),
        roadmap_id=str(roadmap.id),
        elements=len(elements),
        deadline=deadline.isoformat(),
    )

    # Clear cached roadmap so GET returns fresh data
    await cache_delete(_ROADMAP_CACHE_KEY.format(user_id))

    # Sync Journey goal to user profile so chatbot personalization uses the latest goal.
    # The onboarding learning_goal is a generic dropdown choice; the Journey goal is free
    # text and far more specific — always prefer the Journey goal for the chatbot prompt.
    try:
        user = await db.get(User, user_id)
        if user is not None:
            user.learning_goal = goal[:500]  # column is String(500)
            await db.commit()
    except Exception as exc:
        logger.warning(
            "Failed to sync learning_goal from Journey goal — chatbot personalization may be stale",
            user_id=str(user_id),
            error=str(exc),
        )

    # Generate banner image in background — does not block response
    roadmap_id_str = str(roadmap.id)
    asyncio.create_task(
        _generate_and_save_banner(
            roadmap_id=roadmap_id_str,
            intent=intent,
            timeline_months=timeline_months,
        )
    )

    return roadmap


async def _generate_and_save_banner(
    roadmap_id: str,
    intent: str,
    timeline_months: int,
) -> None:
    """Background task: generate and persist the roadmap banner image."""
    from backend.db.database import AsyncSessionLocal
    from backend.services.image_service import generate_journey_banner

    try:
        image_url = await generate_journey_banner(intent, timeline_months)
        if not image_url:
            return
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(UserRoadmap).where(UserRoadmap.id == roadmap_id)
            )
            roadmap = result.scalar_one_or_none()
            if roadmap and not roadmap.banner_image_url:
                roadmap.banner_image_url = image_url
                await db.commit()
                logger.info("Banner saved to user_roadmap", roadmap_id=roadmap_id)
    except Exception as exc:
        logger.error("Banner generation failed", roadmap_id=roadmap_id, error=str(exc))


async def get_roadmap(user_id: UUID, db: AsyncSession) -> dict | None:
    """
    Return the user's active (or overdue) roadmap enriched with flags.

    Side effects (idempotent):
      - Sets status='overdue' in DB if deadline passed and not all completed
      - Triggers halfway / 7-day notifications if conditions are met
      - Checks Redis for BPS upgrade flag

    Returns None if no active/overdue roadmap exists.
    Returns a dict with all fields needed by the frontend.
    """
    # Try cache first
    cached = await cache_get(_ROADMAP_CACHE_KEY.format(user_id))
    if cached:
        return cached

    result = await db.execute(
        select(UserRoadmap).where(
            UserRoadmap.user_id == user_id,
            UserRoadmap.status.in_(["active", "overdue"]),
        )
    )
    roadmap = result.scalar_one_or_none()

    if roadmap is None:
        # Check if there's a completed roadmap to show the completed state
        comp_result = await db.execute(
            select(UserRoadmap).where(
                UserRoadmap.user_id == user_id,
                UserRoadmap.status == "completed",
            ).order_by(UserRoadmap.created_at.desc()).limit(1)
        )
        roadmap = comp_result.scalar_one_or_none()
        if roadmap is None:
            return None

    today = datetime.now(timezone.utc).date()
    elements: list[dict] = roadmap.elements or []
    completed_count = sum(1 for e in elements if e.get("completed"))
    total_count = len(elements)
    all_done = completed_count == total_count

    # ── Overdue check ──────────────────────────────────────────────────────
    if roadmap.status == "active" and today > roadmap.deadline and not all_done:
        roadmap.status = "overdue"
        await db.commit()
        logger.info("Roadmap marked overdue", user_id=str(user_id), roadmap_id=str(roadmap.id))

    # ── Notification triggers (fire-and-forget, checked on every GET) ─────
    if roadmap.status in ("active", "overdue") and not all_done:
        asyncio.create_task(
            _check_and_send_timeline_notifications(
                user_id=user_id,
                roadmap=roadmap,
                completed_count=completed_count,
                total_count=total_count,
                today=today,
            )
        )

    # ── BPS upgrade flag ───────────────────────────────────────────────────
    bps_upgraded = bool(await cache_get(_BPS_UPGRADE_KEY.format(user_id)))

    days_remaining = max(0, (roadmap.deadline - today).days)

    data = {
        "id":                   str(roadmap.id),
        "intent":               roadmap.intent,
        "goal":                 roadmap.goal,
        "timeline_months":      roadmap.timeline_months,
        "elements":             elements,
        "status":               roadmap.status,
        "deadline":             roadmap.deadline.isoformat(),
        "extended":             roadmap.extended,
        "created_at":           roadmap.created_at.isoformat(),
        "completed_at":         roadmap.completed_at.isoformat() if roadmap.completed_at else None,
        "bps_level_at_creation": roadmap.bps_level_at_creation,
        "banner_image_url":     roadmap.banner_image_url,
        "completed_count":      completed_count,
        "total_count":          total_count,
        "bps_upgraded":         bps_upgraded,
        "days_remaining":       days_remaining,
    }

    # Only cache active/overdue roadmaps (not completed — completed state is final)
    if roadmap.status in ("active", "overdue"):
        await cache_set(_ROADMAP_CACHE_KEY.format(user_id), data, ttl=_ROADMAP_CACHE_TTL)

    return data


async def _check_and_send_timeline_notifications(
    user_id: UUID,
    roadmap: "UserRoadmap",
    completed_count: int,
    total_count: int,
    today: date,
) -> None:
    """
    Background task: send halfway and 7-day deadline notifications if conditions met.
    Uses its own DB session so it's safe after the request session closes.
    """
    from backend.db.database import AsyncSessionLocal
    from backend.services.gamification_service import create_notification_fire_and_forget

    try:
        # ── Halfway warning: 50% of timeline elapsed, <30% of elements done ──
        halfway_sent = await cache_get(_HALFWAY_NOTIF_KEY.format(user_id))
        if not halfway_sent:
            deadline = roadmap.deadline
            created = roadmap.created_at.date() if hasattr(roadmap.created_at, "date") else roadmap.created_at
            total_days = max(1, (deadline - created).days)
            elapsed_days = (today - created).days
            elapsed_pct = elapsed_days / total_days
            progress_pct = (completed_count / total_count) if total_count > 0 else 0

            if elapsed_pct >= 0.50 and progress_pct < 0.30:
                pct_int = round(progress_pct * 100)
                async with AsyncSessionLocal() as db:
                    await create_notification_fire_and_forget(
                        db=db,
                        user_id=user_id,
                        notification_type="journey_reminder",
                        message=(
                            f"You're halfway through your timeline but only {pct_int}% of your "
                            "journey is done. Time to pick up the pace! 💪"
                        ),
                    )
                await cache_set(_HALFWAY_NOTIF_KEY.format(user_id), True)

        # ── 7-day deadline warning ────────────────────────────────────────
        seven_day_sent = await cache_get(_7DAY_NOTIF_KEY.format(user_id))
        if not seven_day_sent:
            days_left = (roadmap.deadline - today).days
            remaining_elements = total_count - completed_count
            if 0 < days_left <= 7:
                async with AsyncSessionLocal() as db:
                    await create_notification_fire_and_forget(
                        db=db,
                        user_id=user_id,
                        notification_type="journey_reminder",
                        message=(
                            f"Your journey deadline is in {days_left} day(s)! "
                            f"You have {remaining_elements} obstacle(s) left. 🏁"
                        ),
                    )
                await cache_set(_7DAY_NOTIF_KEY.format(user_id), True)

    except Exception as exc:
        logger.error("Timeline notification check failed", user_id=str(user_id), error=str(exc))


async def check_roadmap_progress(
    user_id: UUID,
    completed_course_title: str,
    db: AsyncSession,
) -> None:
    """
    Called after a course is fully completed (all modules passed ≥ 70%).

    Fuzzy-matches the completed course title against roadmap element topics.
    If a match is found:
      - Marks the element as completed in the elements JSONB
      - Awards 100 bonus XP
      - Fires an obstacle-cleared notification
      - If ALL elements are now done: marks roadmap completed, awards bonus XP

    Always safe to call — never raises; all errors are logged.
    """
    try:
        result = await db.execute(
            select(UserRoadmap).where(
                UserRoadmap.user_id == user_id,
                UserRoadmap.status.in_(["active", "overdue"]),
            )
        )
        roadmap = result.scalar_one_or_none()
        if roadmap is None:
            return

        elements: list[dict] = list(roadmap.elements or [])
        match_idx = _fuzzy_match_element(completed_course_title, elements)
        if match_idx is None:
            logger.info(
                "No roadmap element matched course title",
                user_id=str(user_id),
                title=completed_course_title,
            )
            return

        # Sequential completion rule: all earlier elements must be done first
        matched_order = elements[match_idx].get("order", match_idx + 1)
        for prev_elem in elements[:match_idx]:
            if not prev_elem.get("completed"):
                logger.info(
                    "Roadmap: skipped marking element complete — previous elements not done",
                    order=matched_order,
                    user_id=str(user_id),
                )
                return

        # Mark element completed
        now_iso = datetime.now(timezone.utc).isoformat()
        elements[match_idx] = {
            **elements[match_idx],
            "completed":    True,
            "completed_at": now_iso,
        }
        roadmap.elements = elements
        await db.commit()

        logger.info(
            "Roadmap element marked complete",
            user_id=str(user_id),
            topic=elements[match_idx]["topic"],
        )

        # Award XP + update streak (wrapped separately so failure does not block roadmap progress)
        try:
            from backend.services.gamification_service import (
                create_notification_fire_and_forget,
                record_learning_activity,
            )
            await record_learning_activity(user_id=user_id, db=db, xp_amount=100)

            # Fire obstacle-cleared notification
            await create_notification_fire_and_forget(
                db=db,
                user_id=user_id,
                notification_type="journey_reminder",
                message=f"You cleared an obstacle! ✅ '{elements[match_idx]['topic']}' is done. Keep going!",
            )
        except Exception as gam_exc:
            logger.error(
                "Gamification/streak update failed after roadmap element completion",
                user_id=str(user_id),
                error=str(gam_exc),
            )

        # Check if all elements are now completed
        completed_count = sum(1 for e in elements if e.get("completed"))
        total_count = len(elements)
        if completed_count == total_count:
            today = datetime.now(timezone.utc).date()
            on_time = today <= roadmap.deadline
            roadmap.status = "completed"
            roadmap.completed_at = datetime.now(timezone.utc)
            await db.commit()

            try:
                from backend.services.gamification_service import (
                    create_notification_fire_and_forget,
                    record_learning_activity,
                )
                bonus_xp = 500 if on_time else 200
                await record_learning_activity(user_id=user_id, db=db, xp_amount=bonus_xp)

                msg = (
                    "You completed your entire journey! 🎉 Amazing work!"
                    if on_time else
                    "You completed your journey! Better late than never! 🎉"
                )
                await create_notification_fire_and_forget(
                    db=db,
                    user_id=user_id,
                    notification_type="journey_reminder",
                    message=msg,
                )
            except Exception as gam_exc:
                logger.error(
                    "Gamification update failed after full roadmap completion",
                    user_id=str(user_id),
                    error=str(gam_exc),
                )
            logger.info(
                "Roadmap fully completed",
                user_id=str(user_id),
                on_time=on_time,
            )

        # Invalidate roadmap cache
        await cache_delete(_ROADMAP_CACHE_KEY.format(user_id))

    except Exception as exc:
        logger.error(
            "check_roadmap_progress failed",
            user_id=str(user_id),
            course=completed_course_title,
            error=str(exc),
        )


def _fuzzy_match_element(course_title: str, elements: list[dict]) -> int | None:
    """
    Return the index of the best-matching uncompleted element topic, or None.

    Uses fuzzywuzzy.fuzz.token_sort_ratio (threshold ≥ 70) so that word order
    differences do not prevent a match (e.g. "Basic Malay Greetings" matches
    "Greetings Basic Malay").  If multiple elements score ≥ 70, picks the highest.
    """
    title_norm = course_title.lower().strip()
    best_score = 0
    best_idx: int | None = None

    for i, elem in enumerate(elements):
        if elem.get("completed"):
            continue  # skip already-completed elements
        topic_norm = str(elem.get("topic", "")).lower().strip()
        if not topic_norm:
            continue

        score = fuzz.token_sort_ratio(title_norm, topic_norm)
        logger.info(
            "Roadmap fuzzy match attempt",
            course=course_title,
            topic=elem["topic"],
            score=score,
        )
        if score > best_score:
            best_score = score
            best_idx = i

    return best_idx if best_score >= 70 else None


async def check_bps_change(
    user_id: UUID,
    old_bps: str,
    new_bps: str,
) -> None:
    """
    Called after adaptive quiz BPS recalculation.

    If the user's level increased by one full tier, set a Redis flag so the
    next GET /api/journey/roadmap call includes bps_upgraded=True.
    Safe to call even if there's no active roadmap.
    """
    try:
        old_order = _BPS_ORDER.get(old_bps, 0)
        new_order = _BPS_ORDER.get(new_bps, 0)
        if new_order > old_order:
            await cache_set(
                _BPS_UPGRADE_KEY.format(user_id),
                {"old_bps": old_bps, "new_bps": new_bps},
                ttl=_BPS_UPGRADE_TTL,
            )
            logger.info(
                "BPS upgrade flag set",
                user_id=str(user_id),
                old_bps=old_bps,
                new_bps=new_bps,
            )
    except Exception as exc:
        logger.error("check_bps_change failed", user_id=str(user_id), error=str(exc))


async def dismiss_bps_upgrade(user_id: UUID) -> None:
    """Clear the BPS upgrade Redis flag without any roadmap changes."""
    await cache_delete(_BPS_UPGRADE_KEY.format(user_id))


async def extend_deadline(
    user_id: UUID,
    extension_months: int,
    db: AsyncSession,
) -> dict:
    """
    Extend the roadmap deadline by extension_months (1–3).

    Only allowed once per roadmap (extended flag).
    Re-activates overdue roadmaps to 'active'.
    Returns updated roadmap dict.
    Raises ValueError on validation failure.
    """
    if not 1 <= extension_months <= 3:
        raise ValueError("extension_months must be between 1 and 3")

    result = await db.execute(
        select(UserRoadmap).where(
            UserRoadmap.user_id == user_id,
            UserRoadmap.status.in_(["active", "overdue"]),
        )
    )
    roadmap = result.scalar_one_or_none()
    if roadmap is None:
        raise ValueError("No active roadmap to extend.")
    if roadmap.extended:
        raise ValueError("You have already extended this journey once.")

    roadmap.deadline = roadmap.deadline + timedelta(days=extension_months * 30)
    roadmap.extended = True
    roadmap.status   = "active"  # re-activate if overdue
    await db.commit()

    # Invalidate cache
    await cache_delete(_ROADMAP_CACHE_KEY.format(user_id))

    logger.info(
        "Roadmap deadline extended",
        user_id=str(user_id),
        extension_months=extension_months,
        new_deadline=roadmap.deadline.isoformat(),
    )

    return await get_roadmap(user_id, db)


async def verify_and_delete(
    user_id: UUID,
    db: AsyncSession,
    password: str | None = None,
    oauth_confirmed: bool = False,
) -> None:
    """
    Verify user identity then soft-delete the active roadmap (status='deleted').

    Email accounts: password must be provided and must match.
    Google OAuth accounts: oauth_confirmed must be True.
    Raises ValueError on auth failure or if no roadmap exists.
    """
    import bcrypt

    # Load user to check provider + password
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if user is None:
        raise ValueError("User not found.")

    if user.provider == "google":
        if not oauth_confirmed:
            raise ValueError("Please confirm deletion via the confirmation dialog.")
    else:
        if not password:
            raise ValueError("Password is required to delete your roadmap.")
        if not user.password_hash:
            raise ValueError("Account has no password set.")
        pw_bytes = password.encode("utf-8")
        hash_bytes = user.password_hash.encode("utf-8") if isinstance(user.password_hash, str) else user.password_hash
        if not bcrypt.checkpw(pw_bytes, hash_bytes):
            raise ValueError("Incorrect password.")

    # Soft-delete active roadmap
    rm_result = await db.execute(
        select(UserRoadmap).where(
            UserRoadmap.user_id == user_id,
            UserRoadmap.status.in_(["active", "overdue"]),
        )
    )
    roadmap = rm_result.scalar_one_or_none()
    if roadmap is None:
        raise ValueError("No active roadmap to delete.")

    roadmap.status = "deleted"
    await db.commit()

    # Clear all journey-related cache keys
    await cache_delete(_ROADMAP_CACHE_KEY.format(user_id))
    await cache_delete(_BPS_UPGRADE_KEY.format(user_id))
    await cache_delete(_HALFWAY_NOTIF_KEY.format(user_id))
    await cache_delete(_7DAY_NOTIF_KEY.format(user_id))

    logger.info("Roadmap deleted", user_id=str(user_id), roadmap_id=str(roadmap.id))


async def regenerate_uncompleted(
    user_id: UUID,
    db: AsyncSession,
) -> dict:
    """
    Replace only the UNCOMPLETED elements with freshly generated ones.

    Keeps completed elements intact. Uses current BPS level + weak points.
    Clears the BPS upgrade Redis flag after success.
    Returns updated roadmap dict.
    Raises ValueError if no active roadmap or Gemini fails.
    """
    result = await db.execute(
        select(UserRoadmap).where(
            UserRoadmap.user_id == user_id,
            UserRoadmap.status.in_(["active", "overdue"]),
        )
    )
    roadmap = result.scalar_one_or_none()
    if roadmap is None:
        raise ValueError("No active roadmap to regenerate.")

    elements: list[dict] = list(roadmap.elements or [])
    completed_elements = [e for e in elements if e.get("completed")]
    pending_count = len(elements) - len(completed_elements)

    if pending_count == 0:
        raise ValueError("All elements are already completed — nothing to regenerate.")

    ctx = await _fetch_user_context(user_id, db)

    prompt = _build_generation_prompt(
        intent=roadmap.intent,
        goal=roadmap.goal,
        timeline_months=roadmap.timeline_months,
        num_elements=pending_count,
        bps_level=ctx["bps_level"],
        weak_points=ctx["weak_points"],
        native_language=ctx["native_language"],
    )

    raw_data = await generate_json(prompt, max_retries=3)
    if not _validate_elements(raw_data, pending_count):
        raise ValueError("AI returned invalid data — please try again.")

    new_pending = _normalise_elements(raw_data, pending_count)

    # Re-number: completed elements keep their order, new ones follow
    combined: list[dict] = []
    completed_iter = iter(completed_elements)
    pending_iter   = iter(new_pending)
    for i, elem in enumerate(elements, start=1):
        if elem.get("completed"):
            combined.append({**next(completed_iter), "order": i})
        else:
            new_elem = next(pending_iter)
            combined.append({**new_elem, "order": i})

    roadmap.elements = combined
    roadmap.bps_level_at_creation = ctx["bps_level"]
    await db.commit()

    await cache_delete(_ROADMAP_CACHE_KEY.format(user_id))
    await dismiss_bps_upgrade(user_id)

    logger.info(
        "Roadmap elements regenerated",
        user_id=str(user_id),
        pending_regenerated=pending_count,
    )

    return await get_roadmap(user_id, db)


async def get_roadmap_history(user_id: UUID, db: AsyncSession) -> list[dict]:
    """
    Return all completed or deleted roadmaps for the user, ordered newest first.

    Does NOT include the full elements JSONB array — summary only, to keep
    responses small.  Used by the Past Journeys section on the journey page.
    """
    result = await db.execute(
        select(UserRoadmap)
        .where(
            UserRoadmap.user_id == user_id,
            UserRoadmap.status.in_(["completed", "deleted"]),
        )
        .order_by(UserRoadmap.created_at.desc())
    )
    roadmaps = result.scalars().all()

    history = []
    for rm in roadmaps:
        elements: list[dict] = rm.elements or []
        total_elements = len(elements)
        completed_elements = sum(1 for e in elements if e.get("completed"))
        history.append({
            "id":                str(rm.id),
            "intent":            rm.intent,
            "goal":              rm.goal,
            "timeline_months":   rm.timeline_months,
            "deadline":          rm.deadline.isoformat(),
            "completed_at":      rm.completed_at.isoformat() if rm.completed_at else None,
            "status":            rm.status,
            "total_elements":    total_elements,
            "completed_elements": completed_elements,
            "created_at":        rm.created_at.isoformat(),
        })
    return history


async def get_all_roadmaps_admin(db: AsyncSession) -> list[dict]:
    """
    Admin-only: return all roadmaps (all users, all statuses) with user info.
    Excludes 'deleted' roadmaps by default (include via status filter).
    """
    rows = await db.execute(
        select(
            UserRoadmap,
            User.name.label("user_name"),
            User.email.label("user_email"),
        )
        .join(User, User.id == UserRoadmap.user_id)
        .where(UserRoadmap.status != "deleted")
        .order_by(UserRoadmap.created_at.desc())
    )

    result = []
    for row in rows.all():
        rm: UserRoadmap = row[0]
        elements: list[dict] = rm.elements or []
        completed_count = sum(1 for e in elements if e.get("completed"))
        result.append({
            "id":               str(rm.id),
            "user_id":          str(rm.user_id),
            "user_name":        row.user_name or "—",
            "user_email":       row.user_email or "—",
            "intent":           rm.intent,
            "goal":             rm.goal,
            "timeline_months":  rm.timeline_months,
            "status":           rm.status,
            "deadline":         rm.deadline.isoformat(),
            "extended":         rm.extended,
            "created_at":       rm.created_at.isoformat(),
            "completed_at":     rm.completed_at.isoformat() if rm.completed_at else None,
            "bps_level_at_creation": rm.bps_level_at_creation,
            "total_count":      len(elements),
            "completed_count":  completed_count,
            "elements":         elements,
        })

    return result
