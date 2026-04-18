"""
Database Configuration

Sets up the async SQLAlchemy engine (asyncpg) and session factory.
Provides get_db() FastAPI dependency for injecting DB sessions into routes.

Note: SYNC_DATABASE_URL (psycopg2) is used only by Alembic migrations.
      All runtime DB access uses this async engine (asyncpg).
"""

import os
from collections.abc import AsyncGenerator
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

# Explicit path — database.py lives in backend/db/, .env is in backend/
load_dotenv(Path(__file__).parent.parent / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set")

# Async engine — asyncpg driver
# connect_args notes:
#   statement_cache_size=0  — required for Neon PgBouncer (transaction mode).
#     asyncpg caches prepared statements per connection; PgBouncer recycles the
#     underlying server connection after each transaction, so the server no longer
#     has those statements. Setting cache size to 0 disables the cache entirely.
engine = create_async_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=240,  # recycle before Neon's 5-min idle timeout
    connect_args={"statement_cache_size": 0},
    echo=False,
)

# Session factory — used in get_db() dependency
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields an async DB session.
    Usage: db: AsyncSession = Depends(get_db)
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
