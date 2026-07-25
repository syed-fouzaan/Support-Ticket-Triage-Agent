"""
SentinelDesk FastAPI Router — Tickets Endpoint.
Executes the LangGraph multi-agent pipeline on inbound tickets.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field

from backend.graph.workflow import run_ticket_triage_graph
from backend.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/v1/tickets", tags=["Tickets"])

# Simulated in-memory store for API demo (synchronized with DB models)
_IN_MEMORY_TICKETS: List[Dict[str, Any]] = []


class CreateTicketRequest(BaseModel):
    customer_id: Optional[str] = Field("cus_web_user")
    customer_name: Optional[str] = Field("Jane Doe")
    customer_email: str = Field("jane@example.com")
    customer_tier: str = Field("pro")
    subject: str = Field(..., min_length=3, max_length=256)
    body: str = Field(..., min_length=5, max_length=4096)
    channel: str = Field("web")


@router.post("", status_code=201)
async def create_ticket(req: CreateTicketRequest):
    """
    Submits a new support ticket and executes the full LangGraph multi-agent pipeline:
    Intake → Intent → Urgency → Duplicate → RAG → Resolution → Decision
    """
    initial_state = {
        "ticket_id": f"TKT-{len(_IN_MEMORY_TICKETS) + 8945}",
        "customer_id": req.customer_id,
        "customer_name": req.customer_name,
        "customer_email": req.customer_email,
        "customer_tier": req.customer_tier,
        "subject": req.subject,
        "body": req.body,
        "channel": req.channel,
        "audit_trail": [],
    }

    try:
        final_state = await run_ticket_triage_graph(initial_state)
        
        ticket_record = {
            "id": final_state["ticket_id"],
            "customer_id": final_state["customer_id"],
            "customer_name": final_state["customer_name"],
            "customer_email": final_state["customer_email"],
            "customer_tier": final_state["customer_tier"],
            "subject": final_state["subject"],
            "body": final_state["body"],
            "channel": final_state["channel"],
            "status": final_state["final_status"],
            "urgency": final_state["urgency"],
            "urgency_score": final_state["urgency_score"],
            "intent": final_state["intent"],
            "confidence": final_state["resolution_confidence"],
            "pii_found": final_state["pii_found"],
            "pii_redacted_body": final_state["pii_redacted_body"],
            "is_injection_attempt": final_state.get("is_injection_attempt", False),
            "resolution_draft": final_state["resolution_draft"],
            "rag_sources": final_state.get("rag_sources", []),
            "audit_trail": final_state.get("audit_trail", []),
        }

        _IN_MEMORY_TICKETS.insert(0, ticket_record)
        return ticket_record
    except Exception as e:
        logger.error(f"Error executing agent graph: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def list_tickets():
    """Returns the list of all processed support tickets in the queue."""
    return _IN_MEMORY_TICKETS


@router.get("/{ticket_id}")
async def get_ticket(ticket_id: str):
    for t in _IN_MEMORY_TICKETS:
        if t["id"] == ticket_id:
            return t
    raise HTTPException(status_code=404, detail="Ticket not found")


@router.post("/{ticket_id}/approve")
async def approve_ticket(ticket_id: str, payload: Dict[str, str]):
    for t in _IN_MEMORY_TICKETS:
        if t["id"] == ticket_id:
            t["status"] = "SOLVED"
            if "resolution_text" in payload:
                t["resolution_draft"] = payload["resolution_text"]
            t["audit_trail"].append({
                "step": "Human Review",
                "timestamp": "Now",
                "detail": "Resolution approved and dispatched by agent",
                "status": "success",
            })
            return t
    raise HTTPException(status_code=404, detail="Ticket not found")


@router.post("/{ticket_id}/escalate")
async def escalate_ticket(ticket_id: str):
    for t in _IN_MEMORY_TICKETS:
        if t["id"] == ticket_id:
            t["status"] = "ESCALATED"
            t["urgency"] = "HOT"
            t["audit_trail"].append({
                "step": "Human Override",
                "timestamp": "Now",
                "detail": "Force-escalated to Tier 3 Ops",
                "status": "danger",
            })
            return t
    raise HTTPException(status_code=404, detail="Ticket not found")
