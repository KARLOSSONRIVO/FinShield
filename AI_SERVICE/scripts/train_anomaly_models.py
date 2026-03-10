"""
Training script for Isolation Forest anomaly detection models

Trains per-organization models based on historical invoice data.

Usage:
    # Train specific organization
    python scripts/train_anomaly_models.py --org-id 507f1f77bcf86cd799439011
    
    # Train all organizations with sufficient data
    python scripts/train_anomaly_models.py --all
    
    # Check which orgs are eligible for training
    python scripts/train_anomaly_models.py --check
"""

import sys
import os
import argparse
import logging
from concurrent.futures import ProcessPoolExecutor, as_completed

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.mongo import get_database
from app.engines.anomaly.feature_extractor import FeatureExtractor
from app.engines.anomaly.model_loader import save_model_to_s3, clear_model_cache
from app.core.config import settings

# Import training utilities
from training_utils.data_loader import (
    fetch_invoices_for_training,
    count_organization_invoices,
    get_eligible_organizations
)
from training_utils.sampler import smart_sample
from training_utils.trainer import train_isolation_forest
from training_utils.incremental import should_retrain, update_training_metadata

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class AnomalyModelTrainer:
    """Train Isolation Forest models for organizations"""
    
    def __init__(self):
        self.db = get_database()
        self.feature_extractor = FeatureExtractor()
    
    def check_eligible_organizations(self):
        """List organizations eligible for training"""
        logger.info("Checking organizations eligible for training...")
        
        eligible = get_eligible_organizations(self.db, settings.ANOMALY_MIN_INVOICES)
        ineligible = []  # Could fetch these too if needed
        
        logger.info(f"\n{'='*70}")
        logger.info(f"ELIGIBLE ORGANIZATIONS (>= {settings.ANOMALY_MIN_INVOICES} invoices):")
        logger.info(f"{'='*70}")
        for org in eligible:
            logger.info(f"  {org['org_id']}: {org['count']} invoices")
        
        logger.info(f"\n{'='*70}")
        logger.info(f"Summary:")
        logger.info(f"  Eligible: {len(eligible)}")
        logger.info(f"{'='*70}\n")
        
        return eligible
    
    def train_organization_model(self, org_id: str) -> bool:
        """
        Train model for specific organization with incremental training support.
        
        Args:
            org_id: Organization ID (MongoDB ObjectId as string)
        
        Returns:
            True if successful, False otherwise
        """
        logger.info(f"\n{'='*70}")
        logger.info(f"Training model for organization: {org_id}")
        logger.info(f"{'='*70}")
        
        try:
            # 1. Check if retraining is needed
            invoice_count = count_organization_invoices(self.db, org_id)
            should_train, reason = should_retrain(
                org_id,
                invoice_count,
                min_new_invoices=settings.ANOMALY_MIN_NEW_INVOICES,
                retrain_interval_days=settings.ANOMALY_RETRAIN_INTERVAL_DAYS
            )
            
            if not should_train:
                logger.info(f"✅ SKIP - {reason}")
                logger.info(f"{'='*70}\n")
                return True  # Not a failure, just skipped
            
            logger.info(f"🔄 RETRAINING - {reason}")
            
            # 2. Check minimum invoice count
            if invoice_count < settings.ANOMALY_MIN_INVOICES:
                logger.warning(
                    f"❌ Insufficient data for org {org_id}: "
                    f"{invoice_count} invoices (need {settings.ANOMALY_MIN_INVOICES})"
                )
                return False
            
            logger.info(f"✓ Found {invoice_count} clean invoices")
            
            # 3. Fetch invoices
            invoices = fetch_invoices_for_training(
                self.db,
                org_id,
                verdict_filter='clean',
                max_count=settings.ANOMALY_MAX_TRAINING_SAMPLES * 2  # Fetch extra for sampling
            )
            
            # 4. Smart sampling if needed
            if len(invoices) > settings.ANOMALY_MAX_TRAINING_SAMPLES:
                logger.info(
                    f"✓ Sampling {len(invoices)} → {settings.ANOMALY_MAX_TRAINING_SAMPLES} invoices "
                    f"({int(settings.ANOMALY_RECENT_WEIGHT * 100)}% recent, "
                    f"{int((1 - settings.ANOMALY_RECENT_WEIGHT) * 100)}% historical)"
                )
                invoices = smart_sample(
                    invoices,
                    max_samples=settings.ANOMALY_MAX_TRAINING_SAMPLES,
                    recent_weight=settings.ANOMALY_RECENT_WEIGHT,
                    recent_days=settings.ANOMALY_RECENT_DAYS
                )
            else:
                logger.info(f"✓ Using all {len(invoices)} invoices (under limit)")
            
            # 5. Extract features
            logger.info("✓ Extracting features...")
            feature_matrix = []
            
            for idx, invoice in enumerate(invoices):
                if idx % 100 == 0 and idx > 0:
                    logger.info(f"  Processed {idx}/{len(invoices)} invoices...")
                
                features = self.feature_extractor.extract_features(
                    invoice,
                    org_id,
                    self.db
                )
                feature_matrix.append(features)
            
            logger.info(f"✓ Extracted {len(feature_matrix)} feature vectors")
            
            # 6. Train model
            logger.info("✓ Training Isolation Forest...")
            # Adaptive contamination: fewer samples → higher contamination (more sensitive to catching anomalies)
            n = len(feature_matrix)
            if n <= 75:
                contamination = 0.15    # small dataset — flag more aggressively
            elif n <= 200:
                contamination = 0.10    # medium dataset
            else:
                contamination = 0.05    # large dataset — standard
            logger.info(f"  Adaptive contamination = {contamination} (n={n})")
            n_estimators = 200          # more trees → smoother boundary
            model = train_isolation_forest(
                feature_matrix,
                contamination=contamination,
                n_estimators=n_estimators
            )
            
            # 7. Save to S3 with metadata
            logger.info("✓ Uploading model to S3...")
            from datetime import datetime
            
            training_metadata = update_training_metadata(
                org_id,
                len(invoices),
                {
                    'contamination': contamination,
                    'n_estimators': n_estimators,
                    'feature_count': len(feature_matrix)
                }
            )
            
            s3_key = save_model_to_s3(org_id, model, training_metadata)
            logger.info(f"✓ Model uploaded: {s3_key}")
            
            # 8. Clear cache
            clear_model_cache(org_id)
            logger.info("✓ Cache cleared")
            
            logger.info(f"\n{'='*70}")
            logger.info(f"✅ SUCCESS - Model training complete for org {org_id}")
            logger.info(f"{'='*70}")
            logger.info(f"  S3 Key: {s3_key}")
            logger.info(f"  Training Samples: {len(feature_matrix)}")
            logger.info(f"  Contamination: {contamination}")
            logger.info(f"{'='*70}\n")
            
            return True
            
        except Exception as e:
            logger.error(f"\n{'='*70}")
            logger.error(f"❌ ERROR - Failed to train model for org {org_id}")
            logger.error(f"{'='*70}")
            logger.error(f"  Error: {str(e)}")
            logger.error(f"{'='*70}\n")
            return False
    
    def train_all_organizations(self):
        """Train models for all organizations with sufficient data"""
        logger.info("\n" + "="*70)
        logger.info("TRAINING MODELS FOR ALL ELIGIBLE ORGANIZATIONS")
        logger.info("="*70 + "\n")
        
        # Find eligible organizations
        eligible_orgs = self.check_eligible_organizations()
        
        if not eligible_orgs:
            logger.warning("No organizations eligible for training")
            return
        
        logger.info(f"\nStarting training for {len(eligible_orgs)} organizations...\n")
        
        success_count = 0
        fail_count = 0
        
        # Train sequentially — ProcessPoolExecutor can't pickle the MongoDB SSL connection
        for idx, org_data in enumerate(eligible_orgs, 1):
            org_id = org_data['org_id']
            try:
                result = self.train_organization_model(org_id)
                if result:
                    success_count += 1
                    logger.info(f"✅ [{idx}/{len(eligible_orgs)}] {org_id} - SUCCESS")
                else:
                    fail_count += 1
                    logger.info(f"❌ [{idx}/{len(eligible_orgs)}] {org_id} - FAILED")
            except Exception as e:
                fail_count += 1
                logger.error(f"❌ [{idx}/{len(eligible_orgs)}] {org_id} - ERROR: {e}")
        
        # Final summary
        logger.info("\n" + "="*70)
        logger.info("TRAINING SUMMARY")
        logger.info("="*70)
        logger.info(f"  ✅ Successful: {success_count}")
        logger.info(f"  ❌ Failed: {fail_count}")
        logger.info(f"  📊 Total: {len(eligible_orgs)}")
        logger.info(f"  Success Rate: {(success_count/len(eligible_orgs)*100):.1f}%")
        logger.info("="*70 + "\n")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Train Isolation Forest anomaly detection models',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Train specific organization
  python scripts/train_anomaly_models.py --org-id 507f1f77bcf86cd799439011
  
  # Train all eligible organizations
  python scripts/train_anomaly_models.py --all
  
  # Check which organizations are eligible
  python scripts/train_anomaly_models.py --check
        """
    )
    
    parser.add_argument(
        '--org-id',
        type=str,
        help='Train model for specific organization (MongoDB ObjectId)'
    )
    parser.add_argument(
        '--all',
        action='store_true',
        help='Train models for all organizations with sufficient data'
    )
    parser.add_argument(
        '--check',
        action='store_true',
        help='Check which organizations are eligible for training'
    )
    
    args = parser.parse_args()
    
    # Validate arguments
    if not any([args.org_id, args.all, args.check]):
        parser.print_help()
        sys.exit(1)
    
    trainer = AnomalyModelTrainer()
    
    try:
        if args.check:
            trainer.check_eligible_organizations()
        elif args.org_id:
            success = trainer.train_organization_model(args.org_id)
            sys.exit(0 if success else 1)
        elif args.all:
            trainer.train_all_organizations()
    except KeyboardInterrupt:
        logger.info("\n\nTraining interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"\n\nUnexpected error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
