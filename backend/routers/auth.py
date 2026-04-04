"""
Auth Router — /api/auth/*

Endpoints:
  POST /api/auth/register         — create new user (email/password)
  POST /api/auth/login            — login with email/password, receive JWT tokens
  POST /api/auth/google           — verify Google ID token, receive our JWT tokens
  POST /api/auth/refresh          — exchange refresh token for a new access token
  GET  /api/auth/me               — get current authenticated user
  POST /api/auth/forgot-password  — request password-reset email (email/password accounts only)
  POST /api/auth/reset-password   — set new password using reset token from email
"""

import hashlib
import os
import secrets
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
from backend.models.password_reset import PasswordResetToken
from backend.models.user import User
from backend.schemas.auth import (
    AccessTokenResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    GoogleAuthRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    ResetPasswordResponse,
    TokenResponse,
    UserResponse,
)
from backend.services.email_service import send_reset_email
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

# If a registering user's email matches ADMIN_EMAIL, they receive role='admin' automatically.
# Set this in backend/.env — leave blank to disable automatic admin seeding.
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "").strip().lower()

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

    # Grant admin role if the registering email matches ADMIN_EMAIL env var
    role = "admin" if ADMIN_EMAIL and body.email.strip().lower() == ADMIN_EMAIL else "user"

    user = User(
        email=body.email,
        name=body.name,
        password_hash=_hash_password(body.password),
        provider="email",
        role=role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    logger.info("User registered", user_id=str(user.id), email=user.email, role=role)

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

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Google-only account — has no password
    if user.password_hash is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="google_signin_required",
        )

    if not _verify_password(body.password, user.password_hash):
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


# ── Forgot / Reset password ───────────────────────────────────────────────────

RESET_TOKEN_TTL_MINUTES = 15


@router.post("/forgot-password", status_code=status.HTTP_200_OK, response_model=ForgotPasswordResponse)
async def forgot_password(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)) -> ForgotPasswordResponse:
    """
    Request a password-reset link.

    - Google OAuth accounts: returns 400 with detail 'google_account_no_password'
      so the frontend can show a helpful message.
    - Email/password accounts: generates a 15-minute token, stores its SHA-256
      hash in password_reset_tokens, and sends the raw token to the user's email.
    - Non-existent email: returns 200 with the generic success message (prevents
      email enumeration).
    """
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    # User not found — return generic success to prevent email enumeration
    if user is None:
        return ForgotPasswordResponse(
            message="If that email is registered, you'll receive a reset link shortly."
        )

    # Google-only account — no password to reset
    if user.provider == "google" or user.password_hash is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="google_account_no_password",
        )

    # Invalidate any existing unused tokens for this user to keep the table clean
    existing_tokens_result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False,  # noqa: E712
        )
    )
    for old_token in existing_tokens_result.scalars().all():
        old_token.used = True

    # Generate a cryptographically secure raw token (never stored)
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    reset_record = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_TTL_MINUTES),
    )
    db.add(reset_record)
    await db.commit()

    # Send email — fire-and-forget; log failure but still return success to user
    email_sent = await send_reset_email(to_email=user.email, reset_token=raw_token)
    if not email_sent:
        logger.warning("Reset email delivery failed — token stored but not delivered", user_id=str(user.id))

    logger.info("Password reset requested", user_id=str(user.id), email_sent=email_sent)
    return ForgotPasswordResponse(
        message="If that email is registered, you'll receive a reset link shortly."
    )


@router.post("/reset-password", status_code=status.HTTP_200_OK, response_model=ResetPasswordResponse)
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)) -> ResetPasswordResponse:
    """
    Consume a reset token and update the user's password.

    Validates:
      - Token exists in DB (by SHA-256 hash)
      - Token has not been used
      - Token has not expired (15-minute TTL)

    On success: updates password_hash on the user, marks token as used.
    """
    token_hash = hashlib.sha256(body.token.encode()).hexdigest()

    result = await db.execute(
        select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
    )
    reset_record = result.scalar_one_or_none()

    invalid_exc = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Reset link is invalid or has expired. Please request a new one.",
    )

    if reset_record is None:
        raise invalid_exc

    if reset_record.used:
        raise invalid_exc

    now = datetime.now(timezone.utc)
    # expires_at may be timezone-naive (stored as UTC without tz info) — normalise
    expires_at = reset_record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if now > expires_at:
        raise invalid_exc

    # Load the user and update their password
    user_result = await db.execute(select(User).where(User.id == reset_record.user_id))
    user = user_result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise invalid_exc

    user.password_hash = bcrypt.hashpw(body.new_password.encode(), bcrypt.gensalt()).decode()
    reset_record.used = True
    await db.commit()

    logger.info("Password reset successful", user_id=str(user.id))
    return ResetPasswordResponse(message="Password updated successfully. You can now log in.")

