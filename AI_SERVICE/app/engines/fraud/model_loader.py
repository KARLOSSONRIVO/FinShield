import os
import json
import joblib
import logging
from io import BytesIO
from datetime import datetime
from botocore.exceptions import ClientError
from app.core.config import settings
from app.core.constants import (
    FRAUD_S3_MODEL_KEY as S3_MODEL_KEY,
    FRAUD_S3_METADATA_KEY as S3_METADATA_KEY,
    FRAUD_LOCAL_MODEL_PATH as LOCAL_MODEL_PATH,
    FRAUD_LOCAL_METADATA_PATH as LOCAL_METADATA_PATH
)
from .loader.client import get_s3_client

logger = logging.getLogger(__name__)

_FRAUD_MODEL_CACHE = {
    'model': None,
    'metadata': None,
    'loaded_at': None
}

def get_fraud_model():
    if _FRAUD_MODEL_CACHE['model'] is not None:
        return _FRAUD_MODEL_CACHE['model']
    
    model = _load_from_s3()
    if model is None:
        model = _load_from_local()
    
    if model is not None:
        _FRAUD_MODEL_CACHE['model'] = model
        _FRAUD_MODEL_CACHE['loaded_at'] = datetime.now().isoformat()
        logger.info("✅ Fraud model loaded and cached")
    
    return model

def _load_from_s3():
    try:
        client = get_s3_client()
        buffer = BytesIO()
        client.download_fileobj(settings.MODEL_BUCKET_NAME, S3_MODEL_KEY, buffer)
        buffer.seek(0)
        model = joblib.load(buffer)
        _load_metadata_from_s3()
        return model
    except Exception as e:
        logger.debug(f"S3 model load failed: {e}")
        return None

def _load_from_local():
    try:
        if os.path.exists(LOCAL_MODEL_PATH):
            model = joblib.load(LOCAL_MODEL_PATH)
            if os.path.exists(LOCAL_METADATA_PATH):
                with open(LOCAL_METADATA_PATH, 'r') as f:
                    _FRAUD_MODEL_CACHE['metadata'] = json.load(f)
            return model
    except Exception as e:
        logger.error(f"Local model load error: {e}")
        return None

def _load_metadata_from_s3():
    try:
        client = get_s3_client()
        buffer = BytesIO()
        client.download_fileobj(settings.MODEL_BUCKET_NAME, S3_METADATA_KEY, buffer)
        buffer.seek(0)
        _FRAUD_MODEL_CACHE['metadata'] = json.loads(buffer.read().decode('utf-8'))
    except Exception:
        pass

def save_fraud_model_to_s3(model, metadata=None):
    try:
        client = get_s3_client()
        buffer = BytesIO()
        joblib.dump(model, buffer, compress=3)
        buffer.seek(0)
        client.upload_fileobj(buffer, settings.MODEL_BUCKET_NAME, S3_MODEL_KEY)
        if metadata:
            meta_json = BytesIO(json.dumps(metadata, indent=2).encode('utf-8'))
            client.upload_fileobj(meta_json, settings.MODEL_BUCKET_NAME, S3_METADATA_KEY)
        clear_fraud_model_cache()
        return S3_MODEL_KEY
    except Exception as e:
        logger.error(f"Error saving model: {e}")
        raise

def get_fraud_model_metadata():
    if _FRAUD_MODEL_CACHE['metadata']:
        return _FRAUD_MODEL_CACHE['metadata']
    _load_metadata_from_s3()
    return _FRAUD_MODEL_CACHE['metadata']

def clear_fraud_model_cache():
    _FRAUD_MODEL_CACHE['model'] = None
    _FRAUD_MODEL_CACHE['metadata'] = None
    _FRAUD_MODEL_CACHE['loaded_at'] = None

def get_cache_stats():
    return {
        'model_loaded': _FRAUD_MODEL_CACHE['model'] is not None,
        'loaded_at': _FRAUD_MODEL_CACHE['loaded_at'],
        'has_metadata': _FRAUD_MODEL_CACHE['metadata'] is not None
    }

def is_model_available():
    if _FRAUD_MODEL_CACHE['model'] is not None: return True
    try:
        get_s3_client().head_object(Bucket=settings.MODEL_BUCKET_NAME, Key=S3_MODEL_KEY)
        return True
    except: pass
    return os.path.exists(LOCAL_MODEL_PATH)
