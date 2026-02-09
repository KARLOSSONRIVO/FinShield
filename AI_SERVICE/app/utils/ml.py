import os
import joblib
import pickle
import logging
import json
from io import BytesIO
from typing import Optional, Dict, Any
from botocore.exceptions import ClientError
from app.core.config import settings
from app.core.s3 import get_s3_client
from app.core.redis_client import get_redis_binary_client, is_redis_available

logger = logging.getLogger(__name__)

# Local in-memory fallback (used when Redis is unavailable)
_LOCAL_CACHE: Dict[str, Any] = {}

# Default TTL for model cache: 24 hours
MODEL_CACHE_TTL = 86400


def load_model_from_s3(s3_key: str, bucket: str = None, ttl: int = MODEL_CACHE_TTL) -> Optional[Any]:
    """
    Load a model from S3 with Redis shared cache.
    
    Cache strategy (3 tiers):
        1. Redis (shared across all workers) — checked first
        2. Local dict (per-worker fallback if Redis is down) — checked second
        3. S3 download (cold miss) — downloads and caches to Redis + local
    
    Args:
        s3_key: S3 object key (e.g., 'models/fraud_model_rf.pkl.gz')
        bucket: S3 bucket name (defaults to MODEL_BUCKET_NAME)
        ttl: Redis cache TTL in seconds (default 24 hours)
    
    Returns:
        Loaded model object or None
    """
    cache_key = f"model:{s3_key}"
    
    # --- Tier 1: Check Redis (shared across all workers) ---
    if is_redis_available():
        try:
            client = get_redis_binary_client()
            if client:
                cached_bytes = client.get(cache_key)
                if cached_bytes:
                    model = pickle.loads(cached_bytes)
                    # Also store locally to avoid repeated Redis round-trips
                    _LOCAL_CACHE[s3_key] = model
                    logger.info(f"✅ Model cache HIT (Redis shared): {s3_key}")
                    return model
        except Exception as e:
            logger.warning(f"Redis model get failed for {s3_key}: {e}")
    
    # --- Tier 2: Check local fallback (this worker only) ---
    if s3_key in _LOCAL_CACHE:
        logger.info(f"✅ Model cache HIT (local fallback): {s3_key}")
        return _LOCAL_CACHE[s3_key]
    
    # --- Tier 3: Download from S3 (cold miss) ---
    logger.info(f"⚠️  Model cache MISS, downloading from S3: {s3_key}")
    bucket = bucket or settings.MODEL_BUCKET_NAME
    try:
        client = get_s3_client()
        buffer = BytesIO()
        client.download_fileobj(bucket, s3_key, buffer)
        buffer.seek(0)
        model = joblib.load(buffer)
        
        # Cache to Redis (all workers benefit immediately)
        if is_redis_available():
            try:
                redis_client = get_redis_binary_client()
                if redis_client:
                    model_bytes = pickle.dumps(model, protocol=pickle.HIGHEST_PROTOCOL)
                    redis_client.setex(cache_key, ttl, model_bytes)
                    logger.info(f"📦 Cached model in Redis (shared): {s3_key} (TTL: {ttl}s)")
            except Exception as e:
                logger.warning(f"Failed to cache model to Redis: {e}")
        
        # Also cache locally
        _LOCAL_CACHE[s3_key] = model
        
        return model
    except Exception as e:
        logger.error(f"Failed to load model from S3 ({s3_key}): {e}")
        return None


def save_model_to_s3(model, s3_key: str, bucket: str = None, metadata: dict = None):
    """
    Save a model to S3 and invalidate cache across ALL workers.
    
    After saving, clears both Redis (shared) and local cache so that
    every worker picks up the new model on next request.
    """
    bucket = bucket or settings.MODEL_BUCKET_NAME
    try:
        client = get_s3_client()
        buffer = BytesIO()
        joblib.dump(model, buffer, compress=3)
        buffer.seek(0)
        client.upload_fileobj(buffer, bucket, s3_key)
        
        if metadata:
            meta_key = s3_key.replace('.pkl.gz', '_metadata.json')
            meta_json = BytesIO(json.dumps(metadata, indent=2).encode('utf-8'))
            client.upload_fileobj(meta_json, bucket, meta_key)
            
        # Invalidate cache across ALL workers
        clear_cache(s3_key)
        logger.info(f"✅ Model saved to S3 and cache invalidated: {s3_key}")
        return s3_key
    except Exception as e:
        logger.error(f"Failed to save model to S3 ({s3_key}): {e}")
        raise


def clear_cache(key: str = None):
    """
    Clear model cache from Redis (all workers) and local memory.
    
    Args:
        key: Specific S3 key to clear, or None to clear everything
    """
    # Clear local cache
    if key:
        _LOCAL_CACHE.pop(key, None)
    else:
        _LOCAL_CACHE.clear()
    
    # Clear Redis cache (invalidates for ALL workers)
    if is_redis_available():
        try:
            redis_client = get_redis_binary_client()
            if redis_client:
                if key:
                    cache_key = f"model:{key}"
                    redis_client.delete(cache_key)
                    logger.info(f"🗑️  Model cache cleared (all workers): {key}")
                else:
                    # Clear all model keys using SCAN (safe for production)
                    cursor = 0
                    deleted_count = 0
                    while True:
                        cursor, keys = redis_client.scan(cursor, match="model:*", count=100)
                        if keys:
                            redis_client.delete(*keys)
                            deleted_count += len(keys)
                        if cursor == 0:
                            break
                    logger.info(f"🗑️  Cleared {deleted_count} model cache entries (all workers)")
        except Exception as e:
            logger.warning(f"Failed to clear Redis model cache: {e}")


def get_model_cache_stats() -> dict:
    """
    Get cache statistics for monitoring.
    
    Returns:
        dict with local and Redis cache info
    """
    stats = {
        "local_cached_models": len(_LOCAL_CACHE),
        "local_model_keys": list(_LOCAL_CACHE.keys()),
        "redis_available": False,
        "redis_model_count": 0,
        "redis_model_keys": [],
    }
    
    if is_redis_available():
        try:
            redis_client = get_redis_binary_client()
            if redis_client:
                stats["redis_available"] = True
                # Count model keys using SCAN
                cursor = 0
                model_keys = []
                while True:
                    cursor, keys = redis_client.scan(cursor, match="model:*", count=100)
                    model_keys.extend([k.decode() if isinstance(k, bytes) else k for k in keys])
                    if cursor == 0:
                        break
                stats["redis_model_count"] = len(model_keys)
                stats["redis_model_keys"] = model_keys
        except Exception as e:
            logger.warning(f"Failed to get Redis stats: {e}")
    
    return stats
