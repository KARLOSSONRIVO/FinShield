"""
Base Stage - Abstract base class for pipeline stages.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum


class LayerVerdict(str, Enum):
    """Verdict from a stage analysis."""
    PASS = "pass"           # Passed all checks
    WARN = "warn"           # Minor issues detected
    FAIL = "fail"           # Major issues detected
    SKIP = "skip"           # Stage skipped (missing data)


@dataclass
class LayerResult:
    """Result from a stage analysis."""
    layer_name: str
    verdict: LayerVerdict
    score: float  # 0.0 to 1.0 (1.0 = perfect match/no issues)
    details: Dict[str, Any]
    flags: list[str]  # List of detected issues

    def to_dict(self) -> Dict[str, Any]:
        return {
            "layer": self.layer_name,
            "verdict": self.verdict.value,
            "score": round(self.score, 4),
            "details": self.details,
            "flags": self.flags,
        }


class BaseLayer(ABC):
    """Abstract base class for pipeline stages."""
    
    layer_name: str = "base"
    
    @abstractmethod
    async def analyze(self, context: Dict[str, Any]) -> LayerResult:
        """
        Analyze the invoice using this stage.
        
        Args:
            context: Dictionary containing:
                - invoice_id: str
                - org_id: str
                - extracted_layout: dict (from OCR)
                - template_layout: dict (from org)
                - extracted_text: str
                - parsed_fields: dict
                
        Returns:
            LayerResult with verdict, score, and details
        """
        pass
    
    def _create_result(
        self,
        verdict: LayerVerdict,
        score: float,
        details: Dict[str, Any],
        flags: list[str] = None
    ) -> LayerResult:
        """Helper to create a LayerResult."""
        return LayerResult(
            layer_name=self.layer_name,
            verdict=verdict,
            score=score,
            details=details,
            flags=flags or []
        )
