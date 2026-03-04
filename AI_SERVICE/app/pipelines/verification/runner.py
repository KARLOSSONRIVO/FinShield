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
    SCORE_CLEAN_THRESHOLD = 0.85    # raised from 0.80 — harder to pass as clean
    SCORE_FLAGGED_THRESHOLD = 0.50

    # Hard score ceilings for critical flags — applied AFTER weighted average.
    # If a flag substring matches, overall_score is capped at this value.
    # This prevents clean verdicts even when other layers are fine.
    CRITICAL_FLAG_CAPS = {
        "DUPLICATE_EXACT":    0.30,  # Confirmed exact duplicate → fraudulent
        "DUPLICATE_NUMBER":   0.35,  # Same invoice number + vendor → fraudulent
        "DUPLICATE_SIMILAR":  0.55,  # Same vendor/amount/date → flagged high
        "DUPLICATE_RECENT":   0.65,  # Close amount within 7 days → flagged medium
        "TEMPORAL_FUTURE":    0.40,  # Future-dated invoice → always high risk
        "PATTERN_ROUND":      0.75,  # Round/exact amount → always flagged
        "CUSTOMER_UNKNOWN":   0.70,  # Unknown customer → always flagged
        "Extremely high amount": 0.60,  # $1M+ invoice → high risk
        "HIGH_TAX_RATE":      0.55,  # Abnormal tax rate → flagged high
        "MATH_MISCALCULATION": 0.45, # Subtotal+tax ≠ total → high risk
        "ROUND_NUMBER":       0.75,  # Anomaly round number → always flagged
    }

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

                # Debug: show per-layer breakdown
                print(f"  [{result.layer_name.upper():20}]  score={result.score:.4f}  verdict={result.verdict}  flags={result.flags}")
        
        # Calculate overall score (weighted average of active stages)
        # Weights are re-normalized when stages are skipped
        if active_scores:
            total_weight = sum(w for _, w in active_scores)
            overall_score = sum(s * w for s, w in active_scores) / total_weight
        else:
            overall_score = 1.0  # All stages skipped

        # Apply hard caps for critical flags — cannot raise score, only lower it
        overall_score = self._apply_critical_flag_caps(overall_score, all_flags)

        print(f"\n{'='*60}")
        print(f"[PIPELINE SCORE BREAKDOWN]")
        for s, w in active_scores:
            print(f"  score={s:.4f}  weight={w}")
        print(f"  weighted avg (before caps) = {sum(s*w for s,w in active_scores)/sum(w for _,w in active_scores):.4f}")
        print(f"  overall_score (after caps) = {overall_score:.4f}")
        print(f"  aiRiskScore                = {(1 - overall_score)*100:.2f}")
        print(f"  all_flags: {all_flags}")
        print(f"{'='*60}\n")
        
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
    
    def _apply_critical_flag_caps(self, score: float, flags: List[str]) -> float:
        """Cap overall_score if any critical flag is present. Never raises the score."""
        min_score = score

        # Step 1: Apply individual hard caps
        for flag in flags:
            for pattern, cap in self.CRITICAL_FLAG_CAPS.items():
                if pattern in flag:
                    min_score = min(min_score, cap)

        # Step 2: Compound penalty — each severe flag beyond the 2nd reduces score
        # an additional 8% (max 40% total reduction). Punishes invoices with
        # many simultaneous red flags.
        SEVERE_PATTERNS = [
            "TEMPORAL_FUTURE", "DUPLICATE_EXACT", "DUPLICATE_NUMBER",
            "CUSTOMER_UNKNOWN", "PATTERN_ROUND", "ROUND_NUMBER",
            "Extremely high amount", "Perfectly round",
            "MATH_MISCALCULATION", "HIGH_TAX_RATE",
        ]
        severe_count = sum(
            1 for flag in flags
            if any(p in flag for p in SEVERE_PATTERNS)
        )
        if severe_count > 2:
            extra = severe_count - 2
            penalty = min(extra * 0.08, 0.40)   # 8% per extra flag, max 40%
            min_score = min_score * (1.0 - penalty)
            print(f"  [COMPOUND PENALTY] {severe_count} severe flags → -{penalty*100:.0f}% → capped at {min_score:.4f}")

        return min_score

    def _calculate_risk_level(self, score: float, flags: List[str]) -> str:
        """Calculate risk level based on score and flags."""
        # Specific severe flag patterns → always high risk
        high_risk_patterns = [
            "CRITICAL", "FRAUDULENT",
            "DUPLICATE_EXACT", "DUPLICATE_NUMBER",
            "TEMPORAL_FUTURE",
        ]
        for flag in flags:
            if any(p in flag for p in high_risk_patterns):
                return "high"

        if score >= 0.85:
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
