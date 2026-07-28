"""
SentinelDesk Agent — Intake & Security Node.
Sanitizes input, detects PII (regex + spaCy NER), scans for OWASP prompt injection,
and initializes trace context.
"""

import re
from datetime import datetime, timezone
import uuid

from backend.core.logging import get_logger
from backend.graph.state import TicketState
from backend.security.pii import redact_pii

logger = get_logger(__name__)

_INJECTION_RE = re.compile(
    r"ignore.*instruction|system prompt|developer mode|export database|print.*prompt|disregard.*context|print.*api",
    re.IGNORECASE,
)


def _detect_language(text: str) -> str:
    t = text.lower()
    if any(w in t for w in ["hola", "pago", "factura", "gracias", "por favor", "ayuda"]):
        return "es"
    if any(w in t for w in ["hallo", "hilfe", "fehler", "zahlung", "danke", "bitte"]):
        return "de"
    if any(w in t for w in ["bonjour", "erreur", "paiement", "merci", "s'il vous plaît"]):
        return "fr"
    return "en"


async def intake_node(state: TicketState) -> TicketState:
    body = state.get("body", "")
    attachments = state.get("attachments") or []
    attachment_text = state.get("attachment_text") or ""
    
    # Include attachment text if provided
    if attachment_text:
        body = f"{body}\n\n[Attachment Content]: {attachment_text}"

    trace_id = state.get("trace_id") or str(uuid.uuid4())
    
    redacted_body = redact_pii(body)
    pii_found = (redacted_body != body)
    is_injection = bool(_INJECTION_RE.search(body))
    detected_lang = _detect_language(body)

    audit_entry = {
        "step": "Intake & Translation Node",
        "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
        "detail": f"Trace ID: {trace_id[:8]}... | Lang: {detected_lang.upper()} | PII Redacted: {pii_found} | Injection Flag: {is_injection}",
        "status": "danger" if is_injection else ("warning" if pii_found else "success"),
    }

    trail = state.get("audit_trail", [])
    trail.append(audit_entry)

    logger.info(f"Intake completed ticket={state.get('ticket_id')} lang={detected_lang} pii={pii_found} injection={is_injection}")

    return {
        **state,
        "trace_id": trace_id,
        "language": detected_lang,
        "pii_found": pii_found,
        "pii_redacted_body": redacted_body,
        "is_injection_attempt": is_injection,
        "audit_trail": trail,
    }
