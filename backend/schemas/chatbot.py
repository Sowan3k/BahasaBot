"""
Chatbot Schemas (Pydantic v2)

Request/response models for /api/chatbot/* endpoints.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ── Requests ──────────────────────────────────────────────────────────────────


class SendMessageRequest(BaseModel):
    """Payload for POST /api/chatbot/message."""

    message: str = Field(..., min_length=1, max_length=2000)
    # If provided, append to an existing session; otherwise a new session is created.
    session_id: str | None = None

    @field_validator("message")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message cannot be empty")
        return v


# ── Responses ─────────────────────────────────────────────────────────────────


class ChatMessageResponse(BaseModel):
    """A single chat message as returned in history/session responses."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    session_id: str
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime

    @field_validator("id", "session_id", mode="before")
    @classmethod
    def coerce_uuid(cls, v: object) -> str:
        return str(v)


class ChatSessionResponse(BaseModel):
    """A chat session summary (used when listing sessions)."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    # Latest message preview (optional, populated by the router)
    last_message: str | None = None

    @field_validator("id", mode="before")
    @classmethod
    def coerce_uuid(cls, v: object) -> str:
        return str(v)


class ChatHistoryResponse(BaseModel):
    """Paginated chat history for a session."""

    session_id: str
    messages: list[ChatMessageResponse]
    total: int
    page: int
    limit: int


class SessionListResponse(BaseModel):
    """Paginated list of chat sessions for the current user."""

    sessions: list[ChatSessionResponse]
    total: int
    page: int
    limit: int
