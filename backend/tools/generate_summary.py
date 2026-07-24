"""
SentinelDesk — Tool: generate_summary
Generates a structured summary of a ticket for dashboard display.
"""

from __future__ import annotations

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.logging import get_logger
from backend.database.models import Ticket

logger = get_logger(__name__)


class GenerateSummaryInput(BaseModel):
    ticket_id: str = Field(..., max_length=64)
    max_words: int = Field(default=50, ge=10, le=200)


class TicketSummaryOutput(BaseModel):
    ticket_id: str
    summary: str
    found: bool


async def generate_summary(db: AsyncSession, params: GenerateSummaryInput) -> TicketSummaryOutput:
    """Returns a brief plain-text summary of a ticket's subject and body."""
    result = await db.execute(select(Ticket).where(Ticket.id == params.ticket_id))
    ticket = result.scalar_one_or_none()

    if ticket is None:
        return TicketSummaryOutput(ticket_id=params.ticket_id, summary="", found=False)

    # Simple extractive summary: subject + first N words of body
    body_words = ticket.body.split()
    excerpt = " ".join(body_words[: params.max_words])
    if len(body_words) > params.max_words:
        excerpt += "..."

    summary = f"{ticket.subject} — {excerpt}"

    logger.info(f"generate_summary ticket={params.ticket_id}", extra={"tool_name": "generate_summary"})
    return TicketSummaryOutput(ticket_id=params.ticket_id, summary=summary, found=True)
