"""
Chatbot Router — /api/chatbot/*

Endpoints:
  POST /api/chatbot/message          — send a message, receive streaming SSE response
  GET  /api/chatbot/sessions         — list the user's chat sessions (paginated)
  GET  /api/chatbot/history          — paginated message history for a session
"""

import json

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
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
from backend.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()


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

    # Attach the last message preview to each session
    session_responses: list[ChatSessionResponse] = []
    for session in sessions:
        last_msg_result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session.id)
            .order_by(ChatMessage.created_at.desc())
            .limit(1)
        )
        last_msg = last_msg_result.scalar_one_or_none()
        session_responses.append(
            ChatSessionResponse(
                id=str(session.id),
                created_at=session.created_at,
                last_message=last_msg.content[:100] if last_msg else None,
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
