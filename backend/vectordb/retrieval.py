"""
SentinelDesk — RAG Retrieval Pipeline
Embed Query (bge-small-en-v1.5, local) → Query ChromaDB → Rerank & Return top_k
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional, Any

from backend.core.logging import get_logger
from backend.vectordb.client import get_or_create_collection, COLLECTIONS
from backend.vectordb.ingest import get_embedder

logger = get_logger(__name__)


@dataclass
class RetrievedChunk:
    chunk_id: str
    title: str
    content: str
    score: float
    source_type: str


async def retrieve_chunks(
    query: str,
    source_types: Optional[List[str]] = None,
    top_k: int = 6,
) -> List[RetrievedChunk]:
    """
    Retrieves the top_k most relevant chunks across ChromaDB collections.
    """
    if not query.strip():
        return []

    if source_types is None:
        source_types = list(COLLECTIONS.keys())

    embedder = get_embedder()
    query_embedding = embedder.encode(query).tolist()

    all_chunks: List[RetrievedChunk] = []

    for stype in source_types:
        try:
            collection = get_or_create_collection(stype)
            if collection.count() == 0:
                continue

            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=min(top_k, collection.count()),
                include=["documents", "metadatas", "distances"],
            )

            if results and results.get("ids") and results["ids"][0]:
                ids = results["ids"][0]
                documents = results["documents"][0] if results.get("documents") else []
                metadatas = results["metadatas"][0] if results.get("metadatas") else []
                distances = results["distances"][0] if results.get("distances") else []

                for cid, doc, meta, dist in zip(ids, documents, metadatas, distances):
                    # Distance to similarity conversion (Chroma L2 distance to score 0-1)
                    score = round(max(0.0, 1.0 - (dist / 2.0)), 2)
                    title = meta.get("title", f"Doc {cid[:6]}") if meta else f"Doc {cid[:6]}"
                    chunk_stype = meta.get("source_type", stype) if meta else stype

                    all_chunks.append(
                        RetrievedChunk(
                            chunk_id=cid,
                            title=title,
                            content=doc,
                            score=score,
                            source_type=chunk_stype,
                        )
                    )
        except Exception as e:
            logger.warning(f"Error querying collection {stype}: {e}")

    # Rerank across all collections by score
    all_chunks.sort(key=lambda x: x.score, reverse=True)
    return all_chunks[:top_k]
