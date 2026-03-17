"""
User ORM Model

Table: users
Maps to the `users` PostgreSQL table.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String, func
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
        Enum("A1", "A2", "B1", "B2", name="proficiency_level_enum"),
        nullable=False,
        default="A1",
        server_default="A1",
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

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} level={self.proficiency_level}>"
