"""
Journey ORM Models

Tables:
  user_roadmaps — Phase 20 v2 roadmap (flat ordered course obstacles — sole active model)

Removed (v1 — tables dropped via drop_v1_journey_tables migration):
  learning_roadmaps            — phase/week/activity structure, superseded by v2
  roadmap_activity_completions — v1 completion tracker, superseded by user_roadmaps.elements[].completed
"""

import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.db.database import Base


class UserRoadmap(Base):
    """Phase 20 v2 — flat ordered list of course obstacles.

    One active roadmap per user (enforced by partial unique index
    user_roadmaps_one_active_per_user WHERE status = 'active').
    Old completed/deleted roadmaps are soft-kept for admin history.

    elements JSONB schema:
        [
          {
            "order": 1,
            "topic": "Greetings and Self-Introduction",
            "description": "Learn how to introduce yourself in Malay",
            "estimated_weeks": 2,
            "completed": false,
            "completed_at": null
          },
          ...
        ]
    """

    __tablename__ = "user_roadmaps"
    __table_args__ = (
        CheckConstraint("timeline_months BETWEEN 1 AND 6", name="user_roadmaps_timeline_check"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
        server_default=func.gen_random_uuid()
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    # Onboarding answers
    intent: Mapped[str] = mapped_column(String(100), nullable=False)
    goal: Mapped[str] = mapped_column(Text, nullable=False)
    timeline_months: Mapped[int] = mapped_column(Integer, nullable=False)
    # Ordered array of course obstacle objects (see class docstring)
    elements: Mapped[dict] = mapped_column(JSONB(), nullable=False)
    # 'active' | 'overdue' | 'completed' | 'deleted'
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="active")
    # created_at + timeline_months
    deadline: Mapped[date] = mapped_column(Date(), nullable=False)
    # True after the user has used their one allowed deadline extension
    extended: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Snapshot of the user's BPS level when this roadmap was generated
    bps_level_at_creation: Mapped[str] = mapped_column(String(10), nullable=False)
    # Nano Banana 2 banner (generated async, null until ready)
    banner_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    def __repr__(self) -> str:
        return f"<UserRoadmap user={self.user_id} status={self.status} timeline={self.timeline_months}mo>"
