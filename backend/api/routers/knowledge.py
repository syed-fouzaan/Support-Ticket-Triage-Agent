"""
SentinelDesk FastAPI Router — Knowledge Base Endpoint.
Handles document ingestion into ChromaDB vector collections.
"""

from typing import Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.vectordb.ingest import ingest_document
from backend.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/v1/knowledge", tags=["Knowledge"])


class IngestDocumentRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=256)
    content: str = Field(..., min_length=10)
    source_type: str = Field("faq", description="faq, policy, manual, guide, bug, ticket")


@router.post("", status_code=201)
async def create_knowledge_doc(req: IngestDocumentRequest):
    """Ingests a new document into ChromaDB vector store."""
    try:
        res = ingest_document(
            text=req.content,
            title=req.title,
            source_type=req.source_type,
        )
        return {"status": "ingested", "doc_id": res["doc_id"], "chunks": res["chunk_count"]}
    except Exception as e:
        logger.error(f"Error ingesting doc: {e}")
        raise HTTPException(status_code=500, detail=str(e))
