"""
Password Reset Token ORM Model

Table: password_reset_tokens
Stores hashed one-time reset tokens for the forgot-password flow.
Only applicable to email/password accounts — Google OAuth users are directed to Google.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.db.database import Base


class PasswordResetToken(Base):
    """Hashed token record for a password reset request.

    Workflow:
      1. POST /api/auth/forgot-password → generate raw token, hash it, store here,
         send raw token to user's email via Resend.
      2. POST /api/auth/reset-password → hash incoming token, look up this record,
         verify not expired and not used, update password, mark used=True.

    token_hash stores SHA-256(raw_token) — the raw token is never persisted.
    TTL is 15 minutes (expires_at = now + 15 min at creation time).
    """

    __tablename__ = "password_reset_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
        server_default=func.gen_random_uuid()
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    # SHA-256 hex digest of the raw token sent to the user — indexed for fast lookup
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    # Token expires 15 minutes after creation
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    # Marked True after the token is consumed — prevents replay attacks
    used: Mapped[bool] = mapped_column(
        Boolean(), nullable=False, default=False, server_default="false"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<PasswordResetToken user={self.user_id} used={self.used} expires={self.expires_at}>"
