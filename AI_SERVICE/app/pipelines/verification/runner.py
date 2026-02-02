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
            
            # Only count non-skipped stages in score
            if result.verdict != LayerVerdict.SKIP:
                active_scores.append(result.score)
        
        # Calculate overall score (average of active stages)
        if active_scores:
            overall_score = sum(active_scores) / len(active_scores)
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
    
    def _generate_summary(
        self,
        results: List[Dict],
        verdict: str,
        flags: List[str]
    ) -> str:
        """Generate a human-readable summary."""
        parts = []
        
        if verdict == "clean":
            parts.append("Invoice passed all verification checks.")
        elif verdict == "flagged":
            parts.append("Invoice flagged for review.")
        else:
            parts.append("Invoice failed verification.")
        
        # Add stage-specific summaries
        for result in results:
            if result["verdict"] == "skip":
                continue
            
            layer = result["layer"]
            layer_verdict = result["verdict"]
            score = result["score"]
            
            if layer == "layout_detection":
                if layer_verdict == "pass":
                    parts.append(f"Layout matches template ({score:.0%}).")
                elif layer_verdict == "warn":
                    parts.append(f"Invoice layout does not follow the organization's template (similarity: {score:.0%}).")
                else:
                    parts.append(f"Invoice layout significantly differs from template ({score:.0%}).")
            
            elif layer == "anomaly_detection":
                if layer_verdict == "pass":
                    parts.append("No anomalies found.")
                elif layer_verdict == "warn":
                    parts.append(f"Potential anomalies detected ({score:.0%}).")
                else:
                    parts.append(f"Significant anomalies detected ({score:.0%}).")
        
        if flags:
            parts.append(f"Flags: {len(flags)} issue(s) detected.")
        
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
