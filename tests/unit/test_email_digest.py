"""Unit tests for Email Digest Scheduler."""
from backend.core.email_digest import _build_digest_body


def test_digest_body_contains_headers():
    stats = {
        "total_tickets": 50,
        "auto_resolved": 35,
        "auto_resolved_pct": 70.0,
        "escalated": 5,
        "open": 10,
        "avg_csat": 4.75,
        "positive_pct": 88.0,
        "sla_breaches": 0,
        "sla_compliance_pct": 100.0,
        "estimated_usd_cost": 0.0070,
        "cost_per_ticket": 0.000140,
        "owasp_blocked": 3,
        "circuit_breaker": "CLOSED",
    }
    body = _build_digest_body(stats)
    assert "SentinelDesk" in body
    assert "50" in body
    assert "4.75" in body
    assert "CLOSED" in body


def test_digest_body_sla_compliance():
    stats = {"sla_breaches": 2, "sla_compliance_pct": 95.0}
    body = _build_digest_body(stats)
    assert "95.0%" in body
    assert "2" in body
