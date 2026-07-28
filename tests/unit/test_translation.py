"""
Unit tests for Multi-Lingual Auto-Translation & Native Language Node.
"""

import pytest
from backend.agents.translation_agent import (
    detect_language,
    translation_intake_node,
    translation_outbound_node,
)


def test_detect_spanish_language():
    text = "Hola, no puedo acceder a mi cuenta corporativa, ayuda por favor."
    assert detect_language(text) == "es"


def test_detect_english_language():
    text = "Payment API endpoint is returning a 500 error."
    assert detect_language(text) == "en"


@pytest.mark.asyncio
async def test_translation_intake_node_spanish():
    state = {
        "ticket_id": "TKT-ES-99",
        "subject": "Error al iniciar sesión",
        "body": "No puedo ingresar a mi cuenta.",
        "audit_trail": []
    }
    res = await translation_intake_node(state)
    assert res["detected_language"] == "es"
    assert len(res["audit_trail"]) == 1


@pytest.mark.asyncio
async def test_translation_outbound_node_spanish():
    state = {
        "detected_language": "es",
        "resolution_draft": "Please clear your browser cache and attempt logging in again.",
    }
    res = await translation_outbound_node(state)
    assert "[Traducción al Español]" in res["native_resolution_draft"]
