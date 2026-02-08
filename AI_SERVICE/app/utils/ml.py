import os
import joblib
import logging
import json
from io import BytesIO
from typing import Optional, Dict, Any
from botocore.exceptions import ClientError
from app.core.config import settings
from app.core.s3 import get_s3_client

logger = logging.getLogger(__name__)

# Global in-memory cache for models
_MODEL_CACHE: Dict[str, Any] = {}

def load_model_from_s3(s3_key: str, bucket: str = None) -> Optional[Any]:
    """Load a model from S3 with caching on the key"""
    if s3_key in _MODEL_CACHE:
        return _MODEL_CACHE[s3_key]
    
    bucket = bucket or settings.MODEL_BUCKET_NAME
    try:
        client = get_s3_client()
        buffer = BytesIO()
        client.download_fileobj(bucket, s3_key, buffer)
        buffer.seek(0)
        model = joblib.load(buffer)
        _MODEL_CACHE[s3_key] = model
        return model
    except Exception as e:
        logger.error(f"Failed to load model from S3 ({s3_key}): {e}")
        return None

def save_model_to_s3(model, s3_key: str, bucket: str = None, metadata: dict = None):
    """Save a model to S3 and clear cache for that key"""
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
            
        # Clear cache for this key
        _MODEL_CACHE.pop(s3_key, None)
        return s3_key
    except Exception as e:
        logger.error(f"Failed to save model to S3 ({s3_key}): {e}")
        raise

def clear_cache(key: str = None):
    """Clear specific cache entry or everything"""
    if key:
        _MODEL_CACHE.pop(key, None)
    else:
        _MODEL_CACHE.clear()
