"""
Training script for Isolation Forest anomaly detection models

Trains per-organization models based on historical invoice data.

Usage:
    # Train specific organization
    python scripts/train_models.py --org-id 507f1f77bcf86cd799439011
    
    # Train all organizations with sufficient data
    python scripts/train_models.py --all
    
    # Check which orgs are eligible for training
    python scripts/train_models.py --check
"""

import sys
import os
import argparse
import logging
import random
from datetime import datetime, timedelta
from concurrent.futures import ProcessPoolExecutor, as_completed
from sklearn.ensemble import IsolationForest
from app.db.mongo import get_database
from app.engines.anomaly.feature_extractor import FeatureExtractor
from app.engines.anomaly.model_loader import save_model_to_s3, clear_model_cache, get_model_metadata
from app.core.config import settings


# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def smart_sample_invoices(invoices: list, max_samples: int, recent_days: int, recent_weight: float) -> list:
    """
    Smart sampling: Weighted toward recent invoices
    
    Args:
        invoices: List of all invoices
        max_samples: Maximum samples to use (e.g., 10000)
        recent_days: Days to consider as "recent" (e.g., 90)
        recent_weight: Proportion of recent samples (e.g., 0.8 = 80%)
    
    Returns:
        Sampled invoice list
    """
    if len(invoices) <= max_samples:
        return invoices
    
    # Calculate cutoff date
    cutoff_date = datetime.now() - timedelta(days=recent_days)
    
    # Split into recent and historical
    recent = [inv for inv in invoices if inv.get('createdAt') and inv['createdAt'] >= cutoff_date]
    historical = [inv for inv in invoices if inv not in recent]
    
    # Calculate sample sizes
    recent_count = int(max_samples * recent_weight)
    historical_count = max_samples - recent_count
    
    # Sample from each group
    sampled_recent = random.sample(recent, min(len(recent), recent_count))
    sampled_historical = random.sample(historical, min(len(historical), historical_count)) if historical else []
    
    logger.info(f"  📊 Sampled {len(sampled_recent)} recent + {len(sampled_historical)} historical = {len(sampled_recent) + len(sampled_historical)} total")
    
    return sampled_recent + sampled_historical


class ModelTrainer:
    """Train Isolation Forest models for organizations"""
    
    def __init__(self):
        self.db = get_database()
        self.feature_extractor = FeatureExtractor()
    
    def check_eligible_organizations(self):
        """List organizations eligible for training"""
        logger.info("Checking organizations eligible for training...")
        
        pipeline = [
            {
                '$match': {
                    'aiVerdict': 'clean',
                    'total': {'$exists': True}
                }
            },
            {
                '$group': {
                    '_id': '$organizationId',
                    'count': {'$sum': 1}
                }
            },
            {
                '$sort': {'count': -1}
            }
        ]
        
        orgs_with_data = list(self.db.invoices.aggregate(pipeline))
        
        eligible = []
        ineligible = []
        
        for org_data in orgs_with_data:
            org_id = org_data['_id']
            count = org_data['count']
            
            if count >= settings.ANOMALY_MIN_INVOICES:
                eligible.append({'org_id': org_id, 'count': count})
            else:
                ineligible.append({'org_id': org_id, 'count': count})
        
        logger.info(f"\n{'='*70}")
        logger.info(f"ELIGIBLE ORGANIZATIONS (>= {settings.ANOMALY_MIN_INVOICES} invoices):")
        logger.info(f"{'='*70}")
        for org in eligible:
            logger.info(f"  {org['org_id']}: {org['count']} invoices")
        
        logger.info(f"\n{'='*70}")
        logger.info(f"INELIGIBLE ORGANIZATIONS (< {settings.ANOMALY_MIN_INVOICES} invoices):")
        logger.info(f"{'='*70}")
        for org in ineligible[:10]:  # Show first 10
            logger.info(f"  {org['org_id']}: {org['count']} invoices")
        if len(ineligible) > 10:
            logger.info(f"  ... and {len(ineligible) - 10} more")
        
        logger.info(f"\n{'='*70}")
        logger.info(f"Summary:")
        logger.info(f"  Eligible: {len(eligible)}")
        logger.info(f"  Ineligible: {len(ineligible)}")
        logger.info(f"  Total: {len(orgs_with_data)}")
        logger.info(f"{'='*70}\n")
        
        return eligible
    
    def train_organization_model(self, org_id: str) -> bool:
        """
        Train model for specific organization with incremental training support
        
        Incremental Training Logic:
        1. Check if model exists and when it was last trained
        2. Count new invoices since last training
        3. Only retrain if:
           - Model doesn't exist, OR
           - 500+ new invoices accumulated, OR
           - 7+ days since last training
        
        Args:
            org_id: Organization ID (MongoDB ObjectId as string)
        
        Returns:
            True if successful, False otherwise
        """
        logger.info(f"\n{'='*70}")
        logger.info(f"Training model for organization: {org_id}")
        logger.info(f"{'='*70}")
        
        try:
            # 1. Check if incremental training is possible
            metadata = get_model_metadata(org_id)
            
            if metadata:
                last_trained = metadata.get('trained_at')
                last_invoice_count = metadata.get('invoice_count', 0)
                
                # Parse last training date
                if isinstance(last_trained, str):
                    last_trained = datetime.fromisoformat(last_trained)
                
                # Count current invoices
                current_invoice_count = self.db.invoices.count_documents({
                    'organizationId': org_id,
                    'aiVerdict': 'clean',
                    'total': {'$exists': True}
                })
                
                # Calculate new invoices
                new_invoice_count = current_invoice_count - last_invoice_count
                days_since_training = (datetime.now() - last_trained).days if last_trained else 999
                
                logger.info(f"📊 Model exists:")
                logger.info(f"  Last trained: {last_trained.strftime('%Y-%m-%d %H:%M') if last_trained else 'Unknown'}")
                logger.info(f"  Days since training: {days_since_training}")
                logger.info(f"  Previous invoice count: {last_invoice_count}")
                logger.info(f"  Current invoice count: {current_invoice_count}")
                logger.info(f"  New invoices: {new_invoice_count}")
                
                # Check if retraining is needed
                should_retrain = (
                    new_invoice_count >= settings.ANOMALY_MIN_NEW_INVOICES or
                    days_since_training >= settings.ANOMALY_RETRAIN_INTERVAL_DAYS
                )
                
                if not should_retrain:
                    logger.info(f"✅ SKIP - Model is up-to-date")
                    logger.info(f"  Need {settings.ANOMALY_MIN_NEW_INVOICES - new_invoice_count} more invoices OR")
                    logger.info(f"  Wait {settings.ANOMALY_RETRAIN_INTERVAL_DAYS - days_since_training} more days")
                    logger.info(f"{'='*70}\n")
                    return True  # Not a failure, just skipped
                
                logger.info(f"🔄 RETRAINING - Conditions met:")
                if new_invoice_count >= settings.ANOMALY_MIN_NEW_INVOICES:
                    logger.info(f"  ✓ {new_invoice_count} new invoices (>= {settings.ANOMALY_MIN_NEW_INVOICES})")
                if days_since_training >= settings.ANOMALY_RETRAIN_INTERVAL_DAYS:
                    logger.info(f"  ✓ {days_since_training} days since training (>= {settings.ANOMALY_RETRAIN_INTERVAL_DAYS})")
            else:
                logger.info("📝 No existing model - training from scratch")
            
            # 2. Check invoice count
            invoice_count = self.db.invoices.count_documents({
                'organizationId': org_id,
                'aiVerdict': 'clean',
                'total': {'$exists': True}
            })
            
            if invoice_count < settings.ANOMALY_MIN_INVOICES:
                logger.warning(
                    f"❌ Insufficient data for org {org_id}: "
                    f"{invoice_count} invoices (need {settings.ANOMALY_MIN_INVOICES})"
                )
                return False
            
            logger.info(f"✓ Found {invoice_count} clean invoices")
            
            # 2. Fetch invoices with smart sampling
            invoices = list(self.db.invoices.find({
                'organizationId': org_id,
                'aiVerdict': 'clean',
                'total': {'$exists': True}
            }))
            
            # Apply smart sampling if exceeds limit
            if len(invoices) > settings.ANOMALY_MAX_TRAINING_SAMPLES:
                logger.info(
                    f"✓ Sampling {len(invoices)} → {settings.ANOMALY_MAX_TRAINING_SAMPLES} invoices "
                    f"({int(settings.ANOMALY_RECENT_WEIGHT * 100)}% recent, {int((1 - settings.ANOMALY_RECENT_WEIGHT) * 100)}% historical)"
                )
                invoices = smart_sample_invoices(
                    invoices,
                    max_samples=settings.ANOMALY_MAX_TRAINING_SAMPLES,
                    recent_weight=settings.ANOMALY_RECENT_WEIGHT,
                    recent_days=settings.ANOMALY_RECENT_DAYS
                )
            else:
                logger.info(f"✓ Using all {len(invoices)} invoices (under limit)")
            
            # 3. Extract features
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
            
            # 4. Train model
            logger.info("✓ Training Isolation Forest...")
            contamination = 0.1  # Expect 10% anomalies
            model = IsolationForest(
                contamination=contamination,
                n_estimators=100,
                random_state=42,
                n_jobs=-1,  # Use all CPU cores
                verbose=0
            )
            
            model.fit(feature_matrix)
            logger.info("✓ Model training complete")
            
            # 5. Save to S3 with metadata (overwrites existing - no deletion needed)
            logger.info("✓ Uploading model to S3...")
            training_metadata = {
                'trained_at': datetime.now().isoformat(),
                'invoice_count': len(invoices),
                'feature_count': len(feature_matrix),
                'contamination': contamination,
                'n_estimators': 100
            }
            s3_key = save_model_to_s3(org_id, model, training_metadata)
            logger.info(f"✓ Model uploaded: {s3_key}")
            
            # 6. Clear cache to force reload
            clear_model_cache(org_id)
            logger.info("✓ Cache cleared")
            
            logger.info(f"\n{'='*70}")
            logger.info(f"✅ SUCCESS - Model training complete for org {org_id}")
            logger.info(f"{'='*70}")
            logger.info(f"  S3 Key: {s3_key}")
            logger.info(f"  Training Samples: {len(feature_matrix)}")
            logger.info(f"  Contamination: {contamination}")
            logger.info(f"  N Estimators: 100")
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
        
        # Find organizations with sufficient invoices
        eligible_orgs = self.check_eligible_organizations()
        
        if not eligible_orgs:
            logger.warning("No organizations eligible for training")
            return
        
        logger.info(f"\nStarting training for {len(eligible_orgs)} organizations...\n")
        
        success_count = 0
        fail_count = 0
        
        # Train organizations in parallel
        max_workers = min(settings.MAX_PARALLEL_TRAINING, len(eligible_orgs))
        logger.info(f"\n🚀 Training {len(eligible_orgs)} organizations with {max_workers} parallel workers\n")
        
        with ProcessPoolExecutor(max_workers=max_workers) as executor:
            # Submit all training jobs
            future_to_org = {
                executor.submit(self.train_organization_model, org_data['org_id']): org_data
                for org_data in eligible_orgs
            }
            
            # Process results as they complete
            for idx, future in enumerate(as_completed(future_to_org), 1):
                org_data = future_to_org[future]
                org_id = org_data['org_id']
                count = org_data['count']
                
                try:
                    result = future.result()
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
  python scripts/train_models.py --org-id 507f1f77bcf86cd799439011
  
  # Train all eligible organizations
  python scripts/train_models.py --all
  
  # Check which organizations are eligible
  python scripts/train_models.py --check
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
    
    trainer = ModelTrainer()
    
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
