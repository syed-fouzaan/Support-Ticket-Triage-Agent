"""
SentinelDesk Agent — Autonomous Action Executor & Side-Effect Safety Node (Node 15).
Safely executes simulated real-world API actions (e.g. reset password, issue refund, upgrade subscription)
under high confidence thresholds (>= 0.85).
"""

from datetime import datetime, timezone
from typing import Dict, Any, List
from backend.core.logging import get_logger
from backend.graph.state import TicketState

logger = get_logger(__name__)


async def action_executor_node(state: TicketState) -> TicketState:
    """
    Action Executor Node: Performs automated side-effect operations if resolution confidence is high.
    """
    intent = state.get("intent", "")
    confidence = state.get("resolution_confidence", 0.0)
    executed_actions: List[Dict[str, Any]] = state.get("executed_actions", [])
    trail = state.get("audit_trail", [])

    action_taken = None

    # Safe automated action execution rule
    if confidence >= 0.85:
        if intent == "Billing" and "refund" in state.get("body", "").lower():
            action_taken = {
                "action_type": "ISSUE_REFUND_SIMULATED",
                "target_customer": state.get("customer_id", "CUST-UNKNOWN"),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status": "EXECUTED",
                "details": "Simulated $49.00 automated refund processed.",
            }
        elif intent == "Auth" and ("password" in state.get("body", "").lower() or "reset" in state.get("body", "").lower()):
            action_taken = {
                "action_type": "SEND_PASSWORD_RESET_LINK",
                "target_email": state.get("customer_email", "user@example.com"),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status": "EXECUTED",
                "details": "Automated 2FA password reset link dispatched via SMTP.",
            }
        elif intent == "Subscription":
            action_taken = {
                "action_type": "REFRESH_SUBSCRIPTION_ENTITLEMENTS",
                "target_customer": state.get("customer_id", "CUST-UNKNOWN"),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status": "EXECUTED",
                "details": "Customer entitlement cache invalidated and refreshed.",
            }

    if action_taken:
        executed_actions.append(action_taken)
        trail.append({
            "step": "Autonomous Action Executor (Node 15)",
            "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
            "detail": f"Executed action '{action_taken['action_type']}'",
            "status": "success",
        })
        logger.info(f"Node 15: Executed action {action_taken['action_type']} for ticket={state.get('ticket_id')}")
    else:
        trail.append({
            "step": "Autonomous Action Executor (Node 15)",
            "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
            "detail": "No automated side-effects required or confidence < 0.85",
            "status": "skipped",
        })

    return {
        **state,
        "executed_actions": executed_actions,
        "audit_trail": trail,
    }
