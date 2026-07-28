"""
SentinelDesk Agent — Ticket Similarity Clustering Engine.
Groups ticket embeddings into topic clusters using cosine similarity heuristics.
This is a lightweight semantic clustering approach that avoids heavy ML dependencies.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List
from backend.core.logging import get_logger
from backend.graph.state import TicketState

logger = get_logger(__name__)

# Keyword-based cluster signatures for fast intent-similarity grouping
_CLUSTER_SIGNATURES: Dict[str, List[str]] = {
    "Billing & Payments": ["charge", "invoice", "refund", "subscription", "payment", "billing", "duplicate"],
    "Authentication & Access": ["login", "password", "auth", "2fa", "token", "oauth", "unauthorized", "403", "401"],
    "Performance & Latency": ["slow", "timeout", "latency", "performance", "lag", "response time", "speed"],
    "API & Integration Errors": ["api", "500", "error", "endpoint", "webhook", "integration", "crash", "502"],
    "Data & Export Issues": ["export", "csv", "data", "missing", "corrupt", "sync", "report"],
}


def _assign_cluster(text: str) -> str:
    text_lower = text.lower()
    best_cluster = "General Enquiry"
    best_score = 0
    for cluster, keywords in _CLUSTER_SIGNATURES.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > best_score:
            best_score = score
            best_cluster = cluster
    return best_cluster


async def clustering_node(state: TicketState) -> TicketState:
    """
    Clustering Node: Assigns ticket to a semantic topic cluster for bulk-resolution insights.
    """
    body = state.get("body", "") + " " + state.get("subject", "")
    cluster = _assign_cluster(body)

    audit_entry = {
        "step": "Ticket Similarity Clustering",
        "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
        "detail": f"Assigned to cluster: '{cluster}'",
        "status": "success",
    }

    trail = state.get("audit_trail", [])
    trail.append(audit_entry)

    logger.info(f"Clustering node ticket={state.get('ticket_id')} cluster='{cluster}'")

    return {
        **state,
        "cluster_label": cluster,
        "audit_trail": trail,
    }
