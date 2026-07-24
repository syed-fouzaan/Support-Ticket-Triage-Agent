"""
SentinelDesk — RAG Ingestion Pipeline
Chunk → Embed (bge-small-en-v1.5, local) → Store in ChromaDB

Chunking: recursive character splitter, ~400-600 tokens, 15% overlap.
Embedding: BAAI/bge-small-en-v1.5 — free, local, no external API dependency.
Storage: partitioned by source_type into separate ChromaDB collections.
"""

from __future__ import annotations

import hashlib
import uuid
from pathlib import Path
from typing import List, Optional

from sentence_transformers import SentenceTransformer

from backend.core.config import settings
from backend.core.logging import get_logger
from backend.security.pii import redact_pii
from backend.vectordb.client import get_or_create_collection

logger = get_logger(__name__)

# Embedding model — loaded once, runs locally
_embedder: Optional[SentenceTransformer] = None


def get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        logger.info("Loading bge-small-en-v1.5 embedding model...")
        _embedder = SentenceTransformer("BAAI/bge-small-en-v1.5")
        logger.info("Embedding model loaded.")
    return _embedder


def _chunk_text(text: str, chunk_size: int, overlap: int) -> List[str]:
    """
    Recursive character splitter: splits on paragraphs first, then sentences, then chars.
    Returns list of chunks of approximately `chunk_size` characters with `overlap` overlap.
    """
    separators = ["\n\n", "\n", ". ", " ", ""]
    chunks: List[str] = []

    def _split(text: str, seps: List[str]) -> List[str]:
        if not seps:
            return [text]
        sep = seps[0]
        parts = text.split(sep) if sep else list(text)
        return [p for p in parts if p.strip()]

    # Greedy merge: build chunks up to chunk_size
    words = text.split()
    current: List[str] = []
    current_len = 0

    for word in words:
        if current_len + len(word) + 1 > chunk_size and current:
            chunks.append(" ".join(current))
            # Keep overlap
            overlap_words = current[-max(1, overlap // 6):]
            current = overlap_words
            current_len = sum(len(w) + 1 for w in current)
        current.append(word)
        current_len += len(word) + 1

    if current:
        chunks.append(" ".join(current))

    return [c for c in chunks if c.strip()]


def ingest_document(
    *,
    text: str,
    title: str,
    source_type: str,
    doc_id: Optional[str] = None,
    metadata: Optional[dict] = None,
) -> dict:
    """
    Ingest a single document into ChromaDB:
    1. PII redaction.
    2. Chunking (400-600 token equiv chars, 15% overlap).
    3. Local embedding (bge-small-en-v1.5).
    4. Upsert into the appropriate collection.

    Returns: { "doc_id": str, "chunk_count": int }
    """
    # 1. PII redaction before embedding or storing
    text = redact_pii(text)

    # 2. Chunk
    chunks = _chunk_text(
        text,
        chunk_size=settings.RAG_CHUNK_SIZE * 4,  # ~4 chars per token
        overlap=settings.RAG_CHUNK_OVERLAP * 4,
    )
    logger.info(f"ingest_document title='{title}' source_type={source_type} chunks={len(chunks)}")

    if not chunks:
        logger.warning(f"No chunks produced for document: {title}")
        return {"doc_id": doc_id or "", "chunk_count": 0}

    # 3. Embed
    embedder = get_embedder()
    embeddings = embedder.encode(chunks, show_progress_bar=False).tolist()

    # 4. Upsert into ChromaDB
    collection = get_or_create_collection(source_type)
    _doc_id = doc_id or str(uuid.uuid4())
    checksum = hashlib.sha256(text.encode()).hexdigest()

    chunk_ids = [f"{_doc_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [
        {
            "doc_id": _doc_id,
            "title": title,
            "source_type": source_type,
            "chunk_index": i,
            "checksum": checksum,
            **(metadata or {}),
        }
        for i in range(len(chunks))
    ]

    collection.upsert(
        ids=chunk_ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas,
    )

    logger.info(f"ingest_document upserted doc_id={_doc_id} chunks={len(chunks)}")
    return {"doc_id": _doc_id, "chunk_count": len(chunks)}


def ingest_file(filepath: str | Path, source_type: str) -> dict:
    """
    Convenience wrapper: read a text file and ingest it.
    """
    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {filepath}")

    text = path.read_text(encoding="utf-8")
    return ingest_document(
        text=text,
        title=path.stem,
        source_type=source_type,
        doc_id=hashlib.md5(str(path.absolute()).encode()).hexdigest(),
    )
