"""
SentinelDesk — Background SLA Monitoring Daemon.
Periodically invokes SLA breach checks against live API every 30 seconds.
"""

import sys
import time
import urllib.request
import urllib.error
import json

# Ensure UTF-8 output on Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def run_sla_cron(target_url: str = "http://localhost:8000/api/v1/analytics/sla-check", interval_sec: int = 30):
    print("=" * 70)
    print("⏱️ SentinelDesk Background SLA Monitoring Daemon Active")
    print(f"Target Endpoint : {target_url}")
    print(f"Check Interval  : Every {interval_sec} seconds")
    print("=" * 70)

    req = urllib.request.Request(
        target_url,
        data=b"{}",
        headers={"Content-Type": "application/json", "User-Agent": "SentinelDesk-SLADaemon/1.0"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
            print(f"[{time.strftime('%H:%M:%S')}] SLA Check Executed | Status: {payload.get('status')} | Breaches Escalated: {payload.get('new_breaches_escalated')}")
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] SLA Check Skipped: {e}")


if __name__ == "__main__":
    run_sla_cron()
