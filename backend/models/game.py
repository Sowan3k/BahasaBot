"""
Game ORM Models

Table: spelling_game_scores
Per-session scores for the Spelling Practice Game.
"""

import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.db.database import Base


class SpellingGameScore(Base):
    """Score record for one spelling game session.

    A new row is written at the end of each spelling game session.
    words_correct / words_attempted allows personal-best calculation and
    admin reporting.
    """

    __tablename__ = "spelling_game_scores"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    words_correct: Mapped[int] = mapped_column(Integer(), nullable=False)
    words_attempted: Mapped[int] = mapped_column(Integer(), nullable=False)
    # Date the session was played (not timestamp — one record per session per day is fine)
    session_date: Mapped[date] = mapped_column(Date(), nullable=False)

    def __repr__(self) -> str:
        return (
            f"<SpellingGameScore user={self.user_id} "
            f"correct={self.words_correct}/{self.words_attempted} date={self.session_date}>"
        )
