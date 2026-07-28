"""
SentinelDesk — High-Concurrency Stress Test & Load Generator.
Simulates burst ticket intake traffic to measure RPS, latency percentiles, and success rate under load.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import statistics
import sys
import time
import urllib.request
import urllib.error

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def send_ticket_request(target_url: str, payload: dict) -> tuple[bool, float, int]:
    """Synchronous HTTP POST request runner used inside async executor thread."""
    start = time.perf_counter()
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        target_url,
        data=data,
        headers={"Content-Type": "application/json", "User-Agent": "SentinelDesk-StressTester/1.0"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            elapsed = time.perf_counter() - start
            return (200 <= response.status < 300, elapsed, response.status)
    except urllib.error.HTTPError as e:
        elapsed = time.perf_counter() - start
        return (False, elapsed, e.code)
    except Exception as e:
        elapsed = time.perf_counter() - start
        return (False, elapsed, 500)


async def run_stress_test(base_url: str = "http://localhost:8000", total_requests: int = 30, concurrency: int = 10):
    print("=" * 70)
    print("SentinelDesk High-Concurrency Stress Test & Load Generator")
    print(f"Target Base URL : {base_url}")
    print(f"Total Requests  : {total_requests}")
    print(f"Concurrency     : {concurrency} parallel workers")
    print("=" * 70)

    endpoint = f"{base_url}/api/v1/tickets"
    payload_template = {
        "customer_id": "cus_stress_test",
        "customer_name": "Load Test Agent",
        "customer_email": "loadtest@sentineldesk.io",
        "customer_tier": "enterprise",
        "subject": "Stress Test: Payment API retry timeout under load",
        "body": "Production payment API POST /checkout failing with timeout under high concurrency.",
        "channel": "api"
    }

    loop = asyncio.get_running_loop()
    semaphore = asyncio.Semaphore(concurrency)
    results: list[tuple[bool, float, int]] = []

    async def worker(req_id: int):
        async with semaphore:
            payload = {**payload_template, "subject": f"Stress Test #{req_id}: Payment API 500 error"}
            res = await loop.run_in_executor(None, send_ticket_request, endpoint, payload)
            results.append(res)

    test_start = time.perf_counter()
    tasks = [worker(i) for i in range(1, total_requests + 1)]
    await asyncio.gather(*tasks)
    total_time = time.perf_counter() - test_start

    # Analytics calculation
    latencies = [r[1] * 1000 for r in results]  # ms
    successes = [r for r in results if r[0]]
    failures = [r for r in results if not r[0]]
    rps = total_requests / total_time if total_time > 0 else 0

    sorted_latencies = sorted(latencies)
    mean_latency = statistics.mean(latencies) if latencies else 0
    p50 = sorted_latencies[int(len(sorted_latencies) * 0.50)] if sorted_latencies else 0
    p95 = sorted_latencies[int(len(sorted_latencies) * 0.95)] if sorted_latencies else 0
    p99 = sorted_latencies[int(len(sorted_latencies) * 0.99)] if sorted_latencies else 0

    print("\nBenchmark Diagnostic Summary:")
    print(f"* Total Elapsed Time : {total_time:.2f} seconds")
    print(f"* Throughput (RPS)   : {rps:.2f} req/sec")
    print(f"* Success Rate       : {len(successes)} / {total_requests} ({(len(successes)/total_requests)*100:.1f}%)")
    print(f"* Mean Latency       : {mean_latency:.2f} ms")
    print(f"* P50 Latency        : {p50:.2f} ms")
    print(f"* P95 Latency        : {p95:.2f} ms")
    print(f"* P99 Latency        : {p99:.2f} ms")
    print("=" * 70)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SentinelDesk Stress Tester")
    parser.add_argument("--url", default="http://localhost:8000", help="Base URL of FastAPI backend")
    parser.add_argument("--total", type=int, default=30, help="Total number of requests")
    parser.add_argument("--concurrency", type=int, default=10, help="Concurrent workers")
    args = parser.parse_args()

    asyncio.run(run_stress_test(base_url=args.url, total_requests=args.total, concurrency=args.concurrency))
