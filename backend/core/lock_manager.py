"""
SentinelDesk Core — Distributed Concurrent Race Condition Lock Manager.
Provides async mutex locking to serialize parallel intake threads and prevent race conditions.
"""

from __future__ import annotations

import asyncio
from typing import Dict
from backend.core.logging import get_logger

logger = get_logger(__name__)

_LOCKS: Dict[str, asyncio.Lock] = {}
_GLOBAL_MUTEX = asyncio.Lock()


async def get_ticket_lock(lock_key: str) -> asyncio.Lock:
    """Returns an async Lock for the specified entity key (e.g. ticket_id, customer_id)."""
    async with _GLOBAL_MUTEX:
        if lock_key not in _LOCKS:
            _LOCKS[lock_key] = asyncio.Lock()
        return _LOCKS[lock_key]


class TicketLockGuard:
    """Async context manager guaranteeing exclusive execution per lock key."""
    
    def __init__(self, lock_key: str):
        self.lock_key = lock_key
        self._lock: asyncio.Lock | None = None

    async def __aenter__(self):
        self._lock = await get_ticket_lock(self.lock_key)
        await self._lock.acquire()
        logger.debug(f"Acquired race condition lock for key='{self.lock_key}'")
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._lock and self._lock.locked():
            self._lock.release()
            logger.debug(f"Released race condition lock for key='{self.lock_key}'")
