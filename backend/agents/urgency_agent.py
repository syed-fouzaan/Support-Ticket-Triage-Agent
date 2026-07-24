"""
SentinelDesk Agent — Urgency & Priority Agent Node.
Assigns HOT, WARM, or COLD priority + numerical score based on SLA, customer tier, and keywords.
"""

from datetime import datetime
from backend.core.logging import get_logger
from backend.graph.state import TicketState

logger = get_logger(__name__)


async def urgency_node(state: TicketState) -> TicketState:
    subject = (state.get("subject") or "").lower()
    body = (state.get("body") or "").lower()
    tier = (state.get("customer_tier") or "free").lower()
    intent = state.get("intent", "GeneralQuery")

    urgency = "COLD"
    urgency_score = 0.30
    rationale = "Standard queue priority."

    # Priority rules
    if intent in ["TechBug", "AbusePolicy"] or any(k in subject or k in body for k in ["urgent", "production", "down", "crash", "500", "double charge"]):
        urgency = "HOT"
        urgency_score = 0.95
        rationale = "Critical production impact or emergency keyword detected."
    elif tier == "enterprise" or intent in ["Billing", "AccountAccess"]:
        urgency = "WARM"
        urgency_score = 0.70
        rationale = "Enterprise tier or action-required business account query."
    else:
        urgency = "COLD"
        urgency_score = 0.25
        rationale = "Non-blocking feature request or general inquiry."

    audit_entry = {
        "step": "Urgency Node",
        "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
        "detail": f"Urgency: {urgency} (Score: {urgency_score:.2f}) | {rationale}",
        "status": "warning" if urgency == "HOT" else "success",
    }

    trail = state.get("audit_trail", [])
    trail.append(audit_entry)

    return {
        **state,
        "urgency": urgency,
        "urgency_score": urgency_score,
        "urgency_rationale": rationale,
        "audit_trail": trail,
    }
