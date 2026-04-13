"""
Notifications Router — /api/notifications/*

Endpoints for the in-app notification system (Phase 17).

Endpoints:
  GET  /api/notifications/            — List last 20 notifications for current user
  POST /api/notifications/{id}/read   — Mark a single notification as read
  POST /api/notifications/read-all    — Mark all notifications as read
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_db
from backend.middleware.auth_middleware import get_current_user
from backend.models.notification import Notification
from backend.models.user import User
from backend.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()


# ── Response schemas ──────────────────────────────────────────────────────────


class NotificationResponse(BaseModel):
    """Single notification item returned to the frontend."""

    id: str
    type: str
    message: str
    read: bool
    created_at: str
    # Optional image for visual notifications (e.g. BPS milestone card base64 data URL)
    image_url: str | None = None

    model_config = {"from_attributes": True}


class NotificationListResponse(BaseModel):
    """Response for GET /api/notifications/ — includes unread count for badge."""

    notifications: list[NotificationResponse]
    unread_count: int


class MarkReadResponse(BaseModel):
    """Confirmation that a notification was marked read."""

    id: str
    read: bool


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.get("/", response_model=NotificationListResponse)
async def get_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> NotificationListResponse:
    """
    Return the last 20 notifications for the authenticated user,
    ordered newest-first. Also returns unread_count for the badge.
    """
    try:
        result = await db.execute(
            select(Notification)
            .where(Notification.user_id == current_user.id)
            .order_by(Notification.created_at.desc())
            .limit(20)
        )
        notifications = result.scalars().all()

        unread_count = sum(1 for n in notifications if not n.read)

        items = [
            NotificationResponse(
                id=str(n.id),
                type=n.type,
                message=n.message,
                read=n.read,
                created_at=n.created_at.isoformat(),
                image_url=getattr(n, "image_url", None),
            )
            for n in notifications
        ]

        return NotificationListResponse(
            notifications=items,
            unread_count=unread_count,
        )

    except Exception as exc:
        logger.error(
            "Failed to fetch notifications",
            user_id=str(current_user.id),
            error=str(exc),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not fetch notifications",
        )


@router.post("/read-all", response_model=dict)
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Mark all notifications for the current user as read.
    Must be registered BEFORE the /{id}/read route to avoid
    FastAPI treating 'read-all' as an {id} path parameter.
    """
    try:
        await db.execute(
            update(Notification)
            .where(
                Notification.user_id == current_user.id,
                Notification.read == False,  # noqa: E712
            )
            .values(read=True)
        )
        await db.commit()

        logger.info("All notifications marked read", user_id=str(current_user.id))
        return {"success": True}

    except Exception as exc:
        logger.error(
            "Failed to mark all notifications read",
            user_id=str(current_user.id),
            error=str(exc),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not update notifications",
        )


@router.post("/{notification_id}/read", response_model=MarkReadResponse)
async def mark_notification_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MarkReadResponse:
    """
    Mark a single notification as read.
    Returns 404 if the notification does not belong to the current user.
    """
    try:
        result = await db.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.user_id == current_user.id,
            )
        )
        notification = result.scalar_one_or_none()

        if notification is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found",
            )

        notification.read = True
        await db.commit()
        await db.refresh(notification)

        logger.info(
            "Notification marked read",
            notification_id=str(notification_id),
            user_id=str(current_user.id),
        )
        return MarkReadResponse(id=str(notification.id), read=notification.read)

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(
            "Failed to mark notification read",
            notification_id=str(notification_id),
            user_id=str(current_user.id),
            error=str(exc),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not update notification",
        )
