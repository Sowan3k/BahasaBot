# BahasaBot — Project Source of Truth
_Generated: 2026-05-14. This document describes the deployed, production state of BahasaBot as derived from a line-by-line audit of the codebase. Every non-obvious claim cites a file path. Use this as the primary reference for writing the FYP academic report._

---

## Section A — Stack & Deployment

### A.1 Technology Stack (exact versions from `backend/requirements.txt` and `frontend/package.json`)

| Layer | Technology | Exact Version | File |
|---|---|---|---|
| Frontend framework | Next.js (App Router) | ^14.2.5 | `frontend/package.json` |
| Frontend language | TypeScript | ^5.9.3 | `frontend/package.json` |
| UI library | shadcn/ui (via Radix UI) | various | `frontend/components/ui/` |
| Animation | framer-motion | ^12.38.0 | `frontend/package.json` |
| Charts | recharts | ^2.15.4 | `frontend/package.json` |
| Data fetching | @tanstack/react-query | ^5.90.21 | `frontend/package.json` |
| HTTP client | axios | ^1.13.6 | `frontend/package.json` |
| Auth (frontend) | next-auth | ^5.0.0-beta.20 | `frontend/package.json` |
| UI tour | driver.js | ^1.4.0 | `frontend/package.json` |
| Error monitoring (FE) | @sentry/nextjs | ^8.55.0 | `frontend/package.json` |
| Backend framework | FastAPI | 0.111.0 | `backend/requirements.txt` |
| Backend runtime | Python | ≥3.11 (inferred from asyncpg) | `backend/Procfile` |
| ASGI server | uvicorn | 0.30.0 | `backend/requirements.txt` |
| ORM | SQLAlchemy (async) | 2.0.30 | `backend/requirements.txt` |
| DB driver (async) | asyncpg | 0.29.0 | `backend/requirements.txt` |
| DB migrations | Alembic | 1.13.1 | `backend/requirements.txt` |
| AI orchestration | LangChain | 0.2.16 | `backend/requirements.txt` |
| LangChain Google | langchain-google-genai | 1.0.10 | `backend/requirements.txt` |
| LLM / Embeddings | Google Gemini API | gemini-2.5-flash (text), gemini-embedding-001 (vectors) | `backend/services/gemini_service.py` |
| Image generation | Google Gemini Image | gemini-3.1-flash-image-preview | `backend/services/image_service.py` |
| Vector store | pgvector | 0.2.5 (Python client) | `backend/requirements.txt` |
| Cache / Broker | Redis | redis[asyncio] 5.0.8 + hiredis | `backend/requirements.txt` |
| Password hashing | bcrypt | 4.0.1 (direct, no passlib) | `backend/requirements.txt` |
| JWT signing | python-jose[cryptography] | 3.3.0 | `backend/requirements.txt` |
| SSE streaming | sse-starlette | 2.1.3 | `backend/requirements.txt` |
| Rate limiting | slowapi | 0.1.9 | `backend/requirements.txt` |
| Fuzzy matching | fuzzywuzzy | 0.18.0 + python-Levenshtein 0.25.1 | `backend/requirements.txt` |
| Image HTTP client | httpx | 0.27.0 | `backend/requirements.txt` |
| Email | resend | 2.6.0 | `backend/requirements.txt` |
| Logging | structlog | 24.4.0 | `backend/requirements.txt` |
| Error monitoring (BE) | sentry-sdk[fastapi] | 2.13.0 | `backend/requirements.txt` |
| Serialization | orjson | (via cache.py) | `backend/utils/cache.py` |
| Testing | pytest | 8.3.2 | `backend/requirements.txt` |

### A.2 Deployment Infrastructure

| Component | Provider | Notes |
|---|---|---|
| Frontend hosting | Vercel | Auto-deploys from main branch; `frontend/vercel.json` is empty `{}` — all defaults |
| Backend hosting | Render (or Railway) | `backend/Procfile`: `web: alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000} --workers 1` |
| Database | Neon (PostgreSQL with pgvector) | Pooled connection via PgBouncer; `statement_cache_size=0` required in asyncpg args |
| Cache | Redis Cloud (free tier) | URL in `REDIS_URL` env var |
| Email | Resend | Transactional email only (OTP password reset); `backend/services/email_service.py` |
| Error monitoring | Sentry | Both frontend (`@sentry/nextjs`) and backend (`sentry-sdk[fastapi]`); DSN in env vars |
| CDN / Images | Inline base64 data URLs | Images stored as TEXT in DB, not served from CDN |

**Production URL:** https://bahasabot-main3.vercel.app

**Backend startup sequence** (`backend/Procfile`):
1. `alembic upgrade head` — applies any pending migrations (safe to run on every deploy)
2. `uvicorn main:app` — starts FastAPI, which on lifespan startup: initialises Redis, seeds RAG corpus if empty

### A.3 Environment Variables

**Backend (`backend/.env`)**:
```
DATABASE_URL=postgresql+asyncpg://...?ssl=require          # Neon pooled endpoint
SYNC_DATABASE_URL=postgresql+psycopg2://...?sslmode=require # Alembic only
REDIS_URL=redis://...
GOOGLE_API_KEY=...             # Gemini text + image API
GEMINI_MODEL=gemini-2.5-flash  # overrides default in gemini_service.py
CHATBOT_GEMINI_MODEL=gemini-2.5-flash
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image-preview
JWT_SECRET=...
ACCESS_TOKEN_EXPIRE_MINUTES=15  # default 15 if omitted (backend/routers/auth.py:L~30)
FRONTEND_URL=https://bahasabot-main3.vercel.app
APP_ENV=production
ALLOWED_ORIGINS=https://bahasabot-main3.vercel.app
RESEND_API_KEY=...
RESEND_FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAILS=sowangemini@gmail.com,drtan@supervisor.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SENTRY_DSN=...
```

**Frontend (`frontend/.env.local`)**:
```
NEXTAUTH_URL=https://bahasabot-main3.vercel.app
NEXTAUTH_SECRET=...
NEXT_PUBLIC_API_URL=https://<backend-render-url>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...    # must match backend GOOGLE_CLIENT_ID
NEXT_PUBLIC_SENTRY_DSN=...
```

---

## Section B — Architecture

### B.1 High-Level Request Flow

```
[Browser]
   │
   ├─ Auth requests ──────────────→ [NextAuth v5 JWT handler]
   │                                  frontend/app/api/auth/[...nextauth]/route.ts
   │                                  Credentials: POSTs to FastAPI /api/auth/login
   │                                  Google: uses next-auth Google provider
   │
   ├─ Data requests ──────────────→ [Next.js API routes are NOT used for data]
   │                                  All data fetches go directly to FastAPI
   │                                  via frontend/lib/api.ts (Axios client)
   │
   └─ AI feature requests ────────→ [FastAPI — Render/Railway]
                                        │
                                        ├─ LangChain chains (langchain_service.py)
                                        ├─ Google Gemini API (gemini_service.py)
                                        ├─ RAG pipeline (pgvector, rag_service.py)
                                        ├─ PostgreSQL via SQLAlchemy async
                                        └─ Redis via redis[asyncio]
```

### B.2 Frontend Architecture

- **Next.js App Router** with route groups:
  - `(auth)` — login, register, forgot-password, reset-password (public)
  - `(dashboard)` — all authenticated pages; protected by `frontend/middleware.ts`
  - `app/pricing/page.tsx` — public, outside both groups
- **Session management**: NextAuth v5 beta.20 with `strategy: "jwt"`. Access token passed through as `access_token` in the JWT session. The session stores the FastAPI JWT, not NextAuth's own tokens.
- **API client**: `frontend/lib/api.ts` — Axios instance with request interceptor that reads `getCachedSession()` (60s in-memory cache) and injects `Authorization: Bearer <token>` header. This eliminates one `/api/auth/session` call per API request.
- **Server components**: Used only for static/layout pages. All data-fetching pages use client components with React Query.
- **Data fetching**: `@tanstack/react-query` v5. Default `staleTime: 0` (stale-while-revalidate). Cache invalidated explicitly after mutations.

### B.3 Backend Architecture

- **FastAPI** with 14 registered routers (`backend/main.py:L165–177`):
  `auth`, `chatbot`, `courses`, `quiz`, `dashboard`, `profile`, `admin`, `admin_export`, `notifications`, `games`, `journey`, `evaluation`, `tips`
- **Router → Service pattern**: route handlers contain NO business logic. All logic lives in `backend/services/`. Services call Gemini, ORM queries, Redis.
- **Async throughout**: all route handlers and service functions use `async def`. The only sync code is Alembic migrations (via psycopg2 driver) and test utilities.
- **Background tasks**: FastAPI `BackgroundTasks` (no Celery). Used for course generation (`_run_generation_task` in courses router), XP/streak awards (as `asyncio.create_task` with own session), image generation (as `asyncio.create_task`).
- **Session factory**: `backend/db/database.py` — `AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)`. The `expire_on_commit=False` is critical — prevents lazy-load errors after commits in background tasks.

### B.4 Database Connection

`backend/db/database.py`:
```python
engine = create_async_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=240,
    connect_args={"statement_cache_size": 0},  # Neon PgBouncer compatibility
)
```
`statement_cache_size=0` is mandatory. Neon uses PgBouncer in transaction mode. asyncpg caches prepared statements per connection; PgBouncer recycles underlying server connections after each transaction, causing `prepared statement "…" does not exist` errors if caching is enabled.

---

## Section C — Database

### C.1 All Tables (15 migrations applied as of 2026-05-09)

**Migration files** (in `backend/db/migrations/versions/`):
1. `20260317_1856_initial_schema.py` — core tables
2. `0001_fix_*.py` — initial schema fixes
3. `0002_fix_*.py` — schema fixes
4. `20260402_1000_bps_migration.py` — BPS label backfill
5. `20260406_0900_analytics_tables.py` — token_usage_logs, activity_logs
6. `20260408_1200_phase22_image_columns.py` — image URL columns
7. `20260414_1400_course_dedup_template.py` — topic_slug, is_template, cloned_from
8. `*_xp_logs.py` (revision c1d2e3f4a5b6) — xp_logs table
9. `20260509_1000_add_game_type_column.py` (revision d2e3f4a5b6c7) — game_type column
10. + 6 others for: has_seen_tour, tips table, user_roadmaps table, cover image column, notifications image_url, password reset tokens

### C.2 Table Definitions

---

**`users`** (`backend/models/user.py`)

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK, default gen_random_uuid() |
| email | VARCHAR | UNIQUE, NOT NULL |
| password_hash | VARCHAR | NULLABLE — NULL for Google-only accounts before SetPassword |
| name | VARCHAR | NOT NULL |
| provider | VARCHAR | 'email' or 'google' — original signup method; does NOT restrict login |
| proficiency_level | VARCHAR | 'BPS-1' / 'BPS-2' / 'BPS-3' / 'BPS-4'; default 'BPS-1' |
| is_active | BOOLEAN | default true; false = deactivated by admin |
| onboarding_completed | BOOLEAN | default false; set true on onboarding final step |
| has_seen_tour | BOOLEAN | default false; set true when UI tour completes |
| native_language | VARCHAR | nullable; collected in onboarding |
| learning_goal | VARCHAR | nullable; collected in onboarding or overwritten by Journey goal |
| profile_picture_url | VARCHAR | nullable |
| role | VARCHAR | 'user' or 'admin'; 'admin' auto-assigned to ADMIN_EMAILS on registration |
| streak_count | INTEGER | default 0 |
| xp_total | INTEGER | default 0 |
| gender | VARCHAR | nullable; collected in onboarding for image generation personalisation |
| age_range | VARCHAR | nullable; collected in onboarding (e.g. '18-24') |
| created_at | TIMESTAMPTZ | default now() |

`has_password` is a Python `@property` on the ORM model: `return self.password_hash is not None`. Used in `ProfileResponse` to let the frontend know if the user can use email login.

---

**`courses`** (`backend/models/course.py`)

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id ON DELETE CASCADE |
| title | TEXT | AI-generated |
| description | TEXT | |
| topic | TEXT | raw user input string |
| objectives | JSONB | list of strings |
| cover_image_url | TEXT | base64 data URL; generated async after course save |
| topic_slug | VARCHAR(600) | normalised lookup key for dedup (nullable for pre-Phase 24 courses) |
| is_template | BOOLEAN | default false; true = first course for this topic_slug |
| cloned_from | UUID | FK → courses.id ON DELETE SET NULL; non-null for clones |
| created_at | TIMESTAMPTZ | |

Index: `ix_courses_topic_slug` on `topic_slug`.

---

**`modules`** (`backend/models/course.py`)

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| course_id | UUID | FK → courses.id ON DELETE CASCADE |
| title | TEXT | |
| description | TEXT | |
| order_index | INTEGER | 1-based ordering |

---

**`classes`** (`backend/models/course.py`)

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| module_id | UUID | FK → modules.id ON DELETE CASCADE |
| title | TEXT | |
| content | TEXT | full lesson content in English, Malay inline |
| vocabulary_json | JSONB | `[{word, meaning, ipa, example}]` |
| examples_json | JSONB | `[{malay, english}]` |
| order_index | INTEGER | 1-based within module |

---

**`user_progress`** (`backend/models/progress.py`)

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| course_id | UUID | FK → courses.id |
| module_id | UUID | FK → modules.id |
| class_id | UUID | FK → classes.id |
| completed_at | TIMESTAMPTZ | |

One row per completed class per user. Module completion is derived (all classes done).

---

**`vocabulary_learned`** (`backend/models/progress.py`)

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| word | VARCHAR | Malay word |
| meaning | VARCHAR | English meaning |
| source_type | VARCHAR | 'chatbot' or 'course' |
| source_id | UUID | nullable; session_id or course_id |
| learned_at | TIMESTAMPTZ | |

Also stores IPA if extracted (embedded in meaning string as `/ipa/` notation).

---

**`grammar_learned`** (`backend/models/progress.py`)

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| rule | TEXT | grammar rule description |
| example | TEXT | example sentence |
| source_type | VARCHAR | 'chatbot' or 'course' |
| source_id | UUID | nullable |
| learned_at | TIMESTAMPTZ | |

---

**`weak_points`** (`backend/models/progress.py`)

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| topic | VARCHAR | e.g. "numbers", "greetings" |
| type | VARCHAR | 'vocab' or 'grammar' |
| strength_score | FLOAT | 0.0 (very weak) – 1.0 (strong); upserted after each quiz |
| updated_at | TIMESTAMPTZ | |

---

**`module_quiz_attempts`** (`backend/models/quiz.py`)

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| module_id | UUID | FK → modules.id |
| score | FLOAT | 0.0 – 1.0 |
| answers_json | JSONB | per-question: {question_id, user_answer, correct, correct_answer} |
| taken_at | TIMESTAMPTZ | |

---

**`standalone_quiz_attempts`** (`backend/models/quiz.py`)

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| score | FLOAT | 0.0 – 1.0 |
| questions_json | JSONB | full question set |
| answers_json | JSONB | per-question results |
| taken_at | TIMESTAMPTZ | |

---

**`chat_sessions`** (`backend/models/chatbot.py`)

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id ON DELETE CASCADE |
| title | TEXT | nullable; populated from first user message |
| created_at | TIMESTAMPTZ | |

---

**`chat_messages`** (`backend/models/chatbot.py`)

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| session_id | UUID | FK → chat_sessions.id ON DELETE CASCADE |
| role | VARCHAR | 'user' or 'assistant' |
| content | TEXT | |
| created_at | TIMESTAMPTZ | |

---

**`documents`** — RAG corpus (`backend/models/document.py`)

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| content | TEXT | chunk text |
| embedding | vector(768) | pgvector; cosine distance index |
| metadata_json | JSONB | source, chunk_index, category |
| created_at | TIMESTAMPTZ | |

768 dimensions matches `models/gemini-embedding-001`. Similarity search uses `<=>` (cosine distance operator). `k=3` chunks retrieved per query.

---

**`user_roadmaps`** (`backend/models/journey.py`)

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id ON DELETE CASCADE |
| intent | VARCHAR(100) | e.g. "Casual Learning", "Academic Purposes" |
| goal | TEXT | free-text user goal |
| timeline_months | INTEGER | CHECK (1–6) |
| elements | JSONB | `[{order, topic, description, estimated_weeks, completed, completed_at}]` |
| status | VARCHAR(20) | 'active' / 'completed' / 'deleted' / 'overdue' |
| deadline | DATE | created_at + timeline_months |
| extended | BOOLEAN | default false; true = already used one-time extension |
| created_at | TIMESTAMPTZ | |
| completed_at | TIMESTAMPTZ | nullable |
| bps_level_at_creation | VARCHAR(10) | BPS-1 to BPS-4 |
| banner_image_url | TEXT | base64 data URL; generated async after roadmap save |

**Partial unique index** (not a column constraint): `CREATE UNIQUE INDEX user_roadmaps_one_active_per_user ON user_roadmaps(user_id) WHERE status = 'active'`. Allows multiple old rows per user but enforces only ONE active roadmap.

---

**`notifications`** (`backend/models/notification.py`)

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id ON DELETE CASCADE |
| type | VARCHAR | 'streak_milestone' / 'xp_milestone' / 'course_complete' / 'bps_milestone' / 'journey_reminder' |
| message | TEXT | |
| read | BOOLEAN | default false |
| image_url | TEXT | nullable; base64 milestone card image for bps_milestone + streak_milestone |
| created_at | TIMESTAMPTZ | |

---

**`password_reset_tokens`** (`backend/models/...` — inline in auth router)

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| token_hash | VARCHAR | SHA256 hash of `email:6-digit-code` |
| expires_at | TIMESTAMPTZ | 10-minute TTL from creation |
| used | BOOLEAN | default false; set atomically on successful reset |
| created_at | TIMESTAMPTZ | |

---

**`evaluation_feedback`** (`backend/routers/evaluation.py` schema)

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| quiz_type | VARCHAR | 'module_quiz' / 'standalone_quiz' / 'general' |
| rating | INTEGER | 1–5 stars |
| weak_points_relevant | VARCHAR | 'yes' / 'no' / 'somewhat' |
| comments | TEXT | nullable |
| created_at | TIMESTAMPTZ | |

---

**`spelling_game_scores`** (`backend/models/game.py`)

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id ON DELETE CASCADE |
| words_correct | INTEGER | |
| words_attempted | INTEGER | |
| session_date | DATE | one record per game type per day (upsert logic) |
| game_type | VARCHAR(50) | 'spelling' or 'word_match'; default 'spelling' (added in Phase 27 migration) |

Composite index on (game_type, user_id).

---

**`token_usage_logs`** (`backend/models/analytics.py`)

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id ON DELETE CASCADE |
| feature | VARCHAR | 'chatbot' / 'course_gen' / 'module_quiz' / 'standalone_quiz' |
| input_tokens | INTEGER | |
| output_tokens | INTEGER | |
| total_tokens | INTEGER | |
| created_at | TIMESTAMPTZ | |

---

**`activity_logs`** (`backend/models/analytics.py`)

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id ON DELETE CASCADE |
| feature | VARCHAR | 'chatbot' / 'course_gen' / 'course_clone' / 'module_quiz' / 'standalone_quiz' / 'word_match_correct' |
| duration_seconds | INTEGER | nullable |
| created_at | TIMESTAMPTZ | |

---

**`tips`** (`backend/models/tip.py`)

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| category | VARCHAR | 'word_origin' / 'common_mistakes' / 'cultural_context' / 'grammar' |
| malay_word | TEXT | |
| english_meaning | TEXT | |
| example_sentence | TEXT | |
| cultural_note | TEXT | nullable |
| created_at | TIMESTAMPTZ | |

---

**`xp_logs`** (`backend/models/xp_log.py`)

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id ON DELETE CASCADE |
| xp_amount | INTEGER | |
| source | VARCHAR | e.g. 'class_complete' / 'quiz_pass' / 'chatbot_session' / 'spelling_correct' |
| created_at | TIMESTAMPTZ | |

Used exclusively for the weekly XP leaderboard (SUM per ISO week per user).

---

### C.3 Key DB Indexes

| Table | Column(s) | Type | Purpose |
|---|---|---|---|
| users | email | UNIQUE | login lookup |
| notifications | user_id | INDEX | bell query |
| user_roadmaps | (user_id) WHERE status='active' | PARTIAL UNIQUE | one active roadmap |
| password_reset_tokens | token_hash | INDEX | reset verification |
| courses | topic_slug | INDEX | dedup fast path |
| documents | embedding | ivfflat/hnsw (pgvector) | cosine similarity search |
| activity_logs | user_id, created_at | INDEX | admin analytics |
| spelling_game_scores | (game_type, user_id) | COMPOSITE INDEX | per-game personal best |

---

## Section D — API Endpoints

_All prefixed as shown. All require JWT (`Authorization: Bearer <token>`) unless noted as public._

### D.1 Auth (`/api/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | public | Create account; `ADMIN_EMAILS` auto-grants admin role |
| POST | /api/auth/login | public | Email + password → JWT access + refresh tokens |
| POST | /api/auth/google | public | Google ID token → JWT (creates or links account) |
| GET | /api/auth/me | required | Returns user profile from DB |
| POST | /api/auth/refresh | required (refresh token) | Exchanges refresh token for new access token |
| POST | /api/auth/forgot-password | public | Step 1: generates 6-digit OTP code, emails via Resend |
| POST | /api/auth/verify-reset-code | public | Step 2: validates email + OTP code (does not consume it) |
| POST | /api/auth/reset-password | public | Step 3: validates + consumes OTP, updates password hash |
| POST | /api/auth/set-password | required | Sets password for Google accounts with NULL password_hash |

**JWT details** (`backend/routers/auth.py`):
- Access token: `ACCESS_TOKEN_EXPIRE_MINUTES` env var, default 15 min
- Refresh token: 7 days
- Algorithm: HS256 (`python-jose`)
- Frontend refreshes 60s before expiry (`frontend/lib/auth.ts`: `ACCESS_TOKEN_TTL_MS = (30 * 60 - 60) * 1000` — this value targets 30-min tokens but the backend default is 15 min; confirm via env var)

### D.2 Chatbot (`/api/chatbot`)

| Method | Path | Description |
|---|---|---|
| POST | /api/chatbot/message | SSE stream; body: `{session_id?, message}`; rate-limited 20/min |
| GET | /api/chatbot/history | Paginated message history; `?session_id=&page=&limit=` |
| GET | /api/chatbot/sessions | List all sessions (title from first user message, message count) |
| DELETE | /api/chatbot/sessions/{id} | Delete session + cascade messages (preserves vocab/grammar) |
| GET | /api/chatbot/prewarm | Warms Redis profile cache; called on chatbot page mount |

### D.3 Courses (`/api/courses`)

| Method | Path | Description |
|---|---|---|
| POST | /api/courses/generate | Start background course generation; returns `{job_id}`; rate-limited 5/hr |
| GET | /api/courses/jobs/{job_id} | Poll generation status; `{status, progress, step, course_id?, error?}` |
| GET | /api/courses/ | Paginated course list for current user |
| GET | /api/courses/{id} | Full course tree (modules → classes) with progress + lock state |
| DELETE | /api/courses/{id} | Delete course + cascade |
| GET | /api/courses/{id}/modules/{mid}/classes/{cid} | Single class detail |
| POST | /api/courses/{id}/modules/{mid}/classes/{cid}/complete | Mark class done; awards XP, updates streak, saves vocab |
| GET | /api/courses/{id}/modules/{mid}/quiz | Get or generate module quiz |
| POST | /api/courses/{id}/modules/{mid}/quiz | Submit module quiz answers |
| GET | /api/courses/{id}/cover | Serve raw cover image bytes with `Cache-Control: immutable` |

### D.4 Quiz (`/api/quiz`)

| Method | Path | Description |
|---|---|---|
| GET | /api/quiz/ | Get adaptive standalone quiz (cached 30 min per user) |
| POST | /api/quiz/submit | Submit answers; updates weak points, recalculates BPS level, awards XP if passed |

### D.5 Dashboard (`/api/dashboard`)

| Method | Path | Description |
|---|---|---|
| GET | /api/dashboard/ | Full summary: stats, BPS, streak, XP, top vocab, grammar, weak points (Redis-cached 5 min) |
| GET | /api/dashboard/vocabulary | Paginated vocabulary list |
| GET | /api/dashboard/grammar | Paginated grammar list |
| GET | /api/dashboard/progress | Course progress breakdown |
| GET | /api/dashboard/weak-points | Weak points + recommendations |
| GET | /api/dashboard/quiz-history | Paginated quiz history |
| GET | /api/dashboard/leaderboard | Top-10 users by ISO-week XP + current user's rank (Redis-cached 5 min) |

### D.6 Profile (`/api/profile`)

| Method | Path | Description |
|---|---|---|
| GET | /api/profile/ | Returns full user profile including has_password flag |
| PATCH | /api/profile/ | Update name, native_language, learning_goal, profile_picture_url, onboarding_completed, has_seen_tour |
| POST | /api/profile/change-password | Change password (requires current_password; 400 if Google-only account) |
| POST | /api/profile/delete-account | Delete account; bcrypt verify for email, email-match for Google |

### D.7 Journey (`/api/journey`)

| Method | Path | Description |
|---|---|---|
| POST | /api/journey/roadmap/generate | Generate roadmap (3-question input: intent, goal, timeline_months); generates banner image async |
| GET | /api/journey/roadmap | Active roadmap + per-element exists/course_id enrichment + overdue/bps_upgraded flags |
| GET | /api/journey/roadmap/history | Past completed/deleted roadmaps |
| POST | /api/journey/roadmap/verify-and-delete | Identity-verified deletion (password or oauth_confirmed flag) |
| PATCH | /api/journey/roadmap/extend | Extend deadline by extension_months (one-time only; 400 if already extended) |
| POST | /api/journey/roadmap/regenerate | Regenerate uncompleted elements after BPS upgrade |
| DELETE | /api/journey/roadmap/dismiss-upgrade | Clears `journey_bps_upgrade:{user_id}` Redis flag |

### D.8 Notifications (`/api/notifications`)

| Method | Path | Description |
|---|---|---|
| GET | /api/notifications/ | Last 20 notifications with unread_count |
| POST | /api/notifications/{id}/read | Mark single notification as read |
| POST | /api/notifications/read-all | Mark all as read |
| DELETE | /api/notifications/ | Delete all user notifications (Clear All) |

### D.9 Games (`/api/games`)

| Method | Path | Description |
|---|---|---|
| GET | /api/games/spelling/word | Next word from vocabulary_learned (Leitner-box weighted) |
| POST | /api/games/spelling/submit | Evaluate spelling; `{vocab_id, answer, difficulty}`; fuzzy match |
| POST | /api/games/spelling/session | Save completed session score |
| GET | /api/games/spelling/best | Personal best (words_correct, words_attempted, session_date) |
| GET | /api/games/word-match/question | Next MCQ question (4 shuffled options, correct_index) |
| POST | /api/games/word-match/submit | Evaluate word-match answer; returns correct bool + meaning |
| POST | /api/games/word-match/session | Save word-match session score |
| GET | /api/games/word-match/best | Personal best for word_match game type |

### D.10 Admin (`/api/admin`)

All require `role === 'admin'` — `require_admin` dependency raises HTTP 403 otherwise.

| Method | Path | Description |
|---|---|---|
| GET | /api/admin/stats | Aggregate stats (total users, active today, quiz pass rate, etc.) |
| GET | /api/admin/users | Paginated + searchable user list; `?search=&page=&limit=&start_date=&end_date=` |
| GET | /api/admin/users/{id} | Full user profile + 8 stat counts + time spent + chat metrics + score trajectory |
| GET | /api/admin/users/{id}/analytics | Daily token usage + event breakdown; `?days=7–90` |
| GET | /api/admin/users/{id}/quiz-attempts | Raw quiz Q&A with correct/incorrect indicators (collapsible) |
| PATCH | /api/admin/users/{id}/deactivate | Deactivate user account |
| DELETE | /api/admin/users/{id} | Delete user (requires admin_password body) |
| POST | /api/admin/users/{id}/reset | Reset user data (requires admin_password body) |
| GET | /api/admin/feedback | Paginated evaluation feedback responses |
| GET | /api/admin/journeys | All user roadmaps (read-only) |
| GET | /api/admin/analytics/score-distribution | Cohort score histogram + mean/median; optional date filter |
| GET | /api/admin/analytics/weak-points | Top 20 weak topics across all users; sortable; optional date filter |

**Admin export** (`/api/admin/export` — `backend/routers/admin_export.py`):

| Method | Path | Description |
|---|---|---|
| GET | /api/admin/export/users | CSV: all users with stats |
| GET | /api/admin/export/quiz-attempts | CSV: all quiz attempts; optional `start_date`/`end_date` |
| GET | /api/admin/export/feedback | CSV: all feedback responses |

### D.11 Evaluation (`/api/evaluation`)

| Method | Path | Description |
|---|---|---|
| POST | /api/evaluation/feedback | Submit feedback survey (3 questions) |

### D.12 Tips (`/api/tips`)

| Method | Path | Description |
|---|---|---|
| GET | /api/tips/random | Returns one random tip from tips table |
| POST | /api/tips/generate | Admin only: Gemini-generated batch insert |

### D.13 Health

| Method | Path | Description |
|---|---|---|
| GET | /health | Returns `{status: "ok", redis: "ok" | "unavailable"}` |

---

## Section E — Services

### E.1 `backend/services/gemini_service.py`

**Module-level singletons** (initialised once at import):
- `_llm` — ChatGoogleGenerativeAI instance; model = `GEMINI_MODEL` env var (default: `gemini-2.5-flash`)
- `_chatbot_llm` — same model (separate instance); model = `CHATBOT_GEMINI_MODEL` env var
- `EMBEDDING_MODEL = "models/gemini-embedding-001"`
- `EMBEDDING_DIM = 768`
- `FALLBACK_MESSAGE` — user-facing fallback for total Gemini failure

**Key functions**:
- `generate_text(prompt) → str` — thin wrapper over `_invoke_with_retry`
- `generate_text_with_usage(prompt) → (str, int, int)` — returns (text, input_tokens, output_tokens)
- `generate_json(prompt) → dict` — parses JSON from Gemini response; handles markdown fences
- `generate_json_with_usage(prompt) → (dict, int, int)` — used by quiz and course services to log tokens
- `stream_text(messages) → AsyncIterator[str]` — yields text chunks via LangChain streaming
- `get_embeddings(texts) → list[list[float]]` — batch embedding via Gemini API
- `_invoke_with_retry(messages, use_chatbot=False) → (str, int, int)` — 3 retries with exponential backoff; handles 429 and 500

### E.2 `backend/services/langchain_service.py`

**Constants**:
- `HISTORY_WINDOW = 6` — last 6 exchanges (12 messages) loaded from DB/cache
- `HISTORY_CACHE_TTL = 1800` — 30-minute Redis TTL for conversation history
- `_RAG_CACHE_TTL = 300` — 5-minute Redis TTL for RAG context per query hash
- `_PROFILE_CACHE_TTL = 300` — 5-minute Redis TTL for user profile (native_language, learning_goal, proficiency_level)
- `CHATBOT_SYSTEM_PROMPT` — full system prompt; includes language detection rule (English → English response), Malaysian BM dialect rule, app-awareness redirect rules, vocabulary formatting instructions

**`stream_chat_response(session_id, user_message, user_id, db)`**:
1. `asyncio.gather()` fires three parallel Redis lookups: history cache, RAG cache (keyed on SHA256 of query), profile cache
2. For any cache miss: falls back to DB (history) or Gemini embedding + pgvector search (RAG) or DB query (profile)
3. Constructs `HumanMessage` + `SystemMessage` with injected RAG context and learner profile block
4. Calls `gemini_service.stream_text(messages)` → yields text chunks as SSE events
5. After stream completes: saves assistant message to DB, calls `asyncio.create_task(_extract_and_save())` to extract vocab/grammar, calls `_update_history_cache()` to append new exchange

**`_extract_and_save(text, user_id, session_id)`**: opens its own `AsyncSessionLocal` (NOT the request-scoped session — that session is closed after SSE ends). Calls `extract_vocab_and_grammar()` via Gemini, upserts `VocabularyLearned` and `GrammarLearned` rows.

### E.3 `backend/services/rag_service.py`

- `ingest_corpus_if_empty(db)` — called on startup; skips if `documents` table is non-empty; reads `backend/data/malay_corpus.py` (1155 lines, 60+ semantic chunks); batches `get_embeddings()` calls; inserts into `documents` table
- `similarity_search(query, db, k=3) → list[str]` — embeds the query, runs `SELECT ... ORDER BY embedding <=> query_vec LIMIT 3`; cosine distance operator `<=>` from pgvector

### E.4 `backend/services/course_service.py`

- `_CONTENT_SEMAPHORE = asyncio.Semaphore(2)` — limits concurrent Gemini class-content calls; respects Gemini free-tier 5 RPM limit
- `_make_topic_slug(topic, level) → str` — lowercase → strip non-alphanumeric → collapse whitespace → replace spaces with hyphens → append level without hyphens → cap at 600 chars. Example: `"Ordering food at a Restaurant!" + "BPS-1"` → `"ordering-food-at-a-restaurant:bps1"`
- `_find_template(slug, db) → Course | None` — SELECT with `selectinload(Course.modules.and_(Module.classes))` + `LIMIT 1` where `topic_slug = slug AND is_template = true`
- `_clone_course(template, user_id, db) → Course` — snapshots all ORM data into plain Python dicts BEFORE starting writes (prevents SQLAlchemy `DetachedInstanceError`); inserts Course → Modules → Classes in a single transaction; calls `cache_delete(f"journey:{user_id}")` on commit
- `generate_course(topic, user_id, db, level, job_id) → Course` — fast path: `_find_template()` → `_clone_course()` (milliseconds); slow path: `generate_course_skeleton()` → parallel `generate_class_content()` calls (semaphore-limited) → `save_course()` → marks as template; both paths log tokens and activity

### E.5 `backend/services/quiz_service.py`

- `PASS_THRESHOLD = 0.70` — score ≥ 70% required to unlock next module
- Module quiz: 6 MCQ + 4 fill-in-blank = 10 questions (generated from class vocabulary + examples)
- Standalone quiz: 6 MCQ + 6 fill-in-blank + 3 translation = 15 questions (generated from user's weak_points + vocabulary_learned)
- `_calculate_cefr_level(user_id, db) → str` — averages last 3 standalone quiz scores; returns BPS label: `≥0.80 → BPS-4`, `≥0.60 → BPS-3`, `≥0.40 → BPS-2`, else `BPS-1`. Function name is a legacy remnant (named "cefr") but returns BPS labels.

### E.6 `backend/services/gamification_service.py`

- `record_learning_activity(user_id, db, xp_amount, source)` — updates Redis streak key, upserts `users.streak_count` + `users.xp_total`, inserts `xp_logs` row, fires milestone notifications
- **Streak key**: `gamif:streak:{user_id}`, TTL 48h (allows one-day grace period)
- **Grace period**: checks `last_date_str in (yesterday_str, day_before_yesterday_str)` before breaking streak
- `_STREAK_MILESTONES = {3, 7, 14, 30}` — streak_milestone notification fired at these values
- `_XP_MILESTONE_INTERVAL = 100` — xp_milestone notification fired every 100 XP
- `_generate_and_save_streak_milestone_card(user_id, db)` — `asyncio.create_task` that calls `image_service.generate_streak_milestone_card()` and stores base64 URL in the notification's `image_url` column

### E.7 `backend/services/image_service.py`

**Why httpx instead of SDK**: Google Generative AI SDK v0.7.2 raises `TypeError` on `response_modalities` parameter for image models. Circumvented by calling `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}` directly via httpx.

- `generate_image(prompt) → str` — returns base64 data URL (`data:image/jpeg;base64,...`); HTTP POST to Gemini REST API
- `generate_journey_banner(user_name, goal, level, gender, age_range) → str` — personalised prompt using gender + age_range for subject description
- `generate_course_cover(topic, level) → str`
- `generate_milestone_card(bps_level) → str` — for BPS level-up notifications
- `generate_streak_milestone_card(streak_count) → str` — for streak milestone notifications
- All callers check `if existing_url: return existing_url` before calling — images generated ONCE, stored as TEXT, never regenerated

### E.8 `backend/services/journey_service.py`

- Roadmap generation: calls Gemini via `generate_json()`; prompt includes user's BPS level, weak_points topics, native_language, intent, goal; `elements` count proportional to `timeline_months` (1M=4, 2M=6, 3M=9, 4M=12, 5M=15, 6M=18)
- `get_roadmap(user_id, db)` — enriches each element with `exists: bool` and `course_id: str | None` by fuzzy-matching `elem.topic` against the user's courses; fuzzywuzzy `token_sort_ratio ≥ 70`
- `check_roadmap_progress(user_id, completed_course_title_or_topic, db)` — called after every module quiz pass that triggers course completion; fuzzy-matches against roadmap element topics; if match found: marks element completed in JSONB, checks if all done, fires journey_reminder notifications and awards bonus XP
- **Notification hooks** (all `journey_reminder` type):
  - Obstacle cleared: immediate
  - Halfway-timeline warning: `>50%` of timeline elapsed but `<30%` of elements completed; Redis-gated key `journey_halfway_notif:{user_id}`
  - 7-day deadline warning: `deadline ≤ 7 days`; Redis-gated key `journey_7day_notif:{user_id}`
  - Journey completed: fires on full completion

### E.9 `backend/services/email_service.py`

- Uses Resend Python SDK (`resend 2.6.0`)
- `send_otp_email(to_email, code)` — sends 6-digit code in styled HTML email; code displayed in a bold box (not a clickable link)
- All sends wrapped in try/except; failures are logged, not raised

### E.10 `backend/services/spelling_service.py`

- `get_next_word(user_id, db) → VocabularyLearned` — Leitner-box-inspired selection: words in `wordmatch:wrong:{user_id}` Redis set get ×3 weight; recent words (last 10 in `wordmatch:seen:{user_id}`) excluded; minimum 1 word in vocabulary_learned required
- `evaluate_answer(vocab_id, answer, difficulty, user_id, db) → dict` — Levenshtein edit distance: `distance == 0 → correct`, `distance == 1 → almost` (yellow feedback), else wrong; XP via `XP_TABLE = {easy:1, medium:2, hard:4}`
- `_levenshtein(a, b) → int` — custom implementation (not using library)
- `save_session_score(user_id, db, correct, attempted, game_type)` — upserts best-score-per-day per game_type

### E.11 `backend/services/word_match_service.py`

- `get_word_match_question(user_id, db) → dict` — Leitner-box selection; builds 3 distractor meanings by querying other vocabulary_learned rows; deduplicates meanings to prevent similar distractors; shuffles options + records correct_index
- `evaluate_word_match(vocab_id, chosen_index, user_id, db) → dict` — compares chosen_index to correct_index; case-insensitive; updates Redis wrong-list
- Separate Redis keys from Spelling: `wordmatch:wrong:{user_id}`, `wordmatch:seen:{user_id}`

### E.12 `backend/services/admin_service.py`

- `get_stats()` — aggregate counts: users, active today, quiz pass rate, course count, chatbot messages, avg BPS level
- `get_all_users(search, page, limit, start_date, end_date)` — paginated; `last_active` from MAX(activity_logs.created_at)
- `get_user_detail(user_id)` — profile + 8 stat counts + `total_time_spent_seconds` (SUM activity_logs duration) + `total_chat_messages` + `avg_messages_per_session` + `avg_quiz_score_module` + `avg_quiz_score_standalone` + `score_trajectory` (merged, sorted, capped 50)
- `get_score_distribution(start_date, end_date)` — 10-point buckets; mean + median calculated in Python
- `get_weak_points_distribution(start_date, end_date)` — GROUP BY (type, topic); distinct user_count; avg strength using Python `round(float(r.avg_strength), 2)` (NOT `func.round` — that caused SQL error)

---

## Section F — Key Flows

### F.1 User Registration Flow

1. `POST /api/auth/register` → validates email uniqueness, hashes password via `bcrypt.hashpw(password.encode(), bcrypt.gensalt())`, sets `role = 'admin'` if email in `ADMIN_EMAILS`, inserts to `users` table, returns JWT
2. `POST /api/auth/google` → verifies Google ID token via `google.oauth2.id_token.verify_oauth2_token()`, creates user if new (with `password_hash = NULL`), returns JWT with `requires_password_setup = True` if no password
3. Frontend: if `requires_password_setup`, shows `SetPasswordModal` (non-dismissible, z-[90])
4. `POST /api/auth/set-password` → no current_password required (first-time setup); updates `password_hash`

### F.2 Chatbot RAG Flow

1. User sends message → `POST /api/chatbot/message`
2. `asyncio.gather()` fires 3 parallel Redis lookups: history, RAG cache (key = SHA256 of message), profile
3. **Cache miss - RAG**: `rag_service.similarity_search(query, db, k=3)` → `get_embeddings([query])` → `SELECT content FROM documents ORDER BY embedding <=> $1 LIMIT 3`
4. **Cache miss - history**: `SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at DESC LIMIT 12`
5. Prompt assembled: `[SystemMessage(CHATBOT_SYSTEM_PROMPT + RAG_CONTEXT + LEARNER_CONTEXT), ...history_messages, HumanMessage(user_message)]`
6. `gemini_service.stream_text(messages)` → SSE chunks yielded to client
7. Post-stream: save assistant message to DB, `asyncio.create_task(_extract_and_save())`, `_update_history_cache()` (in-place append, not cache bust)

### F.3 Course Generation Flow

1. `POST /api/courses/generate` → rate check (5/hr), validate topic via content_filter, `BackgroundTasks.add_task(_run_generation_task)`; returns `{job_id}` (202)
2. Background: `_update_job(job_id, "running", 5, "Checking existing courses…")`
3. `_find_template(slug, db)` → if found: `_clone_course()` → `_update_job(100, "Course ready!")`
4. Slow path: `generate_course_skeleton()` via `generate_json_with_usage()`, log tokens; `asyncio.gather()` over all classes with semaphore; `save_course()`; mark as template; `course_complete` notification; `generate_course_cover()` async task
5. Frontend: `CourseGenerationProgress` component polls `GET /api/courses/jobs/{job_id}` every 3s via React Query `refetchInterval`

### F.4 Module Quiz → Journey Progress Flow

1. User submits all classes in a module → `POST /api/courses/{id}/modules/{mid}/classes/{cid}/complete` for each class
2. All classes done → frontend navigates to `GET /api/courses/{id}/modules/{mid}/quiz`
3. `POST /api/courses/{id}/modules/{mid}/quiz` with answers → `submit_module_quiz()`:
   - Scores answers; wrong answers → `_update_weak_points()`; correct answers → `_improve_weak_points()`
   - If `score ≥ 0.70`: unlock next module, award 25 XP via `record_learning_activity()`
   - `_check_course_completion_for_journey(user_id, course_id, db)` — if all modules passed: calls `journey_service.check_roadmap_progress(user_id, course.topic or course.title, db)`
4. `check_roadmap_progress()` — fuzzy-matches topic against roadmap elements (`token_sort_ratio ≥ 70`); marks element completed; checks if all done; fires `journey_reminder` notifications; awards bonus XP (100 for obstacle, 500 for full journey on time)

### F.5 Adaptive Quiz BPS Recalculation Flow

1. `POST /api/quiz/submit` → `submit_standalone_quiz()`:
   - Score answers, update weak points
   - `old_bps = user.proficiency_level`
   - `new_bps = _calculate_cefr_level(user_id, db)` — avg last 3 standalone scores
   - If `old_bps != new_bps`: update `users.proficiency_level`, fire `bps_milestone` notification with milestone card image, call `journey_service.check_bps_change(user_id, old_bps, new_bps)` (sets `journey_bps_upgrade:{user_id}` Redis flag if upgraded)
   - If passed: award 25 XP

### F.6 Forgot Password (OTP) Flow

1. `POST /api/auth/forgot-password` → generate 6-digit OTP, compute `SHA256(email:code)`, store in `password_reset_tokens` (10-min TTL), send email via Resend. Returns 200 for ANY email (enumeration protection).
2. `POST /api/auth/verify-reset-code` → look up `token_hash`, check `expires_at > now()`, check `used = false`. Returns 200 (code NOT consumed yet).
3. `POST /api/auth/reset-password` → validates code again atomically, sets `used = true`, updates `password_hash` via `bcrypt.hashpw()`.

### F.7 First-Login Onboarding Flow

1. User registers → `onboarding_completed = false`, `has_seen_tour = false`
2. Dashboard layout checks: if profile loaded and `!onboarding_completed` → show `OnboardingModal`
3. Onboarding: 8 steps (Welcome → Gender/Age → NativeLang → WhyLearning → CurrentLevel → Goal → Timeline → DailyStudy)
4. Each step PATCHes `/api/profile/` with partial data
5. Final step: `PATCH /api/profile/` with `onboarding_completed: true` → triggers roadmap generation modal
6. After roadmap generated: UI tour launches (desktop: driver.js; mobile: card-slide framer-motion)
7. Tour completion: `PATCH /api/profile/` with `has_seen_tour: true`
8. `TipToast` suppressed until both `onboarding_completed` and `has_seen_tour` are true

---

## Section G — AI Pipeline

### G.1 LLM Configuration

```python
# backend/services/gemini_service.py
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
CHATBOT_MODEL = os.getenv("CHATBOT_GEMINI_MODEL", "gemini-2.5-flash")
EMBEDDING_MODEL = "models/gemini-embedding-001"
EMBEDDING_DIM = 768
```

The chatbot and course/quiz generators all use `gemini-2.5-flash`. There is no separate faster model for different features — the same model is used throughout.

### G.2 System Prompt Architecture (Chatbot)

The full `CHATBOT_SYSTEM_PROMPT` (`backend/services/langchain_service.py:L36`) contains:

1. **Role declaration**: "BahasaBot AI Tutor, friendly and patient Bahasa Melayu tutor"
2. **Language detection rule** (ABSOLUTE, overrides all): English input → English response; Malay input → Malay response; mixed → English
3. **Malaysian BM dialect rule**: kosong (not nol), awak/kamu (not anda in casual), kereta (not mobil) — Dewan Bahasa dan Pustaka standard
4. **App-awareness block**: lists all sidebar features with navigation instructions; instructs bot to redirect user to correct feature rather than simulate it
5. **Vocabulary formatting rule**: Malay words appear in responses as `word /ipa/ — meaning` format so the frontend can extract VocabPills

At runtime, `stream_chat_response()` prepends a `LEARNER CONTEXT` block to the system message:
```
LEARNER CONTEXT:
Native language: {native_language}
Learning goal: {learning_goal}
Proficiency level: {bps_level} — {_BPS_DESCRIPTIONS[bps_level]}

RAG CONTEXT:
{retrieved_chunks}
```

### G.3 RAG Corpus

- Source: `backend/data/malay_corpus.py` (1155 lines)
- Content: 60+ semantic chunks covering: numbers, greetings, days/months, family vocabulary, food/drink, directions, formal/informal registers, common grammar patterns, cultural context
- Ingested ONCE on first startup (`ingest_corpus_if_empty()` in lifespan); skipped on subsequent starts
- Embedding model: `models/gemini-embedding-001` (768 dims)
- Similarity search: cosine distance (`<=>` operator), `k=3`
- RAG results cached in Redis with 5-minute TTL keyed on SHA256(query)

### G.4 Course Generation Prompt Pattern

Course skeleton generation calls `generate_json_with_usage()` with a structured prompt that:
- Specifies target BPS level (BPS-1 to BPS-4)
- Requests output in strict JSON: `{title, description, objectives[], modules: [{title, description, classes: [{title}]}]}`
- Instructs: lesson content in English, Malay vocabulary taught inline, Malaysian BM only

Class content generation (parallel, semaphore=2):
- Calls `generate_json_with_usage()` per class
- Returns `{content: "...", vocabulary: [{word, meaning, ipa, example}], examples: [{malay, english}]}`

### G.5 Quiz Generation Prompt Pattern

Module quiz (10 questions):
- Prompt includes: all vocabulary_json + examples_json from module's classes
- Output: `{questions: [{type: "mcq"|"fill", question, options?[], correct_answer, explanation}]}`
- Cached in Redis for 2 hours per (module_id, user_id) key

Standalone quiz (15 questions):
- Prompt includes: user's top weak_points (lowest strength_score first), vocabulary_learned sample
- Output: same schema; `type` includes `"translation"` in addition to mcq and fill
- Cached in Redis for 30 minutes per user_id key

### G.6 Image Generation

Direct httpx REST call (NOT SDK):
```python
url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_IMAGE_MODEL}:generateContent?key={API_KEY}"
payload = {
    "contents": [{"parts": [{"text": prompt}]}],
    "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]}
}
response = await httpx.AsyncClient().post(url, json=payload)
# Extract base64 from response.json()["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
```

Images are stored as `data:image/jpeg;base64,...` TEXT in the database. Generation is always fire-and-forget (`asyncio.create_task()`). The calling code always checks if a URL already exists before generating.

---

## Section H — Caching

### H.1 Redis Cache Inventory

All cache operations go through `backend/utils/cache.py` which uses `orjson` for serialization. Cache failures are always logged and silently ignored — the app degrades gracefully when Redis is unavailable.

| Key Pattern | TTL | Set By | Invalidated By |
|---|---|---|---|
| `course_job:{job_id}` | 3600s (1hr) | course generation background task | naturally expires |
| `quiz:module:{mid}:user:{uid}` | 7200s (2hr) | quiz_service get_module_quiz | quiz submit (on fail) |
| `quiz:standalone:{uid}` | 1800s (30min) | quiz_service get_standalone_quiz | quiz submit |
| `dashboard:{uid}` | 300s (5min) | dashboard GET / | class completion, quiz submit |
| `admin:stats` | 120s (2min) | admin stats endpoint | naturally expires |
| `gamif:streak:{uid}` | 172800s (48hr) | gamification record_learning_activity | naturally expires |
| `chatbot:history:{uid}:{sid}` | 1800s (30min) | langchain_service stream_chat_response | _update_history_cache appends in-place |
| `chatbot:rag:{sha256_of_query}` | 300s (5min) | langchain_service stream_chat_response | naturally expires |
| `chatbot:profile:{uid}` | 300s (5min) | langchain_service get_cached_profile | PATCH /api/profile/ |
| `journey:{uid}` | 3600s (1hr) | journey_service get_roadmap | course save, element completion |
| `journey_bps_upgrade:{uid}` | 604800s (7d) | quiz_service check_bps_change | dismiss-upgrade endpoint |
| `journey_halfway_notif:{uid}` | no expiry | journey_service | never (one-shot) |
| `journey_7day_notif:{uid}` | no expiry | journey_service | never (one-shot) |
| `wordmatch:wrong:{uid}` | 7d | word_match_service evaluate_word_match | naturally expires |
| `wordmatch:seen:{uid}` | session | word_match_service get_word_match_question | naturally expires |
| `spelling:wrong:{uid}` | 7d | spelling_service evaluate_answer | naturally expires |
| `spelling:seen:{uid}` | session | spelling_service get_next_word | naturally expires |
| `leaderboard:weekly` | 300s (5min) | dashboard leaderboard endpoint | naturally expires |

### H.2 Rate Limiting

`backend/middleware/rate_limiter.py` using SlowAPI. Limits stored in Redis.

| Endpoint | Limit | Key Function |
|---|---|---|
| `POST /api/chatbot/message` | 20 per minute | `_get_user_id_or_ip()` — decodes JWT without DB hit |
| `POST /api/courses/generate` | 5 per hour | `_get_user_id_or_ip()` |
| `POST /api/auth/*` | 10 per minute | IP address |

When Redis is unavailable, the rate limiter falls back to in-memory storage (does not 500).

---

## Section I — Integrations

### I.1 Google Gemini API

- **Text model**: `gemini-2.5-flash` via `langchain-google-genai 1.0.10`
- **Embedding model**: `models/gemini-embedding-001` via `google-generativeai 0.7.2`
- **Image model**: `gemini-3.1-flash-image-preview` via httpx REST API (SDK incompatible with image generation in v0.7.2)
- API key: `GOOGLE_API_KEY` env var

### I.2 Google OAuth

- Backend: `google-auth==2.29.0` (pinned to avoid version conflicts with google-generativeai)
- `google.oauth2.id_token.verify_oauth2_token()` in `backend/routers/auth.py`
- Frontend: `next-auth` Google provider + `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- Both sides must use the same `GOOGLE_CLIENT_ID`

### I.3 NextAuth v5

- `frontend/app/api/auth/[...nextauth]/route.ts` + `frontend/lib/auth.ts`
- **Credentials provider**: receives email + password → calls `POST /api/auth/login` → stores FastAPI JWT in NextAuth session
- **Google provider**: receives Google token → calls `POST /api/auth/google` → stores FastAPI JWT
- `strategy: "jwt"`, `maxAge: 30 * 60` (30-min NextAuth session)
- The session `access_token` IS the FastAPI JWT; all API calls use it directly

### I.4 Resend (Email)

- `resend 2.6.0` Python SDK
- Only used for OTP password reset emails
- `RESEND_API_KEY` + `RESEND_FROM_EMAIL` env vars
- `backend/services/email_service.py`

### I.5 Sentry (Error Monitoring)

- Backend: `sentry_sdk.init()` in `backend/main.py:L56`; `traces_sample_rate=1.0` in production, `0.0` in dev
- Frontend: `@sentry/nextjs 8.55.0`; configured in `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts`
- `send_default_pii=False` on backend (privacy compliance)

### I.6 pgvector

- PostgreSQL extension on Neon
- Python client: `pgvector 0.2.5` (required: `>=0.2.5,<0.3.0` due to langchain-postgres compatibility constraint)
- `vector(768)` column type on `documents.embedding`
- Cosine distance operator `<=>` used in similarity search

### I.7 Web Speech API (Pronunciation)

- Browser-native, zero cost, no external API
- `frontend/lib/hooks/usePronunciation.ts` — `SpeechSynthesis.speak()` with `lang='ms-MY'`
- Fallback chain: `ms-MY` → `ms` → default voice
- `rate=0.85` for clearer pronunciation
- `voiceschanged` listener handles Chrome's async voice loading
- `frontend/components/ui/SpeakerButton.tsx` — reusable component; returns `null` when `isSupported = false`

---

## Section J — Algorithms & Constants

### J.1 BPS Level Calculation

`backend/services/quiz_service.py` — `_calculate_cefr_level(user_id, db)`:
```
Fetch last 3 standalone_quiz_attempts for user, ordered by taken_at DESC
avg_score = mean(scores) or 0.0 if no attempts
if avg_score >= 0.80: return "BPS-4"
if avg_score >= 0.60: return "BPS-3"
if avg_score >= 0.40: return "BPS-2"
else: return "BPS-1"
```
Default on registration: `BPS-1`.

### J.2 Topic Slug Normalisation

`backend/services/course_service.py` — `_make_topic_slug(topic, level)`:
```python
slug = topic.lower()
slug = re.sub(r'[^a-z0-9\s]', '', slug)   # strip non-alphanumeric
slug = re.sub(r'\s+', '-', slug.strip())   # collapse whitespace → hyphens
level_suffix = level.lower().replace('-', '')  # "BPS-1" → "bps1"
result = f"{slug}:{level_suffix}"
return result[:600]
```

### J.3 Leitner-Box Word Selection

`backend/services/spelling_service.py` — `get_next_word()`:
- Query all `vocabulary_learned` rows for user, excluding last 10 seen words (from Redis ring buffer)
- Words in `wrong_word_ids` Redis set get 3× weight
- Random weighted selection from remaining candidates
- Minimum: 1 word required; raises 400 if vocabulary_learned is empty

### J.4 Levenshtein Edit Distance

`backend/services/spelling_service.py` — `_levenshtein(a, b)`:
- Custom O(nm) dynamic programming implementation
- `distance == 0` → correct; `distance == 1` → almost; else → wrong
- Not using python-Levenshtein library for this function (fuzzywuzzy/python-Levenshtein used only for roadmap fuzzy matching)

### J.5 Roadmap Fuzzy Matching

`backend/services/journey_service.py`:
- `fuzzywuzzy.fuzz.token_sort_ratio(elem_topic, course_title_or_topic) >= 70`
- `token_sort_ratio` sorts both strings' tokens alphabetically before comparison — handles word order differences (e.g. "food ordering" vs "ordering food")
- `course.topic or course.title` used as the right-hand operand — `topic` is the raw user input that directly matches roadmap element topics; `title` is the AI-generated alternative

### J.6 XP Awards

`backend/services/gamification_service.py`:
```
Class completion:     10 XP
Module quiz pass:     25 XP
Standalone quiz pass: 25 XP
Chatbot session:       5 XP (Redis-deduped per session_id)
Spelling correct:      easy=1 / medium=2 / hard=4 XP
Word Match correct:    easy=1 / medium=1 / hard=2 XP
Journey obstacle:    100 XP bonus (on top of regular course XP)
Journey completed (on time): 500 XP
Journey completed (late):    200 XP
```

### J.7 Difficulty Timer Constants

`frontend/components/games/DifficultySelector.tsx`:
```typescript
export const DIFFICULTY_TIMER = { easy: 20, medium: 10, hard: 5 }  // seconds per word
```

### J.8 JWT Token Structure

```python
# backend/routers/auth.py
payload = {
    "sub": str(user.id),   # user UUID
    "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    "type": "access"
}
# signed with JWT_SECRET via HS256 (python-jose)
```

### J.9 Password Hashing

```python
# Direct bcrypt (NOT passlib) — passlib has incompatibility with bcrypt >= 4.x
bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8"))
```

### J.10 Roadmap Element Count Formula

```
timeline_months:  1  → elements: 4
timeline_months:  2  → elements: 6
timeline_months:  3  → elements: 9
timeline_months:  4  → elements: 12
timeline_months:  5  → elements: 15
timeline_months:  6  → elements: 18
```

---

## Section K — Testing

### K.1 Automated Tests Present

- `backend/requirements.txt` includes `pytest 8.3.2` — test framework installed
- From `PHASES.md` Phase 19 test results: Levenshtein unit tests (5 pass), IPA extraction unit tests (3 pass)
- `backend/scripts/create_supervisor_admin.py` — idempotent seed script (not a test but runnable utility)

### K.2 No End-to-End Test Suite

- No `frontend/cypress/`, `frontend/playwright/`, or `frontend/__tests__/` directories found
- No `backend/tests/` directory confirmed — `[TO VERIFY: check if tests/ exists but wasn't surfaced in file reads]`
- Frontend TypeScript type checking (`tsc --noEmit`) run after major changes; confirmed 0 errors at end of each session

### K.3 Manual Testing Protocol

From `PHASES.md` Phase 19:
- Live API tests via JWT-authenticated HTTP requests against running backend
- Smoke-test: "deploy and smoke-test all features" (marked as pending in Phase 23 checklist)

### K.4 Gaps

- No automated integration tests for the Gemini API pipeline
- No load testing (target: 30 concurrent users — within free-tier limits)
- No automated tests for frontend components
- No CI/CD test pipeline (Vercel auto-deploys but runs no test suite before deploying)

---

## Section L — Feature Status

| Feature | Phase | Status | Key Files |
|---|---|---|---|
| Auth (email + Google OAuth) | 1 | ✅ Complete | `backend/routers/auth.py`, `frontend/lib/auth.ts`, `frontend/app/(auth)/` |
| SetPasswordModal (Google users) | 33 | ✅ Complete | `frontend/components/auth/SetPasswordModal.tsx` |
| Auth page feature slideshow | 73 | ✅ Complete | `frontend/components/ui/auth-card.tsx` |
| AI Chatbot (SSE streaming + RAG) | 3 | ✅ Complete | `backend/routers/chatbot.py`, `backend/services/langchain_service.py` |
| Chatbot app-awareness | 3 | ✅ Complete | `CHATBOT_SYSTEM_PROMPT` in `langchain_service.py` |
| Chatbot latency optimisations | 34/59 | ✅ Complete | `langchain_service.py` (parallel Redis, profile cache), `chatbot.py` (prewarm endpoint) |
| Dynamic Course Generator | 4 | ✅ Complete | `backend/services/course_service.py`, `frontend/components/courses/` |
| Background Course Generation | 9 | ✅ Complete | `courses.py` BackgroundTasks, `CourseGenerationProgress.tsx` |
| Course Deduplication + Clone | 24 | ✅ Complete | `course_service.py` (_make_topic_slug, _find_template, _clone_course) |
| Module Quiz | 5 | ✅ Complete | `backend/services/quiz_service.py` |
| Standalone Adaptive Quiz | 6 | ✅ Complete | `quiz_service.py`, `frontend/app/(dashboard)/quiz/adaptive/` |
| BPS Migration (CEFR retired) | 10 | ✅ Complete | All DB, backend, frontend labels updated |
| User Dashboard | 7 | ✅ Complete | `backend/routers/dashboard.py`, `frontend/app/(dashboard)/dashboard/` |
| Weekly XP Leaderboard | 26 | ✅ Complete | `dashboard.py` leaderboard endpoint, `LeaderboardCard.tsx`, `xp_logs` table |
| Production Hardening | 8 | ✅ Complete | Rate limiting, CORS, error handling, logging, connection pooling |
| DB Schema Migrations | 2/11 | ✅ 15 migrations applied | `backend/db/migrations/versions/` |
| Forgot Password (OTP) | 12 | ✅ Complete (rebuilt 2026-04-15) | `auth.py` 3 endpoints, `email_service.py`, `frontend/app/(auth)/forgot-password/` |
| User Profile + Settings | 13 | ✅ Complete | `backend/routers/profile.py`, `frontend/app/(dashboard)/settings/` |
| Delete Account | 26/45 | ✅ Complete | `profile.py` delete-account endpoint, `DeleteAccountModal.tsx` |
| Onboarding Flow | 14 | ✅ Complete (8 steps) | `frontend/components/onboarding/OnboardingModal.tsx` |
| First-Login UI Tour | 26/68 | ✅ Complete (desktop driver.js + mobile card-slide) | `frontend/app/(dashboard)/layout.tsx` |
| Admin Control Panel | 15 | ✅ Complete + Eval enhancements | `backend/routers/admin.py`, `backend/services/admin_service.py` |
| Admin CSV Export | 54 | ✅ Complete | `backend/routers/admin_export.py` |
| Admin Analytics (Score Dist + Weak Points) | 55 | ✅ Complete | `admin_service.py`, `admin/page.tsx` |
| Pronunciation Audio (Web Speech API) | 16 | ✅ Complete | `usePronunciation.ts`, `SpeakerButton.tsx` |
| Notification System | 17 | ✅ Complete + Clear-all (Session 18) | `backend/routers/notifications.py`, `NotificationBell.tsx` |
| Gamification (Streak + XP) | 18 | ✅ Complete | `gamification_service.py`, `StreakBadge.tsx`, `XPBar.tsx` |
| Spelling Practice Game (v3 difficulty modes) | 19/26/27 | ✅ Complete | `spelling_service.py`, `SpellingGame.tsx`, `DifficultySelector.tsx` |
| Word Match Game | 27 | ✅ Complete | `word_match_service.py`, `WordMatchGame.tsx` |
| Games Hub | 27 | ✅ Complete | `frontend/app/(dashboard)/games/page.tsx` |
| My Journey (Roadmap v2) | 20 | ✅ Complete + Patches | `journey_service.py`, `backend/routers/journey.py`, `frontend/app/(dashboard)/journey/page.tsx` |
| Chat History Page | 21 | ✅ Complete + Session Delete | `frontend/app/(dashboard)/chatbot/history/page.tsx` |
| Image Generation (Gemini Image API) | 22 | ✅ Complete (httpx REST) | `backend/services/image_service.py` |
| UI/UX Overhaul | 23 | ✅ Complete | Dark olive palette, GlowCard, ShaderAnimation, split-screen auth |
| Loading Skeletons | 23 | ✅ Partial (admin skeletons pending) | `frontend/app/(dashboard)/dashboard/page.tsx`, `journey/page.tsx` |
| Evaluation Feedback Survey | 20 / 5.20 | ✅ Complete | `evaluation.py`, `EvaluationFeedbackModal.tsx` |
| User Feedback from Settings | 18 | ✅ Complete | `frontend/app/(dashboard)/settings/feedback/page.tsx` |
| Subscription Marketing Pages | 25 | ✅ Complete + Glassy redesign (Session 71) | `frontend/app/pricing/page.tsx`, `settings/billing/page.tsx` |
| Daily Language Tips | 26/68 | ✅ Complete | `backend/routers/tips.py`, `TipToast.tsx` |
| Mobile Auto-hide Nav | 68 | ✅ Complete | `AppSidebar.tsx` scroll listener |
| About / Credits Page | 13 | ✅ Complete | `frontend/app/(dashboard)/settings/about/page.tsx` |
| Demo Admin Seed Script | 23 | ✅ (admin seed only) | `backend/scripts/create_supervisor_admin.py` |
| Demo Data Seed Script | 23 | ⏳ Pending | `backend/data/seed_demo.py` — not yet created |
| Full E2E Smoke Test | 23 | ⏳ Pending | Manual — listed in Phase 23 checklist |
| CI/CD Test Pipeline | — | ❌ Not implemented | No automated test suite in CI |
