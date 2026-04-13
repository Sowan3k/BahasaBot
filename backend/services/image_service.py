"""
Image Generation Service — Phase 22 (Nano Banana 2)

Generates personalized visual assets using gemini-3.1-flash-image-preview
(verified 2026-04-13 against Google AI docs — this is the current image gen model).
Returns base64 data URLs (data:image/png;base64,...) for storage in TEXT DB columns.

Rule: NEVER regenerate if a URL already exists in the DB.
      Always check the caller before invoking these functions.

Three entry points:
  generate_journey_banner(goal_type, deadline_months) → banner for learning roadmap
  generate_course_cover(course_title, topic)          → cover image for a new course
  generate_milestone_card(bps_level, user_name)       → celebratory BPS level-up card
"""

import asyncio
import base64
import os
from concurrent.futures import ThreadPoolExecutor

import google.generativeai as genai

from backend.utils.logger import get_logger

logger = get_logger(__name__)

GEMINI_IMAGE_MODEL = os.getenv("GEMINI_IMAGE_MODEL", "gemini-3.1-flash-image-preview")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

# Configure SDK once at module load — avoids repeated configure() calls in the executor
genai.configure(api_key=GOOGLE_API_KEY)

# Thread pool for blocking Gemini SDK calls — keeps the async event loop free
_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="image_gen")


# ── Core generator ─────────────────────────────────────────────────────────────


def _generate_sync(prompt: str) -> str | None:
    """
    Blocking call to the Gemini image model.
    Run via executor so it does not block the event loop.

    Returns a base64 data URL string, or None on failure.
    """
    try:
        model = genai.GenerativeModel(model_name=GEMINI_IMAGE_MODEL)
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_modalities=["IMAGE"],
            ),
        )
        for part in response.candidates[0].content.parts:
            if hasattr(part, "inline_data") and part.inline_data is not None:
                mime = part.inline_data.mime_type or "image/png"
                b64 = base64.b64encode(part.inline_data.data).decode("utf-8")
                return f"data:{mime};base64,{b64}"
        logger.warning(
            "Gemini image response contained no inline_data parts",
            model=GEMINI_IMAGE_MODEL,
        )
        return None
    except Exception as exc:
        logger.error(
            "Gemini image generation failed",
            model=GEMINI_IMAGE_MODEL,
            error=str(exc),
        )
        return None


async def generate_image(prompt: str) -> str | None:
    """Async wrapper — runs the blocking Gemini SDK call in a thread pool."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(_executor, _generate_sync, prompt)


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
    logger.info("Generating journey banner", goal_type=goal_type, deadline_months=deadline_months)
    url = await generate_image(prompt)
    if url:
        logger.info("Journey banner generated", goal_type=goal_type)
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
    logger.info("Generating course cover", title=course_title, topic=topic)
    url = await generate_image(prompt)
    if url:
        logger.info("Course cover generated", title=course_title)
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
    logger.info("Generating BPS milestone card", bps_level=bps_level, user=user_name)
    url = await generate_image(prompt)
    if url:
        logger.info("BPS milestone card generated", bps_level=bps_level)
    return url
