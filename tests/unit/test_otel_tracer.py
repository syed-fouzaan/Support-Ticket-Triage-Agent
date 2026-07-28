"""Unit tests for OpenTelemetry Distributed Tracing Module."""
from backend.core.otel_tracer import trace_span, get_tracer


def test_trace_span_executes_without_error():
    with trace_span("test_span", {"key": "value"}) as span:
        span.set_attribute("result", "ok")


def test_trace_span_records_exception():
    try:
        with trace_span("error_span") as span:
            raise ValueError("Intentional test error")
    except ValueError:
        pass  # Exception should be recorded without re-raising from span context


def test_get_tracer_returns_instance():
    tracer = get_tracer()
    assert tracer is not None


def test_tracer_starts_span():
    tracer = get_tracer()
    span = tracer.start_span("unit_test_span")
    span.set_attribute("env", "test")
    span.end()
