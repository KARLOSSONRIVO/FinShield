"""
Incremental training utilities.

Provides logic for determining when models should be retrained based on
new data availability and time elapsed since last training.
"""
import logging
from datetime import datetime
from typing import Dict, Optional, Tuple

logger = logging.getLogger(__name__)


def get_training_metadata(org_id: str) -> Optional[Dict]:
    """
    Get metadata from the last training run for an organization.
    
    Args:
        org_id: Organization ID
    
    Returns:
        Metadata dictionary or None if no previous training
    """
    try:
        import sys
        import os
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
        
        from app.engines.anomaly.model_loader import get_model_metadata
        
        metadata = get_model_metadata(org_id)
        return metadata
        
    except Exception as e:
        logger.warning(f"Could not fetch training metadata: {e}")
        return None


def should_retrain(
    org_id: str,
    current_invoice_count: int,
    min_new_invoices: int = 500,
    retrain_interval_days: int = 7
) -> Tuple[bool, str]:
    """
    Determine if a model should be retrained based on incremental training rules.
    
    Retraining is triggered when:
    1. Model doesn't exist, OR
    2. Sufficient new invoices accumulated (>= min_new_invoices), OR
    3. Enough time has passed (>= retrain_interval_days)
    
    Args:
        org_id: Organization ID
        current_invoice_count: Current number of invoices
        min_new_invoices: Minimum new invoices needed to trigger retraining
        retrain_interval_days: Days between mandatory retraining
    
    Returns:
        Tuple of (should_retrain: bool, reason: str)
    """
    metadata = get_training_metadata(org_id)
    
    # Model doesn't exist - train from scratch
    if not metadata:
        return True, "No existing model found"
    
    # Parse last training date
    last_trained = metadata.get('trained_at')
    if isinstance(last_trained, str):
        try:
            last_trained = datetime.fromisoformat(last_trained)
        except ValueError:
            logger.warning(f"Could not parse training date: {last_trained}")
            last_trained = None
    
    # Calculate metrics
    last_invoice_count = metadata.get('invoice_count', 0)
    new_invoice_count = current_invoice_count - last_invoice_count
    days_since_training = (
        (datetime.now() - last_trained).days
        if last_trained else 999
    )
    
    logger.info(f"📊 Training status for org {org_id}:")
    logger.info(f"  Last trained: {last_trained.strftime('%Y-%m-%d') if last_trained else 'Unknown'}")
    logger.info(f"  Days since training: {days_since_training}")
    logger.info(f"  Previous invoice count: {last_invoice_count}")
    logger.info(f"  Current invoice count: {current_invoice_count}")
    logger.info(f"  New invoices: {new_invoice_count}")
    
    # Check retraining conditions
    if new_invoice_count >= min_new_invoices:
        reason = (
            f"{new_invoice_count} new invoices "
            f"(>= {min_new_invoices} threshold)"
        )
        logger.info(f"✅ Retraining needed: {reason}")
        return True, reason
    
    if days_since_training >= retrain_interval_days:
        reason = (
            f"{days_since_training} days since last training "
            f"(>= {retrain_interval_days} days threshold)"
        )
        logger.info(f"✅ Retraining needed: {reason}")
        return True, reason
    
    # Model is up-to-date
    reason = (
        f"Need {min_new_invoices - new_invoice_count} more invoices OR "
        f"wait {retrain_interval_days - days_since_training} more days"
    )
    logger.info(f"⏸️ Skipping retraining: {reason}")
    
    return False, reason


def update_training_metadata(
    org_id: str,
    invoice_count: int,
    model_metrics: Dict
):
    """
    Update training metadata after a successful training run.
    
    Args:
        org_id: Organization ID
        invoice_count: Number of invoices used for training
        model_metrics: Performance metrics from training
    """
    metadata = {
        'org_id': org_id,
        'trained_at': datetime.now().isoformat(),
        'invoice_count': invoice_count,
        'metrics': model_metrics
    }
    
    logger.info(f"✅ Training metadata updated for org {org_id}")
    logger.info(f"  Invoice count: {invoice_count}")
    logger.info(f"  Metrics: {model_metrics}")
    
    return metadata
