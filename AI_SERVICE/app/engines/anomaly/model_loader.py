import logging
from typing import Optional

from app.core.config import settings
from app.utils.ml import load_model_from_s3, save_model_to_s3 as _save_model_to_s3_util, clear_cache

logger = logging.getLogger(__name__)

def _s3_key(org_id: str) -> str:
    """S3 key for the model: models/{org_id}/anomaly.pkl.gz"""
    return f'models/{org_id}/anomaly.pkl.gz'

def get_model_from_s3(org_id: str):
    """Load Isolation Forest model from S3 with caching"""
    return load_model_from_s3(_s3_key(org_id))

def save_model_to_s3_explicit(org_id: str, model, metadata: Optional[dict] = None) -> str:
    """Save trained model to S3 with compression and metadata"""
    return _save_model_to_s3_util(model, _s3_key(org_id), metadata=metadata)

def save_model_to_s3(org_id: str, model, metadata: Optional[dict] = None) -> str:
    """Save trained model to S3 — called by train_anomaly_models.py as save_model_to_s3(org_id, model, metadata)"""
    return _save_model_to_s3_util(model, _s3_key(org_id), metadata=metadata)

def clear_model_cache(org_id: Optional[str] = None):
    """Clear cached models (call after retraining)"""
    if org_id:
        clear_cache(_s3_key(org_id))
    else:
        clear_cache()
