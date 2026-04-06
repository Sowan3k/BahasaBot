"""
Analytics ORM Models

Tables:
  token_usage_logs  — per-request Gemini token consumption (input + output)
  activity_logs     — per-feature session events for time-spent tracking
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.db.database import Base


class TokenUsageLog(Base):
    """
    Records token usage for a single Gemini API call.

    feature values:
      'chatbot'     — conversational chatbot message
      'course_gen'  — course/module/class generation
      'quiz_gen'    — module or standalone quiz generation
    """

    __tablename__ = "token_usage_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    # Which feature made this call
    feature: Mapped[str] = mapped_column(String(30), nullable=False)
    input_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    output_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True,
    )

    def __repr__(self) -> str:
        return (
            f"<TokenUsageLog user={self.user_id} feature={self.feature!r} "
            f"total={self.total_tokens}>"
        )


class ActivityLog(Base):
    """
    Records a discrete learning activity event.

    Used to infer time-on-app per feature.
    duration_seconds is set when the activity has a known duration
    (e.g. quiz attempt end - start). For open-ended activities (chatbot message
    sent, class completed) duration is 0 and we count events instead.

    feature values:
      'chatbot'        — a chatbot message exchange
      'course_class'   — a course class completed
      'module_quiz'    — a module quiz submitted
      'standalone_quiz'— a standalone quiz submitted
      'spelling_game'  — a spelling game session
    """

    __tablename__ = "activity_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    feature: Mapped[str] = mapped_column(String(30), nullable=False)
    # Duration in seconds for timed activities; 0 for event-only activities
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True,
    )

    def __repr__(self) -> str:
        return (
            f"<ActivityLog user={self.user_id} feature={self.feature!r} "
            f"dur={self.duration_seconds}s>"
        )
