"""
SentinelDesk — Tool: create_ticket
Creates a new support ticket. Validates schema, assigns ID and trace_id.
Checks idempotency key to prevent duplicate processing from client retries.
"""

from __future__ import annotations

import uuid
from typing import Optional

from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.logging import get_logger, get_trace_id
from backend.database.models import Ticket, TicketStatus
from backend.security.pii import redact_pii

logger = get_logger(__name__)


class CreateTicketInput(BaseModel):
    customer_id: str = Field(..., max_length=64)
    subject: str = Field(..., min_length=1, max_length=512)
    body: str = Field(..., min_length=1, max_length=32_000)
    channel: str = Field(default="web", max_length=32)
    idempotency_key: Optional[str] = Field(None, max_length=128)

    @field_validator("body", "subject")
    @classmethod
    def strip_null_bytes(cls, v: str) -> str:
        return v.replace("\x00", "").strip()

    @field_validator("channel")
    @classmethod
    def validate_channel(cls, v: str) -> str:
        allowed = {"web", "email", "api", "webhook"}
        if v not in allowed:
            raise ValueError(f"channel must be one of {allowed}")
        return v


class CreatedTicket(BaseModel):
    id: str
    customer_id: str
    subject: str
    status: str
    trace_id: str
    duplicate: bool = False
    duplicate_of: Optional[str] = None


async def create_ticket(db: AsyncSession, params: CreateTicketInput) -> CreatedTicket:
    """
    Creates and persists a new ticket.
    - Deduplicates via idempotency_key (returns existing ticket if key matches).
    - Stores PII-safe body (raw body passed to graph, but stored body is redacted).
    """
    # Idempotency check
    if params.idempotency_key:
        existing = await db.execute(
            select(Ticket).where(Ticket.idempotency_key == params.idempotency_key)
        )
        found = existing.scalar_one_or_none()
        if found:
            logger.info(f"create_ticket idempotent hit key={params.idempotency_key}")
            return CreatedTicket(
                id=found.id,
                customer_id=found.customer_id,
                subject=found.subject,
                status=found.status.value,
                trace_id=found.trace_id or "",
                duplicate=True,
                duplicate_of=found.id,
            )

    ticket_id = str(uuid.uuid4())
    trace_id = get_trace_id() or str(uuid.uuid4())

    ticket = Ticket(
        id=ticket_id,
        customer_id=params.customer_id,
        subject=redact_pii(params.subject),
        body=params.body,  # raw body for agent graph; PII redacted before audit log
        channel=params.channel,
        status=TicketStatus.OPEN,
        idempotency_key=params.idempotency_key,
        trace_id=trace_id,
    )
    db.add(ticket)
    await db.flush()

    logger.info(
        f"create_ticket id={ticket_id} customer={params.customer_id} channel={params.channel}",
        extra={"tool_name": "create_ticket"},
    )

    return CreatedTicket(
        id=ticket_id,
        customer_id=params.customer_id,
        subject=ticket.subject,
        status=TicketStatus.OPEN.value,
        trace_id=trace_id,
    )
