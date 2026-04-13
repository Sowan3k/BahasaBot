"""
Evaluation Feedback Schemas (Pydantic v2)

Request/response models for POST /api/evaluation/feedback.
"""

from typing import Literal

from pydantic import BaseModel, Field


class FeedbackSubmitRequest(BaseModel):
    """Survey response submitted by a user — after a quiz or from the Settings feedback form.

    quiz_type:
      'module'     — from a module quiz results page
      'standalone' — from the adaptive quiz results page
      'general'    — submitted directly from Settings > Feedback (not quiz-triggered)
    """

    quiz_type: Literal["module", "standalone", "general"] = Field(
        ..., description="Source of this feedback"
    )
    rating: int = Field(..., ge=1, le=5, description="Overall experience rating 1–5")
    weak_points_relevant: Literal["yes", "no", "somewhat"] = Field(
        ..., description="Did the content reflect the user's weak areas?"
    )
    comments: str | None = Field(
        default=None, max_length=1000, description="Optional free-text feedback"
    )


class FeedbackSubmitResponse(BaseModel):
    """Response returned after a feedback row is saved."""

    success: bool
    message: str
