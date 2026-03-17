"""
Gemini Service

Single gateway for all Google Gemini API calls.
Handles: text generation, structured JSON output, embeddings, streaming.
Includes: exponential backoff retry (3x), fallback messages on failure.
"""

import asyncio
import json
import os
from typing import AsyncIterator

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

from backend.utils.logger import get_logger

logger = get_logger(__name__)

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "models/embedding-001")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

# Embedding dimension for Google's embedding-001 model
EMBEDDING_DIM = 768

# Message shown to users when Gemini is unavailable
FALLBACK_MESSAGE = (
    "I'm having a little trouble connecting right now. Please try again in a moment."
)


# ── Internal helpers ───────────────────────────────────────────────────────────


def _chat_llm(streaming: bool = False) -> ChatGoogleGenerativeAI:
    """Return a configured ChatGoogleGenerativeAI instance."""
    return ChatGoogleGenerativeAI(
        model=GEMINI_MODEL,
        google_api_key=GOOGLE_API_KEY,
        streaming=streaming,
        temperature=0.7,
    )


def _embeddings_model() -> GoogleGenerativeAIEmbeddings:
    """Return a configured GoogleGenerativeAIEmbeddings instance."""
    return GoogleGenerativeAIEmbeddings(
        model=EMBEDDING_MODEL,
        google_api_key=GOOGLE_API_KEY,
    )


def _build_messages(
    prompt: str, system_prompt: str | None
) -> list[SystemMessage | HumanMessage]:
    """Build the message list from a prompt and optional system prompt."""
    messages: list[SystemMessage | HumanMessage] = []
    if system_prompt:
        messages.append(SystemMessage(content=system_prompt))
    messages.append(HumanMessage(content=prompt))
    return messages


async def _invoke_with_retry(
    messages: list[SystemMessage | HumanMessage],
    max_retries: int = 3,
) -> str:
    """
    Low-level LLM invocation with exponential backoff retry.
    Raises RuntimeError if all attempts fail.
    """
    llm = _chat_llm(streaming=False)
    last_exc: Exception | None = None

    for attempt in range(max_retries):
        try:
            response = await llm.ainvoke(messages)
            return str(response.content)
        except Exception as exc:
            last_exc = exc
            wait = 2**attempt  # 1s, 2s, 4s
            logger.warning(
                "Gemini invocation failed",
                attempt=attempt + 1,
                max_retries=max_retries,
                error=str(exc),
                retry_in_seconds=wait,
            )
            if attempt < max_retries - 1:
                await asyncio.sleep(wait)

    raise RuntimeError(f"Gemini API failed after {max_retries} attempts: {last_exc}")


# ── Public API ─────────────────────────────────────────────────────────────────


async def generate_text(
    prompt: str,
    system_prompt: str | None = None,
    max_retries: int = 3,
) -> str:
    """
    Generate plain text using Gemini.

    Returns FALLBACK_MESSAGE if all retries fail — never raises.
    Use this for user-facing responses where a graceful fallback is acceptable.
    """
    try:
        messages = _build_messages(prompt, system_prompt)
        return await _invoke_with_retry(messages, max_retries)
    except Exception as exc:
        logger.error("generate_text failed after all retries", error=str(exc))
        return FALLBACK_MESSAGE


async def generate_json(
    prompt: str,
    system_prompt: str | None = None,
    max_retries: int = 3,
) -> dict:
    """
    Generate structured JSON output from Gemini.

    Instructs the model to return only valid JSON. Retries parsing up to
    max_retries times. Returns {} if all attempts fail.
    """
    json_system = (
        (system_prompt.strip() + "\n\n" if system_prompt else "")
        + "IMPORTANT: Respond with valid JSON only. No markdown fences, no prose."
    )
    messages = _build_messages(prompt, json_system)

    for attempt in range(max_retries):
        try:
            raw = await _invoke_with_retry(messages, max_retries=1)
            # Strip markdown code fences if the model adds them
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[-1]
                cleaned = cleaned.rsplit("```", 1)[0].strip()
            return json.loads(cleaned)
        except (json.JSONDecodeError, RuntimeError) as exc:
            wait = 2**attempt
            logger.warning(
                "generate_json failed",
                attempt=attempt + 1,
                error=str(exc),
                retry_in_seconds=wait,
            )
            if attempt < max_retries - 1:
                await asyncio.sleep(wait)

    logger.error("generate_json failed after all retries")
    return {}


async def stream_text(
    prompt: str,
    system_prompt: str | None = None,
) -> AsyncIterator[str]:
    """
    Stream text generation from Gemini. Yields string chunks as they arrive.

    Falls back to yielding FALLBACK_MESSAGE as a single chunk on error.
    Use this for the chatbot endpoint where streaming is required.
    """
    llm = _chat_llm(streaming=True)
    messages = _build_messages(prompt, system_prompt)
    try:
        async for chunk in llm.astream(messages):
            if chunk.content:
                yield str(chunk.content)
    except Exception as exc:
        logger.error("stream_text failed", error=str(exc))
        yield FALLBACK_MESSAGE


async def get_embeddings(text: str, max_retries: int = 3) -> list[float]:
    """
    Generate a 768-dimensional embedding vector for the given text.

    Uses Google's embedding-001 model via asyncio.to_thread (the SDK is sync).
    Returns a zero vector of length EMBEDDING_DIM on failure.
    """
    model = _embeddings_model()

    for attempt in range(max_retries):
        try:
            # GoogleGenerativeAIEmbeddings.embed_query is synchronous
            vector: list[float] = await asyncio.to_thread(model.embed_query, text)
            return vector
        except Exception as exc:
            wait = 2**attempt
            logger.warning(
                "get_embeddings failed",
                attempt=attempt + 1,
                error=str(exc),
                retry_in_seconds=wait,
            )
            if attempt < max_retries - 1:
                await asyncio.sleep(wait)

    logger.error("get_embeddings failed after all retries — returning zero vector")
    return [0.0] * EMBEDDING_DIM
