"""
SentinelDesk Agent — Intake & Security Node.
Sanitizes input, detects PII (regex + spaCy NER), scans for OWASP prompt injection,
and initializes trace context.
"""

from datetime import datetime, timezone
import uuid

from backend.core.logging import get_logger
from backend.graph.state import TicketState
from backend.security.pii import redact_pii

logger = get_logger(__name__)

INJECTION_KEYWORDS = [
    "ignore previous instructions",
    "ignore all instructions",
    "ignore all previous instructions",
    "system prompt",
    "developer mode",
    "export database",
    "print your system prompt",
    "disregard all prior context",
    "print api keys",
]


async def intake_node(state: TicketState) -> TicketState:
    body = state.get("body", "")
    trace_id = state.get("trace_id") or str(uuid.uuid4())
    
    # 1. PII Redaction
    redacted_body = redact_pii(body)
    pii_found = (redacted_body != body)

    # 2. Prompt Injection Check (OWASP LLM01)
    lower_body = body.lower()
    is_injection = any(kw in lower_body for kw in INJECTION_KEYWORDS)

    audit_entry = {
        "step": "Intake Node",
        "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
        "detail": f"Trace ID: {trace_id[:8]}... | PII Redacted: {pii_found} | Injection Flag: {is_injection}",
        "status": "danger" if is_injection else ("warning" if pii_found else "success"),
    }

    trail = state.get("audit_trail", [])
    trail.append(audit_entry)

    logger.info(f"Intake completed ticket={state.get('ticket_id')} pii={pii_found} injection={is_injection}")

    return {
        **state,
        "trace_id": trace_id,
        "pii_found": pii_found,
        "pii_redacted_body": redacted_body,
        "is_injection_attempt": is_injection,
        "audit_trail": trail,
    }
