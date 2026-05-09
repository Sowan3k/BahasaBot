"""
Games Router

Endpoints for the Spelling Practice Game and Word Match Game.

  GET  /api/games/spelling/word           — fetch next word to spell
  POST /api/games/spelling/submit         — evaluate a spelling attempt
  POST /api/games/spelling/session        — save completed session score
  GET  /api/games/spelling/best           — get the user's personal-best score

  GET  /api/games/word-match/question     — fetch next MCQ question
  POST /api/games/word-match/submit       — evaluate a word-match answer
  POST /api/games/word-match/session      — save completed word-match session
  GET  /api/games/word-match/best         — get the user's word-match personal-best

All routes require a valid JWT (get_current_user dependency).
"""

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_db
from backend.middleware.auth_middleware import get_current_user
from backend.models.user import User
from backend.services.gamification_service import record_learning_activity
from backend.services.spelling_service import (
    evaluate_answer,
    get_next_word,
    get_personal_best,
    save_session_score,
)
from backend.services.word_match_service import (
    evaluate_word_match,
    get_word_match_best,
    get_word_match_question,
    save_word_match_session,
)
from backend.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()


# ── Pydantic schemas — Spelling ────────────────────────────────────────────────


class SpellingWordResponse(BaseModel):
    """The next word for the user to spell."""
    id: str
    word: str
    meaning: str
    ipa: str | None = None
    source_type: str


class SpellingSubmitRequest(BaseModel):
    """User's spelling attempt for a word."""
    vocab_id: str = Field(..., min_length=1, max_length=36)
    answer: str = Field(..., min_length=1, max_length=200)
    difficulty: Literal["easy", "medium", "hard"] = "medium"

    @field_validator("answer")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()


class SpellingSubmitResponse(BaseModel):
    """Result of a spelling evaluation."""
    correct: bool
    almost: bool
    correct_word: str
    ipa: str | None = None
    meaning: str
    xp_awarded: int


class SessionEndRequest(BaseModel):
    """Summary of a completed game session."""
    words_correct: int = Field(..., ge=0)
    words_attempted: int = Field(..., ge=0)


class PersonalBestResponse(BaseModel):
    """User's all-time best session for a given game."""
    best_correct: int
    best_attempted: int


# ── Pydantic schemas — Word Match ──────────────────────────────────────────────


class WordMatchQuestionResponse(BaseModel):
    """A Word Match MCQ question."""
    id: str
    word: str
    ipa: str | None = None
    options: list[str]
    correct_index: int


class WordMatchSubmitRequest(BaseModel):
    """User's answer to a Word Match question."""
    vocab_id: str = Field(..., min_length=1, max_length=36)
    selected_meaning: str = Field(..., min_length=1, max_length=500)
    difficulty: Literal["easy", "medium", "hard"] = "medium"

    @field_validator("selected_meaning")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()


class WordMatchSubmitResponse(BaseModel):
    """Result of a Word Match evaluation."""
    correct: bool
    correct_meaning: str
    xp_awarded: int


# ── Spelling route handlers ────────────────────────────────────────────────────


@router.get(
    "/spelling/word",
    response_model=SpellingWordResponse,
    summary="Get next spelling word",
)
async def get_spelling_word(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Return the next vocabulary word for the user to spell.

    Uses weighted random selection — words answered incorrectly earlier
    in the session have 3× the selection probability.

    Returns 404 if the user has fewer than 3 vocabulary words learned.
    """
    try:
        word = await get_next_word(user_id=current_user.id, db=db)
        if word is None:
            raise HTTPException(
                status_code=404,
                detail="No vocabulary yet. Complete a course class or chat with the AI Tutor to earn your first words!",
            )
        logger.info("Spelling word fetched", user_id=str(current_user.id), word=word["word"])
        return SpellingWordResponse(**word)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("get_spelling_word failed", user_id=str(current_user.id), error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to fetch spelling word")


@router.post(
    "/spelling/submit",
    response_model=SpellingSubmitResponse,
    summary="Submit a spelling attempt",
)
async def submit_spelling_answer(
    body: SpellingSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Evaluate the user's spelling attempt.

    - Exact match  → correct=True, almost=False, xp based on difficulty
    - Edit-dist 1  → correct=False, almost=True,  xp_awarded=0
    - Edit-dist ≥2 → correct=False, almost=False, xp_awarded=0

    XP is recorded via record_learning_activity() so the streak also updates.
    """
    try:
        result = await evaluate_answer(
            user_id=current_user.id,
            vocab_id=body.vocab_id,
            user_answer=body.answer,
            db=db,
            difficulty=body.difficulty,
        )

        if result.get("error"):
            raise HTTPException(status_code=404, detail=result["error"])

        if result["correct"] and result["xp_awarded"] > 0:
            try:
                await record_learning_activity(
                    user_id=current_user.id,
                    db=db,
                    xp_amount=result["xp_awarded"],
                    source="spelling_correct",
                )
            except Exception as xp_exc:
                logger.warning(
                    "XP award failed (non-blocking)",
                    user_id=str(current_user.id),
                    error=str(xp_exc),
                )

        logger.info(
            "Spelling answer submitted",
            user_id=str(current_user.id),
            correct=result["correct"],
            almost=result["almost"],
        )
        return SpellingSubmitResponse(**result)

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("submit_spelling_answer failed", user_id=str(current_user.id), error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to evaluate spelling answer")


@router.post(
    "/spelling/session",
    summary="Save completed spelling session score",
    status_code=200,
)
async def end_spelling_session(
    body: SessionEndRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Persist the final score for a completed spelling session.

    Only the better run per calendar day is kept.
    """
    try:
        await save_session_score(
            user_id=current_user.id,
            words_correct=body.words_correct,
            words_attempted=body.words_attempted,
            db=db,
        )
        return {"success": True}
    except Exception as exc:
        logger.error("end_spelling_session failed", user_id=str(current_user.id), error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to save session score")


@router.get(
    "/spelling/best",
    response_model=PersonalBestResponse,
    summary="Get spelling personal best",
)
async def get_spelling_best(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the user's all-time best spelling session (most words correct)."""
    try:
        best = await get_personal_best(user_id=current_user.id, db=db)
        return PersonalBestResponse(**best)
    except Exception as exc:
        logger.error("get_spelling_best failed", user_id=str(current_user.id), error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to fetch personal best")


# ── Word Match route handlers ──────────────────────────────────────────────────


@router.get(
    "/word-match/question",
    response_model=WordMatchQuestionResponse,
    summary="Get next Word Match question",
)
async def get_word_match_question_endpoint(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Return the next Word Match MCQ question for the user.

    Requires at least 4 vocabulary words to produce 3 unique-meaning distractors.
    Returns 404 if the user's vocabulary is too small.
    """
    try:
        question = await get_word_match_question(user_id=current_user.id, db=db)
        if question is None:
            raise HTTPException(
                status_code=404,
                detail="Need at least 4 vocabulary words. Complete a course class or chat with the AI Tutor first!",
            )
        logger.info("Word Match question fetched", user_id=str(current_user.id), word=question["word"])
        return WordMatchQuestionResponse(**question)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("get_word_match_question failed", user_id=str(current_user.id), error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to fetch Word Match question")


@router.post(
    "/word-match/submit",
    response_model=WordMatchSubmitResponse,
    summary="Submit a Word Match answer",
)
async def submit_word_match_answer(
    body: WordMatchSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Evaluate the user's Word Match answer.

    Correct selection awards XP based on difficulty and updates the streak.
    Wrong selection records the word for priority re-selection next question.
    """
    try:
        result = await evaluate_word_match(
            user_id=current_user.id,
            vocab_id=body.vocab_id,
            selected_meaning=body.selected_meaning,
            difficulty=body.difficulty,
            db=db,
        )

        if result.get("error"):
            raise HTTPException(status_code=404, detail=result["error"])

        if result["correct"] and result["xp_awarded"] > 0:
            try:
                await record_learning_activity(
                    user_id=current_user.id,
                    db=db,
                    xp_amount=result["xp_awarded"],
                    source="word_match_correct",
                )
            except Exception as xp_exc:
                logger.warning(
                    "XP award failed (non-blocking)",
                    user_id=str(current_user.id),
                    error=str(xp_exc),
                )

        logger.info(
            "Word Match answer submitted",
            user_id=str(current_user.id),
            correct=result["correct"],
        )
        return WordMatchSubmitResponse(**result)

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("submit_word_match_answer failed", user_id=str(current_user.id), error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to evaluate Word Match answer")


@router.post(
    "/word-match/session",
    summary="Save completed Word Match session score",
    status_code=200,
)
async def end_word_match_session(
    body: SessionEndRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Persist the final score for a completed Word Match session."""
    try:
        await save_word_match_session(
            user_id=current_user.id,
            words_correct=body.words_correct,
            words_attempted=body.words_attempted,
            db=db,
        )
        return {"success": True}
    except Exception as exc:
        logger.error("end_word_match_session failed", user_id=str(current_user.id), error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to save Word Match session score")


@router.get(
    "/word-match/best",
    response_model=PersonalBestResponse,
    summary="Get Word Match personal best",
)
async def get_word_match_best_endpoint(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the user's all-time best Word Match session (most words correct)."""
    try:
        best = await get_word_match_best(user_id=current_user.id, db=db)
        return PersonalBestResponse(**best)
    except Exception as exc:
        logger.error("get_word_match_best failed", user_id=str(current_user.id), error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to fetch Word Match personal best")
