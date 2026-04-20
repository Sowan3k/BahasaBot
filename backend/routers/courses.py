"""
Courses Router — /api/courses/*

Endpoints:
  POST   /api/courses/generate                                         — kick off background course generation (returns job_id)
  GET    /api/courses/jobs/{job_id}                                    — poll background job status (Phase 9)
  GET    /api/courses/                                                  — list user's courses (paginated)
  GET    /api/courses/{course_id}                                       — full course tree with progress
  GET    /api/courses/{course_id}/modules/{module_id}/classes/{class_id} — get single class detail
  POST   /api/courses/{course_id}/modules/{module_id}/classes/{class_id}/complete — mark class done
  GET    /api/courses/{course_id}/modules/{module_id}/quiz              — get module quiz (Phase 5)
  POST   /api/courses/{course_id}/modules/{module_id}/quiz              — submit module quiz (Phase 5)
"""

import base64
import os
import uuid
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_db, AsyncSessionLocal
from backend.middleware.auth_middleware import get_current_user
from backend.middleware.rate_limiter import COURSE_GEN_LIMIT, limiter
from backend.models.user import User
from backend.schemas.course import (
    ClassCompleteResponse,
    CourseGenerateRequest,
    CourseGenerateResponse,
    JobStatusResponse,
)
from backend.schemas.quiz import (
    ModuleQuizResponse,
    ModuleQuizResultResponse,
    ModuleQuizSubmitRequest,
)
from backend.services.course_service import (
    _update_job,
    delete_course,
    generate_course,
    get_class_detail,
    get_course_with_progress,
    get_courses_list,
    mark_class_complete,
)
from backend.services.gamification_service import create_notification_fire_and_forget
from backend.services.quiz_service import get_module_quiz, submit_module_quiz
from backend.utils.cache import cache_get
from backend.utils.content_filter import is_topic_appropriate
from backend.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


# ── Background task runner ─────────────────────────────────────────────────────


async def _run_generation_task(
    job_id: str,
    topic: str,
    user_id: UUID,
    level: str,
) -> None:
    """
    Runs the full course generation pipeline in the background with its own DB session.

    Writes progress milestones to Redis via _update_job() so the frontend can poll
    GET /api/courses/jobs/{job_id}.  Any exception is caught here — it writes a
    "failed" status to Redis rather than crashing the worker.
    """
    async with AsyncSessionLocal() as db:
        try:
            course = await generate_course(
                topic=topic,
                user_id=user_id,
                db=db,
                level=level,
                job_id=job_id,
            )
            # Notify the user that their course is ready
            await create_notification_fire_and_forget(
                db=db,
                user_id=user_id,
                notification_type="course_complete",
                message=f"Your course \"{course.title}\" is ready! Head to Courses to start learning.",
            )
        except Exception as exc:
            logger.error(
                "Background course generation failed",
                job_id=job_id,
                error=str(exc),
                user_id=str(user_id),
            )
            app_env = os.getenv("APP_ENV", "development")
            error_msg = str(exc) if app_env == "development" else "Course generation failed. Please try again."
            await _update_job(job_id, "failed", 0, "Generation failed", error=error_msg)


# ── Generate course ────────────────────────────────────────────────────────────


@router.post("/generate", response_model=CourseGenerateResponse, status_code=status.HTTP_202_ACCEPTED)
@limiter.limit(COURSE_GEN_LIMIT)
async def generate_course_endpoint(
    request: Request,
    body: CourseGenerateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CourseGenerateResponse:
    """
    Kick off course generation in the background (non-blocking).

    Returns HTTP 202 immediately with a job_id.
    The client polls GET /api/courses/jobs/{job_id} every 3 s for progress.
    """
    # Content filter — server-side validation (never trust frontend alone)
    is_ok, reason = await is_topic_appropriate(body.topic)
    if not is_ok:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Topic rejected: {reason}",
        )

    job_id = str(uuid.uuid4())
    level = current_user.proficiency_level or "BPS-1"

    # Write initial "pending" state so the first poll doesn't return 404
    await _update_job(job_id, "pending", 0, "Queued…")

    background_tasks.add_task(
        _run_generation_task,
        job_id=job_id,
        topic=body.topic,
        user_id=current_user.id,
        level=level,
    )

    logger.info("Course generation queued", job_id=job_id, topic=body.topic, user_id=str(current_user.id))
    return CourseGenerateResponse(job_id=job_id)


# ── Poll job status ────────────────────────────────────────────────────────────
# IMPORTANT: This route MUST be declared before /{course_id} to avoid FastAPI
# treating "jobs" as a UUID path parameter.


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(
    job_id: str,
    current_user: User = Depends(get_current_user),
) -> JobStatusResponse:
    """
    Poll the status of a background course generation job.

    Returns the current progress (0–100), status string, and course_id once complete.
    Returns 404 if the job is unknown or has expired from Redis.
    """
    data = await cache_get(f"course_job:{job_id}")
    if data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or expired",
        )
    return JobStatusResponse(**data)


# ── List courses ───────────────────────────────────────────────────────────────


@router.get("/")
async def list_courses(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """List user's courses with progress summary (paginated)."""
    return await get_courses_list(current_user.id, db, page, limit)


# ── Get course detail ──────────────────────────────────────────────────────────


@router.get("/{course_id}")
async def get_course(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get full course tree with modules, classes, lock states, and progress."""
    course = await get_course_with_progress(course_id, current_user.id, db)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


# ── Course cover image ─────────────────────────────────────────────────────────


@router.get("/{course_id}/cover")
async def get_course_cover(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Serve the course cover image as raw bytes.

    No auth required — course UUIDs are 128-bit random and unguessable.
    Returns Cache-Control: immutable so the browser caches permanently after
    the first fetch; subsequent page loads cost 0 bytes for cover images.
    """
    from sqlalchemy import select as sa_select
    from backend.models.course import Course

    result = await db.execute(
        sa_select(Course.cover_image_url).where(Course.id == course_id)
    )
    cover_data_url: str | None = result.scalar_one_or_none()

    if not cover_data_url or not cover_data_url.startswith("data:"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No cover image")

    try:
        header, b64data = cover_data_url.split(",", 1)
        mime = header.split(";")[0].split(":")[1]  # e.g. "image/jpeg"
        image_bytes = base64.b64decode(b64data)
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Invalid cover data")

    return Response(
        content=image_bytes,
        media_type=mime,
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


# ── Delete course ──────────────────────────────────────────────────────────────


@router.delete("/{course_id}")
async def delete_course_endpoint(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Delete a course and all its modules, classes, and progress data."""
    deleted = await delete_course(course_id, current_user.id, db)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return {"deleted": True}


# ── Get class detail ───────────────────────────────────────────────────────────


@router.get("/{course_id}/modules/{module_id}/classes/{class_id}")
async def get_class(
    course_id: UUID,
    module_id: UUID,
    class_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get full content for a single class."""
    cls = await get_class_detail(course_id, module_id, class_id, current_user.id, db)
    if not cls:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    return cls


# ── Mark class complete ────────────────────────────────────────────────────────


@router.post(
    "/{course_id}/modules/{module_id}/classes/{class_id}/complete",
    response_model=ClassCompleteResponse,
)
async def complete_class(
    course_id: UUID,
    module_id: UUID,
    class_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ClassCompleteResponse:
    """
    Mark a class as complete.
    Saves vocabulary from the class to the user's learning record.
    Returns whether all classes in the module are now done (quiz_unlocked).
    """
    try:
        result = await mark_class_complete(
            user_id=current_user.id,
            course_id=course_id,
            module_id=module_id,
            class_id=class_id,
            db=db,
        )
    except Exception as exc:
        logger.error(
            "mark_class_complete raised an unexpected exception",
            error=str(exc),
            class_id=str(class_id),
            user_id=str(current_user.id),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save progress. Please try again.",
        )
    if "error" in result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result["error"])

    # Award 10 XP + update streak for completing a class — fire-and-forget
    try:
        from backend.services.gamification_service import record_learning_activity
        await record_learning_activity(user_id=current_user.id, db=db, xp_amount=10, source="class_complete")
    except Exception:
        pass

    return ClassCompleteResponse(**result)


# ── Module quiz ────────────────────────────────────────────────────────────────


@router.get(
    "/{course_id}/modules/{module_id}/quiz",
    response_model=ModuleQuizResponse,
)
async def get_module_quiz_endpoint(
    course_id: UUID,
    module_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ModuleQuizResponse:
    """
    Get the auto-generated quiz for a module.

    - Returns already_passed=True if the user already passed this module's quiz.
    - Serves a cached quiz from Redis if one exists (2-hour TTL).
    - Otherwise generates 10 questions (6 MCQ + 4 fill-in-blank) from module content via Gemini.
    - correct_answer is NOT included in the response — scoring is server-side.
    """
    # Verify the course belongs to the current user before exposing quiz data
    course = await get_course_with_progress(course_id, current_user.id, db)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    # Verify module belongs to this course
    module_ids = {m["id"] for m in course["modules"]}
    if str(module_id) not in module_ids:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")

    try:
        result = await get_module_quiz(
            module_id=module_id,
            user_id=current_user.id,
            course_id=course_id,
            db=db,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except RuntimeError as exc:
        logger.error("Quiz generation failed", error=str(exc), module_id=str(module_id))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Quiz generation failed. Please try again.",
        )

    return ModuleQuizResponse(**result)


@router.post(
    "/{course_id}/modules/{module_id}/quiz",
    response_model=ModuleQuizResultResponse,
)
async def submit_module_quiz_endpoint(
    course_id: UUID,
    module_id: UUID,
    request: ModuleQuizSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ModuleQuizResultResponse:
    """
    Submit module quiz answers and receive scored results.

    - Scores all answers server-side (case-insensitive match).
    - Saves a ModuleQuizAttempt record to the database.
    - Updates weak_points for incorrect answers.
    - If score >= 70%: marks the module as complete, unlocking the next module.
    - Clears the quiz cache so a fresh quiz is generated on retry.
    """
    # Verify the course belongs to the current user
    course = await get_course_with_progress(course_id, current_user.id, db)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    module_ids = {m["id"] for m in course["modules"]}
    if str(module_id) not in module_ids:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")

    try:
        result = await submit_module_quiz(
            user_id=current_user.id,
            module_id=module_id,
            course_id=course_id,
            user_answers=[a.model_dump() for a in request.answers],
            db=db,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error("Quiz scoring failed", error=str(exc), module_id=str(module_id))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Quiz scoring failed. Please try again.",
        )

    # Log module quiz activity — fire-and-forget
    try:
        from backend.utils.analytics import log_activity
        await log_activity(db, user_id=current_user.id, feature="module_quiz", duration_seconds=0)
    except Exception:
        pass

    # Award 25 XP on a passing quiz (≥70%) + update streak — fire-and-forget
    try:
        from backend.services.gamification_service import record_learning_activity
        xp = 25 if result.get("passed", False) else 0
        await record_learning_activity(user_id=current_user.id, db=db, xp_amount=xp, source="quiz_pass")
    except Exception:
        pass

    return ModuleQuizResultResponse(**result)
