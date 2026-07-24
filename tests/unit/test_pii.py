"""
Milestone 2 acceptance checks — PII redaction unit tests.
Covers card numbers, emails, SSNs, and phone numbers against a labeled fixture set.
ponytail: no fixtures file, inline data is enough for 8 patterns.
"""
from backend.security.pii import redact_pii, redact_pii_from_dict


# ── Labeled fixture set ───────────────────────────────────────────────────────
PII_CASES = [
    # (description, input, must_not_contain)
    ("visa card",         "My card 4111111111111111 was charged",     "4111111111111111"),
    ("mastercard",        "card: 5500005555555559 declined",           "5500005555555559"),
    ("email",             "contact john.doe@example.com for help",    "john.doe@example.com"),
    ("ssn dashes",        "SSN is 123-45-6789 please verify",         "123-45-6789"),
    ("ssn plain",         "social security 078051120",                "078051120"),
    ("us phone",          "call me at 555-867-5309",                  "555-867-5309"),
    ("intl phone",        "reach me at +1 (800) 555-0199",            "+1 (800) 555-0199"),
    ("email in dict",     {"body": "reply to user@corp.io"},          "user@corp.io"),
]


def test_pii_redaction_labeled_set():
    for desc, inp, forbidden in PII_CASES:
        if isinstance(inp, str):
            result = redact_pii(inp)
            assert forbidden not in result, f"[{desc}] PII not redacted: '{forbidden}' still in '{result}'"
        elif isinstance(inp, dict):
            result = redact_pii_from_dict(inp)
            for v in result.values():
                assert forbidden not in str(v), f"[{desc}] PII not redacted in dict: '{forbidden}'"


def test_empty_string_safe():
    assert redact_pii("") == ""


def test_no_pii_unchanged():
    text = "I need help with my login screen."
    result = redact_pii(text)
    # Should NOT aggressively redact non-PII
    assert "login" in result
    assert "help" in result


def test_dict_recursion():
    data = {"outer": {"inner": "my ssn is 123-45-6789"}}
    result = redact_pii_from_dict(data)
    assert "123-45-6789" not in str(result)
