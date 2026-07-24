"""
SentinelDesk — Tool: search_ticket
Searches for tickets by text query or filters. Parameterized queries only — no SQL injection.
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field, field_validator
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.models import Ticket, TicketIntent, TicketStatus, TicketUrgency


class SearchTicketInput(BaseModel):
    """Validated input schema for search_ticket tool."""
    query: Optional[str] = Field(None, max_length=512, description="Full-text search query.")
    status: Optional[TicketStatus] = None
    intent: Optional[TicketIntent] = None
    urgency: Optional[TicketUrgency] = None
    customer_id: Optional[str] = Field(None, max_length=64)
    limit: int = Field(default=10, ge=1, le=100)

    @field_validator("query")
    @classmethod
    def sanitize_query(cls, v):
        if v is not None:
            # Strip null bytes that could cause issues downstream
            v = v.replace("\x00", "").strip()
        return v


class TicketSummary(BaseModel):
    id: str
    subject: str
    status: str
    intent: Optional[str]
    urgency: Optional[str]
    confidence: Optional[float]
    customer_id: str


async def search_ticket(db: AsyncSession, params: SearchTicketInput) -> List[TicketSummary]:
    """
    Search tickets using parameterized ORM queries (no raw SQL string building).
    Returns a list of TicketSummary objects.
    """
    stmt = select(Ticket)

    if params.status:
        stmt = stmt.where(Ticket.status == params.status)
    if params.intent:
        stmt = stmt.where(Ticket.intent == params.intent)
    if params.urgency:
        stmt = stmt.where(Ticket.urgency == params.urgency)
    if params.customer_id:
        stmt = stmt.where(Ticket.customer_id == params.customer_id)
    if params.query:
        q = f"%{params.query}%"
        stmt = stmt.where(or_(Ticket.subject.ilike(q), Ticket.body.ilike(q)))

    stmt = stmt.limit(params.limit).order_by(Ticket.created_at.desc())

    result = await db.execute(stmt)
    tickets = result.scalars().all()

    return [
        TicketSummary(
            id=t.id,
            subject=t.subject,
            status=t.status.value,
            intent=t.intent.value if t.intent else None,
            urgency=t.urgency.value if t.urgency else None,
            confidence=t.confidence,
            customer_id=t.customer_id,
        )
        for t in tickets
    ]
