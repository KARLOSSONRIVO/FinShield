import os
import logging
from typing import Optional
from app.core.config import settings
from app.core.constants import (
    FRAUD_S3_MODEL_KEY as S3_MODEL_KEY,
    FRAUD_LOCAL_MODEL_PATH as LOCAL_MODEL_PATH,
)
from app.utils.ml import load_model_from_s3, save_model_to_s3, clear_cache
import joblib

logger = logging.getLogger(__name__)

def get_fraud_model():
    """Load fraud model with caching"""
    # Try S3 first via centralized loader
    model = load_model_from_s3(S3_MODEL_KEY)
    if model is None:
        # Fallback to local
        model = _load_from_local()
    return model

def _load_from_local():
    try:
        if os.path.exists(LOCAL_MODEL_PATH):
            return joblib.load(LOCAL_MODEL_PATH)
    except Exception as e:
        logger.error(f"Local model load error: {e}")
    return None

def save_fraud_model_to_s3_explicit(model, metadata=None):
    """Save fraud model to S3"""
    return save_model_to_s3(model, S3_MODEL_KEY, metadata=metadata)

def clear_fraud_model_cache():
    """Clear memory cache for fraud model"""
    clear_cache(S3_MODEL_KEY)

def is_model_available():
    """Check if model exists in S3 or locally"""
    # Simple check for availability
    if load_model_from_s3(S3_MODEL_KEY) is not None:
        return True
    return os.path.exists(LOCAL_MODEL_PATH)
