"""
Course Service

Orchestrates dynamic course generation:
  - generate_course_skeleton(topic, level)            — Gemini structured JSON skeleton
  - generate_class_content(title, module_title, ...)  — full lesson content per class
  - generate_course(topic, user_id, db, level)        — full pipeline: skeleton → parallel content → save
  - save_course(skeleton, class_contents, user_id, db)— transactional DB write
  - get_course_with_progress(course_id, user_id, db)  — course tree + progress state per class/module
  - get_courses_list(user_id, db, page, limit)        — paginated list with progress summary
  - mark_class_complete(user_id, course_id, ...)      — record class completion, save vocab
  - get_class_detail(course_id, module_id, class_id, user_id, db) — single class with completion
"""

import asyncio
import uuid
from uuid import UUID

# Limit concurrent Gemini content-generation calls to respect free-tier rate limits.
# gemini-2.5-flash free tier: 5 RPM. Keep concurrency low to avoid 429s.
_CONTENT_SEMAPHORE = asyncio.Semaphore(2)

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.models.course import Class, Course, Module
from backend.models.progress import UserProgress, VocabularyLearned
from backend.services.gemini_service import FALLBACK_MESSAGE, generate_json, generate_text
from backend.utils.cache import cache_set
from backend.utils.logger import get_logger

logger = get_logger(__name__)

# Job state TTL in Redis — 1 hour is enough for any reasonable generation time
_JOB_TTL = 3600


async def _update_job(
    job_id: str,
    status: str,
    progress: int,
    step: str,
    course_id: str | None = None,
    error: str | None = None,
) -> None:
    """
    Write background job state to Redis so the frontend can poll it.

    key: course_job:{job_id}
    Falls back silently if Redis is unavailable (course still generates normally).
    """
    payload: dict = {"job_id": job_id, "status": status, "progress": progress, "step": step}
    if course_id is not None:
        payload["course_id"] = course_id
    if error is not None:
        payload["error"] = error
    await cache_set(f"course_job:{job_id}", payload, ttl=_JOB_TTL)


# ── Level descriptors ──────────────────────────────────────────────────────────

_LEVEL_DESCRIPTIONS = {
    "A1": "complete beginner with no prior knowledge of Malay",
    "A2": "elementary learner who knows basic greetings and simple phrases",
    "B1": "intermediate learner who can handle routine topics",
    "B2": "upper-intermediate learner who can discuss familiar topics fluently",
}


# ── Step 1: Course skeleton ────────────────────────────────────────────────────


async def generate_course_skeleton(topic: str, level: str = "A1") -> dict:
    """
    Generate a course structure (title, modules, class titles) from a topic using Gemini.

    Returns a dict matching:
    {
        "title": str,
        "description": str,
        "objectives": [str, ...],
        "modules": [
            {
                "title": str,
                "description": str,
                "classes": [{"title": str}, ...]
            },
            ...
        ]
    }

    Falls back to a minimal skeleton if Gemini fails.
    """
    prompt = f"""You are an expert language curriculum designer for an English-medium Malay language learning platform.

LANGUAGE RULES — READ CAREFULLY:
- Write ALL titles, descriptions, objectives, and module/class names in ENGLISH.
- The course teaches MALAYSIAN Bahasa Melayu (not Indonesian Malay) to international students.
- Any Malay words that appear in titles or descriptions must use Malaysian vocabulary \
(e.g. "kosong" for zero, NOT "nol"/"sifar"; "awak/kamu" for you; standard Malaysian spelling).
- Do NOT write titles or descriptions in Malay — they are navigation labels for English-speaking learners.

Create a structured course outline for international students learning Malay.

Topic: "{topic}"
Target Level: {level} (BPS — BPS-1=beginner, BPS-2=elementary, BPS-3=intermediate, BPS-4=upper-intermediate)

Generate a course with:
- 2 to 3 modules
- Exactly 3 classes per module
- Each class covering one specific, practical aspect of the topic

Return ONLY valid JSON — no markdown, no prose:
{{
  "title": "Full course title in English (e.g. 'Ordering Food at a Restaurant in Malay')",
  "description": "2-3 sentences in English describing what students will learn in this course.",
  "objectives": [
    "Objective 1 in English — what the student can do after completing this course",
    "Objective 2 in English",
    "Objective 3 in English"
  ],
  "modules": [
    {{
      "title": "Module 1 title in English",
      "description": "One-sentence description in English of this module's focus.",
      "classes": [
        {{"title": "Class 1.1 title in English"}},
        {{"title": "Class 1.2 title in English"}},
        {{"title": "Class 1.3 title in English"}}
      ]
    }},
    {{
      "title": "Module 2 title in English",
      "description": "One-sentence description in English.",
      "classes": [
        {{"title": "Class 2.1 title in English"}},
        {{"title": "Class 2.2 title in English"}},
        {{"title": "Class 2.3 title in English"}}
      ]
    }}
  ]
}}"""

    skeleton = await generate_json(prompt)

    if not skeleton or "modules" not in skeleton or not skeleton["modules"]:
        logger.warning("Skeleton generation returned empty/invalid JSON — using fallback", topic=topic)
        skeleton = {
            "title": f"Learning Malay: {topic.title()}",
            "description": f"A practical course to help you communicate about {topic} in Bahasa Melayu.",
            "objectives": [
                f"Use core vocabulary related to {topic} in Malay",
                "Form grammatically correct sentences on this topic",
                "Hold a basic conversation on the topic in Malay",
            ],
            "modules": [
                {
                    "title": "Core Vocabulary",
                    "description": f"Essential words and phrases for {topic}.",
                    "classes": [
                        {"title": "Key Vocabulary"},
                        {"title": "Common Phrases"},
                        {"title": "Pronunciation Guide"},
                    ],
                },
                {
                    "title": "Practical Usage",
                    "description": f"Using {topic} vocabulary in real conversations.",
                    "classes": [
                        {"title": "Example Dialogues"},
                        {"title": "Grammar in Context"},
                        {"title": "Practice Sentences"},
                    ],
                },
            ],
        }

    return skeleton


# ── Step 2: Class content ──────────────────────────────────────────────────────


async def generate_class_content(
    class_title: str,
    module_title: str,
    course_title: str,
    topic: str,
    level: str = "A1",
) -> dict:
    """
    Generate full lesson content for a single class using two separate Gemini calls.

    Split approach (more reliable than one JSON call):
      Call A — generate_text() → plain Markdown lesson content, no JSON parsing needed.
      Call B — generate_json() → only vocabulary/examples (small flat objects, no multi-line strings).

    Returns:
    {
        "content": str,             # Markdown lesson text (≥ 300 words)
        "vocabulary_json": [...],   # List of {word, meaning, example}
        "examples_json": [...]      # List of {bm, en} sentence pairs
    }
    """
    level_desc = _LEVEL_DESCRIPTIONS.get(level, "beginner")

    async with _CONTENT_SEMAPHORE:
        return await _generate_class_content_inner(
            class_title, module_title, course_title, topic, level, level_desc
        )


async def _generate_class_content_inner(
    class_title: str,
    module_title: str,
    course_title: str,
    topic: str,
    level: str,
    level_desc: str,
) -> dict:
    # ── Call A: Plain Markdown lesson content ──────────────────────────────────
    # generate_text() returns raw Markdown — Gemini's natural output format.
    # No JSON parsing involved, so it cannot fail silently from malformed JSON.

    content_system = (
        "You are an expert English-medium Malaysian Bahasa Melayu teacher for international students. "
        "CRITICAL — LANGUAGE OF INSTRUCTION: Write ALL explanations, instructions, headings, and descriptions "
        "in ENGLISH. This is an English-medium course teaching Malay to international students who speak English. "
        "The MALAY WORDS AND PHRASES you teach must use Malaysian Bahasa Melayu vocabulary "
        "(NOT Indonesian Malay). Malaysian examples: 'kosong' for zero (not 'nol'/'sifar'), "
        "'awak/kamu' for you, 'kereta' for car (not 'mobil'), 'mahu' for want (not 'mau'), "
        "standard Malaysian spelling. "
        "Respond with plain Markdown only — no JSON, no code fences wrapping your response."
    )

    content_prompt = f"""Write a complete, engaging English-medium Malay language lesson for the following class.

CRITICAL LANGUAGE RULE:
- ALL explanations, instructions, and descriptions MUST be written in ENGLISH.
- The MALAY WORDS AND PHRASES you teach must use Malaysian Bahasa Melayu (NOT Indonesian Malay).
- Example: write "The word for 'water' in Malay is **air** /aɪr/." NOT "Perkataan untuk 'water' ialah air."
- This is a language learning course — students are English speakers learning Malay, not Malay speakers.

Course: "{course_title}"
Module: "{module_title}"
Class: "{class_title}"
Topic context: "{topic}"
Student level: {level} ({level_desc})

Your lesson MUST follow this exact structure (minimum 300 words total):

# {class_title}

A brief introduction paragraph in English (2-3 sentences) explaining what this class covers and why it matters.

## Core Content

Explanations in English of the key Malay concepts. Use **bold** for all Malay keywords when first introduced.
Provide English explanations and usage context for each Malay concept.

## Vocabulary

List the key Malaysian Malay words and phrases introduced in this class with their English meanings.
Include pronunciation hints in English where helpful.

## Example Sentences

Show 4-5 example sentences in Malaysian Malay with English translations. Format each as:
- **Malay sentence** — English translation

## Tips

2-3 practical tips in English for remembering and using what was learned in this class."""

    content = await generate_text(content_prompt, system_prompt=content_system)

    # Diagnostic log — visible in backend terminal to confirm what Gemini returned
    logger.info(
        "generate_text result",
        class_title=class_title,
        length=len(content.strip()),
        is_fallback_message=(content == FALLBACK_MESSAGE),
        preview=content.strip()[:120],
    )

    # Detect if generate_text silently failed (returns FALLBACK_MESSAGE on error)
    if content == FALLBACK_MESSAGE or len(content.strip()) < 100:
        logger.error(
            "generate_text returned fallback — Gemini API failed to generate content",
            class_title=class_title,
            length=len(content.strip()),
        )
        raise RuntimeError(
            f"Gemini failed to generate content for class '{class_title}'. "
            "The API returned a fallback or empty response."
        )

    # ── Call B: Structured vocabulary and examples only ────────────────────────
    # Only small flat JSON objects — no multi-line strings — making parse reliable.

    structured_prompt = f"""You are a Malaysian Bahasa Melayu language data assistant.

Generate vocabulary and example sentences for this Malay language class.
CRITICAL: Use Malaysian Bahasa Melayu (Malay as used in Malaysia), NOT Indonesian Malay.
Use Malaysian vocabulary: "kosong" for zero, "awak" for you (informal), standard Malaysian spelling.

Course: "{course_title}" | Module: "{module_title}" | Class: "{class_title}"
Topic: "{topic}" | Level: {level} ({level_desc})

Return ONLY valid JSON — no markdown fences, no prose:
{{
  "vocabulary_json": [
    {{
      "word": "Malaysian Malay word or phrase",
      "meaning": "English meaning",
      "example": "One short example sentence in Malaysian Malay. No newlines.",
      "ipa": "/IPA transcription using International Phonetic Alphabet, e.g. /sə.la.mat/. Include slashes.",
      "syllables": [
        {{"syllable": "first-syllable", "sounds_like": "English approximation e.g. suh"}},
        {{"syllable": "next-syllable", "sounds_like": "English approximation"}}
      ],
      "synonyms": ["Malaysian Malay synonym1", "synonym2"]
    }}
  ],
  "examples_json": [
    {{"bm": "One complete Malaysian Malay sentence. No newlines.", "en": "English translation. No newlines."}},
    {{"bm": "...", "en": "..."}}
  ]
}}

Rules:
- vocabulary_json: exactly 5 to 8 items. Every string value must be single-line with no \\n characters.
- "ipa": standard IPA notation with syllable-separating dots (e.g. "/ma.kan/"). Always include the slashes.
- "syllables": break the word into its spoken syllables with natural English "sounds like" approximations.
- "synonyms": list 1-3 closest Malaysian Malay synonyms; use empty array [] if none exist.
- examples_json: exactly 4 to 6 pairs. Each value must be a single-line string with no \\n characters.
- Do NOT use any \\n inside any string value."""

    structured = await generate_json(structured_prompt)

    vocabulary_json = structured.get("vocabulary_json", [])
    examples_json = structured.get("examples_json", [])

    if not structured or not vocabulary_json:
        logger.warning(
            "generate_json returned empty structured data — vocab/examples will be empty",
            class_title=class_title,
        )

    return {
        "content": content,
        "vocabulary_json": vocabulary_json,
        "examples_json": examples_json,
    }


# ── Retry wrapper ─────────────────────────────────────────────────────────────


async def _generate_class_with_retry(
    class_title: str,
    module_title: str,
    course_title: str,
    topic: str,
    level: str,
) -> dict:
    """
    Generate class content with one automatic retry on transient failure.

    Gemini free-tier rate limits (429) can cause the first attempt to fail even with
    per-call retry logic. Waiting 35 seconds before the second attempt gives the
    rate-limit window time to reset.

    If both attempts fail, returns minimal fallback content so the overall course
    generation still succeeds rather than aborting entirely.
    """
    try:
        return await generate_class_content(class_title, module_title, course_title, topic, level)
    except RuntimeError:
        logger.warning(
            "Class content generation failed on first attempt — waiting 35s before retry",
            class_title=class_title,
        )
        await asyncio.sleep(35)
        try:
            return await generate_class_content(class_title, module_title, course_title, topic, level)
        except RuntimeError:
            logger.error(
                "Class content generation failed after retry — using fallback content",
                class_title=class_title,
            )
            return {
                "content": (
                    f"# {class_title}\n\n"
                    "This lesson content could not be generated at this time due to a temporary API issue. "
                    "Please delete this course and generate it again to get full lesson content.\n\n"
                    "## What You Will Learn\n\n"
                    f"This class covers key aspects of **{class_title}** as part of the **{module_title}** module."
                ),
                "vocabulary_json": [],
                "examples_json": [],
            }


# ── Step 3: Save to database ───────────────────────────────────────────────────


async def save_course(
    skeleton: dict,
    class_contents: list[list[dict]],
    user_id: UUID,
    db: AsyncSession,
) -> Course:
    """
    Persist a fully generated course to PostgreSQL in a single transaction.

    Args:
        skeleton:       Course structure from generate_course_skeleton (with "topic" key added)
        class_contents: 2-D list [module_idx][class_idx] of dicts from generate_class_content
        user_id:        Owning user's UUID
        db:             Async SQLAlchemy session
    """
    course = Course(
        user_id=user_id,
        title=skeleton["title"],
        description=skeleton["description"],
        topic=skeleton.get("topic", ""),
        objectives=skeleton.get("objectives", []),
    )
    db.add(course)
    await db.flush()  # Materialise course.id before inserting modules

    for mod_idx, mod_data in enumerate(skeleton["modules"]):
        module = Module(
            course_id=course.id,
            title=mod_data["title"],
            description=mod_data["description"],
            order_index=mod_idx + 1,
        )
        db.add(module)
        await db.flush()  # Materialise module.id before inserting classes

        for cls_idx, cls_data in enumerate(mod_data["classes"]):
            content_data = (
                class_contents[mod_idx][cls_idx]
                if mod_idx < len(class_contents) and cls_idx < len(class_contents[mod_idx])
                else {}
            )
            cls = Class(
                module_id=module.id,
                title=cls_data["title"],
                content=content_data.get("content", f"# {cls_data['title']}\n\nLesson content."),
                vocabulary_json=content_data.get("vocabulary_json", []),
                examples_json=content_data.get("examples_json", []),
                order_index=cls_idx + 1,
            )
            db.add(cls)

    await db.commit()
    await db.refresh(course)
    return course


# ── Main generation pipeline ───────────────────────────────────────────────────


async def generate_course(
    topic: str,
    user_id: UUID,
    db: AsyncSession,
    level: str = "A1",
    job_id: str | None = None,
) -> Course:
    """
    Full course generation pipeline:
      1. Generate skeleton (title, modules, class titles)
      2. Generate all class content in parallel via asyncio.gather
      3. Save everything to DB transactionally

    If job_id is provided, progress milestones are written to Redis so the
    frontend can poll GET /api/courses/jobs/{job_id}.

    Returns the saved Course ORM object.
    """
    logger.info("Course generation started", topic=topic, user_id=str(user_id), level=level)

    if job_id:
        await _update_job(job_id, "running", 5, "Validating topic and designing course structure…")

    # Step 1 — skeleton
    skeleton = await generate_course_skeleton(topic, level)
    skeleton["topic"] = topic  # Store original user topic verbatim

    if job_id:
        await _update_job(job_id, "running", 15, "Course outline ready — generating lesson content…")

    # Step 2 — generate all class content in parallel
    tasks: list = []
    module_class_counts: list[int] = []

    for mod_data in skeleton["modules"]:
        count = 0
        for cls_data in mod_data["classes"]:
            tasks.append(
                _generate_class_with_retry(
                    class_title=cls_data["title"],
                    module_title=mod_data["title"],
                    course_title=skeleton["title"],
                    topic=topic,
                    level=level,
                )
            )
            count += 1
        module_class_counts.append(count)

    if job_id:
        await _update_job(job_id, "running", 20, f"Writing {len(tasks)} lessons in parallel…")

    logger.info("Generating class content in parallel", total_classes=len(tasks))
    flat_results = await asyncio.gather(*tasks, return_exceptions=True)

    # Reassemble flat list into 2-D structure
    class_contents: list[list[dict]] = []
    idx = 0
    for count in module_class_counts:
        module_contents: list[dict] = []
        for _ in range(count):
            result = flat_results[idx]
            if isinstance(result, Exception):
                logger.error(
                    "Class content task raised exception — aborting course generation",
                    error=str(result),
                    error_type=type(result).__name__,
                )
                if job_id:
                    await _update_job(job_id, "failed", 0, "Generation failed", error=str(result))
                raise RuntimeError(f"Course generation failed: {result}") from result
            module_contents.append(result)
            idx += 1
        class_contents.append(module_contents)

    if job_id:
        await _update_job(job_id, "running", 85, "All lessons written — saving your course…")

    # Step 3 — persist
    course = await save_course(skeleton, class_contents, user_id, db)
    logger.info("Course saved", course_id=str(course.id), title=course.title)

    if job_id:
        await _update_job(job_id, "complete", 100, "Course ready!", course_id=str(course.id))

    # Log course generation activity (fire-and-forget — failure must not abort course save)
    try:
        from backend.utils.analytics import log_activity
        await log_activity(db, user_id=user_id, feature="course_gen", duration_seconds=0)
    except Exception:
        pass

    # Generate cover image in background — never blocks the response
    asyncio.create_task(
        _generate_and_save_cover(
            course_id=str(course.id),
            course_title=course.title,
            topic=topic,
        )
    )

    return course


async def _generate_and_save_cover(
    course_id: str,
    course_title: str,
    topic: str,
) -> None:
    """
    Background task: generate a cover image for the course and save it to DB.
    Opens its own DB session — safe to run after the request session has closed.
    """
    from backend.db.database import AsyncSessionLocal
    from backend.services.image_service import generate_course_cover

    try:
        image_url = await generate_course_cover(course_title, topic)
        if not image_url:
            return

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Course).where(Course.id == course_id))
            course = result.scalar_one_or_none()
            if course and not course.cover_image_url:
                course.cover_image_url = image_url
                await db.commit()
                logger.info("Cover image saved to course", course_id=course_id)
    except Exception as exc:
        logger.error("Cover generation background task failed", course_id=course_id, error=str(exc))


# ── Course retrieval ───────────────────────────────────────────────────────────


async def get_course_with_progress(
    course_id: UUID,
    user_id: UUID,
    db: AsyncSession,
) -> dict | None:
    """
    Fetch the full course tree with per-class and per-module completion state.

    Returns None if the course doesn't exist or belongs to a different user.
    Modules are marked locked if the previous module's quiz has not been passed.
    """
    result = await db.execute(
        select(Course)
        .where(Course.id == course_id, Course.user_id == user_id)
        .options(selectinload(Course.modules).selectinload(Module.classes))
    )
    course = result.scalar_one_or_none()
    if not course:
        return None

    # Fetch all progress rows for this course in one query
    prog_result = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == user_id,
            UserProgress.course_id == course_id,
        )
    )
    progress_rows = prog_result.scalars().all()

    completed_class_ids = {str(p.class_id) for p in progress_rows if p.class_id is not None}
    completed_module_ids = {str(p.module_id) for p in progress_rows if p.class_id is None}

    modules_out: list[dict] = []
    prev_module_unlocked = True  # The first module is always unlocked
    total_classes = 0
    completed_classes = 0

    for module in course.modules:
        classes_out: list[dict] = []
        all_classes_done = True

        for cls in module.classes:
            is_completed = str(cls.id) in completed_class_ids
            if is_completed:
                completed_classes += 1
            else:
                all_classes_done = False
            total_classes += 1

            classes_out.append({
                "id": str(cls.id),
                "module_id": str(cls.module_id),
                "title": cls.title,
                "order_index": cls.order_index,
                "is_completed": is_completed,
            })

        is_locked = not prev_module_unlocked
        is_module_completed = str(module.id) in completed_module_ids
        # Quiz is available once all classes are done but the module quiz hasn't been passed
        quiz_available = all_classes_done and not is_module_completed

        modules_out.append({
            "id": str(module.id),
            "course_id": str(module.course_id),
            "title": module.title,
            "description": module.description,
            "order_index": module.order_index,
            "created_at": module.created_at.isoformat(),
            "classes": classes_out,
            "is_locked": is_locked,
            "is_completed": is_module_completed,
            "quiz_available": quiz_available,
        })

        # Unlock next module only if current module quiz is passed
        prev_module_unlocked = is_module_completed

    return {
        "id": str(course.id),
        "user_id": str(course.user_id),
        "title": course.title,
        "description": course.description,
        "topic": course.topic,
        "objectives": course.objectives or [],
        "created_at": course.created_at.isoformat(),
        "modules": modules_out,
        "total_classes": total_classes,
        "completed_classes": completed_classes,
    }


async def get_courses_list(
    user_id: UUID,
    db: AsyncSession,
    page: int = 1,
    limit: int = 10,
) -> dict:
    """
    Fetch a paginated list of user's courses with progress summary.
    """
    offset = (page - 1) * limit

    count_result = await db.execute(
        select(func.count(Course.id)).where(Course.user_id == user_id)
    )
    total: int = count_result.scalar() or 0

    result = await db.execute(
        select(Course)
        .where(Course.user_id == user_id)
        .options(selectinload(Course.modules).selectinload(Module.classes))
        .order_by(Course.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    courses = result.scalars().all()

    items: list[dict] = []
    for course in courses:
        total_cls = sum(len(m.classes) for m in course.modules)

        completed_result = await db.execute(
            select(func.count(UserProgress.id)).where(
                UserProgress.user_id == user_id,
                UserProgress.course_id == course.id,
                UserProgress.class_id.isnot(None),
            )
        )
        completed_cls: int = completed_result.scalar() or 0

        items.append({
            "id": str(course.id),
            "title": course.title,
            "description": course.description,
            "topic": course.topic,
            "cover_image_url": course.cover_image_url,
            "created_at": course.created_at.isoformat(),
            "total_classes": total_cls,
            "completed_classes": completed_cls,
            "module_count": len(course.modules),
        })

    return {"items": items, "total": total, "page": page, "limit": limit}


# ── Progress tracking ──────────────────────────────────────────────────────────


async def mark_class_complete(
    user_id: UUID,
    course_id: UUID,
    module_id: UUID,
    class_id: UUID,
    db: AsyncSession,
) -> dict:
    """
    Mark a class as complete for a user.
    - Records a UserProgress row (idempotent — safe to call twice)
    - Saves vocabulary from the class into vocabulary_learned
    - Returns whether all classes in the module are now complete

    Returns a dict with completion info, or {"error": "..."} on failure.
    """
    # Verify class belongs to the specified module/course
    cls_result = await db.execute(
        select(Class)
        .join(Module, Class.module_id == Module.id)
        .join(Course, Module.course_id == Course.id)
        .where(
            Class.id == class_id,
            Class.module_id == module_id,
            Module.course_id == course_id,
            Course.user_id == user_id,
        )
    )
    cls = cls_result.scalar_one_or_none()
    if not cls:
        return {"error": "Class not found"}

    # Idempotent — only insert if not already present
    existing = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == user_id,
            UserProgress.course_id == course_id,
            UserProgress.module_id == module_id,
            UserProgress.class_id == class_id,
        )
    )
    if existing.scalar_one_or_none() is None:
        db.add(
            UserProgress(
                user_id=user_id,
                course_id=course_id,
                module_id=module_id,
                class_id=class_id,
            )
        )

        # Commit class completion first so it's saved even if vocab save fails
        await db.commit()

        # Save vocabulary encountered in this class (skip duplicates).
        # Runs in a separate try/except so a malformed vocab item never blocks
        # the class from being marked complete.
        if cls.vocabulary_json:
            try:
                for item in cls.vocabulary_json:
                    if not isinstance(item, dict):
                        continue
                    # Use `or ""` so None/falsy values (e.g. Gemini returned null
                    # or a number for "word") become "" before str() + strip().
                    word = str(item.get("word") or "").strip()[:250]
                    meaning = str(item.get("meaning") or "").strip()
                    if word and meaning:
                        dedup_check = await db.execute(
                            select(VocabularyLearned.id).where(
                                VocabularyLearned.user_id == user_id,
                                VocabularyLearned.word.ilike(word),
                            )
                        )
                        if dedup_check.scalar_one_or_none() is None:
                            db.add(
                                VocabularyLearned(
                                    user_id=user_id,
                                    word=word,
                                    meaning=meaning,
                                    source_type="course",
                                    source_id=cls.id,
                                )
                            )
                await db.commit()
            except Exception as vocab_exc:
                logger.warning(
                    "Vocabulary save failed — class completion is already recorded",
                    class_id=str(class_id),
                    error=str(vocab_exc),
                )
                await db.rollback()

    # Check if all classes in this module are now complete
    all_cls_result = await db.execute(
        select(Class.id).where(Class.module_id == module_id)
    )
    all_class_ids = {str(r) for r in all_cls_result.scalars().all()}

    done_result = await db.execute(
        select(UserProgress.class_id).where(
            UserProgress.user_id == user_id,
            UserProgress.module_id == module_id,
            UserProgress.class_id.isnot(None),
        )
    )
    done_class_ids = {str(r) for r in done_result.scalars().all()}

    all_done = all_class_ids == done_class_ids

    return {
        "class_id": str(class_id),
        "completed": True,
        "all_module_classes_done": all_done,
        "quiz_unlocked": all_done,
    }


async def delete_course(
    course_id: UUID,
    user_id: UUID,
    db: AsyncSession,
) -> bool:
    """
    Delete a course and all its modules, classes, and progress rows.

    Cascade deletes handle child records via DB-level ON DELETE CASCADE.
    Returns True if deleted, False if the course wasn't found / doesn't belong to this user.
    """
    result = await db.execute(
        select(Course).where(Course.id == course_id, Course.user_id == user_id)
    )
    course = result.scalar_one_or_none()
    if not course:
        return False

    await db.delete(course)
    await db.commit()
    return True


async def get_class_detail(
    course_id: UUID,
    module_id: UUID,
    class_id: UUID,
    user_id: UUID,
    db: AsyncSession,
) -> dict | None:
    """
    Fetch a single class with its full content and completion status.

    Returns None if the class doesn't exist or doesn't belong to this user's course.
    """
    result = await db.execute(
        select(Class, Module, Course)
        .join(Module, Class.module_id == Module.id)
        .join(Course, Module.course_id == Course.id)
        .where(
            Class.id == class_id,
            Class.module_id == module_id,
            Module.course_id == course_id,
            Course.user_id == user_id,
        )
    )
    row = result.first()
    if not row:
        return None

    cls, module, course = row

    is_completed_result = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == user_id,
            UserProgress.class_id == class_id,
        )
    )
    is_completed = is_completed_result.scalar_one_or_none() is not None

    return {
        "id": str(cls.id),
        "module_id": str(cls.module_id),
        "title": cls.title,
        "content": cls.content,
        "vocabulary_json": cls.vocabulary_json or [],
        "examples_json": cls.examples_json or [],
        "order_index": cls.order_index,
        "created_at": cls.created_at.isoformat(),
        "is_completed": is_completed,
        "module_title": module.title,
        "course_title": course.title,
    }
