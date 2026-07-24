"""
SentinelDesk — SSRF Validator
All tools that fetch external URLs must call validate_url() before making any request.
Blocks internal/metadata IP ranges and enforces the configured allow-list of domains.
"""

from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse

from backend.core.config import settings
from backend.core.logging import get_logger
from backend.database.models import SecurityEventType, SecurityEventSeverity

logger = get_logger(__name__)

# RFC1918 + loopback + link-local + metadata ranges
_BLOCKED_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),       # loopback
    ipaddress.ip_network("10.0.0.0/8"),         # RFC1918
    ipaddress.ip_network("172.16.0.0/12"),      # RFC1918
    ipaddress.ip_network("192.168.0.0/16"),     # RFC1918
    ipaddress.ip_network("169.254.0.0/16"),     # link-local / AWS metadata
    ipaddress.ip_network("::1/128"),            # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),           # IPv6 ULA
    ipaddress.ip_network("fe80::/10"),          # IPv6 link-local
]


class SSRFBlockedError(ValueError):
    """Raised when a URL is blocked by the SSRF validator."""


def validate_url(url: str) -> str:
    """
    Validate that a URL is safe to fetch:
    1. Must use http or https.
    2. Must resolve to a public IP (not RFC1918 / loopback / metadata).
    3. Domain must be in SSRF_ALLOWED_DOMAINS if the allow-list is non-empty.

    Returns the validated URL string.
    Raises SSRFBlockedError on any violation — caller must NOT proceed with the request.
    """
    parsed = urlparse(url)

    if parsed.scheme not in ("http", "https"):
        raise SSRFBlockedError(f"Scheme '{parsed.scheme}' not allowed. Only http/https.")

    hostname = parsed.hostname
    if not hostname:
        raise SSRFBlockedError("No hostname in URL.")

    # Domain allow-list check (if configured)
    allowed = settings.ssrf_allowed_domains_list
    if allowed:
        normalized = hostname.lower().lstrip("www.")
        if not any(normalized == d.lower() or normalized.endswith("." + d.lower()) for d in allowed):
            raise SSRFBlockedError(
                f"Domain '{hostname}' is not in the SSRF allow-list. "
                f"Allowed: {allowed}"
            )

    # IP resolution check
    try:
        ip_str = socket.gethostbyname(hostname)
        ip = ipaddress.ip_address(ip_str)
    except socket.gaierror as e:
        raise SSRFBlockedError(f"DNS resolution failed for '{hostname}': {e}")

    for network in _BLOCKED_NETWORKS:
        if ip in network:
            raise SSRFBlockedError(
                f"Resolved IP {ip} for '{hostname}' is in a blocked private/metadata range."
            )

    logger.info(f"ssrf_validated url={url} resolved_ip={ip}")
    return url
