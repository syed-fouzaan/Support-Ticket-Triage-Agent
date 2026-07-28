"""
Unit tests for Distributed Concurrent Race Condition Lock Manager.
"""

import asyncio
import pytest
from backend.core.lock_manager import TicketLockGuard, get_ticket_lock


@pytest.mark.asyncio
async def test_concurrent_lock_serialization():
    execution_order = []
    lock_key = "cus_race_condition_test"

    async def worker(worker_id: int):
        async with TicketLockGuard(lock_key):
            execution_order.append(f"start_{worker_id}")
            await asyncio.sleep(0.02)
            execution_order.append(f"end_{worker_id}")

    await asyncio.gather(worker(1), worker(2))
    
    assert len(execution_order) == 4
    # Serialized: worker 1 finishes before worker 2 starts (or vice versa)
    assert (execution_order[0] == "start_1" and execution_order[1] == "end_1") or \
           (execution_order[0] == "start_2" and execution_order[1] == "end_2")
