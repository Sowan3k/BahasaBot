"""
Quiz Router — /api/quiz/*

Endpoints:
  GET  /api/quiz/        — get adaptive standalone quiz for current user
  POST /api/quiz/submit  — submit answers, receive score + proficiency update
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_db
from backend.middleware.auth_middleware import get_current_user
from backend.models.user import User
from backend.schemas.quiz import (
    StandaloneQuizResponse,
    StandaloneQuizSubmitRequest,
    StandaloneQuizResultResponse,
)
from backend.services.quiz_service import get_standalone_quiz, submit_standalone_quiz
from backend.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()


@router.get("/", response_model=StandaloneQuizResponse)
async def get_adaptive_quiz(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandaloneQuizResponse:
    """
    Get the adaptive standalone quiz for the current user.

    Returns 15 questions personalised to the user's weak points and learning history.
    Questions do NOT include correct_answer — scoring is server-side.
    If a cached quiz exists (within 30 minutes), it is returned directly.
    """
    try:
        result = await get_standalone_quiz(current_user.id, db)
        return StandaloneQuizResponse(**result)
    except RuntimeError as exc:
        logger.error(
            "Standalone quiz generation failed",
            user_id=str(current_user.id),
            error=str(exc),
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Quiz generation failed — AI service unavailable. Please try again shortly.",
        )
    except Exception as exc:
        logger.exception(
            "Unexpected error generating standalone quiz",
            user_id=str(current_user.id),
            error=str(exc),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load quiz. Please try again.",
        )


@router.post("/submit", response_model=StandaloneQuizResultResponse)
async def submit_adaptive_quiz(
    body: StandaloneQuizSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandaloneQuizResultResponse:
    """
    Submit answers for the adaptive standalone quiz.

    Scores each answer, updates weak_points, saves the attempt, and
    recalculates the user's CEFR proficiency level.

    Returns per-question results and the updated proficiency level.
    """
    if not body.answers:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No answers provided.",
        )

    user_answers = [{"question_id": a.question_id, "answer": a.answer} for a in body.answers]

    try:
        result = await submit_standalone_quiz(current_user.id, user_answers, db)
        return StandaloneQuizResultResponse(**result)
    except Exception as exc:
        logger.exception(
            "Unexpected error submitting standalone quiz",
            user_id=str(current_user.id),
            error=str(exc),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit quiz. Please try again.",
        )
