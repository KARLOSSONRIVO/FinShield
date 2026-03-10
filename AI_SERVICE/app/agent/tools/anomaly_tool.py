"""
Anomaly Tool

Wraps AnomalyDetectionLayer as an LLM-callable tool.
Context is injected by the orchestrator at runtime.
"""
from typing import Dict, Any

from app.pipelines.verification.stages.anomaly import AnomalyDetectionLayer
from app.db.mongo import db


async def run_anomaly_check(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run rule-based anomaly detection on the invoice.

    Checks:
      - Line item math (subtotal + tax == total)
      - Tax rate sanity (>15% flag, >25% warn, >50% critical)
      - Date validity (future dates, stale dates)
      - Extreme amount detection (>$1M)
      - Round number detection ($10k, $1M multiples)

    Returns LayerResult as a plain dict.
    """
    layer = AnomalyDetectionLayer(db=db)
    result = await layer.analyze(context)
    return result.to_dict()
