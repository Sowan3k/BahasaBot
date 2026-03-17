"""
Malay Language RAG Corpus

50-100 semantic chunks of Bahasa Melayu knowledge for the vector store.
Each chunk covers: grammar rules, vocabulary groups, or cultural notes.
Metadata: {type: grammar|vocabulary|culture, level: A1|A2|B1|B2, topic: str}

Ingested automatically on first app startup if documents table is empty.
"""
# TODO: Populate with BM knowledge chunks in Phase 3

MALAY_CORPUS: list[dict] = [
    # Format: {"content": "...", "metadata": {"type": "...", "level": "...", "topic": "..."}}
    # Will be populated in Phase 3
]
