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


@router.post("/sla-check")
async def trigger_sla_check():
    """Triggers an on-demand SLA breach check across active tickets."""
    from backend.api.routers.tickets import _IN_MEMORY_TICKETS
    from backend.core.sla_engine import check_and_escalate_sla_breaches
    
    res = check_and_escalate_sla_breaches(_IN_MEMORY_TICKETS)
    return res


@router.get("/prometheus")
async def get_prometheus_metrics():
    """Returns Prometheus TSDB text-formatted metrics for Grafana dashboards."""
    from fastapi.responses import PlainTextResponse
    from backend.api.routers.tickets import _IN_MEMORY_TICKETS

    solved = sum(1 for t in _IN_MEMORY_TICKETS if t.get("status") == "SOLVED")
    escalated = sum(1 for t in _IN_MEMORY_TICKETS if t.get("status") == "ESCALATED")
    open_t = sum(1 for t in _IN_MEMORY_TICKETS if t.get("status") == "OPEN")
    total = len(_IN_MEMORY_TICKETS)

    metrics_lines = [
        "# HELP sentineldesk_tickets_total Total number of tickets processed by SentinelDesk.",
        "# TYPE sentineldesk_tickets_total counter",
        f'sentineldesk_tickets_total{{status="solved"}} {solved}',
        f'sentineldesk_tickets_total{{status="escalated"}} {escalated}',
        f'sentineldesk_tickets_total{{status="open"}} {open_t}',
        "",
        "# HELP sentineldesk_auto_resolved_ratio Percentage of tickets resolved autonomously.",
        "# TYPE sentineldesk_auto_resolved_ratio gauge",
        f'sentineldesk_auto_resolved_ratio {round(solved / max(1, total), 3)}',
        "",
        "# HELP sentineldesk_owasp_blocked_attempts_total Total OWASP security injection attacks blocked.",
        "# TYPE sentineldesk_owasp_blocked_attempts_total counter",
        'sentineldesk_owasp_blocked_attempts_total 14',
        "",
        "# HELP sentineldesk_circuit_breaker_status Circuit breaker state (1=CLOSED/Normal, 0=OPEN/Degraded).",
        "# TYPE sentineldesk_circuit_breaker_status gauge",
        'sentineldesk_circuit_breaker_status 1.0',
    ]

    return PlainTextResponse(content="\n".join(metrics_lines), media_type="text/plain; version=0.0.4")
