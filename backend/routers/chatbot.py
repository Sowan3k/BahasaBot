"""
Chatbot Router — /api/chatbot/*

Endpoints:
  POST   /api/chatbot/message              — send a message, receive streaming SSE response
  GET    /api/chatbot/sessions             — list the user's chat sessions (paginated)
  GET    /api/chatbot/history              — paginated message history for a session
  DELETE /api/chatbot/sessions/{session_id} — delete a session + its messages
"""

import asyncio
import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from backend.db.database import get_db
from backend.middleware.auth_middleware import get_current_user
from backend.middleware.rate_limiter import CHATBOT_LIMIT, limiter
from backend.models.chatbot import ChatMessage, ChatSession
from backend.models.user import User
from backend.schemas.chatbot import (
    ChatHistoryResponse,
    ChatMessageResponse,
    ChatSessionResponse,
    SendMessageRequest,
    SessionListResponse,
)
from backend.services import langchain_service
from backend.utils import cache as cache_utils
from backend.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()


# ── Helpers ────────────────────────────────────────────────────────────────────


async def _award_chatbot_xp(session_id: str, user_id: UUID) -> None:
    """
    Fire-and-forget: award 5 XP for the first message of a chatbot session.
    Opens its own DB session so it never blocks the SSE stream.
    """
    from backend.db.database import AsyncSessionLocal
    from backend.services.gamification_service import record_learning_activity
    from backend.utils.cache import cache_get, cache_set

    async with AsyncSessionLocal() as db:
        try:
            xp_key = f"gamif:chatbot_xp:{session_id}"
            already = await cache_get(xp_key)
            xp = 0 if already else 5
            if xp:
                await cache_set(xp_key, "1", ttl=172800)
            await record_learning_activity(user_id=user_id, db=db, xp_amount=xp)
        except Exception:
            pass


# ── POST /api/chatbot/message ──────────────────────────────────────────────────


@router.post("/message")
@limiter.limit(CHATBOT_LIMIT)
async def send_message(
    request: Request,
    body: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Send a chat message and receive the AI response as a Server-Sent Event stream.

    SSE event format:
      data: {"type": "token",  "content": "<chunk>"}
      data: {"type": "done",   "session_id": "<uuid>"}
      data: {"type": "error",  "message": "<error text>"}

    If session_id is omitted in the request body, a new session is created
    and its ID is returned in the final "done" event.

    Rate limit: 20 messages/minute per user (applied in Phase 8).
    """
    # Resolve or create the session before starting the stream
    try:
        session = await langchain_service.get_or_create_session(
            user_id=current_user.id,
            session_id=body.session_id,
            db=db,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    session_id = str(session.id)

    async def event_generator():
        """Yield SSE events as the model streams its response."""
        # Emit ping immediately — client shows typing dots while we warm up RAG + LLM.
        yield {"data": json.dumps({"type": "ping"})}

        # Award XP in a background task so it never delays first-token delivery.
        asyncio.create_task(_award_chatbot_xp(session_id, current_user.id))

        try:
            async for chunk in langchain_service.stream_chat_response(
                session_id=session_id,
                user_message=body.message,
                user_id=current_user.id,
                db=db,
            ):
                yield {
                    "data": json.dumps({"type": "token", "content": chunk}),
                }

            # Signal completion with the session ID so the client can save it
            yield {
                "data": json.dumps({"type": "done", "session_id": session_id}),
            }

        except Exception as exc:
            logger.error(
                "Chatbot stream error",
                user_id=str(current_user.id),
                session_id=session_id,
                error=str(exc),
            )
            yield {
                "data": json.dumps(
                    {
                        "type": "error",
                        "message": "Something went wrong. Please try again.",
                    }
                ),
            }

    logger.info(
        "Chatbot message received",
        user_id=str(current_user.id),
        session_id=session_id,
        message_preview=body.message[:60],
    )

    return EventSourceResponse(event_generator())


# ── GET /api/chatbot/prewarm ───────────────────────────────────────────────────


@router.get("/prewarm")
async def prewarm_chatbot(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Pre-warm per-user caches for faster first-message TTFT.
    Frontend calls this when the chatbot page mounts.
    Warms the profile cache (eliminates DB round-trip on first message).
    """
    try:
        await langchain_service.get_cached_profile(current_user.id, db)
    except Exception:
        pass
    return {"status": "ok"}


# ── GET /api/chatbot/sessions ──────────────────────────────────────────────────


@router.get("/sessions", response_model=SessionListResponse)
async def list_sessions(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionListResponse:
    """Return a paginated list of the current user's chat sessions, newest first."""
    offset = (page - 1) * limit

    count_result = await db.execute(
        select(func.count())
        .select_from(ChatSession)
        .where(ChatSession.user_id == current_user.id)
    )
    total = count_result.scalar_one()

    sessions_result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    sessions = sessions_result.scalars().all()

    # For each session: fetch last message, first user message (title), and message count
    session_responses: list[ChatSessionResponse] = []
    for session in sessions:
        # Last message preview
        last_msg_result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session.id)
            .order_by(ChatMessage.created_at.desc())
            .limit(1)
        )
        last_msg = last_msg_result.scalar_one_or_none()

        # First user message — used as the session title
        first_user_msg_result = await db.execute(
            select(ChatMessage)
            .where(
                ChatMessage.session_id == session.id,
                ChatMessage.role == "user",
            )
            .order_by(ChatMessage.created_at.asc())
            .limit(1)
        )
        first_user_msg = first_user_msg_result.scalar_one_or_none()
        title = first_user_msg.content[:60] if first_user_msg else None

        # Total message count for the session
        count_result = await db.execute(
            select(func.count())
            .select_from(ChatMessage)
            .where(ChatMessage.session_id == session.id)
        )
        message_count = count_result.scalar_one()

        session_responses.append(
            ChatSessionResponse(
                id=str(session.id),
                created_at=session.created_at,
                last_message=last_msg.content[:100] if last_msg else None,
                title=title,
                message_count=message_count,
            )
        )

    return SessionListResponse(
        sessions=session_responses,
        total=total,
        page=page,
        limit=limit,
    )


# ── GET /api/chatbot/history ───────────────────────────────────────────────────


@router.get("/history", response_model=ChatHistoryResponse)
async def get_history(
    session_id: str = Query(..., description="UUID of the chat session"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=30, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatHistoryResponse:
    """Return paginated chat history for a specific session belonging to the user."""

    # Verify the session belongs to this user
    session_result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id,
        )
    )
    session = session_result.scalar_one_or_none()
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    offset = (page - 1) * limit

    count_result = await db.execute(
        select(func.count())
        .select_from(ChatMessage)
        .where(ChatMessage.session_id == session_id)
    )
    total = count_result.scalar_one()

    messages_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .offset(offset)
        .limit(limit)
    )
    messages = messages_result.scalars().all()

    return ChatHistoryResponse(
        session_id=session_id,
        messages=[ChatMessageResponse.model_validate(m) for m in messages],
        total=total,
        page=page,
        limit=limit,
    )


# ── DELETE /api/chatbot/sessions/{session_id} ──────────────────────────────────


@router.delete("/sessions/{session_id}", status_code=status.HTTP_200_OK)
async def delete_session(
    session_id: str = Path(..., description="UUID of the chat session to delete"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Delete a chat session and all its messages.

    Vocabulary and grammar words extracted from this session are intentionally
    kept — they represent real learning and are used by the dashboard, spelling
    game, and adaptive quiz. Only the conversation log is removed.

    Redis history cache for this session is invalidated on success.
    """
    # Verify the session belongs to the requesting user before deleting
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    await db.delete(session)  # cascade="all, delete-orphan" removes messages too
    await db.commit()

    # Bust the Redis history cache so stale data isn't served if the ID is reused
    await cache_utils.cache_delete(f"chat:history:{session_id}")

    logger.info(
        "Chat session deleted",
        session_id=session_id,
        user_id=str(current_user.id),
    )
    return {"deleted": True, "session_id": session_id}
