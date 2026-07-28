"""Unit tests for Ticket Similarity Clustering Engine."""
import pytest
from backend.agents.clustering_agent import clustering_node, _assign_cluster


def test_billing_cluster_assignment():
    assert _assign_cluster("I was charged twice, duplicate invoice") == "Billing & Payments"


def test_auth_cluster_assignment():
    assert _assign_cluster("Login failed, password reset not working, 401 unauthorized") == "Authentication & Access"


def test_api_cluster_assignment():
    assert _assign_cluster("POST endpoint returning 500 error, API crash") == "API & Integration Errors"


def test_general_cluster_fallback():
    cluster = _assign_cluster("Just saying hello there")
    assert cluster == "General Enquiry"


@pytest.mark.asyncio
async def test_clustering_node_execution():
    state = {
        "ticket_id": "TKT-CLUSTER-001",
        "subject": "API 500 error on checkout endpoint",
        "body": "Our API endpoint keeps crashing with 500",
        "audit_trail": [],
    }
    res = await clustering_node(state)
    assert "cluster_label" in res
    assert res["cluster_label"] == "API & Integration Errors"
    assert len(res["audit_trail"]) == 1
