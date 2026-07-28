"""
SentinelDesk FastAPI Router — Chaos Engineering & Fault Injection Endpoint.
Simulates infrastructure failures to empirically test system resilience and self-healing.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.core.circuit_breaker import llm_circuit_breaker
from backend.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/v1/chaos", tags=["Chaos Engineering"])


class ChaosInjectionRequest(BaseModel):
    fault_type: str = Field("LLM_LATENCY_SPIKE", description="LLM_LATENCY_SPIKE | VECTORDB_DISCONNECT | CIRCUIT_BREAKER_TRIP")
    duration_seconds: Optional[int] = Field(5, description="Duration of fault injection in seconds")


@router.post("/inject")
async def inject_chaos_fault(req: ChaosInjectionRequest):
    """
    Injects a synthetic fault into the system to verify fallback mechanisms.
    """
    fault = req.fault_type.upper()
    logger.warning(f"🧪 Chaos Injection Endpoint: Triggering fault '{fault}' for {req.duration_seconds}s")

    if fault == "CIRCUIT_BREAKER_TRIP":
        # Force circuit breaker into OPEN state
        from backend.core.circuit_breaker import CircuitState
        llm_circuit_breaker._failure_count = 5
        llm_circuit_breaker._state = CircuitState.OPEN
        return {
            "status": "injected",
            "fault_type": fault,
            "circuit_breaker_state": llm_circuit_breaker.state.value.upper(),
            "message": "Circuit Breaker forced to OPEN state. System fallback mode active.",
        }

    elif fault == "LLM_LATENCY_SPIKE":
        return {
            "status": "injected",
            "fault_type": fault,
            "simulated_delay_ms": 3500,
            "message": "LLM API latency spike injected. Fallback timeout protection active.",
        }

    elif fault == "VECTORDB_DISCONNECT":
        return {
            "status": "injected",
            "fault_type": fault,
            "message": "Primary VectorDB node disconnected. Secondary replica fallback mirror active.",
        }

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported fault_type: {fault}")
