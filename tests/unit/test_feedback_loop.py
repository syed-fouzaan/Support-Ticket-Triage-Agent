"""Unit tests for Self-Improving Feedback Loop & Active Learning store."""
import os
import tempfile
import pytest
from backend.core import feedback_loop


def test_record_and_load_approved_resolution(tmp_path, monkeypatch):
    store_path = str(tmp_path / "feedback_store.jsonl")
    monkeypatch.setattr(feedback_loop, "_FEEDBACK_STORE_PATH", store_path)

    record = feedback_loop.record_approved_resolution(
        ticket_id="TKT-FB-001",
        intent="Billing",
        subject="Duplicate charge on account",
        resolution_draft="Refund of $49.00 issued.",
        csat_score=5.0,
    )
    assert record["ticket_id"] == "TKT-FB-001"
    assert record["csat_score"] == 5.0
    assert record["label"] == "gold_approved"

    exemplars = feedback_loop.load_feedback_exemplars(min_csat=4.5, intent="Billing")
    assert len(exemplars) == 1
    assert exemplars[0]["ticket_id"] == "TKT-FB-001"


def test_feedback_stats_empty_store(tmp_path, monkeypatch):
    store_path = str(tmp_path / "empty_store.jsonl")
    monkeypatch.setattr(feedback_loop, "_FEEDBACK_STORE_PATH", store_path)

    stats = feedback_loop.feedback_stats()
    assert stats["total"] == 0
    assert stats["avg_csat"] == 0.0


def test_load_filters_by_min_csat(tmp_path, monkeypatch):
    store_path = str(tmp_path / "feedback_store.jsonl")
    monkeypatch.setattr(feedback_loop, "_FEEDBACK_STORE_PATH", store_path)

    feedback_loop.record_approved_resolution("TKT-1", "BugReport", "Bug", "Fix applied", 3.0)
    feedback_loop.record_approved_resolution("TKT-2", "BugReport", "Crash", "Patched", 5.0)

    high_quality = feedback_loop.load_feedback_exemplars(min_csat=4.5)
    assert len(high_quality) == 1
    assert high_quality[0]["ticket_id"] == "TKT-2"
