"""Unit tests for Node 15: Autonomous Action Executor Agent."""
import pytest
from backend.agents.action_executor_agent import action_executor_node


@pytest.mark.asyncio
async def test_action_executor_refund_action():
    state = {
        "ticket_id": "TKT-ACTION-001",
        "intent": "Billing",
        "body": "I need a refund for my duplicate charge",
        "resolution_confidence": 0.92,
        "executed_actions": [],
        "audit_trail": [],
    }
    res = await action_executor_node(state)
    assert len(res["executed_actions"]) == 1
    assert res["executed_actions"][0]["action_type"] == "ISSUE_REFUND_SIMULATED"


@pytest.mark.asyncio
async def test_action_executor_low_confidence_skips():
    state = {
        "ticket_id": "TKT-ACTION-002",
        "intent": "Billing",
        "body": "I need a refund",
        "resolution_confidence": 0.50,  # Below 0.85 threshold
        "executed_actions": [],
        "audit_trail": [],
    }
    res = await action_executor_node(state)
    assert len(res["executed_actions"]) == 0
