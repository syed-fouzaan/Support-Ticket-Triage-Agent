"""
SentinelDesk — Tool: escalate_ticket
Escalates a ticket to a human team. Records reason and team in the escalations table.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.logging import get_logger
from backend.database.models import Escalation, Ticket, TicketStatus

logger = get_logger(__name__)


class EscalateTicketInput(BaseModel):
    ticket_id: str = Field(..., max_length=64)
    reason: str = Field(..., min_length=1, max_length=1024)
    assigned_team: Optional[str] = Field(None, max_length=64)


class EscalationResult(BaseModel):
    escalated: bool
    ticket_id: str
    reason: str
    assigned_team: Optional[str]
    message: str


async def escalate_ticket(db: AsyncSession, params: EscalateTicketInput) -> EscalationResult:
    """Updates ticket status to ESCALATED and creates an escalation record."""
    ticket_result = await db.execute(select(Ticket).where(Ticket.id == params.ticket_id))
    ticket = ticket_result.scalar_one_or_none()

    if ticket is None:
        return EscalationResult(
            escalated=False,
            ticket_id=params.ticket_id,
            reason=params.reason,
            assigned_team=params.assigned_team,
            message="Ticket not found.",
        )

    ticket.status = TicketStatus.ESCALATED

    escalation = Escalation(
        ticket_id=params.ticket_id,
        reason=params.reason,
        assigned_team=params.assigned_team,
    )
    db.add(escalation)
    await db.flush()

    logger.info(
        f"escalate_ticket id={params.ticket_id} reason={params.reason[:80]}",
        extra={"tool_name": "escalate_ticket"},
    )

    return EscalationResult(
        escalated=True,
        ticket_id=params.ticket_id,
        reason=params.reason,
        assigned_team=params.assigned_team,
        message="Ticket escalated to human review.",
    )
