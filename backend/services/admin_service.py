"""
Admin Service — admin_service.py

Provides data-fetching functions for the admin control panel.
All functions are called from backend/routers/admin.py.

Functions:
  get_stats()              — aggregate system stats (users, courses, quiz pass rate, feedback)
  get_all_users()          — paginated + searchable list of all users
  get_user_detail()        — full profile + activity stats for one user
  get_feedback_responses() — paginated evaluation feedback with user name + email
  deactivate_user()        — set user.is_active = False
  delete_user()            — permanently delete user account (admin password required)
  reset_user_data()        — clear all learning data, reset BPS level (admin password required)
"""

import uuid

import bcrypt
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.analytics import ActivityLog, TokenUsageLog
from backend.models.chatbot import ChatSession
from backend.models.course import Course
from backend.models.evaluation import EvaluationFeedback
from backend.models.journey import UserRoadmap
from backend.models.notification import Notification
from backend.models.progress import GrammarLearned, UserProgress, VocabularyLearned, WeakPoint
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

    # Active learning roadmaps (Phase 20 v2 user_roadmaps)
    active_roadmaps = await db.scalar(
        select(func.count()).select_from(UserRoadmap).where(UserRoadmap.status == "active")
    )

    return {
        "total_users": total_users or 0,
        "active_users": active_users or 0,
        "total_courses_generated": total_courses or 0,
        "total_quiz_attempts": total_attempts,
        "quiz_pass_rate": pass_rate,
        "feedback_count": feedback_count or 0,
        "avg_feedback_rating": round(float(avg_rating), 2) if avg_rating else None,
        "active_roadmaps": active_roadmaps or 0,
    }


# ── Users ─────────────────────────────────────────────────────────────────────


async def get_all_users(db: AsyncSession, page: int, limit: int, search: str = "") -> dict:
    """
    Return a paginated list of all users for the admin user management table.

    Fields returned: id, name, email, proficiency_level, role, is_active,
                     streak_count, xp_total, created_at

    Optional search: filters by name OR email (case-insensitive ILIKE).
    """
    offset = (page - 1) * limit

    base_query = select(User)
    count_query = select(func.count()).select_from(User)

    if search.strip():
        pattern = f"%{search.strip()}%"
        filter_clause = or_(
            User.name.ilike(pattern),
            User.email.ilike(pattern),
        )
        base_query = base_query.where(filter_clause)
        count_query = count_query.where(filter_clause)

    total = await db.scalar(count_query)

    result = await db.execute(
        base_query
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


# ── User detail ───────────────────────────────────────────────────────────────


async def get_user_detail(db: AsyncSession, user_id: uuid.UUID) -> dict:
    """
    Return full profile + activity statistics for a single user.

    Raises ValueError if user not found.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise ValueError(f"User {user_id} not found")

    # Activity counts
    courses_count = await db.scalar(
        select(func.count()).select_from(Course).where(Course.user_id == user_id)
    )
    vocab_count = await db.scalar(
        select(func.count()).select_from(VocabularyLearned).where(VocabularyLearned.user_id == user_id)
    )
    grammar_count = await db.scalar(
        select(func.count()).select_from(GrammarLearned).where(GrammarLearned.user_id == user_id)
    )
    module_quiz_count = await db.scalar(
        select(func.count()).select_from(ModuleQuizAttempt).where(ModuleQuizAttempt.user_id == user_id)
    )
    standalone_quiz_count = await db.scalar(
        select(func.count()).select_from(StandaloneQuizAttempt).where(StandaloneQuizAttempt.user_id == user_id)
    )
    chat_session_count = await db.scalar(
        select(func.count()).select_from(ChatSession).where(ChatSession.user_id == user_id)
    )
    weak_points_count = await db.scalar(
        select(func.count()).select_from(WeakPoint).where(WeakPoint.user_id == user_id)
    )
    classes_completed = await db.scalar(
        select(func.count()).select_from(UserProgress)
        .where(UserProgress.user_id == user_id, UserProgress.class_id.isnot(None))
    )

    # Last 5 courses
    courses_result = await db.execute(
        select(Course.id, Course.title, Course.topic, Course.created_at)
        .where(Course.user_id == user_id)
        .order_by(Course.created_at.desc())
        .limit(5)
    )
    recent_courses = [
        {"id": str(r.id), "title": r.title, "topic": r.topic, "created_at": r.created_at.isoformat()}
        for r in courses_result.all()
    ]

    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "provider": user.provider,
        "is_active": user.is_active,
        "proficiency_level": user.proficiency_level,
        "native_language": user.native_language,
        "learning_goal": user.learning_goal,
        "profile_picture_url": user.profile_picture_url,
        "streak_count": user.streak_count,
        "xp_total": user.xp_total,
        "onboarding_completed": user.onboarding_completed,
        "created_at": user.created_at.isoformat(),
        "stats": {
            "courses_count": courses_count or 0,
            "classes_completed": classes_completed or 0,
            "vocab_count": vocab_count or 0,
            "grammar_count": grammar_count or 0,
            "module_quiz_attempts": module_quiz_count or 0,
            "standalone_quiz_attempts": standalone_quiz_count or 0,
            "chat_sessions": chat_session_count or 0,
            "weak_points": weak_points_count or 0,
        },
        "recent_courses": recent_courses,
    }


# ── Delete user ───────────────────────────────────────────────────────────────


async def delete_user(db: AsyncSession, user_id: uuid.UUID, admin_user: User, admin_password: str) -> None:
    """
    Permanently delete a user account and all associated data.

    Admin must supply their own password for confirmation.
    Raises PermissionError on wrong password, ValueError if target not found.
    All related rows are removed via CASCADE foreign keys.
    """
    # Verify admin password
    if admin_user.password_hash is None or not bcrypt.checkpw(
        admin_password.encode("utf-8"), admin_user.password_hash.encode("utf-8")
    ):
        raise PermissionError("Incorrect admin password")

    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if target is None:
        raise ValueError(f"User {user_id} not found")

    try:
        await db.delete(target)
        await db.commit()
        logger.info("Admin deleted user", target_id=str(user_id), email=target.email,
                    admin_id=str(admin_user.id))
    except Exception as exc:
        await db.rollback()
        logger.error("Failed to delete user", user_id=str(user_id), error=str(exc))
        raise


# ── Reset user learning data ──────────────────────────────────────────────────


async def reset_user_data(db: AsyncSession, user_id: uuid.UUID, admin_user: User, admin_password: str) -> dict:
    """
    Clear all learning data for a user and reset their BPS level to BPS-1.

    Keeps the user account (email, name, password) intact.
    Admin must supply their own password for confirmation.

    Clears:
      - courses (cascades to modules, classes, user_progress)
      - vocabulary_learned, grammar_learned, weak_points
      - module_quiz_attempts, standalone_quiz_attempts
      - chat_sessions (cascades to chat_messages)
      - user_roadmaps (v2 — all statuses)
      - notifications

    Resets user columns: proficiency_level, streak_count, xp_total.
    """
    # Verify admin password
    if admin_user.password_hash is None or not bcrypt.checkpw(
        admin_password.encode("utf-8"), admin_user.password_hash.encode("utf-8")
    ):
        raise PermissionError("Incorrect admin password")

    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if target is None:
        raise ValueError(f"User {user_id} not found")

    try:
        # Delete courses (cascades to modules → classes → user_progress)
        courses = await db.execute(select(Course).where(Course.user_id == user_id))
        for course in courses.scalars().all():
            await db.delete(course)

        # Delete vocab / grammar / weak points
        for model in (VocabularyLearned, GrammarLearned, WeakPoint):
            rows = await db.execute(select(model).where(model.user_id == user_id))
            for row in rows.scalars().all():
                await db.delete(row)

        # Delete quiz attempts
        for model in (ModuleQuizAttempt, StandaloneQuizAttempt):
            rows = await db.execute(select(model).where(model.user_id == user_id))
            for row in rows.scalars().all():
                await db.delete(row)

        # Delete chat sessions (cascades to chat_messages)
        sessions = await db.execute(select(ChatSession).where(ChatSession.user_id == user_id))
        for session in sessions.scalars().all():
            await db.delete(session)

        # Delete v2 roadmaps (all statuses: active, overdue, completed, deleted)
        roadmaps = await db.execute(select(UserRoadmap).where(UserRoadmap.user_id == user_id))
        for roadmap in roadmaps.scalars().all():
            await db.delete(roadmap)

        # Delete notifications
        notifs = await db.execute(select(Notification).where(Notification.user_id == user_id))
        for notif in notifs.scalars().all():
            await db.delete(notif)

        # Reset user profile columns
        target.proficiency_level = "BPS-1"
        target.streak_count = 0
        target.xp_total = 0
        db.add(target)

        await db.commit()
        logger.info("Admin reset user data", target_id=str(user_id), email=target.email,
                    admin_id=str(admin_user.id))
    except Exception as exc:
        await db.rollback()
        logger.error("Failed to reset user data", user_id=str(user_id), error=str(exc))
        raise

    return {
        "id": str(target.id),
        "email": target.email,
        "proficiency_level": target.proficiency_level,
        "streak_count": target.streak_count,
        "xp_total": target.xp_total,
    }


# ── User analytics ────────────────────────────────────────────────────────────


async def get_user_analytics(db: AsyncSession, user_id: uuid.UUID, days: int = 30) -> dict:
    """
    Return token usage + activity time data for a single user.

    Token usage:
      - total_input_tokens, total_output_tokens, total_tokens (all time)
      - by_feature: {feature: {input, output, total}} breakdown
      - daily_tokens: [{date, total_tokens}] for last `days` days (for line chart)

    Activity:
      - total_events: count of all activity_log rows
      - by_feature: {feature: count} breakdown
      - daily_activity: [{date, count}] for last `days` days (for bar chart)

    Raises ValueError if user not found.
    """
    from datetime import date, datetime, timedelta, timezone
    from sqlalchemy import cast, Date as DateType, text

    # Verify user exists
    result = await db.execute(select(User.id).where(User.id == user_id))
    if result.scalar_one_or_none() is None:
        raise ValueError(f"User {user_id} not found")

    # Use Python timedelta so asyncpg receives a proper datetime object
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    # ── Token usage totals ────────────────────────────────────────────────────
    tok_totals = await db.execute(
        select(
            func.coalesce(func.sum(TokenUsageLog.input_tokens), 0).label("input"),
            func.coalesce(func.sum(TokenUsageLog.output_tokens), 0).label("output"),
            func.coalesce(func.sum(TokenUsageLog.total_tokens), 0).label("total"),
        ).where(TokenUsageLog.user_id == user_id)
    )
    tok_row = tok_totals.one()

    # ── Token usage by feature ────────────────────────────────────────────────
    tok_by_feat = await db.execute(
        select(
            TokenUsageLog.feature,
            func.coalesce(func.sum(TokenUsageLog.input_tokens), 0).label("input"),
            func.coalesce(func.sum(TokenUsageLog.output_tokens), 0).label("output"),
            func.coalesce(func.sum(TokenUsageLog.total_tokens), 0).label("total"),
        )
        .where(TokenUsageLog.user_id == user_id)
        .group_by(TokenUsageLog.feature)
    )
    tokens_by_feature = {
        row.feature: {"input": row.input, "output": row.output, "total": row.total}
        for row in tok_by_feat.all()
    }

    # ── Daily token usage (last N days) ──────────────────────────────────────
    daily_tok = await db.execute(
        select(
            cast(TokenUsageLog.created_at, DateType).label("day"),
            func.coalesce(func.sum(TokenUsageLog.total_tokens), 0).label("total"),
        )
        .where(
            TokenUsageLog.user_id == user_id,
            TokenUsageLog.created_at >= cutoff,
        )
        .group_by(text("day"))
        .order_by(text("day"))
    )
    daily_tokens_raw = {str(row.day): int(row.total) for row in daily_tok.all()}

    # ── Activity totals ───────────────────────────────────────────────────────
    act_total = await db.scalar(
        select(func.count()).select_from(ActivityLog).where(ActivityLog.user_id == user_id)
    )

    # ── Activity by feature ───────────────────────────────────────────────────
    act_by_feat = await db.execute(
        select(ActivityLog.feature, func.count().label("count"))
        .where(ActivityLog.user_id == user_id)
        .group_by(ActivityLog.feature)
    )
    activity_by_feature = {row.feature: row.count for row in act_by_feat.all()}

    # ── Daily activity (last N days) ──────────────────────────────────────────
    daily_act = await db.execute(
        select(
            cast(ActivityLog.created_at, DateType).label("day"),
            func.count().label("count"),
        )
        .where(
            ActivityLog.user_id == user_id,
            ActivityLog.created_at >= cutoff,
        )
        .group_by(text("day"))
        .order_by(text("day"))
    )
    daily_activity_raw = {str(row.day): int(row.count) for row in daily_act.all()}

    # ── Fill missing days with zeros so charts have continuous x-axis ─────────
    today = date.today()
    daily_tokens: list[dict] = []
    daily_activity: list[dict] = []
    for i in range(days):
        d = str(today - timedelta(days=days - 1 - i))
        daily_tokens.append({"date": d, "tokens": daily_tokens_raw.get(d, 0)})
        daily_activity.append({"date": d, "events": daily_activity_raw.get(d, 0)})

    return {
        "token_usage": {
            "total_input_tokens": int(tok_row.input),
            "total_output_tokens": int(tok_row.output),
            "total_tokens": int(tok_row.total),
            "by_feature": tokens_by_feature,
            "daily": daily_tokens,
        },
        "activity": {
            "total_events": act_total or 0,
            "by_feature": activity_by_feature,
            "daily": daily_activity,
        },
    }
