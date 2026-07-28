"""
Unit tests for Dynamic Few-Shot Exemplar Auto-Synthesizer Node.
"""

import pytest
from backend.agents.exemplar_agent import exemplar_synthesizer_node


@pytest.mark.asyncio
async def test_exemplar_synthesizer_node_execution():
    state = {
        "ticket_id": "TKT-EXEMPLAR-101",
        "intent": "Billing",
        "cited_sources": [],
        "audit_trail": []
    }

    res = await exemplar_synthesizer_node(state)
    assert len(res["cited_sources"]) > 0
    assert "Exemplar:" in res["cited_sources"][0]
    assert len(res["audit_trail"]) == 1
