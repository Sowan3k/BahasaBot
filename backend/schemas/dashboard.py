"""
Dashboard Schemas (Pydantic v2)

Request/response models for /api/dashboard/* endpoints.
"""

from datetime import datetime

from pydantic import BaseModel


# ── Stat summary ───────────────────────────────────────────────────────────────


class DashboardStats(BaseModel):
    """Aggregate learning statistics shown at the top of the dashboard."""

    courses_created: int
    modules_completed: int
    classes_completed: int
    quizzes_taken: int
    vocabulary_count: int
    grammar_count: int
    proficiency_level: str  # BPS-1 | BPS-2 | BPS-3 | BPS-4
    streak_count: int = 0
    xp_total: int = 0


# ── Vocabulary ─────────────────────────────────────────────────────────────────


class VocabularyEntry(BaseModel):
    """A single vocabulary word entry."""

    id: str
    word: str
    meaning: str
    source_type: str        # "chatbot" | "course"
    source_name: str        # "AI Chatbot" or the course title
    learned_at: datetime


class VocabularyListResponse(BaseModel):
    items: list[VocabularyEntry]
    total: int
    page: int
    limit: int


# ── Grammar ────────────────────────────────────────────────────────────────────


class GrammarEntry(BaseModel):
    """A single grammar rule entry."""

    id: str
    rule: str
    example: str
    source_type: str
    source_name: str
    learned_at: datetime


class GrammarListResponse(BaseModel):
    items: list[GrammarEntry]
    total: int
    page: int
    limit: int


# ── Progress ───────────────────────────────────────────────────────────────────


class CourseProgressItem(BaseModel):
    """Progress summary for a single course."""

    course_id: str
    course_title: str
    total_classes: int
    completed_classes: int
    progress_percent: float  # 0–100


class ProgressResponse(BaseModel):
    courses: list[CourseProgressItem]
    total_modules: int
    completed_modules: int


# ── Weak points ────────────────────────────────────────────────────────────────


class WeakPointEntry(BaseModel):
    """A single weak area with a strength score and a study recommendation."""

    id: str
    topic: str
    type: str               # "vocab" | "grammar"
    strength_score: float   # 0.0 (very weak) → 1.0 (mastered)
    recommendation: str     # short text: what to study next


class WeakPointsResponse(BaseModel):
    weak_points: list[WeakPointEntry]
    total: int


# ── Quiz history ───────────────────────────────────────────────────────────────


class QuizHistoryEntry(BaseModel):
    """One quiz attempt in the history table."""

    id: str
    quiz_type: str          # "module" | "standalone"
    module_title: str | None  # set for module quizzes, null for standalone
    score: float            # 0.0–1.0
    score_percent: int      # 0–100
    passed: bool
    taken_at: datetime


class QuizHistoryResponse(BaseModel):
    items: list[QuizHistoryEntry]
    total: int
    page: int
    limit: int


# ── Full dashboard summary ─────────────────────────────────────────────────────


class DashboardSummaryResponse(BaseModel):
    """
    All data needed for the dashboard landing view.
    Redis-cached for 5 minutes per user.
    """

    stats: DashboardStats
    recent_vocabulary: list[VocabularyEntry]    # last 5 words learned
    recent_grammar: list[GrammarEntry]          # last 5 grammar rules
    top_weak_points: list[WeakPointEntry]       # top 3 weakest areas
    recent_quiz_history: list[QuizHistoryEntry] # last 5 quiz attempts
