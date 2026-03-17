"""
Auth Router — /api/auth/*

Endpoints:
  POST /api/auth/register  — create new user (email/password)
  POST /api/auth/login     — login with email/password, receive JWT tokens
  POST /api/auth/google    — verify Google ID token, receive our JWT tokens
  POST /api/auth/refresh   — exchange refresh token for a new access token
  GET  /api/auth/me        — get current authenticated user
"""

import os
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_db
from backend.middleware.auth_middleware import get_current_user
from backend.models.user import User
from backend.schemas.auth import (
    AccessTokenResponse,
    GoogleAuthRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from backend.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()

# ── JWT config ────────────────────────────────────────────────────────────────

SECRET_KEY = os.getenv("SECRET_KEY", "")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
# Access token: 15 min (short-lived); refresh token: 7 days (long-lived)
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# ── Google OAuth config ───────────────────────────────────────────────────────

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

# ── Password hashing ──────────────────────────────────────────────────────────
# Using bcrypt directly — passlib has a compatibility bug with bcrypt >= 4.x


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# ── Token helpers ─────────────────────────────────────────────────────────────


def _create_token(user_id: str, expire_minutes: int) -> str:
    """Create a signed JWT with `sub` = user_id and `exp` = now + expire_minutes."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _create_access_token(user_id: str) -> str:
    return _create_token(user_id, ACCESS_TOKEN_EXPIRE_MINUTES)


def _create_refresh_token(user_id: str) -> str:
    return _create_token(user_id, REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60)


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=TokenResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """Create a new user account (email/password) and return JWT tokens."""

    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=body.email,
        name=body.name,
        password_hash=_hash_password(body.password),
        provider="email",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    logger.info("User registered", user_id=str(user.id), email=user.email)

    return TokenResponse(
        access_token=_create_access_token(str(user.id)),
        refresh_token=_create_refresh_token(str(user.id)),
        user=UserResponse.model_validate(user),
    )


@router.post("/login", status_code=status.HTTP_200_OK, response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """Authenticate with email/password and return JWT tokens."""

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    # password_hash is None for Google-only accounts — reject password login
    if user is None or user.password_hash is None or not _verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is disabled",
        )

    logger.info("User logged in", user_id=str(user.id), email=user.email)

    return TokenResponse(
        access_token=_create_access_token(str(user.id)),
        refresh_token=_create_refresh_token(str(user.id)),
        user=UserResponse.model_validate(user),
    )


@router.post("/google", status_code=status.HTTP_200_OK, response_model=TokenResponse)
async def google_auth(body: GoogleAuthRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """
    Verify a Google ID token from the frontend and issue our own JWT tokens.

    Flow:
      1. Frontend gets a Google ID token via Google Identity Services.
      2. Frontend sends it here — ONLY this endpoint accepts a Google token.
      3. We verify against Google's public keys.
      4. We create/find the user and return our standard JWT (same structure as /login).
    """
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured on this server",
        )

    try:
        request = google_requests.Request()
        idinfo = google_id_token.verify_oauth2_token(body.id_token, request, GOOGLE_CLIENT_ID)
    except ValueError as exc:
        logger.warning("Google token verification failed", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )

    if not idinfo.get("email_verified"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google account email is not verified",
        )

    email: str = idinfo["email"]
    name: str = idinfo.get("name") or email.split("@")[0]

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None:
        # New user — create with no password
        user = User(
            email=email,
            name=name,
            password_hash=None,
            provider="google",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.info("Google user created", user_id=str(user.id), email=email)
    else:
        # Existing email/password account — link to Google on first OAuth sign-in
        if user.provider == "email":
            user.provider = "google"
            await db.commit()
            await db.refresh(user)
        logger.info("Google user logged in", user_id=str(user.id), email=email)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is disabled",
        )

    return TokenResponse(
        access_token=_create_access_token(str(user.id)),
        refresh_token=_create_refresh_token(str(user.id)),
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", status_code=status.HTTP_200_OK, response_model=AccessTokenResponse)
async def refresh_token(body: RefreshRequest, db: AsyncSession = Depends(get_db)) -> AccessTokenResponse:
    """Exchange a valid refresh token for a new access token."""

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(body.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise credentials_exception

    logger.info("Token refreshed", user_id=str(user.id))

    return AccessTokenResponse(access_token=_create_access_token(str(user.id)))


@router.get("/me", status_code=status.HTTP_200_OK, response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Return the currently authenticated user's profile."""
    return UserResponse.model_validate(current_user)
