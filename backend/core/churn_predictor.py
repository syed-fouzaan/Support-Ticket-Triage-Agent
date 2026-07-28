"""
SentinelDesk Core — Predictive Churn Risk & Sentiment Trajectory Engine.
Calculates customer churn risk score (0-100%) based on customer tier, sentiment, and urgency history.
"""

from typing import Any, Dict
from backend.core.logging import get_logger

logger = get_logger(__name__)


def calculate_churn_risk(customer_tier: str, urgency: str, body: str) -> Dict[str, Any]:
    """
    Computes customer churn risk score and level.
    """
    score = 15.0  # Base risk score

    # Tier weighting
    tier_lower = (customer_tier or "standard").lower()
    if tier_lower in ["enterprise", "vip"]:
        score += 25.0
    elif tier_lower == "pro":
        score += 15.0

    # Urgency weighting
    urgency_upper = (urgency or "COLD").upper()
    if urgency_upper == "HOT":
        score += 35.0
    elif urgency_upper == "WARM":
        score += 15.0

    # Negative sentiment keywords
    body_lower = (body or "").lower()
    churn_signals = ["cancel", "cancelation", "frustrated", "leaving", "switch", "terrible", "unacceptable", "competitor", "sue"]
    signal_hits = sum(1 for kw in churn_signals if kw in body_lower)
    score += signal_hits * 10.0

    # Cap between 0 and 100
    final_score = min(max(score, 0.0), 100.0)

    if final_score >= 70.0:
        level = "HIGH_RISK"
    elif final_score >= 40.0:
        level = "MEDIUM_RISK"
    else:
        level = "LOW_RISK"

    return {
        "churn_risk_score": round(final_score, 1),
        "churn_risk_level": level,
    }
