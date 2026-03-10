"""
Stage 3: Fraud Detection Layer (Refactored)

Hybrid approach:
  - Rule-based checks for known fraud patterns (60% weight)
  - ML Random Forest for novel fraud detection (40% weight)
"""

import logging
from typing import Dict, Any, List

from app.pipelines.verification.stages.base import BaseLayer, LayerResult, LayerVerdict
from app.engines.fraud.duplicate_detector import DuplicateDetector
from app.engines.fraud.customer_validator import CustomerValidator
from app.engines.fraud.pattern_analyzer import PatternAnalyzer
from app.engines.fraud.temporal_checker import TemporalChecker
from app.engines.fraud.feature_extractor import FraudFeatureExtractor
from app.engines.fraud.model_loader import get_fraud_model

from .ml import predict_fraud_score, explain_fraud_ml

logger = logging.getLogger(__name__)


class FraudDetectionLayer(BaseLayer):
    """
    Fraud Detection Layer
    
    Validates invoice using:
      1. Rule-based checks (always runs): duplicates, vendors, patterns, dates
      2. ML Random Forest (if model exists): learned fraud patterns
    """
    
    layer_name = "fraud_detection"
    
    # Verdict thresholds
    SCORE_PASS_THRESHOLD = 0.70  # Score >= 70: PASS (low fraud risk)
    SCORE_WARN_THRESHOLD = 0.40  # Score 40-70: WARN (medium risk)
    
    # Rule weights (must sum to 1.0)
    WEIGHT_DUPLICATE = 0.30   # reduced — duplicate alone shouldn't dominate
    WEIGHT_VENDOR    = 0.20   # reduced
    WEIGHT_PATTERN   = 0.25   # raised — round numbers, Benford's, format
    WEIGHT_TEMPORAL  = 0.25   # raised from 0.10 — temporal fraud is very significant

    # Hybrid weights (if ML model exists)
    # ML kept low (0.25) as model is early-stage — rules are more reliable
    WEIGHT_RULES = 0.75   # raised from 0.60
    WEIGHT_ML    = 0.25   # lowered from 0.40
    
    def __init__(self, db=None):
        super().__init__()
        self.db = db
        if db is not None:
            self.duplicate_detector = DuplicateDetector(db)
            self.customer_validator = CustomerValidator(db)
            self.temporal_checker = TemporalChecker(db)
        else:
            self.duplicate_detector = None
            self.customer_validator = None
            self.temporal_checker = None
        self.pattern_analyzer = PatternAnalyzer()
        self.feature_extractor = FraudFeatureExtractor()
        self._ml_model = None
        self._ml_checked = False
    
    async def analyze(self, context: Dict[str, Any]) -> LayerResult:
        """
        Process invoice through fraud detection
        """
        invoice_data = context.get('invoice_data', {})
        organization_id = context.get('organization_id')
        invoice_id = context.get('invoice_id')
        
        # Check if DB is available
        if self.db is None:
            logger.warning("No database connection for fraud detection")
            return self._create_result(
                verdict=LayerVerdict.SKIP,
                score=1.0,
                details={"reason": "No database connection"},
                flags=["FRAUD_DB_UNAVAILABLE"]
            )
        
        if not organization_id:
            logger.error("No organization_id provided to fraud detection")
            return self._create_result(
                verdict=LayerVerdict.FAIL,
                score=0.0,
                details={"error": "Missing organization_id"},
                flags=["MISSING_ORG_ID"]
            )
        
        issues: List[str] = []
        checks: Dict[str, Any] = {}
        
        # PART 1: Rule-Based Fraud Detection (Always Runs)
        logger.info(f"Running fraud rule checks for org {organization_id}")
        
        # 1. Duplicate Detection (30%)
        dup_score, dup_issue = await self.duplicate_detector.check(
            invoice_data, organization_id, invoice_id
        )
        checks['duplicate'] = dup_score
        if dup_issue:
            issues.append(dup_issue)

        # 2. Customer Validation (20%)
        customer_score, customer_issue = await self.customer_validator.check(
            invoice_data, organization_id
        )
        checks['customer'] = customer_score
        if customer_issue:
            issues.append(customer_issue)

        # 3. Pattern Analysis (25%)
        pattern_score, pattern_issue = self.pattern_analyzer.check(
            invoice_data
        )
        checks['pattern'] = pattern_score
        if pattern_issue:
            issues.append(pattern_issue)

        # 4. Temporal Checks (25%)
        temporal_score, temporal_issue = await self.temporal_checker.check(
            invoice_data, organization_id
        )
        checks['temporal'] = temporal_score
        if temporal_issue:
            issues.append(temporal_issue)
        
        # Calculate rule-based score (weighted average)
        rule_score = (
            dup_score * self.WEIGHT_DUPLICATE +
            customer_score * self.WEIGHT_VENDOR +
            pattern_score * self.WEIGHT_PATTERN +
            temporal_score * self.WEIGHT_TEMPORAL
        )
        
        checks['rule_score'] = round(rule_score, 4)
        logger.info(f"Fraud rule-based score: {rule_score:.3f}")
        
        # PART 2: ML-Based Fraud Detection (If Model Exists)
        final_score = rule_score
        
        # Lazy load ML model
        if not self._ml_checked:
            self._ml_model = get_fraud_model()
            self._ml_checked = True
        
        if self._ml_model is not None:
            try:
                # Extract features for ML model
                features = self.feature_extractor.extract_feature_vector(invoice_data)
                
                # Get fraud score from Random Forest
                ml_score, fraud_proba = predict_fraud_score(self._ml_model, features)
                
                checks['ml_score'] = round(ml_score, 4)
                checks['fraud_probability'] = round(fraud_proba, 4)
                
                # Hybrid score: Rules (75%) + ML (25%)
                final_score = (rule_score * self.WEIGHT_RULES) + (ml_score * self.WEIGHT_ML)
                checks['model_status'] = 'hybrid'

                logger.info(f"Hybrid score: {final_score:.3f} (rules: {rule_score:.3f} * {self.WEIGHT_RULES} + ml: {ml_score:.3f} * {self.WEIGHT_ML})")

                # If rule score is critically bad, ML cannot inflate it.
                # A clean-biased ML model should not override strong rule signals.
                if rule_score < 0.55:
                    final_score = min(final_score, rule_score)
                    checks['ml_clamped'] = True
                    logger.info(f"ML score clamped: rule_score {rule_score:.3f} < 0.55, final capped at {final_score:.3f}")
                
                # Add flag if ML detects high fraud risk
                if fraud_proba > 0.7:
                    issues.append(f"ML fraud signal: {explain_fraud_ml(features, fraud_proba)}")
                    
            except Exception as e:
                logger.error(f"ML prediction failed: {e}")
                checks['model_status'] = 'rules_only'
                checks['ml_error'] = str(e)
        else:
            checks['model_status'] = 'rules_only'
            logger.debug("No ML model available, using rules only")
        
        checks['final_score'] = round(final_score, 4)
        
        # Determine verdict
        if final_score >= self.SCORE_PASS_THRESHOLD:
            verdict = LayerVerdict.PASS
        elif final_score >= self.SCORE_WARN_THRESHOLD:
            verdict = LayerVerdict.WARN
        else:
            verdict = LayerVerdict.FAIL
        
        logger.info(f"Fraud detection result: {verdict.value} (score: {final_score:.3f})")
        
        return self._create_result(
            verdict=verdict,
            score=final_score,
            details=checks,
            flags=issues if issues else None
        )
