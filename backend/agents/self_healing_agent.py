"""
SentinelDesk Agent — Autonomous Self-Healing Feedback Loop Agent.
Intercepts human operator resolution edits, formats Golden Reflexion exemplars,
and re-indexes them into ChromaDB vector memory to prevent recurring agent errors.
"""

from datetime import datetime, timezone
from typing import Any, Dict

from backend.core.logging import get_logger
from backend.vectordb.client import get_or_create_collection
from backend.vectordb.ingest import get_embedder

logger = get_logger(__name__)


def process_operator_feedback(
    ticket_id: str,
    subject: str,
    original_draft: str,
    corrected_draft: str,
    operator_notes: str = ""
) -> Dict[str, Any]:
    """
    Synthesizes a Golden Reflexion exemplar from human operator feedback
    and indexes it into the ChromaDB sentineldesk_tickets vector collection.
    """
    now_str = datetime.now(timezone.utc).strftime("%H:%M:%S")
    exemplar_text = f"QUERY: {subject}\nCORRECTED RESOLUTION: {corrected_draft}\nOPERATOR NOTES: {operator_notes or 'Human operator feedback'}"

    doc_id = f"self-healed-{ticket_id}"

    try:
        collection = get_or_create_collection("ticket")
        embedder = get_embedder()
        vector = embedder.encode(exemplar_text).tolist()

        collection.add(
            ids=[doc_id],
            documents=[exemplar_text],
            metadatas=[{
                "ticket_id": ticket_id,
                "subject": subject,
                "golden_reflexion": True,
                "self_healed": True,
                "source_type": "ticket",
            }],
            embeddings=[vector]
        )
        logger.info(f"Self-healing feedback indexed exemplar {doc_id} into ChromaDB vector store")

        return {
            "status": "success",
            "doc_id": doc_id,
            "message": f"🤖 Self-Healing Loop: Ingested corrected resolution exemplar into Golden Memory ({now_str})"
        }
    except Exception as e:
        logger.warning(f"Self-healing indexing deferred: {e}")
        return {
            "status": "deferred",
            "error": str(e),
            "message": f"🤖 Self-Healing Loop: Feedback received and logged ({now_str})"
        }
