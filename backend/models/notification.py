"""
Notification ORM Model

Table: notifications
In-app notifications for streak milestones, XP milestones, Journey reminders,
course generation complete events, and roadmap phase completions.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.db.database import Base


class Notification(Base):
    """In-app notification for a user.

    Notification types:
      'streak_milestone'  — 3/7/14/30 consecutive learning days
      'xp_milestone'      — every 100 XP earned
      'journey_reminder'  — weekly activity not completed by Friday
      'course_complete'   — background course generation finished
      'phase_complete'    — Journey roadmap phase fully completed
      'bps_milestone'     — user advanced to a new BPS proficiency level (carries image_url)
    """

    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
        server_default=func.gen_random_uuid()
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    # Notification category — determines icon in UI
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    # Human-readable message shown in the notification panel
    message: Mapped[str] = mapped_column(Text(), nullable=False)
    # False = unread (shown with badge); True = read (dimmed in panel)
    read: Mapped[bool] = mapped_column(
        Boolean(), nullable=False, default=False, server_default="false"
    )
    # Optional image for visual notifications (e.g. BPS milestone card base64 data URL)
    image_url: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<Notification user={self.user_id} type={self.type!r} read={self.read}>"
