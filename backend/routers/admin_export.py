"""
Admin Export Router — /api/admin/export/*

CSV download endpoints for FYP evaluation data extraction.
All three endpoints require role = 'admin' via the shared require_admin dependency.

Endpoints:
  GET /api/admin/export/users          — one row per user with aggregate stats
  GET /api/admin/export/quiz-attempts  — UNION of module + standalone quiz attempts
  GET /api/admin/export/feedback       — all evaluation_feedback rows
"""

import csv
import io
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_db
from backend.models.analytics import ActivityLog
from backend.models.chatbot import ChatSession
from backend.models.evaluation import EvaluationFeedback
from backend.models.progress import GrammarLearned, VocabularyLearned
from backend.models.quiz import ModuleQuizAttempt, StandaloneQuizAttempt
from backend.models.user import User
from backend.routers.admin import require_admin
from backend.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()


# ── Helpers ───────────────────────────────────────────────────────────────────


def _today_str() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def _start_dt(iso: str) -> datetime:
    """'2026-01-01' → 2026-01-01 00:00:00 UTC"""
    return datetime.fromisoformat(iso).replace(tzinfo=timezone.utc)


def _end_dt(iso: str) -> datetime:
    """'2026-12-31' → 2026-12-31 23:59:59.999999 UTC"""
    return datetime.fromisoformat(iso).replace(tzinfo=timezone.utc) + timedelta(days=1) - timedelta(microseconds=1)


def _csv_response(rows: list[dict], fieldnames: list[str], filename: str) -> StreamingResponse:
    """Serialize rows to CSV and return as a streaming download."""
    buf = io.StringIO()
    writer = csv.DictWriter(
        buf, fieldnames=fieldnames, extrasaction="ignore", lineterminator="\r\n"
    )
    writer.writeheader()
    writer.writerows(rows)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ── GET /api/admin/export/users ───────────────────────────────────────────────

_USERS_FIELDS = [
    "user_id", "email", "name", "created_at", "last_active",
    "bps_level", "total_chat_sessions",
    "total_quiz_attempts_module", "total_quiz_attempts_standalone",
    "avg_quiz_score", "vocab_count", "grammar_count", "is_admin",
]


@router.get("/export/users")
async def export_users(
    start_date: str | None = Query(default=None, description="Filter signup date from (ISO: 2026-01-01)"),
    end_date: str | None = Query(default=None, description="Filter signup date to (ISO: 2026-12-31)"),
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """
    Download all users as CSV with aggregate learning statistics.
    Optional start_date / end_date filter by users.created_at.
    """
    user_q = select(User).order_by(User.created_at.asc())
    if start_date:
        user_q = user_q.where(User.created_at >= _start_dt(start_date))
    if end_date:
        user_q = user_q.where(User.created_at <= _end_dt(end_date))

    result = await db.execute(user_q)
    users = result.scalars().all()

    filename = f"bahasabot_users_{_today_str()}.csv"

    if not users:
        return _csv_response([], _USERS_FIELDS, filename)

    user_ids = [u.id for u in users]

    # ── Aggregation queries (one per metric, grouped by user_id) ─────────────

    la_rows = await db.execute(
        select(ActivityLog.user_id, func.max(ActivityLog.created_at).label("la"))
        .where(ActivityLog.user_id.in_(user_ids))
        .group_by(ActivityLog.user_id)
    )
    last_active_map: dict = {r.user_id: r.la for r in la_rows.all()}

    sess_rows = await db.execute(
        select(ChatSession.user_id, func.count().label("cnt"))
        .where(ChatSession.user_id.in_(user_ids))
        .group_by(ChatSession.user_id)
    )
    session_map: dict = {r.user_id: r.cnt for r in sess_rows.all()}

    mod_rows = await db.execute(
        select(
            ModuleQuizAttempt.user_id,
            func.count().label("cnt"),
            func.avg(ModuleQuizAttempt.score).label("avg_s"),
        )
        .where(ModuleQuizAttempt.user_id.in_(user_ids))
        .group_by(ModuleQuizAttempt.user_id)
    )
    module_map: dict = {r.user_id: (r.cnt, r.avg_s) for r in mod_rows.all()}

    std_rows = await db.execute(
        select(
            StandaloneQuizAttempt.user_id,
            func.count().label("cnt"),
            func.avg(StandaloneQuizAttempt.score).label("avg_s"),
        )
        .where(StandaloneQuizAttempt.user_id.in_(user_ids))
        .group_by(StandaloneQuizAttempt.user_id)
    )
    standalone_map: dict = {r.user_id: (r.cnt, r.avg_s) for r in std_rows.all()}

    vocab_rows = await db.execute(
        select(VocabularyLearned.user_id, func.count().label("cnt"))
        .where(VocabularyLearned.user_id.in_(user_ids))
        .group_by(VocabularyLearned.user_id)
    )
    vocab_map: dict = {r.user_id: r.cnt for r in vocab_rows.all()}

    grammar_rows = await db.execute(
        select(GrammarLearned.user_id, func.count().label("cnt"))
        .where(GrammarLearned.user_id.in_(user_ids))
        .group_by(GrammarLearned.user_id)
    )
    grammar_map: dict = {r.user_id: r.cnt for r in grammar_rows.all()}

    # ── Build rows ────────────────────────────────────────────────────────────

    rows = []
    for u in users:
        mod_cnt, mod_avg = module_map.get(u.id, (0, None))
        std_cnt, std_avg = standalone_map.get(u.id, (0, None))

        if mod_avg is not None and std_avg is not None:
            total_cnt = (mod_cnt or 0) + (std_cnt or 0)
            combined_avg = (float(mod_avg) * (mod_cnt or 0) + float(std_avg) * (std_cnt or 0)) / total_cnt
        elif mod_avg is not None:
            combined_avg = float(mod_avg)
        elif std_avg is not None:
            combined_avg = float(std_avg)
        else:
            combined_avg = None

        la = last_active_map.get(u.id)
        rows.append({
            "user_id": str(u.id),
            "email": u.email,
            "name": u.name,
            "created_at": u.created_at.isoformat(),
            "last_active": la.isoformat() if la else "",
            "bps_level": u.proficiency_level,
            "total_chat_sessions": session_map.get(u.id, 0),
            "total_quiz_attempts_module": mod_cnt or 0,
            "total_quiz_attempts_standalone": std_cnt or 0,
            "avg_quiz_score": round(combined_avg, 2) if combined_avg is not None else "",
            "vocab_count": vocab_map.get(u.id, 0),
            "grammar_count": grammar_map.get(u.id, 0),
            "is_admin": "true" if u.role == "admin" else "false",
        })

    logger.info("admin_export_users", count=len(rows), admin_id=str(_admin.id))
    return _csv_response(rows, _USERS_FIELDS, filename)


# ── GET /api/admin/export/quiz-attempts ───────────────────────────────────────

_QUIZ_FIELDS = [
    "attempt_id", "user_id", "user_email", "quiz_type",
    "module_id", "score", "passed", "attempted_at",
]


@router.get("/export/quiz-attempts")
async def export_quiz_attempts(
    start_date: str | None = Query(default=None, description="Filter attempts from (ISO: 2026-01-01)"),
    end_date: str | None = Query(default=None, description="Filter attempts to (ISO: 2026-12-31)"),
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """
    Download all quiz attempts (module + standalone UNION) as CSV.
    Score is normalised 0.0–1.0. Passed = score >= 0.70.
    """
    # Module attempts
    mod_q = (
        select(
            ModuleQuizAttempt.id,
            ModuleQuizAttempt.user_id,
            User.email,
            ModuleQuizAttempt.module_id,
            ModuleQuizAttempt.score,
            ModuleQuizAttempt.taken_at,
        )
        .join(User, ModuleQuizAttempt.user_id == User.id)
    )
    if start_date:
        mod_q = mod_q.where(ModuleQuizAttempt.taken_at >= _start_dt(start_date))
    if end_date:
        mod_q = mod_q.where(ModuleQuizAttempt.taken_at <= _end_dt(end_date))

    mod_result = await db.execute(mod_q)

    # Standalone attempts
    std_q = (
        select(
            StandaloneQuizAttempt.id,
            StandaloneQuizAttempt.user_id,
            User.email,
            StandaloneQuizAttempt.score,
            StandaloneQuizAttempt.taken_at,
        )
        .join(User, StandaloneQuizAttempt.user_id == User.id)
    )
    if start_date:
        std_q = std_q.where(StandaloneQuizAttempt.taken_at >= _start_dt(start_date))
    if end_date:
        std_q = std_q.where(StandaloneQuizAttempt.taken_at <= _end_dt(end_date))

    std_result = await db.execute(std_q)

    rows: list[dict] = []
    for r in mod_result.all():
        rows.append({
            "attempt_id": str(r.id),
            "user_id": str(r.user_id),
            "user_email": r.email,
            "quiz_type": "module",
            "module_id": str(r.module_id),
            "score": round(r.score, 4),
            "passed": "true" if r.score >= 0.70 else "false",
            "attempted_at": r.taken_at.isoformat(),
        })
    for r in std_result.all():
        rows.append({
            "attempt_id": str(r.id),
            "user_id": str(r.user_id),
            "user_email": r.email,
            "quiz_type": "standalone",
            "module_id": "",
            "score": round(r.score, 4),
            "passed": "true" if r.score >= 0.70 else "false",
            "attempted_at": r.taken_at.isoformat(),
        })

    rows.sort(key=lambda x: x["attempted_at"])

    filename = f"bahasabot_quiz_attempts_{_today_str()}.csv"
    logger.info("admin_export_quiz_attempts", count=len(rows), admin_id=str(_admin.id))
    return _csv_response(rows, _QUIZ_FIELDS, filename)


# ── GET /api/admin/export/feedback ────────────────────────────────────────────

_FEEDBACK_FIELDS = [
    "feedback_id", "user_id", "user_email", "quiz_type",
    "rating", "weak_points_relevant", "comments", "submitted_at",
]


@router.get("/export/feedback")
async def export_feedback(
    start_date: str | None = Query(default=None, description="Filter feedback from (ISO: 2026-01-01)"),
    end_date: str | None = Query(default=None, description="Filter feedback to (ISO: 2026-12-31)"),
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """Download all evaluation feedback submissions as CSV."""
    q = (
        select(EvaluationFeedback, User.email)
        .join(User, EvaluationFeedback.user_id == User.id)
        .order_by(EvaluationFeedback.created_at.asc())
    )
    if start_date:
        q = q.where(EvaluationFeedback.created_at >= _start_dt(start_date))
    if end_date:
        q = q.where(EvaluationFeedback.created_at <= _end_dt(end_date))

    result = await db.execute(q)

    rows = [
        {
            "feedback_id": str(fb.id),
            "user_id": str(fb.user_id),
            "user_email": email,
            "quiz_type": fb.quiz_type,
            "rating": fb.rating,
            "weak_points_relevant": fb.weak_points_relevant,
            "comments": fb.comments or "",
            "submitted_at": fb.created_at.isoformat(),
        }
        for fb, email in result.all()
    ]

    filename = f"bahasabot_feedback_{_today_str()}.csv"
    logger.info("admin_export_feedback", count=len(rows), admin_id=str(_admin.id))
    return _csv_response(rows, _FEEDBACK_FIELDS, filename)
