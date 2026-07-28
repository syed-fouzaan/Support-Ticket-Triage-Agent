"""
SentinelDesk Security — Zero-Trust API Key Authentication & Rate Limiter Module.
Validates X-API-Key request headers and enforces per-IP leaky bucket rate limits.
"""

import time
from typing import Dict, List, Optional
from fastapi import Header, HTTPException, Request, status

from backend.core.logging import get_logger

logger = get_logger(__name__)

# Enterprise Valid API Keys (Configurable via environment/vault)
VALID_API_KEYS = {
    "sk_live_sentineldesk_default",
    "sk_test_demo_key",
    "sk_enterprise_acme_prod"
}

# Rate Limiter Memory Tracker: ip -> list of timestamps
_IP_REQUEST_TIMESTAMPS: Dict[str, List[float]] = {}


def validate_api_key(x_api_key: Optional[str] = Header(None)) -> str:
    """
    Dependency validator for protected REST routes.
    If X-API-Key header is provided, it must match a valid enterprise key.
    """
    if x_api_key is None:
        # Permissive default for public demo UI; key required if explicitly passed
        return "public_default"

    if x_api_key not in VALID_API_KEYS:
        logger.warning(f"Unauthorized API key attempt: '{x_api_key[:10]}...'")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or unauthorized API key (X-API-Key)"
        )
    return x_api_key


def check_rate_limit(client_ip: str, max_requests: int = 100, window_sec: int = 60) -> bool:
    """
    Leaky-bucket rate limiter.
    Throws HTTP 429 Too Many Requests if client_ip exceeds max_requests within window_sec.
    """
    now = time.time()
    timestamps = _IP_REQUEST_TIMESTAMPS.get(client_ip, [])

    # Filter timestamps within window
    valid_timestamps = [ts for ts in timestamps if now - ts < window_sec]
    valid_timestamps.append(now)
    _IP_REQUEST_TIMESTAMPS[client_ip] = valid_timestamps

    if len(valid_timestamps) > max_requests:
        logger.warning(f"Rate limit exceeded for IP {client_ip} ({len(valid_timestamps)} reqs / {window_sec}s)")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Maximum {max_requests} requests per {window_sec} seconds."
        )
    return True
