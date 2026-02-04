"""
Model loader with S3 storage and in-memory caching

Provides efficient model loading from AWS S3 with automatic caching.
First request downloads from S3 (~150ms), subsequent requests use cache (<1ms).
"""

import os
import boto3
import joblib
import logging
from io import BytesIO
from typing import Optional
from botocore.exceptions import ClientError

from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize S3 client
s3_client = None

def _get_s3_client():
    """Lazy initialization of S3 client"""
    global s3_client
    if s3_client is None:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
    return s3_client

# Global in-memory cache
MODEL_CACHE = {}

def get_model_from_s3(org_id: str):
    """
    Load Isolation Forest model from S3 with caching
    
    Performance:
        - First call: ~150ms (S3 download + deserialization)
        - Cached calls: <1ms (from memory)
    
    Args:
        org_id: Organization ID (MongoDB ObjectId as string)
    
    Returns:
        Trained Isolation Forest model or None if not found
    
    Example:
        >>> model = get_model_from_s3('507f1f77bcf86cd799439011')
        >>> if model:
        >>>     score = model.decision_function([features])
    """
    # Check cache first
    if org_id in MODEL_CACHE:
        logger.debug(f"Model cache HIT for org {org_id}")
        return MODEL_CACHE[org_id]
    
    logger.info(f"Model cache MISS for org {org_id}, downloading from S3...")
    
    try:
        client = _get_s3_client()
        
        # Download from S3
        s3_key = f'models/org_{org_id}_anomaly.pkl.gz'
        
        buffer = BytesIO()
        client.download_fileobj(
            settings.MODEL_BUCKET_NAME,
            s3_key,
            buffer
        )
        buffer.seek(0)
        
        # Deserialize model
        model = joblib.load(buffer)
        
        # Cache for future requests
        MODEL_CACHE[org_id] = model
        
        logger.info(f"✅ Model loaded and cached for org {org_id}")
        return model
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code in ['NoSuchKey', '404']:
            logger.warning(f"No model found in S3 for org {org_id}")
        else:
            logger.error(f"S3 error loading model for org {org_id}: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error loading model for org {org_id}: {e}")
        return None


def save_model_to_s3(org_id: str, model) -> str:
    """
    Save trained model to S3 with compression
    
    Args:
        org_id: Organization ID
        model: Trained Isolation Forest model
    
    Returns:
        S3 key path
    
    Raises:
        Exception: If upload fails
    
    Example:
        >>> from sklearn.ensemble import IsolationForest
        >>> model = IsolationForest()
        >>> model.fit(training_data)
        >>> s3_key = save_model_to_s3('org_123', model)
    """
    try:
        client = _get_s3_client()
        
        # Serialize with compression (reduces size by ~60%)
        buffer = BytesIO()
        joblib.dump(model, buffer, compress=3)
        buffer.seek(0)
        
        # Upload to S3
        s3_key = f'models/org_{org_id}_anomaly.pkl.gz'
        client.upload_fileobj(
            buffer,
            settings.MODEL_BUCKET_NAME,
            s3_key,
            ExtraArgs={
                'ContentType': 'application/octet-stream'
            }
        )
        
        logger.info(f"✅ Model uploaded to S3: {s3_key}")
        return s3_key
        
    except Exception as e:
        logger.error(f"Error saving model to S3 for org {org_id}: {e}")
        raise


def clear_model_cache(org_id: Optional[str] = None):
    """
    Clear cached models (call after retraining)
    
    Args:
        org_id: Clear specific org model, or None to clear all
    
    Example:
        >>> # After retraining a specific org
        >>> clear_model_cache('org_123')
        >>> 
        >>> # Clear all cached models (on API restart)
        >>> clear_model_cache()
    """
    if org_id:
        MODEL_CACHE.pop(org_id, None)
        logger.info(f"Cleared cache for org {org_id}")
    else:
        count = len(MODEL_CACHE)
        MODEL_CACHE.clear()
        logger.info(f"Cleared all model cache ({count} models)")


def get_cache_stats() -> dict:
    """
    Get cache statistics for monitoring
    
    Returns:
        Dict with cache info
    
    Example:
        >>> stats = get_cache_stats()
        >>> print(f"Cached models: {stats['cached_models']}")
    """
    return {
        'cached_models': len(MODEL_CACHE),
        'organizations': list(MODEL_CACHE.keys()),
        'memory_estimate_mb': len(MODEL_CACHE) * 5  # Rough estimate: 5MB per model
    }
