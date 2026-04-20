"""
Games Router

Endpoints for the Spelling Practice Game.

  GET  /api/games/spelling/word      — fetch next word to spell
  POST /api/games/spelling/submit    — evaluate a spelling attempt
  POST /api/games/spelling/session   — save completed session score
  GET  /api/games/spelling/best      — get the user's personal-best score

All routes require a valid JWT (get_current_user dependency).
"""

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
from backend.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()


# ── Pydantic schemas ───────────────────────────────────────────────────────────


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
    """Summary of a completed spelling game session."""
    words_correct: int = Field(..., ge=0)
    words_attempted: int = Field(..., ge=0)


class PersonalBestResponse(BaseModel):
    """User's all-time best spelling session."""
    best_correct: int
    best_attempted: int


# ── Route handlers ─────────────────────────────────────────────────────────────


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

    Returns 404 if the user has fewer than 3 vocabulary words learned
    (prompt them to use the chatbot or complete a course class first).
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

    - Exact match  → correct=True, almost=False, xp_awarded=2
    - Edit-dist 1  → correct=False, almost=True,  xp_awarded=0  (gentle hint)
    - Edit-dist ≥2 → correct=False, almost=False, xp_awarded=0

    XP is recorded via record_learning_activity() so the streak also updates.
    """
    try:
        result = await evaluate_answer(
            user_id=current_user.id,
            vocab_id=body.vocab_id,
            user_answer=body.answer,
            db=db,
        )

        if result.get("error"):
            raise HTTPException(status_code=404, detail=result["error"])

        # Award XP + update streak for correct answers
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
    summary="Save completed session score",
    status_code=200,
)
async def end_spelling_session(
    body: SessionEndRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Persist the final score for a completed spelling session.

    Only the better run per calendar day is kept — if the user plays
    again today, only the session with more correct answers is retained.
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
    summary="Get personal best score",
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
