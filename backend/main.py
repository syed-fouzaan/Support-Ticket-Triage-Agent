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
    try:
        from backend.vectordb.seed import seed_vector_database_if_empty
        seed_vector_database_if_empty()
    except Exception as e:
        logger.warning(f"Startup vector seed skipped: {e}")
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


# ── Startup Lifecycle ────────────────────────────────────────────────────────
@app.on_event("startup")
async def on_startup():
    import asyncio
    from backend.core.sla_worker import run_sla_escalation_worker
    asyncio.create_task(run_sla_escalation_worker(30.0))


# ── Trace ID & Security Headers middleware ─────────────────────────────────────
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    trace_id = request.headers.get("X-Trace-Id", str(uuid4()))
    set_trace_id(trace_id)
    start = time.monotonic()
    
    # Rate limiting check
    client_ip = request.client.host if request.client else "127.0.0.1"
    try:
        from backend.security.auth import check_rate_limit
        check_rate_limit(client_ip=client_ip, max_requests=200, window_sec=60)
    except Exception as e:
        if getattr(e, "status_code", None) == 429:
            return JSONResponse(status_code=429, content={"detail": str(e.detail)})

    response = await call_next(request)
    latency_ms = int((time.monotonic() - start) * 1000)
    
    # Standard Security Headers
    response.headers["X-Trace-Id"] = trace_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    logger.info(
        f"{request.method} {request.url.path} -> {response.status_code} ({latency_ms}ms)",
        extra={"latency_ms": latency_ms},
    )
    return response


# ── Root & Health endpoints ──────────────────────────────────────────────────
@app.get("/", tags=["Root"])
async def root():
    """Root landing endpoint — returns API information and quick links."""
    return {
        "service": "SentinelDesk Multi-Agent AI API",
        "version": "1.0.0",
        "status": "online",
        "documentation": "/docs",
        "frontend_ui": "http://localhost:5173",
        "endpoints": {
            "health_live": "/api/v1/health/live",
            "tickets": "/api/v1/tickets",
            "knowledge": "/api/v1/knowledge",
            "analytics": "/api/v1/analytics/summary"
        }
    }


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

    # ChromaDB check (Dual-Node Primary + Failover Mirror)
    try:
        from backend.vectordb.client import check_chromadb_health_dual_node
        checks["chromadb_dual_node"] = check_chromadb_health_dual_node()
        checks["chromadb"] = "ok"
    except Exception as e:
        checks["chromadb"] = f"error: {e}"
        all_ok = False

    if not all_ok:
        return JSONResponse(status_code=503, content={"status": "not_ready", "checks": checks})

    return {"status": "ready", "checks": checks}


# ── Routers ───────────────────────────────────────────────────────────────────
from backend.api.routers import tickets, knowledge, analytics, ws, integrations, chaos, voice

app.include_router(tickets.router)
app.include_router(knowledge.router)
app.include_router(analytics.router)
app.include_router(ws.router)
app.include_router(integrations.router)
app.include_router(chaos.router)
app.include_router(voice.router)

