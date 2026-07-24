"""
SentinelDesk — FastAPI Application Entry Point
"""

from __future__ import annotations

import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.core.config import settings
from backend.core.logging import configure_logging, get_logger, set_trace_id
from uuid import uuid4

configure_logging(settings.LOG_LEVEL)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"SentinelDesk starting up | env={settings.APP_ENV} | provider={settings.LLM_PROVIDER}")
    yield
    logger.info("SentinelDesk shutting down.")


app = FastAPI(
    title="SentinelDesk API",
    version="1.0.0",
    description="Multi-agent AI customer support operations platform.",
    lifespan=lifespan,
    # Hide docs in production
    docs_url=None if settings.APP_ENV == "production" else "/docs",
    redoc_url=None if settings.APP_ENV == "production" else "/redoc",
    openapi_url="/api/v1/openapi.json",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)


# ── Trace ID middleware ────────────────────────────────────────────────────────
@app.middleware("http")
async def trace_id_middleware(request: Request, call_next):
    trace_id = request.headers.get("X-Trace-Id", str(uuid4()))
    set_trace_id(trace_id)
    start = time.monotonic()
    response = await call_next(request)
    latency_ms = int((time.monotonic() - start) * 1000)
    response.headers["X-Trace-Id"] = trace_id
    logger.info(
        f"{request.method} {request.url.path} → {response.status_code} ({latency_ms}ms)",
        extra={"latency_ms": latency_ms},
    )
    return response


# ── Health endpoints ──────────────────────────────────────────────────────────
@app.get("/health", include_in_schema=False)
@app.get("/api/v1/health/live", tags=["Health"])
async def liveness():
    """Liveness probe — process is up."""
    return {"status": "ok", "env": settings.APP_ENV}


@app.get("/api/v1/health/ready", tags=["Health"])
async def readiness():
    """
    Readiness probe — checks DB, ChromaDB, and LLM provider reachability.
    Returns 503 if any critical dependency is unavailable.
    """
    checks: dict = {}
    all_ok = True

    # Database check
    try:
        from backend.database.session import check_db_connection
        checks["database"] = "ok" if await check_db_connection() else "unreachable"
    except Exception as e:
        checks["database"] = f"error: {e}"
        all_ok = False

    # ChromaDB check
    try:
        from backend.vectordb.client import check_chromadb_connection
        checks["chromadb"] = "ok" if check_chromadb_connection() else "unreachable"
    except Exception as e:
        checks["chromadb"] = f"error: {e}"
        all_ok = False

    if not all_ok:
        return JSONResponse(status_code=503, content={"status": "not_ready", "checks": checks})

    return {"status": "ready", "checks": checks}


# ── Routers ───────────────────────────────────────────────────────────────────
from backend.api.routers import tickets, knowledge, analytics

app.include_router(tickets.router)
app.include_router(knowledge.router)
app.include_router(analytics.router)

