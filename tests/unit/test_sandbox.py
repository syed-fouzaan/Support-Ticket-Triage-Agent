"""
Unit tests for Autonomous API Sandbox Repro Engine.
"""

from backend.core.sandbox import execute_synthetic_sandbox_test


def test_synthetic_sandbox_bug_reproduction():
    ticket_body = "POST /api/v1/checkout failing with HTTP 500 status code during payment processing."
    res = execute_synthetic_sandbox_test(ticket_body, intent="BugReport")

    assert res["method"] == "POST"
    assert res["endpoint"] == "/api/v1/checkout"
    assert res["repro_status"] == "REPRODUCED_500_ERROR"
    assert res["http_code"] == 500


def test_synthetic_sandbox_success_run():
    ticket_body = "GET /api/v2/users returning normal profile information."
    res = execute_synthetic_sandbox_test(ticket_body, intent="GeneralQuery")

    assert res["method"] == "GET"
    assert res["endpoint"] == "/api/v2/users"
    assert res["repro_status"] == "SUCCESS_200_OK"
    assert res["http_code"] == 200
