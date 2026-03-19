# BahasaBot — Project Status
_Update this file at the end of every session_

## Last Updated: 2026-03-19

## Feature Status
| Feature | Status | Notes |
|---|---|---|
| Auth | ✅ Complete + Verified | Email + Google OAuth, JWT, token refresh, 7-day sessions — smoke-tested end-to-end |
| AI Chatbot Tutor | ✅ Complete + Verified | SSE streaming, LangChain, RAG — all tested end-to-end |
| Course Generator | ✅ Complete | Content filter, parallel generation, module locking |
| Quiz | ✅ Complete | Module quiz (70% pass gate) + Adaptive quiz (CEFR) |
| Dashboard | ✅ Complete | Phase 7 — all endpoints + all frontend components implemented |
| Production Hardening | ✅ Code complete | Phase 8 — rate limiting, Sentry, deployment config, .env audit |

## Missing / Broken
- frontend/app/(dashboard)/quiz/adaptive/results/page.tsx — completeness unknown
- frontend/app/(dashboard)/quiz/module/[moduleId]/results/page.tsx — completeness unknown

## What Was Done Last Session (Auth Debug)
- **Bug fix: Session maxAge** — `frontend/lib/auth.ts`: changed `maxAge` from `10 * 60` (10 min) to `7 * 24 * 60 * 60` (7 days, matching `REFRESH_TOKEN_EXPIRE_DAYS`). Users were being spontaneously signed out every 10 minutes.
- **Bug fix: Token refresh** — `frontend/lib/auth.ts`: added `refreshAccessToken()` and refresh logic in `jwt` callback. Access token (10 min TTL) is now silently refreshed ~60 s before expiry using `POST /api/auth/refresh`. Previously there was no refresh mechanism at all.
- **Bug fix: RefreshTokenExpired handling** — `frontend/lib/api.ts`: request interceptor now checks `session.error === "RefreshTokenExpired"` and calls `signOut()` before any API call, preventing confusing 401 loops when the refresh token itself expires (after 7 days).
- **Backend smoke-tested** — all auth endpoints verified:
  - ✅ `POST /api/auth/register` → 201 + tokens
  - ✅ `POST /api/auth/login` → 200 + tokens / 401 on bad creds
  - ✅ `GET /api/auth/me` → 200 with Bearer token / 403 without
  - ✅ `POST /api/auth/refresh` → 200 + new access token

## What Was Done Previous Session (Phase 3 Debug)
- Upgraded LLM model: `gemini-2.0-flash` → `gemini-2.5-flash` (correct model ID confirmed via ListModels)
- Fixed broken embedding model: `models/text-embedding-004` (404) → `models/gemini-embedding-001`
- Fixed `get_embeddings` in `gemini_service.py`: now passes `output_dimensionality=768` per-call to match the DB `vector(768)` column (instance-level param is ignored by the SDK)
- Deleted 72 zero-vector RAG corpus documents (seeded with broken model) and re-seeded with valid embeddings
- Updated `backend/.env` and `backend/.env.example` with all three corrected model names
- Verified full Phase 3 pipeline end-to-end:
  - ✅ `generate_text` — Gemini 2.5 Flash responding
  - ✅ `stream_text` — SSE streaming working
  - ✅ `get_embeddings` — 768-dim non-zero vectors confirmed
  - ✅ `generate_json` — vocab/grammar extraction working
  - ✅ RAG corpus seeded (72 chunks) + similarity_search returning relevant docs
  - ✅ Live chatbot HTTP test: question + follow-up with conversation memory
  - ✅ Background vocab/grammar extraction saving to DB (vocab_count=3–4, grammar_count=1 per message)

## Current Model Config
| Variable | Value |
|---|---|
| `GEMINI_MODEL` | `gemini-2.5-flash` |
| `CHATBOT_GEMINI_MODEL` | `gemini-2.5-flash` |
| `EMBEDDING_MODEL` | `models/gemini-embedding-001` |

## Next Priority
- Deploy: push backend to Railway, frontend to Vercel, set all env vars
- Test quiz results pages (adaptive + module) — completeness unknown
- Final end-to-end smoke test (Phase 8 checklist item)
