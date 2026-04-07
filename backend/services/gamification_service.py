"""
Gamification Service

Handles streak tracking, XP awards, and in-app notification creation.

Phase 17: create_notification() + create_notification_fire_and_forget()
Phase 18: record_learning_activity(), update_streak(), award_xp()

Streak logic (Redis-backed, date-keyed):
  - Redis key: gamif:streak:<user_id>  →  ISO date string of last activity
  - Same day  → no-op (already counted)
  - Yesterday → streak += 1
  - Older / missing → streak resets to 1

Milestone triggers:
  - Streak: 3, 7, 14, 30 days → streak_milestone notification
  - XP:     every 100 XP boundary crossed → xp_milestone notification
"""

import uuid
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.notification import Notification
from backend.models.user import User
from backend.utils.cache import cache_get, cache_set
from backend.utils.logger import get_logger

logger = get_logger(__name__)

# Redis key template for last-activity date
_STREAK_KEY = "gamif:streak:{}"
# TTL 48 h is enough: key survives one day, checked the next
_STREAK_KEY_TTL = 48 * 3600

_STREAK_MILESTONES = {3, 7, 14, 30}
_XP_MILESTONE_INTERVAL = 100


# ── Notification helpers ───────────────────────────────────────────────────────


async def create_notification(
    db: AsyncSession,
    user_id: uuid.UUID,
    notification_type: str,
    message: str,
) -> Notification:
    """
    Insert a new notification row for a user.

    Args:
        db:                 Async DB session.
        user_id:            Target user's UUID.
        notification_type:  Category string (e.g. 'streak_milestone', 'xp_milestone').
        message:            Human-readable text shown in the notification panel.

    Returns:
        The newly created Notification ORM instance.
    """
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        message=message,
        read=False,
        created_at=datetime.now(timezone.utc),
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)

    logger.info(
        "Notification created",
        user_id=str(user_id),
        type=notification_type,
    )
    return notification


async def create_notification_fire_and_forget(
    db: AsyncSession,
    user_id: uuid.UUID,
    notification_type: str,
    message: str,
) -> None:
    """
    Non-blocking wrapper around create_notification().
    Catches all exceptions so it never disrupts the calling request.

    Use this when you want to fire a notification without caring about failure
    (e.g. inside a course completion handler or quiz submission handler).
    """
    try:
        await create_notification(db, user_id, notification_type, message)
    except Exception as exc:
        logger.error(
            "Failed to create notification (non-blocking)",
            user_id=str(user_id),
            type=notification_type,
            error=str(exc),
        )


# ── Gamification core ──────────────────────────────────────────────────────────


async def record_learning_activity(
    user_id: uuid.UUID,
    db: AsyncSession,
    xp_amount: int,
) -> None:
    """
    Record a learning activity: update the daily streak and award XP.

    This function is always called fire-and-forget (wrapped in try/except
    at the call site) so it must never raise; all exceptions are caught
    internally and logged.

    Streak deduplication:
      Uses Redis key gamif:streak:<user_id> to store the ISO date of the
      last streak update.  The first activity on a new calendar day is the
      only one that increments the streak.

    XP:
      xp_amount is added unconditionally (each call represents a distinct
      activity — the caller is responsible for passing 0 when appropriate,
      e.g. chatbot continuation messages).

    Args:
        user_id:   UUID of the authenticated user.
        db:        Async DB session (request-scoped).
        xp_amount: XP to award this activity.  Pass 0 to only update streak.
    """
    try:
        today_str = date.today().isoformat()
        streak_key = _STREAK_KEY.format(user_id)

        last_date_str: str | None = await cache_get(streak_key)
        streak_already_updated_today = last_date_str == today_str

        # ── Load user ──────────────────────────────────────────────────────
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            logger.warning("record_learning_activity: user not found", user_id=str(user_id))
            return

        old_streak = user.streak_count
        old_xp = user.xp_total
        new_streak = old_streak
        new_xp = old_xp + xp_amount

        # ── Update streak (once per calendar day) ─────────────────────────
        if not streak_already_updated_today:
            yesterday_str = (date.today() - timedelta(days=1)).isoformat()
            if last_date_str == yesterday_str:
                new_streak = old_streak + 1  # continued streak
            else:
                new_streak = 1  # first activity ever, or streak broken

            await cache_set(streak_key, today_str, ttl=_STREAK_KEY_TTL)

        # ── Persist updated values ─────────────────────────────────────────
        changed = (new_streak != old_streak) or (new_xp != old_xp)
        if changed:
            user.streak_count = new_streak
            user.xp_total = new_xp
            await db.commit()

        # ── Milestone notifications (fire-and-forget) ──────────────────────
        if not streak_already_updated_today and new_streak in _STREAK_MILESTONES and new_streak > old_streak:
            await create_notification_fire_and_forget(
                db=db,
                user_id=user_id,
                notification_type="streak_milestone",
                message=f"You're on a {new_streak}-day streak! Keep learning every day.",
            )

        if xp_amount > 0 and old_xp // _XP_MILESTONE_INTERVAL < new_xp // _XP_MILESTONE_INTERVAL:
            milestone_xp = (new_xp // _XP_MILESTONE_INTERVAL) * _XP_MILESTONE_INTERVAL
            await create_notification_fire_and_forget(
                db=db,
                user_id=user_id,
                notification_type="xp_milestone",
                message=f"You've reached {milestone_xp} XP! Great progress.",
            )

        logger.info(
            "Learning activity recorded",
            user_id=str(user_id),
            xp_awarded=xp_amount,
            new_streak=new_streak,
            new_xp=new_xp,
        )

    except Exception as exc:
        logger.error(
            "record_learning_activity failed",
            user_id=str(user_id),
            xp_amount=xp_amount,
            error=str(exc),
        )
