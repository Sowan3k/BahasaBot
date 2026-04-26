"""
Admin Router — /api/admin/*

All endpoints require role = 'admin'. Non-admin users receive HTTP 403.

Endpoints:
  GET   /api/admin/stats                        — aggregate system stats
  GET   /api/admin/users                        — paginated + searchable user list
  GET   /api/admin/users/{user_id}              — full detail + stats for one user
  PATCH /api/admin/users/{user_id}/deactivate   — deactivate a user account
  DELETE /api/admin/users/{user_id}             — permanently delete user (admin password required)
  POST  /api/admin/users/{user_id}/reset        — clear learning data, reset BPS (admin password required)
  GET   /api/admin/feedback                     — paginated evaluation feedback
  GET   /api/admin/journeys                     — read-only list of all user roadmaps
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_db
from backend.middleware.auth_middleware import get_current_user
from backend.models.user import User
from backend.services import admin_service
from backend.utils.cache import cache_delete, cache_get, cache_set
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


# ── Request schemas ────────────────────────────────────────────────────────────


class AdminPasswordBody(BaseModel):
    """Request body for destructive admin actions that require password confirmation."""
    admin_password: str


# ── GET /api/admin/stats ───────────────────────────────────────────────────────


@router.get("/stats")
async def get_admin_stats(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Aggregate system metrics for the admin overview dashboard.

    Cached in Redis for 2 minutes (key: admin:stats) to avoid 8 sequential
    DB queries on every page load. Cache is invalidated automatically on TTL.
    """
    cached = await cache_get("admin:stats")
    if cached:
        return cached
    try:
        result = await admin_service.get_stats(db)
        await cache_set("admin:stats", result, ttl=120)
        return result
    except Exception as exc:
        logger.error("Failed to fetch admin stats", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to fetch stats")


# ── GET /api/admin/users ───────────────────────────────────────────────────────


@router.get("/users")
async def get_admin_users(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    search: str = Query(default="", description="Filter by name or email (case-insensitive)"),
    start_date: str | None = Query(default=None, description="Filter signup date from (ISO: 2026-01-01)"),
    end_date: str | None = Query(default=None, description="Filter signup date to (ISO: 2026-12-31)"),
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Paginated list of all registered users.

    Pass ?search=<query> to filter by name or email.
    Pass ?start_date=YYYY-MM-DD and/or ?end_date=YYYY-MM-DD to filter by signup date.
    Sorted by registration date (newest first).
    """
    try:
        return await admin_service.get_all_users(
            db, page=page, limit=limit, search=search,
            start_date=start_date, end_date=end_date,
        )
    except Exception as exc:
        logger.error("Failed to fetch admin users", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to fetch users")


# ── GET /api/admin/users/{user_id} ────────────────────────────────────────────


@router.get("/users/{user_id}")
async def get_user_detail(
    user_id: uuid.UUID,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Full profile + activity statistics for a single user.

    Includes: all profile fields, activity counts (courses, vocab, quiz attempts,
    chat sessions, weak points), and their 5 most recent courses.
    """
    try:
        return await admin_service.get_user_detail(db, user_id=user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error("Failed to fetch user detail", user_id=str(user_id), error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to fetch user detail")


# ── PATCH /api/admin/users/{user_id}/deactivate ────────────────────────────────


@router.patch("/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: uuid.UUID,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Set a user's is_active flag to False. Admins cannot deactivate their own account."""
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admins cannot deactivate their own account",
        )
    try:
        result = await admin_service.deactivate_user(db, user_id=user_id)
        logger.info("User deactivated by admin", target_user_id=str(user_id),
                    admin_id=str(current_admin.id))
        return result
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error("Failed to deactivate user", user_id=str(user_id), error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to deactivate user")


# ── DELETE /api/admin/users/{user_id} ─────────────────────────────────────────


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID,
    body: AdminPasswordBody,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    Permanently delete a user account and all associated data.

    Admin must supply their own password in the request body for confirmation.
    Returns 403 on wrong password, 404 if user not found, 204 on success.
    """
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admins cannot delete their own account",
        )
    try:
        await admin_service.delete_user(
            db, user_id=user_id,
            admin_user=current_admin,
            admin_password=body.admin_password,
        )
    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Incorrect admin password",
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error("Failed to delete user", user_id=str(user_id), error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to delete user")


# ── POST /api/admin/users/{user_id}/reset ─────────────────────────────────────


@router.post("/users/{user_id}/reset")
async def reset_user_data(
    user_id: uuid.UUID,
    body: AdminPasswordBody,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Clear all learning data for a user and reset BPS level to BPS-1.

    Keeps the account itself (email, name, password) intact.
    Admin must supply their own password in the request body for confirmation.
    Returns the updated user summary on success.
    """
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admins cannot reset their own data via this endpoint",
        )
    try:
        result = await admin_service.reset_user_data(
            db, user_id=user_id,
            admin_user=current_admin,
            admin_password=body.admin_password,
        )
        logger.info("Admin reset user data", target_id=str(user_id), admin_id=str(current_admin.id))
        return result
    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Incorrect admin password",
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error("Failed to reset user data", user_id=str(user_id), error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to reset user data")


# ── GET /api/admin/users/{user_id}/analytics ──────────────────────────────────


@router.get("/users/{user_id}/analytics")
async def get_user_analytics(
    user_id: uuid.UUID,
    days: int = Query(default=30, ge=7, le=90, description="Number of days to look back"),
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Token usage + activity timeline for a single user.

    Returns daily token consumption and daily activity event counts
    for the last `days` days (default 30, max 90), plus feature-level breakdowns.
    Used to render line/bar charts on the admin user detail page.
    """
    try:
        return await admin_service.get_user_analytics(db, user_id=user_id, days=days)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error("Failed to fetch user analytics", user_id=str(user_id), error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to fetch analytics")


# ── GET /api/admin/feedback ────────────────────────────────────────────────────


@router.get("/feedback")
async def get_admin_feedback(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Paginated evaluation feedback responses with user info and aggregate stats."""
    try:
        return await admin_service.get_feedback_responses(db, page=page, limit=limit)
    except Exception as exc:
        logger.error("Failed to fetch admin feedback", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to fetch feedback")


# ── GET /api/admin/journeys ────────────────────────────────────────────────────


@router.get("/journeys")
async def get_admin_journeys(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> list:
    """
    Read-only list of all user roadmaps (active, overdue, and completed).
    Deleted roadmaps are excluded.
    """
    try:
        from backend.services import journey_service
        return await journey_service.get_all_roadmaps_admin(db)
    except Exception as exc:
        logger.error("Failed to fetch admin journeys", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to fetch journeys")


# ── GET /api/admin/users/{user_id}/quiz-attempts ──────────────────────────────


@router.get("/users/{user_id}/quiz-attempts")
async def get_user_quiz_attempts(
    user_id: uuid.UUID,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> list:
    """Raw quiz attempt data (questions + answers) for a single user, newest first."""
    try:
        return await admin_service.get_quiz_attempts(db, user_id=user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error("Failed to fetch quiz attempts", user_id=str(user_id), error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to fetch quiz attempts")


# ── GET /api/admin/analytics/score-distribution ───────────────────────────────


@router.get("/analytics/score-distribution")
async def get_score_distribution(
    start_date: str | None = Query(default=None, description="Filter from (ISO: 2026-01-01)"),
    end_date: str | None = Query(default=None, description="Filter to (ISO: 2026-12-31)"),
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Cohort-wide quiz score distribution across both attempt tables, in 10-point buckets."""
    try:
        return await admin_service.get_score_distribution(db, start_date=start_date, end_date=end_date)
    except Exception as exc:
        logger.error("Failed to fetch score distribution", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to fetch score distribution")


# ── GET /api/admin/analytics/weak-points ──────────────────────────────────────


@router.get("/analytics/weak-points")
async def get_weak_points_distribution(
    start_date: str | None = Query(default=None, description="Filter from (ISO: 2026-01-01)"),
    end_date: str | None = Query(default=None, description="Filter to (ISO: 2026-12-31)"),
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Top 20 weak-point topics aggregated across all users, ordered by user count."""
    try:
        return await admin_service.get_weak_points_distribution(db, start_date=start_date, end_date=end_date)
    except Exception as exc:
        logger.error("Failed to fetch weak points distribution", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to fetch weak points distribution")


# ── GET /api/admin/leaderboard ────────────────────────────────────────────────


@router.get("/leaderboard")
async def get_admin_leaderboard(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Admin-only view of the weekly XP leaderboard.
    Includes email for each entry so admins can identify users.
    """
    try:
        from backend.services.progress_service import get_weekly_leaderboard
        data = await get_weekly_leaderboard(
            current_user_id=_admin.id,
            db=db,
            limit=50,
            include_email=True,
        )
        return data
    except Exception as exc:
        logger.error("Failed to fetch admin leaderboard", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to fetch leaderboard")
