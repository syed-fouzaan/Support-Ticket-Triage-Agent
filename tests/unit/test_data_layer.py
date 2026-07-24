"""
Milestone 2 acceptance checks — Data layer unit tests.
- Insert ticket, read back.
- Confirm audit log entries CANNOT be updated or deleted via any exposed method.
- In-memory SQLite, no external DB needed.
"""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.database.models import Base, Customer, CustomerTier, Ticket, TicketStatus
from backend.database.audit_log import insert_audit_log, get_audit_trail


@pytest.fixture
async def db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
    async with SessionLocal() as session:
        yield session
    await engine.dispose()


async def _seed_customer(db: AsyncSession):
    c = Customer(id="cus_001", email_hash="abc123", tier=CustomerTier.FREE)
    db.add(c)
    await db.flush()
    return c


async def _seed_ticket(db: AsyncSession, customer_id="cus_001"):
    t = Ticket(
        id="tkt_001",
        customer_id=customer_id,
        subject="Test subject",
        body="Something broke",
        channel="web",
        status=TicketStatus.OPEN,
    )
    db.add(t)
    await db.flush()
    return t


# ── Insert + read back ────────────────────────────────────────────────────────

async def test_insert_and_read_ticket(db):
    await _seed_customer(db)
    ticket = await _seed_ticket(db)
    assert ticket.id == "tkt_001"
    assert ticket.status == TicketStatus.OPEN
    assert ticket.body == "Something broke"


# ── Audit log append-only guarantee ──────────────────────────────────────────

async def test_audit_log_insert(db):
    await _seed_customer(db)
    await _seed_ticket(db)
    entry = await insert_audit_log(
        db,
        ticket_id="tkt_001",
        trace_id="trace_abc",
        node_name="intent_node",
        input_snapshot={"text": "something broke"},
        latency_ms=42,
    )
    assert entry.id is not None
    assert entry.node_name == "intent_node"


async def test_audit_log_no_update_method():
    """The audit_log module must have no update or delete function at all."""
    import backend.database.audit_log as mod
    import inspect
    members = [name for name, _ in inspect.getmembers(mod, inspect.isfunction)]
    forbidden = [m for m in members if "update" in m or "delete" in m or "remove" in m]
    assert not forbidden, f"audit_log module exposes forbidden methods: {forbidden}"


async def test_audit_log_pii_redacted(db):
    """Snapshots with PII must be redacted before reaching the audit log."""
    await _seed_customer(db)
    await _seed_ticket(db)
    entry = await insert_audit_log(
        db,
        ticket_id="tkt_001",
        trace_id="trace_abc",
        node_name="intake",
        input_snapshot={"body": "my card is 4111111111111111"},
    )
    assert "4111111111111111" not in str(entry.input_snapshot)


async def test_get_audit_trail_ordered(db):
    await _seed_customer(db)
    await _seed_ticket(db)
    for i, node in enumerate(["intake", "intent", "urgency"]):
        await insert_audit_log(db, ticket_id="tkt_001", trace_id="t", node_name=node, latency_ms=i * 10)
    trail = await get_audit_trail(db, "tkt_001")
    assert [e.node_name for e in trail] == ["intake", "intent", "urgency"]
