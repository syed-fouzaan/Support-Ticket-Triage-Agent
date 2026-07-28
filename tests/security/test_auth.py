"""
Security Unit Tests for Zero-Trust API Key Authentication & Rate Limiting.
"""

import pytest
from fastapi import HTTPException
from backend.security.auth import validate_api_key, check_rate_limit


def test_valid_api_key_acceptance():
    key = validate_api_key("sk_live_sentineldesk_default")
    assert key == "sk_live_sentineldesk_default"


def test_invalid_api_key_rejection():
    with pytest.raises(HTTPException) as exc:
        validate_api_key("sk_invalid_hacker_key")
    assert exc.value.status_code == 401


def test_rate_limiter_exceeded():
    ip = "192.168.1.99"
    for _ in range(5):
        check_rate_limit(ip, max_requests=5, window_sec=60)

    with pytest.raises(HTTPException) as exc:
        check_rate_limit(ip, max_requests=5, window_sec=60)
    assert exc.value.status_code == 429
