"""
Course ORM Models

Tables:
  courses  — AI-generated courses, one per user per topic
  modules  — ordered sections within a course
  classes  — individual lesson within a module (content, vocabulary, examples)
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.db.database import Base


class Course(Base):
    """Top-level AI-generated course belonging to a user."""

    __tablename__ = "courses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid()
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    topic: Mapped[str] = mapped_column(String(500), nullable=False)
    # JSON array of learning objective strings
    objectives: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    # AI-generated cover image stored as base64 data URL (TEXT — can exceed VARCHAR(1000))
    cover_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # ── Deduplication / template columns ──────────────────────────────────────
    # Normalised "topic:level" slug used to find an existing template quickly.
    # Null for courses generated before Phase 23 (deduplication) was introduced.
    topic_slug: Mapped[str | None] = mapped_column(
        String(600), nullable=True, index=True
    )
    # True only for the first user who generates a given topic+level combination.
    # All subsequent users get a clone of this course instead of a fresh generation.
    is_template: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    # UUID of the template this course was cloned from (None for originals).
    cloned_from: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    modules: Mapped[list["Module"]] = relationship(
        "Module", back_populates="course", cascade="all, delete-orphan", order_by="Module.order_index"
    )

    def __repr__(self) -> str:
        return f"<Course id={self.id} title={self.title!r}>"


class Module(Base):
    """Ordered section within a course. Contains multiple classes."""

    __tablename__ = "modules"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid()
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    course: Mapped["Course"] = relationship("Course", back_populates="modules")
    classes: Mapped[list["Class"]] = relationship(
        "Class", back_populates="module", cascade="all, delete-orphan", order_by="Class.order_index"
    )

    def __repr__(self) -> str:
        return f"<Module id={self.id} order={self.order_index} title={self.title!r}>"


class Class(Base):
    """Individual lesson within a module. Stores full lesson content + vocabulary."""

    __tablename__ = "classes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid()
    )
    module_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    # JSON array of {word, meaning, example} objects
    vocabulary_json: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    # JSON array of {bm, en} example sentence pairs
    examples_json: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    module: Mapped["Module"] = relationship("Module", back_populates="classes")

    def __repr__(self) -> str:
        return f"<Class id={self.id} order={self.order_index} title={self.title!r}>"
