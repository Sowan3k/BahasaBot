"""
Journey Service — journey_service.py

Generates and manages the personalised learning roadmap for each user.

Public functions:
  generate_roadmap(user_id, deadline_date, goal_type, db)  — Gemini-powered roadmap generation
  get_active_roadmap(user_id, db)                          — fetch roadmap + completion status
  delete_roadmap(user_id, db)                              — delete current roadmap + completions
  complete_activity(user_id, activity_id, db)              — mark a single activity done
"""

import math
from datetime import date, datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.journey import LearningRoadmap, RoadmapActivityCompletion
from backend.models.progress import WeakPoint
from backend.models.user import User
from backend.services.gamification_service import create_notification_fire_and_forget
from backend.services.gemini_service import generate_json
from backend.utils.logger import get_logger

logger = get_logger(__name__)


# ── Phase-completion helpers ──────────────────────────────────────────────────


def _get_phase_activity_ids(roadmap_json: dict, activity_id: str) -> list[str]:
    """
    Return all activity IDs in the same phase as the given activity_id.
    Returns an empty list if the activity is not found.
    """
    for phase in roadmap_json.get("phases", []):
        for week in phase.get("weeks", []):
            for act in week.get("activities", []):
                if act.get("id") == activity_id:
                    # Found the phase — collect every activity ID within it
                    return [
                        a["id"]
                        for w in phase.get("weeks", [])
                        for a in w.get("activities", [])
                        if a.get("id")
                    ]
    return []


def _get_phase_title(roadmap_json: dict, activity_id: str) -> str:
    """Return the phase title for the phase containing activity_id."""
    for phase in roadmap_json.get("phases", []):
        for week in phase.get("weeks", []):
            for act in week.get("activities", []):
                if act.get("id") == activity_id:
                    return phase.get("title", f"Phase {phase.get('phase', '?')}")
    return "Phase"


# ── Goal-type display labels ──────────────────────────────────────────────────

_GOAL_LABELS = {
    "survival": "Survival Malay (greetings, shopping, transport, emergencies)",
    "conversational": "Conversational Malay (everyday topics, social interactions, work settings)",
    "academic": "Academic / Formal Malay (writing, presentations, official communication)",
}


# ── Internal helpers ──────────────────────────────────────────────────────────


async def _fetch_user_context(user_id: UUID, db: AsyncSession) -> dict:
    """Fetch BPS level, weak points, native language, and learning goal from DB."""
    result = await db.execute(
        select(
            User.proficiency_level,
            User.native_language,
            User.learning_goal,
        ).where(User.id == user_id)
    )
    row = result.one_or_none()
    bps_level = row.proficiency_level if row else "BPS-1"
    native_language = row.native_language if row else None
    learning_goal = row.learning_goal if row else None

    # Fetch top weak points (lowest strength score = highest priority)
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
        "native_language": native_language,
        "learning_goal": learning_goal,
        "weak_points": weak_points,
    }


def _total_weeks(deadline_date: date) -> int:
    """Return the number of weeks from today to the deadline (minimum 4)."""
    today = datetime.now(timezone.utc).date()
    delta_days = (deadline_date - today).days
    weeks = max(4, math.ceil(delta_days / 7))
    return weeks


def _build_roadmap_prompt(
    goal_type: str,
    total_weeks: int,
    bps_level: str,
    weak_points: list[dict],
    native_language: str | None,
    learning_goal: str | None,
) -> str:
    """Build the Gemini prompt for roadmap JSON generation."""
    goal_description = _GOAL_LABELS.get(goal_type, goal_type)

    # BPS level → plain English for the prompt
    bps_descriptions = {
        "BPS-1": "complete beginner (knows very little Malay)",
        "BPS-2": "elementary (knows basic greetings and simple phrases)",
        "BPS-3": "intermediate (can handle everyday conversations with some difficulty)",
        "BPS-4": "advanced (can discuss complex topics with near-fluency)",
    }
    level_desc = bps_descriptions.get(bps_level, "beginner")

    weak_points_text = ""
    if weak_points:
        items = [f"  - {wp['topic']} ({wp['type']}, strength {wp['strength']})" for wp in weak_points]
        weak_points_text = "\nIdentified weak areas that should be revisited:\n" + "\n".join(items)

    native_lang_text = ""
    if native_language:
        native_lang_text = (
            f"\nThe user's native language is {native_language}. "
            "Where helpful, suggest activities that draw on similarities or contrasts with that language."
        )

    goal_text = f" Their stated personal goal: {learning_goal}." if learning_goal else ""

    phases = max(1, round(total_weeks / 4))  # roughly 4 weeks per phase

    return f"""You are a Bahasa Melayu (Malaysian Malay) language learning expert.

Create a personalised learning roadmap for a student with the following profile:
- Current proficiency: {bps_level} — {level_desc}
- Learning goal: {goal_description}{goal_text}
- Available time: {total_weeks} weeks{native_lang_text}{weak_points_text}

Generate a structured JSON roadmap with exactly {phases} phase(s), spreading activities across all {total_weeks} weeks.
Each phase should have a clear thematic focus that builds on the previous one.
Each week should have 2–4 activities. Do not repeat the same topic across multiple weeks.

Activity rules:
- type "chatbot": The user practices with the AI tutor. topic = a specific conversation topic or grammar question.
- type "course": The user generates and studies a course. topic = a specific lesson topic (e.g. "ordering food at a restaurant").
- type "quiz": The user takes the adaptive quiz focusing on a specific area. topic = what area to review.

Each activity MUST have a unique id in the format "p{{phase}}_w{{week}}_a{{index}}" (e.g., "p1_w1_a1").
The "reason" field (1 sentence) must explain specifically why this activity helps this user at this stage.

Prioritise addressing the user's weak areas early.
Vary activity types each week — avoid three activities of the same type in a row.

Return ONLY valid JSON in exactly this structure:
{{
  "phases": [
    {{
      "phase": 1,
      "title": "Phase title",
      "duration_weeks": 4,
      "weeks": [
        {{
          "week": 1,
          "activities": [
            {{
              "id": "p1_w1_a1",
              "type": "chatbot",
              "title": "Activity title",
              "topic": "Specific topic",
              "reason": "Why this helps at this stage"
            }}
          ]
        }}
      ]
    }}
  ]
}}"""


def _validate_roadmap_json(data: dict) -> bool:
    """Basic structural validation of the Gemini-returned roadmap JSON."""
    if not isinstance(data, dict):
        return False
    phases = data.get("phases")
    if not isinstance(phases, list) or len(phases) == 0:
        return False
    for phase in phases:
        if not isinstance(phase.get("weeks"), list):
            return False
        for week in phase["weeks"]:
            if not isinstance(week.get("activities"), list):
                return False
            for act in week["activities"]:
                if not act.get("id") or not act.get("type") or not act.get("topic"):
                    return False
    return True


# ── Public API ─────────────────────────────────────────────────────────────────


async def generate_roadmap(
    user_id: UUID,
    deadline_date: date,
    goal_type: str,
    db: AsyncSession,
) -> LearningRoadmap:
    """
    Generate a new personalised learning roadmap for the user using Gemini.

    Deletes any existing roadmap first (one active roadmap per user).
    Saves the new roadmap to the learning_roadmaps table.
    Returns the saved LearningRoadmap ORM object.

    Raises RuntimeError if Gemini returns invalid JSON after retries.
    """
    # Delete any existing roadmap first
    existing = await db.execute(
        select(LearningRoadmap).where(LearningRoadmap.user_id == user_id)
    )
    for old_roadmap in existing.scalars().all():
        await db.delete(old_roadmap)
    await db.flush()

    # Fetch user context
    ctx = await _fetch_user_context(user_id, db)
    total_weeks = _total_weeks(deadline_date)

    logger.info(
        "Generating roadmap",
        user_id=str(user_id),
        goal_type=goal_type,
        total_weeks=total_weeks,
        bps_level=ctx["bps_level"],
    )

    prompt = _build_roadmap_prompt(
        goal_type=goal_type,
        total_weeks=total_weeks,
        bps_level=ctx["bps_level"],
        weak_points=ctx["weak_points"],
        native_language=ctx["native_language"],
        learning_goal=ctx["learning_goal"],
    )

    roadmap_data = await generate_json(prompt, max_retries=3)

    if not _validate_roadmap_json(roadmap_data):
        logger.error(
            "Gemini returned invalid roadmap JSON",
            user_id=str(user_id),
            data_keys=list(roadmap_data.keys()) if isinstance(roadmap_data, dict) else None,
        )
        raise RuntimeError("Roadmap generation failed — invalid JSON structure returned by AI.")

    # Create and persist roadmap
    roadmap = LearningRoadmap(
        user_id=user_id,
        deadline_date=deadline_date,
        goal_type=goal_type,
        roadmap_json=roadmap_data,
        banner_image_url=None,  # Phase 22 — image generation
    )
    db.add(roadmap)
    await db.commit()
    await db.refresh(roadmap)

    logger.info(
        "Roadmap saved",
        user_id=str(user_id),
        roadmap_id=str(roadmap.id),
        phases=len(roadmap_data.get("phases", [])),
    )
    return roadmap


async def get_active_roadmap(
    user_id: UUID,
    db: AsyncSession,
) -> dict | None:
    """
    Return the user's active roadmap with per-activity completion status.

    Returns None if the user has no roadmap.
    Returns a dict with: id, deadline_date, goal_type, roadmap_json, banner_image_url,
    created_at, completed_activity_ids, total_activities, completed_activities.
    """
    result = await db.execute(
        select(LearningRoadmap).where(LearningRoadmap.user_id == user_id)
    )
    roadmap = result.scalar_one_or_none()
    if roadmap is None:
        return None

    # Fetch all completed activity IDs for this user
    comp_result = await db.execute(
        select(RoadmapActivityCompletion.activity_id)
        .where(RoadmapActivityCompletion.user_id == user_id)
    )
    completed_ids = {row[0] for row in comp_result.fetchall()}

    # Count total activities across all phases/weeks
    total_activities = 0
    phases = roadmap.roadmap_json.get("phases", [])
    for phase in phases:
        for week in phase.get("weeks", []):
            total_activities += len(week.get("activities", []))

    return {
        "id": str(roadmap.id),
        "deadline_date": roadmap.deadline_date.isoformat(),
        "goal_type": roadmap.goal_type,
        "roadmap_json": roadmap.roadmap_json,
        "banner_image_url": roadmap.banner_image_url,
        "created_at": roadmap.created_at.isoformat(),
        "completed_activity_ids": list(completed_ids),
        "total_activities": total_activities,
        "completed_activities": len(completed_ids),
    }


async def delete_roadmap(user_id: UUID, db: AsyncSession) -> bool:
    """
    Delete the user's active roadmap and all associated activity completions.

    Returns True if a roadmap was deleted, False if none existed.
    """
    result = await db.execute(
        select(LearningRoadmap).where(LearningRoadmap.user_id == user_id)
    )
    roadmap = result.scalar_one_or_none()
    if roadmap is None:
        return False

    # The ON DELETE CASCADE on roadmap_activity_completions handles completion rows,
    # but we delete them explicitly for clarity.
    comp_result = await db.execute(
        select(RoadmapActivityCompletion).where(
            RoadmapActivityCompletion.user_id == user_id
        )
    )
    for comp in comp_result.scalars().all():
        await db.delete(comp)

    await db.delete(roadmap)
    await db.commit()
    logger.info("Roadmap deleted", user_id=str(user_id))
    return True


async def complete_activity(
    user_id: UUID,
    activity_id: str,
    db: AsyncSession,
) -> dict:
    """
    Mark an activity in the user's roadmap as completed.

    Idempotent — if already completed, returns success without creating a duplicate.
    Returns {"activity_id": ..., "completed": True}.
    Raises ValueError if the user has no active roadmap or the activity_id is not found in it.
    """
    # Verify roadmap exists and activity_id is valid
    result = await db.execute(
        select(LearningRoadmap).where(LearningRoadmap.user_id == user_id)
    )
    roadmap = result.scalar_one_or_none()
    if roadmap is None:
        raise ValueError("No active roadmap found for this user.")

    # Validate activity_id exists in roadmap JSON
    valid_ids: set[str] = set()
    for phase in roadmap.roadmap_json.get("phases", []):
        for week in phase.get("weeks", []):
            for act in week.get("activities", []):
                if act.get("id"):
                    valid_ids.add(act["id"])

    if activity_id not in valid_ids:
        raise ValueError(f"Activity '{activity_id}' not found in this roadmap.")

    # Idempotency — check if already completed
    existing_comp = await db.execute(
        select(RoadmapActivityCompletion).where(
            RoadmapActivityCompletion.user_id == user_id,
            RoadmapActivityCompletion.activity_id == activity_id,
        )
    )
    if existing_comp.scalar_one_or_none() is not None:
        return {"activity_id": activity_id, "completed": True, "already_completed": True}

    # Record completion
    completion = RoadmapActivityCompletion(
        user_id=user_id,
        activity_id=activity_id,
    )
    db.add(completion)
    await db.commit()

    logger.info("Activity completed", user_id=str(user_id), activity_id=activity_id)

    # Phase-completion check — fire notification if every activity in the phase is now done
    try:
        phase_ids = _get_phase_activity_ids(roadmap.roadmap_json, activity_id)
        if phase_ids:
            completed_count = await db.scalar(
                select(func.count())
                .select_from(RoadmapActivityCompletion)
                .where(
                    RoadmapActivityCompletion.user_id == user_id,
                    RoadmapActivityCompletion.activity_id.in_(phase_ids),
                )
            )
            if completed_count == len(phase_ids):
                phase_title = _get_phase_title(roadmap.roadmap_json, activity_id)
                await create_notification_fire_and_forget(
                    db=db,
                    user_id=user_id,
                    notification_type="phase_complete",
                    message=f"You completed the '{phase_title}' phase! Keep up the great work.",
                )
    except Exception as exc:
        logger.error(
            "Phase-completion notification failed",
            user_id=str(user_id),
            activity_id=activity_id,
            error=str(exc),
        )

    return {"activity_id": activity_id, "completed": True, "already_completed": False}
