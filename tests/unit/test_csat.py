"""
Unit tests for CSAT & Customer Sentiment Predictor Node.
"""

import pytest
from backend.agents.csat_agent import csat_node


@pytest.mark.asyncio
async def test_csat_high_confidence_enterprise():
    state = {
        "ticket_id": "TKT-CSAT-1",
        "customer_tier": "enterprise",
        "urgency": "HOT",
        "resolution_confidence": 0.95,
        "is_injection_attempt": False,
        "is_sla_breached": False,
        "audit_trail": []
    }

    res = await csat_node(state)
    assert res["predicted_csat"] >= 4.8
    assert res["csat_category"] == "VERY_POSITIVE"


@pytest.mark.asyncio
async def test_csat_sla_breached_penalty():
    state = {
        "ticket_id": "TKT-CSAT-2",
        "customer_tier": "free",
        "urgency": "WARM",
        "resolution_confidence": 0.70,
        "is_injection_attempt": False,
        "is_sla_breached": True,
        "audit_trail": []
    }

    res = await csat_node(state)
    assert res["predicted_csat"] < 3.0
    assert res["csat_category"] in ("AT_RISK", "CRITICAL")
