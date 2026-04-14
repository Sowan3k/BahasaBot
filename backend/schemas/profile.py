"""
Profile Schemas (Pydantic v2)

Request/response models for GET /api/profile/ and PATCH /api/profile/.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, field_validator


class ProfileResponse(BaseModel):
    """Full user profile returned by GET /api/profile/."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    name: str
    native_language: str | None
    learning_goal: str | None
    profile_picture_url: str | None
    proficiency_level: Literal["BPS-1", "BPS-2", "BPS-3", "BPS-4"]
    role: str
    streak_count: int
    xp_total: int
    onboarding_completed: bool
    has_seen_tour: bool
    provider: Literal["email", "google"]
    gender: str | None
    age_range: str | None

    @field_validator("id", mode="before")
    @classmethod
    def coerce_uuid_to_str(cls, v: object) -> str:
        return str(v)


class ProfileUpdateRequest(BaseModel):
    """Payload for PATCH /api/profile/.

    All fields are optional — only provided fields are updated.
    email and role are intentionally excluded — they are NOT editable here.
    """

    name: str | None = None
    native_language: str | None = None
    learning_goal: str | None = None
    profile_picture_url: str | None = None
    onboarding_completed: bool | None = None
    has_seen_tour: bool | None = None
    gender: str | None = None
    age_range: str | None = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Name cannot be empty")
            if len(v) > 255:
                raise ValueError("Name must be 255 characters or fewer")
        return v

    @field_validator("native_language")
    @classmethod
    def native_language_length(cls, v: str | None) -> str | None:
        if v is not None and len(v) > 100:
            raise ValueError("Native language must be 100 characters or fewer")
        return v

    @field_validator("learning_goal")
    @classmethod
    def learning_goal_length(cls, v: str | None) -> str | None:
        if v is not None and len(v) > 500:
            raise ValueError("Learning goal must be 500 characters or fewer")
        return v

    @field_validator("profile_picture_url")
    @classmethod
    def profile_picture_url_length(cls, v: str | None) -> str | None:
        if v is not None and len(v) > 1000:
            raise ValueError("Profile picture URL must be 1000 characters or fewer")
        return v
