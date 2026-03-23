"""
Rate Limiter (SlowAPI)

Limits:
  - Default:           60 req/min per IP
  - Chatbot:           20 req/min per user
  - Course generation:  5 req/hour per user
  - Auth endpoints:    10 req/min per IP

Usage in routers:
    from backend.middleware.rate_limiter import limiter
    from slowapi import _rate_limit_exceeded_handler
    from slowapi.errors import RateLimitExceeded

    @router.post("/message")
    @limiter.limit("20/minute")
    async def send_message(request: Request, ...):
        ...

In main.py:
    from slowapi import _rate_limit_exceeded_handler
    from slowapi.errors import RateLimitExceeded
    from backend.middleware.rate_limiter import limiter

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
"""

import os

from jose import JWTError, jwt
from slowapi import Limiter
from slowapi.util import get_remote_address

from backend.utils.logger import get_logger

logger = get_logger(__name__)

_SECRET_KEY = os.getenv("SECRET_KEY", "")
_ALGORITHM = os.getenv("ALGORITHM", "HS256")

# ── Helpers ────────────────────────────────────────────────────────────────────


def _get_user_id_or_ip(request) -> str:
    """
    Key function: returns the authenticated user's ID when available,
    falling back to the remote IP for unauthenticated endpoints.

    Decodes the JWT from the Authorization header directly (without hitting
    the database) so rate limits are per-user before dependency injection runs.
    """
    # Try to extract user ID from Bearer JWT
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        try:
            payload = jwt.decode(token, _SECRET_KEY, algorithms=[_ALGORITHM])
            user_id = payload.get("sub")
            if user_id:
                return str(user_id)
        except JWTError:
            pass  # Invalid token — fall through to IP
    return get_remote_address(request)


# ── Limiter instance ───────────────────────────────────────────────────────────

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

limiter = Limiter(
    key_func=_get_user_id_or_ip,
    # Use Redis for distributed rate limiting across multiple workers.
    # Falls back gracefully to in-memory if Redis is unavailable.
    storage_uri=REDIS_URL,
    default_limits=["60/minute"],
    strategy="fixed-window",
)

logger.info("Rate limiter initialised", storage=REDIS_URL.split("@")[-1])

# ── Per-feature limit strings ──────────────────────────────────────────────────
# Import these in routers for the @limiter.limit(...) decorator.

CHATBOT_LIMIT = os.getenv("CHATBOT_RATE_LIMIT_PER_MINUTE", "20") + "/minute"
COURSE_GEN_LIMIT = "5/hour"
AUTH_LIMIT = "10/minute"
DEFAULT_LIMIT = os.getenv("RATE_LIMIT_PER_MINUTE", "60") + "/minute"
