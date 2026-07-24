"""
SentinelDesk — SQLAlchemy Models
All 8 core tables as specified in PRD Section 12.1.
Schema is Postgres-compatible (via SQLAlchemy) despite using SQLite for demo.
"""

from __future__ import annotations

import enum
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    event,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship


class Base(DeclarativeBase):
    pass


# ── Enums ────────────────────────────────────────────────────────────────────

class TicketStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    ESCALATED = "escalated"
    CLOSED = "closed"


class TicketIntent(str, enum.Enum):
    BILLING = "billing"
    TECHNICAL_BUG = "technical_bug"
    FEATURE_REQUEST = "feature_request"
    ACCOUNT_ACCESS = "account_access"
    GENERAL_QUERY = "general_query"
    ABUSE_POLICY = "abuse_policy"


class TicketUrgency(str, enum.Enum):
    HOT = "hot"
    WARM = "warm"
    COLD = "cold"


class ResolutionStatus(str, enum.Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    SENT = "sent"
    REJECTED = "rejected"


class SecurityEventType(str, enum.Enum):
    AUTH_FAILURE = "auth_failure"
    RATE_LIMIT_HIT = "rate_limit_hit"
    INJECTION_DETECTED = "injection_detected"
    SSRF_BLOCKED = "ssrf_blocked"
    PII_DETECTED = "pii_detected"
    ANOMALOUS_QUERY = "anomalous_query"


class SecurityEventSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class KnowledgeSourceType(str, enum.Enum):
    FAQ = "faq"
    POLICY = "policy"
    MANUAL = "manual"
    TICKET = "ticket"
    BUG = "bug"
    GUIDE = "guide"


class CustomerTier(str, enum.Enum):
    FREE = "free"
    STANDARD = "standard"
    ENTERPRISE = "enterprise"


# ── Tables ───────────────────────────────────────────────────────────────────

class Customer(Base):
    """Customer account. Raw email stored only as salted hash."""
    __tablename__ = "customers"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    email_hash: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    # Encrypted reference for flows that legitimately need to send email
    email_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tier: Mapped[CustomerTier] = mapped_column(
        Enum(CustomerTier), default=CustomerTier.FREE, nullable=False
    )
    plan: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    tickets: Mapped[List["Ticket"]] = relationship("Ticket", back_populates="customer")


class Ticket(Base):
    """Core support ticket table."""
    __tablename__ = "tickets"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    customer_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("customers.id"), nullable=False, index=True
    )
    subject: Mapped[str] = mapped_column(String(512), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    channel: Mapped[str] = mapped_column(String(32), nullable=False, default="web")
    status: Mapped[TicketStatus] = mapped_column(
        Enum(TicketStatus), default=TicketStatus.OPEN, nullable=False, index=True
    )
    intent: Mapped[Optional[TicketIntent]] = mapped_column(Enum(TicketIntent), nullable=True)
    urgency: Mapped[Optional[TicketUrgency]] = mapped_column(Enum(TicketUrgency), nullable=True)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    duplicate_of: Mapped[Optional[str]] = mapped_column(
        String(64), ForeignKey("tickets.id"), nullable=True
    )
    idempotency_key: Mapped[Optional[str]] = mapped_column(
        String(128), nullable=True, unique=True, index=True
    )
    trace_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    customer: Mapped["Customer"] = relationship("Customer", back_populates="tickets")
    audit_logs: Mapped[List["TicketAuditLog"]] = relationship(
        "TicketAuditLog", back_populates="ticket"
    )
    resolution: Mapped[Optional["Resolution"]] = relationship(
        "Resolution", back_populates="ticket", uselist=False
    )
    escalation: Mapped[Optional["Escalation"]] = relationship(
        "Escalation", back_populates="ticket", uselist=False
    )


class TicketAuditLog(Base):
    """
    Append-only audit log of every agent node's input/output.
    NO update or delete method is exposed anywhere in the codebase.
    PII must be redacted before any snapshot is stored here.
    """
    __tablename__ = "ticket_audit_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticket_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("tickets.id"), nullable=False, index=True
    )
    trace_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    node_name: Mapped[str] = mapped_column(String(64), nullable=False)
    # PII-redacted JSON snapshots
    input_snapshot: Mapped[Optional[Dict]] = mapped_column(JSON, nullable=True)
    output_snapshot: Mapped[Optional[Dict]] = mapped_column(JSON, nullable=True)
    latency_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="audit_logs")


class Resolution(Base):
    """AI-generated draft + human approval status."""
    __tablename__ = "resolutions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticket_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("tickets.id"), nullable=False, unique=True, index=True
    )
    draft_text: Mapped[str] = mapped_column(Text, nullable=False)
    cited_sources: Mapped[Optional[List]] = mapped_column(JSON, nullable=True)  # list of doc IDs
    status: Mapped[ResolutionStatus] = mapped_column(
        Enum(ResolutionStatus), default=ResolutionStatus.DRAFT, nullable=False
    )
    reviewed_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="resolution")


class Escalation(Base):
    """Records when and why a ticket was escalated to a human team."""
    __tablename__ = "escalations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticket_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("tickets.id"), nullable=False, unique=True, index=True
    )
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    assigned_team: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    escalated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="escalation")


class KnowledgeDocument(Base):
    """Metadata for documents ingested into ChromaDB."""
    __tablename__ = "knowledge_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_type: Mapped[KnowledgeSourceType] = mapped_column(
        Enum(KnowledgeSourceType), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    version: Mapped[str] = mapped_column(String(32), default="1.0", nullable=False)
    checksum: Mapped[str] = mapped_column(String(64), nullable=False)  # SHA-256
    last_indexed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class ApiKey(Base):
    """API key registry. Only the hashed value is stored — never plaintext."""
    __tablename__ = "api_keys"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key_hash: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    owner: Mapped[str] = mapped_column(String(64), nullable=False)
    scopes: Mapped[Optional[List]] = mapped_column(JSON, nullable=True)  # list of scope strings
    rate_limit_tier: Mapped[str] = mapped_column(String(32), default="free", nullable=False)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    @property
    def is_active(self) -> bool:
        return self.revoked_at is None


class SecurityEvent(Base):
    """Immutable record of security-relevant events (auth failures, rate limits, injections, SSRF)."""
    __tablename__ = "security_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_type: Mapped[SecurityEventType] = mapped_column(
        Enum(SecurityEventType), nullable=False, index=True
    )
    ticket_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    details: Mapped[Optional[Dict]] = mapped_column(JSON, nullable=True)
    severity: Mapped[SecurityEventSeverity] = mapped_column(
        Enum(SecurityEventSeverity), nullable=False, default=SecurityEventSeverity.MEDIUM
    )
    source_ip: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
