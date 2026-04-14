#!/usr/bin/env python3
"""
BahasaBot — Production RAG Corpus Seeder

Seeds the Malay language corpus into the Neon PostgreSQL database with
pgvector embeddings. Run this ONCE after the first production deployment.

The script is fully idempotent — it checks existing document count before
ingesting anything, so it is safe to run multiple times.

Usage (from project root: bahasabot/):
    # With environment variables already set in the shell:
    python backend/seed_production.py

    # Or with explicit env vars:
    DATABASE_URL=postgresql+asyncpg://... GOOGLE_API_KEY=... python backend/seed_production.py

    # Or in Docker (one-off Railway run):
    railway run python backend/seed_production.py

Prerequisites:
    - DATABASE_URL must use asyncpg driver:
        postgresql+asyncpg://user:pass@host/dbname?ssl=require
    - GOOGLE_API_KEY must be set (used for Gemini text-embedding-001)
    - The 'documents' table and pgvector extension must already exist
      (Alembic migrations must have been applied first)
"""

import asyncio
import os
import sys
from pathlib import Path

# ── Ensure project root is on sys.path so 'from backend.X import Y' resolves ──
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from dotenv import load_dotenv

# Load backend/.env for local runs; no-op if env vars are already set
load_dotenv(Path(__file__).parent / ".env")

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.data.malay_corpus import MALAY_CORPUS
from backend.models.document import Document
from backend.services import gemini_service
from backend.utils.logger import get_logger, setup_logging

setup_logging()
logger = get_logger(__name__)


async def seed_corpus() -> None:
    """
    Seed the Malay RAG corpus into pgvector.

    Steps:
      1. Validate environment variables.
      2. Connect to the production database.
      3. Ensure the pgvector extension is enabled.
      4. Check existing document count — exit early if already seeded.
      5. Embed each corpus chunk via Gemini and insert into documents table.
      6. Commit in batches of 20 to avoid large transactions.
    """

    # ── Validate env vars ──────────────────────────────────────────────────────
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL is not set.")
        print("       Set it in backend/.env or export it in your shell.")
        sys.exit(1)

    google_api_key = os.getenv("GOOGLE_API_KEY")
    if not google_api_key:
        print("ERROR: GOOGLE_API_KEY is not set.")
        print("       Gemini embeddings require a valid API key.")
        sys.exit(1)

    print(f"Connecting to: {database_url[:50]}...")
    logger.info("seed_corpus starting", url_preview=database_url[:50])

    # ── Connect ────────────────────────────────────────────────────────────────
    engine = create_async_engine(database_url, echo=False, pool_pre_ping=True)
    SessionLocal = async_sessionmaker(
        bind=engine, class_=AsyncSession, expire_on_commit=False
    )

    async with SessionLocal() as db:

        # ── Ensure pgvector extension ──────────────────────────────────────────
        try:
            await db.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            await db.commit()
            logger.info("pgvector extension ensured")
        except Exception as exc:
            logger.warning("pgvector extension check failed (may already exist)", error=str(exc))
            await db.rollback()

        # ── Check existing count ───────────────────────────────────────────────
        result = await db.execute(select(func.count()).select_from(Document))
        existing = result.scalar_one()

        if existing > 0:
            print(f"\n✓ Corpus already seeded ({existing} documents found). Nothing to do.")
            logger.info("Corpus already seeded — skipping", existing_documents=existing)
            await engine.dispose()
            return

        # ── Ingest ────────────────────────────────────────────────────────────
        total = len(MALAY_CORPUS)
        print(f"\nSeeding {total} corpus chunks into pgvector...")
        print("This will make one Gemini embedding API call per chunk (~60 calls total).\n")
        logger.info("Starting corpus ingestion", total_chunks=total)

        ingested = 0
        failed = 0

        for i, chunk in enumerate(MALAY_CORPUS):
            content = chunk.get("content", "").strip()
            metadata = chunk.get("metadata", {})

            if not content:
                logger.warning("Empty chunk skipped", index=i)
                continue

            try:
                embedding = await gemini_service.get_embeddings(content)
                doc = Document(
                    content=content,
                    embedding=embedding,
                    metadata_json=metadata,
                )
                db.add(doc)
                ingested += 1

                # Commit every 20 docs to avoid holding a huge transaction
                if ingested % 20 == 0:
                    await db.commit()
                    pct = round(ingested / total * 100)
                    print(f"  [{pct:3d}%] {ingested}/{total} chunks ingested...")
                    logger.info("Ingestion progress", ingested=ingested, total=total)

            except Exception as exc:
                failed += 1
                logger.error(
                    "Failed to embed/store chunk",
                    index=i,
                    error=str(exc),
                    preview=content[:60],
                )
                print(f"  ✗ Chunk {i} failed: {exc}")
                # Continue with remaining chunks rather than aborting

        # Final commit for any remaining docs
        await db.commit()

    await engine.dispose()

    # ── Summary ────────────────────────────────────────────────────────────────
    print(f"\n{'=' * 50}")
    print(f"  Corpus seeding complete")
    print(f"  Ingested : {ingested} documents")
    print(f"  Failed   : {failed} chunks")
    print(f"{'=' * 50}")

    if failed > 0:
        print(f"\nWARNING: {failed} chunks failed. Re-run the script to retry.")
        print("         Existing documents will be skipped automatically.")
        logger.warning("Some chunks failed", failed=failed, ingested=ingested)
    else:
        print("\n✓ All chunks seeded successfully. The chatbot RAG pipeline is ready.")
        logger.info("Corpus seeding complete", ingested=ingested, failed=0)


if __name__ == "__main__":
    asyncio.run(seed_corpus())
