"""
SentinelDesk — Tool: search_document
Searches the ChromaDB vector store for relevant knowledge chunks.
All URL-based document fetches go through the SSRF validator.
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field

from backend.core.logging import get_logger

logger = get_logger(__name__)


class SearchDocumentInput(BaseModel):
    query: str = Field(..., min_length=1, max_length=1024)
    source_types: Optional[List[str]] = Field(
        None,
        description="Filter to specific collections: faq, policy, manual, ticket, bug, guide.",
    )
    top_k: int = Field(default=6, ge=1, le=20)


class DocumentChunk(BaseModel):
    chunk_id: str
    source_type: str
    title: str
    content: str
    score: float


async def search_document(params: SearchDocumentInput) -> List[DocumentChunk]:
    """
    Retrieves top-k chunks from ChromaDB for a query.
    Delegates to the vectordb retrieval module.
    """
    from backend.vectordb.retrieval import retrieve_chunks

    chunks = await retrieve_chunks(
        query=params.query,
        source_types=params.source_types,
        top_k=params.top_k,
    )

    logger.info(
        f"search_document query='{params.query[:60]}' results={len(chunks)}",
        extra={"tool_name": "search_document"},
    )
    return chunks
