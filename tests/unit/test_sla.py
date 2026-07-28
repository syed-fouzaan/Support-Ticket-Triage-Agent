"""
Unit tests for SLA Monitoring & Breach Escalation Engine.
"""

from datetime import datetime, timedelta, timezone
from backend.core.sla_engine import check_and_escalate_sla_breaches


def test_sla_breach_escalation():
    now = datetime.now(timezone.utc)
    old_time = (now - timedelta(minutes=25)).isoformat()  # HOT threshold is 15m

    test_tickets = [
        {
            "id": "TKT-SLA-1",
            "status": "OPEN",
            "urgency": "HOT",
            "created_at": old_time,
            "audit_trail": []
        },
        {
            "id": "TKT-SLA-2",
            "status": "OPEN",
            "urgency": "HOT",
            "created_at": now.isoformat(),
            "audit_trail": []
        }
    ]

    res = check_and_escalate_sla_breaches(test_tickets)
    assert res["new_breaches_escalated"] == 1
    assert test_tickets[0]["status"] == "ESCALATED"
    assert test_tickets[0]["assigned_team"] == "SLA Tier 3 Ops"
    assert test_tickets[1]["status"] == "OPEN"
