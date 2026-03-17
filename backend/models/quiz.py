"""
Quiz ORM Models

Tables:
  module_quiz_attempts     — results of a quiz taken after completing a module
  standalone_quiz_attempts — results of the adaptive standalone quiz
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.db.database import Base


class ModuleQuizAttempt(Base):
    """
    Records one attempt at the auto-generated quiz for a module.
    Score >= 0.70 required to unlock the next module.
    """

    __tablename__ = "module_quiz_attempts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid()
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    module_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Normalised score 0.0–1.0
    score: Mapped[float] = mapped_column(Float, nullable=False)
    # JSON array of {question_id, answer, correct, type} objects
    answers_json: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    taken_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<ModuleQuizAttempt user={self.user_id} module={self.module_id} score={self.score}>"


class StandaloneQuizAttempt(Base):
    """
    Records one attempt at the adaptive standalone quiz.
    Score is used to recalculate the user's CEFR proficiency level.
    """

    __tablename__ = "standalone_quiz_attempts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid()
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Normalised score 0.0–1.0
    score: Mapped[float] = mapped_column(Float, nullable=False)
    # JSON array of generated question objects (question, type, options, correct_answer)
    questions_json: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    # JSON array of {question_id, answer, correct} objects
    answers_json: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    taken_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<StandaloneQuizAttempt user={self.user_id} score={self.score}>"
