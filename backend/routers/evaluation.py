"""
Evaluation Router — /api/evaluation/*

Endpoints for optional in-app feedback surveys collected after quiz completion.
Responses are stored in the evaluation_feedback table and surfaced in the admin panel.

Endpoints:
  POST /api/evaluation/feedback  — submit a survey response (auth required)
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_db
from backend.middleware.auth_middleware import get_current_user
from backend.models.evaluation import EvaluationFeedback
from backend.models.user import User
from backend.schemas.evaluation import FeedbackSubmitRequest, FeedbackSubmitResponse
from backend.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()


@router.post(
    "/feedback",
    response_model=FeedbackSubmitResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit optional quiz feedback",
)
async def submit_feedback(
    body: FeedbackSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FeedbackSubmitResponse:
    """Store a user's optional survey response after completing a quiz.

    The survey has three questions:
      1. Overall experience rating (1–5)
      2. Did the quiz reflect your weak areas? (yes/no/somewhat)
      3. Optional free-text comment (max 1000 chars)

    Returns 201 on success. Never fails silently — any DB error propagates so
    the frontend can retry or skip gracefully.
    """
    feedback = EvaluationFeedback(
        user_id=current_user.id,
        quiz_type=body.quiz_type,
        rating=body.rating,
        weak_points_relevant=body.weak_points_relevant,
        comments=body.comments,
    )
    db.add(feedback)
    await db.commit()

    logger.info(
        "evaluation_feedback_saved",
        user_id=str(current_user.id),
        quiz_type=body.quiz_type,
        rating=body.rating,
    )

    return FeedbackSubmitResponse(
        success=True,
        message="Thank you for your feedback!",
    )
