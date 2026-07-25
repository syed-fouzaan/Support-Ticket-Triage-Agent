"""
SentinelDesk Agent — Decision & Confidence Gate Node.
Evaluates state against confidence threshold (>= 0.75) and security rules.
Assigns final status: SOLVED or ESCALATED.
"""

from datetime import datetime, timezone
from backend.core.config import settings
from backend.core.logging import get_logger
from backend.graph.state import TicketState

logger = get_logger(__name__)

# Intent categories hardcoded to force human escalation
FORCE_HUMAN_INTENTS = ["Billing", "AbusePolicy", "SecurityViolation"]


async def decision_node(state: TicketState) -> TicketState:
    intent = state.get("intent", "GeneralQuery")
    confidence = state.get("resolution_confidence", 0.85)
    is_injection = state.get("is_injection_attempt", False)
    requires_human = state.get("requires_human", False)

    final_status = "SOLVED"
    reason = "Confidence threshold met and no forced escalation rules triggered."
    assigned_team = None

    # Decision Logic
    if is_injection:
        final_status = "ESCALATED"
        reason = "Security Violation: OWASP Prompt Injection payload detected."
        assigned_team = "SecOps Tier 3"
    elif intent in FORCE_HUMAN_INTENTS:
        final_status = "ESCALATED"
        reason = f"Policy Rule: '{intent}' category requires mandatory human review."
        assigned_team = "Billing & Compliance"
    elif confidence < settings.CONFIDENCE_THRESHOLD or requires_human:
        final_status = "ESCALATED"
        reason = f"Confidence Gate: Score {confidence:.2f} < Threshold {settings.CONFIDENCE_THRESHOLD}."
        assigned_team = "Tier 2 Technical Support"

    audit_entry = {
        "step": "Decision Node (Confidence Gate)",
        "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
        "detail": f"Final Status: {final_status} | Reason: {reason}",
        "status": "danger" if final_status == "ESCALATED" else "success",
    }

    trail = state.get("audit_trail", [])
    trail.append(audit_entry)

    logger.info(f"Decision ticket={state.get('ticket_id')} status={final_status} reason={reason}")

    return {
        **state,
        "final_status": final_status,
        "decision_reason": reason,
        "assigned_team": assigned_team,
        "audit_trail": trail,
    }
