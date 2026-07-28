"""
Unit tests for Per-Ticket LLM Token & USD Cost Metering Node.
"""

import pytest
from backend.agents.cost_agent import cost_node


@pytest.mark.asyncio
async def test_cost_metering_node_calculation():
    state = {
        "ticket_id": "TKT-COST-101",
        "subject": "Payment API Failure 500 error",
        "body": "Production checkout API endpoint POST /checkout failing with HTTP 500 status code.",
        "resolution_draft": "Requests to POST /checkout require an Idempotency-Key header. Automatic retries trigger on HTTP 500.",
        "audit_trail": []
    }

    res = await cost_node(state)
    assert res["total_tokens"] > 0
    assert res["estimated_cost_usd"] > 0.0
    assert len(res["audit_trail"]) == 1
