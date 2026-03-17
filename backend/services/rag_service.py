"""
RAG Service

Manages the pgvector-backed Retrieval-Augmented Generation pipeline.

  embed_and_store(content, metadata, db)  — embed a text chunk and save to DB
  similarity_search(query, k, db)         — cosine similarity search, returns top-k docs
  ingest_corpus_if_empty(db)              — seed the vector store from MALAY_CORPUS on first run
"""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.data.malay_corpus import MALAY_CORPUS
from backend.models.document import Document
from backend.services import gemini_service
from backend.utils.logger import get_logger

logger = get_logger(__name__)


async def embed_and_store(
    content: str,
    metadata: dict | None,
    db: AsyncSession,
) -> Document:
    """
    Generate an embedding for `content` and store it in the documents table.

    Args:
        content:  The raw text chunk to embed and store.
        metadata: Arbitrary metadata dict (e.g. type, level, topic).
        db:       The async SQLAlchemy session.

    Returns:
        The persisted Document ORM instance.
    """
    embedding = await gemini_service.get_embeddings(content)

    doc = Document(
        content=content,
        embedding=embedding,
        metadata_json=metadata or {},
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    logger.info("Document stored", doc_id=str(doc.id), preview=content[:60])
    return doc


async def similarity_search(
    query: str,
    k: int = 5,
    db: AsyncSession = None,
) -> list[Document]:
    """
    Find the top-k most semantically similar documents to `query`.

    Uses cosine distance on pgvector embeddings.
    Returns an empty list if the documents table is empty or an error occurs.

    Args:
        query: The user's query or chat message to search against.
        k:     Number of results to return (default: 5).
        db:    The async SQLAlchemy session.
    """
    if db is None:
        logger.warning("similarity_search called without db session")
        return []

    try:
        query_vector = await gemini_service.get_embeddings(query)

        result = await db.execute(
            select(Document)
            .order_by(Document.embedding.cosine_distance(query_vector))
            .limit(k)
        )
        docs = result.scalars().all()
        logger.info("RAG search completed", query_preview=query[:60], hits=len(docs))
        return list(docs)

    except Exception as exc:
        logger.error("similarity_search failed", error=str(exc))
        return []


async def ingest_corpus_if_empty(db: AsyncSession) -> None:
    """
    Seed the documents table from MALAY_CORPUS if it is currently empty.

    Called once on app startup (from lifespan). Safe to call multiple times —
    it checks the row count before doing any work.
    """
    try:
        result = await db.execute(select(func.count()).select_from(Document))
        count = result.scalar_one()

        if count > 0:
            logger.info("RAG corpus already seeded", document_count=count)
            return

        logger.info("Seeding RAG corpus", chunks=len(MALAY_CORPUS))

        for i, chunk in enumerate(MALAY_CORPUS):
            content = chunk.get("content", "")
            metadata = chunk.get("metadata", {})
            if not content:
                continue

            embedding = await gemini_service.get_embeddings(content)
            doc = Document(content=content, embedding=embedding, metadata_json=metadata)
            db.add(doc)

            # Commit in batches of 20 to avoid very large transactions
            if (i + 1) % 20 == 0:
                await db.commit()
                logger.info("Corpus ingestion progress", ingested=i + 1, total=len(MALAY_CORPUS))

        await db.commit()
        logger.info("RAG corpus ingestion complete", total=len(MALAY_CORPUS))

    except Exception as exc:
        logger.error("ingest_corpus_if_empty failed", error=str(exc))
        await db.rollback()
