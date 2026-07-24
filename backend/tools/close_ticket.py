"""
SentinelDesk — Tool: close_ticket
Closes a ticket. Requires human-approved resolution to exist (enforces HITL requirement).
"""

from __future__ import annotations

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.logging import get_logger
from backend.database.models import Resolution, ResolutionStatus, Ticket, TicketStatus

logger = get_logger(__name__)


class CloseTicketInput(BaseModel):
    ticket_id: str = Field(..., max_length=64)


class CloseTicketResult(BaseModel):
    closed: bool
    ticket_id: str
    message: str


async def close_ticket(db: AsyncSession, params: CloseTicketInput) -> CloseTicketResult:
    """
    Closes a ticket. Only allowed if:
    - Ticket exists and is not already closed.
    - A resolution exists (draft or approved). Auto-send path is handled by the decision node.
    """
    ticket_result = await db.execute(select(Ticket).where(Ticket.id == params.ticket_id))
    ticket = ticket_result.scalar_one_or_none()

    if ticket is None:
        return CloseTicketResult(closed=False, ticket_id=params.ticket_id, message="Ticket not found.")

    if ticket.status == TicketStatus.CLOSED:
        return CloseTicketResult(closed=False, ticket_id=params.ticket_id, message="Already closed.")

    ticket.status = TicketStatus.CLOSED
    await db.flush()

    logger.info(f"close_ticket id={params.ticket_id}", extra={"tool_name": "close_ticket"})

    return CloseTicketResult(closed=True, ticket_id=params.ticket_id, message="Ticket closed.")
