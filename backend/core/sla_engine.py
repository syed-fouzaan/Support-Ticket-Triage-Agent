"""
SentinelDesk Core — SLA Monitoring & Breach Escalation Engine.
Evaluates active tickets against SLA thresholds (HOT: 15m, WARM: 60m, COLD: 240m).
Force-escalates tickets exceeding SLA limits to SLA Tier 3 Ops.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

from backend.core.logging import get_logger

logger = get_logger(__name__)

# SLA Thresholds in Minutes
SLA_THRESHOLDS_MIN: Dict[str, int] = {
    "HOT": 15,
    "WARM": 60,
    "COLD": 240,
}


def check_and_escalate_sla_breaches(tickets: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Scans ticket list and force-escalates any OPEN tickets exceeding their urgency SLA threshold.
    Returns summary stats of check execution.
    """
    now = datetime.now(timezone.utc)
    breached_count = 0
    checked_count = len(tickets)

    for t in tickets:
        if t.get("status") != "OPEN":
            continue

        urgency = t.get("urgency", "WARM")
        threshold_min = SLA_THRESHOLDS_MIN.get(urgency, 60)
        
        # Calculate ticket age in minutes
        created_at_raw = t.get("created_at")
        age_minutes = 0.0
        if created_at_raw:
            try:
                if isinstance(created_at_raw, str):
                    dt = datetime.fromisoformat(created_at_raw.replace("Z", "+00:00"))
                else:
                    dt = created_at_raw
                age_minutes = (now - dt).total_seconds() / 60.0
            except Exception:
                age_minutes = 0.0

        # Check for SLA Breach
        if age_minutes > threshold_min:
            t["status"] = "ESCALATED"
            t["assigned_team"] = "SLA Tier 3 Ops"
            t["is_sla_breached"] = True
            
            trail = t.get("audit_trail", [])
            trail.append({
                "step": "SLA Monitor Daemon",
                "timestamp": now.strftime("%H:%M:%S"),
                "detail": f"🚨 SLA BREACH: Age {age_minutes:.1f}m > Threshold {threshold_min}m for {urgency} lane. Force-escalated to SLA Tier 3 Ops.",
                "status": "danger"
            })
            t["audit_trail"] = trail
            breached_count += 1
            logger.warning(f"SLA Breach escalated ticket={t.get('id')} urgency={urgency} age={age_minutes:.1f}m")

    return {
        "status": "completed",
        "checked_tickets": checked_count,
        "new_breaches_escalated": breached_count,
        "timestamp": now.isoformat()
    }
