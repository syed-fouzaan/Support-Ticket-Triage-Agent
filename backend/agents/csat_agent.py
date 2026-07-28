"""
SentinelDesk Agent — CSAT & Customer Sentiment Predictor Node.
Predicts expected CSAT score (1.0 to 5.0 stars) and sentiment category (VERY_POSITIVE to CRITICAL).
"""

from datetime import datetime, timezone
from backend.core.logging import get_logger
from backend.graph.state import TicketState

logger = get_logger(__name__)


async def csat_node(state: TicketState) -> TicketState:
    confidence = state.get("resolution_confidence", 0.85)
    urgency = state.get("urgency", "WARM")
    customer_tier = state.get("customer_tier", "pro")
    is_injection = state.get("is_injection_attempt", False)
    is_sla_breached = state.get("is_sla_breached", False)

    # Base CSAT calculation derived from resolution confidence
    base_csat = 1.0 + (confidence * 4.0)  # Maps 0.0->1.0 to 1.0->5.0

    # Tier adjustment
    if customer_tier == "enterprise":
        base_csat += 0.2
    elif customer_tier == "free":
        base_csat -= 0.1

    # Penalties for SLA breach or security injection
    if is_sla_breached:
        base_csat -= 1.2
    if is_injection:
        base_csat = 1.0

    # Clamp CSAT between 1.0 and 5.0
    predicted_csat = round(max(1.0, min(5.0, base_csat)), 2)

    # Sentiment categorization
    if predicted_csat >= 4.5:
        category = "VERY_POSITIVE"
    elif predicted_csat >= 3.8:
        category = "POSITIVE"
    elif predicted_csat >= 3.0:
        category = "NEUTRAL"
    elif predicted_csat >= 2.0:
        category = "AT_RISK"
    else:
        category = "CRITICAL"

    audit_entry = {
        "step": "CSAT Predictor Node",
        "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
        "detail": f"Predicted CSAT: {predicted_csat} / 5.0 ⭐ | Sentiment: {category}",
        "status": "danger" if category in ("AT_RISK", "CRITICAL") else "success",
    }

    trail = state.get("audit_trail", [])
    trail.append(audit_entry)

    logger.info(f"CSAT node completed ticket={state.get('ticket_id')} csat={predicted_csat} category={category}")

    return {
        **state,
        "predicted_csat": predicted_csat,
        "csat_category": category,
        "audit_trail": trail,
    }
