"""
Game ORM Models

Table: spelling_game_scores
Per-session scores for all practice games (Spelling + Word Match).
The game_type column distinguishes which game the row belongs to.
"""

import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.db.database import Base


class SpellingGameScore(Base):
    """Score record for one game session (spelling or word_match).

    A new row is written at the end of each session.
    game_type distinguishes 'spelling' from 'word_match'.
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
    # Which game this score belongs to: 'spelling' or 'word_match'
    game_type: Mapped[str] = mapped_column(
        String(50), nullable=False, server_default="spelling"
    )

    def __repr__(self) -> str:
        return (
            f"<SpellingGameScore user={self.user_id} game={self.game_type} "
            f"correct={self.words_correct}/{self.words_attempted} date={self.session_date}>"
        )
