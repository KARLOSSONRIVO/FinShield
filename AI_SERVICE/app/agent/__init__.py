"""
Agent Package

Drop-in replacement for VerificationPipeline (runner.py).
The LLM acts as the orchestrator — it decides which tools to invoke,
interprets the results, and produces a final risk verdict.

Entry point: AgentOrchestrator (orchestrator.py)
"""
from app.agent.orchestrator import AgentOrchestrator

__all__ = ["AgentOrchestrator"]
