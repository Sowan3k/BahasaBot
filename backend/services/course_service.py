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
from backend.utils.logger import get_logger

logger = get_logger(__name__)


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
    prompt = f"""You are an expert Bahasa Melayu (Malay language) curriculum designer.

Create a structured course outline for international students learning Malay.

Topic: "{topic}"
Target Level: {level} (CEFR — A1=beginner, A2=elementary, B1=intermediate, B2=upper-intermediate)

Generate a course with:
- 2 to 3 modules
- Exactly 3 classes per module
- Each class covering one specific, practical aspect of the topic

Return ONLY valid JSON — no markdown, no prose:
{{
  "title": "Full course title (English, e.g. 'Ordering Food at a Restaurant in Malay')",
  "description": "2-3 sentences describing what students will learn in this course.",
  "objectives": [
    "Objective 1 — what the student can do after completing this course",
    "Objective 2",
    "Objective 3"
  ],
  "modules": [
    {{
      "title": "Module 1 title",
      "description": "One-sentence description of this module's focus.",
      "classes": [
        {{"title": "Class 1.1 title"}},
        {{"title": "Class 1.2 title"}},
        {{"title": "Class 1.3 title"}}
      ]
    }},
    {{
      "title": "Module 2 title",
      "description": "One-sentence description.",
      "classes": [
        {{"title": "Class 2.1 title"}},
        {{"title": "Class 2.2 title"}},
        {{"title": "Class 2.3 title"}}
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
        "You are an expert Bahasa Melayu (Malay language) teacher. "
        "Respond with plain Markdown only — no JSON, no code fences wrapping your response."
    )

    content_prompt = f"""Write a complete, engaging Malay language lesson for the following class.

Course: "{course_title}"
Module: "{module_title}"
Class: "{class_title}"
Topic context: "{topic}"
Student level: {level} ({level_desc})

Your lesson MUST follow this exact structure (minimum 300 words total):

# {class_title}

A brief introduction paragraph (2-3 sentences) explaining what this class covers and why it matters for learning Malay.

## Core Content

Detailed explanations of the key concepts. Use **bold** for all Malay keywords when first introduced. Provide clear explanations and context for each concept.

## Vocabulary

List and explain the key Malay words and phrases introduced in this class. Include pronunciation hints where helpful.

## Example Sentences

Show 4-5 example sentences in Malay with English translations. Format each as:
- **Malay sentence** — English translation

## Tips

2-3 practical tips for remembering and using what was learned in this class."""

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

    structured_prompt = f"""You are a Bahasa Melayu language data assistant.

Generate vocabulary and example sentences for this Malay language class:
Course: "{course_title}" | Module: "{module_title}" | Class: "{class_title}"
Topic: "{topic}" | Level: {level} ({level_desc})

Return ONLY valid JSON — no markdown fences, no prose:
{{
  "vocabulary_json": [
    {{"word": "Malay word", "meaning": "English meaning", "example": "One example sentence in Malay. No newlines."}},
    {{"word": "...", "meaning": "...", "example": "..."}}
  ],
  "examples_json": [
    {{"bm": "One complete Malay sentence. No newlines.", "en": "One English translation. No newlines."}},
    {{"bm": "...", "en": "..."}}
  ]
}}

Rules:
- vocabulary_json: exactly 5 to 8 items. Each value must be a single-line string with no newline characters.
- examples_json: exactly 4 to 6 pairs. Each value must be a single-line string with no newline characters.
- Do NOT use any \\n inside string values."""

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
) -> Course:
    """
    Full course generation pipeline:
      1. Generate skeleton (title, modules, class titles)
      2. Generate all class content in parallel via asyncio.gather
      3. Save everything to DB transactionally

    Returns the saved Course ORM object.
    """
    logger.info("Course generation started", topic=topic, user_id=str(user_id), level=level)

    # Step 1 — skeleton
    skeleton = await generate_course_skeleton(topic, level)
    skeleton["topic"] = topic  # Store original user topic verbatim

    # Step 2 — generate all class content in parallel
    tasks: list = []
    module_class_counts: list[int] = []

    for mod_data in skeleton["modules"]:
        count = 0
        for cls_data in mod_data["classes"]:
            tasks.append(
                generate_class_content(
                    class_title=cls_data["title"],
                    module_title=mod_data["title"],
                    course_title=skeleton["title"],
                    topic=topic,
                    level=level,
                )
            )
            count += 1
        module_class_counts.append(count)

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
                raise RuntimeError(f"Course generation failed: {result}") from result
            module_contents.append(result)
            idx += 1
        class_contents.append(module_contents)

    # Step 3 — persist
    course = await save_course(skeleton, class_contents, user_id, db)
    logger.info("Course saved", course_id=str(course.id), title=course.title)
    return course


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

        # Save vocabulary encountered in this class (skip duplicates)
        if cls.vocabulary_json:
            for item in cls.vocabulary_json:
                word = item.get("word", "").strip()
                meaning = item.get("meaning", "").strip()
                if word and meaning:
                    existing = await db.execute(
                        select(VocabularyLearned.id).where(
                            VocabularyLearned.user_id == user_id,
                            VocabularyLearned.word.ilike(word),
                        )
                    )
                    if existing.scalar_one_or_none() is None:
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
