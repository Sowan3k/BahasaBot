"""
Auth Middleware

Provides get_current_user FastAPI dependency.
Decodes Bearer JWT, validates expiry, queries user from DB.
Raises HTTPException(401) on any failure.
"""

import os

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_db
from backend.models.user import User
from backend.utils.logger import get_logger

logger = get_logger(__name__)

SECRET_KEY = os.getenv("SECRET_KEY", "")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# Extracts "Bearer <token>" from Authorization header
_bearer_scheme = HTTPBearer(auto_error=True)

_credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid or expired token",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    FastAPI dependency — decodes the JWT and returns the authenticated User.

    Usage in route handlers:
        current_user: User = Depends(get_current_user)
    """
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise _credentials_exception
    except JWTError:
        logger.warning("JWT decode failed", token_prefix=token[:20])
        raise _credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise _credentials_exception

    return user
