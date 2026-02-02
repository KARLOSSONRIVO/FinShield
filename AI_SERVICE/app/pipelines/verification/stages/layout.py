"""
Stage 1: Layout Verification

Compares the extracted invoice layout against the organization's
registered template layout to detect structural anomalies.
"""
from typing import Dict, Any, List, Optional
from app.pipelines.verification.stages.base import BaseLayer, LayerResult, LayerVerdict
from app.engines.layout.comparison_engine import LayoutComparisonEngine


class LayoutDetectionLayer(BaseLayer):
    """Stage 1: Compare invoice layout to organization template."""
    
    layer_name = "layout_detection"
    
    # Thresholds for scoring (kept for verdict determination)
    # Higher threshold to catch subtle template differences
    SCORE_PASS_THRESHOLD = 0.95  # Must be very close match to pass
    SCORE_WARN_THRESHOLD = 0.85  # Moderate similarity gets warning
    
    def __init__(self):
        self.engine = LayoutComparisonEngine()
    
    async def analyze(self, context: Dict[str, Any]) -> LayerResult:
        """
        Compare invoice layout against org template.
        """
        extracted = context.get("extracted_layout", {})
        template = context.get("template_layout", {})
        
        # Handle missing template
        if not template or not template.get("fields"):
            return self._create_result(
                verdict=LayerVerdict.SKIP,
                score=1.0,
                details={"reason": "No template registered for organization"},
                flags=["NO_TEMPLATE"]
            )
        
        # Handle missing extraction
        if not extracted or not extracted.get("fields"):
            return self._create_result(
                verdict=LayerVerdict.FAIL,
                score=0.0,
                details={"reason": "Failed to extract layout from invoice"},
                flags=["EXTRACTION_FAILED"]
            )
        
        # Delegate comparison to engine
        engine_result = self.engine.compare(extracted, template)
        
        # Debug logging
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Layout comparison result: score={engine_result['total_score']:.3f}, flags={engine_result['flags']}")
        logger.info(f"Template structural features: {template.get('structural_features', {}).get('quadrant_density', 'N/A')}")
        logger.info(f"Invoice structural features: {extracted.get('structural_features', {}).get('quadrant_density', 'N/A')}")
        
        total_score = engine_result["total_score"]
        flags = engine_result["flags"]
        details = engine_result["details"]
        
        # Add template/invoice fields to details for reference
        details["template_fields"] = template.get("fields", [])
        details["invoice_fields"] = extracted.get("fields", [])
        
        # Determine verdict
        if total_score >= self.SCORE_PASS_THRESHOLD:
            verdict = LayerVerdict.PASS
        elif total_score >= self.SCORE_WARN_THRESHOLD:
            verdict = LayerVerdict.WARN
        else:
            verdict = LayerVerdict.FAIL
        
        return self._create_result(
            verdict=verdict,
            score=total_score,
            details=details,
            flags=flags
        )
