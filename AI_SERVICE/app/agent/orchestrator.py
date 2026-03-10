"""
Agent Orchestrator

Drop-in replacement for VerificationPipeline (runner.py).

The LLM acts as the orchestrator:
  1. Receives a summary of the invoice.
  2. Decides which tools to call (always all three).
  3. Receives tool results.
  4. Applies scoring rules from the system prompt.
  5. Returns a final structured verdict.

Usage (same as VerificationPipeline):
    from app.agent import AgentOrchestrator

    pipeline = AgentOrchestrator()
    result   = await pipeline.run(context)     # returns PipelineResult
"""
import json
import logging
import re
from typing import Dict, Any, List, Optional

import groq

from app.agent.prompt import SYSTEM_PROMPT
from app.agent.tool_registry import ToolRegistry
from app.core.config import settings                           # contains GROQ_API_KEY
from app.pipelines.verification.result import PipelineResult

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────

MODEL          = "qwen/qwen3-32b"  # Groq hosted Qwen3-32B
MAX_ITERATIONS = 10                 # safety limit — prevents infinite tool-call loops
TEMPERATURE    = 0                  # deterministic scoring decisions


class AgentOrchestrator:
    """
    LLM-based replacement for VerificationPipeline.

    The LLM decides which tools to invoke based on the system prompt.
    All scoring logic (weights, caps, compound penalty) lives in prompt.py,
    not in Python code.
    """

    def __init__(self, api_key: Optional[str] = None) -> None:
        self._client   = groq.AsyncGroq(api_key=api_key or settings.GROQ_API_KEY)
        self._registry = ToolRegistry()

    async def run(
        self,
        context: Dict[str, Any],
        skip_stages: List[str] = None,    # kept for API compatibility with runner.py
    ) -> PipelineResult:
        """
        Run agentic invoice verification.

        Args:
            context:      Same dict as VerificationPipeline.run() expects.
            skip_stages:  Ignored for now — the LLM decides tool usage.

        Returns:
            PipelineResult (same shape as VerificationPipeline returns).
        """
        self._registry.bind_context(context)

        # Inject today's date into the system prompt so the LLM never
        # confuses historical dates with future dates regardless of its
        # training data cutoff.
        from datetime import datetime as _dt
        today_str = _dt.now().strftime("%Y-%m-%d")
        system_content = (
            f"TODAY'S DATE: {today_str}\n"
            f"Any invoice date on or before {today_str} is a PAST date — "
            f"do NOT flag it as a future date under any circumstances.\n"
            f"TEMPORAL_FUTURE only applies when invoice_date > {today_str}.\n\n"
        ) + SYSTEM_PROMPT

        # ── Build conversation ────────────────────────────────────────────────
        messages: List[Dict[str, Any]] = [
            {"role": "system", "content": system_content},
            {"role": "user",   "content": self._invoice_summary(context)},
        ]

        # ── Agent loop ────────────────────────────────────────────────────────
        for iteration in range(MAX_ITERATIONS):
            logger.debug(f"[Agent] Iteration {iteration + 1}")

            response = await self._client.chat.completions.create(
                model=MODEL,
                temperature=TEMPERATURE,
                messages=messages,
                tools=self._registry.schemas,
                tool_choice="auto",
            )

            message = response.choices[0].message

            # ── Tool calls ────────────────────────────────────────────────────
            if message.tool_calls:
                messages.append(message)                          # assistant turn

                for tool_call in message.tool_calls:
                    name   = tool_call.function.name
                    args   = tool_call.function.arguments or "{}"
                    logger.info(f"[Agent] Calling tool: {name}")

                    result = await self._registry.call(name, args)

                    messages.append({
                        "role":         "tool",
                        "tool_call_id": tool_call.id,
                        "content":      json.dumps(result),
                    })
                continue   # let LLM process results and decide next action

            # ── Final verdict (no more tool calls) ───────────────────────────
            raw = message.content or ""

            # Qwen3 wraps reasoning in <think>…</think> before the JSON.
            # Strip those blocks first so the JSON parser sees clean output.
            clean_raw = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL).strip()

            # Also handle markdown code fences (```json … ```).
            code_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", clean_raw)
            if code_match:
                clean_raw = code_match.group(1).strip()

            try:
                verdict = json.loads(clean_raw)
            except json.JSONDecodeError:
                # Last resort: extract outermost JSON object from prose.
                start = clean_raw.find("{")
                end   = clean_raw.rfind("}") + 1
                try:
                    verdict = json.loads(clean_raw[start:end]) if start != -1 else {}
                except json.JSONDecodeError:
                    logger.warning("[Agent] Could not parse LLM verdict JSON — using empty verdict.")
                    verdict = {}

            return self._build_result(verdict, messages)

        # Fallback: agent exhausted iterations without a verdict
        logger.error("[Agent] MAX_ITERATIONS reached without a verdict — returning conservative result.")
        return self._fallback_result()

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _invoice_summary(self, context: Dict[str, Any]) -> str:
        """
        Build a brief invoice summary for the LLM's first user message.
        This gives the model enough metadata to reason about before calling tools.
        """
        from datetime import datetime
        today_str = datetime.now().strftime("%Y-%m-%d")

        fields = context.get("parsed_fields", {})
        issued_to = (
            fields.get("issuedTo")
            or fields.get("customerName")
            or fields.get("vendorName")
            or "N/A"
        )
        return (
            f"Today's date  : {today_str}\n\n"
            "Please verify the following invoice.\n\n"
            f"Invoice number : {fields.get('invoiceNumber', 'N/A')}\n"
            f"Customer       : {issued_to}\n"
            f"Invoice date   : {fields.get('invoiceDate',   'N/A')}\n"
            f"Total amount   : {fields.get('totalAmount',   'N/A')}\n\n"
            "Call check_layout, check_anomaly, and check_fraud, then return your verdict as JSON."
        )

    def _build_result(
        self,
        verdict: Dict[str, Any],
        messages: List[Dict[str, Any]],
    ) -> PipelineResult:
        """Convert the LLM JSON verdict into a PipelineResult."""
        overall_score   = float(verdict.get("overall_score",   0.5))
        overall_verdict = str  (verdict.get("overall_verdict", "flagged"))
        risk_level      = str  (verdict.get("risk_level",      "medium"))
        all_flags       = list (verdict.get("all_flags",       []))
        summary         = str  (verdict.get("summary",         ""))
        layer_scores    = dict (verdict.get("layer_scores",    {}))

        # Guard: LLM sometimes returns an empty summary string.
        # Build a meaningful one from the verdict data instead of storing "".
        if not summary.strip():
            if overall_verdict == "clean":
                summary = (
                    "Invoice passed all verification checks — math is correct, "
                    "date is valid, no duplicate detected, and all fields are consistent."
                )
            elif all_flags:
                readable = [
                    f.split(":", 1)[1].strip() if ":" in f else f
                    for f in all_flags[:3]
                ]
                summary = f"Invoice flagged for review — {', '.join(readable)}."
            else:
                summary = "Invoice flagged for review — requires manual verification."

        # Reconstruct layer_results list from tool messages so callers get
        # the same detailed breakdown that VerificationPipeline provides.
        # Messages can be plain dicts (tool replies) OR Pydantic ChatCompletionMessage
        # objects (assistant turns) — handle both.
        layer_results = []
        for msg in messages:
            role    = msg.get("role")    if isinstance(msg, dict) else getattr(msg, "role",    None)
            content = msg.get("content") if isinstance(msg, dict) else getattr(msg, "content", None)
            if role == "tool" and content:
                try:
                    layer_results.append(json.loads(content))
                except (json.JSONDecodeError, TypeError):
                    pass

        return PipelineResult(
            overall_verdict=overall_verdict,
            overall_score=overall_score,
            risk_level=risk_level,
            layer_results=layer_results,
            all_flags=all_flags,
            summary=summary,
        )

    def _fallback_result(self) -> PipelineResult:
        """Conservative fallback when the agent fails to produce a verdict."""
        return PipelineResult(
            overall_verdict="flagged",
            overall_score=0.50,
            risk_level="medium",
            layer_results=[],
            all_flags=["AGENT_ERROR: orchestrator exhausted iterations"],
            summary="Verification incomplete — manual review required.",
        )
