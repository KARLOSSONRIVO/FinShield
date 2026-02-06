"""
Model evaluation utilities.

Provides functions for evaluating model performance and validating metrics.
"""
import logging
from typing import Dict
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix
)

logger = logging.getLogger(__name__)


def evaluate_classification_model(
    model,
    X_test: pd.DataFrame,
    y_test: np.ndarray
) -> Dict[str, float]:
    """
    Evaluate a classification model's performance.
    
    Args:
        model: Trained classifier
        X_test: Test features
        y_test: True labels
    
    Returns:
        Dictionary of performance metrics
    """
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    
    metrics = {
        'accuracy': accuracy_score(y_test, y_pred),
        'precision': precision_score(y_test, y_pred, zero_division=0),
        'recall': recall_score(y_test, y_pred, zero_division=0),
        'f1_score': f1_score(y_test, y_pred, zero_division=0),
        'roc_auc': roc_auc_score(y_test, y_proba) if len(np.unique(y_test)) > 1 else 0.0
    }
    
    cm = confusion_matrix(y_test, y_pred)
    metrics['confusion_matrix'] = cm.tolist()
    
    # Log results
    logger.info("=" * 50)
    logger.info("MODEL EVALUATION METRICS")
    logger.info("=" * 50)
    logger.info(f"Accuracy:  {metrics['accuracy']:.4f}")
    logger.info(f"Precision: {metrics['precision']:.4f}")
    logger.info(f"Recall:    {metrics['recall']:.4f}")
    logger.info(f"F1-Score:  {metrics['f1_score']:.4f}")
    logger.info(f"ROC-AUC:   {metrics['roc_auc']:.4f}")
    logger.info(f"Confusion Matrix:\n{cm}")
    logger.info("=" * 50)
    
    return metrics


def validate_metrics(
    metrics: Dict[str, float],
    thresholds: Dict[str, float] = None
) -> bool:
    """
    Check if model metrics meet minimum thresholds.
    
    Args:
        metrics: Dictionary of metric values
        thresholds: Dictionary of minimum thresholds
    
    Returns:
        True if all metrics meet thresholds, False otherwise
    """
    if thresholds is None:
        thresholds = {
            'accuracy': 0.80,
            'precision': 0.70,
            'recall': 0.60
        }
    
    passed = True
    
    for metric_name, threshold in thresholds.items():
        value = metrics.get(metric_name, 0.0)
        
        if value < threshold:
            logger.warning(
                f"❌ {metric_name.capitalize()} {value:.4f} "
                f"below threshold {threshold:.4f}"
            )
            passed = False
        else:
            logger.info(
                f"✅ {metric_name.capitalize()} {value:.4f} "
                f"meets threshold {threshold:.4f}"
            )
    
    return passed


def print_evaluation_summary(metrics: Dict[str, float]):
    """
    Print a formatted summary of evaluation metrics.
    
    Args:
        metrics: Dictionary of metric values
    """
    print("\n" + "=" * 60)
    print("EVALUATION SUMMARY")
    print("=" * 60)
    
    for key, value in metrics.items():
        if key != 'confusion_matrix':
            print(f"  {key.replace('_', ' ').title():15s}: {value:.4f}")
    
    if 'confusion_matrix' in metrics:
        print(f"\n  Confusion Matrix:")
        cm = np.array(metrics['confusion_matrix'])
        print(f"    {cm}")
    
    print("=" * 60 + "\n")
