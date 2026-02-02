"""
Model loader for Fraud Detection with S3 storage and in-memory caching

Provides efficient model loading from AWS S3 with automatic caching.
Uses a GLOBAL model (not per-org) since fraud patterns are organization-agnostic.
"""

import os
import json
import boto3
import joblib
import logging
from io import BytesIO
from typing import Optional, Dict, Any
from datetime import datetime
from botocore.exceptions import ClientError

from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize S3 client
s3_client = None

# S3 keys for fraud model
S3_MODEL_KEY = 'models/fraud_model_rf.pkl.gz'
S3_METADATA_KEY = 'models/fraud_model_metadata.json'

# Local fallback paths (in models folder)
LOCAL_MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'models', 'fraud_model_rf.pkl')
LOCAL_METADATA_PATH = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'models', 'fraud_model_metadata.json')


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


# Global in-memory cache (single model for all orgs)
_FRAUD_MODEL_CACHE: Dict[str, Any] = {
    'model': None,
    'metadata': None,
    'loaded_at': None
}


def get_fraud_model():
    """
    Load Fraud Detection Random Forest model
    
    Loading priority:
        1. In-memory cache (fastest, <1ms)
        2. S3 bucket (~150ms)
        3. Local file fallback (~50ms)
        4. None if not found
    
    Returns:
        Trained Random Forest model or None if not found
    
    Example:
        >>> model = get_fraud_model()
        >>> if model:
        >>>     prediction = model.predict([features])
        >>>     proba = model.predict_proba([features])[:, 1]
    """
    # Check cache first
    if _FRAUD_MODEL_CACHE['model'] is not None:
        logger.debug("Fraud model cache HIT")
        return _FRAUD_MODEL_CACHE['model']
    
    logger.info("Fraud model cache MISS, attempting to load...")
    
    # Try S3 first
    model = _load_from_s3()
    
    # Fall back to local file
    if model is None:
        model = _load_from_local()
    
    # Cache if loaded
    if model is not None:
        _FRAUD_MODEL_CACHE['model'] = model
        _FRAUD_MODEL_CACHE['loaded_at'] = datetime.now().isoformat()
        logger.info("✅ Fraud model loaded and cached")
    else:
        logger.warning("⚠️ No fraud model available - ML scoring disabled")
    
    return model


def _load_from_s3():
    """Load model from S3"""
    try:
        client = _get_s3_client()
        
        buffer = BytesIO()
        client.download_fileobj(
            settings.MODEL_BUCKET_NAME,
            S3_MODEL_KEY,
            buffer
        )
        buffer.seek(0)
        
        model = joblib.load(buffer)
        logger.info(f"✅ Fraud model loaded from S3: {S3_MODEL_KEY}")
        
        # Also load metadata
        _load_metadata_from_s3()
        
        return model
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code in ['NoSuchKey', '404']:
            logger.warning(f"Fraud model not found in S3: {S3_MODEL_KEY}")
        else:
            logger.error(f"S3 error loading fraud model: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error loading fraud model from S3: {e}")
        return None


def _load_from_local():
    """Load model from local file"""
    try:
        if os.path.exists(LOCAL_MODEL_PATH):
            model = joblib.load(LOCAL_MODEL_PATH)
            logger.info(f"✅ Fraud model loaded from local: {LOCAL_MODEL_PATH}")
            
            # Also load local metadata
            if os.path.exists(LOCAL_METADATA_PATH):
                with open(LOCAL_METADATA_PATH, 'r') as f:
                    _FRAUD_MODEL_CACHE['metadata'] = json.load(f)
            
            return model
        else:
            logger.debug(f"Local fraud model not found: {LOCAL_MODEL_PATH}")
            return None
    except Exception as e:
        logger.error(f"Error loading local fraud model: {e}")
        return None


def _load_metadata_from_s3():
    """Load model metadata from S3"""
    try:
        client = _get_s3_client()
        
        buffer = BytesIO()
        client.download_fileobj(
            settings.MODEL_BUCKET_NAME,
            S3_METADATA_KEY,
            buffer
        )
        buffer.seek(0)
        
        metadata = json.loads(buffer.read().decode('utf-8'))
        _FRAUD_MODEL_CACHE['metadata'] = metadata
        logger.debug("Fraud model metadata loaded from S3")
        
    except Exception as e:
        logger.debug(f"Could not load metadata from S3: {e}")


def save_fraud_model_to_s3(model, metadata: Optional[dict] = None) -> str:
    """
    Save trained fraud model to S3 with compression and metadata
    
    Args:
        model: Trained Random Forest model
        metadata: Training metadata (accuracy, precision, etc.)
    
    Returns:
        S3 key path
    
    Raises:
        Exception: If upload fails
    
    Example:
        >>> from sklearn.ensemble import RandomForestClassifier
        >>> model = RandomForestClassifier()
        >>> model.fit(X_train, y_train)
        >>> metadata = {'accuracy': 0.95, 'trained_at': '2026-02-02'}
        >>> s3_key = save_fraud_model_to_s3(model, metadata)
    """
    try:
        client = _get_s3_client()
        
        # Serialize with compression (reduces size by ~60%)
        buffer = BytesIO()
        joblib.dump(model, buffer, compress=3)
        buffer.seek(0)
        
        # Upload model to S3
        client.upload_fileobj(
            buffer,
            settings.MODEL_BUCKET_NAME,
            S3_MODEL_KEY,
            ExtraArgs={'ContentType': 'application/octet-stream'}
        )
        
        logger.info(f"✅ Fraud model uploaded to S3: {S3_MODEL_KEY}")
        
        # Save metadata if provided
        if metadata:
            metadata_json = BytesIO(json.dumps(metadata, indent=2).encode('utf-8'))
            client.upload_fileobj(
                metadata_json,
                settings.MODEL_BUCKET_NAME,
                S3_METADATA_KEY,
                ExtraArgs={'ContentType': 'application/json'}
            )
            logger.info(f"✅ Fraud model metadata uploaded: {S3_METADATA_KEY}")
        
        # Clear cache so new model is loaded on next request
        clear_fraud_model_cache()
        
        return S3_MODEL_KEY
        
    except Exception as e:
        logger.error(f"Error saving fraud model to S3: {e}")
        raise


def get_fraud_model_metadata() -> Optional[dict]:
    """
    Retrieve training metadata for the fraud model
    
    Returns:
        Metadata dict or None if not found
    """
    # Check cache
    if _FRAUD_MODEL_CACHE['metadata']:
        return _FRAUD_MODEL_CACHE['metadata']
    
    # Try loading from S3
    _load_metadata_from_s3()
    return _FRAUD_MODEL_CACHE['metadata']


def clear_fraud_model_cache():
    """
    Clear cached fraud model (call after retraining)
    
    Example:
        >>> # After retraining the model
        >>> clear_fraud_model_cache()
    """
    _FRAUD_MODEL_CACHE['model'] = None
    _FRAUD_MODEL_CACHE['metadata'] = None
    _FRAUD_MODEL_CACHE['loaded_at'] = None
    logger.info("Fraud model cache cleared")


def get_cache_stats() -> dict:
    """
    Get fraud model cache statistics for monitoring
    
    Returns:
        Dict with cache info
    """
    return {
        'model_loaded': _FRAUD_MODEL_CACHE['model'] is not None,
        'loaded_at': _FRAUD_MODEL_CACHE['loaded_at'],
        'has_metadata': _FRAUD_MODEL_CACHE['metadata'] is not None,
        'metadata': _FRAUD_MODEL_CACHE['metadata']
    }


def is_model_available() -> bool:
    """
    Check if fraud model is available without loading it
    
    Returns:
        True if model is cached or available to load
    """
    if _FRAUD_MODEL_CACHE['model'] is not None:
        return True
    
    # Check S3
    try:
        client = _get_s3_client()
        client.head_object(
            Bucket=settings.MODEL_BUCKET_NAME,
            Key=S3_MODEL_KEY
        )
        return True
    except:
        pass
    
    # Check local
    return os.path.exists(LOCAL_MODEL_PATH)
