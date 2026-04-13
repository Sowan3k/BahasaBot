"""
Image Generation Service — Phase 22 (Nano Banana 2)

Generates personalized visual assets using gemini-3.1-flash-image-preview
via the Gemini REST API (v1beta).  Uses httpx for direct async HTTP calls
instead of the google-generativeai SDK — the SDK (v0.7.x) does NOT support
response_modalities in GenerationConfig, which caused a silent TypeError
that meant zero image API calls were ever made.

Returns base64 data URLs (data:image/png;base64,...) for storage in TEXT DB
columns.

Rule: NEVER regenerate if a URL already exists in the DB.
      Always check the caller before invoking these functions.

Three entry points:
  generate_journey_banner(goal_type, deadline_months) → banner for learning roadmap
  generate_course_cover(course_title, topic)          → cover image for a new course
  generate_milestone_card(bps_level, user_name)       → celebratory BPS level-up card
"""

import os

import httpx

from backend.utils.logger import get_logger

logger = get_logger(__name__)

GEMINI_IMAGE_MODEL = os.getenv("GEMINI_IMAGE_MODEL", "gemini-3.1-flash-image-preview")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

_GEMINI_REST_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


# ── Core generator ─────────────────────────────────────────────────────────────


async def generate_image(prompt: str) -> str | None:
    """
    Async call to the Gemini image generation REST API.

    Returns a base64 data URL string (data:image/png;base64,...), or None on
    failure.  Uses httpx directly to avoid google-generativeai SDK v0.7.x which
    does not support response_modalities in GenerationConfig.
    """
    if not GOOGLE_API_KEY:
        logger.error("[IMAGE] GOOGLE_API_KEY is not set — cannot generate images")
        return None

    url = f"{_GEMINI_REST_BASE}/{GEMINI_IMAGE_MODEL}:generateContent?key={GOOGLE_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
        },
    }

    logger.info(f"[IMAGE] Sending request to Gemini REST API (model={GEMINI_IMAGE_MODEL})")

    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(url, json=payload)

        if response.status_code != 200:
            logger.error(
                f"[IMAGE] Gemini REST API returned HTTP {response.status_code}: "
                f"{response.text[:400]}"
            )
            return None

        data = response.json()

        for candidate in data.get("candidates", []):
            for part in candidate.get("content", {}).get("parts", []):
                if "inlineData" in part:
                    mime = part["inlineData"].get("mimeType", "image/png")
                    b64 = part["inlineData"]["data"]
                    logger.info(
                        f"[IMAGE] Image received from Gemini "
                        f"(mime={mime}, b64_len={len(b64)})"
                    )
                    return f"data:{mime};base64,{b64}"

        logger.warning(
            "[IMAGE] Gemini response contained no inlineData parts — "
            f"top-level keys: {list(data.keys())}",
        )
        return None

    except httpx.TimeoutException:
        logger.error("[IMAGE] Gemini REST API request timed out after 90 s")
        return None
    except Exception as exc:
        logger.error(f"[IMAGE] Image generation FAILED: {exc}", exc_info=True)
        return None


# ── Specialised generators ─────────────────────────────────────────────────────


async def generate_journey_banner(goal_type: str, deadline_months: int) -> str | None:
    """
    Generate a wide banner image for the user's learning roadmap hero area.
    Called once when a new roadmap is created; stored in user_roadmaps.banner_image_url.
    """
    goal_descriptions = {
        "survival": "basic survival communication and everyday transactions",
        "conversational": "everyday conversational fluency with locals",
        "academic": "academic writing and formal professional proficiency",
    }
    goal_text = goal_descriptions.get(goal_type, goal_type)
    prompt = (
        f"Create a vibrant, motivational wide landscape banner illustration for a Bahasa Melayu "
        f"(Malaysian Malay) language learning journey. The student's goal is '{goal_text}' "
        f"within {deadline_months} months. "
        f"Style: warm tropical colours (deep oranges, forest greens, golden yellows), "
        f"Malaysian cultural motifs (batik patterns, hibiscus flowers, tropical foliage, "
        f"traditional architecture silhouettes), inspirational and energetic atmosphere. "
        f"No text overlay. Wide landscape format (16:9). High-quality digital illustration."
    )
    logger.info(
        f"[IMAGE] generate_journey_banner called "
        f"(goal_type={goal_type}, deadline_months={deadline_months})"
    )
    url = await generate_image(prompt)
    if url:
        logger.info(f"[IMAGE] Journey banner generated successfully (goal_type={goal_type})")
    else:
        logger.warning(f"[IMAGE] Journey banner generation returned None (goal_type={goal_type})")
    return url


async def generate_course_cover(course_title: str, topic: str) -> str | None:
    """
    Generate a square cover illustration for a newly created course.
    Called once after course skeleton is saved; stored in courses.cover_image_url.
    """
    prompt = (
        f"Create a clean, modern cover illustration for a Bahasa Melayu language learning course "
        f"titled '{course_title}' about the topic '{topic}'. "
        f"Style: minimalist, warm Malaysian-inspired colour palette (terracotta, sage green, cream), "
        f"subtle batik or songket textile pattern as background texture, "
        f"professional e-learning aesthetic. No text. Square format. "
        f"Suitable as a course card thumbnail."
    )
    logger.info(f"[IMAGE] generate_course_cover called (title={course_title!r}, topic={topic!r})")
    url = await generate_image(prompt)
    if url:
        logger.info(f"[IMAGE] Course cover generated successfully (title={course_title!r})")
    else:
        logger.warning(f"[IMAGE] Course cover generation returned None (title={course_title!r})")
    return url


async def generate_milestone_card(bps_level: str, user_name: str) -> str | None:
    """
    Generate a celebratory achievement card for reaching a new BPS proficiency level.
    Called when a user advances BPS level after a standalone quiz.
    Stored as image_url in the bps_milestone notification.
    """
    level_labels = {
        "BPS-1": "Beginner",
        "BPS-2": "Elementary",
        "BPS-3": "Intermediate",
        "BPS-4": "Advanced",
    }
    level_name = level_labels.get(bps_level, bps_level)
    prompt = (
        f"Create a vibrant celebratory achievement card for a language learner who has just "
        f"reached {bps_level} ({level_name}) proficiency in Bahasa Melayu. "
        f"Style: festive Malaysian design with trophy or star elements, confetti, "
        f"hibiscus flowers, golden accents, joyful and congratulatory mood. "
        f"Warm tropical colours. No text. Square format. "
        f"High-quality illustration, suitable as a badge or achievement card."
    )
    logger.info(f"[IMAGE] generate_milestone_card called (bps_level={bps_level}, user={user_name})")
    url = await generate_image(prompt)
    if url:
        logger.info(f"[IMAGE] Milestone card generated successfully (bps_level={bps_level})")
    else:
        logger.warning(f"[IMAGE] Milestone card generation returned None (bps_level={bps_level})")
    return url
