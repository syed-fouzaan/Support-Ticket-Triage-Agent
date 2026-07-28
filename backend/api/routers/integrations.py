"""
SentinelDesk FastAPI Router — Slack & Zendesk Webhook Integration Router.
Ingests real-time ticket events directly from Slack messaging and Zendesk CRM triggers.
"""

from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.graph.workflow import run_ticket_triage_graph
from backend.core.logging import get_logger
from backend.api.routers.tickets import _IN_MEMORY_TICKETS

logger = get_logger(__name__)

router = APIRouter(prefix="/api/v1/integrations", tags=["Integrations"])


class SlackWebhookRequest(BaseModel):
    user_id: Optional[str] = Field("U_SLACK_USER")
    user_name: Optional[str] = Field("Slack Customer")
    user_email: Optional[str] = Field("slack.user@enterprise.com")
    text: str = Field(..., min_length=3)
    channel_id: Optional[str] = Field("C_SUPPORT")
    team_id: Optional[str] = Field("T_ACME")


class ZendeskWebhookRequest(BaseModel):
    ticket_id: Optional[str] = Field("ZD-1002")
    requester_name: Optional[str] = Field("Zendesk Requester")
    requester_email: Optional[str] = Field("zendesk.user@company.io")
    subject: str = Field(..., min_length=3)
    description: str = Field(..., min_length=5)
    organization_id: Optional[str] = Field("org_enterprise_default")


@router.post("/slack", status_code=201)
async def ingest_slack_ticket(req: SlackWebhookRequest):
    """
    Inbound Slack Slash Command / Event Webhook:
    Normalizes Slack payload, sets channel='slack', and executes 8-node LangGraph triage.
    """
    initial_state = {
        "ticket_id": f"TKT-SLACK-{len(_IN_MEMORY_TICKETS) + 101}",
        "org_id": "org_enterprise_default",
        "customer_id": req.user_id,
        "customer_name": req.user_name,
        "customer_email": req.user_email,
        "customer_tier": "enterprise",
        "subject": f"[Slack] {req.text[:60]}...",
        "body": req.text,
        "channel": "slack",
        "audit_trail": [],
    }

    try:
        final_state = await run_ticket_triage_graph(initial_state)
        
        ticket_record = {
            "id": final_state["ticket_id"],
            "org_id": final_state.get("org_id", "org_enterprise_default"),
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
            "language": final_state.get("language", "en"),
            "resolution_draft": final_state["resolution_draft"],
            "rag_sources": final_state.get("rag_sources", []),
            "audit_trail": final_state.get("audit_trail", []),
        }

        _IN_MEMORY_TICKETS.insert(0, ticket_record)
        logger.info(f"Ingested Slack webhook ticket {ticket_record['id']}")
        return ticket_record
    except Exception as e:
        logger.error(f"Error processing Slack webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/zendesk", status_code=201)
async def ingest_zendesk_ticket(req: ZendeskWebhookRequest):
    """
    Inbound Zendesk Trigger Webhook:
    Normalizes Zendesk ticket fields, sets channel='zendesk', and executes 8-node LangGraph triage.
    """
    initial_state = {
        "ticket_id": f"TKT-{req.ticket_id or 'ZD-99'}",
        "org_id": req.organization_id or "org_enterprise_default",
        "customer_id": "cus_zendesk",
        "customer_name": req.requester_name,
        "customer_email": req.requester_email,
        "customer_tier": "pro",
        "subject": req.subject,
        "body": req.description,
        "channel": "zendesk",
        "audit_trail": [],
    }

    try:
        final_state = await run_ticket_triage_graph(initial_state)
        
        ticket_record = {
            "id": final_state["ticket_id"],
            "org_id": final_state.get("org_id", "org_enterprise_default"),
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
            "language": final_state.get("language", "en"),
            "resolution_draft": final_state["resolution_draft"],
            "rag_sources": final_state.get("rag_sources", []),
            "audit_trail": final_state.get("audit_trail", []),
        }

        _IN_MEMORY_TICKETS.insert(0, ticket_record)
        logger.info(f"Ingested Zendesk webhook ticket {ticket_record['id']}")
        return ticket_record
    except Exception as e:
        logger.error(f"Error processing Zendesk webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))
