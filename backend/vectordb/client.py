"""
SentinelDesk — ChromaDB Client
Single point of access for the vector store. Provides connection health check.
"""

from __future__ import annotations

from typing import Optional

import chromadb
from chromadb import ClientAPI

from backend.core.config import settings
from backend.core.logging import get_logger

logger = get_logger(__name__)

_client: Optional[ClientAPI] = None

# Collection names — one per knowledge source type
COLLECTIONS = {
    "faq": "sentineldesk_faq",
    "policy": "sentineldesk_policy",
    "manual": "sentineldesk_manual",
    "ticket": "sentineldesk_tickets",
    "bug": "sentineldesk_bugs",
    "guide": "sentineldesk_guides",
}


def get_chroma_client() -> ClientAPI:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=settings.CHROMADB_PATH)
        logger.info(f"ChromaDB client initialized at {settings.CHROMADB_PATH}")
    return _client


def get_or_create_collection(source_type: str):
    """Get or create a ChromaDB collection for a given source type."""
    client = get_chroma_client()
    collection_name = COLLECTIONS.get(source_type, f"sentineldesk_{source_type}")
    return client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )


def check_chromadb_connection() -> bool:
    """Readiness probe: returns True if ChromaDB is reachable."""
    try:
        client = get_chroma_client()
        client.heartbeat()
        return True
    except Exception as e:
        logger.error(f"ChromaDB connection check failed: {e}")
        return False
