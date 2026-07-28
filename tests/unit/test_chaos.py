"""
Unit tests for Automated Chaos Engineering & Fault Injection Simulator.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app


@pytest.mark.asyncio
async def test_chaos_fault_injection_latency_spike():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post("/api/v1/chaos/inject", json={"fault_type": "LLM_LATENCY_SPIKE", "duration_seconds": 3})
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "injected"
    assert data["fault_type"] == "LLM_LATENCY_SPIKE"


@pytest.mark.asyncio
async def test_chaos_fault_injection_circuit_breaker():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post("/api/v1/chaos/inject", json={"fault_type": "CIRCUIT_BREAKER_TRIP", "duration_seconds": 5})
    assert r.status_code == 200
    data = r.json()
    assert data["circuit_breaker_state"] == "OPEN"
