"""
Journey Router — journey.py

Handles learning roadmap generation, retrieval, deletion, and activity completion.

Endpoints:
  POST   /api/journey/                              — generate a new roadmap
  GET    /api/journey/                              — get active roadmap + completion status
  DELETE /api/journey/                              — delete current roadmap
  POST   /api/journey/activities/{activity_id}/complete — mark an activity as done
"""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_db
from backend.middleware.auth_middleware import get_current_user
from backend.models.user import User
from backend.services import journey_service
from backend.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()


# ── Pydantic schemas ──────────────────────────────────────────────────────────


class GenerateRoadmapRequest(BaseModel):
    """Request body for POST /api/journey/ — generate a new roadmap."""

    deadline_date: date
    goal_type: str  # 'survival' | 'conversational' | 'academic'

    @field_validator("goal_type")
    @classmethod
    def validate_goal_type(cls, v: str) -> str:
        allowed = {"survival", "conversational", "academic"}
        if v not in allowed:
            raise ValueError(f"goal_type must be one of {allowed}")
        return v

    @field_validator("deadline_date")
    @classmethod
    def validate_deadline(cls, v: date) -> date:
        today = date.today()
        if v <= today:
            raise ValueError("deadline_date must be in the future")
        # Maximum 2 years
        from datetime import timedelta
        if v > today + timedelta(days=730):
            raise ValueError("deadline_date cannot be more than 2 years from now")
        return v


class RoadmapResponse(BaseModel):
    """Response body for GET /api/journey/ — active roadmap with completion data."""

    id: str
    deadline_date: str
    goal_type: str
    roadmap_json: dict
    banner_image_url: str | None
    created_at: str
    completed_activity_ids: list[str]
    total_activities: int
    completed_activities: int


class ActivityCompleteResponse(BaseModel):
    """Response body for POST /api/journey/activities/{activity_id}/complete."""

    activity_id: str
    completed: bool
    already_completed: bool


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.post(
    "/",
    response_model=RoadmapResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a new personalised learning roadmap",
)
async def generate_roadmap(
    body: GenerateRoadmapRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RoadmapResponse:
    """
    Generate a new AI-powered learning roadmap for the authenticated user.

    Deletes any existing roadmap and replaces it.
    The roadmap is structured as phases → weeks → activities.
    Each activity links to an existing feature (course, quiz, or chatbot).
    """
    try:
        roadmap = await journey_service.generate_roadmap(
            user_id=current_user.id,
            deadline_date=body.deadline_date,
            goal_type=body.goal_type,
            db=db,
        )
    except RuntimeError as exc:
        logger.error(
            "Roadmap generation failed",
            user_id=str(current_user.id),
            error=str(exc),
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not generate roadmap — AI service is temporarily unavailable. Please try again.",
        )

    # Build completion data for newly created roadmap (no completions yet)
    total_activities = 0
    for phase in roadmap.roadmap_json.get("phases", []):
        for week in phase.get("weeks", []):
            total_activities += len(week.get("activities", []))

    return RoadmapResponse(
        id=str(roadmap.id),
        deadline_date=roadmap.deadline_date.isoformat(),
        goal_type=roadmap.goal_type,
        roadmap_json=roadmap.roadmap_json,
        banner_image_url=roadmap.banner_image_url,
        created_at=roadmap.created_at.isoformat(),
        completed_activity_ids=[],
        total_activities=total_activities,
        completed_activities=0,
    )


@router.get(
    "/",
    response_model=RoadmapResponse,
    summary="Get the user's active learning roadmap",
)
async def get_roadmap(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RoadmapResponse:
    """
    Return the user's active roadmap with per-activity completion status.

    Returns 404 if the user has not created a roadmap yet.
    """
    data = await journey_service.get_active_roadmap(
        user_id=current_user.id,
        db=db,
    )
    if data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active roadmap found. Create one to get started.",
        )
    return RoadmapResponse(**data)


@router.delete(
    "/",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete the user's current roadmap",
)
async def delete_roadmap(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    Delete the user's active roadmap and all associated activity completions.

    Returns 204 No Content on success, 404 if no roadmap exists.
    """
    deleted = await journey_service.delete_roadmap(
        user_id=current_user.id,
        db=db,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active roadmap to delete.",
        )


@router.post(
    "/activities/{activity_id}/complete",
    response_model=ActivityCompleteResponse,
    summary="Mark a roadmap activity as completed",
)
async def complete_activity(
    activity_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ActivityCompleteResponse:
    """
    Mark a specific activity in the user's roadmap as completed.

    Idempotent — calling this multiple times for the same activity is safe.
    Returns 404 if the user has no roadmap or the activity_id is not valid.
    """
    # Basic input validation on the activity_id format
    if not activity_id or len(activity_id) > 100:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid activity_id.",
        )

    try:
        result = await journey_service.complete_activity(
            user_id=current_user.id,
            activity_id=activity_id,
            db=db,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )

    return ActivityCompleteResponse(**result)
