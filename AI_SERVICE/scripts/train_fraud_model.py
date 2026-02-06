"""
Fraud Detection Model Retraining Script

Automated retraining pipeline for the Random Forest fraud detection model.
Can be scheduled via cron (Linux) or Task Scheduler (Windows) for monthly runs.

Usage:
    # Direct execution
    python train_fraud_model.py
    
    # With options
    python train_fraud_model.py --min-samples 500 --min-fraud 25 --dry-run
    
Windows Task Scheduler:
    schtasks /create /tn "FinShield Fraud Model Retrain" /tr "python path/to/train_fraud_model.py" /sc monthly /d 1 /st 02:00
    
Linux Cron (monthly on 1st at 2am):
    0 2 1 * * cd /path/to/AI_SERVICE && python scripts/train_fraud_model.py >> /var/log/finshield_retrain.log 2>&1
"""

import os
import sys
import json
import argparse
import logging
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Tuple

import numpy as np
import pandas as pd

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from motor.motor_asyncio import AsyncIOMotorClient

# Import training utilities
from training_utils.data_loader import fetch_labeled_fraud_data
from training_utils.trainer import train_random_forest, split_train_test
from training_utils.evaluator import evaluate_classification_model, validate_metrics
from training_utils.persistence import (
    save_model_local,
    backup_model,
    upload_model_to_s3,
    create_model_metadata
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(os.path.dirname(__file__), 'retrain.log'))
    ]
)
logger = logging.getLogger(__name__)


# ============================================================
# CONFIGURATION
# ============================================================

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
DATABASE_NAME = os.getenv('DATABASE_NAME', 'finshield')

# Training thresholds
MIN_SAMPLES = 500
MIN_FRAUD_SAMPLES = 25
MAX_SAMPLES = 50000

# Model hyperparameters
MODEL_PARAMS = {
    'n_estimators': 100,
    'max_depth': 10,
    'class_weight': 'balanced',
    'random_state': 42,
    'n_jobs': -1,
    'min_samples_split': 5,
    'min_samples_leaf': 2
}

# Minimum acceptable metrics
METRIC_THRESHOLDS = {
    'accuracy': 0.80,
    'precision': 0.70,
    'recall': 0.60
}

# Output paths
MODEL_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(MODEL_DIR, 'fraud_model_rf.pkl')
METADATA_PATH = os.path.join(MODEL_DIR, 'fraud_model_metadata.json')
BACKUP_DIR = os.path.join(MODEL_DIR, 'backups')

# Feature names (must match training notebook)
FEATURE_NAMES = [
    'total', 'subtotal', 'tax', 'tax_ratio', 'amount_log',
    'is_round_100', 'is_round_1000', 'is_round_500',
    'has_cents', 'cents_value',
    'inv_num_length', 'inv_num_has_prefix', 'inv_num_is_numeric', 'inv_num_missing',
    'issued_to_length', 'issued_to_missing', 'issued_to_is_generic',
    'date_missing', 'days_old', 'is_future', 'is_weekend', 'month', 'day_of_week', 'is_month_end',
    'line_item_count', 'has_line_items', 'avg_line_item_value',
    'max_quantity', 'avg_quantity', 'max_unit_price', 'avg_unit_price',
    'calculation_mismatches', 'single_item_dominance', 'has_high_quantity',
    'missing_fields_count', 'completeness_score'
]


# ============================================================
# FEATURE EXTRACTION
# ============================================================

def extract_features(invoice: Dict[str, Any]) -> Dict[str, float]:
    """
    Extract numerical features from an invoice for fraud detection.
    Must match exact feature extraction from training notebook.
    """
    # Import feature extraction logic from app
    try:
        from app.engines.fraud.extractor.helpers import (
            extract_amount_features,
            extract_invoice_num_features,
            extract_recipient_features,
            extract_date_features,
            extract_line_item_features,
            calculate_completeness
        )
        
        features = {}
        features.update(extract_amount_features(invoice))
        features.update(extract_invoice_num_features(invoice))
        features.update(extract_recipient_features(invoice))
        features.update(extract_date_features(invoice))
        features.update(extract_line_item_features(invoice))
        features.update({'completeness_score': calculate_completeness(invoice)})
        
        return features
        
    except ImportError:
        logger.warning("Using fallback feature extraction (app modules not available)")
        # Fallback to basic extraction if app not available
        return _fallback_feature_extraction(invoice)


def _fallback_feature_extraction(invoice: Dict[str, Any]) -> Dict[str, float]:
    """Simplified feature extraction as fallback"""
    features = {name: 0.0 for name in FEATURE_NAMES}
    
    # Basic amount features
    total = float(invoice.get('totalAmount') or invoice.get('total', 0) or 0)
    features['total'] = total
    features['amount_log'] = float(np.log1p(total))
    
    return features


def extract_feature_vector(invoice: Dict[str, Any]) -> List[float]:
    """Extract features as ordered list for model input"""
    features = extract_features(invoice)
    return [features.get(name, 0.0) for name in FEATURE_NAMES]


def prepare_training_data(invoices: List[Dict]) -> Tuple[pd.DataFrame, np.ndarray]:
    """
    Convert MongoDB invoices to feature matrix and labels.
    
    Returns:
        Tuple of (X dataframe, y labels array)
    """
    features_list = []
    labels = []
    
    for inv in invoices:
        try:
            parsed_data = inv.get('parsedData', {})
            features = extract_feature_vector(parsed_data)
            features_list.append(features)
            
            # Label: 1 = fraud (rejected), 0 = legitimate (approved)
            label = 1 if inv.get('reviewDecision') == 'rejected' else 0
            labels.append(label)
        except Exception as e:
            logger.warning(f"Skipping invoice {inv.get('_id')}: {e}")
            continue
    
    X = pd.DataFrame(features_list, columns=FEATURE_NAMES)
    y = np.array(labels)
    
    logger.info(f"Prepared {len(X)} samples with {len(FEATURE_NAMES)} features")
    
    return X, y


# ============================================================
# MAIN RETRAINING PIPELINE
# ============================================================

async def retrain(
    min_samples: int = MIN_SAMPLES,
    min_fraud: int = MIN_FRAUD_SAMPLES,
    dry_run: bool = False,
    force: bool = False
) -> bool:
    """
    Main retraining pipeline.
    
    Args:
        min_samples: Minimum total invoices required
        min_fraud: Minimum fraud examples required
        dry_run: If True, don't save the model
        force: If True, train even if metrics are below threshold
    
    Returns:
        True if retraining successful, False otherwise
    """
    logger.info("=" * 60)
    logger.info("FRAUD DETECTION MODEL RETRAINING")
    logger.info("=" * 60)
    logger.info(f"Started at: {datetime.now().isoformat()}")
    logger.info(f"Min samples: {min_samples}, Min fraud: {min_fraud}")
    logger.info(f"Dry run: {dry_run}, Force: {force}")
    
    # Step 1: Fetch data
    logger.info("\n[Step 1/5] Fetching training data from MongoDB...")
    
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DATABASE_NAME]
    
    try:
        invoices, total_count, fraud_count = await fetch_labeled_fraud_data(
            db, min_samples, MAX_SAMPLES
        )
        
        # Check thresholds
        if total_count < min_samples:
            logger.error(f"Insufficient data: {total_count} < {min_samples} required")
            return False
        
        if fraud_count < min_fraud:
            logger.error(f"Insufficient fraud examples: {fraud_count} < {min_fraud} required")
            return False
        
        # Step 2: Prepare features
        logger.info("\n[Step 2/5] Extracting features...")
        X, y = prepare_training_data(invoices)
        
        # Step 3: Split data
        logger.info("\n[Step 3/5] Splitting train/test...")
        X_train, X_test, y_train, y_test = split_train_test(X, y, test_size=0.2)
        
        # Step 4: Train model
        logger.info("\n[Step 4/5] Training model...")
        model = train_random_forest(X_train, y_train, MODEL_PARAMS)
        
        # Step 5: Evaluate
        logger.info("\n[Step 5/5] Evaluating model...")
        metrics = evaluate_classification_model(model, X_test, y_test)
        
        # Validate metrics
        if not validate_metrics(metrics, METRIC_THRESHOLDS):
            if not force:
                logger.error("Model did not meet minimum metrics. Use --force to save anyway.")
                return False
            logger.warning("Forcing save despite below-threshold metrics")
        
        # Save model
        if dry_run:
            logger.info("\n[DRY RUN] Model not saved")
        else:
            # Backup existing model
            backup_model(MODEL_PATH, BACKUP_DIR)
            
            # Create metadata
            training_info = {
                'total_samples': total_count,
                'fraud_samples': fraud_count,
                'training_samples': len(X_train),
                'test_samples': len(X_test)
            }
            
            metadata = create_model_metadata(
                model_name='fraud_detection_rf',
                algorithm='RandomForestClassifier',
                feature_names=FEATURE_NAMES,
                hyperparameters=MODEL_PARAMS,
                metrics=metrics,
                training_info=training_info
            )
            
            # Save locally
            save_model_local(model, MODEL_PATH, metadata)
            
            # Upload to S3
            await upload_model_to_s3(
                MODEL_PATH,
                'models/fraud_model_rf.pkl',
                metadata
            )
        
        logger.info("\n" + "=" * 60)
        logger.info("RETRAINING COMPLETE")
        logger.info("=" * 60)
        
        return True
        
    finally:
        client.close()


def main():
    """CLI entry point"""
    parser = argparse.ArgumentParser(
        description='Retrain FinShield Fraud Detection Model',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Standard retraining
    python train_fraud_model.py
    
    # Check if retraining is possible (no changes)
    python train_fraud_model.py --dry-run
    
    # Lower thresholds for small datasets
    python train_fraud_model.py --min-samples 200 --min-fraud 10
    
    # Force save even if metrics are low
    python train_fraud_model.py --force
        """
    )
    
    parser.add_argument(
        '--min-samples', type=int, default=MIN_SAMPLES,
        help=f'Minimum labeled invoices required (default: {MIN_SAMPLES})'
    )
    parser.add_argument(
        '--min-fraud', type=int, default=MIN_FRAUD_SAMPLES,
        help=f'Minimum fraud examples required (default: {MIN_FRAUD_SAMPLES})'
    )
    parser.add_argument(
        '--dry-run', action='store_true',
        help='Run training without saving the model'
    )
    parser.add_argument(
        '--force', action='store_true',
        help='Save model even if metrics are below threshold'
    )
    parser.add_argument(
        '--mongo-uri', type=str, default=MONGO_URI,
        help=f'MongoDB connection URI (default: {MONGO_URI})'
    )
    
    args = parser.parse_args()
    
    # Update global MongoDB URI if provided
    global MONGO_URI
    MONGO_URI = args.mongo_uri
    
    # Run async retraining
    success = asyncio.run(retrain(
        min_samples=args.min_samples,
        min_fraud=args.min_fraud,
        dry_run=args.dry_run,
        force=args.force
    ))
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
