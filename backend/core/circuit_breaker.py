"""
SentinelDesk — Circuit Breaker
Wraps every LLM call. Opens after N consecutive failures, serves a safe fallback,
and half-opens on a probe interval to test recovery.
"""

from __future__ import annotations

import asyncio
import time
from enum import Enum
from typing import Any, Callable, Optional

from backend.core.logging import get_logger

logger = get_logger(__name__)


class CircuitState(str, Enum):
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing — reject calls immediately
    HALF_OPEN = "half_open"  # Probing for recovery


class CircuitBreaker:
    """
    Thread-safe async circuit breaker for LLM calls.

    Args:
        name: Human-readable name (used in logs/metrics).
        failure_threshold: Consecutive failures before opening.
        recovery_timeout: Seconds to wait before probing recovery.
        fallback: Async callable returning a safe default when open.
    """

    def __init__(
        self,
        name: str,
        failure_threshold: int = 3,
        recovery_timeout: float = 60.0,
        fallback: Optional[Callable[..., Any]] = None,
    ) -> None:
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self._fallback = fallback

        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._opened_at: Optional[float] = None
        self._lock = asyncio.Lock()

    @property
    def state(self) -> CircuitState:
        return self._state

    async def call(self, func: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
        async with self._lock:
            if self._state == CircuitState.OPEN:
                if time.monotonic() - (self._opened_at or 0) >= self.recovery_timeout:
                    logger.info("circuit_breaker_half_open", extra={"node_name": self.name})
                    self._state = CircuitState.HALF_OPEN
                else:
                    logger.warning("circuit_breaker_open_reject", extra={"node_name": self.name})
                    return await self._run_fallback(*args, **kwargs)

        try:
            result = await func(*args, **kwargs)
            async with self._lock:
                if self._state == CircuitState.HALF_OPEN:
                    logger.info("circuit_breaker_recovered", extra={"node_name": self.name})
                self._state = CircuitState.CLOSED
                self._failure_count = 0
            return result

        except Exception as exc:
            async with self._lock:
                self._failure_count += 1
                logger.warning(
                    f"circuit_breaker_failure [{self._failure_count}/{self.failure_threshold}]",
                    extra={"node_name": self.name},
                )
                if self._failure_count >= self.failure_threshold:
                    self._state = CircuitState.OPEN
                    self._opened_at = time.monotonic()
                    logger.error("circuit_breaker_opened", extra={"node_name": self.name})
            raise exc

    async def _run_fallback(self, *args: Any, **kwargs: Any) -> Any:
        if self._fallback is not None:
            return await self._fallback(*args, **kwargs)
        raise RuntimeError(
            f"Circuit breaker '{self.name}' is OPEN and no fallback is configured."
        )

    def reset(self) -> None:
        """Manually reset — useful in tests."""
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._opened_at = None


# ── Module-level singletons (one breaker per LLM call site) ─────────────────

async def _llm_fallback_response(*args: Any, **kwargs: Any) -> dict:
    """
    Safe fallback when the LLM is unavailable.
    The agent graph interprets this as a forced escalation.
    """
    return {
        "error": "llm_unavailable",
        "message": (
            "We've received your ticket and a human agent will respond as soon as possible. "
            "Our AI system is temporarily unavailable."
        ),
        "requires_escalation": True,
    }


llm_circuit_breaker = CircuitBreaker(
    name="llm_provider",
    failure_threshold=3,
    recovery_timeout=60.0,
    fallback=_llm_fallback_response,
)
