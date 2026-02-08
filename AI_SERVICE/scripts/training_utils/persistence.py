"""
Model persistence utilities.

Handles saving, loading, backing up, and uploading models.
"""
import os
import json
import logging
import shutil
from datetime import datetime
from typing import Any, Dict, Optional
import joblib

logger = logging.getLogger(__name__)


def save_model_local(
    model: Any,
    save_path: str,
    metadata: Optional[Dict] = None
):
    """
    Save a model locally with optional metadata.
    
    Args:
        model: Model object to save
        save_path: Path to save the model
        metadata: Optional metadata dictionary
    """
    # Ensure directory exists
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    
    # Save model
    joblib.dump(model, save_path)
    model_size = os.path.getsize(save_path) / (1024 * 1024)
    logger.info(f"✅ Model saved: {save_path} ({model_size:.2f} MB)")
    
    # Save metadata if provided
    if metadata:
        metadata_path = save_path.replace('.pkl', '_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        logger.info(f"✅ Metadata saved: {metadata_path}")


def load_model_local(model_path: str) -> Any:
    """
    Load a model from local storage.
    
    Args:
        model_path: Path to the model file
    
    Returns:
        Loaded model object
    """
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found: {model_path}")
    
    model = joblib.load(model_path)
    logger.info(f"✅ Model loaded: {model_path}")
    
    return model


def backup_model(
    model_path: str,
    backup_dir: str = None,
    max_backups: int = 5
):
    """
    Backup an existing model before overwriting.
    
    Args:
        model_path: Path to the model to backup
        backup_dir: Directory for backups (default: same dir + '/backups')
        max_backups: Maximum number of backups to keep
    """
    if not os.path.exists(model_path):
        logger.info("No existing model to backup")
        return
    
    # Determine backup directory
    if backup_dir is None:
        backup_dir = os.path.join(os.path.dirname(model_path), 'backups')
    
    os.makedirs(backup_dir, exist_ok=True)
    
    # Create timestamped backup
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    model_name = os.path.basename(model_path)
    backup_name = model_name.replace('.pkl', f'_{timestamp}.pkl')
    backup_path = os.path.join(backup_dir, backup_name)
    
    shutil.copy2(model_path, backup_path)
    logger.info(f"✅ Model backed up: {backup_path}")
    
    # Clean up old backups
    backups = sorted([
        f for f in os.listdir(backup_dir)
        if f.endswith('.pkl') and model_name.replace('.pkl', '') in f
    ])
    
    while len(backups) > max_backups:
        old_backup = os.path.join(backup_dir, backups.pop(0))
        os.remove(old_backup)
        logger.info(f"Removed old backup: {old_backup}")


async def upload_model_to_s3(
    model_path: str,
    s3_key: str,
    metadata: Optional[Dict] = None
):
    """
    Upload a model to S3 storage.
    
    Args:
        model_path: Local path to the model
        s3_key: S3 key (path) for storage
        metadata: Optional metadata dictionary
    """
    try:
        # Import S3 utilities
        import sys
        import os
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
        
        from app.utils.ml import save_model_to_s3
        
        # Load model
        model = load_model_local(model_path)
        
        # Upload
        save_model_to_s3(model, s3_key, metadata=metadata)
        logger.info(f"✅ Model uploaded to S3: {s3_key}")
        
    except ImportError:
        logger.warning("S3 upload skipped - app.utils.ml not available")
    except Exception as e:
        logger.error(f"❌ S3 upload failed: {e}")


def create_model_metadata(
    model_name: str,
    algorithm: str,
    feature_names: list,
    hyperparameters: dict,
    metrics: dict,
    training_info: dict
) -> Dict:
    """
    Create standardized metadata for a trained model.
    
    Args:
        model_name: Name of the model
        algorithm: Algorithm used
        feature_names: List of feature names
        hyperparameters: Model hyperparameters
        metrics: Performance metrics
        training_info: Additional training information
    
    Returns:
        Metadata dictionary
    """
    metadata = {
        'model_name': model_name,
        'version': datetime.now().strftime('%Y.%m.%d'),
        'algorithm': algorithm,
        'trained_at': datetime.now().isoformat(),
        'feature_names': feature_names,
        'n_features': len(feature_names),
        'hyperparameters': hyperparameters,
        'metrics': metrics,
        'training_info': training_info
    }
    
    return metadata
