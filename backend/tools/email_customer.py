"""
SentinelDesk — Tool: email_customer
Sends a resolution email to a customer.

SECURITY: This tool ONLY accepts a ticket_id — it resolves the customer address
internally from the database. It never accepts a free-text email address argument
from model output, preventing LLM-driven email exfiltration.
"""

from __future__ import annotations

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.logging import get_logger
from backend.database.models import Customer, Resolution, ResolutionStatus, Ticket

logger = get_logger(__name__)


class EmailCustomerInput(BaseModel):
    """
    Strictly validated input.
    IMPORTANT: No 'to_address' or 'email' field — by design.
    """
    ticket_id: str = Field(..., max_length=64, description="Ticket ID to send resolution for.")
    subject_override: str | None = Field(
        None,
        max_length=256,
        description="Optional subject line override. Falls back to ticket subject.",
    )


class EmailResult(BaseModel):
    sent: bool
    ticket_id: str
    message: str


async def email_customer(db: AsyncSession, params: EmailCustomerInput) -> EmailResult:
    """
    Sends the approved resolution email to the ticket's customer.
    The customer email address is looked up internally — never provided by the LLM.

    Requires the resolution to be in APPROVED status.
    """
    # 1. Load ticket
    ticket_result = await db.execute(select(Ticket).where(Ticket.id == params.ticket_id))
    ticket = ticket_result.scalar_one_or_none()

    if ticket is None:
        return EmailResult(sent=False, ticket_id=params.ticket_id, message="Ticket not found.")

    # 2. Load resolution — must be approved
    resolution_result = await db.execute(
        select(Resolution).where(Resolution.ticket_id == params.ticket_id)
    )
    resolution = resolution_result.scalar_one_or_none()

    if resolution is None or resolution.status != ResolutionStatus.APPROVED:
        return EmailResult(
            sent=False,
            ticket_id=params.ticket_id,
            message="Resolution not approved. Email not sent.",
        )

    # 3. Load customer — get encrypted email reference
    customer_result = await db.execute(select(Customer).where(Customer.id == ticket.customer_id))
    customer = customer_result.scalar_one_or_none()

    if customer is None or not customer.email_encrypted:
        return EmailResult(
            sent=False,
            ticket_id=params.ticket_id,
            message="Customer email not available.",
        )

    # 4. Decrypt and send (stub — real implementation hooks into SendGrid/SES)
    # TODO: Integrate actual email provider in Milestone 7
    subject = params.subject_override or f"Re: {ticket.subject}"
    logger.info(
        f"email_customer SEND ticket={params.ticket_id} subject='{subject}'",
        extra={"tool_name": "email_customer"},
    )

    # Mark resolution as sent
    resolution.status = ResolutionStatus.SENT
    from datetime import datetime, timezone
    resolution.sent_at = datetime.now(timezone.utc)
    await db.flush()

    return EmailResult(
        sent=True,
        ticket_id=params.ticket_id,
        message="Email sent successfully.",
    )
