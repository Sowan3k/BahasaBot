"""
Analytics helpers — analytics.py

Lightweight fire-and-forget functions for logging token usage and activity events.
All writes are wrapped in try/except so a logging failure never breaks a user request.

Usage in route handlers:
    from backend.utils.analytics import log_tokens, log_activity
    await log_tokens(db, user_id=user.id, feature="chatbot", input_tokens=120, output_tokens=300)
    await log_activity(db, user_id=user.id, feature="chatbot", duration_seconds=0)
"""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.analytics import ActivityLog, TokenUsageLog
from backend.utils.logger import get_logger

logger = get_logger(__name__)


async def log_tokens(
    db: AsyncSession,
    user_id: uuid.UUID,
    feature: str,
    input_tokens: int,
    output_tokens: int,
) -> None:
    """
    Persist a token-usage record for one Gemini API call.

    Never raises — failures are logged and swallowed so they can't break the
    calling request.
    """
    try:
        entry = TokenUsageLog(
            user_id=user_id,
            feature=feature,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=input_tokens + output_tokens,
        )
        db.add(entry)
        await db.commit()
    except Exception as exc:
        logger.warning("log_tokens failed — ignoring", feature=feature, error=str(exc))
        await db.rollback()


async def log_activity(
    db: AsyncSession,
    user_id: uuid.UUID,
    feature: str,
    duration_seconds: int = 0,
) -> None:
    """
    Persist a learning-activity event.

    Never raises — failures are logged and swallowed.
    """
    try:
        entry = ActivityLog(
            user_id=user_id,
            feature=feature,
            duration_seconds=duration_seconds,
        )
        db.add(entry)
        await db.commit()
    except Exception as exc:
        logger.warning("log_activity failed — ignoring", feature=feature, error=str(exc))
        await db.rollback()
