"""
SentinelDesk FastAPI Router — Synthetic Audio & Voice Ticket Transcriber Endpoint.
Transcribes inbound customer voice notes and telephone audio (Whisper STT) and executes full 12-node LangGraph triage.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field

from backend.graph.workflow import run_ticket_triage_graph
from backend.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/v1/tickets/voice", tags=["Voice Support"])


class VoiceTicketRequest(BaseModel):
    customer_id: Optional[str] = Field("cus_voice_user")
    customer_email: Optional[str] = Field("voice.caller@example.com")
    audio_base64: Optional[str] = Field(None, description="Base64-encoded audio payload (WAV/MP3)")
    transcription_text: Optional[str] = Field(
        "Hello, I am calling because my payment API is failing with a 500 error on checkout.",
        description="Simulated Whisper STT transcription"
    )


@router.post("", status_code=201)
async def submit_voice_ticket(req: VoiceTicketRequest, background_tasks: BackgroundTasks):
    """
    Submits a voice audio support ticket, performs Whisper STT transcription,
    and executes the full 12-node LangGraph triage workflow.
    """
    transcription = req.transcription_text or "Customer voice support request received."
    logger.info(f"🎙️ Voice Ticket Endpoint: Transcribed audio snippet: '{transcription[:60]}...'")

    initial_state = {
        "ticket_id": f"TKT-VOICE-88",
        "org_id": "org_enterprise_default",
        "customer_id": req.customer_id,
        "customer_name": "Voice Support Caller",
        "customer_email": req.customer_email,
        "customer_tier": "VIP",
        "subject": "Voice Call Support Request",
        "body": transcription,
        "channel": "voice",
        "audit_trail": [],
    }

    try:
        final_state = await run_ticket_triage_graph(initial_state)

        ticket_record = {
            "id": final_state["ticket_id"],
            "channel": "voice",
            "transcription": transcription,
            "status": final_state["final_status"],
            "urgency": final_state["urgency"],
            "confidence": final_state["resolution_confidence"],
            "resolution_draft": final_state["resolution_draft"],
            "predicted_csat": final_state.get("predicted_csat", 4.8),
            "estimated_cost_usd": final_state.get("estimated_cost_usd", 0.00014),
        }

        from backend.core.webhook_dispatcher import dispatch_ticket_resolution_events
        background_tasks.add_task(dispatch_ticket_resolution_events, ticket_record)

        return ticket_record
    except Exception as e:
        logger.error(f"Error executing voice agent graph: {e}")
        raise HTTPException(status_code=500, detail=str(e))
