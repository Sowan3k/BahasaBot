"""
Gemini Service

Single gateway for all Google Gemini API calls.
Handles: text generation, structured JSON output, embeddings, streaming.
Includes: exponential backoff retry (3x), fallback messages on failure.
"""

import asyncio
import json
import os
import re
from typing import AsyncIterator

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

from backend.utils.logger import get_logger

logger = get_logger(__name__)

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")       # course/quiz generation
CHATBOT_MODEL = os.getenv("CHATBOT_GEMINI_MODEL", "gemini-2.5-flash")  # chatbot streaming model
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "models/gemini-embedding-001")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

# Embedding dimension for Google's embedding-001 model
EMBEDDING_DIM = 768

# Message shown to users when Gemini is unavailable
FALLBACK_MESSAGE = (
    "I'm having a little trouble connecting right now. Please try again in a moment."
)


# ── Internal helpers ───────────────────────────────────────────────────────────


def _chat_llm() -> ChatGoogleGenerativeAI:
    """Return a ChatGoogleGenerativeAI instance for text generation (courses, quizzes)."""
    return ChatGoogleGenerativeAI(
        model=GEMINI_MODEL,
        google_api_key=GOOGLE_API_KEY,
        temperature=0.7,
    )


def _chatbot_llm() -> ChatGoogleGenerativeAI:
    """Return a ChatGoogleGenerativeAI instance for the chatbot (streaming)."""
    return ChatGoogleGenerativeAI(
        model=CHATBOT_MODEL,
        google_api_key=GOOGLE_API_KEY,
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


def _parse_retry_delay(exc: Exception) -> float:
    """
    Extract the suggested retry delay (in seconds) from a Gemini 429 error message.
    Returns the parsed delay, or None if not found.
    """
    match = re.search(r"retry in (\d+\.?\d*)s", str(exc), re.IGNORECASE)
    if match:
        return float(match.group(1))
    return None


async def _invoke_with_retry(
    messages: list[SystemMessage | HumanMessage],
    max_retries: int = 3,
) -> tuple[str, int, int]:
    """
    Low-level LLM invocation with exponential backoff retry.
    Handles 429 ResourceExhausted by waiting the API-suggested delay.
    Raises RuntimeError if all attempts fail.

    Returns (text, input_tokens, output_tokens).
    Token counts come from response.usage_metadata when available; fall back to 0.
    """
    llm = _chat_llm()
    last_exc: Exception | None = None

    for attempt in range(max_retries):
        try:
            response = await llm.ainvoke(messages)
            content = response.content
            # Newer Gemini models may return content as a list of typed blocks
            if isinstance(content, list):
                text_parts = []
                for block in content:
                    if isinstance(block, dict) and block.get("type") == "text":
                        text_parts.append(block.get("text", ""))
                    elif isinstance(block, str):
                        text_parts.append(block)
                text = "".join(text_parts)
            else:
                text = str(content)

            # Extract token counts from usage_metadata if present
            meta = getattr(response, "usage_metadata", None) or {}
            input_tokens = getattr(meta, "input_tokens", None) or meta.get("input_tokens", 0) or 0
            output_tokens = getattr(meta, "output_tokens", None) or meta.get("output_tokens", 0) or 0
            return text, int(input_tokens), int(output_tokens)
        except Exception as exc:
            last_exc = exc
            # For 429 rate-limit errors, use the API-suggested retry delay
            retry_delay = _parse_retry_delay(exc)
            if retry_delay is not None:
                wait = retry_delay + 2  # add 2s buffer
                logger.warning(
                    "Gemini rate limit hit (429) — waiting for API-suggested delay",
                    attempt=attempt + 1,
                    max_retries=max_retries,
                    retry_in_seconds=wait,
                )
            else:
                wait = 2**attempt  # 1s, 2s, 4s
                logger.warning(
                    "Gemini invocation failed",
                    attempt=attempt + 1,
                    max_retries=max_retries,
                    error=str(exc)[:200],
                    error_type=type(exc).__name__,
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
        text, _, _ = await _invoke_with_retry(messages, max_retries)
        return text
    except Exception as exc:
        logger.error("generate_text failed after all retries", error=str(exc))
        return FALLBACK_MESSAGE


async def generate_text_with_usage(
    prompt: str,
    system_prompt: str | None = None,
    max_retries: int = 3,
) -> tuple[str, int, int]:
    """
    Like generate_text but also returns (input_tokens, output_tokens).

    Returns (FALLBACK_MESSAGE, 0, 0) if all retries fail.
    Used by callers that need to log token consumption.
    """
    try:
        messages = _build_messages(prompt, system_prompt)
        return await _invoke_with_retry(messages, max_retries)
    except Exception as exc:
        logger.error("generate_text_with_usage failed after all retries", error=str(exc))
        return FALLBACK_MESSAGE, 0, 0


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
            raw, _, _ = await _invoke_with_retry(messages, max_retries=1)
            # Strip markdown code fences if the model adds them
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[-1]
                cleaned = cleaned.rsplit("```", 1)[0].strip()
            return json.loads(cleaned)
        except (json.JSONDecodeError, RuntimeError) as exc:
            # If this looks like a 429, use the API-suggested delay instead of exponential backoff
            retry_delay = _parse_retry_delay(exc)
            wait = (retry_delay + 2) if retry_delay is not None else 2**attempt
            logger.warning(
                "generate_json failed",
                attempt=attempt + 1,
                error=str(exc)[:200],
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
    Stream text generation from Gemini using the chatbot model. Yields string chunks as they arrive.

    Uses _chatbot_llm() (CHATBOT_GEMINI_MODEL env var) — separate from course/quiz generation.
    Passes system_prompt via system_instruction at model-init time (the correct Gemini approach).
    Handles both plain-string and list-of-blocks content formats from newer Gemini models.
    Falls back to yielding FALLBACK_MESSAGE as a single chunk on error.
    """
    llm = ChatGoogleGenerativeAI(
        model=CHATBOT_MODEL,
        google_api_key=GOOGLE_API_KEY,
        temperature=0.7,
    )
    messages = (
        [SystemMessage(content=system_prompt), HumanMessage(content=prompt)]
        if system_prompt
        else [HumanMessage(content=prompt)]
    )
    try:
        async for chunk in llm.astream(messages):
            content = chunk.content
            # Newer Gemini models may return content as a list of typed blocks
            if isinstance(content, list):
                for block in content:
                    if isinstance(block, dict) and block.get("type") == "text":
                        text = block.get("text", "")
                        if text:
                            yield text
                    elif isinstance(block, str) and block:
                        yield block
            elif isinstance(content, str) and content:
                yield content
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
            # GoogleGenerativeAIEmbeddings.embed_query is synchronous.
            # output_dimensionality=EMBEDDING_DIM truncates to 768 to match the DB column (vector(768)).
            vector: list[float] = await asyncio.to_thread(
                model.embed_query, text, output_dimensionality=EMBEDDING_DIM
            )
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
