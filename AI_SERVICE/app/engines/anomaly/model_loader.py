import logging
from typing import Optional

from app.core.config import settings
from app.utils.ml import load_model_from_s3, save_model_to_s3, clear_cache

logger = logging.getLogger(__name__)

def get_model_from_s3(org_id: str):
    """Load Isolation Forest model from S3 with caching"""
    s3_key = f'models/org_{org_id}_anomaly.pkl.gz'
    return load_model_from_s3(s3_key)

def save_model_to_s3_explicit(org_id: str, model, metadata: Optional[dict] = None) -> str:
    """Save trained model to S3 with compression and metadata"""
    s3_key = f'models/org_{org_id}_anomaly.pkl.gz'
    return save_model_to_s3(model, s3_key, metadata=metadata)

def clear_model_cache(org_id: Optional[str] = None):
    """Clear cached models (call after retraining)"""
    if org_id:
        s3_key = f'models/org_{org_id}_anomaly.pkl.gz'
        clear_cache(s3_key)
    else:
        clear_cache()
