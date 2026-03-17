"""
Auth Schemas (Pydantic v2)

Request/response models for authentication endpoints.
Kept separate from ORM models (backend/models/user.py).
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


class RegisterRequest(BaseModel):
    """Payload for POST /api/auth/register."""

    name: str
    email: EmailStr
    password: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    """Payload for POST /api/auth/login."""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User object returned in API responses."""

    model_config = ConfigDict(from_attributes=True)

    id: str  # UUID serialised as string
    email: str
    name: str
    proficiency_level: Literal["A1", "A2", "B1", "B2"]
    created_at: datetime

    @field_validator("id", mode="before")
    @classmethod
    def coerce_uuid_to_str(cls, v: object) -> str:
        return str(v)


class TokenResponse(BaseModel):
    """Response returned after successful register or login."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    """Internal model — decoded JWT payload."""

    user_id: str


class GoogleAuthRequest(BaseModel):
    """Payload for POST /api/auth/google."""

    id_token: str  # Google ID token received from the frontend


class RefreshRequest(BaseModel):
    """Payload for POST /api/auth/refresh."""

    refresh_token: str


class AccessTokenResponse(BaseModel):
    """Response from POST /api/auth/refresh — returns new access token only."""

    access_token: str
    token_type: str = "bearer"
