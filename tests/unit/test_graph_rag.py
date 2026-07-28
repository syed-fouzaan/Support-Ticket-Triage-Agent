"""
Unit tests for GraphRAG Entity Relationship Knowledge Graph.
"""

from backend.vectordb.graph_rag import retrieve_graph_rag_context


def test_graph_rag_enterprise_customer_traversal():
    res = retrieve_graph_rag_context(query="API error 500", customer_id="cus_web_user")

    assert res["entity_tier"] == "ENTERPRISE"
    assert "INC-8082" in res["linked_incidents"]
    assert "kb_auth_01" in res["graph_nodes"]
    assert "Linked Incident Graph" in res["graph_context"]


def test_graph_rag_default_customer_traversal():
    res = retrieve_graph_rag_context(query="Billing inquiry", customer_id="cus_unknown")

    assert res["entity_tier"] == "STANDARD"
    assert res["software_version"] == "v2.4.0"
