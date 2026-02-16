"""
Verification Pipeline Runner

Orchestrates the verification stages:
1. Layout Verification
2. Anomaly Detection
3. Fraud Detection
"""
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

from app.pipelines.verification.stages.base import LayerResult, LayerVerdict
from app.pipelines.verification.stages.layout import LayoutDetectionLayer
from app.pipelines.verification.stages.anomaly import AnomalyDetectionLayer
from app.pipelines.verification.stages.fraud import FraudDetectionLayer
from app.pipelines.verification.message_templates import FLAG_TEMPLATES, LAYER_MESSAGES

from app.db.mongo import db

@dataclass
class PipelineResult:
    """Result from the complete verification pipeline."""
    overall_verdict: str  # "clean", "flagged", "fraudulent"
    overall_score: float  # 0.0 to 1.0
    risk_level: str  # "low", "medium", "high", "critical"
    layer_results: List[Dict[str, Any]]
    all_flags: List[str]
    summary: str


class VerificationPipeline:
    """
    Verification Pipeline - orchestrates all verification stages.
    """
    
    # Thresholds for overall verdict
    SCORE_CLEAN_THRESHOLD = 0.80
    SCORE_FLAGGED_THRESHOLD = 0.50
    
    # Layer weights for overall score calculation
    # Fraud is most important (supervised ML trained on confirmed fraud data)
    # Anomaly is second (unsupervised ML, catches unknown patterns)
    # Layout is third (heuristic-based, prone to false positives)
    LAYER_WEIGHTS = {
        "fraud_detection": 0.50,
        "anomaly_detection": 0.30,
        "layout_detection": 0.20,
    }
    DEFAULT_WEIGHT = 0.33  # Fallback for unknown layers
    
    def __init__(self):
        self.stages = [
            LayoutDetectionLayer(),
            AnomalyDetectionLayer(db=db),
            FraudDetectionLayer(db=db), 
        ]
    
    async def run(
        self,
        context: Dict[str, Any],
        skip_stages: List[str] = None
    ) -> PipelineResult:
        """
        Run the complete verification pipeline.
        
        Args:
            context: Dictionary containing all invoice data
            skip_stages: List of stage names to skip
            
        Returns:
            PipelineResult with overall verdict and all stage results
        """
        skip_stages = skip_stages or []
        stage_results = []
        all_flags = []
        active_scores = []
        
        for stage in self.stages:
            if stage.layer_name in skip_stages:
                result = stage._create_result(
                    verdict=LayerVerdict.SKIP,
                    score=1.0,
                    details={"reason": "Stage skipped by request"},
                    flags=[]
                )
            else:
                try:
                    result = await stage.analyze(context)
                except Exception as e:
                    # Log error but don't crash pipeline
                    print(f"[Pipeline] Error in stage {stage.layer_name}: {e}")
                    result = stage._create_result(
                        verdict=LayerVerdict.FAIL,
                        score=0.0,
                        details={"error": str(e)},
                        flags=[f"STAGE_ERROR:{stage.layer_name}"]
                    )
            
            stage_results.append(result.to_dict())
            all_flags.extend(result.flags)
            
            # Only count non-skipped stages in score (with weight)
            if result.verdict != LayerVerdict.SKIP:
                weight = self.LAYER_WEIGHTS.get(result.layer_name, self.DEFAULT_WEIGHT)
                active_scores.append((result.score, weight))
        
        # Calculate overall score (weighted average of active stages)
        # Weights are re-normalized when stages are skipped
        if active_scores:
            total_weight = sum(w for _, w in active_scores)
            overall_score = sum(s * w for s, w in active_scores) / total_weight
        else:
            overall_score = 1.0  # All stages skipped
        
        # Determine overall verdict based on score thresholds
        if overall_score >= self.SCORE_CLEAN_THRESHOLD:
            overall_verdict = "clean"
        elif overall_score >= self.SCORE_FLAGGED_THRESHOLD:
            overall_verdict = "flagged"
        else:
            overall_verdict = "fraudulent"
        
        # Determine risk level
        risk_level = self._calculate_risk_level(overall_score, all_flags)
        
        # Generate summary
        summary = self._generate_summary(stage_results, overall_verdict, all_flags)
        
        return PipelineResult(
            overall_verdict=overall_verdict,
            overall_score=overall_score,
            risk_level=risk_level,
            layer_results=stage_results,
            all_flags=all_flags,
            summary=summary,
        )
    
    def _calculate_risk_level(self, score: float, flags: List[str]) -> str:
        """Calculate risk level based on score and flags."""
        # Check for critical flags - map to high
        critical_flags = [f for f in flags if "CRITICAL" in f or "FRAUDULENT" in f]
        if critical_flags:
            return "high"
        
        if score >= 0.80:
            return "low"
        elif score >= 0.50:
            return "medium"
        else:
            return "high"
    
    def _format_flag(self, flag: str) -> str:
        """Convert technical flag to human-readable message using templates."""
        for pattern, template in FLAG_TEMPLATES.items():
            if pattern in flag:
                if callable(template):
                    return template(flag)
                return template
        # Fallback to original flag if no template matches
        return flag
    
    def _generate_summary(
        self,
        results: List[Dict],
        verdict: str,
        flags: List[str]
    ) -> str:
        """Generate a human-readable summary using templates."""
        parts = []
        
        # Collect issues from each layer FIRST
        issues_found = []
        
        for result in results:
            if result["verdict"] == "skip":
                continue
            
            layer = result["layer"]
            layer_verdict = result["verdict"]
            layer_flags = result.get("flags", [])
            
            # Add layer-specific message if available
            if layer in LAYER_MESSAGES:
                layer_msg = LAYER_MESSAGES[layer].get(layer_verdict)
                if layer_msg:
                    issues_found.append(layer_msg)
            
            # Add formatted flags (show ALL flags, not just for warn/fail)
            # Important warnings like new customers should always be visible
            if layer_flags:
                for flag in layer_flags:
                    formatted = self._format_flag(flag)
                    if formatted and formatted not in issues_found:
                        issues_found.append(formatted)
        
        # Overall verdict - adjust message if issues were found
        if issues_found:
            # Don't say "passed" if there are issues, even with clean verdict
            verdict_messages = {
                "clean": "Invoice completed verification with warnings.",
                "flagged": "Invoice flagged for review.",
                "fraudulent": "Invoice failed verification."
            }
        else:
            # No issues - truly clean
            verdict_messages = {
                "clean": "Invoice passed all verification checks.",
                "flagged": "Invoice flagged for review.",
                "fraudulent": "Invoice failed verification."
            }
        parts.append(verdict_messages.get(verdict, "Invoice verification complete."))
        
        # Add specific issues to summary
        if issues_found:
            parts.append("Issues detected:")
            for issue in issues_found[:5]:  # Limit to top 5
                parts.append(f"• {issue}")
            
            if len(issues_found) > 5:
                parts.append(f"• ... and {len(issues_found) - 5} more issue(s)")
        
        return " ".join(parts)


# Helper for backward compatibility or direct use
async def run_layout_detection(
    invoice_layout: Dict[str, Any],
    template_layout: Dict[str, Any],
    org_id: str = None
) -> Dict[str, Any]:
    """Run only the layout detection stage."""
    layer = LayoutDetectionLayer()
    context = {
        "extracted_layout": invoice_layout,
        "template_layout": template_layout,
        "org_id": org_id,
    }
    result = await layer.analyze(context)
    return result.to_dict()
