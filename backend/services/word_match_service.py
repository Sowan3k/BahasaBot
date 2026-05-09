"""
Word Match Service

Handles question generation and answer evaluation for the Word Match game.

Game concept:
  A Malay word is shown. The user picks the correct English meaning from
  4 multiple-choice options. Tests vocabulary recognition (as opposed to
  the Spelling game which tests recall/production).

Design decisions:
  - Distractor selection: 3 other words from the user's own vocabulary pool,
    deduplicated by meaning so no two options look identical.
  - Leitner-inspired wrong-list: words answered incorrectly get 3× selection
    weight, same strategy as the Spelling game.
  - Minimum vocab threshold: 4 words are required to generate a meaningful
    question with 3 distinct distractors. The endpoint returns 404 otherwise.

Redis keys:
  wordmatch:wrong:<user_id>  → JSON list of vocab IDs answered incorrectly
                                this session (TTL 1 hour).
  wordmatch:seen:<user_id>   → JSON list of last 20 word IDs shown (ring
                                buffer, prevents immediate repetition).
"""

import json
import random
import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.game import SpellingGameScore
from backend.models.progress import VocabularyLearned
from backend.services.spelling_service import _extract_ipa, save_session_score
from backend.utils.cache import cache_get, cache_set
from backend.utils.logger import get_logger

logger = get_logger(__name__)

# Redis key templates (separate namespace from spelling)
_WRONG_KEY = "wordmatch:wrong:{}"
_SEEN_KEY = "wordmatch:seen:{}"
_WRONG_TTL = 3600
_SEEN_TTL = 3600

# XP per correct answer by difficulty (MCQ is easier, so XP is lower)
WORD_MATCH_XP_TABLE: dict[str, int] = {"easy": 1, "medium": 1, "hard": 2}

# Minimum vocabulary size required to generate a question with 3 distractors
_MIN_VOCAB = 4


# ── Question generation ────────────────────────────────────────────────────────


async def get_word_match_question(
    user_id: uuid.UUID,
    db: AsyncSession,
) -> dict | None:
    """
    Generate a Word Match question for the given user.

    Picks one target word (boosted selection for previously wrong words) and
    3 distractors with distinct meanings. Returns None if the user has fewer
    than 4 vocabulary words or cannot produce 3 unique-meaning distractors.

    Returns a dict with:
      id: str  (vocab_id of the correct word)
      word: str
      ipa: str | None
      options: list[str]  (4 shuffled English meanings)
      correct_index: int   (0–3, index of correct meaning in options)
    """
    result = await db.execute(
        select(VocabularyLearned).where(VocabularyLearned.user_id == user_id)
    )
    all_vocab: list[VocabularyLearned] = result.scalars().all()

    if len(all_vocab) < _MIN_VOCAB:
        return None

    # Load Redis state
    wrong_ids_raw = await cache_get(_WRONG_KEY.format(user_id))
    seen_ids_raw = await cache_get(_SEEN_KEY.format(user_id))
    wrong_ids: set[str] = set(json.loads(wrong_ids_raw)) if wrong_ids_raw else set()
    seen_ids: list[str] = json.loads(seen_ids_raw) if seen_ids_raw else []
    recent_seen: set[str] = set(seen_ids[-10:])

    # Build weighted pool for the target word (exclude recently seen)
    pool: list[tuple[VocabularyLearned, float]] = []
    for vocab in all_vocab:
        vid = str(vocab.id)
        if vid in recent_seen:
            continue
        weight = 3.0 if vid in wrong_ids else 1.0
        pool.append((vocab, weight))

    if not pool:
        pool = [(v, 1.0) for v in all_vocab]

    # Weighted random choice for the target word
    total_weight = sum(w for _, w in pool)
    rand_val = random.uniform(0, total_weight)
    cumulative = 0.0
    target: VocabularyLearned = pool[0][0]
    for vocab, weight in pool:
        cumulative += weight
        if rand_val <= cumulative:
            target = vocab
            break

    # Update seen list (ring buffer of 20)
    seen_ids.append(str(target.id))
    if len(seen_ids) > 20:
        seen_ids = seen_ids[-20:]
    await cache_set(_SEEN_KEY.format(user_id), json.dumps(seen_ids), ttl=_SEEN_TTL)

    # Build distractor pool: all other vocab with DIFFERENT meanings
    correct_meaning_norm = target.meaning.lower().strip()
    distractor_candidates: list[VocabularyLearned] = [
        v for v in all_vocab
        if str(v.id) != str(target.id)
        and v.meaning.lower().strip() != correct_meaning_norm
    ]

    if len(distractor_candidates) < 3:
        # Not enough unique-meaning distractors
        return None

    distractors = random.sample(distractor_candidates, 3)

    # Build shuffled options list and record correct_index
    options_vocab = [target] + distractors
    random.shuffle(options_vocab)
    options: list[str] = [v.meaning for v in options_vocab]
    correct_index: int = next(
        i for i, v in enumerate(options_vocab) if str(v.id) == str(target.id)
    )

    return {
        "id": str(target.id),
        "word": target.word,
        "ipa": _extract_ipa(target.meaning),
        "options": options,
        "correct_index": correct_index,
    }


# ── Answer evaluation ──────────────────────────────────────────────────────────


async def evaluate_word_match(
    user_id: uuid.UUID,
    vocab_id: str,
    selected_meaning: str,
    difficulty: str,
    db: AsyncSession,
) -> dict:
    """
    Evaluate a Word Match answer.

    The user's selected meaning is compared against the stored meaning for
    the given vocab_id. Comparison is case-insensitive and strip-whitespace.

    Returns a dict with:
      correct: bool
      correct_meaning: str
      xp_awarded: int
    """
    result = await db.execute(
        select(VocabularyLearned).where(
            VocabularyLearned.id == uuid.UUID(vocab_id),
            VocabularyLearned.user_id == user_id,
        )
    )
    vocab: VocabularyLearned | None = result.scalar_one_or_none()

    if not vocab:
        return {
            "correct": False,
            "correct_meaning": "",
            "xp_awarded": 0,
            "error": "Word not found",
        }

    correct = selected_meaning.strip().lower() == vocab.meaning.strip().lower()
    xp_awarded = WORD_MATCH_XP_TABLE.get(difficulty, 1) if correct else 0

    # Update Redis wrong-list
    wrong_key = _WRONG_KEY.format(user_id)
    wrong_ids_raw = await cache_get(wrong_key)
    wrong_ids: list[str] = json.loads(wrong_ids_raw) if wrong_ids_raw else []

    if correct:
        if vocab_id in wrong_ids:
            wrong_ids.remove(vocab_id)
    else:
        if vocab_id not in wrong_ids:
            wrong_ids.append(vocab_id)

    await cache_set(wrong_key, json.dumps(wrong_ids), ttl=_WRONG_TTL)

    return {
        "correct": correct,
        "correct_meaning": vocab.meaning,
        "xp_awarded": xp_awarded,
    }


# ── Session persistence ────────────────────────────────────────────────────────


async def save_word_match_session(
    user_id: uuid.UUID,
    words_correct: int,
    words_attempted: int,
    db: AsyncSession,
) -> None:
    """Persist a completed Word Match session score (delegates to save_session_score)."""
    await save_session_score(
        user_id=user_id,
        words_correct=words_correct,
        words_attempted=words_attempted,
        db=db,
        game_type="word_match",
    )


async def get_word_match_best(user_id: uuid.UUID, db: AsyncSession) -> dict:
    """Return the user's best Word Match session score."""
    result = await db.execute(
        select(
            func.max(SpellingGameScore.words_correct).label("best_correct"),
            func.max(SpellingGameScore.words_attempted).label("best_attempted"),
        ).where(
            SpellingGameScore.user_id == user_id,
            SpellingGameScore.game_type == "word_match",
        )
    )
    row = result.one()
    return {
        "best_correct": row.best_correct or 0,
        "best_attempted": row.best_attempted or 0,
    }
