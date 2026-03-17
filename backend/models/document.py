"""
Document ORM Model

Table:
  documents — RAG vector store. Each row is a chunk of Malay language corpus
              with a 768-dimensional pgvector embedding for similarity search.
"""

import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, Index, Text, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.db.database import Base

# Embedding dimension for Google's embedding-001 model
EMBEDDING_DIM = 768


class Document(Base):
    """A chunk of Malay language knowledge stored for RAG retrieval."""

    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid()
    )
    # Raw text content of this knowledge chunk
    content: Mapped[str] = mapped_column(Text, nullable=False)
    # 768-dim vector embedding (Google embedding-001)
    embedding: Mapped[list] = mapped_column(Vector(EMBEDDING_DIM), nullable=True)
    # Arbitrary metadata: {source, category, language_level, etc.}
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # IVFFlat index for fast approximate nearest-neighbour search
    __table_args__ = (
        Index(
            "idx_documents_embedding",
            "embedding",
            postgresql_using="ivfflat",
            postgresql_with={"lists": 100},
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )

    def __repr__(self) -> str:
        return f"<Document id={self.id} content={self.content[:60]!r}>"
