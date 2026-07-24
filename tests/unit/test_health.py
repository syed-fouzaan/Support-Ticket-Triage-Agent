"""
Milestone 1 acceptance check — Health endpoint returns 200.
ponytail: httpx AsyncClient against the app directly, no server needed.
Env vars injected by conftest.py.
"""
from httpx import AsyncClient, ASGITransport

from backend.main import app


async def test_health_returns_200():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


async def test_liveness_probe():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/api/v1/health/live")
    assert r.status_code == 200


async def test_trace_id_header_returned():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/health", headers={"X-Trace-Id": "my-trace-123"})
    assert r.headers.get("x-trace-id") == "my-trace-123"
