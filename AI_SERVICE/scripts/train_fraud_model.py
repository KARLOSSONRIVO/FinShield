"""
Fraud Detection Model Retraining Script

Automated retraining pipeline for the Random Forest fraud detection model.
Can be scheduled via cron (Linux) or Task Scheduler (Windows) for monthly runs.

Usage:
    # Direct execution
    python retrain_model.py
    
    # With options
    python retrain_model.py --min-samples 500 --min-fraud 25 --dry-run
    
Windows Task Scheduler:
    schtasks /create /tn "FinShield Fraud Model Retrain" /tr "python path/to/retrain_model.py" /sc monthly /d 1 /st 02:00
    
Linux Cron (monthly on 1st at 2am):
    0 2 1 * * cd /path/to/AI_SERVICE && python models/retrain_model.py >> /var/log/finshield_retrain.log 2>&1
"""

import os
import sys
import json
import argparse
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple

import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, 
    f1_score, roc_auc_score, confusion_matrix
)

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

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

# MongoDB connection (use environment variable or default)
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
DATABASE_NAME = os.getenv('DATABASE_NAME', 'finshield')

# Training thresholds
MIN_SAMPLES = 500      # Minimum invoices needed for retraining
MIN_FRAUD_SAMPLES = 25 # Minimum fraud examples needed
MAX_SAMPLES = 50000    # Cap to prevent memory issues

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
MIN_ACCURACY = 0.80
MIN_PRECISION = 0.70
MIN_RECALL = 0.60

# Output paths
MODEL_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(MODEL_DIR, 'fraud_model_rf.pkl')
METADATA_PATH = os.path.join(MODEL_DIR, 'fraud_model_metadata.json')
BACKUP_DIR = os.path.join(MODEL_DIR, 'backups')


# ============================================================
# FEATURE EXTRACTION (must match training notebook)
# ============================================================

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


def extract_features(invoice: Dict[str, Any]) -> Dict[str, float]:
    """
    Extract numerical features from an invoice for fraud detection.
    Must match exact feature extraction from training notebook.
    """
    features = {}
    
    # ===== AMOUNT FEATURES =====
    total = float(invoice.get('totalAmount') or invoice.get('total', 0) or 0)
    subtotal = float(invoice.get('subtotalAmount') or invoice.get('subtotal', 0) or 0)
    tax = float(invoice.get('taxAmount') or invoice.get('tax', 0) or 0)
    
    features['total'] = total
    features['subtotal'] = subtotal
    features['tax'] = tax
    features['tax_ratio'] = tax / total if total > 0 else 0
    features['amount_log'] = float(np.log1p(total))
    
    features['is_round_100'] = 1.0 if total > 0 and total % 100 == 0 else 0.0
    features['is_round_1000'] = 1.0 if total > 0 and total % 1000 == 0 else 0.0
    features['is_round_500'] = 1.0 if total > 0 and total % 500 == 0 else 0.0
    
    decimal_part = total - int(total)
    features['has_cents'] = 1.0 if decimal_part > 0 else 0.0
    features['cents_value'] = decimal_part
    
    # ===== INVOICE NUMBER FEATURES =====
    inv_num = str(invoice.get('invoiceNumber') or invoice.get('invoice_number', '') or '')
    features['inv_num_length'] = float(len(inv_num))
    features['inv_num_has_prefix'] = 1.0 if any(
        inv_num.upper().startswith(p) for p in ['INV', 'INVOICE', 'PO', 'REF']
    ) else 0.0
    features['inv_num_is_numeric'] = 1.0 if inv_num.isdigit() else 0.0
    features['inv_num_missing'] = 1.0 if not inv_num.strip() else 0.0
    
    # ===== ISSUED TO FEATURES =====
    issued_to = str(invoice.get('issuedTo', '') or '')
    features['issued_to_length'] = float(len(issued_to))
    features['issued_to_missing'] = 1.0 if not issued_to.strip() else 0.0
    features['issued_to_is_generic'] = 1.0 if issued_to.lower() in [
        'cash', 'unknown', 'misc', 'various', '', 'n/a', 'na'
    ] else 0.0
    
    # ===== DATE FEATURES =====
    date_str = str(invoice.get('invoiceDate') or invoice.get('date', '') or '')
    features['date_missing'] = 1.0 if not date_str.strip() else 0.0
    
    try:
        invoice_date = None
        for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%Y/%m/%d']:
            try:
                invoice_date = datetime.strptime(date_str.split('T')[0], fmt)
                break
            except ValueError:
                continue
        
        if invoice_date:
            today = datetime.now()
            features['days_old'] = float((today - invoice_date).days)
            features['is_future'] = 1.0 if invoice_date > today else 0.0
            features['is_weekend'] = 1.0 if invoice_date.weekday() >= 5 else 0.0
            features['month'] = float(invoice_date.month)
            features['day_of_week'] = float(invoice_date.weekday())
            features['is_month_end'] = 1.0 if invoice_date.day >= 28 else 0.0
        else:
            raise ValueError("Could not parse date")
    except Exception:
        features['days_old'] = -1.0
        features['is_future'] = 0.0
        features['is_weekend'] = 0.0
        features['month'] = 0.0
        features['day_of_week'] = -1.0
        features['is_month_end'] = 0.0
    
    # ===== LINE ITEMS FEATURES =====
    line_items = invoice.get('lineItems') or invoice.get('line_items', [])
    line_count = len(line_items) if line_items else 0
    features['line_item_count'] = float(line_count)
    features['has_line_items'] = 1.0 if line_count > 0 else 0.0
    features['avg_line_item_value'] = total / line_count if line_count > 0 else total
    
    # ===== QUANTITY & UNIT PRICE FEATURES =====
    quantities = []
    unit_prices = []
    calculation_errors = 0
    
    for item in line_items:
        qty = item.get('quantity', 1)
        unit_price = item.get('unit_price', item.get('amount', 0))
        item_amount = item.get('amount', 0)
        
        quantities.append(qty)
        unit_prices.append(unit_price)
        
        # Check calculation accuracy: qty × unit_price ≈ amount
        expected = qty * unit_price
        if abs(expected - item_amount) > 0.02:  # Allow 2 cent rounding error
            calculation_errors += 1
    
    # Max/Avg quantities
    features['max_quantity'] = float(max(quantities)) if quantities else 1.0
    features['avg_quantity'] = float(np.mean(quantities)) if quantities else 1.0
    
    # Max/Avg unit prices
    features['max_unit_price'] = float(max(unit_prices)) if unit_prices else total
    features['avg_unit_price'] = float(np.mean(unit_prices)) if unit_prices else total
    
    # Calculation mismatches (fraud indicator)
    features['calculation_mismatches'] = float(calculation_errors)
    
    # Single item dominance (one item is 80%+ of total)
    if line_items and total > 0:
        max_item_amount = max(item.get('amount', 0) for item in line_items)
        dominance = max_item_amount / total
        features['single_item_dominance'] = dominance
    else:
        features['single_item_dominance'] = 1.0  # No items = suspicious
    
    # High quantity flag (>100 units of single item)
    features['has_high_quantity'] = 1.0 if features['max_quantity'] > 100 else 0.0
    
    # ===== COMPLETENESS SCORE =====
    missing_count = 0
    if not (invoice.get('invoiceNumber') or invoice.get('invoice_number')):
        missing_count += 1
    if not invoice.get('issuedTo'):
        missing_count += 1
    if not (invoice.get('totalAmount') or invoice.get('total')):
        missing_count += 1
    if not (invoice.get('invoiceDate') or invoice.get('date')):
        missing_count += 1
    
    features['missing_fields_count'] = float(missing_count)
    features['completeness_score'] = 1.0 - (missing_count / 4.0)
    
    return features


def extract_feature_vector(invoice: Dict[str, Any]) -> List[float]:
    """Extract features as ordered list for model input"""
    features = extract_features(invoice)
    return [features.get(name, 0.0) for name in FEATURE_NAMES]


# ============================================================
# DATA LOADING
# ============================================================

async def fetch_training_data(
    mongo_uri: str, 
    db_name: str,
    min_samples: int,
    max_samples: int
) -> Tuple[List[Dict], int, int]:
    """
    Fetch labeled invoices from MongoDB for training.
    
    Returns:
        Tuple of (invoice_list, total_count, fraud_count)
    """
    logger.info(f"Connecting to MongoDB: {mongo_uri}")
    
    client = AsyncIOMotorClient(mongo_uri)
    db = client[db_name]
    
    try:
        # Query invoices with auditor review decisions
        # reviewDecision: 'approved' = legitimate, 'rejected' = fraud
        pipeline = [
            {
                '$match': {
                    'reviewDecision': {'$in': ['approved', 'rejected']},
                    'parsedData': {'$exists': True}
                }
            },
            {
                '$project': {
                    '_id': 1,
                    'parsedData': 1,
                    'reviewDecision': 1,
                    'organizationId': 1
                }
            },
            {
                '$sort': {'updatedAt': -1}
            },
            {
                '$limit': max_samples
            }
        ]
        
        cursor = db.invoices.aggregate(pipeline)
        invoices = await cursor.to_list(length=max_samples)
        
        logger.info(f"Fetched {len(invoices)} labeled invoices from MongoDB")
        
        # Count fraud vs legitimate
        fraud_count = sum(1 for inv in invoices if inv.get('reviewDecision') == 'rejected')
        legit_count = len(invoices) - fraud_count
        
        logger.info(f"Distribution: {legit_count} legitimate, {fraud_count} fraud")
        
        return invoices, len(invoices), fraud_count
        
    finally:
        client.close()


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
# MODEL TRAINING
# ============================================================

def train_model(
    X_train: pd.DataFrame, 
    y_train: np.ndarray,
    params: Dict
) -> RandomForestClassifier:
    """Train Random Forest classifier"""
    logger.info("Training Random Forest model...")
    logger.info(f"Parameters: {params}")
    
    model = RandomForestClassifier(**params)
    model.fit(X_train, y_train)
    
    logger.info("✅ Model training complete")
    return model


def evaluate_model(
    model: RandomForestClassifier,
    X_test: pd.DataFrame,
    y_test: np.ndarray
) -> Dict[str, float]:
    """Evaluate model performance"""
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
    
    logger.info("=" * 50)
    logger.info("MODEL EVALUATION METRICS")
    logger.info("=" * 50)
    logger.info(f"Accuracy:  {metrics['accuracy']:.4f}")
    logger.info(f"Precision: {metrics['precision']:.4f}")
    logger.info(f"Recall:    {metrics['recall']:.4f}")
    logger.info(f"F1-Score:  {metrics['f1_score']:.4f}")
    logger.info(f"ROC-AUC:   {metrics['roc_auc']:.4f}")
    logger.info(f"Confusion Matrix:\n{cm}")
    
    return metrics


def validate_metrics(metrics: Dict[str, float]) -> bool:
    """Check if model meets minimum performance thresholds"""
    if metrics['accuracy'] < MIN_ACCURACY:
        logger.warning(f"Accuracy {metrics['accuracy']:.4f} below threshold {MIN_ACCURACY}")
        return False
    if metrics['precision'] < MIN_PRECISION:
        logger.warning(f"Precision {metrics['precision']:.4f} below threshold {MIN_PRECISION}")
        return False
    if metrics['recall'] < MIN_RECALL:
        logger.warning(f"Recall {metrics['recall']:.4f} below threshold {MIN_RECALL}")
        return False
    return True


# ============================================================
# MODEL SAVING
# ============================================================

def backup_existing_model():
    """Backup existing model before overwriting"""
    if not os.path.exists(MODEL_PATH):
        return
    
    os.makedirs(BACKUP_DIR, exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = os.path.join(BACKUP_DIR, f'fraud_model_rf_{timestamp}.pkl')
    
    import shutil
    shutil.copy2(MODEL_PATH, backup_path)
    logger.info(f"✅ Existing model backed up to: {backup_path}")
    
    # Keep only last 5 backups
    backups = sorted([f for f in os.listdir(BACKUP_DIR) if f.endswith('.pkl')])
    while len(backups) > 5:
        old_backup = os.path.join(BACKUP_DIR, backups.pop(0))
        os.remove(old_backup)
        logger.info(f"Removed old backup: {old_backup}")


def save_model(
    model: RandomForestClassifier,
    metrics: Dict[str, float],
    training_info: Dict[str, Any]
):
    """Save model and metadata locally"""
    # Backup first
    backup_existing_model()
    
    # Save model
    joblib.dump(model, MODEL_PATH)
    model_size = os.path.getsize(MODEL_PATH) / (1024 * 1024)
    logger.info(f"✅ Model saved: {MODEL_PATH} ({model_size:.2f} MB)")
    
    # Save metadata
    metadata = {
        'model_name': 'fraud_detection_rf',
        'version': datetime.now().strftime('%Y.%m.%d'),
        'algorithm': 'RandomForestClassifier',
        'trained_at': datetime.now().isoformat(),
        'feature_names': FEATURE_NAMES,
        'n_features': len(FEATURE_NAMES),
        'hyperparameters': MODEL_PARAMS,
        'metrics': metrics,
        'training_info': training_info
    }
    
    with open(METADATA_PATH, 'w') as f:
        json.dump(metadata, f, indent=2)
    logger.info(f"✅ Metadata saved: {METADATA_PATH}")


async def upload_to_s3():
    """Upload model to S3 (optional, requires config)"""
    try:
        # Import from app if available
        from app.engines.fraud.model_loader import save_fraud_model_to_s3
        
        model = joblib.load(MODEL_PATH)
        with open(METADATA_PATH, 'r') as f:
            metadata = json.load(f)
        
        save_fraud_model_to_s3(model, metadata)
        logger.info("✅ Model uploaded to S3")
    except ImportError:
        logger.info("S3 upload skipped - not configured")
    except Exception as e:
        logger.warning(f"S3 upload failed: {e}")


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
    invoices, total_count, fraud_count = await fetch_training_data(
        MONGO_URI, DATABASE_NAME, min_samples, MAX_SAMPLES
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
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    logger.info(f"Training set: {len(X_train)} samples ({sum(y_train)} fraud)")
    logger.info(f"Test set: {len(X_test)} samples ({sum(y_test)} fraud)")
    
    # Step 4: Train model
    logger.info("\n[Step 4/5] Training model...")
    model = train_model(X_train, y_train, MODEL_PARAMS)
    
    # Step 5: Evaluate
    logger.info("\n[Step 5/5] Evaluating model...")
    metrics = evaluate_model(model, X_test, y_test)
    
    # Validate metrics
    if not validate_metrics(metrics):
        if not force:
            logger.error("Model did not meet minimum metrics. Use --force to save anyway.")
            return False
        logger.warning("Forcing save despite below-threshold metrics")
    
    # Save model
    if dry_run:
        logger.info("\n[DRY RUN] Model not saved")
    else:
        training_info = {
            'total_samples': total_count,
            'fraud_samples': fraud_count,
            'training_samples': len(X_train),
            'test_samples': len(X_test)
        }
        save_model(model, metrics, training_info)
        
        # Upload to S3
        await upload_to_s3()
    
    logger.info("\n" + "=" * 60)
    logger.info("RETRAINING COMPLETE")
    logger.info("=" * 60)
    
    return True


def main():
    """CLI entry point"""
    parser = argparse.ArgumentParser(
        description='Retrain FinShield Fraud Detection Model',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Standard retraining
    python retrain_model.py
    
    # Check if retraining is possible (no changes)
    python retrain_model.py --dry-run
    
    # Lower thresholds for small datasets
    python retrain_model.py --min-samples 200 --min-fraud 10
    
    # Force save even if metrics are low
    python retrain_model.py --force
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
