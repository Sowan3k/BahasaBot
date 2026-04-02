"""
User ORM Model

Table: users
Maps to the `users` PostgreSQL table.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.db.database import Base


class User(Base):
    """SQLAlchemy ORM model for the users table."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    # Nullable — Google OAuth users have no password
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # "email" = email/password  |  "google" = Google OAuth
    provider: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="email",
        server_default="email",
    )
    proficiency_level: Mapped[str] = mapped_column(
        # native_enum=False → stores as VARCHAR, not a PostgreSQL ENUM type.
        # BPS labels: BPS-1 (Beginner), BPS-2 (Elementary), BPS-3 (Intermediate), BPS-4 (Upper-Intermediate)
        Enum("BPS-1", "BPS-2", "BPS-3", "BPS-4", name="proficiency_level_enum", native_enum=False),
        nullable=False,
        default="BPS-1",
        server_default="BPS-1",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    # ── Phase 11 additions ────────────────────────────────────────────────────
    # Onboarding: set True after user completes the first-login onboarding flow
    onboarding_completed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )
    # User's native language (collected during onboarding)
    native_language: Mapped[str | None] = mapped_column(String(100), nullable=True)
    # Why the user is learning Malay (collected during onboarding)
    learning_goal: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # URL of profile picture (uploaded or from Google OAuth)
    profile_picture_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    # 'user' | 'admin' — admin role checked server-side on all admin endpoints
    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="user",
        server_default="user",
    )
    # Gamification: consecutive days with at least one learning activity
    streak_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    # Gamification: total XP earned across all activities
    xp_total: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} level={self.proficiency_level}>"
