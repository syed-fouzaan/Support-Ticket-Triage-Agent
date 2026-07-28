"""
Unit tests for Autonomous Self-Healing Feedback Loop Agent.
"""

from backend.agents.self_healing_agent import process_operator_feedback


def test_self_healing_feedback_processing():
    res = process_operator_feedback(
        ticket_id="TKT-HEAL-101",
        subject="Payment API Idempotency Failure",
        original_draft="Please retry payment manually.",
        corrected_draft="Requests to POST /checkout require an Idempotency-Key header. Automatic retries trigger on HTTP 500, 502, 503.",
        operator_notes="Added Idempotency-Key requirement details"
    )
    assert res["status"] in ("success", "deferred")
    assert "Self-Healing Loop" in res["message"]
