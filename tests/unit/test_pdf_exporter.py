"""Unit tests for Cryptographic Audit Certificate Generator."""
from backend.core.pdf_exporter import generate_audit_certificate, render_certificate_html


def test_generate_audit_certificate_signature():
    ticket_state = {
        "ticket_id": "TKT-CERT-001",
        "org_id": "ACME-CORP",
        "customer_id": "CUST-999",
        "resolution_confidence": 0.98,
        "pii_found": False,
        "is_injection_attempt": False,
        "final_status": "SOLVED",
    }
    cert = generate_audit_certificate(ticket_state)
    assert cert["ticket_id"] == "TKT-CERT-001"
    assert "sha256_signature" in cert
    assert len(cert["sha256_signature"]) == 64  # Valid SHA-256 hex length


def test_render_certificate_html():
    cert = {
        "certificate_id": "CERT-SOC2-1001",
        "ticket_id": "TKT-1001",
        "org_id": "ACME-CORP",
        "generated_at": "2026-07-28T12:00:00Z",
        "confidence_score": 0.95,
        "sha256_signature": "a" * 64,
    }
    html = render_certificate_html(cert)
    assert "SOC2 Audit Certificate" in html
    assert "CERT-SOC2-1001" in html
