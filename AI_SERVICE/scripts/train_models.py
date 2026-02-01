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
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sklearn.ensemble import IsolationForest
from app.db.mongo import get_database
from app.engines.anomaly.feature_extractor import FeatureExtractor
from app.engines.anomaly.model_loader import save_model_to_s3, clear_model_cache
from app.core.config import settings

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


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
        Train model for specific organization
        
        Args:
            org_id: Organization ID (MongoDB ObjectId as string)
        
        Returns:
            True if successful, False otherwise
        """
        logger.info(f"\n{'='*70}")
        logger.info(f"Training model for organization: {org_id}")
        logger.info(f"{'='*70}")
        
        try:
            # 1. Check invoice count
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
            
            # 2. Fetch invoices (limit to 10k for performance)
            max_training_samples = min(invoice_count, 10000)
            logger.info(f"✓ Fetching up to {max_training_samples} invoices...")
            
            invoices = list(self.db.invoices.find({
                'organizationId': org_id,
                'aiVerdict': 'clean',
                'total': {'$exists': True}
            }).limit(max_training_samples))
            
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
            
            # 5. Save to S3
            logger.info("✓ Uploading model to S3...")
            s3_key = save_model_to_s3(org_id, model)
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
        
        for idx, org_data in enumerate(eligible_orgs, 1):
            org_id = org_data['org_id']
            count = org_data['count']
            
            logger.info(f"\n[{idx}/{len(eligible_orgs)}] Processing {org_id} ({count} invoices)")
            
            if self.train_organization_model(org_id):
                success_count += 1
            else:
                fail_count += 1
        
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
