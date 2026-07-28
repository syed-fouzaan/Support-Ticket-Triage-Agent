"""
Unit tests for Outbound Multi-Channel Webhook & Email Notification Engine.
"""

import pytest
from backend.core.webhook_dispatcher import dispatch_ticket_resolution_events


@pytest.mark.asyncio
async def test_outbound_webhook_event_dispatch():
    ticket_record = {
        "id": "TKT-DISPATCH-101",
        "status": "SOLVED",
        "customer_email": "enterprise.admin@acme.com",
        "urgency": "WARM",
        "confidence": 0.95,
        "predicted_csat": 4.9,
        "estimated_cost_usd": 0.00014,
    }

    res = await dispatch_ticket_resolution_events(ticket_record)
    assert res["status"] == "dispatched"
    assert res["event_type"] == "ticket.triaged"
    assert res["ticket_id"] == "TKT-DISPATCH-101"
    assert "enterprise.admin@acme.com" in res["recipients"]
