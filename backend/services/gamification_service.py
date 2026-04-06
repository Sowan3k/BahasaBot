"""
Gamification Service

Handles streak tracking, XP awards, and in-app notification creation.
Phase 17: create_notification() helper used by all milestone triggers.
Phase 18: update_streak() and award_xp() will be added here.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.notification import Notification
from backend.utils.logger import get_logger

logger = get_logger(__name__)


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
        notification_type:  Category string (e.g. 'streak_milestone', 'xp_milestone',
                            'course_complete', 'journey_reminder', 'phase_complete').
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
