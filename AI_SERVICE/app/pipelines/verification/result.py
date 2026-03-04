"""
Pipeline Result

Shared dataclass for the verification pipeline output.
Defined here so it can be imported independently of runner.py.
"""
from dataclasses import dataclass
from typing import Dict, Any, List


@dataclass
class PipelineResult:
    """Result from the complete verification pipeline."""
    overall_verdict: str        # "clean" | "flagged" | "fraudulent"
    overall_score: float        # 0.0–1.0  (1.0 = perfectly clean)
    risk_level: str             # "low" | "medium" | "high" | "critical"
    layer_results: List[Dict[str, Any]]
    all_flags: List[str]
    summary: str
