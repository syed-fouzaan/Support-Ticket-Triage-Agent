"""
Milestone 3 acceptance checks — Tool layer unit tests.
Each tool: valid input, invalid input (schema rejection), SSRF/scope-escape.
ponytail: in-memory SQLite for DB tools, no test containers needed.
"""
import pytest
from pydantic import ValidationError

# ── SSRF validator ────────────────────────────────────────────────────────────
from backend.security.ssrf import SSRFBlockedError, validate_url

SSRF_BLOCKED = [
    "http://127.0.0.1/admin",
    "http://localhost/",
    "http://169.254.169.254/latest/meta-data/",
    "http://10.0.0.1/internal",
    "http://192.168.1.1/router",
    "http://172.16.0.1/secret",
    "ftp://example.com/file",          # bad scheme
    "file:///etc/passwd",              # bad scheme
]


def test_ssrf_blocks_internal_ranges():
    for url in SSRF_BLOCKED:
        with pytest.raises((SSRFBlockedError, ValueError)):
            validate_url(url)


def test_ssrf_allows_public_domain(monkeypatch):
    import socket
    # Monkeypatch DNS resolution so we don't need real internet in CI
    monkeypatch.setattr(socket, "gethostbyname", lambda h: "93.184.216.34")  # example.com
    result = validate_url("https://example.com/docs")
    assert result == "https://example.com/docs"


# ── search_ticket schema ──────────────────────────────────────────────────────
from backend.tools.search_ticket import SearchTicketInput


def test_search_ticket_valid():
    p = SearchTicketInput(query="payment failed", limit=5)
    assert p.limit == 5


def test_search_ticket_limit_capped():
    with pytest.raises(ValidationError):
        SearchTicketInput(limit=999)  # max=100


def test_search_ticket_query_null_bytes_stripped():
    p = SearchTicketInput(query="hello\x00world")
    assert "\x00" not in p.query


# ── lookup_customer schema ────────────────────────────────────────────────────
from backend.tools.lookup_customer import LookupCustomerInput


def test_lookup_customer_valid():
    p = LookupCustomerInput(customer_id="cus_123")
    assert p.customer_id == "cus_123"


def test_lookup_customer_too_long():
    with pytest.raises(ValidationError):
        LookupCustomerInput(customer_id="x" * 65)


# ── email_customer — critical: no free-text email address ────────────────────
from backend.tools.email_customer import EmailCustomerInput


def test_email_customer_has_no_address_field():
    """SECURITY: email_customer must NOT accept a free-text 'to' address from LLM output."""
    import inspect
    fields = EmailCustomerInput.model_fields
    forbidden = {"to", "email", "to_address", "recipient", "address"}
    overlap = set(fields.keys()) & forbidden
    assert not overlap, f"email_customer has forbidden address fields: {overlap}"


def test_email_customer_requires_ticket_id():
    with pytest.raises(ValidationError):
        EmailCustomerInput()  # ticket_id is required


# ── create_ticket schema ──────────────────────────────────────────────────────
from backend.tools.create_ticket import CreateTicketInput


def test_create_ticket_valid():
    p = CreateTicketInput(customer_id="c1", subject="broken", body="it broke")
    assert p.channel == "web"  # default


def test_create_ticket_bad_channel():
    with pytest.raises(ValidationError):
        CreateTicketInput(customer_id="c1", subject="s", body="b", channel="telegram")


def test_create_ticket_empty_body():
    with pytest.raises(ValidationError):
        CreateTicketInput(customer_id="c1", subject="s", body="")


# ── escalate_ticket schema ────────────────────────────────────────────────────
from backend.tools.escalate_ticket import EscalateTicketInput


def test_escalate_ticket_requires_reason():
    with pytest.raises(ValidationError):
        EscalateTicketInput(ticket_id="t1")  # reason required


def test_escalate_ticket_valid():
    p = EscalateTicketInput(ticket_id="t1", reason="Low confidence", assigned_team="billing")
    assert p.assigned_team == "billing"


# ── search_document schema ────────────────────────────────────────────────────
from backend.tools.search_document import SearchDocumentInput


def test_search_document_empty_query_rejected():
    with pytest.raises(ValidationError):
        SearchDocumentInput(query="")


def test_search_document_top_k_bounds():
    with pytest.raises(ValidationError):
        SearchDocumentInput(query="q", top_k=0)
    with pytest.raises(ValidationError):
        SearchDocumentInput(query="q", top_k=99)
