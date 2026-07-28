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


@router.get("", status_code=200)
async def get_knowledge_info():
    """Information endpoint for Knowledge Base operations."""
    return {
        "endpoint": "/api/v1/knowledge",
        "description": "ChromaDB Knowledge Base Vector Store",
        "usage": "Send a POST request to ingest documents",
        "example_payload": {
            "title": "Password Reset Guide",
            "content": "To reset password, go to settings and select security...",
            "source_type": "faq"
        }
    }


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


@router.get("/clusters", status_code=200)
async def get_knowledge_clusters():
    """Returns 2D spatial coordinate clusters for visual embedding vector maps."""
    clusters = [
        {
            "category": "Billing & Subscription",
            "centroid": {"x": 25, "y": 70},
            "documents_count": 14,
            "nodes": [
                {"id": "doc-b1", "title": "Billing FAQ & Refund Policy", "x": 22, "y": 68, "size": 18},
                {"id": "doc-b2", "title": "Enterprise Invoicing & VAT", "x": 28, "y": 74, "size": 14},
                {"id": "doc-b3", "title": "Stripe Card Retry Procedure", "x": 24, "y": 71, "size": 16},
            ]
        },
        {
            "category": "Authentication & OAuth",
            "centroid": {"x": 75, "y": 25},
            "documents_count": 18,
            "nodes": [
                {"id": "doc-a1", "title": "SAML 2.0 / Okta Single Sign-On", "x": 78, "y": 22, "size": 22},
                {"id": "doc-a2", "title": "MFA Recovery Code Reset", "x": 72, "y": 28, "size": 15},
                {"id": "doc-a3", "title": "JWT Token Refresh Spec", "x": 76, "y": 24, "size": 17},
            ]
        },
        {
            "category": "Technical REST API",
            "centroid": {"x": 50, "y": 50},
            "documents_count": 22,
            "nodes": [
                {"id": "doc-t1", "title": "Rate Limit Headers (429)", "x": 48, "y": 52, "size": 20},
                {"id": "doc-t2", "title": "Webhook HMAC Signature", "x": 54, "y": 47, "size": 19},
                {"id": "doc-t3", "title": "Pagination & Cursor Spec", "x": 51, "y": 51, "size": 15},
            ]
        }
    ]
    return {
        "status": "ok",
        "total_vector_chunks": 54,
        "active_collections": ["faq", "policy", "manual", "guide"],
        "clusters": clusters
    }

