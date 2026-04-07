"""
Spelling Service

Handles word selection and answer evaluation for the Spelling Practice Game.

Design decisions:
  - Smart word selection: words that were previously answered incorrectly
    get a higher selection weight (Leitner-box-inspired spaced repetition).
  - Levenshtein fuzzy matching: answers within edit-distance 1 are flagged
    as "almost correct" rather than flat-out wrong, improving UX without
    inflating the score.
  - IPA is extracted from the vocabulary_learned.meaning field when present
    (format: "/ipa/" or stored inline). If no IPA exists we return None
    and the frontend falls back to the Web Speech API pronunciation.

Redis keys:
  spelling:wrong:<user_id>  → JSON list of word IDs that were answered
                               incorrectly this session (reset on new session).
  spelling:seen:<user_id>   → JSON list of word IDs shown in the last 10
                               rounds (prevents same word repeating).
"""

import json
import random
import re
import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.game import SpellingGameScore
from backend.models.progress import VocabularyLearned
from backend.utils.cache import cache_get, cache_set
from backend.utils.logger import get_logger

logger = get_logger(__name__)

# Redis key templates
_WRONG_KEY = "spelling:wrong:{}"
_SEEN_KEY = "spelling:seen:{}"
_WRONG_TTL = 3600   # 1 hour — matches a game session
_SEEN_TTL = 3600


# ── IPA extraction ─────────────────────────────────────────────────────────────


def _extract_ipa(meaning: str) -> str | None:
    """
    Try to pull an IPA transcription from a meaning string.

    Looks for text enclosed in forward-slashes: /ipa.text.here/
    Returns the IPA string (with slashes) or None if not found.
    """
    match = re.search(r"(/[^/\n]{1,60}/)", meaning)
    return match.group(1) if match else None


# ── Levenshtein distance ───────────────────────────────────────────────────────


def _levenshtein(a: str, b: str) -> int:
    """
    Compute the Levenshtein edit distance between two strings.
    Standard DP implementation — O(m*n) time, O(n) space.
    """
    a, b = a.lower().strip(), b.lower().strip()
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)

    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        curr = [i]
        for j, cb in enumerate(b, 1):
            cost = 0 if ca == cb else 1
            curr.append(min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost))
        prev = curr
    return prev[-1]


# ── Word selection ─────────────────────────────────────────────────────────────


async def get_next_word(
    user_id: uuid.UUID,
    db: AsyncSession,
) -> dict | None:
    """
    Pick the next vocabulary word for the spelling game.

    Selection strategy (weighted):
      1. Load all vocabulary_learned rows for this user.
      2. Boost weight ×3 for words the user got wrong this session
         (encourages re-testing weak spots immediately).
      3. Exclude the last 10 words shown to avoid immediate repetition.
      4. If the user has fewer than 3 words, return None so the frontend
         can show an "earn more vocabulary first" message.

    Returns a dict with keys: id, word, meaning, ipa, source_type
    or None if the user has no vocabulary yet.
    """
    result = await db.execute(
        select(VocabularyLearned).where(VocabularyLearned.user_id == user_id)
    )
    all_vocab: list[VocabularyLearned] = result.scalars().all()

    if len(all_vocab) < 1:
        return None

    # Load Redis state
    wrong_ids_raw = await cache_get(_WRONG_KEY.format(user_id))
    seen_ids_raw = await cache_get(_SEEN_KEY.format(user_id))

    wrong_ids: set[str] = set(json.loads(wrong_ids_raw)) if wrong_ids_raw else set()
    seen_ids: list[str] = json.loads(seen_ids_raw) if seen_ids_raw else []
    recent_seen: set[str] = set(seen_ids[-10:])  # last 10 words

    # Build weighted pool
    pool: list[tuple[VocabularyLearned, float]] = []
    for vocab in all_vocab:
        vid = str(vocab.id)
        if vid in recent_seen:
            continue  # skip recently shown words
        weight = 3.0 if vid in wrong_ids else 1.0
        pool.append((vocab, weight))

    # If all words are in the recent window, allow any word (avoid infinite loop)
    if not pool:
        pool = [(v, 1.0) for v in all_vocab]

    # Weighted random choice
    total_weight = sum(w for _, w in pool)
    rand_val = random.uniform(0, total_weight)
    cumulative = 0.0
    chosen: VocabularyLearned = pool[0][0]
    for vocab, weight in pool:
        cumulative += weight
        if rand_val <= cumulative:
            chosen = vocab
            break

    # Update seen list (ring buffer of 20)
    seen_ids.append(str(chosen.id))
    if len(seen_ids) > 20:
        seen_ids = seen_ids[-20:]
    await cache_set(_SEEN_KEY.format(user_id), json.dumps(seen_ids), ttl=_SEEN_TTL)

    return {
        "id": str(chosen.id),
        "word": chosen.word,
        "meaning": chosen.meaning,
        "ipa": _extract_ipa(chosen.meaning),
        "source_type": chosen.source_type,
    }


# ── Answer evaluation ──────────────────────────────────────────────────────────


async def evaluate_answer(
    user_id: uuid.UUID,
    vocab_id: str,
    user_answer: str,
    db: AsyncSession,
) -> dict:
    """
    Evaluate the user's spelling attempt.

    Outcomes:
      - correct   (distance == 0): award XP, remove from wrong-list
      - almost    (distance == 1): no XP, gentle hint shown
      - incorrect (distance >= 2): mark in wrong-list, show correct answer

    Returns a dict with:
      correct: bool
      almost:  bool   (True only when distance == 1)
      correct_word: str
      ipa: str | None
      meaning: str
      xp_awarded: int
    """
    # Fetch the vocab row
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
            "almost": False,
            "correct_word": "",
            "ipa": None,
            "meaning": "",
            "xp_awarded": 0,
            "error": "Word not found",
        }

    distance = _levenshtein(user_answer, vocab.word)

    correct = distance == 0
    almost = distance == 1
    xp_awarded = 2 if correct else 0

    # Update wrong-list in Redis
    wrong_key = _WRONG_KEY.format(user_id)
    wrong_ids_raw = await cache_get(wrong_key)
    wrong_ids: list[str] = json.loads(wrong_ids_raw) if wrong_ids_raw else []

    if correct:
        # Remove from wrong list once answered correctly
        if vocab_id in wrong_ids:
            wrong_ids.remove(vocab_id)
    elif not almost:
        # Add to wrong list (deduplicated)
        if vocab_id not in wrong_ids:
            wrong_ids.append(vocab_id)

    await cache_set(wrong_key, json.dumps(wrong_ids), ttl=_WRONG_TTL)

    return {
        "correct": correct,
        "almost": almost,
        "correct_word": vocab.word,
        "ipa": _extract_ipa(vocab.meaning),
        "meaning": vocab.meaning,
        "xp_awarded": xp_awarded,
    }


# ── Session persistence ────────────────────────────────────────────────────────


async def save_session_score(
    user_id: uuid.UUID,
    words_correct: int,
    words_attempted: int,
    db: AsyncSession,
) -> None:
    """
    Persist a completed spelling game session score.

    One row per calendar day — if the user plays again today, we upsert
    (update whichever run had more correct answers).
    """
    today = date.today()

    # Check for an existing score today
    result = await db.execute(
        select(SpellingGameScore).where(
            SpellingGameScore.user_id == user_id,
            SpellingGameScore.session_date == today,
        )
    )
    existing: SpellingGameScore | None = result.scalar_one_or_none()

    if existing:
        # Keep the better run
        if words_correct > existing.words_correct:
            existing.words_correct = words_correct
            existing.words_attempted = words_attempted
            await db.commit()
    else:
        score = SpellingGameScore(
            user_id=user_id,
            words_correct=words_correct,
            words_attempted=words_attempted,
            session_date=today,
        )
        db.add(score)
        await db.commit()

    logger.info(
        "Spelling session score saved",
        user_id=str(user_id),
        correct=words_correct,
        attempted=words_attempted,
    )


async def get_personal_best(user_id: uuid.UUID, db: AsyncSession) -> dict:
    """
    Return the user's best spelling game score (most words correct in a session).
    """
    result = await db.execute(
        select(
            func.max(SpellingGameScore.words_correct).label("best_correct"),
            func.max(SpellingGameScore.words_attempted).label("best_attempted"),
        ).where(SpellingGameScore.user_id == user_id)
    )
    row = result.one()
    return {
        "best_correct": row.best_correct or 0,
        "best_attempted": row.best_attempted or 0,
    }
