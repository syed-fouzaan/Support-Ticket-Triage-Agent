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


async def test_export_audit_certificate():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create ticket first
        post_res = await client.post("/api/v1/tickets", json={
            "customer_id": "cus_audit_test",
            "customer_name": "Audit Tester",
            "customer_email": "audit@company.com",
            "customer_tier": "pro",
            "subject": "Audit cert export test ticket",
            "body": "Testing audit certificate export generation",
            "channel": "web"
        })
        assert post_res.status_code == 201
        tkt_id = post_res.json()["id"]

        r = await client.get(f"/api/v1/tickets/{tkt_id}/export-audit")
    assert r.status_code == 200
    data = r.json()
    assert "sha256_verification_hash" in data
    assert data["pii_sanitization_verified"] is True


async def test_chromadb_dual_node_failover():
    from backend.vectordb.client import check_chromadb_health_dual_node, get_or_create_collection
    health = check_chromadb_health_dual_node()
    assert "primary_node" in health
    assert "replica_node" in health

    col = get_or_create_collection("faq")
    assert col is not None


async def test_prometheus_metrics_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/api/v1/analytics/prometheus")
    assert r.status_code == 200
    assert "sentineldesk_tickets_total" in r.text
    assert "sentineldesk_auto_resolved_ratio" in r.text
