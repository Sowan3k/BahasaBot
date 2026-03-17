"""
BahasaBot — FastAPI Application Entry Point

Initializes the app, CORS, lifespan, all routers, and global error handling.
Rate limiter and Sentry are added in Phase 8 (production hardening).
"""

import os
import time
import uuid
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.routers import auth, chatbot
from backend.utils.cache import close_redis, init_redis
from backend.utils.logger import get_logger, setup_logging

# Import all models so they are registered on Base.metadata at startup.
# Required for Alembic autogenerate to pick up all tables.
import backend.models.chatbot  # noqa: F401
import backend.models.course   # noqa: F401
import backend.models.document  # noqa: F401
import backend.models.progress  # noqa: F401
import backend.models.quiz      # noqa: F401
import backend.models.user      # noqa: F401

load_dotenv()

setup_logging()
logger = get_logger(__name__)

APP_ENV = os.getenv("APP_ENV", "development")
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")]


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: connect Redis, seed RAG corpus. Shutdown: close Redis."""
    logger.info("BahasaBot starting", env=APP_ENV, origins=ALLOWED_ORIGINS)
    await init_redis()

    # Seed the Malay language corpus into pgvector on first startup
    try:
        from backend.db.database import AsyncSessionLocal
        from backend.services.rag_service import ingest_corpus_if_empty
        async with AsyncSessionLocal() as db:
            await ingest_corpus_if_empty(db)
    except Exception as exc:
        logger.error("RAG corpus seeding failed — app will continue without it", error=str(exc))

    yield
    await close_redis()
    logger.info("BahasaBot shutting down")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="BahasaBot API",
    description="AI-powered Bahasa Melayu learning platform — FastAPI backend",
    version="1.0.0",
    docs_url="/docs" if APP_ENV != "production" else None,
    redoc_url="/redoc" if APP_ENV != "production" else None,
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request logging middleware ────────────────────────────────────────────────

@app.middleware("http")
async def request_logging_middleware(request: Request, call_next) -> Response:
    """Log each request with method, path, status code, and duration."""
    request_id = str(uuid.uuid4())[:8]
    start = time.perf_counter()

    response = await call_next(request)

    duration_ms = round((time.perf_counter() - start) * 1000, 1)
    logger.info(
        "request",
        request_id=request_id,
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        duration_ms=duration_ms,
    )
    return response


# ── Global error handler ──────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "code": 500},
    )


# ── Routes ────────────────────────────────────────────────────────────────────

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["chatbot"])


@app.get("/health", tags=["health"])
async def health() -> dict:
    """Health check — returns Redis status alongside app status."""
    from backend.utils.cache import _client
    redis_ok = False
    if _client() is not None:
        try:
            await _client().ping()
            redis_ok = True
        except Exception:
            pass
    return {"status": "ok", "redis": "ok" if redis_ok else "unavailable"}
