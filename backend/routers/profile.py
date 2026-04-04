"""
Profile Router

Endpoints:
  GET  /api/profile/   — Return the current user's full profile
  PATCH /api/profile/  — Update editable profile fields (name, native_language,
                          learning_goal, profile_picture_url)

email and role are NOT editable through this endpoint.
"""

import bcrypt
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_db
from backend.middleware.auth_middleware import get_current_user
from backend.models.user import User
from backend.schemas.profile import ProfileResponse, ProfileUpdateRequest
from backend.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()


# ── GET /api/profile/ ──────────────────────────────────────────────────────────

@router.get("/", response_model=ProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
) -> ProfileResponse:
    """Return the authenticated user's full profile."""
    return ProfileResponse.model_validate(current_user)


# ── PATCH /api/profile/ ────────────────────────────────────────────────────────

@router.patch("/", response_model=ProfileResponse)
async def update_profile(
    body: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    """Update editable profile fields.

    Only fields included in the request body are updated.
    email and role are intentionally not updateable here.
    """
    updated_any = False

    if body.name is not None:
        current_user.name = body.name
        updated_any = True

    if body.native_language is not None:
        current_user.native_language = body.native_language
        updated_any = True

    if body.learning_goal is not None:
        current_user.learning_goal = body.learning_goal
        updated_any = True

    if body.profile_picture_url is not None:
        current_user.profile_picture_url = body.profile_picture_url
        updated_any = True

    if body.onboarding_completed is not None:
        current_user.onboarding_completed = body.onboarding_completed
        updated_any = True

    if updated_any:
        try:
            db.add(current_user)
            await db.commit()
            await db.refresh(current_user)
            logger.info("Profile updated", user_id=str(current_user.id))
        except Exception as exc:
            await db.rollback()
            logger.error("Failed to update profile", user_id=str(current_user.id), error=str(exc))
            raise HTTPException(status_code=500, detail="Failed to save profile changes")

    return ProfileResponse.model_validate(current_user)


# ── POST /api/profile/change-password ─────────────────────────────────────────

class ChangePasswordRequest(BaseModel):
    """Payload for POST /api/profile/change-password."""

    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def new_password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("New password must be at least 8 characters")
        return v


class ChangePasswordResponse(BaseModel):
    message: str


@router.post("/change-password", response_model=ChangePasswordResponse)
async def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChangePasswordResponse:
    """Change the authenticated user's password.

    - Google-only accounts cannot use this endpoint.
    - Verifies current password before updating.
    """
    # Google-only accounts have no password
    if current_user.provider == "google" or current_user.password_hash is None:
        raise HTTPException(
            status_code=400,
            detail="google_account_no_password",
        )

    # Verify current password
    current_matches = bcrypt.checkpw(
        body.current_password.encode("utf-8"),
        current_user.password_hash.encode("utf-8"),
    )
    if not current_matches:
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    # Hash new password and save
    new_hash = bcrypt.hashpw(body.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    current_user.password_hash = new_hash

    try:
        db.add(current_user)
        await db.commit()
        logger.info("Password changed", user_id=str(current_user.id))
    except Exception as exc:
        await db.rollback()
        logger.error("Failed to change password", user_id=str(current_user.id), error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to update password")

    return ChangePasswordResponse(message="Password updated successfully")
