"""
Stage 2: Anomaly Detection Layer

Hybrid approach:
  - Rule-based validation for mathematical correctness (always runs)
  - ML-based contextual analysis using Isolation Forest (if model exists)
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple

from app.pipelines.verification.stages.base import BaseLayer, LayerResult, LayerVerdict
from app.engines.anomaly.model_loader import get_model_from_s3
from app.engines.anomaly.feature_extractor import FeatureExtractor
from app.engines.anomaly.line_item_parser import LineItemParser
from app.core.config import settings

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
        
        Args:
            context: Dictionary containing:
                - invoice_data: Parsed invoice data from OCR
                - organization_id: Organization ID
                - raw_text: Raw OCR text (optional)
        
        Returns:
            LayerResult with score and verdict
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
        line_item_score, line_item_issue = self._check_line_item_totals(
            invoice_data,
            raw_text
        )
        checks['line_items'] = line_item_score
        if line_item_issue:
            issues.append(line_item_issue)
        
        # 2. Date Validation (20%)
        date_score, date_issue = self._check_date_validity(invoice_data)
        checks['date'] = date_score
        if date_issue:
            issues.append(date_issue)
        
        # 3. Amount Sanity (15%)
        amount_score, amount_issue = self._check_amount_sanity(invoice_data)
        checks['amount'] = amount_score
        if amount_issue:
            issues.append(amount_issue)
        
        # 4. Round Number Detection (15%)
        round_score, round_issue = self._check_round_numbers(invoice_data)
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
                ml_score = self._predict_with_model(model, features)
                checks['ml_anomaly'] = ml_score
                
                # Combine scores
                final_score = (rule_score * self.WEIGHT_RULES) + (ml_score * self.WEIGHT_ML)
                logger.info(f"Combined score (rules {rule_score:.3f} + ML {ml_score:.3f}): {final_score:.3f}")
                
                if ml_score < 0.5:
                    issues.append(f"ML model flagged invoice as anomalous (score: {ml_score:.2f})")
                
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
            details=checks,
            flags=issues if issues else None
        )
    
    def _check_line_item_totals(
        self,
        invoice_data: dict,
        raw_text: str
    ) -> Tuple[float, Optional[str]]:
        """
        Verify line items add up to total (50% weight)
        
        Returns:
            (score, issue_message)
        """
        try:
            # Get invoice totals
            total = float(invoice_data.get('total', 0))
            subtotal = float(invoice_data.get('subtotal', 0))
            tax = float(invoice_data.get('tax', 0))
            
            if total == 0:
                return 0.5, "Total amount is zero"
            
            # If subtotal/tax not provided, try to parse from text
            if (subtotal == 0 or tax == 0) and raw_text:
                parsed_totals = self.line_item_parser.extract_totals(raw_text)
                if subtotal == 0 and parsed_totals.get('subtotal'):
                    subtotal = parsed_totals['subtotal']
                if tax == 0 and parsed_totals.get('tax'):
                    tax = parsed_totals['tax']
            
            # Calculate expected total
            expected_total = subtotal + tax
            
            # If we don't have subtotal/tax, can't validate
            if expected_total == 0:
                return 0.7, "Unable to verify line item totals (missing subtotal/tax)"
            
            # Calculate discrepancy
            discrepancy = abs(expected_total - total)
            discrepancy_pct = (discrepancy / total) * 100 if total > 0 else 0
            
            # Apply tolerance (default 2%)
            tolerance_pct = settings.ANOMALY_MATH_TOLERANCE * 100
            
            if discrepancy_pct <= tolerance_pct:
                return 1.0, None
            elif discrepancy_pct <= 5.0:
                return 0.6, f"Math discrepancy: {discrepancy_pct:.1f}% (medium severity)"
            elif discrepancy_pct <= 10.0:
                return 0.3, f"Math discrepancy: {discrepancy_pct:.1f}% (high severity)"
            else:
                return 0.0, f"Math discrepancy: {discrepancy_pct:.1f}% (critical severity)"
                
        except Exception as e:
            logger.error(f"Error checking line items: {e}")
            return 0.5, f"Error verifying line item totals: {str(e)}"
    
    def _check_date_validity(self, invoice_data: dict) -> Tuple[float, Optional[str]]:
        """
        Check if invoice date is logical (20% weight)
        
        Returns:
            (score, issue_message)
        """
        try:
            date_str = invoice_data.get('date')
            if not date_str:
                return 0.7, "No date provided"
            
            invoice_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            today = datetime.now()
            
            # Check future dates (more than 30 days)
            days_future = (invoice_date - today).days
            if days_future > 30:
                return 0.0, f"Invoice dated {days_future} days in future"
            
            # Check backdated (more than 1 year)
            days_past = (today - invoice_date).days
            if days_past > 365:
                return 0.5, f"Invoice dated {days_past} days ago (over 1 year)"
            
            return 1.0, None
            
        except Exception as e:
            logger.error(f"Error checking date: {e}")
            return 0.7, f"Invalid date format: {str(e)}"
    
    def _check_amount_sanity(self, invoice_data: dict) -> Tuple[float, Optional[str]]:
        """
        Check if amounts are reasonable (15% weight)
        
        Returns:
            (score, issue_message)
        """
        try:
            total = float(invoice_data.get('total', 0))
            
            if total <= 0:
                return 0.0, f"Invalid total amount: ${total}"
            
            if total > 1000000:
                return 0.3, f"Unusually high amount: ${total:,.2f}"
            
            return 1.0, None
            
        except Exception as e:
            logger.error(f"Error checking amounts: {e}")
            return 0.5, f"Unable to verify amounts: {str(e)}"
    
    def _check_round_numbers(self, invoice_data: dict) -> Tuple[float, Optional[str]]:
        """
        Detect suspiciously round amounts (15% weight)
        
        Returns:
            (score, issue_message)
        """
        try:
            total = float(invoice_data.get('total', 0))
            
            if total <= 0:
                return 1.0, None
            
            if total % 1000 == 0:
                return 0.5, f"Suspiciously round amount: ${total:,.2f}"
            
            if total % 100 == 0:
                return 0.7, f"Round amount detected: ${total:,.2f}"
            
            return 1.0, None
            
        except Exception as e:
            logger.error(f"Error checking round numbers: {e}")
            return 1.0, None
    
    def _predict_with_model(self, model, features: list) -> float:
        """
        Get anomaly score from Isolation Forest
        
        Args:
            model: Trained Isolation Forest
            features: Feature vector
        
        Returns:
            Normalized score (0.0 = anomaly, 1.0 = normal)
        """
        try:
            # Predict anomaly score
            # Returns negative for anomalies, positive for normal
            raw_score = model.decision_function([features])[0]
            
            # Normalize to 0-1 range
            # Typical range: -1.5 to 1.5
            normalized = (raw_score + 1.5) / 3.0
            
            # Clamp to [0, 1]
            normalized = max(0.0, min(1.0, normalized))
            
            logger.debug(f"ML prediction - raw: {raw_score:.3f}, normalized: {normalized:.3f}")
            return normalized
            
        except Exception as e:
            logger.error(f"Error in model prediction: {e}")
            return 0.5  # Neutral score on error
