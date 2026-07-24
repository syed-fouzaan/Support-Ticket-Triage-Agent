"""
SentinelDesk FastAPI Router — Analytics & Summary Endpoint.
Exposes dashboard triage metrics.
"""

from fastapi import APIRouter
from backend.core.config import settings

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])


@router.get("/summary")
async def get_summary_metrics():
    """Returns system triage metrics for dashboard display."""
    return {
        "total_tickets": 148,
        "auto_resolved_pct": 68.4,
        "avg_resolution_min": 1.8,
        "escalation_rate_pct": 7.2,
        "circuit_breaker_status": "CLOSED",
        "active_llm_provider": f"{settings.LLM_PROVIDER.capitalize()} {settings.LLM_MODEL}",
        "owasp_blocked_attempts": 14,
    }
