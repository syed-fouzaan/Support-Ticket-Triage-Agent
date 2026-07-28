"""
SentinelDesk — Vector Database Seeding Pipeline.
Populates ChromaDB vector collections with realistic enterprise support grounding docs on startup.
"""

from backend.core.logging import get_logger
from backend.vectordb.client import get_or_create_collection, check_chromadb_connection
from backend.vectordb.ingest import get_embedder

logger = get_logger(__name__)

REAL_WORLD_GROUNDING_DOCS = [
    {
        "id": "kb-001",
        "collection": "manual",
        "title": "Payment API Retry Rules & Idempotency",
        "content": "For failed payment transactions, always check the Idempotency-Key header. Retries within 24 hours with the same key will not create duplicate charges.",
    },
    {
        "id": "kb-002",
        "collection": "policy",
        "title": "Prorated Billing for Team Seat Upgrades",
        "content": "When upgrading team seats mid-cycle, charges are calculated on a daily prorated basis. Refunds for unused seat allocations are credited to the next invoice statement.",
    },
    {
        "id": "kb-003",
        "collection": "guide",
        "title": "Password Reset & 2FA Recovery Procedures",
        "content": "If a customer does not receive password reset emails, verify domain MX records. For 2FA recovery, require identity verification via emergency backup codes.",
    },
    {
        "id": "kb-004",
        "collection": "faq",
        "title": "Custom Webhook Signature Header Validation",
        "content": "Webhook payloads are signed using HMAC-SHA256. Verify signature headers using your workspace secret key at /settings/developer.",
    },
]


def seed_vector_database_if_empty():
    """Seeds ChromaDB with grounding docs if vector store is unpopulated."""
    try:
        if not check_chromadb_connection():
            return

        embedder = get_embedder()

        for doc in REAL_WORLD_GROUNDING_DOCS:
            stype = doc["collection"]
            collection = get_or_create_collection(stype)

            if collection.count() == 0:
                embedding = embedder.encode(doc["content"]).tolist()
                collection.add(
                    ids=[doc["id"]],
                    documents=[doc["content"]],
                    metadatas=[{"title": doc["title"], "source_type": stype, "org_id": "org_enterprise_default"}],
                    embeddings=[embedding],
                )
                logger.info(f"Seeded ChromaDB collection '{stype}' with doc '{doc['id']}'")

    except Exception as e:
        logger.warning(f"Vector DB seeding fallback: {e}")
