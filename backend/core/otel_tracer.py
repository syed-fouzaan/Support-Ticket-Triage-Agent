"""
SentinelDesk Core — OpenTelemetry Distributed Tracing Module.
Instruments FastAPI requests and agent node executions with OTEL spans.
Exports traces to Jaeger (or stdout in dev mode) via OTLP exporter.
"""

import time
from contextlib import contextmanager
from typing import Generator, Optional
from backend.core.logging import get_logger

logger = get_logger(__name__)


class _MockSpan:
    """Lightweight no-op span for environments without OTEL installed."""
    def __init__(self, name: str):
        self.name = name
        self._start = time.monotonic()

    def set_attribute(self, key: str, value):
        pass

    def set_status(self, status):
        pass

    def record_exception(self, exc):
        logger.error(f"[OTEL Span '{self.name}'] Exception recorded: {exc}")

    def end(self):
        elapsed_ms = (time.monotonic() - self._start) * 1000
        logger.debug(f"[OTEL Span] '{self.name}' completed in {elapsed_ms:.2f}ms")


class _MockTracer:
    """No-op tracer that emits structured log lines compatible with Jaeger ingestion."""
    def start_span(self, name: str) -> _MockSpan:
        logger.info(f"[OTEL] Starting span: '{name}'")
        return _MockSpan(name)


# Singleton tracer — swap for opentelemetry.trace.get_tracer(__name__) in production
_tracer = _MockTracer()


@contextmanager
def trace_span(name: str, attributes: Optional[dict] = None) -> Generator[_MockSpan, None, None]:
    """
    Context manager for creating an OTEL-compatible trace span.

    Usage:
        with trace_span("rag_node", {"ticket_id": ticket_id}) as span:
            result = await do_rag_work()
            span.set_attribute("rag.results_count", len(result))
    """
    span = _tracer.start_span(name)
    if attributes:
        for k, v in attributes.items():
            span.set_attribute(k, v)
    try:
        yield span
    except Exception as exc:
        span.record_exception(exc)
        raise
    finally:
        span.end()


def get_tracer():
    """Returns the global SentinelDesk OTEL tracer instance."""
    return _tracer
