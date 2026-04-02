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

from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.course import Class, Course, Module
from backend.models.progress import GrammarLearned, UserProgress, VocabularyLearned, WeakPoint
from backend.models.quiz import ModuleQuizAttempt, StandaloneQuizAttempt
from backend.models.user import User
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

    # ── User proficiency level ────────────────────────────────────────────────
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    proficiency_level: str = user.proficiency_level if user else "BPS-1"

    # ── Aggregate counts ──────────────────────────────────────────────────────
    courses_created: int = (
        await db.execute(select(func.count(Course.id)).where(Course.user_id == user_id))
    ).scalar() or 0

    modules_completed: int = (
        await db.execute(
            select(func.count(UserProgress.id)).where(
                UserProgress.user_id == user_id,
                UserProgress.class_id.is_(None),
            )
        )
    ).scalar() or 0

    classes_completed: int = (
        await db.execute(
            select(func.count(UserProgress.id)).where(
                UserProgress.user_id == user_id,
                UserProgress.class_id.isnot(None),
            )
        )
    ).scalar() or 0

    mq_count: int = (
        await db.execute(
            select(func.count(ModuleQuizAttempt.id)).where(
                ModuleQuizAttempt.user_id == user_id
            )
        )
    ).scalar() or 0
    sq_count: int = (
        await db.execute(
            select(func.count(StandaloneQuizAttempt.id)).where(
                StandaloneQuizAttempt.user_id == user_id
            )
        )
    ).scalar() or 0
    quizzes_taken = mq_count + sq_count

    vocabulary_count: int = (
        await db.execute(
            select(func.count(VocabularyLearned.id)).where(
                VocabularyLearned.user_id == user_id
            )
        )
    ).scalar() or 0

    grammar_count: int = (
        await db.execute(
            select(func.count(GrammarLearned.id)).where(
                GrammarLearned.user_id == user_id
            )
        )
    ).scalar() or 0

    stats = {
        "courses_created": courses_created,
        "modules_completed": modules_completed,
        "classes_completed": classes_completed,
        "quizzes_taken": quizzes_taken,
        "vocabulary_count": vocabulary_count,
        "grammar_count": grammar_count,
        "proficiency_level": proficiency_level,
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
