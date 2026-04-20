"""
Progress Service

Aggregates user learning data for the dashboard endpoints.

Public functions:
  get_dashboard_summary(user_id, db)              — full summary, Redis-cached 5 min
  get_vocabulary_list(user_id, page, limit, db)   — paginated vocabulary
  get_grammar_list(user_id, page, limit, db)      — paginated grammar rules
  get_progress(user_id, db)                       — course progress breakdown
  get_weak_points(user_id, db)                    — weak points + recommendations
  get_quiz_history(user_id, page, limit, db)      — paginated quiz attempt history
"""

import json
import uuid
from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.course import Class, Course, Module
from backend.models.progress import GrammarLearned, UserProgress, VocabularyLearned, WeakPoint
from backend.models.quiz import ModuleQuizAttempt, StandaloneQuizAttempt
from backend.models.user import User
from backend.models.xp_log import XPLog
from backend.utils.cache import cache_delete, cache_get, cache_set
from backend.utils.logger import get_logger

logger = get_logger(__name__)

_SUMMARY_TTL = 300  # 5 minutes


# ── Cache helpers ──────────────────────────────────────────────────────────────


def _summary_cache_key(user_id: UUID) -> str:
    return f"dashboard:summary:{user_id}"


async def invalidate_dashboard_cache(user_id: UUID) -> None:
    """Invalidate the cached dashboard summary for a user (call after any write)."""
    await cache_delete(_summary_cache_key(user_id))


# ── Weak-point recommendation text ────────────────────────────────────────────


def _recommendation(topic: str, strength_score: float) -> str:
    """Return a short study recommendation based on strength score."""
    if strength_score < 0.3:
        return f'Critical — revisit "{topic}" in the adaptive quiz right away.'
    if strength_score < 0.6:
        return f'Needs work — practise "{topic}" with the adaptive quiz to build confidence.'
    return f'Almost there — a few more rounds on "{topic}" to fully master it.'


# ── Internal query helpers ─────────────────────────────────────────────────────


async def _fetch_vocabulary_rows(
    user_id: UUID,
    limit: int,
    offset: int,
    db: AsyncSession,
) -> list[dict]:
    """
    Fetch vocabulary rows with resolved source names.

    For source_type='course', LEFT JOINs classes → modules → courses to get
    the course title.  For 'chatbot' rows the source_name is 'AI Chatbot'.
    """
    stmt = (
        select(
            VocabularyLearned,
            Course.title.label("course_title"),
        )
        .outerjoin(
            Class,
            and_(
                VocabularyLearned.source_id == Class.id,
                VocabularyLearned.source_type == "course",
            ),
        )
        .outerjoin(Module, Class.module_id == Module.id)
        .outerjoin(Course, Module.course_id == Course.id)
        .where(VocabularyLearned.user_id == user_id)
        .order_by(VocabularyLearned.learned_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(stmt)
    rows = result.all()

    items: list[dict] = []
    for row in rows:
        vocab: VocabularyLearned = row[0]
        course_title: str | None = row[1]
        source_name = (
            "AI Chatbot" if vocab.source_type == "chatbot"
            else (course_title or "Unknown Course")
        )
        items.append({
            "id": str(vocab.id),
            "word": vocab.word,
            "meaning": vocab.meaning,
            "source_type": vocab.source_type,
            "source_name": source_name,
            "learned_at": vocab.learned_at.isoformat(),
        })
    return items


async def _fetch_grammar_rows(
    user_id: UUID,
    limit: int,
    offset: int,
    db: AsyncSession,
) -> list[dict]:
    """
    Fetch grammar rows with resolved source names (same join strategy as vocab).
    """
    stmt = (
        select(
            GrammarLearned,
            Course.title.label("course_title"),
        )
        .outerjoin(
            Class,
            and_(
                GrammarLearned.source_id == Class.id,
                GrammarLearned.source_type == "course",
            ),
        )
        .outerjoin(Module, Class.module_id == Module.id)
        .outerjoin(Course, Module.course_id == Course.id)
        .where(GrammarLearned.user_id == user_id)
        .order_by(GrammarLearned.learned_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(stmt)
    rows = result.all()

    items: list[dict] = []
    for row in rows:
        grammar: GrammarLearned = row[0]
        course_title: str | None = row[1]
        source_name = (
            "AI Chatbot" if grammar.source_type == "chatbot"
            else (course_title or "Unknown Course")
        )
        items.append({
            "id": str(grammar.id),
            "rule": grammar.rule,
            "example": grammar.example,
            "source_type": grammar.source_type,
            "source_name": source_name,
            "learned_at": grammar.learned_at.isoformat(),
        })
    return items


async def _fetch_quiz_history_all(
    user_id: UUID,
    db: AsyncSession,
) -> list[dict]:
    """
    Fetch all module + standalone quiz attempts for a user, sorted newest first.

    We fetch both sets into Python and sort there.  With ~20 concurrent users
    and at most a few hundred rows per user this is acceptable.
    """
    # Module quiz attempts (need module title via join)
    mq_result = await db.execute(
        select(ModuleQuizAttempt, Module.title.label("module_title"))
        .outerjoin(Module, ModuleQuizAttempt.module_id == Module.id)
        .where(ModuleQuizAttempt.user_id == user_id)
    )
    mq_rows = mq_result.all()

    # Standalone quiz attempts
    sq_result = await db.execute(
        select(StandaloneQuizAttempt).where(StandaloneQuizAttempt.user_id == user_id)
    )
    sq_rows = sq_result.scalars().all()

    combined: list[dict] = []

    for row in mq_rows:
        attempt: ModuleQuizAttempt = row[0]
        module_title: str | None = row[1]
        combined.append({
            "id": str(attempt.id),
            "quiz_type": "module",
            "module_title": module_title,
            "score": attempt.score,
            "score_percent": round(attempt.score * 100),
            "passed": attempt.score >= 0.70,
            "taken_at": attempt.taken_at.isoformat(),
        })

    for attempt in sq_rows:
        combined.append({
            "id": str(attempt.id),
            "quiz_type": "standalone",
            "module_title": None,
            "score": attempt.score,
            "score_percent": round(attempt.score * 100),
            "passed": attempt.score >= 0.70,
            "taken_at": attempt.taken_at.isoformat(),
        })

    combined.sort(key=lambda x: x["taken_at"], reverse=True)
    return combined


# ── Public API ─────────────────────────────────────────────────────────────────


async def get_dashboard_summary(user_id: UUID, db: AsyncSession) -> dict:
    """
    Build the full dashboard summary dict.

    Checks Redis first (5-minute TTL).  On miss, runs all DB aggregations
    and stores the result in cache.
    """
    cache_key = _summary_cache_key(user_id)
    cached = await cache_get(cache_key)
    if cached:
        logger.info("Dashboard summary served from cache", user_id=str(user_id))
        return cached

    # ── Round trip 1: user profile columns only (avoid loading full ORM object) ─
    user_result = await db.execute(
        select(User.proficiency_level, User.streak_count, User.xp_total)
        .where(User.id == user_id)
    )
    user_row = user_result.one_or_none()
    proficiency_level: str = user_row.proficiency_level if user_row else "BPS-1"
    streak_count: int = user_row.streak_count if user_row else 0
    xp_total: int = user_row.xp_total if user_row else 0

    # ── Round trip 2: all 7 aggregate counts in a single query ────────────────
    # PostgreSQL evaluates each scalar subquery in parallel under the hood,
    # and we avoid 7 separate network round-trips to the DB.
    counts_result = await db.execute(
        select(
            select(func.count(Course.id))
            .where(Course.user_id == user_id)
            .scalar_subquery()
            .label("courses_created"),
            select(func.count(UserProgress.id))
            .where(UserProgress.user_id == user_id, UserProgress.class_id.is_(None))
            .scalar_subquery()
            .label("modules_completed"),
            select(func.count(UserProgress.id))
            .where(UserProgress.user_id == user_id, UserProgress.class_id.isnot(None))
            .scalar_subquery()
            .label("classes_completed"),
            select(func.count(ModuleQuizAttempt.id))
            .where(ModuleQuizAttempt.user_id == user_id)
            .scalar_subquery()
            .label("mq_count"),
            select(func.count(StandaloneQuizAttempt.id))
            .where(StandaloneQuizAttempt.user_id == user_id)
            .scalar_subquery()
            .label("sq_count"),
            select(func.count(VocabularyLearned.id))
            .where(VocabularyLearned.user_id == user_id)
            .scalar_subquery()
            .label("vocab_count"),
            select(func.count(GrammarLearned.id))
            .where(GrammarLearned.user_id == user_id)
            .scalar_subquery()
            .label("grammar_count"),
        )
    )
    c = counts_result.one()
    courses_created: int = c.courses_created or 0
    modules_completed: int = c.modules_completed or 0
    classes_completed: int = c.classes_completed or 0
    quizzes_taken: int = (c.mq_count or 0) + (c.sq_count or 0)
    vocabulary_count: int = c.vocab_count or 0
    grammar_count: int = c.grammar_count or 0

    stats = {
        "courses_created": courses_created,
        "modules_completed": modules_completed,
        "classes_completed": classes_completed,
        "quizzes_taken": quizzes_taken,
        "vocabulary_count": vocabulary_count,
        "grammar_count": grammar_count,
        "proficiency_level": proficiency_level,
        "streak_count": streak_count,
        "xp_total": xp_total,
    }

    # ── Recent items ──────────────────────────────────────────────────────────
    recent_vocab = await _fetch_vocabulary_rows(user_id, limit=5, offset=0, db=db)
    recent_grammar = await _fetch_grammar_rows(user_id, limit=5, offset=0, db=db)

    # Top 3 weakest points
    wp_result = await db.execute(
        select(WeakPoint)
        .where(WeakPoint.user_id == user_id)
        .order_by(WeakPoint.strength_score.asc())
        .limit(3)
    )
    top_weak = [
        {
            "id": str(wp.id),
            "topic": wp.topic,
            "type": wp.type,
            "strength_score": wp.strength_score,
            "recommendation": _recommendation(wp.topic, wp.strength_score),
        }
        for wp in wp_result.scalars().all()
    ]

    all_quiz = await _fetch_quiz_history_all(user_id, db=db)
    recent_quiz = all_quiz[:5]

    summary = {
        "stats": stats,
        "recent_vocabulary": recent_vocab,
        "recent_grammar": recent_grammar,
        "top_weak_points": top_weak,
        "recent_quiz_history": recent_quiz,
    }

    await cache_set(cache_key, summary, ttl=_SUMMARY_TTL)
    logger.info(
        "Dashboard summary computed and cached",
        user_id=str(user_id),
        courses=courses_created,
        vocab=vocabulary_count,
    )
    return summary


async def get_vocabulary_list(
    user_id: UUID,
    page: int,
    limit: int,
    db: AsyncSession,
) -> dict:
    """Paginated vocabulary list with source names resolved."""
    offset = (page - 1) * limit

    total: int = (
        await db.execute(
            select(func.count(VocabularyLearned.id)).where(
                VocabularyLearned.user_id == user_id
            )
        )
    ).scalar() or 0

    items = await _fetch_vocabulary_rows(user_id, limit=limit, offset=offset, db=db)
    return {"items": items, "total": total, "page": page, "limit": limit}


async def get_grammar_list(
    user_id: UUID,
    page: int,
    limit: int,
    db: AsyncSession,
) -> dict:
    """Paginated grammar list with source names resolved."""
    offset = (page - 1) * limit

    total: int = (
        await db.execute(
            select(func.count(GrammarLearned.id)).where(
                GrammarLearned.user_id == user_id
            )
        )
    ).scalar() or 0

    items = await _fetch_grammar_rows(user_id, limit=limit, offset=offset, db=db)
    return {"items": items, "total": total, "page": page, "limit": limit}


async def get_progress(user_id: UUID, db: AsyncSession) -> dict:
    """
    Course-level progress breakdown and overall module completion stats.
    """
    from sqlalchemy.orm import selectinload

    courses_result = await db.execute(
        select(Course)
        .options(selectinload(Course.modules).selectinload(Module.classes))
        .where(Course.user_id == user_id)
        .order_by(Course.created_at.desc())
    )
    courses = courses_result.scalars().all()

    # Completed class IDs for this user
    done_cls_result = await db.execute(
        select(UserProgress.class_id).where(
            UserProgress.user_id == user_id,
            UserProgress.class_id.isnot(None),
        )
    )
    completed_class_ids = {str(r) for r in done_cls_result.scalars().all()}

    # Completed module IDs (class_id IS NULL rows mark whole-module completion)
    done_mod_result = await db.execute(
        select(UserProgress.module_id).where(
            UserProgress.user_id == user_id,
            UserProgress.class_id.is_(None),
        )
    )
    completed_module_ids = {str(r) for r in done_mod_result.scalars().all()}

    course_items: list[dict] = []
    total_modules = 0
    completed_modules = 0

    for course in courses:
        total_cls = sum(len(m.classes) for m in course.modules)
        completed_cls = sum(
            1
            for m in course.modules
            for c in m.classes
            if str(c.id) in completed_class_ids
        )
        progress_pct = round((completed_cls / total_cls * 100) if total_cls > 0 else 0.0, 1)

        total_modules += len(course.modules)
        completed_modules += sum(
            1 for m in course.modules if str(m.id) in completed_module_ids
        )

        course_items.append({
            "course_id": str(course.id),
            "course_title": course.title,
            "total_classes": total_cls,
            "completed_classes": completed_cls,
            "progress_percent": progress_pct,
        })

    return {
        "courses": course_items,
        "total_modules": total_modules,
        "completed_modules": completed_modules,
    }


async def get_weak_points(user_id: UUID, db: AsyncSession) -> dict:
    """All weak points ordered by strength_score ASC (weakest first)."""
    result = await db.execute(
        select(WeakPoint)
        .where(WeakPoint.user_id == user_id)
        .order_by(WeakPoint.strength_score.asc())
    )
    weak_points = result.scalars().all()

    items = [
        {
            "id": str(wp.id),
            "topic": wp.topic,
            "type": wp.type,
            "strength_score": wp.strength_score,
            "recommendation": _recommendation(wp.topic, wp.strength_score),
        }
        for wp in weak_points
    ]
    return {"weak_points": items, "total": len(items)}


async def get_quiz_history(
    user_id: UUID,
    page: int,
    limit: int,
    db: AsyncSession,
) -> dict:
    """Paginated quiz history (module + standalone) ordered by most recent first."""
    offset = (page - 1) * limit
    all_attempts = await _fetch_quiz_history_all(user_id, db=db)
    total = len(all_attempts)
    items = all_attempts[offset: offset + limit]
    return {"items": items, "total": total, "page": page, "limit": limit}


_LEADERBOARD_TTL = 300  # 5 minutes


def _make_initials(name: str) -> str:
    """Return up to 2 uppercase initials from a display name."""
    parts = (name or "?").split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    return name[:2].upper() if name else "?"


async def get_weekly_leaderboard(
    current_user_id: UUID,
    db: AsyncSession,
    limit: int = 10,
    include_email: bool = False,
) -> dict:
    """
    Return the top N users ranked by XP earned in the current ISO week
    (Monday 00:00 UTC → Sunday 23:59 UTC).

    The current user's rank is always included even when outside top-N so
    they can see where they stand.

    Result is cached in Redis for 5 minutes per ISO-week key so repeated
    dashboard loads don't hammer the DB.
    """
    today = datetime.now(timezone.utc).date()
    # ISO weekday: Monday=1 … Sunday=7
    week_start: date = today - timedelta(days=today.isoweekday() - 1)
    week_end: date = week_start + timedelta(days=6)
    iso_week = week_start.isoformat()

    cache_key = f"leaderboard:weekly:{iso_week}"
    cached = await cache_get(cache_key)
    if cached and not include_email:
        try:
            return json.loads(cached)
        except Exception:
            pass

    week_start_dt = datetime(week_start.year, week_start.month, week_start.day, tzinfo=timezone.utc)

    # Aggregate weekly XP per user
    xp_sub = (
        select(
            XPLog.user_id.label("user_id"),
            func.sum(XPLog.xp_amount).label("weekly_xp"),
        )
        .where(XPLog.created_at >= week_start_dt)
        .group_by(XPLog.user_id)
        .subquery()
    )

    # Join with users to get display info, order by weekly_xp desc
    stmt = (
        select(
            User.id,
            User.name,
            User.email,
            User.proficiency_level,
            User.streak_count,
            xp_sub.c.weekly_xp,
        )
        .join(xp_sub, User.id == xp_sub.c.user_id)
        .order_by(xp_sub.c.weekly_xp.desc())
        .limit(limit + 1)  # fetch one extra to detect >limit entries
    )
    rows = (await db.execute(stmt)).all()

    entries = []
    current_user_in_top = False
    for i, row in enumerate(rows[:limit]):
        is_me = str(row.id) == str(current_user_id)
        if is_me:
            current_user_in_top = True
        entry: dict = {
            "rank": i + 1,
            "name": row.name or "Unknown",
            "initials": _make_initials(row.name or ""),
            "weekly_xp": int(row.weekly_xp or 0),
            "bps_level": row.proficiency_level or "BPS-1",
            "streak_count": row.streak_count or 0,
            "is_current_user": is_me,
        }
        if include_email:
            entry["email"] = row.email
        entries.append(entry)

    # Determine current user's rank if outside top-N
    your_rank: int | None = None
    if current_user_in_top:
        your_rank = next(e["rank"] for e in entries if e["is_current_user"])
    else:
        # Count users with more XP than the current user this week
        count_stmt = (
            select(func.count())
            .select_from(xp_sub)
            .where(
                xp_sub.c.weekly_xp > (
                    select(func.coalesce(func.sum(XPLog.xp_amount), 0))
                    .where(
                        XPLog.user_id == current_user_id,
                        XPLog.created_at >= week_start_dt,
                    )
                    .scalar_subquery()
                )
            )
        )
        count_result = await db.execute(count_stmt)
        users_ahead = count_result.scalar() or 0
        # Only set a rank if the user actually earned some XP this week
        user_xp_stmt = select(func.coalesce(func.sum(XPLog.xp_amount), 0)).where(
            XPLog.user_id == current_user_id,
            XPLog.created_at >= week_start_dt,
        )
        user_weekly_xp = (await db.execute(user_xp_stmt)).scalar() or 0
        if user_weekly_xp > 0:
            your_rank = int(users_ahead) + 1

    result = {
        "entries": entries,
        "week_start": f"{week_start.strftime('%b')} {week_start.day}",
        "week_end": f"{week_end.strftime('%b')} {week_end.day}",
        "your_rank": your_rank,
    }

    # Cache only the non-admin view (no emails)
    if not include_email:
        await cache_set(cache_key, json.dumps(result), ttl=_LEADERBOARD_TTL)

    return result
