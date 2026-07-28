"""
SentinelDesk Agent — Self-Improving Feedback Loop & Active Learning Node.
Captures human-approved resolutions as gold-standard training data in a local feedback store.
Enables the system to self-improve over time by building a curated dataset of successful resolutions.
"""

import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from backend.core.logging import get_logger

logger = get_logger(__name__)

_FEEDBACK_STORE_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "feedback_store.jsonl")


def _ensure_store_exists():
    os.makedirs(os.path.dirname(_FEEDBACK_STORE_PATH), exist_ok=True)


def record_approved_resolution(
    ticket_id: str,
    intent: str,
    subject: str,
    resolution_draft: str,
    csat_score: float,
    agent_key: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Records a human-approved resolution into the feedback store as a gold training exemplar.
    Called when an operator approves a resolution via the Decision Node or UI.
    """
    _ensure_store_exists()
    record = {
        "ticket_id": ticket_id,
        "intent": intent,
        "subject": subject,
        "resolution_draft": resolution_draft,
        "csat_score": csat_score,
        "approved_at": datetime.now(timezone.utc).isoformat(),
        "agent_key": agent_key or "human_operator",
        "label": "gold_approved",
    }
    try:
        with open(_FEEDBACK_STORE_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(record) + "\n")
        logger.info(f"Feedback loop: Recorded gold exemplar for ticket={ticket_id} csat={csat_score}")
    except Exception as e:
        logger.error(f"Feedback loop write error: {e}")
    return record


def load_feedback_exemplars(intent: Optional[str] = None, min_csat: float = 4.5) -> List[Dict[str, Any]]:
    """
    Loads gold-standard approved resolutions from the feedback store.
    Optionally filtered by intent and minimum CSAT score.
    """
    _ensure_store_exists()
    exemplars = []
    try:
        if not os.path.exists(_FEEDBACK_STORE_PATH):
            return []
        with open(_FEEDBACK_STORE_PATH, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    rec = json.loads(line.strip())
                    if rec.get("csat_score", 0) >= min_csat:
                        if intent is None or rec.get("intent") == intent:
                            exemplars.append(rec)
                except json.JSONDecodeError:
                    continue
    except Exception as e:
        logger.error(f"Feedback loop load error: {e}")
    return exemplars


def feedback_stats() -> Dict[str, Any]:
    """Returns aggregate statistics about the feedback store."""
    exemplars = load_feedback_exemplars(min_csat=0.0)
    if not exemplars:
        return {"total": 0, "avg_csat": 0.0, "by_intent": {}}
    avg_csat = sum(e["csat_score"] for e in exemplars) / len(exemplars)
    by_intent: Dict[str, int] = {}
    for e in exemplars:
        intent = e.get("intent", "Unknown")
        by_intent[intent] = by_intent.get(intent, 0) + 1
    return {"total": len(exemplars), "avg_csat": round(avg_csat, 2), "by_intent": by_intent}
