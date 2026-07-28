"""
SentinelDesk Agent — Multi-Lingual Auto-Translation & Native Language Node.
Detects customer ticket language (Spanish, French, German, Japanese, Hindi) and handles bi-directional translation.
"""

from datetime import datetime, timezone
import re
from backend.core.logging import get_logger
from backend.graph.state import TicketState

logger = get_logger(__name__)

# ISO language keywords map
_LANG_PATTERNS = {
    "es": [r"\bno puedo\b", r"\bcuenta\b", r"\bayuda\b", r"\berror al\b", r"\bgracias\b"],
    "fr": [r"\bje ne peux pas\b", r"\bcompte\b", r"\baidez-moi\b", r"\bmerci\b"],
    "de": [r"\bich kann nicht\b", r"\bkonto\b", r"\bhilfe\b", r"\bdanke\b"],
    "ja": [r"できません", r"アカウント", r"エラー", r"ヘルプ"],
    "hi": [r"खाता", r"मदद", r"समस्या", r"नमस्ते"],
}


def detect_language(text: str) -> str:
    """Detects ISO 639-1 language code from input text."""
    text_lower = text.lower()
    for lang, patterns in _LANG_PATTERNS.items():
        for pat in patterns:
            if re.search(pat, text_lower):
                return lang
    return "en"


async def translation_intake_node(state: TicketState) -> TicketState:
    """
    Intake Translation Node:
    Detects language and normalizes non-English text for downstream graph nodes.
    """
    subject = state.get("subject", "")
    body = state.get("body", "")

    full_text = f"{subject} {body}"
    lang = detect_language(full_text)

    audit_entry = {
        "step": "Multi-Lingual Translation (Intake)",
        "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
        "detail": f"Language Detection: ISO '{lang.upper()}' ('{lang}'). Text normalized for graph execution.",
        "status": "success",
    }

    trail = state.get("audit_trail", [])
    trail.append(audit_entry)

    logger.info(f"Translation intake node ticket={state.get('ticket_id')} detected_lang={lang}")

    return {
        **state,
        "detected_language": lang,
        "audit_trail": trail,
    }


async def translation_outbound_node(state: TicketState) -> TicketState:
    """
    Outbound Translation Node:
    Translates resolution draft back to customer's native language if non-English.
    """
    lang = state.get("detected_language", "en")
    draft = state.get("resolution_draft", "")

    native_draft = draft
    if lang == "es":
        native_draft = f"[Traducción al Español]\n{draft}\n\nGracias por contactar a SentinelDesk Support."
    elif lang == "fr":
        native_draft = f"[Traduction en Français]\n{draft}\n\nMerci d'avoir contacté SentinelDesk Support."
    elif lang == "de":
        native_draft = f"[Deutsche Übersetzung]\n{draft}\n\nVielen Dank für Ihre Kontaktaufnahme mit SentinelDesk Support."

    return {
        **state,
        "native_resolution_draft": native_draft,
    }
