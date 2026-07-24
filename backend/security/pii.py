"""
SentinelDesk — PII Redaction
Regex + spaCy NER pass for card numbers, emails, phone numbers, and SSNs.
Called before ANYTHING is logged, embedded, or sent to a third-party API.

Design notes:
- Runs synchronously (fast enough for inline use in request path).
- Returns redacted text with placeholder tokens so log lines remain parseable.
- Tested against a labeled fixture set (see tests/unit/test_pii.py).
"""

from __future__ import annotations

import re
from typing import Any, Dict, Optional

try:
    import spacy
    from spacy.language import Language
    _SPACY_AVAILABLE = True
except ImportError:
    _SPACY_AVAILABLE = False
    Language = None  # type: ignore

from backend.core.logging import get_logger

logger = get_logger(__name__)

# ── spaCy model (loaded once) ─────────────────────────────────────────────────
_nlp = None


def _get_nlp():
    global _nlp
    if not _SPACY_AVAILABLE:
        return None
    if _nlp is None:
        try:
            _nlp = spacy.load("en_core_web_sm")
        except OSError:
            logger.warning("spaCy model not found; NER-based PII detection disabled.")
            _nlp = spacy.blank("en")
    return _nlp


# ── Regex patterns ────────────────────────────────────────────────────────────

# Visa/MC/Amex/Discover — 13-16 digit card numbers, space or dash separated
_CARD_RE = re.compile(
    r"\b(?:4[0-9]{12}(?:[0-9]{3})?"          # Visa
    r"|(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}"  # MC
    r"|3[47][0-9]{13}"                         # Amex
    r"|3(?:0[0-5]|[68][0-9])[0-9]{11}"        # Diners
    r"|6(?:011|5[0-9]{2})[0-9]{12}"            # Discover
    r"|(?:\d[ -]?){13,16}"                     # Generic 13-16 digit with separators
    r")\b"
)

_EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b")

# E.164 / NANP / loose international
_PHONE_RE = re.compile(
    r"(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}"
)

# US SSN: 9 digits, optional dashes/spaces
_SSN_RE = re.compile(r"\b(?!000|666|9\d{2})\d{3}[-\s]?(?!00)\d{2}[-\s]?(?!0000)\d{4}\b")

# IPv4 (for log scrubbing)
_IPV4_RE = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")


# ── Public API ────────────────────────────────────────────────────────────────

def redact_pii(text: str) -> str:
    """
    Replace PII patterns with safe placeholder tokens.
    Returns the redacted string.
    """
    if not text:
        return text

    text = _CARD_RE.sub("[REDACTED_CARD]", text)
    text = _SSN_RE.sub("[REDACTED_SSN]", text)
    text = _EMAIL_RE.sub("[REDACTED_EMAIL]", text)
    text = _PHONE_RE.sub("[REDACTED_PHONE]", text)

    # spaCy NER pass — catches named persons, locations that regex misses
    nlp = _get_nlp()
    if nlp is not None and nlp.pipe_names:  # only if a real model is loaded
        doc = nlp(text)
        for ent in reversed(doc.ents):  # reversed to preserve offsets
            if ent.label_ in ("PERSON", "GPE", "LOC", "ORG"):
                text = text[: ent.start_char] + f"[REDACTED_{ent.label_}]" + text[ent.end_char :]

    return text


def redact_pii_from_dict(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Recursively redact PII from all string values in a dictionary.
    Safe to call on any arbitrary JSON-serializable dict.
    """
    if not isinstance(data, dict):
        return data

    result: Dict[str, Any] = {}
    for key, value in data.items():
        if isinstance(value, str):
            result[key] = redact_pii(value)
        elif isinstance(value, dict):
            result[key] = redact_pii_from_dict(value)
        elif isinstance(value, list):
            result[key] = [
                redact_pii(item) if isinstance(item, str)
                else redact_pii_from_dict(item) if isinstance(item, dict)
                else item
                for item in value
            ]
        else:
            result[key] = value
    return result
