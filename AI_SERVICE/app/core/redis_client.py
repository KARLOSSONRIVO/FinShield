"""
Redis Client - Caching and distributed state management.

Provides:
- Singleton Redis client with auto-reconnect
- Cache helpers (get, set, delete, invalidate by pattern)
- Graceful degradation when Redis is unavailable
"""
import json
import logging
from typing import Optional, Any

import redis

from app.core.config import REDIS_URL

logger = logging.getLogger(__name__)

# Redis client singleton
_redis_client: Optional[redis.Redis] = None


def get_redis_client() -> Optional[redis.Redis]:
    """Get or create Redis client singleton."""
    global _redis_client

    if _redis_client is None:
        try:
            _redis_client = redis.from_url(
                REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30,
            )
            # Test connection
            _redis_client.ping()
            logger.info("✅ Redis connected")
        except Exception as e:
            logger.warning(f"⚠️  Redis connection failed: {e}")
            _redis_client = None

    return _redis_client


def is_redis_available() -> bool:
    """Check if Redis is reachable."""
    try:
        client = get_redis_client()
        return client is not None and client.ping()
    except Exception:
        return False


def cache_set(key: str, value: Any, ttl: int = 3600) -> bool:
    """
    Store a value in Redis with a TTL (seconds).

    Args:
        key: Cache key (e.g. "org:template:<org_id>")
        value: Any JSON-serializable Python object
        ttl: Time-to-live in seconds (default 1 hour)

    Returns:
        True if stored successfully, False otherwise
    """
    try:
        client = get_redis_client()
        if client:
            client.setex(key, ttl, json.dumps(value))
            return True
    except Exception as e:
        logger.error(f"Cache set error for key '{key}': {e}")
    return False


def cache_get(key: str) -> Optional[Any]:
    """
    Retrieve a value from Redis.

    Returns:
        Deserialized Python object, or None on miss / error
    """
    try:
        client = get_redis_client()
        if client:
            data = client.get(key)
            if data:
                return json.loads(data)
    except Exception as e:
        logger.error(f"Cache get error for key '{key}': {e}")
    return None


def cache_delete(key: str) -> bool:
    """Delete a single key from Redis."""
    try:
        client = get_redis_client()
        if client:
            client.delete(key)
            return True
    except Exception as e:
        logger.error(f"Cache delete error for key '{key}': {e}")
    return False


def cache_invalidate_pattern(pattern: str) -> int:
    """
    Delete all keys matching a glob pattern (e.g. "org:template:*").

    Returns:
        Number of keys deleted (0 on error or no matches)
    """
    try:
        client = get_redis_client()
        if client:
            keys = client.keys(pattern)
            if keys:
                deleted = client.delete(*keys)
                logger.info(f"🗑️  Invalidated {deleted} cache key(s) matching: {pattern}")
                return deleted
    except Exception as e:
        logger.error(f"Cache invalidation error for pattern '{pattern}': {e}")
    return 0


def close_redis() -> None:
    """Close the Redis connection gracefully."""
    global _redis_client
    if _redis_client is not None:
        try:
            _redis_client.close()
            logger.info("Redis connection closed")
        except Exception as e:
            logger.error(f"Error closing Redis: {e}")
        finally:
            _redis_client = None
