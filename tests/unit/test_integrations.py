"""
Unit tests for Slack & Zendesk inbound integration webhooks.
"""

import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_slack_webhook_ingestion():
    payload = {
        "user_id": "U_SLACK_TEST",
        "user_name": "Test Slack User",
        "user_email": "test.slack@company.com",
        "text": "Payment API error POST /checkout failing with 500",
        "channel_id": "C_TEST"
    }
    response = client.post("/api/v1/integrations/slack", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["channel"] == "slack"
    assert "TKT-SLACK" in data["id"]


def test_zendesk_webhook_ingestion():
    payload = {
        "ticket_id": "ZD-8849",
        "requester_name": "Zendesk Test Requester",
        "requester_email": "zd.user@company.com",
        "subject": "How to add new seat allocations",
        "description": "We need to add 3 new designer seats mid-cycle.",
        "organization_id": "org_acme"
    }
    response = client.post("/api/v1/integrations/zendesk", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["channel"] == "zendesk"
    assert data["org_id"] == "org_acme"
