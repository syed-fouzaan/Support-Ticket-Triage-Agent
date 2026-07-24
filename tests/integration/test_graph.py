"""
SentinelDesk Integration Test — LangGraph Multi-Agent State Machine.
Verifies full graph execution: Intake → Intent → Urgency → Duplicate → RAG → Resolution → Decision → END.
"""

import pytest
from backend.graph.workflow import run_ticket_triage_graph


async def test_full_agent_graph_execution():
    initial_state = {
        "ticket_id": "TKT-TEST-001",
        "customer_id": "cus_enterprise_99",
        "customer_name": "Test Customer",
        "customer_email": "test@example.com",
        "customer_tier": "enterprise",
        "subject": "Urgent payment 500 error in checkout",
        "body": "Hi, card 4111-1111-1111-1111 failed with HTTP 500.",
        "channel": "web",
    }

    final_state = await run_ticket_triage_graph(initial_state)

    # Assert all 7 nodes executed and mutated state
    assert final_state["pii_found"] is True
    assert "4111-1111-1111-1111" not in final_state["pii_redacted_body"]
    assert final_state["intent"] == "Billing"
    assert final_state["urgency"] == "HOT"
    assert final_state["final_status"] == "ESCALATED"  # Billing forces escalation
    assert len(final_state["audit_trail"]) >= 7
