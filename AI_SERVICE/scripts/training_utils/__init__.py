"""
Training utilities for ML model training scripts.

This package provides reusable components for:
- Data loading from MongoDB
- Smart sampling strategies
- Model training & evaluation
- Model persistence and S3 upload
- Incremental training logic
"""

from .data_loader import fetch_invoices_for_training, fetch_labeled_fraud_data
from .sampler import smart_sample
from .trainer import train_isolation_forest, train_random_forest, split_train_test
from .evaluator import evaluate_classification_model, validate_metrics
from .persistence import save_model_local, backup_model, upload_model_to_s3
from .incremental import should_retrain, get_training_metadata

__all__ = [
    # Data loading
    'fetch_invoices_for_training',
    'fetch_labeled_fraud_data',
    # Sampling
    'smart_sample',
    # Training
    'train_isolation_forest',
    'train_random_forest',
    'split_train_test',
    # Evaluation
    'evaluate_classification_model',
    'validate_metrics',
    # Persistence
    'save_model_local',
    'backup_model',
    'upload_model_to_s3',
    # Incremental
    'should_retrain',
    'get_training_metadata',
]
