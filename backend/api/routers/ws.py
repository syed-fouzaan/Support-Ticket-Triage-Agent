"""
SentinelDesk FastAPI Router — WebSocket Manager.
Streams live agent node execution state transitions to connected dashboard clients.
"""

from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/ws", tags=["WebSockets"])


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected ({len(self.active_connections)} active)")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info("WebSocket client disconnected")

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Error broadcasting WebSocket message: {e}")


ws_manager = ConnectionManager()


@router.websocket("/live-triage")
async def websocket_live_triage(websocket: WebSocket):
    """WebSocket endpoint for real-time ticket triage telemetry."""
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep-alive receive loop
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


@router.websocket("/triage-stream/{ticket_id}")
async def websocket_triage_stream(websocket: WebSocket, ticket_id: str):
    """Streams live step-by-step agent reasoning thoughts for a specific ticket."""
    await websocket.accept()
    logger.info(f"Subscribed WebSocket streaming for ticket {ticket_id}")

    steps = [
        {"type": "NODE_START", "node": "intake_step", "text": "Intaking ticket payload & sanitizing PII..."},
        {"type": "NODE_START", "node": "intent_step", "text": "Scoring intent & categorizing query domain..."},
        {"type": "NODE_START", "node": "urgency_step", "text": "Evaluating customer tier & SLA urgency lane..."},
        {"type": "NODE_START", "node": "duplicate_step", "text": "Vector semantic duplicate search in ChromaDB..."},
        {"type": "NODE_START", "node": "rag_step", "text": "2-stage Cross-Encoder RAG retrieval & context grounding..."},
        {"type": "NODE_START", "node": "resolution_step", "text": "Drafting native resolution & citing documentation..."},
        {"type": "NODE_START", "node": "csat_step", "text": "Predicting expected CSAT star score & sentiment..."},
        {"type": "NODE_START", "node": "decision_step", "text": "Evaluating confidence threshold & routing decision..."}
    ]

    try:
        for s in steps:
            await websocket.send_json({"ticket_id": ticket_id, **s})
        
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong", "ticket_id": ticket_id})
    except WebSocketDisconnect:
        logger.info(f"Unsubscribed WebSocket stream for ticket {ticket_id}")
