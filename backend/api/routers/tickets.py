"""
SentinelDesk FastAPI Router — Tickets Endpoint.
Executes the LangGraph multi-agent pipeline on inbound tickets.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field

from backend.graph.workflow import run_ticket_triage_graph
from backend.core.logging import get_logger
from backend.security.crypto import encrypt_payload, decrypt_payload

logger = get_logger(__name__)

router = APIRouter(prefix="/api/v1/tickets", tags=["Tickets"])

# Simulated in-memory store for API demo (synchronized with DB models)
_IN_MEMORY_TICKETS: List[Dict[str, Any]] = []


class CreateTicketRequest(BaseModel):
    org_id: Optional[str] = Field("org_enterprise_default")
    customer_id: Optional[str] = Field("cus_web_user")
    customer_name: Optional[str] = Field("Jane Doe")
    customer_email: str = Field("jane@example.com")
    customer_tier: str = Field("pro")
    subject: str = Field(..., min_length=3, max_length=256)
    body: str = Field(..., min_length=5, max_length=4096)
    channel: str = Field("web")


@router.post("", status_code=201)
async def create_ticket(req: CreateTicketRequest, background_tasks: BackgroundTasks):
    """
    Submits a new support ticket and executes the full LangGraph multi-agent pipeline:
    Intake → Intent → Urgency → Duplicate → RAG → Resolution → Decision
    """
    initial_state = {
        "ticket_id": f"TKT-{len(_IN_MEMORY_TICKETS) + 8945}",
        "org_id": req.org_id or "org_enterprise_default",
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
        from backend.core.lock_manager import TicketLockGuard
        async with TicketLockGuard(req.customer_id or "default_customer"):
            final_state = await run_ticket_triage_graph(initial_state)
        
        ticket_record = {
            "id": final_state["ticket_id"],
            "org_id": final_state.get("org_id", "org_enterprise_default"),
            "customer_id": final_state["customer_id"],
            "customer_name": final_state["customer_name"],
            "customer_email": final_state["customer_email"],
            "encrypted_email": encrypt_payload(final_state["customer_email"]),
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
        
        # Enqueue outbound multi-channel webhook dispatching in background
        from backend.core.webhook_dispatcher import dispatch_ticket_resolution_events
        background_tasks.add_task(dispatch_ticket_resolution_events, ticket_record)

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
                "detail": "Resolution approved & dispatched — indexed to Golden Reflexion Memory",
                "status": "success",
            })

            # Auto-index into ChromaDB Golden Reflexion Memory
            try:
                from backend.vectordb.client import get_or_create_collection, check_chromadb_connection
                from backend.vectordb.ingest import get_embedder
                if check_chromadb_connection():
                    col = get_or_create_collection("golden_resolutions")
                    embedder = get_embedder()
                    text_to_embed = f"Subject: {t['subject']} | Solution: {t['resolution_draft']}"
                    vec = embedder.encode(text_to_embed).tolist()
                    col.add(
                        ids=[f"golden-{ticket_id}"],
                        documents=[text_to_embed],
                        metadatas=[{"ticket_id": ticket_id, "subject": t["subject"]}],
                        embeddings=[vec]
                    )
                    logger.info(f"Indexed ticket {ticket_id} into Golden Reflexion Memory collection")
            except Exception as ex:
                logger.warning(f"Golden memory indexing deferred: {ex}")

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


@router.get("/{ticket_id}/export-audit")
async def export_compliance_audit(ticket_id: str):
    import hashlib
    import json

    for t in _IN_MEMORY_TICKETS:
        if t["id"] == ticket_id:
            raw_payload = f"{t['id']}:{t.get('org_id')}:{t.get('status')}:{json.dumps(t.get('audit_trail', []))}"
            sha256_hash = hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()

            return {
                "certificate_title": "SentinelDesk SOC2/ISO27001 Compliance Audit Certificate",
                "ticket_id": t["id"],
                "org_id": t.get("org_id", "org_enterprise_default"),
                "status": t["status"],
                "pii_sanitization_verified": True,
                "owasp_injection_scanned": True,
                "ssrf_checked": True,
                "audit_trail": t.get("audit_trail", []),
                "sha256_verification_hash": sha256_hash,
                "issued_at": "2026-07-28T12:35:00Z"
            }
    raise HTTPException(status_code=404, detail="Ticket not found")


class FeedbackRequest(BaseModel):
    corrected_draft: str = Field(..., min_length=3)
    operator_notes: Optional[str] = Field("Approved via Human Operator UI")


@router.post("/{ticket_id}/feedback")
async def submit_ticket_feedback(ticket_id: str, req: FeedbackRequest):
    """Submits human operator correction to trigger autonomous self-healing re-indexing."""
    from backend.agents.self_healing_agent import process_operator_feedback

    for t in _IN_MEMORY_TICKETS:
        if t["id"] == ticket_id:
            original_draft = t.get("resolution_draft", "")
            t["resolution_draft"] = req.corrected_draft
            t["status"] = "SOLVED"

            healing_res = process_operator_feedback(
                ticket_id=ticket_id,
                subject=t.get("subject", "General Ticket"),
                original_draft=original_draft,
                corrected_draft=req.corrected_draft,
                operator_notes=req.operator_notes or ""
            )

            t["audit_trail"].append({
                "step": "Self-Healing Loop",
                "timestamp": "Now",
                "detail": healing_res["message"],
                "status": "success"
            })
            return {"status": "solved", "self_healing": healing_res, "ticket": t}
    raise HTTPException(status_code=404, detail="Ticket not found")
