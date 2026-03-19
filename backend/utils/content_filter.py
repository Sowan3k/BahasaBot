"""
Content Filter

Server-side validation for course topic inputs.
Two-pass approach:
  1. Regex blocklist for obvious inappropriate content
  2. Gemini moderation call for edge cases
Results cached in Redis by SHA-256 hash of the topic (TTL: 24h).
"""

import hashlib
import json
import re

from backend.services.gemini_service import generate_json
from backend.utils.cache import cache_get, cache_set
from backend.utils.logger import get_logger

logger = get_logger(__name__)

# ── Pass 1: Regex blocklist ────────────────────────────────────────────────────

# Patterns that immediately reject a topic — no Gemini call needed.
_BLOCKLIST = re.compile(
    r"\b("
    r"porn|pornograph|sex(ual|ually)?|nude|naked|erotic|xxx|onlyfans"
    r"|kill|murder|assassin|shoot|stab|bomb|explos|weapon|gun|knife|terror|jihadist"
    r"|drug|cocaine|heroin|meth(?:amphetamine)?|fentanyl|weed|marijuana|cannabis|narcot"
    r"|hack|exploit|phish|malware|ransomware|ddos|sql.?inject"
    r"|racist|racism|white.?supremac|nazi|neo.?nazi|kkk|hate.?speech"
    r"|suicide|self.?harm|cut.?yourself"
    r")\b",
    re.IGNORECASE,
)


# ── Main public function ───────────────────────────────────────────────────────


async def is_topic_appropriate(topic: str) -> tuple[bool, str]:
    """
    Check whether a course topic is appropriate for the platform.

    Returns:
        (True, "")         — topic is fine, proceed with generation
        (False, "<reason>") — topic rejected, reason is shown to the user

    Results are cached in Redis keyed by SHA-256(topic.lower()) for 24 hours.
    """
    normalized = topic.strip().lower()

    # ── Cache check ────────────────────────────────────────────────────────────
    cache_key = f"content_filter:{hashlib.sha256(normalized.encode()).hexdigest()}"
    cached = await cache_get(cache_key)
    if cached is not None:
        logger.debug("Content filter cache hit", key=cache_key)
        return cached["is_appropriate"], cached["reason"]

    # ── Pass 1: Regex blocklist ────────────────────────────────────────────────
    if _BLOCKLIST.search(normalized):
        result = (False, "Topic contains inappropriate or harmful content.")
        await cache_set(
            cache_key, {"is_appropriate": False, "reason": result[1]}, ttl=86400
        )
        logger.info("Content filter blocked (regex)", topic=topic[:80])
        return result

    # ── Pass 2: Gemini moderation ──────────────────────────────────────────────
    prompt = f"""You are a content moderator for a Bahasa Melayu (Malay) language learning platform.
Students use this platform to generate personalised courses on topics they want to learn to discuss in Malay.

Evaluate whether the following topic is appropriate for an educational language learning platform:

Topic: "{topic}"

A topic is APPROPRIATE if it is:
- Educational, cultural, practical, or conversational (e.g. "ordering food", "family vocabulary", "job interviews", "Malaysian festivals")
- Something a language learner genuinely wants to communicate about
- Neutral — even if the topic sounds unusual, if it is safe and learnable it is fine

A topic is INAPPROPRIATE if it:
- Promotes violence, crime, hate speech, or discrimination
- Is sexual or explicitly adult
- Involves illegal activities (drug use, hacking, fraud, weapons)
- Is clearly offensive, abusive, or harmful

Respond with ONLY valid JSON — no prose, no markdown fences:
{{"is_appropriate": true, "reason": "brief reason (1 sentence)"}}"""

    result_json = await generate_json(prompt)

    is_appropriate: bool = result_json.get("is_appropriate", True)
    reason: str = result_json.get("reason", "")

    # If Gemini returns empty dict (failure), default to allowing the topic
    # to avoid false-positive rejections.
    if not result_json:
        logger.warning("Gemini moderation returned empty response — defaulting to allow", topic=topic[:80])
        is_appropriate = True
        reason = ""

    await cache_set(
        cache_key,
        {"is_appropriate": is_appropriate, "reason": reason},
        ttl=86400,
    )

    if not is_appropriate:
        logger.info("Content filter blocked (Gemini)", topic=topic[:80], reason=reason)
    else:
        logger.debug("Content filter passed", topic=topic[:80])

    return is_appropriate, reason
