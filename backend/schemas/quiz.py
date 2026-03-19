"""
Quiz Schemas (Pydantic v2)

Request/response models for:
  - Module quiz endpoints (Phase 5)
  - Standalone adaptive quiz endpoints (Phase 6)
"""

from typing import Literal

from pydantic import BaseModel, Field


# ── Shared ─────────────────────────────────────────────────────────────────────


class QuizAnswerIn(BaseModel):
    """A single submitted answer from the user."""

    question_id: str
    answer: str = Field(default="", max_length=500)


class QuestionResult(BaseModel):
    """Per-question result returned in any quiz submission response."""

    question_id: str
    question: str
    your_answer: str
    correct_answer: str
    is_correct: bool
    explanation: str


# ── Module quiz (Phase 5) ─────────────────────────────────────────────────────


class ModuleQuizQuestionOut(BaseModel):
    """
    A single module quiz question sent to the frontend.
    correct_answer is intentionally NOT included — scoring is done server-side.
    """

    id: str
    type: Literal["mcq", "fill_in_blank"]
    question: str
    options: list[str] | None = None  # MCQ only; None for fill_in_blank


class ModuleQuizResponse(BaseModel):
    """Response for GET /courses/{course_id}/modules/{module_id}/quiz."""

    module_id: str
    module_title: str
    questions: list[ModuleQuizQuestionOut]
    already_passed: bool  # True if the user already passed this module's quiz


class ModuleQuizSubmitRequest(BaseModel):
    """Request body for POST /courses/{course_id}/modules/{module_id}/quiz."""

    answers: list[QuizAnswerIn]


class ModuleQuizResultResponse(BaseModel):
    """Response for POST /courses/{course_id}/modules/{module_id}/quiz."""

    score: float          # 0.0–1.0 normalised
    score_percent: int    # 0–100 for display
    passed: bool          # True if score >= 0.70
    correct_count: int
    total_questions: int
    question_results: list[QuestionResult]
    module_unlocked: bool  # True if the next module is now unlocked


# ── Standalone adaptive quiz (Phase 6) ────────────────────────────────────────


class StandaloneQuizQuestionOut(BaseModel):
    """
    A single standalone adaptive quiz question sent to the frontend.
    correct_answer is intentionally NOT included — scoring is done server-side.
    """

    id: str
    type: Literal["mcq", "fill_in_blank", "translation"]
    question: str
    options: list[str] | None = None  # MCQ only; None for fill_in_blank/translation


class StandaloneQuizResponse(BaseModel):
    """Response for GET /api/quiz/."""

    questions: list[StandaloneQuizQuestionOut]
    question_count: int


class StandaloneQuizSubmitRequest(BaseModel):
    """Request body for POST /api/quiz/submit."""

    answers: list[QuizAnswerIn]


class StandaloneQuizResultResponse(BaseModel):
    """Response for POST /api/quiz/submit."""

    score: float                    # 0.0–1.0 normalised
    score_percent: int              # 0–100 for display
    correct_count: int
    total_questions: int
    question_results: list[QuestionResult]
    new_proficiency_level: str      # CEFR: A1, A2, B1, B2
    previous_proficiency_level: str
    level_changed: bool             # True if CEFR level changed this attempt
