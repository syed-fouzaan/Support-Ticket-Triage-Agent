"""
SentinelDesk Agent — Intent Classification Agent Node.
Categorizes ticket into Billing, TechBug, FeatureRequest, AccountAccess, GeneralQuery, AbusePolicy.
"""

from datetime import datetime, timezone
from pydantic import BaseModel, Field

from backend.core.llm_client import get_llm_client
from backend.core.logging import get_logger
from backend.graph.state import TicketState
from backend.prompts.intent_prompt import INTENT_SYSTEM_PROMPT

logger = get_logger(__name__)


class IntentSchema(BaseModel):
    intent: str = Field(..., description="One of: Billing, TechBug, FeatureRequest, AccountAccess, GeneralQuery, AbusePolicy")
    sub_intent: str = Field(default="general")
    confidence: float = Field(..., ge=0.0, le=1.0)
    reasoning: str = Field(default="")


async def intent_node(state: TicketState) -> TicketState:
    body = state.get("pii_redacted_body") or state.get("body", "")
    subject = state.get("subject", "")

    # Fast heuristic fallback if LLM is unavailable or for testing
    intent = "GeneralQuery"
    sub_intent = "general"
    confidence = 0.85

    subject_lower = subject.lower()
    body_lower = body.lower()

    if any(k in subject_lower or k in body_lower for k in ["payment", "card", "charge", "refund", "invoice", "billing", "seat"]):
        intent = "Billing"
        confidence = 0.94
    elif any(k in subject_lower or k in body_lower for k in ["error", "500", "crash", "bug", "failed", "exception", "broken"]):
        intent = "TechBug"
        confidence = 0.92
    elif any(k in subject_lower or k in body_lower for k in ["feature", "dark mode", "export", "roadmap", "add support"]):
        intent = "FeatureRequest"
        confidence = 0.96
    elif any(k in subject_lower or k in body_lower for k in ["password", "2fa", "login", "lock", "access", "account"]):
        intent = "AccountAccess"
        confidence = 0.90
    elif state.get("is_injection_attempt"):
        intent = "AbusePolicy"
        confidence = 0.99

    try:
        client = get_llm_client()
        res = await client.generate_structured_output(
            prompt=f"Subject: {subject}\nBody: {body}",
            schema=IntentSchema,
            system_instruction=INTENT_SYSTEM_PROMPT,
        )
        if res and res.intent:
            intent = res.intent
            sub_intent = res.sub_intent
            confidence = res.confidence
    except Exception as e:
        logger.warning(f"Intent LLM fallback used: {e}")

    audit_entry = {
        "step": "Intent Classifier Node",
        "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
        "detail": f"Classified as '{intent}' (sub: {sub_intent}, confidence: {confidence:.2f})",
        "status": "success",
    }

    trail = state.get("audit_trail", [])
    trail.append(audit_entry)

    return {
        **state,
        "intent": intent,
        "sub_intent": sub_intent,
        "intent_confidence": confidence,
        "audit_trail": trail,
    }
