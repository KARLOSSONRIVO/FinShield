"""
Stage 2: Anomaly Detection Layer (Refactored)

Hybrid approach:
  - Rule-based validation for mathematical correctness (always runs)
  - ML-based contextual analysis using Isolation Forest (if model exists)
"""

import logging
from typing import Dict, Any, List

from app.pipelines.verification.stages.base import BaseLayer, LayerResult, LayerVerdict
from app.engines.anomaly.model_loader import get_model_from_s3
from app.engines.anomaly.feature_extractor import FeatureExtractor
from app.engines.anomaly.line_item_parser import LineItemParser

from .rules import check_line_item_totals, check_date_validity, check_amount_sanity, check_round_numbers
from .ml import predict_anomaly_score, explain_ml_anomaly

logger = logging.getLogger(__name__)


class AnomalyDetectionLayer(BaseLayer):
    """
    Anomaly Detection Layer
    
    Validates invoice using:
      1. Rule-based checks (always runs): math, dates, amounts, patterns
      2. ML model predictions (if model exists): contextual anomaly detection
    """
    
    layer_name = "anomaly_detection"
    
    # Verdict thresholds
    SCORE_PASS_THRESHOLD = 0.75
    SCORE_WARN_THRESHOLD = 0.50
    
    # Rule weights (must sum to 1.0)
    WEIGHT_LINE_ITEMS = 0.50
    WEIGHT_DATE = 0.20
    WEIGHT_AMOUNT = 0.15
    WEIGHT_ROUND_NUMBER = 0.15
    
    # Hybrid weights (if model exists)
    WEIGHT_RULES = 0.6
    WEIGHT_ML = 0.4
    
    def __init__(self, db):
        super().__init__()
        self.db = db
        self.feature_extractor = FeatureExtractor()
        self.line_item_parser = LineItemParser()
    
    async def analyze(self, context: Dict[str, Any]) -> LayerResult:
        """
        Process invoice through anomaly detection
        """
        invoice_data = context.get('invoice_data', {})
        organization_id = context.get('organization_id')
        raw_text = context.get('raw_text', '')
        
        if not organization_id:
            logger.error("No organization_id provided to anomaly detection")
            return self._create_result(
                verdict=LayerVerdict.FAIL,
                score=0.0,
                details={"error": "Missing organization_id"},
                flags=["MISSING_ORG_ID"]
            )
        
        issues = []
        checks = {}
        
        # PART 1: Rule-Based Validation (Always Runs)
        logger.info(f"Running rule-based validation for org {organization_id}")
        
        # 1. Line Item Total Verification (50%)
        line_item_score, line_item_issue = check_line_item_totals(
            invoice_data,
            raw_text,
            self.line_item_parser
        )
        checks['line_items'] = line_item_score
        if line_item_issue:
            issues.append(line_item_issue)
        
        # 2. Date Validation (20%)
        date_score, date_issue = check_date_validity(invoice_data)
        checks['date'] = date_score
        if date_issue:
            issues.append(date_issue)
        
        # 3. Amount Sanity (15%)
        amount_score, amount_issue = check_amount_sanity(invoice_data)
        checks['amount'] = amount_score
        if amount_issue:
            issues.append(amount_issue)
        
        # 4. Round Number Detection (15%)
        round_score, round_issue = check_round_numbers(invoice_data)
        checks['round_number'] = round_score
        if round_issue:
            issues.append(round_issue)
        
        # Calculate weighted rule score
        rule_score = (
            line_item_score * self.WEIGHT_LINE_ITEMS +
            date_score * self.WEIGHT_DATE +
            amount_score * self.WEIGHT_AMOUNT +
            round_score * self.WEIGHT_ROUND_NUMBER
        )
        
        logger.info(f"Rule-based score: {rule_score:.3f}")
        
        # PART 2: ML-Based Contextual Analysis (If Model Exists)
        model = get_model_from_s3(organization_id)
        
        if model:
            logger.info(f"Model found for org {organization_id}, running ML prediction")
            
            try:
                # Extract features
                features = self.feature_extractor.extract_features(
                    invoice_data,
                    organization_id,
                    self.db
                )
                
                # Get anomaly score from model
                ml_score = predict_anomaly_score(model, features)
                # Do NOT put ml_score or raw check scores in details — the LLM
                # would enumerate them individually. The explanation lives in flags.

                # Combine scores
                final_score = (rule_score * self.WEIGHT_RULES) + (ml_score * self.WEIGHT_ML)
                logger.info(f"Combined score (rules {rule_score:.3f} + ML {ml_score:.3f}): {final_score:.3f}")
                
                if ml_score < 0.5:
                    issues.append(f"ML anomaly: {explain_ml_anomaly(features, ml_score)}")
                
            except Exception as e:
                logger.error(f"Error in ML prediction: {e}")
                final_score = rule_score
                issues.append(f"ML prediction failed: {str(e)}")
        else:
            logger.info(f"No model found for org {organization_id}, using rules only")
            final_score = rule_score
            checks['ml_status'] = 'no_model'
        
        # Determine verdict
        if final_score >= self.SCORE_PASS_THRESHOLD:
            verdict = LayerVerdict.PASS
        elif final_score >= self.SCORE_WARN_THRESHOLD:
            verdict = LayerVerdict.WARN
        else:
            verdict = LayerVerdict.FAIL
        
        return self._create_result(
            verdict=verdict,
            score=final_score,
            # Only expose the verdict summary counts, not raw check scores.
            # Raw scores (line_items, date, amount, round_number, ml_anomaly)
            # cause the LLM to invent its own enumeration instead of using flags.
            details={"model_used": checks.get("ml_status") != "no_model"},
            flags=issues if issues else None
        )
