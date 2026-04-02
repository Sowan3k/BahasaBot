"""
Evaluation Feedback ORM Model

Table: evaluation_feedback
Stores optional in-app survey responses collected after quiz completion.
Used to provide structured evidence for the 30-user FYP evaluation.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.db.database import Base


class EvaluationFeedback(Base):
    """Survey response submitted by a user after completing a quiz.

    Survey questions:
      1. Overall experience rating (1–5)
      2. Did the quiz reflect your weak areas? ('yes' | 'no' | 'somewhat')
      3. Open text feedback (optional)

    Shown as an optional modal after any quiz completion (module or standalone).
    Admin panel aggregates all responses for FYP evaluation.
    """

    __tablename__ = "evaluation_feedback"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
        server_default=func.gen_random_uuid()
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    # Which quiz triggered this feedback prompt
    quiz_type: Mapped[str] = mapped_column(String(50), nullable=False)  # 'module' | 'standalone'
    # Q1: overall experience 1 (very poor) → 5 (excellent)
    rating: Mapped[int] = mapped_column(Integer(), nullable=False)
    # Q2: did the questions match your known weak areas?
    weak_points_relevant: Mapped[str] = mapped_column(String(20), nullable=False)  # 'yes'|'no'|'somewhat'
    # Q3: open text (optional — user may skip)
    comments: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<EvaluationFeedback user={self.user_id} rating={self.rating} type={self.quiz_type!r}>"
