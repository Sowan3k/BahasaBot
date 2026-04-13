"""
Quiz Service

Handles module quiz generation/scoring (Phase 5) and
adaptive standalone quiz generation/scoring (Phase 6).

Functions (Phase 5):
  - generate_module_quiz(module_id, db)               — generate 10 questions from Gemini
  - get_module_quiz(module_id, user_id, course_id, db)— return cached or newly generated quiz
  - submit_module_quiz(user_id, module_id, ...)       — score, update weak points, mark complete

Functions (Phase 6):
  - get_standalone_quiz(user_id, db)                  — return cached or newly generated adaptive quiz
  - generate_standalone_quiz(user_id, db)             — generate 15 adaptive questions from weak points
  - submit_standalone_quiz(user_id, answers, db)      — score, update weak points, recalculate CEFR

Internal helpers:
  - _update_weak_points(user_id, wrong, db)           — upsert weak_points for wrong answers
  - _improve_weak_points(user_id, correct_qs, db)     — strengthen weak_points for correct answers
  - _calculate_cefr_level(user_id, db)                — rule-based BPS level from quiz history
"""

import asyncio
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.course import Class, Module
from backend.models.progress import UserProgress, VocabularyLearned, GrammarLearned, WeakPoint
from backend.models.quiz import ModuleQuizAttempt, StandaloneQuizAttempt
from backend.models.user import User
from backend.services.gemini_service import generate_json
from backend.utils.cache import cache_delete, cache_get, cache_set
from backend.utils.logger import get_logger

logger = get_logger(__name__)

# Redis TTL for cached quiz questions (2 hours — long enough for a sitting)
_QUIZ_CACHE_TTL = 7200

# Score required to pass and unlock the next module
PASS_THRESHOLD = 0.70


def _quiz_cache_key(module_id: UUID, user_id: UUID) -> str:
    """Redis key for a user's cached quiz for a module."""
    return f"quiz:module:{module_id}:user:{user_id}"


# ── Quiz generation ────────────────────────────────────────────────────────────


async def generate_module_quiz(module_id: UUID, db: AsyncSession) -> list[dict]:
    """
    Generate 10 quiz questions from module content using Gemini.

    Fetches all classes in the module, builds a content summary from vocabulary
    and examples, then calls Gemini to produce:
      - 6 multiple-choice questions (MCQ), each with 4 options
      - 4 fill-in-the-blank questions

    Returns a list of full question dicts (WITH correct_answer — stored server-side only).
    Raises ValueError if module not found or has no classes.
    Raises RuntimeError if Gemini returns too few questions.
    """
    # Load module
    mod_result = await db.execute(select(Module).where(Module.id == module_id))
    module = mod_result.scalar_one_or_none()
    if not module:
        raise ValueError(f"Module {module_id} not found")

    # Load all classes in module
    cls_result = await db.execute(
        select(Class).where(Class.module_id == module_id).order_by(Class.order_index)
    )
    classes = cls_result.scalars().all()
    if not classes:
        raise ValueError(f"Module {module_id} has no classes")

    # Build a compact content summary for the Gemini prompt
    content_summary = ""
    for cls in classes:
        content_summary += f"\n\n### Class: {cls.title}\n"
        if cls.vocabulary_json:
            vocab_lines = [
                f"- {v.get('word', '')} = {v.get('meaning', '')} (e.g. {v.get('example', '')})"
                for v in (cls.vocabulary_json or [])[:8]
            ]
            content_summary += "Vocabulary:\n" + "\n".join(vocab_lines)
        if cls.examples_json:
            ex_lines = [
                f"- BM: {e.get('bm', '')} / EN: {e.get('en', '')}"
                for e in (cls.examples_json or [])[:4]
            ]
            content_summary += "\nExample sentences:\n" + "\n".join(ex_lines)

    prompt = f"""You are a Malaysian Bahasa Melayu (Malay language) quiz generator for international students.

LANGUAGE RULES:
- Write all QUESTION TEXT and EXPLANATIONS in ENGLISH (students are English speakers learning Malay).
- The MALAY WORDS in questions/answers/options must use Malaysian Bahasa Melayu vocabulary \
(NOT Indonesian Malay): "kosong" for zero (NOT "sifar"/"nol"), "awak/kamu" for you, \
"kereta" for car (NOT "mobil"), "mahu" for want (NOT "mau"), standard Malaysian spelling.
- Do NOT write question text in Malay — questions are English prompts testing Malay knowledge.

Generate exactly 10 quiz questions based on the following module content.

Module: "{module.title}"
{content_summary}

Generate:
- 6 multiple-choice questions (MCQ) — each with exactly 4 options, only one correct
- 4 fill-in-the-blank questions — the student fills in a single Malay word or short phrase

Rules:
- Questions MUST test content from the module above (vocabulary, phrases, translations, grammar)
- For MCQ: make distractors plausible (related Malaysian Malay words, not random nonsense)
- For fill-in-blank: provide enough context so there is exactly one correct answer
- Vary difficulty (mix easy recall and applied usage questions)
- Each question must have a brief, helpful explanation of the correct answer
- For vocabulary questions, include the IPA pronunciation in the explanation, e.g.: \
"'Makanan' /ma.ka.nan/ means food."

Return ONLY valid JSON — no markdown, no prose:
{{
  "questions": [
    {{
      "id": "q1",
      "type": "mcq",
      "question": "What is the Malaysian Malay word for 'food'?",
      "options": ["makanan", "minuman", "pakaian", "buku"],
      "correct_answer": "makanan",
      "explanation": "'Makanan' /ma.ka.nan/ means food. The others mean drink, clothing, and book."
    }},
    {{
      "id": "q2",
      "type": "fill_in_blank",
      "question": "Complete: 'Saya _____ nasi goreng.' (I ___ fried rice)",
      "options": null,
      "correct_answer": "makan",
      "explanation": "'Makan' /ma.kan/ is the Malaysian Malay verb for 'eat'."
    }}
  ]
}}

Generate all 10 questions now. Assign IDs q1 through q10."""

    data = await generate_json(prompt)
    questions = data.get("questions", [])

    if len(questions) < 5:
        logger.error(
            "Quiz generation returned too few questions",
            count=len(questions),
            module_id=str(module_id),
        )
        raise RuntimeError(
            f"Quiz generation failed: only {len(questions)} questions returned (expected 10)"
        )

    # Validate and normalise each question
    validated: list[dict] = []
    for q in questions:
        if not q.get("id") or not q.get("question") or not q.get("correct_answer"):
            continue
        # Normalise type field
        if q.get("type") not in ("mcq", "fill_in_blank"):
            q["type"] = "mcq" if q.get("options") else "fill_in_blank"
        validated.append(q)

    return validated


# ── Get quiz (for frontend) ────────────────────────────────────────────────────


async def get_module_quiz(
    module_id: UUID,
    user_id: UUID,
    course_id: UUID,
    db: AsyncSession,
) -> dict:
    """
    Get the quiz for a module.

    - Returns already_passed=True (with empty questions) if the user already passed.
    - Serves cached questions from Redis if available.
    - Otherwise generates a new quiz via Gemini and caches it.
    - Questions returned do NOT include correct_answer (scoring is server-side).
    """
    # Check if module already passed (UserProgress row with class_id=None)
    passed_result = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == user_id,
            UserProgress.module_id == module_id,
            UserProgress.class_id.is_(None),
        )
    )
    already_passed = passed_result.scalar_one_or_none() is not None

    # Load module title
    mod_result = await db.execute(select(Module).where(Module.id == module_id))
    module = mod_result.scalar_one_or_none()
    if not module:
        raise ValueError(f"Module {module_id} not found")

    if already_passed:
        return {
            "module_id": str(module_id),
            "module_title": module.title,
            "questions": [],
            "already_passed": True,
        }

    # Try Redis cache first
    cache_key = _quiz_cache_key(module_id, user_id)
    cached = await cache_get(cache_key)

    if cached:
        questions_full = cached
        logger.info("Quiz served from cache", module_id=str(module_id))
    else:
        questions_full = await generate_module_quiz(module_id, db)
        await cache_set(cache_key, questions_full, ttl=_QUIZ_CACHE_TTL)
        logger.info(
            "Quiz generated and cached",
            module_id=str(module_id),
            count=len(questions_full),
        )

    # Strip correct_answer before returning to the frontend
    questions_out = [
        {
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options"),
        }
        for q in questions_full
    ]

    return {
        "module_id": str(module_id),
        "module_title": module.title,
        "questions": questions_out,
        "already_passed": False,
    }


# ── Submit quiz ────────────────────────────────────────────────────────────────


async def submit_module_quiz(
    user_id: UUID,
    module_id: UUID,
    course_id: UUID,
    user_answers: list[dict],
    db: AsyncSession,
) -> dict:
    """
    Score a module quiz submission.

    Steps:
    1. Load questions (with correct answers) from Redis cache
    2. Score each submitted answer (case-insensitive)
    3. Save ModuleQuizAttempt to DB
    4. Update weak_points for wrong answers
    5. If score >= 70%: mark module as complete (UserProgress row with class_id=None)
    6. Clear quiz cache
    7. Return score, per-question results, and whether the module is now unlocked
    """
    cache_key = _quiz_cache_key(module_id, user_id)
    questions_full: list[dict] | None = await cache_get(cache_key)

    if not questions_full:
        # Cache expired between GET and POST — regenerate to score against
        logger.warning(
            "Quiz cache miss on submit — regenerating for scoring",
            module_id=str(module_id),
        )
        questions_full = await generate_module_quiz(module_id, db)

    # Build a lookup of submitted answers by question_id
    answer_map = {a["question_id"]: a["answer"].strip() for a in user_answers}

    question_results: list[dict] = []
    correct_count = 0
    wrong_questions: list[dict] = []

    for q in questions_full:
        qid = q["id"]
        user_ans = answer_map.get(qid, "").strip()
        correct_ans = q.get("correct_answer", "").strip()

        # Case-insensitive match for both MCQ and fill-in-blank
        is_correct = user_ans.lower() == correct_ans.lower()

        if is_correct:
            correct_count += 1
        else:
            wrong_questions.append(q)

        question_results.append({
            "question_id": qid,
            "question": q["question"],
            "your_answer": user_ans,
            "correct_answer": correct_ans,
            "is_correct": is_correct,
            "explanation": q.get("explanation", ""),
        })

    total = len(questions_full)
    score = correct_count / total if total > 0 else 0.0
    passed = score >= PASS_THRESHOLD

    # Persist the quiz attempt
    answers_json = [
        {
            "question_id": r["question_id"],
            "answer": r["your_answer"],
            "correct": r["is_correct"],
            "type": next(
                (q["type"] for q in questions_full if q["id"] == r["question_id"]),
                "mcq",
            ),
        }
        for r in question_results
    ]

    db.add(
        ModuleQuizAttempt(
            user_id=user_id,
            module_id=module_id,
            score=score,
            answers_json=answers_json,
        )
    )

    # Update weak points for incorrect answers
    if wrong_questions:
        await _update_weak_points(user_id, wrong_questions, db)

    # Mark module complete if passed
    module_unlocked = False
    if passed:
        existing = await db.execute(
            select(UserProgress).where(
                UserProgress.user_id == user_id,
                UserProgress.module_id == module_id,
                UserProgress.class_id.is_(None),
            )
        )
        if existing.scalar_one_or_none() is None:
            db.add(
                UserProgress(
                    user_id=user_id,
                    course_id=course_id,
                    module_id=module_id,
                    class_id=None,
                )
            )
            module_unlocked = True

    await db.commit()

    # Clear the quiz cache — next visit will generate a fresh quiz (for retries)
    await cache_delete(cache_key)

    logger.info(
        "Module quiz scored",
        user_id=str(user_id),
        module_id=str(module_id),
        score=round(score, 2),
        passed=passed,
        correct=correct_count,
        total=total,
    )

    # ── Journey progress hook ──────────────────────────────────────────────
    # If a module was newly unlocked, check if ALL modules in the course
    # are now complete — if so, fire check_roadmap_progress().
    if module_unlocked:
        asyncio.create_task(
            _check_course_completion_for_journey(
                user_id=user_id,
                course_id=course_id,
            )
        )

    return {
        "score": round(score, 4),
        "score_percent": round(score * 100),
        "passed": passed,
        "correct_count": correct_count,
        "total_questions": total,
        "question_results": question_results,
        "module_unlocked": module_unlocked,
    }


async def _check_course_completion_for_journey(
    user_id: UUID,
    course_id: UUID,
) -> None:
    """
    Background task: check if all modules in the course are now completed.
    If yes, call journey_service.check_roadmap_progress() with the course title.
    Opens its own DB session — safe after the request session closes.
    """
    from backend.db.database import AsyncSessionLocal
    from backend.models.course import Course, Module
    from backend.services import journey_service

    try:
        async with AsyncSessionLocal() as db:
            # Fetch course title
            course_result = await db.execute(
                select(Course).where(Course.id == course_id)
            )
            course = course_result.scalar_one_or_none()
            if not course:
                return

            # Count total modules in this course
            mod_result = await db.execute(
                select(Module.id).where(Module.course_id == course_id)
            )
            all_module_ids = [str(r) for r in mod_result.scalars().all()]

            if not all_module_ids:
                return

            # Count how many modules have a passing quiz (UserProgress with class_id=None)
            done_result = await db.execute(
                select(UserProgress.module_id).where(
                    UserProgress.user_id == user_id,
                    UserProgress.course_id == course_id,
                    UserProgress.class_id.is_(None),
                )
            )
            done_module_ids = {str(r) for r in done_result.scalars().all()}

            if set(all_module_ids) == done_module_ids:
                # All modules completed — notify journey service
                logger.info(
                    "Course fully completed — checking roadmap progress",
                    user_id=str(user_id),
                    course_id=str(course_id),
                    course_title=course.title,
                )
                await journey_service.check_roadmap_progress(
                    user_id=user_id,
                    completed_course_title=course.title,
                    db=db,
                )
    except Exception as exc:
        logger.error(
            "Course completion journey check failed",
            user_id=str(user_id),
            course_id=str(course_id),
            error=str(exc),
        )


# ── Weak points helper ─────────────────────────────────────────────────────────


async def _update_weak_points(
    user_id: UUID,
    wrong_questions: list[dict],
    db: AsyncSession,
) -> None:
    """
    Upsert weak_points rows for questions the user answered incorrectly.

    - Existing topic: strength_score decreases by 0.1 (floor 0.0)
    - New topic: inserted with initial strength_score of 0.4
    """
    for q in wrong_questions:
        # Use the question text as the topic label (truncated to column limit)
        topic = q.get("question", "Unknown topic")[:200]
        # Both MCQ and fill-in-blank can test vocabulary or grammar.
        # Default to "vocab" since most Malay quiz questions at this level target vocabulary.
        q_type = "vocab"

        existing = await db.execute(
            select(WeakPoint).where(
                WeakPoint.user_id == user_id,
                WeakPoint.topic == topic,
            )
        )
        wp = existing.scalar_one_or_none()

        if wp:
            wp.strength_score = max(0.0, wp.strength_score - 0.1)
        else:
            db.add(
                WeakPoint(
                    user_id=user_id,
                    topic=topic,
                    type=q_type,
                    strength_score=0.4,
                )
            )


async def _improve_weak_points(
    user_id: UUID,
    correct_questions: list[dict],
    db: AsyncSession,
) -> None:
    """
    Increase strength_score for existing weak_points that the user answered correctly.
    Only updates rows that already exist — correct answers on unknown topics are ignored.
    strength_score increases by 0.1 per correct answer (ceiling 1.0).
    """
    for q in correct_questions:
        topic = q.get("question", "")[:200]
        existing = await db.execute(
            select(WeakPoint).where(
                WeakPoint.user_id == user_id,
                WeakPoint.topic == topic,
            )
        )
        wp = existing.scalar_one_or_none()
        if wp:
            wp.strength_score = min(1.0, wp.strength_score + 0.1)


# ── BPS level calculation ───────────────────────────────────────────────────────


async def _calculate_cefr_level(user_id: UUID, db: AsyncSession) -> str:
    """
    Calculate the user's BPS proficiency level based on their last 3 standalone quiz attempts.

    Rule:
      avg_score >= 0.80 → BPS-4 (Upper-Intermediate)
      avg_score >= 0.60 → BPS-3 (Intermediate)
      avg_score >= 0.40 → BPS-2 (Elementary)
      otherwise         → BPS-1 (Beginner)

    Returns one of: "BPS-1", "BPS-2", "BPS-3", "BPS-4".
    If there are no attempts, returns "BPS-1".
    """
    result = await db.execute(
        select(StandaloneQuizAttempt)
        .where(StandaloneQuizAttempt.user_id == user_id)
        .order_by(StandaloneQuizAttempt.taken_at.desc())
        .limit(3)
    )
    attempts = result.scalars().all()

    if not attempts:
        return "BPS-1"

    avg_score = sum(a.score for a in attempts) / len(attempts)

    if avg_score >= 0.80:
        return "BPS-4"
    elif avg_score >= 0.60:
        return "BPS-3"
    elif avg_score >= 0.40:
        return "BPS-2"
    else:
        return "BPS-1"


# ── Standalone quiz (Phase 6) ───────────────────────────────────────────────────

# Redis cache key and TTL for standalone quiz questions (30 minutes)
_STANDALONE_QUIZ_CACHE_TTL = 1800


def _standalone_quiz_cache_key(user_id: UUID) -> str:
    """Redis key for a user's cached standalone quiz."""
    return f"quiz:standalone:user:{user_id}"


async def generate_standalone_quiz(user_id: UUID, db: AsyncSession) -> list[dict]:
    """
    Generate 15 adaptive questions tailored to the user's weak points and learning history.

    Question mix:
      - 6 MCQ          (40%)
      - 6 fill-in-blank (40%)
      - 3 translation   (20%)

    Context is built from:
      - Top 5 weakest weak_points (lowest strength_score)
      - Up to 15 most recent vocabulary_learned entries
      - Up to 8 most recent grammar_learned entries

    Falls back to general beginner Malay questions if the user has no history yet.

    Returns a list of question dicts WITH correct_answer (stored server-side only).
    Raises RuntimeError if Gemini returns too few questions.
    """
    # Load weak points (weakest first)
    wp_result = await db.execute(
        select(WeakPoint)
        .where(WeakPoint.user_id == user_id)
        .order_by(WeakPoint.strength_score.asc())
        .limit(5)
    )
    weak_points = wp_result.scalars().all()

    # Load recent vocabulary
    vocab_result = await db.execute(
        select(VocabularyLearned)
        .where(VocabularyLearned.user_id == user_id)
        .order_by(VocabularyLearned.learned_at.desc())
        .limit(15)
    )
    vocabulary = vocab_result.scalars().all()

    # Load recent grammar
    grammar_result = await db.execute(
        select(GrammarLearned)
        .where(GrammarLearned.user_id == user_id)
        .order_by(GrammarLearned.learned_at.desc())
        .limit(8)
    )
    grammar = grammar_result.scalars().all()

    # Build context sections for the prompt
    weak_point_section = ""
    if weak_points:
        lines = [
            f"- {wp.topic} (strength: {wp.strength_score:.1f}/1.0)"
            for wp in weak_points
        ]
        weak_point_section = "User's weakest areas (prioritise these):\n" + "\n".join(lines)
    else:
        weak_point_section = "No weak points recorded yet — generate general beginner Malay questions."

    vocab_section = ""
    if vocabulary:
        lines = [f"- {v.word} = {v.meaning}" for v in vocabulary]
        vocab_section = "Recently learned vocabulary:\n" + "\n".join(lines)

    grammar_section = ""
    if grammar:
        lines = [f"- {g.rule} (e.g. {g.example})" for g in grammar]
        grammar_section = "Recently learned grammar rules:\n" + "\n".join(lines)

    prompt = f"""You are an adaptive Malaysian Bahasa Melayu (Malay language) quiz generator for international students.

LANGUAGE RULES:
- Write all QUESTION TEXT and EXPLANATIONS in ENGLISH (students are English speakers learning Malay).
- The MALAY WORDS in questions/answers/options must use Malaysian Bahasa Melayu vocabulary \
(NOT Indonesian Malay): "kosong" for zero (NOT "sifar"/"nol"), "awak/kamu" for you, \
"kereta" for car (NOT "mobil"), "mahu" for want (NOT "mau"), standard Malaysian spelling.
- Do NOT write question text in Malay — questions are English prompts testing Malay knowledge.

Generate exactly 15 quiz questions personalised for this learner.

{weak_point_section}

{vocab_section}

{grammar_section}

Generate:
- 6 multiple-choice questions (MCQ) — 4 options each, one correct answer
- 6 fill-in-the-blank questions — student fills in one Malay word or short phrase
- 3 translation questions — student translates a short English phrase/sentence into Malay

Rules:
- Prioritise the user's weak areas above
- Use vocabulary and grammar from the user's learning history where possible
- MCQ distractors must be plausible Malaysian Malay words (not random noise)
- Fill-in-blank and translation must have exactly one accepted correct answer
- Vary difficulty slightly — mostly easy/medium since this is a language learner
- Each question needs a brief, helpful explanation of the correct answer
- For translation questions, the question should be the English sentence and correct_answer the Malay translation
- For vocabulary questions, include the IPA pronunciation in the explanation, e.g.: \
"'Air' /aɪr/ means water in Malaysian Malay."

Return ONLY valid JSON — no markdown, no prose:
{{
  "questions": [
    {{
      "id": "q1",
      "type": "mcq",
      "question": "What is the Malaysian Malay word for 'water'?",
      "options": ["air", "api", "tanah", "angin"],
      "correct_answer": "air",
      "explanation": "'Air' /aɪr/ means water in Malaysian Malay."
    }},
    {{
      "id": "q7",
      "type": "fill_in_blank",
      "question": "Complete: 'Saya _____ di rumah.' (I ___ at home)",
      "options": null,
      "correct_answer": "tinggal",
      "explanation": "'Tinggal' /tiŋ.gal/ means 'live/stay' in Malaysian Malay."
    }},
    {{
      "id": "q13",
      "type": "translation",
      "question": "Translate to Malaysian Malay: 'I want to eat rice.'",
      "options": null,
      "correct_answer": "Saya mahu makan nasi.",
      "explanation": "'Mahu' /ma.hu/ = want, 'makan' /ma.kan/ = eat, 'nasi' /na.si/ = rice."
    }}
  ]
}}

Generate all 15 questions now. Assign IDs q1 through q15."""

    data = await generate_json(prompt)
    questions = data.get("questions", [])

    if len(questions) < 8:
        logger.error(
            "Standalone quiz generation returned too few questions",
            count=len(questions),
            user_id=str(user_id),
        )
        raise RuntimeError(
            f"Standalone quiz generation failed: only {len(questions)} questions returned (expected 15)"
        )

    # Validate and normalise each question
    validated: list[dict] = []
    for q in questions:
        if not q.get("id") or not q.get("question") or not q.get("correct_answer"):
            continue
        q_type = q.get("type", "")
        if q_type not in ("mcq", "fill_in_blank", "translation"):
            q["type"] = "mcq" if q.get("options") else "fill_in_blank"
        validated.append(q)

    logger.info(
        "Standalone quiz generated",
        user_id=str(user_id),
        count=len(validated),
        weak_points=len(weak_points),
    )
    return validated


async def get_standalone_quiz(user_id: UUID, db: AsyncSession) -> dict:
    """
    Get the adaptive standalone quiz for a user.

    - Serves cached questions from Redis if available (30-minute window).
    - Otherwise generates a new quiz via Gemini and caches it.
    - correct_answer is stripped before returning to the frontend.
    """
    cache_key = _standalone_quiz_cache_key(user_id)
    cached = await cache_get(cache_key)

    if cached:
        questions_full = cached
        logger.info("Standalone quiz served from cache", user_id=str(user_id))
    else:
        questions_full = await generate_standalone_quiz(user_id, db)
        await cache_set(cache_key, questions_full, ttl=_STANDALONE_QUIZ_CACHE_TTL)
        logger.info(
            "Standalone quiz generated and cached",
            user_id=str(user_id),
            count=len(questions_full),
        )

    # Strip correct_answer before sending to frontend
    questions_out = [
        {
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "options": q.get("options"),
        }
        for q in questions_full
    ]

    return {
        "questions": questions_out,
        "question_count": len(questions_out),
    }


async def submit_standalone_quiz(
    user_id: UUID,
    user_answers: list[dict],
    db: AsyncSession,
) -> dict:
    """
    Score a standalone adaptive quiz submission.

    Steps:
    1. Load questions (with correct answers) from Redis cache
    2. Score each submitted answer (case-insensitive)
    3. Update weak_points: wrong answers decrease strength, correct answers increase it
    4. Save StandaloneQuizAttempt to DB
    5. Recalculate CEFR proficiency level
    6. Update user.proficiency_level in DB if level changed
    7. Clear quiz cache
    8. Return score, per-question results, new CEFR level, and whether level changed
    """
    cache_key = _standalone_quiz_cache_key(user_id)
    questions_full: list[dict] | None = await cache_get(cache_key)

    if not questions_full:
        logger.warning(
            "Standalone quiz cache miss on submit — regenerating for scoring",
            user_id=str(user_id),
        )
        questions_full = await generate_standalone_quiz(user_id, db)

    # Build answer lookup by question_id
    answer_map = {a["question_id"]: a["answer"].strip() for a in user_answers}

    question_results: list[dict] = []
    correct_count = 0
    wrong_questions: list[dict] = []
    correct_questions: list[dict] = []

    for q in questions_full:
        qid = q["id"]
        user_ans = answer_map.get(qid, "").strip()
        correct_ans = q.get("correct_answer", "").strip()

        # Case-insensitive match for all question types
        is_correct = user_ans.lower() == correct_ans.lower()

        if is_correct:
            correct_count += 1
            correct_questions.append(q)
        else:
            wrong_questions.append(q)

        question_results.append({
            "question_id": qid,
            "question": q["question"],
            "your_answer": user_ans,
            "correct_answer": correct_ans,
            "is_correct": is_correct,
            "explanation": q.get("explanation", ""),
        })

    total = len(questions_full)
    score = correct_count / total if total > 0 else 0.0

    # Update weak points based on performance
    if wrong_questions:
        await _update_weak_points(user_id, wrong_questions, db)
    if correct_questions:
        await _improve_weak_points(user_id, correct_questions, db)

    # Persist quiz attempt
    answers_json = [
        {
            "question_id": r["question_id"],
            "answer": r["your_answer"],
            "correct": r["is_correct"],
            "type": next(
                (q["type"] for q in questions_full if q["id"] == r["question_id"]),
                "mcq",
            ),
        }
        for r in question_results
    ]

    db.add(
        StandaloneQuizAttempt(
            user_id=user_id,
            score=score,
            questions_json=questions_full,
            answers_json=answers_json,
        )
    )
    await db.flush()  # flush so the new attempt is visible to _calculate_cefr_level

    # Calculate new BPS level
    new_level = await _calculate_cefr_level(user_id, db)

    # Load current user proficiency level and update if changed
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    previous_level = user.proficiency_level if user else "BPS-1"
    level_changed = new_level != previous_level

    if user and level_changed:
        user.proficiency_level = new_level

    await db.commit()

    # Clear cache — next quiz will be freshly generated
    await cache_delete(cache_key)

    # If BPS level advanced, generate a milestone card notification + set journey flag
    if level_changed and new_level > previous_level and user:
        user_name = user.name or "Learner"
        asyncio.create_task(
            _generate_and_save_milestone_card(
                user_id=user_id,
                bps_level=new_level,
                user_name=user_name,
            )
        )
        # Notify journey service so it can offer to regenerate uncompleted elements
        from backend.services import journey_service as _journey_service
        asyncio.create_task(
            _journey_service.check_bps_change(
                user_id=user_id,
                old_bps=previous_level,
                new_bps=new_level,
            )
        )

    logger.info(
        "Standalone quiz scored",
        user_id=str(user_id),
        score=round(score, 2),
        correct=correct_count,
        total=total,
        previous_level=previous_level,
        new_level=new_level,
        level_changed=level_changed,
    )

    return {
        "score": round(score, 4),
        "score_percent": round(score * 100),
        "correct_count": correct_count,
        "total_questions": total,
        "question_results": question_results,
        "new_proficiency_level": new_level,
        "previous_proficiency_level": previous_level,
        "level_changed": level_changed,
    }


async def _generate_and_save_milestone_card(
    user_id: UUID,
    bps_level: str,
    user_name: str,
) -> None:
    """
    Background task: generate a BPS milestone card image and save it as a
    'bps_milestone' notification with image_url populated.
    Opens its own DB session — safe to run after the request session has closed.
    """
    from backend.db.database import AsyncSessionLocal
    from backend.models.notification import Notification
    from backend.services.image_service import generate_milestone_card

    try:
        image_url = await generate_milestone_card(bps_level, user_name)

        level_labels = {
            "BPS-1": "Beginner",
            "BPS-2": "Elementary",
            "BPS-3": "Intermediate",
            "BPS-4": "Advanced",
        }
        level_name = level_labels.get(bps_level, bps_level)
        message = f"You've reached {bps_level} ({level_name})! Your Malay proficiency has advanced."

        async with AsyncSessionLocal() as db:
            notification = Notification(
                user_id=user_id,
                type="bps_milestone",
                message=message,
                image_url=image_url,  # None if generation failed — that's fine
                read=False,
            )
            db.add(notification)
            await db.commit()
            logger.info(
                "BPS milestone notification created",
                user_id=str(user_id),
                bps_level=bps_level,
                has_image=bool(image_url),
            )
    except Exception as exc:
        logger.error(
            "Milestone card background task failed",
            user_id=str(user_id),
            bps_level=bps_level,
            error=str(exc),
        )
