"""
Progress ORM Models

Tables:
  user_progress      — tracks which classes/modules a user has completed
  vocabulary_learned — words encountered from chatbot or course classes
  grammar_learned    — grammar rules encountered from chatbot or course classes
  weak_points        — aggregated areas needing review, with a strength score
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.db.database import Base


class UserProgress(Base):
    """Tracks completion of a class or module for a user."""

    __tablename__ = "user_progress"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid()
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True
    )
    module_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Null means the whole module is marked complete (not a specific class)
    class_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), nullable=True
    )
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<UserProgress user={self.user_id} module={self.module_id} class={self.class_id}>"


class VocabularyLearned(Base):
    """A vocabulary word encountered by a user — from chatbot or a course class."""

    __tablename__ = "vocabulary_learned"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid()
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    word: Mapped[str] = mapped_column(String(255), nullable=False)
    meaning: Mapped[str] = mapped_column(Text, nullable=False)
    # "chatbot" | "course"
    source_type: Mapped[str] = mapped_column(String(20), nullable=False)
    # ID of the chat_session or class where this word appeared
    source_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    learned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<VocabularyLearned user={self.user_id} word={self.word!r}>"


class GrammarLearned(Base):
    """A grammar rule encountered by a user — from chatbot or a course class."""

    __tablename__ = "grammar_learned"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid()
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    rule: Mapped[str] = mapped_column(Text, nullable=False)
    example: Mapped[str] = mapped_column(Text, nullable=False)
    # "chatbot" | "course"
    source_type: Mapped[str] = mapped_column(String(20), nullable=False)
    source_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    learned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<GrammarLearned user={self.user_id} rule={self.rule[:40]!r}>"


class WeakPoint(Base):
    """Aggregated weak area for a user. Strength score decreases as errors accumulate."""

    __tablename__ = "weak_points"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid()
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Topic label e.g. "verb conjugation", "greetings vocabulary"
    topic: Mapped[str] = mapped_column(String(500), nullable=False)
    # "vocab" | "grammar"
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    # 0.0 (very weak) → 1.0 (mastered)
    strength_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.5)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"<WeakPoint user={self.user_id} topic={self.topic!r} score={self.strength_score}>"
