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


async def retrieve_chunks(
    query: str,
    source_types: Optional[List[str]] = None,
    top_k: int = 6,
    org_id: Optional[str] = None,
) -> List[SimpleNamespace]:
    """Retrieves the top_k most relevant chunks across ChromaDB collections, filtered by tenant org_id."""
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
                "n_results": min(top_k, collection.count()),
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

    all_chunks.sort(key=lambda x: x.score, reverse=True)
    return all_chunks[:top_k]
