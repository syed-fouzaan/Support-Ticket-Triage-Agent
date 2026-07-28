"""
SentinelDesk — LangGraph State Machine State Schema.
Holds the complete immutable state passed between graph nodes.
"""

from typing import Any, Dict, List, Optional, TypedDict


class TicketState(TypedDict, total=False):
    # Inbound Payload
    ticket_id: str
    org_id: str
    customer_id: str
    customer_name: str
    customer_email: str
    customer_tier: str
    subject: str
    body: str
    attachment_text: str
    channel: str
    trace_id: str

    # Intake & Security Node outputs
    pii_found: bool
    pii_redacted_body: str
    is_injection_attempt: bool
    language: str

    # Intent Classification Agent outputs
    intent: str
    sub_intent: str
    intent_confidence: float

    # Urgency & Priority Agent outputs
    urgency: str
    urgency_score: float
    urgency_rationale: str

    # Duplicate Search Agent outputs
    is_duplicate: bool
    duplicate_ticket_id: Optional[str]
    duplicate_similarity: float

    # RAG Retrieval Agent outputs
    retrieved_chunks: List[Dict[str, Any]]
    rag_sources: List[Dict[str, Any]]
    rag_retry_count: int

    # Resolution Agent outputs
    resolution_draft: str
    cited_sources: List[str]
    resolution_confidence: float
    requires_human: bool

    # CSAT Predictor Node outputs
    predicted_csat: float
    csat_category: str

    # Cost Metering Node outputs
    total_tokens: int
    estimated_cost_usd: float

    # Multi-Lingual Translation Node outputs
    detected_language: str
    native_resolution_draft: str

    # Decision Node outputs
    final_status: str  # OPEN, SOLVED, ESCALATED
    decision_reason: str
    assigned_team: Optional[str]

    # Audit Trail & Agentic Tool Execution
    executed_tool_calls: List[Dict[str, Any]]
    audit_trail: List[Dict[str, Any]]
