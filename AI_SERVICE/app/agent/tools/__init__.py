"""
Agent Tools Package

Each tool wraps one pipeline layer.
Context is injected by the orchestrator — the LLM sees no arguments.
"""
from app.agent.tools.layout_tool import run_layout_check
from app.agent.tools.anomaly_tool import run_anomaly_check
from app.agent.tools.fraud_tool import run_fraud_check

TOOL_MAP = {
    "check_layout":  run_layout_check,
    "check_anomaly": run_anomaly_check,
    "check_fraud":   run_fraud_check,
}

__all__ = ["run_layout_check", "run_anomaly_check", "run_fraud_check", "TOOL_MAP"]
