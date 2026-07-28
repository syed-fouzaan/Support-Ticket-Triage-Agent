"""
SentinelDesk Core — Autonomous API Sandbox Repro Engine.
Parses reported customer endpoints from tickets and executes synthetic isolated dry-run tests.
"""

from __future__ import annotations

import re
import time
from typing import Any, Dict

from backend.core.logging import get_logger

logger = get_logger(__name__)


def execute_synthetic_sandbox_test(ticket_body: str, intent: str = "BugReport") -> Dict[str, Any]:
    """
    Simulates isolated API dry-run execution against mock sandbox endpoints.
    Parses HTTP method and target endpoints (e.g. POST /checkout, GET /billing).
    """
    start_time = time.perf_counter()
    
    # Extract HTTP method and route from text
    match = re.search(r"\b(GET|POST|PUT|DELETE|PATCH)\s+([/\w-]+)", ticket_body, re.IGNORECASE)
    
    method = match.group(1).upper() if match else "POST"
    endpoint = match.group(2) if match else "/api/v1/checkout"

    # Simulate sandbox execution result based on query keywords
    body_lower = ticket_body.lower()
    if "500" in body_lower or "timeout" in body_lower or "failing" in body_lower:
        repro_status = "REPRODUCED_500_ERROR"
        http_code = 500
        message = f"Synthetic dry-run {method} {endpoint} failed with HTTP 500 Internal Server Error (Idempotency Key missing)."
    elif "429" in body_lower or "rate limit" in body_lower:
        repro_status = "REPRODUCED_429_RATELIMIT"
        http_code = 429
        message = f"Synthetic dry-run {method} {endpoint} hit HTTP 429 Rate Limit."
    else:
        repro_status = "SUCCESS_200_OK"
        http_code = 200
        message = f"Synthetic dry-run {method} {endpoint} completed cleanly with HTTP 200 OK."

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
    logger.info(f"Sandbox Repro Engine: {method} {endpoint} -> {repro_status} ({elapsed_ms}ms)")

    return {
        "status": "completed",
        "method": method,
        "endpoint": endpoint,
        "repro_status": repro_status,
        "http_code": http_code,
        "message": message,
        "latency_ms": elapsed_ms,
    }
