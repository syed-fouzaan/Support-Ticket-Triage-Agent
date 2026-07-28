"""Unit tests for Node 16: LLM-as-a-Judge Quality & Hallucination Evaluator Agent."""
import pytest
from backend.agents.evaluator_agent import evaluator_node


@pytest.mark.asyncio
async def test_evaluator_node_guardrails():
    state = {
        "ticket_id": "TKT-EVAL-001",
        "resolution_draft": "Your password has been reset successfully. Please check your inbox.",
        "resolution_confidence": 0.95,
        "rag_sources": [{"title": "Password Reset Guide"}],
        "audit_trail": [],
    }
    res = await evaluator_node(state)
    assert "evaluation_metrics" in res
    metrics = res["evaluation_metrics"]
    assert metrics["passed_guardrails"] is True
    assert metrics["faithfulness"] >= 0.70
    assert metrics["toxicity_score"] == 0.0
