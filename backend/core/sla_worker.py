"""
SentinelDesk Core — Active SLA Escalation Background Worker Daemon.
Continuously polls active tickets every N seconds to check for SLA breach conditions and auto-escalate priority.
"""

import asyncio
from typing import NoReturn

from backend.api.routers.tickets import _IN_MEMORY_TICKETS
from backend.core.logging import get_logger
from backend.core.sla_engine import check_and_escalate_sla_breaches

logger = get_logger(__name__)


async def run_sla_escalation_worker(interval_seconds: float = 30.0) -> NoReturn:
    """
    Active SLA Background Daemon Loop.
    Runs indefinitely during FastAPI application lifespan.
    """
    logger.info(f"[SLA Daemon] SLA Escalation Worker Daemon initialized (polling every {interval_seconds}s)")
    while True:
        try:
            res = check_and_escalate_sla_breaches(_IN_MEMORY_TICKETS)
            if res.get("escalated_count", 0) > 0:
                logger.warning(
                    f"⏱️ SLA Daemon: Auto-escalated {res['escalated_count']} tickets approaching SLA deadline."
                )
        except Exception as e:
            logger.error(f"Error in SLA escalation worker loop: {e}")

        await asyncio.sleep(interval_seconds)
