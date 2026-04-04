"""
Admin Router — /api/admin/*

All endpoints require role = 'admin'. Non-admin users receive HTTP 403.

Endpoints:
  GET   /api/admin/stats                     — aggregate system stats
  GET   /api/admin/users                     — paginated user list
  GET   /api/admin/feedback                  — paginated evaluation feedback
  PATCH /api/admin/users/{user_id}/deactivate — deactivate a user account
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_db
from backend.middleware.auth_middleware import get_current_user
from backend.models.user import User
from backend.services import admin_service
from backend.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()


# ── Admin guard dependency ─────────────────────────────────────────────────────


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    FastAPI dependency that ensures the requesting user has role='admin'.
    Raises HTTP 403 for any authenticated non-admin user.
    """
    if current_user.role != "admin":
        logger.warning(
            "Non-admin attempted admin endpoint",
            user_id=str(current_user.id),
            role=current_user.role,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


# ── GET /api/admin/stats ───────────────────────────────────────────────────────


@router.get("/stats")
async def get_admin_stats(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Return aggregate system metrics for the admin overview dashboard.

    Includes: user counts, course count, quiz pass rate, feedback count + avg rating.
    """
    try:
        stats = await admin_service.get_stats(db)
        return stats
    except Exception as exc:
        logger.error("Failed to fetch admin stats", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to fetch stats")


# ── GET /api/admin/users ───────────────────────────────────────────────────────


@router.get("/users")
async def get_admin_users(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Return a paginated list of all registered users.

    Sorted by registration date (newest first).
    Used for the admin user management table.
    """
    try:
        result = await admin_service.get_all_users(db, page=page, limit=limit)
        return result
    except Exception as exc:
        logger.error("Failed to fetch admin users", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to fetch users")


# ── PATCH /api/admin/users/{user_id}/deactivate ────────────────────────────────


@router.patch("/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: uuid.UUID,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Set a user's is_active flag to False, blocking their login.

    Admins cannot deactivate their own account.
    Returns {"id": ..., "is_active": false} on success.
    """
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admins cannot deactivate their own account",
        )

    try:
        result = await admin_service.deactivate_user(db, user_id=user_id)
        logger.info(
            "User deactivated by admin",
            target_user_id=str(user_id),
            admin_id=str(current_admin.id),
        )
        return result
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error("Failed to deactivate user", user_id=str(user_id), error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to deactivate user")


# ── GET /api/admin/feedback ────────────────────────────────────────────────────


@router.get("/feedback")
async def get_admin_feedback(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Return paginated evaluation feedback responses with user info and aggregate stats.

    Includes: per-response rows (user, rating, comments) and overall avg_rating +
    rating_distribution for the summary header.
    """
    try:
        result = await admin_service.get_feedback_responses(db, page=page, limit=limit)
        return result
    except Exception as exc:
        logger.error("Failed to fetch admin feedback", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to fetch feedback")
