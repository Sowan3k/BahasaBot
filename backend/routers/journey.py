"""
Journey Router — Phase 20 v2

Endpoints (all under /api/journey prefix):
  POST   /roadmap/generate          — create new roadmap (3-question onboarding answers)
  GET    /roadmap                   — get active roadmap + overdue/bps_upgraded flags
  POST   /roadmap/verify-and-delete — identity-verified soft delete
  PATCH  /roadmap/extend            — extend deadline by 1-3 months (once only)
  POST   /roadmap/regenerate        — regenerate uncompleted elements after BPS upgrade
  DELETE /roadmap/dismiss-upgrade   — clear BPS upgrade Redis flag
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
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
    """POST /roadmap/generate — answers to the 3 onboarding questions."""

    intent: str                    # 'casual' | 'academic' | 'work' | 'travel' | 'other'
    goal: str                      # free-text personal goal
    timeline_months: int           # 1-6
    intent_other: str | None = None  # free-text description when intent == 'other'

    @field_validator("intent")
    @classmethod
    def validate_intent(cls, v: str) -> str:
        allowed = {"casual", "academic", "work", "travel", "other"}
        v = v.strip().lower()
        if v not in allowed:
            raise ValueError(f"intent must be one of {allowed}")
        return v

    @field_validator("goal")
    @classmethod
    def validate_goal(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 5:
            raise ValueError("goal must be at least 5 characters")
        if len(v) > 500:
            raise ValueError("goal must not exceed 500 characters")
        return v

    @field_validator("timeline_months")
    @classmethod
    def validate_timeline(cls, v: int) -> int:
        if not 1 <= v <= 6:
            raise ValueError("timeline_months must be between 1 and 6")
        return v


class RoadmapElement(BaseModel):
    """A single course obstacle in the roadmap elements list."""
    order: int
    topic: str
    description: str
    estimated_weeks: int
    completed: bool
    completed_at: str | None


class RoadmapResponse(BaseModel):
    """Response for GET /roadmap and POST /roadmap/generate."""
    id: str
    intent: str
    goal: str
    timeline_months: int
    elements: list[dict]
    status: str
    deadline: str
    extended: bool
    created_at: str
    completed_at: str | None
    bps_level_at_creation: str
    banner_image_url: str | None
    completed_count: int
    total_count: int
    bps_upgraded: bool
    days_remaining: int


class VerifyAndDeleteRequest(BaseModel):
    """POST /roadmap/verify-and-delete"""
    password: str | None = None
    oauth_confirmed: bool = False


class ExtendRequest(BaseModel):
    """PATCH /roadmap/extend"""
    extension_months: int

    @field_validator("extension_months")
    @classmethod
    def validate_extension(cls, v: int) -> int:
        if not 1 <= v <= 3:
            raise ValueError("extension_months must be 1, 2, or 3")
        return v


# ── Helper: build RoadmapResponse from service dict ──────────────────────────


def _to_response(data: dict) -> RoadmapResponse:
    return RoadmapResponse(
        id=data["id"],
        intent=data["intent"],
        goal=data["goal"],
        timeline_months=data["timeline_months"],
        elements=data["elements"],
        status=data["status"],
        deadline=data["deadline"],
        extended=data["extended"],
        created_at=data["created_at"],
        completed_at=data.get("completed_at"),
        bps_level_at_creation=data["bps_level_at_creation"],
        banner_image_url=data.get("banner_image_url"),
        completed_count=data["completed_count"],
        total_count=data["total_count"],
        bps_upgraded=data.get("bps_upgraded", False),
        days_remaining=data.get("days_remaining", 0),
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.post(
    "/roadmap/generate",
    response_model=RoadmapResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a new personalised course-obstacle roadmap",
)
async def generate_roadmap(
    body: GenerateRoadmapRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RoadmapResponse:
    """
    Generate a personalised learning roadmap based on the user's intent, goal,
    and chosen timeline. Any existing active roadmap is soft-deleted first.
    """
    try:
        roadmap = await journey_service.generate_roadmap(
            user_id=current_user.id,
            intent=body.intent,
            goal=body.goal,
            timeline_months=body.timeline_months,
            db=db,
            intent_other=body.intent_other,
        )
    except journey_service.RoadmapGenerationError as exc:
        logger.error(
            "Roadmap generation failed",
            user_id=str(current_user.id),
            error=str(exc),
        )
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": "generation_failed",
                "message": "We couldn't generate your roadmap right now. Please try again.",
            },
        )

    # Build response dict from the freshly created roadmap
    elements: list[dict] = roadmap.elements or []
    data = {
        "id":                    str(roadmap.id),
        "intent":                roadmap.intent,
        "goal":                  roadmap.goal,
        "timeline_months":       roadmap.timeline_months,
        "elements":              elements,
        "status":                roadmap.status,
        "deadline":              roadmap.deadline.isoformat(),
        "extended":              roadmap.extended,
        "created_at":            roadmap.created_at.isoformat(),
        "completed_at":          None,
        "bps_level_at_creation": roadmap.bps_level_at_creation,
        "banner_image_url":      roadmap.banner_image_url,
        "completed_count":       0,
        "total_count":           len(elements),
        "bps_upgraded":          False,
        "days_remaining":        roadmap.timeline_months * 30,
    }
    return _to_response(data)


@router.get(
    "/roadmap",
    response_model=RoadmapResponse,
    summary="Get the user's active roadmap with status flags",
)
async def get_roadmap(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RoadmapResponse:
    """
    Return the user's active (or overdue/completed) roadmap.
    Triggers overdue check, timeline notifications, and BPS upgrade flag on every call.
    Returns 404 if no roadmap exists.
    """
    data = await journey_service.get_roadmap(user_id=current_user.id, db=db)
    if data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No roadmap found. Create one to get started.",
        )
    return _to_response(data)


@router.post(
    "/roadmap/verify-and-delete",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Verify identity and soft-delete the active roadmap",
)
async def verify_and_delete(
    body: VerifyAndDeleteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    Delete the active roadmap after verifying user identity.
    Email accounts must supply their password.
    Google OAuth accounts must confirm via oauth_confirmed=True.
    """
    try:
        await journey_service.verify_and_delete(
            user_id=current_user.id,
            db=db,
            password=body.password,
            oauth_confirmed=body.oauth_confirmed,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.patch(
    "/roadmap/extend",
    response_model=RoadmapResponse,
    summary="Extend the roadmap deadline (once only, 1-3 months)",
)
async def extend_deadline(
    body: ExtendRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RoadmapResponse:
    """
    Extend the deadline by 1, 2, or 3 months. Only allowed once per roadmap.
    Re-activates an overdue roadmap to 'active' status.
    """
    try:
        data = await journey_service.extend_deadline(
            user_id=current_user.id,
            extension_months=body.extension_months,
            db=db,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    return _to_response(data)


@router.post(
    "/roadmap/regenerate",
    response_model=RoadmapResponse,
    summary="Regenerate uncompleted roadmap elements using current BPS level",
)
async def regenerate_roadmap(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RoadmapResponse:
    """
    Replace only the pending (uncompleted) elements with freshly generated ones
    matched to the user's current BPS level and updated weak points.
    Clears the BPS upgrade Redis flag after success.
    """
    try:
        data = await journey_service.regenerate_uncompleted(
            user_id=current_user.id,
            db=db,
        )
    except (ValueError, RuntimeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    return _to_response(data)


@router.delete(
    "/roadmap/dismiss-upgrade",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Dismiss the BPS upgrade banner without regenerating",
)
async def dismiss_upgrade(
    current_user: User = Depends(get_current_user),
) -> None:
    """Clear the BPS upgrade Redis flag. The banner will no longer appear."""
    await journey_service.dismiss_bps_upgrade(current_user.id)


class PastJourneyItem(BaseModel):
    """A single summary row returned by GET /roadmap/history."""
    id: str
    intent: str
    goal: str
    timeline_months: int
    deadline: str
    completed_at: str | None
    status: str
    total_elements: int
    completed_elements: int
    created_at: str


@router.get(
    "/roadmap/history",
    response_model=list[PastJourneyItem],
    summary="Get all completed and deleted roadmaps for the current user",
)
async def get_roadmap_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[PastJourneyItem]:
    """
    Returns all past (completed or deleted) roadmaps for the user, ordered newest first.
    Does not include the full elements array — summary data only.
    """
    items = await journey_service.get_roadmap_history(
        user_id=current_user.id,
        db=db,
    )
    return [PastJourneyItem(**item) for item in items]
