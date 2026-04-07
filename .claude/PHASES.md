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

### Pending Enhancement (to be done after Phase 13)
- [x] backend/services/langchain_service.py — update CHATBOT_SYSTEM_PROMPT to include user's native_language fetched from users table — pass it as context so the AI tutor can reference linguistic similarities (e.g. "The user's native language is Bengali")

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

## Phase 8 — Production Hardening & Deployment
_Status: ✅ Complete — deployment pending_

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
- [x] JWT expiry verified — access token 30 min, refresh token 7 days
- [x] Deployment config — backend/Procfile + backend/railway.toml; frontend/vercel.json updated
- [x] Environment variables audit — added missing GOOGLE_CLIENT_ID to .env.example
- [ ] Final end-to-end test of all features (manual — deploy and smoke-test)

---

## Phase 9 — Background Course Generation with Progress Tracking
_Status: ✅ Complete_

**Goal:** Eliminate the full-screen blocking modal during course generation. User submits a topic, the modal closes in ~1 s, and a persistent floating progress bar (bottom-right) tracks generation in the background. User can freely navigate to other features while the course generates.

**Approach:** FastAPI `BackgroundTasks` (no new dependencies) + Redis job state + React Context + `localStorage` + React Query polling every 3 s.

### Backend
- [x] `backend/schemas/course.py` — replace `CourseGenerateResponse` (returns `job_id` instead of `course_id`); add `JobStatusResponse` schema
- [x] `backend/services/course_service.py` — add `_update_job()` Redis helper; add `job_id: str | None = None` param to `generate_course()`; write progress milestones at 5 / 15 / 20 / 85 / 100%
- [x] `backend/routers/courses.py` — add `_run_generation_task()` background wrapper (own DB session); modify generate endpoint to return 202 + `job_id` immediately via `BackgroundTasks`; add `GET /api/courses/jobs/{job_id}` poll endpoint (place before `/{course_id}` route)

### Frontend
- [x] `frontend/lib/types.ts` — update `CourseGenerateResponse` (now `job_id`); add `JobStatus` type + `JobStatusResponse` interface
- [x] `frontend/lib/api.ts` — add `coursesApi.getJobStatus(jobId)`
- [x] `frontend/lib/course-generation-context.tsx` *(new file)* — React Context + `localStorage` persistence of active `job_id` across navigation and page refresh
- [x] `frontend/components/courses/CourseGenerationProgress.tsx` *(new file)* — fixed bottom-right floating card; polls every 3 s via React Query `refetchInterval`; shows progress bar + step text while running; "View Course" link + dismiss on complete; error + dismiss on failure; invalidates `["courses"]` query on completion
- [x] `frontend/app/(dashboard)/layout.tsx` — wrap with `<CourseGenerationProvider>`; render `<CourseGenerationProgress />` outside `<main>` so it overlays all pages
- [x] `frontend/components/courses/CourseGenerationModal.tsx` — submit → get `job_id` → `setActiveJobId()` → `onClose()` immediately; remove `setInterval` step-cycling timer; modal no longer blocks
- [x] `frontend/app/(dashboard)/courses/page.tsx` — disable "+ New Course" button while `activeJobId !== null`

### Edge cases covered
- Redis down: course still generates; poll returns 404s → frontend clears job after retries
- Browser refresh mid-generation: `localStorage` restores `job_id`; polling resumes
- Sign-out / different user: poll returns 404 (user_id mismatch) → clears localStorage
- Rate limit hit (5/hr): 429 returned before `job_id` is issued; modal shows error as before
- Generation failure: background task catches exception → writes `status: "failed"` to Redis → error shown in floating card

---

## Phase 10 — BPS Migration (CEFR Rename)
_Status: ✅ Complete_

**Goal:** Fully retire CEFR labels (A1/A2/B1/B2) and replace with BahasaBot Proficiency Scale (BPS-1/BPS-2/BPS-3/BPS-4) across the entire codebase, DB, and UI.

- [x] Write Alembic migration: UPDATE all existing stored values ('A1'→'BPS-1', 'A2'→'BPS-2', 'B1'→'BPS-3', 'B2'→'BPS-4') in users table — `20260402_1000_bps_migration.py`
- [x] backend/models/user.py — Enum values and server_default updated to BPS labels
- [x] backend/schemas/auth.py — Literal type updated to BPS-1/BPS-2/BPS-3/BPS-4
- [x] backend/schemas/quiz.py — comments updated
- [x] backend/services/quiz_service.py — _calculate_cefr_level() returns BPS labels; default "BPS-1"
- [x] backend/services/progress_service.py — default fallback updated to "BPS-1"
- [x] backend/routers/courses.py — default fallback updated to "BPS-1"
- [x] backend/services/course_service.py — prompt text updated from CEFR to BPS labels
- [x] frontend/lib/types.ts — ProficiencyLevel type updated to BPS-1/BPS-2/BPS-3/BPS-4
- [x] frontend/components/dashboard/BPSProgressBar.tsx — new file (CEFRProgressBar.tsx kept for safety; BPSProgressBar.tsx is the active component)
- [x] frontend/app/(dashboard)/dashboard/page.tsx — import updated to BPSProgressBar
- [x] frontend/app/(dashboard)/quiz/adaptive/page.tsx — CEFR_LABEL/CEFR_COLOR → BPS_LABEL/BPS_COLOR; user-facing text updated

---

## Phase 11 — DB Schema Migration (New Tables)
_Status: ✅ Complete_

**Goal:** Add all new tables and columns required by Phases 12–22 in a single Alembic migration so subsequent phases have the DB ready.

- [x] Write single Alembic migration file for all new additions:
  - [x] New table: learning_roadmaps (id, user_id, deadline_date, goal_type, roadmap_json JSONB, banner_image_url, created_at)
  - [x] New table: roadmap_activity_completions (id, user_id, activity_id varchar, completed_at)
  - [x] New table: notifications (id, user_id, type varchar, message text, read boolean default false, created_at)
  - [x] New table: password_reset_tokens (id, user_id, token_hash varchar, expires_at timestamp, used boolean default false, created_at)
  - [x] New table: evaluation_feedback (id, user_id, quiz_type varchar, rating int, weak_points_relevant varchar, comments text, created_at)
  - [x] New table: spelling_game_scores (id, user_id, words_correct int, words_attempted int, session_date date)
  - [x] New columns on users: onboarding_completed boolean default false, native_language varchar nullable, learning_goal varchar nullable, profile_picture_url varchar nullable, role varchar default 'user', streak_count int default 0, xp_total int default 0
  - [x] New column on courses: cover_image_url varchar nullable
- [x] Add SQLAlchemy ORM models for all new tables (backend/models/)
- [x] Run alembic upgrade head and verify all tables created successfully
- [x] Add appropriate DB indexes: notifications(user_id), learning_roadmaps(user_id), password_reset_tokens(token_hash)

---

## Phase 12 — Forgot Password
_Status: ✅ Complete — pending: add RESEND_API_KEY to backend/.env_

**Goal:** Allow email/password users to reset their password via a Resend email link.

### Backend
- [x] backend/services/email_service.py — Resend SDK integration, send_reset_email() function
- [x] backend/routers/auth.py — add POST /api/auth/forgot-password (generate token, store hash, send email)
- [x] backend/routers/auth.py — add POST /api/auth/reset-password (validate token, update password, mark token used)
- [x] Add RESEND_API_KEY to backend/.env.example

### Frontend
- [x] frontend/app/(auth)/forgot-password/page.tsx — email input form, submit triggers API call, show success message
- [x] frontend/app/(auth)/reset-password/page.tsx — reads token from URL query param, new password form, submit triggers API call
- [x] Add "Forgot password?" link on login page pointing to /forgot-password
- [x] Handle Google OAuth accounts: show "Use Google to reset your password" message instead of form

---

## Phase 13 — User Profile Management + Settings Hub
_Status: ✅ Complete_

**Goal:** Let users view and edit their profile. Create the /settings hub that will also house Password and About pages.

### Backend
- [x] backend/routers/profile.py — GET /api/profile/ (return user profile fields)
- [x] backend/routers/profile.py — PATCH /api/profile/ (update name, native_language, learning_goal, profile_picture_url — email and role NOT changeable here)
- [x] backend/routers/profile.py — POST /api/profile/change-password (current + new password; Google guard)
- [x] backend/schemas/profile.py — ProfileResponse and ProfileUpdateRequest Pydantic schemas
- [x] Register profile router in backend/main.py

### Frontend
- [x] frontend/app/(dashboard)/settings/page.tsx — settings hub with links to Profile, Password, About
- [x] frontend/app/(dashboard)/settings/profile/page.tsx — display and edit profile fields
- [x] frontend/app/(dashboard)/settings/password/page.tsx — change password form (current password + new password)
- [x] frontend/app/(dashboard)/settings/about/page.tsx — static About/Credits page (BahasaBot logo, USM logo, Sowan, Dr. Tan Tien Ping, academic year)
- [x] Add Settings link to sidebar
- [x] frontend/lib/api.ts — add profileApi.getProfile(), profileApi.updateProfile(), profileApi.changePassword()
- [x] frontend/lib/types.ts — add UserProfile, ProfileUpdatePayload, ChangePasswordPayload, ChangePasswordResponse

---

## Phase 14 — Onboarding Flow
_Status: ✅ Complete_

**Goal:** Guide new users through setup on their first login only.

- [x] frontend/components/onboarding/OnboardingModal.tsx — multi-step modal component
- [x] frontend/components/onboarding/OnboardingStep.tsx — individual step wrapper
- [x] Steps: Welcome → Native Language selection → Reason for learning Malay → Brief sidebar tour → Optional Journey CTA
- [x] On step completion: PATCH /api/profile/ to save native_language and learning_goal
- [x] On final step: PATCH /api/profile/ to set onboarding_completed = true
- [x] Trigger: check onboarding_completed on dashboard layout load — if false, show modal
- [x] frontend/app/(dashboard)/layout.tsx — add onboarding check and modal render
- [x] backend/schemas/profile.py — added onboarding_completed field to ProfileUpdateRequest
- [x] frontend/lib/types.ts — added onboarding_completed to ProfileUpdatePayload

---

## Phase 15 — Admin Control Panel
_Status: ✅ Complete + Verified (2026-04-06)_

**Goal:** Give admin users a protected dashboard to monitor system usage, manage users, and view evaluation feedback.

### Backend
- [x] backend/services/admin_service.py — get_stats(), get_all_users() (+ search filter), get_feedback_responses(), deactivate_user(), delete_user() (bcrypt pw verify), reset_user_data() (bcrypt pw verify), get_user_analytics()
- [x] backend/models/analytics.py — TokenUsageLog + ActivityLog ORM models (token_usage_logs, activity_logs tables)
- [x] backend/utils/analytics.py — log_tokens() + log_activity() fire-and-forget helpers (try/except, never block requests)
- [x] backend/db/migrations/versions/20260406_0900_analytics_tables.py — Alembic migration applied
- [x] backend/services/gemini_service.py — _invoke_with_retry returns (text, input_tokens, output_tokens); generate_text_with_usage() added
- [x] Activity logging wired into: langchain_service (chatbot), course_service (course_gen), quiz.py (standalone_quiz), courses.py (module_quiz)
- [x] backend/routers/admin.py — GET /api/admin/stats
- [x] backend/routers/admin.py — GET /api/admin/users?search=&page=&limit= (paginated + searchable)
- [x] backend/routers/admin.py — GET /api/admin/users/{id} (full profile + 8 stat counts + recent_courses)
- [x] backend/routers/admin.py — GET /api/admin/users/{id}/analytics?days=7-90
- [x] backend/routers/admin.py — GET /api/admin/feedback (paginated)
- [x] backend/routers/admin.py — PATCH /api/admin/users/{id}/deactivate
- [x] backend/routers/admin.py — DELETE /api/admin/users/{id} (admin_password body required)
- [x] backend/routers/admin.py — POST /api/admin/users/{id}/reset (admin_password body required)
- [x] require_admin dependency — raises HTTP 403 for non-admin; self-target guards → 400
- [x] ADMIN_EMAIL env var — auto-grants role='admin' on first registration
- [x] Register admin router in backend/main.py

### Frontend
- [x] frontend/app/(dashboard)/admin/page.tsx — stats overview (6 stat cards) + section nav cards
- [x] frontend/app/(dashboard)/admin/users/page.tsx — paginated user table, debounced search, BPS badge, deactivate button
- [x] frontend/app/(dashboard)/admin/users/[userId]/page.tsx — profile card + 8 StatPills + recharts LineChart (daily tokens) + BarChart (daily events) + feature breakdown bars + ConfirmModal for delete/reset with admin password field + day-range selector (7/14/30/60/90d)
- [x] frontend/app/(dashboard)/admin/feedback/page.tsx — feedback cards, star ratings, aggregate distribution chart
- [x] Sidebar: Admin link (ShieldCheck icon) shown only when role === 'admin'
- [x] Route protection: all admin pages redirect non-admin to /dashboard
- [x] frontend/lib/api.ts — adminApi (getStats, getUsers, getUserDetail, getUserAnalytics, deactivateUser, deleteUser, resetUserData, getFeedback)
- [x] frontend/lib/types.ts — AdminStats, AdminUser, AdminUserDetail, AdminUserAnalytics, AdminFeedbackItem, AdminFeedbackResponse

### Verified (2026-04-06)
- [x] All 9 admin endpoints return correct responses (smoke-tested end-to-end)
- [x] Activity logging confirmed: quiz submit → `standalone_quiz: 1` in activity_logs immediately
- [x] Password guards: wrong pw → 403, self-target → 400, non-admin → 403
- [x] Analytics NullType bug fixed: `func.cast(type_=None)` → `datetime.now(utc) - timedelta(days=days)`
- [x] TypeScript: zero errors after LucideIcon prop type fix

---

## Phase 16 — Pronunciation Audio + SpeakerButton
_Status: ✅ Complete + Debugged_

**Goal:** Add one-click Malay pronunciation to every vocabulary word across the app.

- [x] frontend/lib/hooks/usePronunciation.ts — Web Speech API hook: speak(word, lang='ms-MY') with fallback chain ms-MY → ms → default; voiceschanged listener for Chrome async loading; rate=0.85
- [x] frontend/components/ui/SpeakerButton.tsx — reusable Volume2 icon button; renders null when isSupported=false; stopPropagation on click; sizes: sm (14px) / xs (12px)
- [x] frontend/components/chatbot/VocabularyHighlight.tsx — VocabPill rewritten: speaker button inline (uses shared hook instance, not SpeakerButton component); smart tooltip overflow positioning via getBoundingClientRect; delayed-hide (120ms) so mouse can travel pill → tooltip; speaker button inside tooltip (Volume2 12px, calls speak(malay)); arrow direction tracks vertical flip
- [x] frontend/app/(dashboard)/courses/[courseId]/modules/[moduleId]/classes/[classId]/page.tsx — SpeakerButton (sm) beside each vocab word heading in VocabularySection
- [x] frontend/app/(dashboard)/quiz/adaptive/page.tsx — SpeakerButton (xs) next to correct_answer in per-question results breakdown
- [x] frontend/components/dashboard/VocabularyTable.tsx — SpeakerButton (xs) inline in Malay Word column
- [x] TypeScript: zero errors after tsc --noEmit

### Post-implementation bugs fixed (debug pass)
- [x] Double hook instance: VocabPill was calling usePronunciation() AND rendering SpeakerButton (which also calls it) — fixed by inlining the outer button and removing the SpeakerButton import
- [x] Dead variable: `const vh = window.innerHeight` in computePlacement was declared but never used — removed
- [x] Arrow offset: `right-3`/`left-3` hardcoded offsets for flipped tooltip didn't align with pill center — simplified to always `left-1/2 -translate-x-1/2`

---

## Phase 17 — Notification System
_Status: ✅ Complete (2026-04-07)_

**Goal:** In-app bell notifications for streaks, XP milestones, Journey reminders, and course completion.

### Backend
- [x] backend/routers/notifications.py — GET /api/notifications/ (last 20, with read status)
- [x] backend/routers/notifications.py — POST /api/notifications/{id}/read
- [x] backend/routers/notifications.py — POST /api/notifications/read-all
- [x] backend/services/gamification_service.py — create_notification() + create_notification_fire_and_forget() helpers
- [x] Register notifications router + import Notification model in backend/main.py

### Frontend
- [x] frontend/components/notifications/NotificationBell.tsx — bell icon with unread badge, 60s polling, opens/closes panel
- [x] frontend/components/notifications/NotificationPanel.tsx — dropdown list of last 20 notifications, per-type icons, mark read on click, mark-all-read button
- [x] frontend/components/nav/AppSidebar.tsx — NotificationBell wired into mobile header bar + desktop sidebar footer (both collapsed and expanded states)
- [x] frontend/lib/api.ts — notificationsApi (getNotifications, markRead, markAllRead)
- [x] frontend/lib/types.ts — AppNotification interface, NotificationType union, NotificationListResponse

---

## Phase 18 — Gamification (Streak + XP)
_Status: ✅ Complete (2026-04-07)_

**Goal:** Duolingo-inspired streak counter and XP system to motivate daily learning.

### Backend
- [x] backend/services/gamification_service.py — record_learning_activity(user_id, db, xp_amount): Redis daily streak key + XP update + milestone notifications
- [x] Wire gamification into: course class completion (+10 XP), module quiz pass (+25 XP), standalone quiz pass (+25 XP), chatbot session (+5 XP, Redis-deduped per session_id)
- [x] Milestone triggers: 3/7/14/30 day streaks → streak_milestone notification; every 100 XP → xp_milestone notification
- [x] GET /api/dashboard/ — streak_count and xp_total now included in stats dict

### Frontend
- [x] frontend/components/gamification/StreakBadge.tsx — Flame icon + count, sm/md size prop
- [x] frontend/components/gamification/XPBar.tsx — XP total + progress bar to next 100 XP milestone
- [x] frontend/components/dashboard/StatsCards.tsx — 2 new cards (Day Streak, Total XP); grid → lg:grid-cols-4
- [x] frontend/components/nav/AppSidebar.tsx — streak + XP inline in sidebar footer (expanded + collapsed states)

### Also completed this phase (Sidebar + Chatbot polish)
- [x] ThemeToggle: added variant="icon" compact button; repositioned to top-right of sidebar header row
- [x] Sidebar: removed double divider (border-b from logo area); footer items centered except XP bar
- [x] Chatbot welcome screen: replaced broken 🇲🇾 emoji (shows as "MY" on Windows) with BahasaBot logo image

---

## Phase 19 — Spelling Practice Game
_Status: ✅ Complete + v2 redesign (2026-04-07)_

**Goal:** Gamified spelling practice using the user's own learned vocabulary.

### Backend
- [x] backend/services/spelling_service.py — get_next_word(user_id): Leitner-box-inspired weighted selection (wrong words ×3 priority); _levenshtein() for fuzzy matching; _extract_ipa() for IPA from meaning string; seen-word ring buffer (last 10) via Redis; min threshold lowered to 1 word; save_session_score() upsert-best-run-per-day; get_personal_best()
- [x] backend/routers/games.py — GET /api/games/spelling/word, POST /api/games/spelling/submit (fuzzy: correct/almost/incorrect), POST /api/games/spelling/session (save score), GET /api/games/spelling/best
- [x] XP wired into submit handler via record_learning_activity() — +2 XP on correct answer (streak also updated)
- [x] Register games router in backend/main.py (prefix="/api/games")
- [x] **Bug fix**: backend/services/langchain_service.py — _extract_and_save() now opens its own AsyncSessionLocal() instead of reusing request-scoped session; chatbot vocab/grammar now reliably persisted

### Frontend — v1 (initial)
- [x] frontend/app/(dashboard)/games/spelling/page.tsx — page wrapper with 3-tip how-to strip
- [x] frontend/lib/api.ts — gamesApi (getSpellingWord, submitSpellingAnswer, endSession, getPersonalBest)
- [x] frontend/lib/types.ts — SpellingWord, SpellingSubmitResponse, SpellingPersonalBest
- [x] Games → Spelling link added to AppSidebar (Gamepad2 icon, href=/games/spelling)

### Frontend — v2 redesign (challenge + engagement update)
- [x] frontend/components/games/SpellingGame.tsx — full state machine rewrite:
  - **Start screen**: "Ready to be tested?" + 4-rule strip + personal best + "Let's Go!" CTA
  - **3-2-1 countdown**: zoom-in animated number (700ms/tick) before first word
  - **10-second per-word timer**: shrinking bar (green→yellow→red) + countdown number; red pulsing at ≤3s; auto-submits as wrong on timeout
  - **Time's Up screen**: shows correct word + IPA + replay button + "Start Over" / "Next Word →" buttons
  - **Combo multiplier**: ×1→×1.5→×2 with Flame icon; resets on wrong/timeout
  - **Fuzzy "Almost!" feedback**: yellow state for edit-distance 1
  - **Session summary**: accuracy %, XP earned, peak combo, mastered vs. review word lists
  - **Keyboard**: Enter=start/submit/advance; Space=replay audio; Escape=return to start screen
  - Empty state icon updated from 📚 emoji to themed BookOpen Lucide icon

### Test Results (2026-04-07)
| Check | Result |
|---|---|
| `tsc --noEmit` (frontend) | ✅ 0 errors |
| Python syntax check (spelling_service.py, games.py, langchain_service.py) | ✅ OK |
| Levenshtein unit tests | ✅ All 5 pass |
| IPA extraction unit tests | ✅ All 3 pass |
| Live API test — GET /word (real user JWT) | ✅ 200, word="sembilan" |
| Live API test — POST /submit correct | ✅ correct=True, xp=2 |
| Live API test — POST /submit almost | ✅ correct=False, almost=True |
| Live API test — POST /submit wrong | ✅ correct=False, almost=False |
| Live API test — GET /best | ✅ 200 |

---

## Phase 20 — My Journey (Learning Roadmap)
_Status: 🔲 Not started_

**Goal:** Personalized AI-generated learning roadmap with deadline, phases, weekly activities, and deep links into existing features.

### Backend
- [ ] backend/services/journey_service.py — generate_roadmap(user_id, deadline_date, goal_type): fetches BPS level + weak points, calls Gemini with structured JSON prompt, returns roadmap JSON
- [ ] backend/services/journey_service.py — include user's native_language from users table in the Gemini prompt when generating roadmap (e.g. "User's native language is Bengali — use relatable comparisons where helpful")
- [ ] Gemini prompt must return: { phases: [ { phase, title, duration_weeks, weeks: [ { week, activities: [ { id, type, title, topic, reason } ] } ] } ] }
- [ ] Activity types: 'course' | 'quiz' | 'chatbot'
- [ ] backend/routers/journey.py — POST /api/journey/ (generate + save to learning_roadmaps table, trigger banner image generation)
- [ ] backend/routers/journey.py — GET /api/journey/ (return saved roadmap + completion status per activity)
- [ ] backend/routers/journey.py — DELETE /api/journey/ (delete roadmap + completions)
- [ ] backend/routers/journey.py — POST /api/journey/activities/{activity_id}/complete
- [ ] backend/services/image_service.py — generate_journey_banner(goal_type, deadline_months): call gemini-3.1-flash-image-preview, return image URL
- [ ] Store banner_image_url in learning_roadmaps table on creation
- [ ] Register journey router in backend/main.py

### Frontend
- [ ] frontend/app/(dashboard)/journey/page.tsx — main page: empty state (set goal form) or roadmap view
- [ ] frontend/components/journey/RoadmapView.tsx — full roadmap display with banner image, phase accordion, activity cards
- [ ] frontend/components/journey/PhaseAccordion.tsx — collapsible phase with week grouping and completion percentage
- [ ] frontend/components/journey/ActivityCard.tsx — individual activity card with type icon, title, reason, click handler, completion checkmark
- [ ] Click handlers: type='course' → /courses?topic=..., type='quiz' → /quiz/adaptive, type='chatbot' → /chatbot?prompt=...
- [ ] Delete roadmap: confirmation dialog → DELETE /api/journey/ → show empty state + new goal form
- [ ] Add My Journey link to sidebar
- [ ] frontend/lib/api.ts — add journeyApi functions
- [ ] frontend/lib/types.ts — add Roadmap, Phase, Week, Activity interfaces

---

## Phase 21 — Chat History Page
_Status: 🔲 Not started_

**Goal:** Let users browse and re-read their past chatbot conversations.

- [ ] frontend/app/(dashboard)/chatbot/history/page.tsx — list all sessions from GET /api/chatbot/sessions (already implemented)
- [ ] Each session shows: title (first user message, truncated to 60 chars), date, message count
- [ ] Clicking a session loads full conversation via GET /api/chatbot/history?session_id=... in read-only view
- [ ] frontend/components/chatbot/ChatHistoryList.tsx — session list component
- [ ] Add Chat History link inside chatbot page or sidebar
- [ ] No new backend endpoints needed — uses existing sessions and history endpoints

---

## Phase 22 — Image Generation (Nano Banana 2)
_Status: 🔲 Not started_

**Goal:** Generate personalized visual assets for Journey banners, BPS milestone cards, and course covers.

- [ ] backend/services/image_service.py — implement generate_image(prompt: str) → str (returns image URL or base64)
- [ ] Use model: gemini-3.1-flash-image-preview via Gemini API
- [ ] generate_journey_banner(goal_type, deadline_months) — called from journey router on roadmap creation
- [ ] generate_milestone_card(bps_level, user_name) — called from gamification_service when user advances BPS level
- [ ] generate_course_cover(course_title, topic) — called from course_service on new course creation
- [ ] Store all generated image URLs in DB — never regenerate if URL already exists
- [ ] Add GEMINI_IMAGE_MODEL=gemini-3.1-flash-image-preview to .env.example
- [ ] Wire generate_course_cover() into course_service.py after course skeleton is saved
- [ ] Frontend: display course cover image on course library cards and course detail page header
- [ ] Frontend: display journey banner at top of RoadmapView component

---

## Phase 23 — Loading Skeletons + Demo Seed Data + Final Polish
_Status: 🔲 Not started_

**Goal:** Make the app feel polished and demo-ready.

### Loading Skeletons
- [ ] frontend/components/dashboard/ — add skeleton states to all dashboard components (StatsCards, VocabularyTable, WeakPointsChart)
- [ ] frontend/app/(dashboard)/journey/page.tsx — skeleton while roadmap loads
- [ ] frontend/app/(dashboard)/courses/page.tsx — skeleton for course library grid
- [ ] frontend/app/(dashboard)/admin/ — skeleton for stats and tables
- [ ] Use shadcn/ui Skeleton component throughout

### Demo Seed Script
- [ ] backend/data/seed_demo.py — script to insert demo data: 3 pre-created user accounts, 2 completed courses per user, quiz attempts with scores, vocab learned, weak points populated, streak and XP values set
- [ ] Seed data should make admin panel, dashboard, and roadmap look like a live active system
- [ ] Document how to run: python backend/data/seed_demo.py

### Mobile Responsiveness Check
- [ ] Test all new pages on mobile viewport: /journey, /admin, /games/spelling, /settings/*, /chatbot/history
- [ ] Fix any layout breaks on screens < 768px

### Final Polish
- [ ] Verify all sidebar links are present and correct
- [ ] Verify BPS labels appear correctly everywhere (no remaining CEFR/A1/A2/B1/B2 in UI)
- [ ] Verify pronunciation audio works on Chrome, Firefox, Safari
- [ ] Run full end-to-end smoke test of all 20 features
- [ ] Update STATUS.md to reflect all completed phases

