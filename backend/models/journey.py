"""
Journey ORM Models

Tables:
  learning_roadmaps           — AI-generated personalised learning roadmap (one active per user)
  roadmap_activity_completions — tracks which roadmap activities the user has completed
"""

import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.db.database import Base


class LearningRoadmap(Base):
    """AI-generated personalised learning roadmap for a user.

    One active roadmap per user. User can delete and regenerate at any time.
    roadmap_json stores the full structured plan (phases → weeks → activities).
    """

    __tablename__ = "learning_roadmaps"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
        server_default=func.gen_random_uuid()
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    # When the user wants to reach their goal
    deadline_date: Mapped[date] = mapped_column(Date(), nullable=False)
    # 'survival' | 'conversational' | 'academic'
    goal_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # Full roadmap JSON: { phases: [ { phase, title, duration_weeks, weeks: [...] } ] }
    roadmap_json: Mapped[dict] = mapped_column(JSONB(), nullable=False)
    # Nano Banana 2 banner image URL — generated once on creation, never regenerated
    banner_image_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<LearningRoadmap user={self.user_id} goal={self.goal_type} deadline={self.deadline_date}>"


class RoadmapActivityCompletion(Base):
    """Tracks which activities within a roadmap a user has completed.

    activity_id is a unique string key identifying an activity within the roadmap
    JSON (e.g. "phase1_week2_act3"). Cross-referenced with user_progress and
    standalone_quiz_attempts to show visual progress.
    """

    __tablename__ = "roadmap_activity_completions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
        server_default=func.gen_random_uuid()
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    # Unique activity identifier within the roadmap JSON
    activity_id: Mapped[str] = mapped_column(String(100), nullable=False)
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<RoadmapActivityCompletion user={self.user_id} activity={self.activity_id!r}>"
