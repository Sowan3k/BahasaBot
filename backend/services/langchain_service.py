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
import hashlib
import uuid
from typing import AsyncIterator

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.chatbot import ChatMessage, ChatSession
from backend.models.user import User
from backend.models.progress import GrammarLearned, VocabularyLearned
from backend.services import gemini_service, rag_service
from backend.utils.cache import cache_delete, cache_get, cache_set
from backend.utils.logger import get_logger

logger = get_logger(__name__)

# ── Prompts ────────────────────────────────────────────────────────────────────

CHATBOT_SYSTEM_PROMPT = """\
You are BahasaBot, a friendly and patient Bahasa Melayu (Malay language) tutor \
for international students learning Malay as a second language.

CRITICAL — DIALECT RULE:
- You MUST use Malaysian Bahasa Melayu exclusively — NOT Indonesian Malay, NOT archaic/literary Malay.
- Malaysian vocabulary examples: "kosong" for zero (not "nol"/"sifar"), "awak/kamu" for you (informal), \
"kereta" for car (not "mobil"), "telefon" for phone (not "ponsel"), "bas" for bus (not "bis").
- Use standard Malaysian spelling conventions (Dewan Bahasa dan Pustaka).

Your role:
- Help users learn Bahasa Melayu through natural, educational conversation.
- Answer questions about Malay grammar, vocabulary, pronunciation, culture, and usage.
- Be encouraging, patient, and supportive — especially with beginners.
- Provide clear explanations with practical examples.
- Adapt your language level to the user's apparent proficiency.

LANGUAGE RULE — STRICTLY FOLLOW THIS:
- Detect the language of the student's message.
- If the student writes in ENGLISH → your ENTIRE explanation MUST be in English. Malay words only appear as teaching examples within your English explanation.
- If the student writes in MALAY → your ENTIRE explanation MUST be in Malay.
- NEVER give a full Malay response when the student asked in English. This is a hard rule.

Formatting rules (IMPORTANT — follow these exactly):
- When introducing NEW vocabulary, ALWAYS format it as:
    **[Malay word]** = [English meaning] — /IPA transcription/ (sounds like: [English approximation])
    Example: **selamat pagi** = good morning — /sə.la.mat pa.gi/ (sounds like: suh-lah-mat pah-ghee)
- If you know 1–2 close Malaysian Malay synonyms, add them: "Also: [synonym1], [synonym2]"
- When explaining a grammar rule, state the rule clearly and give at least one Malay example sentence.
- Keep responses concise but complete. Avoid overwhelming beginners.
- Always include at least one Malay example sentence in your response.

Relevant Malay language knowledge (from the learning corpus):
{context}
{native_language_context}{learning_goal_context}{proficiency_context}"""

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
# Reduced from 10 → 6 to keep the prompt smaller and reduce Gemini TTFT
HISTORY_WINDOW = 6

# Redis TTL for conversation history (30 minutes)
HISTORY_CACHE_TTL = 1800

# RAG context cache — avoids re-embedding + re-searching on repeated/similar queries
_RAG_CACHE_TTL = 300  # 5 minutes

# User profile cache — avoids a DB round-trip on every chatbot message
_PROFILE_CACHE_TTL = 300  # 5 minutes

# BPS proficiency descriptions — referenced in every system prompt; defined once at module level
_BPS_DESCRIPTIONS: dict[str, str] = {
    "BPS-1": "Beginner — very limited Malay; focus on basics, simple vocabulary, and common phrases",
    "BPS-2": "Elementary — knows common phrases; can follow simple explanations with clear examples",
    "BPS-3": "Intermediate — conversational; can handle most everyday topics with some complexity",
    "BPS-4": "Advanced — near-fluent; can engage with complex grammar, idioms, and formal Malay",
}


def _rag_cache_key(message: str) -> str:
    """Redis key for cached RAG context — hashed on first 150 chars (case-insensitive)."""
    digest = hashlib.sha256(message[:150].strip().lower().encode()).hexdigest()[:16]
    return f"rag:ctx:{digest}"


def _profile_cache_key(user_id: uuid.UUID) -> str:
    return f"user:profile:{user_id}"


async def get_cached_profile(user_id: uuid.UUID, db: AsyncSession) -> dict:
    """
    Return the user's native_language, learning_goal, and proficiency_level.
    Checks Redis first (5 min TTL); falls back to a DB query on miss.
    Eliminates one DB round-trip per chatbot message on warm path.
    """
    key = _profile_cache_key(user_id)
    cached = await cache_get(key)
    if cached is not None:
        return cached  # type: ignore[return-value]

    result = await db.execute(
        select(
            User.native_language,
            User.learning_goal,
            User.proficiency_level,
        ).where(User.id == user_id)
    )
    row = result.one_or_none()
    profile: dict = {
        "native_language": row.native_language if row else None,
        "learning_goal": row.learning_goal if row else None,
        "proficiency_level": (row.proficiency_level if row else None) or "BPS-1",
    }
    await cache_set(key, profile, ttl=_PROFILE_CACHE_TTL)
    return profile


async def invalidate_profile_cache(user_id: uuid.UUID) -> None:
    """Bust the profile cache after a PATCH /api/profile/ update."""
    await cache_delete(_profile_cache_key(user_id))


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


async def _update_history_cache(
    session_id: str,
    user_message: str,
    assistant_text: str,
) -> None:
    """
    Append the latest exchange to the cached history in-place.
    Eliminates the DB round-trip on the next message in the same session.
    If the cache has already expired, this is a no-op — the next load rebuilds from DB.
    """
    cache_key = _history_cache_key(session_id)
    cached = await cache_get(cache_key)
    if cached is None:
        return  # expired; let next _load_history rebuild from DB

    updated: list[dict] = list(cached)
    updated.append({"role": "user", "content": user_message})
    updated.append({"role": "assistant", "content": assistant_text})
    trimmed = updated[-HISTORY_WINDOW:]
    await cache_set(cache_key, trimmed, ttl=HISTORY_CACHE_TTL)


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
      3. Fetch user's native language from DB for personalised prompt context.
      4. Load conversation history from Redis/DB.
      5. Build the full prompt and stream Gemini response.
      6. Stream the response and collect the full text.
      7. Save assistant message to DB.
      8. Kick off vocab/grammar extraction in the background.
    """
    # 1. Save user message
    user_msg = ChatMessage(
        session_id=session_id,
        role="user",
        content=user_message,
    )
    db.add(user_msg)
    await db.commit()

    # 2. RAG retrieval — get relevant Malay knowledge chunks (Redis-cached 5 min)
    rag_cache_key = _rag_cache_key(user_message)
    context_text: str | None = await cache_get(rag_cache_key)
    if context_text is None:
        rag_docs = await rag_service.similarity_search(user_message, k=5, db=db)
        context_text = (
            "\n\n".join(doc.content for doc in rag_docs)
            if rag_docs
            else "No specific reference material found — use your general Malay knowledge."
        )
        await cache_set(rag_cache_key, context_text, ttl=_RAG_CACHE_TTL)
        logger.info("RAG cache miss — search completed", query_preview=user_message[:40])
    else:
        logger.info("RAG cache hit", query_preview=user_message[:40])

    # 3. Fetch user profile (Redis-cached; avoids DB round-trip on warm path)
    profile = await get_cached_profile(user_id, db)
    native_language: str | None = profile["native_language"]
    learning_goal: str | None = profile["learning_goal"]
    proficiency_level: str = profile["proficiency_level"]

    # Native language context
    if native_language:
        native_language_context = (
            f"\nLEARNER CONTEXT:\n"
            f"The user's native language is {native_language}. "
            f"Where helpful, draw on similarities or differences between "
            f"{native_language} and Malay to aid understanding "
            f"(e.g. shared vocabulary, contrasting grammar patterns)."
        )
    else:
        native_language_context = ""

    # Learning goal context
    if learning_goal:
        learning_goal_context = (
            f"\nThe user is learning Malay for: {learning_goal}. "
            f"Tailor your vocabulary, examples, and level of formality to match this goal."
        )
    else:
        learning_goal_context = ""

    # Proficiency context — explicitly tell Gemini the user's BPS level
    proficiency_context = (
        f"\nThe user's current BPS level: {proficiency_level} — "
        f"{_BPS_DESCRIPTIONS.get(proficiency_level, _BPS_DESCRIPTIONS['BPS-1'])}. "
        f"Calibrate explanation depth and vocabulary complexity to this level."
    )

    # 4. Load conversation history
    history = await _load_history(session_id, db)

    # 5. Build prompt — prepend history as a conversational context block
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

    system_prompt = CHATBOT_SYSTEM_PROMPT.format(
        context=context_text,
        native_language_context=native_language_context,
        learning_goal_context=learning_goal_context,
        proficiency_context=proficiency_context,
    )

    # 6. Stream the response and collect the full text
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

    # 7. Save assistant message to DB
    assistant_msg = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=assistant_text,
    )
    db.add(assistant_msg)
    await db.commit()
    await db.refresh(assistant_msg)

    # Update cached history in-place — avoids DB round-trip on next message
    await _update_history_cache(session_id, user_message, assistant_text)

    # 8. Background task: extract and persist vocab/grammar + log activity
    asyncio.create_task(
        _extract_and_save(
            assistant_text=assistant_text,
            user_id=user_id,
            session_id=uuid.UUID(session_id),
        )
    )

    # 9. Log chatbot activity event (fire-and-forget)
    # Token counts are unavailable in streaming mode — log event only
    from backend.utils.analytics import log_activity  # local import avoids circular dep
    asyncio.create_task(
        log_activity(db, user_id=user_id, feature="chatbot", duration_seconds=0)
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
) -> None:
    """
    Background task — extract vocab/grammar from assistant response
    and persist them to the vocabulary_learned / grammar_learned tables.

    IMPORTANT: Opens its own independent DB session via AsyncSessionLocal.
    Do NOT pass the request-scoped session here — asyncio.create_task() runs
    this concurrently and the request session may be closed by the time this
    executes, causing silent failures.
    """
    from backend.db.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        try:
            extracted = await extract_vocab_and_grammar(assistant_text)

            for item in extracted.get("vocabulary", []):
                word_lower = item["word"].strip().lower()
                existing = await db.execute(
                    select(VocabularyLearned.id).where(
                        VocabularyLearned.user_id == user_id,
                        VocabularyLearned.word.ilike(word_lower),
                    )
                )
                if existing.scalar_one_or_none() is None:
                    db.add(
                        VocabularyLearned(
                            user_id=user_id,
                            word=item["word"].strip(),
                            meaning=item["meaning"],
                            source_type="chatbot",
                            source_id=session_id,
                        )
                    )

            for item in extracted.get("grammar", []):
                grammar = GrammarLearned(
                    user_id=user_id,
                    rule=item["rule"],
                    example=item["example"],
                    source_type="chatbot",
                    source_id=session_id,
                )
                db.add(grammar)

            await db.commit()

            v_count = len(extracted.get("vocabulary", []))
            g_count = len(extracted.get("grammar", []))
            logger.info(
                "Vocab/grammar extracted and saved",
                session_id=str(session_id),
                vocab_count=v_count,
                grammar_count=g_count,
            )

        except Exception as exc:
            logger.error("Background extraction failed", error=str(exc))
            await db.rollback()
