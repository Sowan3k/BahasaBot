# BahasaBot — Development Phases
_Tell Claude "Work on Phase X" to focus only on that phase_
_Check off tasks as they are completed_

## How to start a phase
Say: "Read .claude/STATUS.md and .claude/PHASES.md. Work on [Phase Name]."

---

## Phase 1 — Scaffold, Auth & Protected Routes (Days 1–2)
_Status: ✅ Complete_

- [x] Project scaffold and folder structure (frontend + backend)
- [x] Environment setup (.env files, .env.example)
- [x] Email + password registration (POST /api/auth/register)
- [x] Email + password login (POST /api/auth/login)
- [x] Google OAuth login (POST /api/auth/google)
- [x] JWT access + refresh token issuance
- [x] POST /api/auth/refresh — exchange refresh token for new access token
- [x] GET /api/auth/me — get current authenticated user
- [x] NextAuth v5 JWT session (frontend/lib/auth.ts)
- [x] Protected routes via frontend/middleware.ts
- [x] User profile stored in PostgreSQL (models/user.py)

---

## Phase 2 — Database Schema, Migrations & Redis (Days 3–4)
_Status: ✅ Complete_

- [x] Full PostgreSQL schema (all tables: users, courses, modules, classes, progress, quiz, vocab, grammar, chatbot, RAG)
- [x] Alembic initial migration (20260317_1856_initial_schema.py)
- [x] Alembic fix migrations (0001, 0002)
- [x] SQLAlchemy async ORM models (models/*.py)
- [x] Async DB engine + session factory (db/database.py)
- [x] Connection pooling (10 core, 20 overflow, pool_pre_ping)
- [x] Redis connection (utils/cache.py)
- [x] DB indexes on user_id, course_id, module_id, created_at

---

## Phase 3 — Gemini, LangChain, RAG & AI Chatbot (Days 5–7)
_Status: ✅ Complete (services not fully verified)_

- [x] Gemini API integration with retry + fallback (services/gemini_service.py)
- [x] Text generation, JSON generation, streaming, embeddings
- [x] LangChain chains setup (services/langchain_service.py) ⚠️ not verified
- [x] RAG pipeline with pgvector similarity search (services/rag_service.py) ⚠️ not verified
- [x] Malay language corpus seeding — ⚠️ backend/data/malay_corpus.py MISSING
- [x] POST /api/chatbot/message — SSE streaming response
- [x] GET /api/chatbot/history — paginated message history
- [x] GET /api/chatbot/sessions — list user's sessions
- [x] Conversation memory: last 10 messages loaded from PostgreSQL
- [x] Auto-extraction of vocabulary and grammar from AI responses
- [x] Rate limited: 20 messages/minute per user
- [x] Frontend: SSE streaming chat UI (app/chatbot/page.tsx)
- [x] Frontend: ChatMessage component, VocabularyHighlight component

---

## Phase 4 — Dynamic Course Generator (Days 8–10)
_Status: ✅ Complete_

- [x] POST /api/courses/generate — generate course from topic
- [x] Two-pass content filter: regex blocklist + Gemini moderation (utils/content_filter.py)
- [x] Gemini course skeleton generation (Course → Modules → Classes)
- [x] Parallel class content generation (asyncio.gather, Semaphore-limited to 3)
- [x] Course persistence: courses, modules, classes tables
- [x] Vocabulary saved to vocabulary_learned on class completion
- [x] GET /api/courses/ — list user's courses (paginated)
- [x] GET /api/courses/{id} — full course tree with progress + lock state
- [x] GET /api/courses/{id}/modules/{mid}/classes/{cid} — class detail
- [x] POST /api/courses/{id}/modules/{mid}/classes/{cid}/complete — mark class done
- [x] DELETE /api/courses/{id} — delete course cascade
- [x] Frontend: course library page, CourseGenerationModal
- [x] Frontend: course detail, module detail, class content pages
- [x] Module locking (quiz pass required to unlock next module)

---

## Phase 5 — Module Quiz (Days 11–12)
_Status: ✅ Complete_

- [x] GET /api/courses/{id}/modules/{mid}/quiz — get or generate module quiz
- [x] POST /api/courses/{id}/modules/{mid}/quiz — submit answers
- [x] 10 questions: 6 MCQ + 4 fill-in-blank
- [x] Score ≥ 70% required to unlock next module
- [x] Wrong answers update weak_points table
- [x] Redis cache for generated quizzes (2h TTL)
- [x] Frontend: module quiz page (courses/[courseId]/modules/[moduleId]/quiz/page.tsx)

---

## Phase 6 — Standalone Adaptive Quiz (Days 13–14)
_Status: ✅ Complete_

- [x] GET /api/quiz/ — generate adaptive 15-question quiz from user's weak points
- [x] POST /api/quiz/submit — score answers, update weak/strong points, recalculate CEFR
- [x] Question mix: 6 MCQ + 6 fill-in-blank + 3 translation
- [x] CEFR level recalculation after each attempt (A1/A2/B1/B2, rule-based from last 3 attempts)
- [x] Redis cache (30min TTL per user)
- [x] Score history tracked (standalone_quiz_attempts table)
- [x] Frontend: adaptive quiz page (quiz/adaptive/page.tsx)
- [x] Frontend: results page — ⚠️ completeness unknown (quiz/adaptive/results/page.tsx)
- [x] Frontend: module quiz results page — ⚠️ completeness unknown (quiz/module/[moduleId]/results/page.tsx)

---

## Phase 7 — User Dashboard (Days 15–16)
_Status: ✅ Complete_

- [x] GET /api/dashboard/ — full dashboard summary (Redis cached 5 min)
- [x] GET /api/dashboard/vocabulary — paginated vocabulary list
- [x] GET /api/dashboard/grammar — paginated grammar list
- [x] GET /api/dashboard/progress — course progress breakdown
- [x] GET /api/dashboard/weak-points — weak points + recommendations
- [x] GET /api/dashboard/quiz-history — paginated quiz history (bonus endpoint)
- [x] backend/services/progress_service.py — all aggregation functions implemented
- [x] backend/routers/dashboard.py — all endpoints wired
- [x] frontend/components/dashboard/StatsCards.tsx — 6 stat cards
- [x] frontend/components/dashboard/CEFRProgressBar.tsx — visual A1→B2 track
- [x] frontend/components/dashboard/VocabularyTable.tsx — searchable paginated table
- [x] frontend/components/dashboard/WeakPointsChart.tsx — recharts horizontal bar chart
- [x] frontend/components/dashboard/QuizHistoryTable.tsx — paginated with pass/fail badges
- [x] frontend/app/(dashboard)/dashboard/page.tsx — 4-tab page (Overview/Vocabulary/Grammar/Quiz History)
- [x] Add dashboard API calls to frontend/lib/api.ts
- [x] Add dashboard TypeScript types to frontend/lib/types.ts

---

## Phase 8 — Production Hardening & Deployment (Days 17–19)
_Status: ✅ Code complete — deployment pending_

- [x] Rate limiting — SlowAPI implemented (rate_limiter.py), wired into main.py, per-route on chatbot (20/min) and course gen (5/hr)
- [x] Input sanitization across all routers — schemas have min/max_length, EmailStr, UUID path params, whitespace stripping
- [x] Error handling audit — all routers: try/except, HTTP status codes, global exception handler in main.py
- [x] Redis caching utilities — cache.py complete (graceful degradation); quiz 30min TTL, module quiz 2h TTL
- [x] Streaming responses for chatbot — SSE via sse-starlette; implemented in chatbot router + langchain_service
- [x] PostgreSQL connection pooling — pool_size=10, pool_pre_ping=True in db/database.py
- [x] Pagination on all list endpoints — courses, chatbot sessions, chatbot history
- [x] Python logging — structlog JSON in production, colored dev output; get_logger used in all routers
- [x] Sentry integration — backend: sentry_sdk.init() in main.py; frontend: @sentry/nextjs + sentry.*.config.ts + instrumentation.ts
- [x] Health endpoint — /health returns Redis status; UptimeRobot can target this
- [x] CORS locked to env var — ALLOWED_ORIGINS reads from .env (set to Vercel domain in production)
- [x] JWT expiry verified — 15min access token, 7-day refresh token
- [x] Deployment config — backend/Procfile + backend/railway.toml; frontend/vercel.json updated
- [x] Environment variables audit — added missing GOOGLE_CLIENT_ID to .env.example
- [ ] Final end-to-end test of all features (manual — deploy and smoke-test)

---

## Phase 9 — Background Course Generation with Progress Tracking
_Status: 🔲 Not started_

**Goal:** Eliminate the full-screen blocking modal during course generation. User submits a topic, the modal closes in ~1 s, and a persistent floating progress bar (bottom-right) tracks generation in the background. User can freely navigate to other features while the course generates.

**Approach:** FastAPI `BackgroundTasks` (no new dependencies) + Redis job state + React Context + `localStorage` + React Query polling every 3 s.

### Backend
- [ ] `backend/schemas/course.py` — replace `CourseGenerateResponse` (returns `job_id` instead of `course_id`); add `JobStatusResponse` schema
- [ ] `backend/services/course_service.py` — add `_update_job()` Redis helper; add `job_id: str | None = None` param to `generate_course()`; write progress milestones at 5 / 15 / 20 / 85 / 100%
- [ ] `backend/routers/courses.py` — add `_run_generation_task()` background wrapper (own DB session); modify generate endpoint to return 202 + `job_id` immediately via `BackgroundTasks`; add `GET /api/courses/jobs/{job_id}` poll endpoint (place before `/{course_id}` route)

### Frontend
- [ ] `frontend/lib/types.ts` — update `CourseGenerateResponse` (now `job_id`); add `JobStatus` type + `JobStatusResponse` interface
- [ ] `frontend/lib/api.ts` — add `coursesApi.getJobStatus(jobId)`
- [ ] `frontend/lib/course-generation-context.tsx` *(new file)* — React Context + `localStorage` persistence of active `job_id` across navigation and page refresh
- [ ] `frontend/components/courses/CourseGenerationProgress.tsx` *(new file)* — fixed bottom-right floating card; polls every 3 s via React Query `refetchInterval`; shows progress bar + step text while running; "View Course" link + dismiss on complete; error + dismiss on failure; invalidates `["courses"]` query on completion
- [ ] `frontend/app/(dashboard)/layout.tsx` — wrap with `<CourseGenerationProvider>`; render `<CourseGenerationProgress />` outside `<main>` so it overlays all pages
- [ ] `frontend/components/courses/CourseGenerationModal.tsx` — submit → get `job_id` → `setActiveJobId()` → `onClose()` immediately; remove `setInterval` step-cycling timer; modal no longer blocks
- [ ] `frontend/app/(dashboard)/courses/page.tsx` — disable "+ New Course" button while `activeJobId !== null`

### Edge cases covered
- Redis down: course still generates; poll returns 404s → frontend clears job after retries
- Browser refresh mid-generation: `localStorage` restores `job_id`; polling resumes
- Sign-out / different user: poll returns 404 (user_id mismatch) → clears localStorage
- Rate limit hit (5/hr): 429 returned before `job_id` is issued; modal shows error as before
- Generation failure: background task catches exception → writes `status: "failed"` to Redis → error shown in floating card

---

## Final Phase — Production Readiness
- [ ] Rate limiting audit (backend/middleware/rate_limiter.py)
- [ ] Input sanitization across all routers
- [ ] Error handling audit (all routers + services)
- [ ] Redis caching (backend/utils/cache.py)
- [ ] malay_corpus.py — create missing RAG seed corpus
- [ ] Verify langchain_service.py completeness
- [ ] Verify rag_service.py completeness
- [ ] Deployment config — Vercel + Railway + Supabase
- [ ] Environment variables audit (.env.example vs actual usage)
