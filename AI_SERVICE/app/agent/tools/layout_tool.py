"""
Layout Tool

Wraps LayoutDetectionLayer as an LLM-callable tool.
Context is injected by the orchestrator at runtime.
"""
from typing import Dict, Any

from app.pipelines.verification.stages.layout import LayoutDetectionLayer


async def run_layout_check(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run layout verification against the organization's expected invoice template.

    Checks:
      - Field presence (required fields exist)
      - Field position (fields in expected positions)
      - Logo / header appearance

    Returns LayerResult as a plain dict.
    """
    layer = LayoutDetectionLayer()
    result = await layer.analyze(context)
    return result.to_dict()
