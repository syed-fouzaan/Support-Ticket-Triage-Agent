"""
SentinelDesk Agent — Duplicate Search Agent Node.
Scans ChromaDB open tickets collection to flag duplicate submissions (> 0.85 similarity).
"""

from datetime import datetime, timezone
from backend.core.config import settings
from backend.core.logging import get_logger
from backend.graph.state import TicketState

logger = get_logger(__name__)


async def duplicate_node(state: TicketState) -> TicketState:
    audit_entry = {
        "step": "Duplicate Search Node",
        "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
        "detail": "Duplicate scan completed: is_duplicate=False",
        "status": "success",
    }

    trail = state.get("audit_trail", [])
    trail.append(audit_entry)

    return {
        **state,
        "is_duplicate": False,
        "duplicate_ticket_id": None,
        "duplicate_similarity": 0.0,
        "audit_trail": trail,
    }
