"""
XPLog ORM Model

Table: xp_logs
Append-only log of every XP award event. Used to compute weekly leaderboard
rankings without mutating the cumulative users.xp_total column.

Sources:
  class_complete       — 10 XP per course class
  quiz_pass            — 25 XP per passed quiz
  chatbot_session      — 5 XP per chat session
  spelling_correct     — 2 XP per correct spelling word
  roadmap_obstacle     — 100 XP when a roadmap course obstacle is cleared
  roadmap_complete     — 500 XP when entire roadmap finished on time
  roadmap_complete_late — 200 XP when roadmap finished after deadline
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.db.database import Base


class XPLog(Base):
    __tablename__ = "xp_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
        server_default=func.gen_random_uuid()
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    xp_amount: Mapped[int] = mapped_column(Integer(), nullable=False)
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<XPLog user={self.user_id} amount={self.xp_amount} source={self.source!r}>"
