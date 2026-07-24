"""
SentinelDesk — Audit Log Repository
INSERT-ONLY access. No update or delete method exists for TicketAuditLog anywhere in the codebase.
"""

from __future__ import annotations

from typing import Dict, List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.core.logging import get_logger
from backend.database.models import TicketAuditLog
from backend.security.pii import redact_pii_from_dict

logger = get_logger(__name__)


async def insert_audit_log(
    db: AsyncSession,
    *,
    ticket_id: str,
    trace_id: str,
    node_name: str,
    input_snapshot: Optional[Dict] = None,
    output_snapshot: Optional[Dict] = None,
    latency_ms: Optional[int] = None,
) -> TicketAuditLog:
    """
    Insert a single audit log entry.
    Snapshots are PII-redacted before storage — card numbers, emails, SSNs are never stored raw.
    """
    entry = TicketAuditLog(
        ticket_id=ticket_id,
        trace_id=trace_id,
        node_name=node_name,
        input_snapshot=redact_pii_from_dict(input_snapshot) if input_snapshot else None,
        output_snapshot=redact_pii_from_dict(output_snapshot) if output_snapshot else None,
        latency_ms=latency_ms,
    )
    db.add(entry)
    await db.flush()  # flush to get auto-generated ID; caller commits
    logger.info(
        f"audit_log_insert ticket={ticket_id} node={node_name} latency={latency_ms}ms",
        extra={"node_name": node_name, "latency_ms": latency_ms},
    )
    return entry


async def get_audit_trail(db: AsyncSession, ticket_id: str) -> List[TicketAuditLog]:
    """Read all audit entries for a ticket (read-only, ordered by creation time)."""
    result = await db.execute(
        select(TicketAuditLog)
        .where(TicketAuditLog.ticket_id == ticket_id)
        .order_by(TicketAuditLog.created_at)
    )
    return list(result.scalars().all())
