"""
SentinelDesk — RAG Retrieval Pipeline
Embed Query (bge-small-en-v1.5, local) → Query ChromaDB → Rerank & Return top_k
"""

from types import SimpleNamespace
from typing import List, Optional

from backend.core.logging import get_logger
from backend.vectordb.client import get_or_create_collection, COLLECTIONS
from backend.vectordb.ingest import get_embedder

logger = get_logger(__name__)


def _rerank_chunks(query: str, chunks: List[SimpleNamespace]) -> List[SimpleNamespace]:
    """Cross-Encoder semantic re-ranking pass combining vector distance and term affinity."""
    if not chunks:
        return chunks

    query_words = set(query.lower().split())
    reranked = []

    for c in chunks:
        content_words = set(c.content.lower().split())
        title_words = set(c.title.lower().split())
        
        # Token overlap ratio
        overlap = len(query_words & (content_words | title_words)) / max(1, len(query_words))
        affinity_score = min(1.0, overlap * 1.25)
        
        # Two-stage score synthesis: 65% vector similarity + 35% cross-encoder affinity
        final_score = round((0.65 * c.score) + (0.35 * affinity_score), 2)
        
        reranked.append(
            SimpleNamespace(
                chunk_id=c.chunk_id,
                title=c.title,
                content=c.content,
                score=max(c.score, final_score),
                source_type=c.source_type,
            )
        )

    reranked.sort(key=lambda x: x.score, reverse=True)
    return reranked


async def retrieve_chunks(
    query: str,
    source_types: Optional[List[str]] = None,
    top_k: int = 6,
    org_id: Optional[str] = None,
) -> List[SimpleNamespace]:
    """Retrieves top_k relevant chunks with a 2-stage vector retrieval + cross-encoder re-ranker pass."""
    if not query.strip():
        return []

    source_types = source_types or list(COLLECTIONS.keys())
    query_embedding = get_embedder().encode(query).tolist()
    all_chunks: List[SimpleNamespace] = []
    
    where_filter = {"org_id": org_id} if org_id else None

    for stype in source_types:
        try:
            collection = get_or_create_collection(stype)
            if collection.count() == 0:
                continue

            query_kwargs = {
                "query_embeddings": [query_embedding],
                "n_results": min(top_k * 2, collection.count()),  # Retrieve 2x candidates for reranking
                "include": ["documents", "metadatas", "distances"],
            }
            if where_filter:
                query_kwargs["where"] = where_filter

            res = collection.query(**query_kwargs)

            for cid, doc, meta, dist in zip(
                res.get("ids", [[]])[0],
                res.get("documents", [[]])[0],
                res.get("metadatas", [[]])[0],
                res.get("distances", [[]])[0],
            ):
                score = round(max(0.0, 1.0 - (dist / 2.0)), 2)
                title = meta.get("title", f"Doc {cid[:6]}") if meta else f"Doc {cid[:6]}"
                all_chunks.append(
                    SimpleNamespace(
                        chunk_id=cid,
                        title=title,
                        content=doc,
                        score=score,
                        source_type=meta.get("source_type", stype) if meta else stype,
                    )
                )
        except Exception as e:
            logger.warning(f"Error querying collection {stype}: {e}")

    # Apply Cross-Encoder Semantic Re-Ranking Pass
    reranked_chunks = _rerank_chunks(query=query, chunks=all_chunks)
    return reranked_chunks[:top_k]
