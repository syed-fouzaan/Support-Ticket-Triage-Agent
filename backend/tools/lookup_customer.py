"""
SentinelDesk — Tool: lookup_customer
Looks up customer metadata by ID. Never exposes raw email — only tier, plan, and prior ticket count.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.models import Customer, Ticket


class LookupCustomerInput(BaseModel):
    customer_id: str = Field(..., max_length=64, description="Customer ID to look up.")


class CustomerContext(BaseModel):
    customer_id: str
    tier: str
    plan: Optional[str]
    total_tickets: int
    found: bool


async def lookup_customer(db: AsyncSession, params: LookupCustomerInput) -> CustomerContext:
    """
    Returns customer tier, plan, and prior ticket count.
    Raw email is never returned — only the hashed version exists in DB.
    """
    result = await db.execute(
        select(Customer).where(Customer.id == params.customer_id)
    )
    customer = result.scalar_one_or_none()

    if customer is None:
        return CustomerContext(
            customer_id=params.customer_id,
            tier="free",
            plan=None,
            total_tickets=0,
            found=False,
        )

    ticket_count_result = await db.execute(
        select(func.count(Ticket.id)).where(Ticket.customer_id == params.customer_id)
    )
    total_tickets = ticket_count_result.scalar_one() or 0

    return CustomerContext(
        customer_id=customer.id,
        tier=customer.tier.value,
        plan=customer.plan,
        total_tickets=total_tickets,
        found=True,
    )
