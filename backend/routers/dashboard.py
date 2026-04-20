"""
Dashboard Router — /api/dashboard/*

Endpoints:
  GET /api/dashboard/             — full summary (Redis-cached 5 min)
  GET /api/dashboard/vocabulary   — paginated vocabulary list
  GET /api/dashboard/grammar      — paginated grammar list
  GET /api/dashboard/progress     — course progress breakdown
  GET /api/dashboard/weak-points  — weak points with recommendations
  GET /api/dashboard/quiz-history — paginated quiz history
"""

import uuid

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_db
from backend.middleware.auth_middleware import get_current_user
from backend.models.progress import VocabularyLearned
from backend.models.user import User
from backend.schemas.dashboard import (
    DashboardSummaryResponse,
    GrammarListResponse,
    LeaderboardResponse,
    ProgressResponse,
    QuizHistoryResponse,
    VocabularyListResponse,
    WeakPointsResponse,
)
from backend.services.progress_service import (
    get_dashboard_summary,
    get_grammar_list,
    get_progress,
    get_quiz_history,
    get_vocabulary_list,
    get_weak_points,
    get_weekly_leaderboard,
)
from backend.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()


@router.get("/", response_model=DashboardSummaryResponse)
async def dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DashboardSummaryResponse:
    """
    Return the full dashboard summary for the current user.

    Includes aggregate stats, last 5 vocabulary words, last 5 grammar rules,
    top 3 weak points, and last 5 quiz attempts.  Redis-cached for 5 minutes.
    """
    try:
        data = await get_dashboard_summary(current_user.id, db)
        # Always use fresh streak/XP from current_user (already a live DB read via
        # get_current_user) — the cached summary can lag behind the sidebar values.
        # Must update data["stats"] (the nested dict), not the top-level data dict.
        data["stats"]["streak_count"] = current_user.streak_count
        data["stats"]["xp_total"] = current_user.xp_total
        return DashboardSummaryResponse(**data)
    except Exception as exc:
        logger.exception(
            "Dashboard summary failed",
            user_id=str(current_user.id),
            error=str(exc),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load dashboard. Please try again.",
        )


@router.get("/vocabulary", response_model=VocabularyListResponse)
async def vocabulary_list(
    page: int = Query(default=1, ge=1, description="Page number (1-based)"),
    limit: int = Query(default=20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VocabularyListResponse:
    """
    Return a paginated list of all vocabulary words the user has learned,
    including the source (AI Chatbot or course name) and date learned.
    """
    try:
        data = await get_vocabulary_list(current_user.id, page=page, limit=limit, db=db)
        return VocabularyListResponse(**data)
    except Exception as exc:
        logger.exception(
            "Vocabulary list failed",
            user_id=str(current_user.id),
            error=str(exc),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load vocabulary list. Please try again.",
        )


@router.get("/grammar", response_model=GrammarListResponse)
async def grammar_list(
    page: int = Query(default=1, ge=1, description="Page number (1-based)"),
    limit: int = Query(default=20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GrammarListResponse:
    """
    Return a paginated list of all grammar rules the user has encountered,
    including the source (AI Chatbot or course name) and date learned.
    """
    try:
        data = await get_grammar_list(current_user.id, page=page, limit=limit, db=db)
        return GrammarListResponse(**data)
    except Exception as exc:
        logger.exception(
            "Grammar list failed",
            user_id=str(current_user.id),
            error=str(exc),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load grammar list. Please try again.",
        )


@router.get("/progress", response_model=ProgressResponse)
async def progress_breakdown(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProgressResponse:
    """
    Return course-level progress breakdown.

    For each course: total classes, completed classes, and percentage.
    Also returns overall module totals.
    """
    try:
        data = await get_progress(current_user.id, db)
        return ProgressResponse(**data)
    except Exception as exc:
        logger.exception(
            "Progress breakdown failed",
            user_id=str(current_user.id),
            error=str(exc),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load progress. Please try again.",
        )


@router.get("/weak-points", response_model=WeakPointsResponse)
async def weak_points(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> WeakPointsResponse:
    """
    Return all weak points for the user, sorted weakest-first.

    Each entry includes the topic, type (vocab/grammar), a 0–1 strength score,
    and a short study recommendation.
    """
    try:
        data = await get_weak_points(current_user.id, db)
        return WeakPointsResponse(**data)
    except Exception as exc:
        logger.exception(
            "Weak points failed",
            user_id=str(current_user.id),
            error=str(exc),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load weak points. Please try again.",
        )


@router.get("/quiz-history", response_model=QuizHistoryResponse)
async def quiz_history(
    page: int = Query(default=1, ge=1, description="Page number (1-based)"),
    limit: int = Query(default=20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> QuizHistoryResponse:
    """
    Return a paginated, combined history of all module and standalone quiz
    attempts, ordered most-recent first.
    """
    try:
        data = await get_quiz_history(current_user.id, page=page, limit=limit, db=db)
        return QuizHistoryResponse(**data)
    except Exception as exc:
        logger.exception(
            "Quiz history failed",
            user_id=str(current_user.id),
            error=str(exc),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load quiz history. Please try again.",
        )


@router.delete("/vocabulary", status_code=status.HTTP_200_OK)
async def delete_vocabulary(
    ids: list[uuid.UUID] = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Delete vocabulary entries by ID. Only deletes entries belonging to the current user.
    """
    if not ids:
        return {"deleted": 0}
    try:
        result = await db.execute(
            delete(VocabularyLearned).where(
                VocabularyLearned.id.in_(ids),
                VocabularyLearned.user_id == current_user.id,
            )
        )
        await db.commit()
        return {"deleted": result.rowcount}
    except Exception as exc:
        await db.rollback()
        logger.exception(
            "Delete vocabulary failed",
            user_id=str(current_user.id),
            error=str(exc),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete vocabulary. Please try again.",
        )


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LeaderboardResponse:
    """
    GET /api/dashboard/leaderboard

    Returns the top-10 users by XP earned in the current ISO week, plus the
    requesting user's own rank even when outside the top 10.

    Result is Redis-cached for 5 minutes.
    """
    try:
        data = await get_weekly_leaderboard(
            current_user_id=current_user.id,
            db=db,
        )
        return LeaderboardResponse(**data)
    except Exception as exc:
        logger.exception(
            "Leaderboard fetch failed",
            user_id=str(current_user.id),
            error=str(exc),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load leaderboard. Please try again.",
        )
