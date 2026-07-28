"""
SentinelDesk VectorDB — GraphRAG Entity Relationship Knowledge Graph.
Traverses semantic graph relationships between customer entities, active infrastructure incidents, and KB articles.
"""

from __future__ import annotations

from typing import Any, Dict, List
from backend.core.logging import get_logger

logger = get_logger(__name__)

# Enterprise Graph Knowledge Nodes
_ENTITY_GRAPH = {
    "cus_web_user": {
        "tier": "ENTERPRISE",
        "active_incidents": ["INC-8082"],
        "software_version": "v2.4.1",
        "related_kb_ids": ["kb_auth_01", "kb_checkout_02"],
    },
    "default": {
        "tier": "STANDARD",
        "active_incidents": [],
        "software_version": "v2.4.0",
        "related_kb_ids": ["kb_gen_01"],
    }
}


def retrieve_graph_rag_context(query: str, customer_id: str = "cus_web_user") -> Dict[str, Any]:
    """
    Performs graph traversal linking customer entity -> active incident -> KB articles.
    """
    entity = _ENTITY_GRAPH.get(customer_id, _ENTITY_GRAPH["default"])
    incidents = entity.get("active_incidents", [])
    kb_ids = entity.get("related_kb_ids", [])

    graph_snippets: List[str] = []
    if incidents:
        graph_snippets.append(f"Linked Incident Graph: Active incident {', '.join(incidents)} reported on version {entity.get('software_version')}.")
    
    if kb_ids:
        graph_snippets.append(f"Linked Graph KB Nodes: {', '.join(kb_ids)}.")

    logger.info(f"GraphRAG traversal complete customer={customer_id} nodes_traversed={len(incidents) + len(kb_ids)}")

    return {
        "entity_tier": entity.get("tier"),
        "software_version": entity.get("software_version"),
        "linked_incidents": incidents,
        "graph_context": " ".join(graph_snippets),
        "graph_nodes": kb_ids,
    }
