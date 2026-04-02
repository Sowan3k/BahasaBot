"""
Course Schemas (Pydantic v2)

Request/response models for course generation, retrieval, and progress tracking.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


# ── Vocabulary / Example sub-types ────────────────────────────────────────────


class VocabularyItem(BaseModel):
    word: str
    meaning: str
    example: str


class ExampleSentence(BaseModel):
    bm: str
    en: str


# ── Request Schemas ───────────────────────────────────────────────────────────


class CourseGenerateRequest(BaseModel):
    topic: str = Field(
        ...,
        min_length=3,
        max_length=300,
        description="The topic to generate a Malay language course about",
    )


# ── Class Schemas ─────────────────────────────────────────────────────────────


class ClassSummary(BaseModel):
    """Lightweight class info used in module listings — no full content."""

    id: UUID
    module_id: UUID
    title: str
    order_index: int
    is_completed: bool = False

    model_config = {"from_attributes": True}


class ClassOut(BaseModel):
    """Full class data including lesson content, vocabulary, and examples."""

    id: UUID
    module_id: UUID
    title: str
    content: str
    vocabulary_json: list[VocabularyItem] = []
    examples_json: list[ExampleSentence] = []
    order_index: int
    created_at: datetime
    is_completed: bool = False
    module_title: str = ""
    course_title: str = ""

    model_config = {"from_attributes": True}


# ── Module Schemas ────────────────────────────────────────────────────────────


class ModuleOut(BaseModel):
    """Module with its class list and lock/completion state."""

    id: UUID
    course_id: UUID
    title: str
    description: str
    order_index: int
    created_at: datetime
    classes: list[ClassSummary] = []
    is_locked: bool = False
    is_completed: bool = False
    quiz_available: bool = False

    model_config = {"from_attributes": True}


# ── Course Schemas ────────────────────────────────────────────────────────────


class CourseSummary(BaseModel):
    """Lightweight course info for the courses list page."""

    id: UUID
    title: str
    description: str
    topic: str
    created_at: datetime
    total_classes: int = 0
    completed_classes: int = 0
    module_count: int = 0

    model_config = {"from_attributes": True}


class CourseOut(BaseModel):
    """Full course tree with all modules, classes, and progress state."""

    id: UUID
    user_id: UUID
    title: str
    description: str
    topic: str
    objectives: list[str] = []
    created_at: datetime
    modules: list[ModuleOut] = []
    total_classes: int = 0
    completed_classes: int = 0

    model_config = {"from_attributes": True}


# ── Response Schemas ──────────────────────────────────────────────────────────


class CourseGenerateResponse(BaseModel):
    """Returned immediately (HTTP 202) after submitting a generation request."""
    job_id: str
    message: str = "Course generation started"


class JobStatusResponse(BaseModel):
    """Returned by GET /api/courses/jobs/{job_id} — frontend polls this."""
    job_id: str
    status: str          # "pending" | "running" | "complete" | "failed"
    progress: int        # 0–100
    step: str            # Human-readable current step
    course_id: str | None = None   # Set when status == "complete"
    error: str | None = None       # Set when status == "failed"


class ClassCompleteResponse(BaseModel):
    class_id: UUID
    completed: bool
    all_module_classes_done: bool
    quiz_unlocked: bool
