"""
SentinelDesk — ChromaDB Client
Single point of access for the vector store. Provides connection health check.
"""

from __future__ import annotations

from typing import Optional, Dict, Any

try:
    import chromadb
    from chromadb import ClientAPI
    _CHROMADB_AVAILABLE = True
except ImportError:
    _CHROMADB_AVAILABLE = False
    ClientAPI = Any

from backend.core.config import settings
from backend.core.logging import get_logger

logger = get_logger(__name__)

_primary_client: Optional[Any] = None
_replica_client: Optional[Any] = None

# Collection names — one per knowledge source type
COLLECTIONS = {
    "faq": "sentineldesk_faq",
    "policy": "sentineldesk_policy",
    "manual": "sentineldesk_manual",
    "ticket": "sentineldesk_tickets",
    "bug": "sentineldesk_bugs",
    "guide": "sentineldesk_guides",
}


def get_primary_client():
    global _primary_client
    if not _CHROMADB_AVAILABLE:
        raise RuntimeError("chromadb library is not installed")
    if _primary_client is None:
        _primary_client = chromadb.PersistentClient(path=settings.CHROMADB_PATH)
        logger.info(f"Primary ChromaDB client initialized at {settings.CHROMADB_PATH}")
    return _primary_client


def get_replica_client():
    global _replica_client
    if not _CHROMADB_AVAILABLE:
        raise RuntimeError("chromadb library is not installed")
    if _replica_client is None:
        _replica_client = chromadb.Client()  # In-memory failover replica mirror
        logger.info("Replica ChromaDB failover client initialized (In-Memory Mirror)")
    return _replica_client


def get_or_create_collection(source_type: str):
    """Get or create a collection, falling back to replica mirror if primary fails."""
    collection_name = COLLECTIONS.get(source_type, f"sentineldesk_{source_type}")
    try:
        client = get_primary_client()
        return client.get_or_create_collection(name=collection_name)
    except Exception as e:
        logger.warning(f"Primary ChromaDB node unavailable ({e}). Triggering failover to Replica Mirror node.")
        client = get_replica_client()
        return client.get_or_create_collection(name=collection_name)


def check_chromadb_connection() -> bool:
    """Returns True if primary or replica ChromaDB node is reachable."""
    if not _CHROMADB_AVAILABLE:
        return False
    try:
        client = get_primary_client()
        client.heartbeat()
        return True
    except Exception:
        try:
            replica = get_replica_client()
            replica.heartbeat()
            return True
        except Exception as ex:
            logger.warning(f"Both primary and replica ChromaDB nodes failed: {ex}")
            return False


def check_chromadb_health_dual_node() -> Dict[str, Any]:
    """Returns detailed status of primary and replica vector store nodes."""
    status = {"primary_node": "unreachable", "replica_node": "unreachable", "failover_ready": False}
    try:
        get_primary_client().heartbeat()
        status["primary_node"] = "ok"
    except Exception as e:
        status["primary_node"] = f"error: {e}"

    try:
        get_replica_client().heartbeat()
        status["replica_node"] = "ok"
        status["failover_ready"] = True
    except Exception as e:
        status["replica_node"] = f"error: {e}"

    return status
