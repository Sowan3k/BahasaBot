"""
Redis Cache Utilities

Async Redis wrapper using redis[asyncio].
All values are serialised with orjson (fast, handles UUIDs and datetimes).

Functions:
  cache_get(key)               — fetch a cached value; returns None on miss or Redis error
  cache_set(key, value, ttl)   — store a value with a TTL in seconds
  cache_delete(key)            — remove a single key
  cache_delete_pattern(pat)    — remove all keys matching a glob pattern

Graceful degradation: every function catches Redis errors and returns None / False
so the app continues to work without caching if Redis is unavailable.
"""

import os
from typing import Any

import orjson
import redis.asyncio as aioredis

from backend.utils.logger import get_logger

logger = get_logger(__name__)

# Module-level client — initialised on app startup via init_redis()
_redis: aioredis.Redis | None = None


async def init_redis() -> None:
    """Create and store the async Redis client. Called from app lifespan startup."""
    global _redis
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    try:
        _redis = aioredis.from_url(redis_url, decode_responses=False)
        await _redis.ping()
        logger.info("Redis connected", url=redis_url.split("@")[-1])  # hide credentials in log
    except Exception as exc:
        logger.warning("Redis unavailable — caching disabled", error=str(exc))
        _redis = None


async def close_redis() -> None:
    """Close the Redis connection. Called from app lifespan shutdown."""
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None
        logger.info("Redis connection closed")


def _client() -> aioredis.Redis | None:
    return _redis


async def cache_get(key: str) -> Any | None:
    """
    Fetch a value from Redis. Returns None on cache miss or any Redis error.

    Usage:
        data = await cache_get("dashboard:user:abc123")
    """
    client = _client()
    if client is None:
        return None
    try:
        raw = await client.get(key)
        if raw is None:
            return None
        return orjson.loads(raw)
    except Exception as exc:
        logger.warning("cache_get failed", key=key, error=str(exc))
        return None


async def cache_set(key: str, value: Any, ttl: int = 300) -> bool:
    """
    Store a value in Redis with a TTL (seconds). Returns True on success.

    Default TTL: 300 seconds (5 minutes)

    Usage:
        await cache_set("dashboard:user:abc123", data, ttl=300)
    """
    client = _client()
    if client is None:
        return False
    try:
        await client.set(key, orjson.dumps(value), ex=ttl)
        return True
    except Exception as exc:
        logger.warning("cache_set failed", key=key, error=str(exc))
        return False


async def cache_delete(key: str) -> bool:
    """
    Remove a single key from Redis. Returns True on success.

    Usage:
        await cache_delete("dashboard:user:abc123")
    """
    client = _client()
    if client is None:
        return False
    try:
        await client.delete(key)
        return True
    except Exception as exc:
        logger.warning("cache_delete failed", key=key, error=str(exc))
        return False


async def cache_delete_pattern(pattern: str) -> int:
    """
    Delete all keys matching a glob pattern. Returns count of deleted keys.

    Usage:
        await cache_delete_pattern("dashboard:user:abc123:*")
    """
    client = _client()
    if client is None:
        return 0
    try:
        keys = await client.keys(pattern)
        if keys:
            return await client.delete(*keys)
        return 0
    except Exception as exc:
        logger.warning("cache_delete_pattern failed", pattern=pattern, error=str(exc))
        return 0
