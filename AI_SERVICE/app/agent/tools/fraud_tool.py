"""
Fraud Tool

Wraps FraudDetectionLayer as an LLM-callable tool.
Context is injected by the orchestrator at runtime.
"""
from typing import Dict, Any

from app.pipelines.verification.stages.fraud import FraudDetectionLayer
from app.db.mongo import db


async def run_fraud_check(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run hybrid fraud detection (rules + ML) on the invoice.

    Sub-checks (weights):
      - Duplicate detection   30% — exact / similar invoice matching
      - Vendor validation     20% — known customer registry
      - Pattern analysis      25% — round amounts, Benford's Law, invoice number format
      - Temporal checking     25% — future dates, date manipulation

    ML Random Forest provides a 25% blend; clamped when rule_score < 0.55.

    Returns LayerResult as a plain dict.
    """
    layer = FraudDetectionLayer(db=db)
    result = await layer.analyze(context)
    return result.to_dict()
