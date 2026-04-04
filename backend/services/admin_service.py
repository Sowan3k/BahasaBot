"""
Admin Service — admin_service.py

Provides data-fetching functions for the admin control panel.
All functions are called from backend/routers/admin.py.

Functions:
  get_stats()              — aggregate system stats (users, courses, quiz pass rate, feedback)
  get_all_users()          — paginated list of all users
  get_feedback_responses() — paginated evaluation feedback with user name + email
  deactivate_user()        — set user.is_active = False
"""

import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.course import Course
from backend.models.evaluation import EvaluationFeedback
from backend.models.quiz import ModuleQuizAttempt, StandaloneQuizAttempt
from backend.models.user import User
from backend.utils.logger import get_logger

logger = get_logger(__name__)


# ── Stats ─────────────────────────────────────────────────────────────────────


async def get_stats(db: AsyncSession) -> dict:
    """Return aggregate system metrics for the admin overview dashboard."""
    total_users = await db.scalar(select(func.count()).select_from(User))
    active_users = await db.scalar(
        select(func.count()).select_from(User).where(User.is_active == True)  # noqa: E712
    )
    total_courses = await db.scalar(select(func.count()).select_from(Course))
    feedback_count = await db.scalar(
        select(func.count()).select_from(EvaluationFeedback)
    )

    # Quiz pass rate: attempts with score >= 0.70 across both quiz types
    module_total = await db.scalar(
        select(func.count()).select_from(ModuleQuizAttempt)
    )
    module_passed = await db.scalar(
        select(func.count())
        .select_from(ModuleQuizAttempt)
        .where(ModuleQuizAttempt.score >= 0.70)
    )
    standalone_total = await db.scalar(
        select(func.count()).select_from(StandaloneQuizAttempt)
    )
    standalone_passed = await db.scalar(
        select(func.count())
        .select_from(StandaloneQuizAttempt)
        .where(StandaloneQuizAttempt.score >= 0.70)
    )

    total_attempts = (module_total or 0) + (standalone_total or 0)
    total_passed = (module_passed or 0) + (standalone_passed or 0)
    pass_rate = round((total_passed / total_attempts) * 100, 1) if total_attempts > 0 else 0.0

    # Average feedback rating (1–5)
    avg_rating = await db.scalar(
        select(func.avg(EvaluationFeedback.rating)).select_from(EvaluationFeedback)
    )

    return {
        "total_users": total_users or 0,
        "active_users": active_users or 0,
        "total_courses_generated": total_courses or 0,
        "total_quiz_attempts": total_attempts,
        "quiz_pass_rate": pass_rate,
        "feedback_count": feedback_count or 0,
        "avg_feedback_rating": round(float(avg_rating), 2) if avg_rating else None,
    }


# ── Users ─────────────────────────────────────────────────────────────────────


async def get_all_users(db: AsyncSession, page: int, limit: int) -> dict:
    """
    Return a paginated list of all users for the admin user management table.

    Fields returned: id, name, email, proficiency_level, role, is_active,
                     streak_count, xp_total, created_at
    """
    offset = (page - 1) * limit

    total = await db.scalar(select(func.count()).select_from(User))

    result = await db.execute(
        select(User)
        .order_by(User.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    users = result.scalars().all()

    items = [
        {
            "id": str(u.id),
            "name": u.name,
            "email": u.email,
            "proficiency_level": u.proficiency_level,
            "role": u.role,
            "is_active": u.is_active,
            "streak_count": u.streak_count,
            "xp_total": u.xp_total,
            "provider": u.provider,
            "created_at": u.created_at.isoformat(),
        }
        for u in users
    ]

    return {"items": items, "total": total or 0, "page": page, "limit": limit}


# ── Feedback ──────────────────────────────────────────────────────────────────


async def get_feedback_responses(db: AsyncSession, page: int, limit: int) -> dict:
    """
    Return paginated evaluation feedback responses with the submitting user's name + email.

    Includes aggregate stats (average rating, response count) alongside the items.
    """
    offset = (page - 1) * limit

    total = await db.scalar(
        select(func.count()).select_from(EvaluationFeedback)
    )

    # Join feedback with users to surface name + email alongside each response
    result = await db.execute(
        select(EvaluationFeedback, User.name, User.email)
        .join(User, EvaluationFeedback.user_id == User.id)
        .order_by(EvaluationFeedback.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    rows = result.all()

    items = [
        {
            "id": str(fb.id),
            "user_id": str(fb.user_id),
            "user_name": name,
            "user_email": email,
            "quiz_type": fb.quiz_type,
            "rating": fb.rating,
            "weak_points_relevant": fb.weak_points_relevant,
            "comments": fb.comments,
            "created_at": fb.created_at.isoformat(),
        }
        for fb, name, email in rows
    ]

    # Aggregate stats for the admin overview panel header
    avg_rating = await db.scalar(
        select(func.avg(EvaluationFeedback.rating)).select_from(EvaluationFeedback)
    )
    rating_dist_result = await db.execute(
        select(EvaluationFeedback.rating, func.count().label("count"))
        .group_by(EvaluationFeedback.rating)
        .order_by(EvaluationFeedback.rating)
    )
    rating_distribution = {row.rating: row.count for row in rating_dist_result}

    return {
        "items": items,
        "total": total or 0,
        "page": page,
        "limit": limit,
        "avg_rating": round(float(avg_rating), 2) if avg_rating else None,
        "rating_distribution": rating_distribution,
    }


# ── Deactivate ────────────────────────────────────────────────────────────────


async def deactivate_user(db: AsyncSession, user_id: uuid.UUID) -> dict:
    """
    Set a user's is_active flag to False, preventing them from logging in.

    Returns the updated is_active state so the frontend can refresh the row.
    Raises ValueError if the user is not found.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise ValueError(f"User {user_id} not found")

    user.is_active = False
    db.add(user)

    try:
        await db.commit()
        logger.info("Admin deactivated user", user_id=str(user_id), email=user.email)
    except Exception as exc:
        await db.rollback()
        logger.error("Failed to deactivate user", user_id=str(user_id), error=str(exc))
        raise

    return {"id": str(user.id), "is_active": user.is_active}
