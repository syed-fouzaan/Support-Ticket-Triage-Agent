"""
SentinelDesk — Structured JSON Logging
Every log line includes trace_id, ticket_id, node_name, latency_ms for full observability.
"""

from __future__ import annotations

import json
import logging
import sys
import time
from contextvars import ContextVar
from typing import Optional
from uuid import uuid4

# Context vars propagated through the entire request/agent cycle
_trace_id: ContextVar[str] = ContextVar("trace_id", default="")
_ticket_id: ContextVar[str] = ContextVar("ticket_id", default="")


def get_trace_id() -> str:
    return _trace_id.get() or str(uuid4())


def set_trace_id(tid: str) -> None:
    _trace_id.set(tid)


def get_ticket_id() -> str:
    return _ticket_id.get()


def set_ticket_id(tid: str) -> None:
    _ticket_id.set(tid)


class StructuredFormatter(logging.Formatter):
    """Emit every log record as a single-line JSON object."""

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "trace_id": _trace_id.get(""),
            "ticket_id": _ticket_id.get(""),
        }
        # Merge any extra fields passed via logging.extra
        for key in ("node_name", "latency_ms", "tool_name", "event_type"):
            val = getattr(record, key, None)
            if val is not None:
                payload[key] = val

        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)

        return json.dumps(payload, ensure_ascii=False)


def configure_logging(level: str = "INFO") -> None:
    """Call once at application startup."""
    root = logging.getLogger()
    root.setLevel(level.upper())

    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(StructuredFormatter())
    root.handlers = [handler]


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
