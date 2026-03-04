"""
Tool Registry

Defines OpenAI function-calling schemas for each tool and provides
a dispatch method that injects the pipeline context at call time.

The LLM sees clean, argument-free function signatures.
The orchestrator resolves calls by passing context internally.
"""
import json
from typing import Dict, Any, List

from app.agent.tools import TOOL_MAP


# ── OpenAI function-calling schemas ──────────────────────────────────────────
# Tools have no LLM-visible parameters; context is injected by the orchestrator.

TOOL_SCHEMAS: List[Dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "check_layout",
            "description": (
                "Analyze the invoice layout against the organization's expected template. "
                "Checks field presence, field positions, and visual structure. "
                "Returns a score (1.0 = perfect match) and a list of flags."
            ),
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "check_anomaly",
            "description": (
                "Run rule-based anomaly detection on the invoice. "
                "Checks line-item math, tax rate sanity (flags >15%), extreme amounts (>$1M), "
                "round numbers ($10k/$1M multiples), and date validity. "
                "Returns a score (1.0 = no anomalies) and a list of flags."
            ),
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "check_fraud",
            "description": (
                "Run hybrid fraud detection (rule-based 75% + ML Random Forest 25%). "
                "Sub-checks: duplicate detection (30%), vendor validation (20%), "
                "pattern analysis/Benford's Law (25%), temporal anomalies (25%). "
                "ML score is clamped if rule_score < 0.55. "
                "Returns a score (1.0 = no fraud signals) and a list of flags."
            ),
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
]


class ToolRegistry:
    """Dispatches LLM tool calls with injected pipeline context."""

    def __init__(self) -> None:
        self._schemas = TOOL_SCHEMAS
        self._context: Dict[str, Any] = {}

    @property
    def schemas(self) -> List[Dict[str, Any]]:
        return self._schemas

    def bind_context(self, context: Dict[str, Any]) -> None:
        """Bind the invoice context for the current pipeline run."""
        self._context = context

    async def call(self, tool_name: str, arguments_json: str) -> Dict[str, Any]:
        """
        Execute a tool by name.

        Args:
            tool_name: One of check_layout | check_anomaly | check_fraud
            arguments_json: Raw JSON string from the LLM (ignored — context is injected)

        Returns:
            Tool result dict
        """
        fn = TOOL_MAP.get(tool_name)
        if fn is None:
            return {"error": f"Unknown tool: {tool_name}"}

        try:
            return await fn(self._context)
        except Exception as exc:
            return {"error": str(exc), "tool": tool_name}
