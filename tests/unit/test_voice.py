"""
Unit tests for Synthetic Audio & Voice Ticket Transcriber.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app


@pytest.mark.asyncio
async def test_voice_ticket_submission():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post("/api/v1/tickets/voice", json={
            "customer_id": "cus_voice_test",
            "customer_email": "caller.test@example.com",
            "transcription_text": "Calling to report 500 server error on payment checkout endpoint."
        })
    assert r.status_code == 201
    data = r.json()
    assert data["channel"] == "voice"
    assert "transcription" in data
    assert data["status"] in ["SOLVED", "ESCALATED", "OPEN"]
