"""
LangChain Service

Builds the chatbot response pipeline using LangChain + Google Gemini.

  stream_chat_response(session_id, user_message, user_id, db)
      — Async generator that yields text chunks for SSE streaming.
      — Runs RAG retrieval and loads conversation history before calling Gemini.
      — Saves the full assistant message to DB after streaming completes.
      — Fires background extraction of vocab/grammar from the response.

  extract_vocab_and_grammar(text)
      — Returns {"vocabulary": [...], "grammar": [...]} parsed from an AI response.
"""

import asyncio
import uuid
from typing import AsyncIterator

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.chatbot import ChatMessage, ChatSession
from backend.models.progress import GrammarLearned, VocabularyLearned
from backend.services import gemini_service, rag_service
from backend.utils.cache import cache_delete, cache_get, cache_set
from backend.utils.logger import get_logger

logger = get_logger(__name__)

# ── Prompts ────────────────────────────────────────────────────────────────────

CHATBOT_SYSTEM_PROMPT = """\
You are BahasaBot, a friendly and patient Bahasa Melayu (Malay language) tutor \
for international students learning Malay as a second language.

Your role:
- Help users learn Bahasa Melayu through natural, educational conversation.
- Answer questions about Malay grammar, vocabulary, pronunciation, culture, and usage.
- Be encouraging, patient, and supportive — especially with beginners.
- Provide clear explanations with practical examples.
- Adapt your language level to the user's apparent proficiency.

Formatting rules (IMPORTANT — follow these exactly):
- When introducing NEW vocabulary, always format it as: **[Malay word]** = [English meaning]
  Example: **selamat pagi** = good morning
- When explaining a grammar rule, state the rule clearly and give at least one Malay example sentence.
- Keep responses concise but complete. Avoid overwhelming beginners.
- Always include at least one Malay example sentence in your response.
- If the user writes in English, respond mostly in English with Malay examples.
- If the user writes in Malay, respond mostly in Malay.

Relevant Malay language knowledge (from the learning corpus):
{context}
"""

EXTRACTION_PROMPT = """\
Analyse the following Bahasa Melayu tutoring response and extract:
1. New vocabulary items (Malay word + English meaning)
2. Grammar rules explained (rule description + a Malay example sentence)

Response to analyse:
---
{text}
---

Return ONLY a valid JSON object with this exact structure (empty arrays if nothing found):
{{
  "vocabulary": [
    {{"word": "Malay word", "meaning": "English meaning"}}
  ],
  "grammar": [
    {{"rule": "Grammar rule description", "example": "Example sentence in Malay"}}
  ]
}}
"""

# History kept in memory per session (last N turns)
HISTORY_WINDOW = 10

# Redis TTL for conversation history (30 minutes)
HISTORY_CACHE_TTL = 1800


# ── History helpers ────────────────────────────────────────────────────────────


def _history_cache_key(session_id: str) -> str:
    return f"chat:history:{session_id}"


async def _load_history(session_id: str, db: AsyncSession) -> list[dict]:
    """
    Load the last HISTORY_WINDOW messages for a session.
    Checks Redis first; falls back to PostgreSQL.
    """
    cache_key = _history_cache_key(session_id)
    cached = await cache_get(cache_key)
    if cached is not None:
        return cached  # type: ignore[return-value]

    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(HISTORY_WINDOW)
    )
    messages = list(reversed(result.scalars().all()))  # chronological order

    history = [{"role": m.role, "content": m.content} for m in messages]
    await cache_set(cache_key, history, ttl=HISTORY_CACHE_TTL)
    return history


async def _invalidate_history_cache(session_id: str) -> None:
    """Bust the cached history so the next load re-reads from DB."""
    await cache_delete(_history_cache_key(str(session_id)))


# ── Session helpers ────────────────────────────────────────────────────────────


async def get_or_create_session(
    user_id: uuid.UUID,
    session_id: str | None,
    db: AsyncSession,
) -> ChatSession:
    """
    Return an existing ChatSession by ID, or create a new one for the user.
    Raises ValueError if session_id is provided but does not belong to the user.
    """
    if session_id:
        result = await db.execute(
            select(ChatSession).where(
                ChatSession.id == session_id,
                ChatSession.user_id == user_id,
            )
        )
        session = result.scalar_one_or_none()
        if session is None:
            raise ValueError(f"Session {session_id} not found for this user")
        return session

    session = ChatSession(user_id=user_id)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    logger.info("New chat session created", session_id=str(session.id), user_id=str(user_id))
    return session


# ── Core streaming function ────────────────────────────────────────────────────


async def stream_chat_response(
    session_id: str,
    user_message: str,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> AsyncIterator[str]:
    """
    Async generator — yields text chunks suitable for SSE.

    Flow:
      1. Save user message to DB.
      2. Retrieve RAG context (top-5 relevant corpus chunks).
      3. Load conversation history from Redis/DB.
      4. Build the full prompt and stream Gemini response.
      5. After streaming, save assistant message to DB.
      6. Kick off vocab/grammar extraction in the background.
    """
    # 1. Save user message
    user_msg = ChatMessage(
        session_id=session_id,
        role="user",
        content=user_message,
    )
    db.add(user_msg)
    await db.commit()

    # 2. RAG retrieval — get relevant Malay knowledge chunks
    rag_docs = await rag_service.similarity_search(user_message, k=5, db=db)
    context_text = (
        "\n\n".join(doc.content for doc in rag_docs)
        if rag_docs
        else "No specific reference material found — use your general Malay knowledge."
    )

    # 3. Load conversation history
    history = await _load_history(session_id, db)

    # 4. Build prompt — prepend history as a conversational context block
    history_text = ""
    if history:
        lines = []
        for msg in history:
            prefix = "Student" if msg["role"] == "user" else "BahasaBot"
            lines.append(f"{prefix}: {msg['content']}")
        history_text = "\n".join(lines)

    if history_text:
        full_prompt = (
            f"Previous conversation:\n{history_text}\n\n"
            f"Student: {user_message}"
        )
    else:
        full_prompt = f"Student: {user_message}"

    system_prompt = CHATBOT_SYSTEM_PROMPT.format(context=context_text)

    # 5. Stream the response and collect the full text
    full_response: list[str] = []
    try:
        async for chunk in gemini_service.stream_text(full_prompt, system_prompt):
            full_response.append(chunk)
            yield chunk
    except Exception as exc:
        logger.error("Streaming error", error=str(exc))
        fallback = gemini_service.FALLBACK_MESSAGE
        yield fallback
        full_response = [fallback]

    assistant_text = "".join(full_response)

    # 6. Save assistant message to DB
    assistant_msg = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=assistant_text,
    )
    db.add(assistant_msg)
    await db.commit()
    await db.refresh(assistant_msg)

    # Invalidate the cached history so the next load includes these two new messages
    await _invalidate_history_cache(session_id)

    # 7. Background task: extract and persist vocab/grammar
    asyncio.create_task(
        _extract_and_save(
            assistant_text=assistant_text,
            user_id=user_id,
            session_id=uuid.UUID(session_id),
            db_factory=db,  # type: ignore[arg-type]
        )
    )


# ── Extraction ─────────────────────────────────────────────────────────────────


async def extract_vocab_and_grammar(text: str) -> dict:
    """
    Parse an assistant response and return extracted vocabulary and grammar.

    Returns: {"vocabulary": [{"word": str, "meaning": str}],
              "grammar":    [{"rule": str, "example": str}]}
    """
    prompt = EXTRACTION_PROMPT.format(text=text)
    result = await gemini_service.generate_json(prompt)

    vocab = result.get("vocabulary", [])
    grammar = result.get("grammar", [])

    # Validate shape — drop malformed entries
    clean_vocab = [
        v for v in vocab
        if isinstance(v, dict) and v.get("word") and v.get("meaning")
    ]
    clean_grammar = [
        g for g in grammar
        if isinstance(g, dict) and g.get("rule") and g.get("example")
    ]

    return {"vocabulary": clean_vocab, "grammar": clean_grammar}


async def _extract_and_save(
    assistant_text: str,
    user_id: uuid.UUID,
    session_id: uuid.UUID,
    db_factory: AsyncSession,
) -> None:
    """
    Background task — extract vocab/grammar from assistant response
    and persist them to the vocabulary_learned / grammar_learned tables.

    Uses the passed db session directly (background tasks in FastAPI share the
    same request-scoped session — this is safe as long as the task finishes
    before the session is closed, which is acceptable for short extractions).
    """
    try:
        extracted = await extract_vocab_and_grammar(assistant_text)

        for item in extracted.get("vocabulary", []):
            vocab = VocabularyLearned(
                user_id=user_id,
                word=item["word"],
                meaning=item["meaning"],
                source_type="chatbot",
                source_id=session_id,
            )
            db_factory.add(vocab)

        for item in extracted.get("grammar", []):
            grammar = GrammarLearned(
                user_id=user_id,
                rule=item["rule"],
                example=item["example"],
                source_type="chatbot",
                source_id=session_id,
            )
            db_factory.add(grammar)

        await db_factory.commit()

        v_count = len(extracted.get("vocabulary", []))
        g_count = len(extracted.get("grammar", []))
        logger.info(
            "Vocab/grammar extracted",
            session_id=str(session_id),
            vocab_count=v_count,
            grammar_count=g_count,
        )

    except Exception as exc:
        logger.error("Background extraction failed", error=str(exc))
        await db_factory.rollback()
