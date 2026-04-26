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

### Personalization enhancements (2026-04-08)
- [x] backend/services/langchain_service.py — CHATBOT_SYSTEM_PROMPT now includes native_language, learning_goal, and proficiency_level (BPS-1 to BPS-4 with description) — all fetched in a single DB query and injected as LEARNER CONTEXT blocks into the system prompt so Gemini can calibrate formality, complexity, and language comparisons per user

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
- [x] Frontend: results page (quiz/adaptive/results/page.tsx) — dedicated page with score ring, BPS update, per-question breakdown, FeedbackModal
- [x] Frontend: module quiz results page (quiz/module/[moduleId]/results/page.tsx)

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
- [x] Frontend session cache — `getCachedSession()` in `frontend/lib/api.ts`; 60s TTL eliminates repeated `/api/auth/session` lookups on every API request
- [x] Profile fetch deduplication — `AppSidebar` + `OnboardingChecker` both use `useQuery(["profile"])` so React Query deduplicates to a single `/api/profile/` call per stale window (was 2 per page load)
- [x] Login `router.refresh()` race condition removed — was triggering middleware re-run before session cookie was stable, causing transient login error flash
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
_Status: ✅ Complete + Rebuilt (6-digit code flow, 2026-04-15)_

**Goal:** Allow email/password users to reset their password via a 6-digit verification code sent to their inbox (no clickable link).

### Backend
- [x] backend/services/email_service.py — Resend SDK, sends 6-digit code email (code displayed in styled box, not a link)
- [x] backend/routers/auth.py — POST /api/auth/forgot-password: generates 6-digit code, stores SHA256(email:code) hash (10-min TTL)
- [x] backend/routers/auth.py — POST /api/auth/verify-reset-code: validates email+code, returns 200 (code not consumed yet)
- [x] backend/routers/auth.py — POST /api/auth/reset-password: validates email+code again (atomic), updates password, marks code used
- [x] backend/schemas/auth.py — VerifyResetCodeRequest + VerifyResetCodeResponse; ResetPasswordRequest updated (email+code+new_password)

### Frontend
- [x] frontend/app/(auth)/forgot-password/page.tsx — 4-step single-page flow: Email → Code (OTP boxes + resend cooldown) → New Password → Success (auto-redirect 4s)
- [x] frontend/app/(auth)/reset-password/page.tsx — deprecated page: shows "links no longer supported" + redirects to /forgot-password
- [x] Add "Forgot password?" link on login page pointing to /forgot-password
- [x] Handle Google OAuth accounts: show "Use Google to reset your password" message instead of form

### Verified end-to-end (2026-04-15)
- Step 1 (request): 200 for valid email; 400 google_account_no_password for Google accounts; 200 for non-existent email (enumeration protection)
- Step 2 (verify): 200 for correct code; 400 for wrong/expired/used code
- Step 3 (reset): 200 + password updated; 400 for invalid code; code marked used atomically
- Step 4: login with new password returns 200 JWT

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

### Mobile tap fix (Session 56 — 2026-04-26)
- [x] `frontend/components/chatbot/VocabularyHighlight.tsx` — VocabPill was hover-only; touch screens never fire mouseEnter so tooltip was completely inaccessible on mobile. Added `onClick` toggle + document `mousedown`/`touchstart` outside-click handler to close on tap away. Desktop hover behavior preserved. `wrapperRef` added to outer `<span>` for outside-click detection.

---

## Phase 17 — Notification System
_Status: ✅ Complete + Extended (2026-04-08)_

**Goal:** In-app bell notifications for streaks, XP milestones, Journey reminders, and course completion.

### Verified Notification Types (grep confirmed 2026-04-13)
| Type | Source | Trigger |
|---|---|---|
| `streak_milestone` | gamification_service.py | 3/7/14/30-day streak reached |
| `xp_milestone` | gamification_service.py | Every 100 XP earned |
| `course_complete` | routers/courses.py | Background course generation finishes |
| `bps_milestone` | quiz_service.py | User advances BPS level |
| `journey_reminder` | journey_service.py | Obstacle cleared / halfway warning / 7-day deadline / journey complete |

Note: The original Phase 17 plan included a `phase_complete` type (for v1 journey phase completions). Phase 20 v2 replaced the weekly-phase structure with a flat obstacle model and retired `phase_complete` — all journey notifications now use `journey_reminder`. No `phase_complete` records exist in new installs.

### Backend
- [x] backend/routers/notifications.py — GET /api/notifications/ (last 20, with read status)
- [x] backend/routers/notifications.py — POST /api/notifications/{id}/read
- [x] backend/routers/notifications.py — POST /api/notifications/read-all
- [x] backend/services/gamification_service.py — create_notification() + create_notification_fire_and_forget() helpers
- [x] Register notifications router + import Notification model in backend/main.py
- [x] backend/services/journey_service.py — journey_reminder notifications (Phase 20 v2): obstacle cleared, halfway-timeline warning, 7-day deadline warning, journey completed (replaces original v1 phase_complete hook)
- [x] backend/routers/courses.py — course_complete notification: _run_generation_task() fires `course_complete` after generate_course() succeeds

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
- [x] backend/routers/dashboard.py — streak_count and xp_total always overridden with current_user values (live DB read) before returning, so dashboard cards and sidebar are permanently in sync regardless of Redis cache state

### Frontend
- [x] frontend/components/gamification/StreakBadge.tsx — Flame icon + count, sm/md size prop
- [x] frontend/components/gamification/XPBar.tsx — XP total + progress bar to next 100 XP milestone
- [x] frontend/components/dashboard/StatsCards.tsx — 2 new cards (Day Streak, Total XP); grid → lg:grid-cols-4; `?? 0` fallback so values never render blank
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

## Phase 23 — UI/UX Overhaul (2026-04-07)
_Status: ✅ Complete_

**Goal:** Polish the visual design to industry-standard level.

### Auth Pages — Split-screen redesign
- [x] `components/ui/auth-card.tsx` — full rewrite: split-screen layout (branding left / glass form right), ShaderAnimation fills entire background, desktop lg+ shows large icon + "BahasaBot" wordmark + feature bullets on left, right panel is 460px glass surface with `bg-black/50 backdrop-blur-2xl border-l border-white/[0.07]`
- [x] Login + Register headers simplified to clean page-specific heading ("Welcome back" / "Create account") — branding moved to left panel
- [x] All auth pages (forgot-password, reset-password): box logo replaces wide SVG in 56×56 contexts
- [x] Browser autofill white-background override: global CSS in globals.css (`-webkit-box-shadow: 0 0 0 1000px rgba(0,0,0,0.35) inset !important`)
- [x] storeSession() retry logic: one 600ms retry on NextAuth CSRF race condition

### Dark Palette — Unified depth hierarchy
- [x] Sidebar: `#1c1a13` → Background: `#25221a` → Card: `#2e2b22` → Muted: `#363228` → Border: `#3d3a2e`
- [x] `bg-sidebar` token applied to AppSidebar (desktop aside + mobile drawer) via `--sidebar` CSS var
- [x] Chatbot Waves `backgroundColor` updated from `#3a3529` to `#25221a`

### Logo — Box logo for icon contexts
- [x] `Logo new only box (1).svg` (886×872 square icon) used everywhere a square container was previously hacking the wide SVG
- [x] Collapsed sidebar, chatbot header icon, login/register/forgot/reset icon contexts, favicon all updated
- [x] Sidebar nav icon opacity: `text-sidebar-foreground/60` hover → `text-sidebar-foreground` (more legible on very dark sidebar)

### Dashboard tiles
- [x] WeakPointsChart: removed recharts, replaced with inline CSS rows (type badge + topic + h-1.5 bar + score% + status label)
- [x] QuizHistoryTable: summary row with trend icon + score ring + type badge + pass/fail inline

### Spelling Game
- [x] Exit button added to all active phases (countdown, timeout, main game) — calls resetSession(), no endSession() call so stats not saved on exit

### Quiz
- [x] Standalone quiz loading: animated 4-step progress screen with pulsing brain icon and step indicators

### Shader background
- [x] Background color updated to `#14120a` (darker, matches new palette)

### GlowCard — Global rollout (2026-04-08)
- [x] `frontend/components/ui/glow-card.tsx` — new reusable GlowCard wrapper (proximity-tracking rainbow conic gradient border via GlowingEffect); `className` targets inner card div, `outerClassName` targets outer wrapper; twMerge via `cn()` so bg overrides work
- [x] Applied to ALL card-like elements across the project: dashboard (StatsCards already had it), settings pages (hub, profile, password, about), journey page (3 feature cards), PhaseAccordion, admin page (StatCard + nav list), admin/users table, admin/users/[userId] StatPill + analytics cards + recent courses, admin/feedback (aggregate stats + each feedback card)

### Login logo fix (2026-04-08)
- [x] `frontend/components/ui/auth-card.tsx` — square logo now inline beside "BahasaBot" title (flex-row items-center gap-4) instead of stacked above it; tagline moved below the row

---

## Phase 20 — My Journey (Learning Roadmap)
Status: ✅ Complete (v2 + patches — 2026-04-13)

### Concept
A personalized learning roadmap generated by Gemini consisting ONLY of courses as elements
(also called obstacles/steps). Each roadmap element = one course topic the user must complete
to progress. The roadmap is generated ONCE on first login after onboarding, based on the
user's intent, purpose, target timeline, BPS level, weak points, and native language.
It persists in the DB and is shown every login.

---

### Roadmap Generation — First Login Flow

Triggered only when: user has no active roadmap in the DB.

The system presents a full-screen modal with 3 questions:

1. Intent & Purpose — "What brings you to BahasaBot?"
   Options (single select): Casual Learning / Academic Purposes / Work & Professional /
   Travel & Culture / Other (free text)

2. Learning Goal — "What is your main goal?"
   Free text input (e.g. "I want to pass my Malay proficiency exam")

3. Target Timeline — "When do you want to complete your journey?"
   Options (single select): 1 Month / 2 Months / 3 Months / 4 Months / 5 Months / 6 Months

On submit → backend generates roadmap via Gemini using:
- User's answers (intent, goal, timeline)
- User's current BPS level (from users table)
- User's weak_points topics (from weak_points table)
- User's native_language (from users table)
- Number of elements must be proportional to timeline:
  1 month = 4 courses, 2 months = 6, 3 months = 9, 4 months = 12, 5 months = 15, 6 months = 18

Gemini returns ordered list:
[{ order: 1, topic: string, description: string, estimated_weeks: number }]

---

### DB Schema — New Table: user_roadmaps

CREATE TABLE user_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  intent VARCHAR(100) NOT NULL,
  goal TEXT NOT NULL,
  timeline_months INTEGER NOT NULL CHECK (timeline_months BETWEEN 1 AND 6),
  elements JSONB NOT NULL,
  -- ordered array of { order, topic, description, estimated_weeks, completed, completed_at }
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active | completed | deleted | overdue
  deadline DATE NOT NULL, -- created_at + timeline_months
  extended BOOLEAN NOT NULL DEFAULT false, -- whether user has already used their one extension
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  bps_level_at_creation VARCHAR(10) NOT NULL,
  banner_image_url TEXT
);

-- IMPORTANT: Use a partial unique index, NOT a column constraint.
-- This allows a user to have multiple roadmap rows (old completed/deleted ones)
-- but only ONE active roadmap at a time.
CREATE UNIQUE INDEX user_roadmaps_one_active_per_user
  ON user_roadmaps(user_id)
  WHERE status = 'active';

Write the Alembic migration for this table and index.

---

### Roadmap Element Interaction Logic

When user clicks any roadmap element (course node):

CASE 1 — Course already exists AND is completed:
→ Node visually marked complete. Clicking shows a brief course summary modal.

CASE 2 — Course already exists but NOT completed:
→ Navigate directly to that course page.

CASE 3 — Course does NOT exist AND previous elements are NOT all completed:
→ Show message: "Complete the previous courses in your journey to unlock this level."

CASE 4 — Course does NOT exist AND all previous elements ARE completed (or it is the first):
→ Navigate to /courses?generate=<url_encoded_topic_name>
→ Course generation card reads this param on mount and pre-fills course name field
→ User clicks Generate to create and start the course

---

### Completion Tracking (Cross-Phase Hook)

After every course completion event (all modules passed ≥ 70%):
→ Call journey_service.check_roadmap_progress(user_id, completed_course_title)
→ Fuzzy match completed course title against roadmap element topics
→ If match found: mark that element completed in JSONB, set completed_at timestamp
→ If ALL elements completed:
  - If completed on or before deadline: status = 'completed', completed_at = now()
    → Trigger celebration flow
  - If completed after deadline: status = 'completed', completed_at = now()
    → Show completion page but note it was finished after the target deadline
    → Still show celebration but with message "Better late than never! 🎉"

---

### Overdue / Deadline State

Run a background check on every GET /api/journey/roadmap request:
→ If today > deadline AND status is still 'active' AND not all elements completed:
  - Mark status = 'overdue' in DB
  - Return overdue flag to frontend

Frontend overdue handling:
→ Show an "overdue" banner at the top of the journey page:
  "Your target deadline has passed. You can extend your journey by [X] months
  or keep going at your own pace."
→ Show an EXTEND button — but ONLY if extended = false (one extension allowed per roadmap)
→ On extend: show a modal asking user to pick a new extension duration (1–3 months)
  - Call PATCH /api/journey/roadmap/extend with { extension_months: number }
  - Backend: deadline = deadline + extension_months, status = 'active', extended = true
  - This re-activates the roadmap and removes the overdue banner
→ If extended = true (already used their extension): do NOT show the extend button
  - Show message instead: "You've already extended this journey once. Keep going — you can do it!"
→ The overdue or extended state does NOT block the user from continuing — they can still
  complete elements and finish the roadmap regardless

---

### BPS Level Change — Roadmap Regeneration Offer

After every adaptive quiz completion that recalculates the user's BPS level:
→ Call journey_service.check_bps_change(user_id, old_bps, new_bps)
→ If BPS level has increased by one full tier (e.g. BPS-1 → BPS-2):
  - Store a flag in Redis: journey_bps_upgrade:{user_id} = true, TTL 7 days

On GET /api/journey/roadmap:
→ If this flag exists in Redis, include in response: { bps_upgraded: true }
→ Frontend shows a non-blocking banner on the journey page:
  "Your proficiency has improved to [new level]! 🚀 Would you like to update your
  roadmap to match your new level?"
  - Two buttons: "Update Roadmap" | "Keep Current Roadmap"
→ If user clicks "Update Roadmap":
  - Call POST /api/journey/roadmap/regenerate
  - Backend: keep same intent, goal, timeline, deadline — but regenerate ONLY the
    UNCOMPLETED elements using new BPS level and current weak_points
  - Already-completed elements stay completed and locked in place
  - New elements replace only the pending ones from the old roadmap
  - Clear the Redis flag after regeneration
→ If user clicks "Keep Current Roadmap":
  - Call DELETE /api/journey/roadmap/dismiss-upgrade (clears the Redis flag)
  - Banner disappears, no changes made

---

### Celebration Flow (Roadmap Completed)

When all elements are completed:
→ Show a full-screen celebration page with confetti animation
→ Display user's name, completion date, and whether they finished within deadline
→ Show two options:

Option A — "Start a New Journey"
→ Requires identity confirmation before deletion of current roadmap:
  - Email users: modal asking for password
  - Google OAuth users: confirmation dialog showing their email, require explicit click
→ On confirm: set current roadmap status = 'completed', then trigger first-login
  generation flow again (same 3 questions modal)

Option B — "I'm Done For Now"
→ Set status = 'completed', redirect to journey page in completed state
→ Journey page shows:
  "You're already a pro! 🌟 Whenever you're ready for a new challenge,
  start a new journey."
  → Show a "Create New Roadmap" button
  → Clicking it requires identity confirmation (same as Option A above) then
  triggers the 3 questions modal

---

### Delete Roadmap — Identity Confirmation

User can delete active roadmap from a settings/options button on the journey page.
Before deletion:
- Email users: modal — "Enter your password to confirm deletion"
  → POST /api/journey/roadmap/verify-and-delete with { password }
  → Backend: bcrypt verify password, then set status = 'deleted', clear Redis cache
- Google OAuth users: confirmation dialog showing their email address
  → User must click "Yes, delete my roadmap"
  → POST /api/journey/roadmap/verify-and-delete with { oauth_confirmed: true }
After deletion: show the 3 questions modal to generate a new roadmap

---

### Notification Hooks (Phase 17 integration)

Hook into the existing notification system to send these in-app notifications:

1. When a roadmap element (course) is completed:
   → "You cleared an obstacle! ✅ [topic name] is done. Keep going!"

2. When user is at 50% of their timeline duration but less than 30% of elements completed:
   → "You're halfway through your timeline but only [X]% of your journey is done.
   Time to pick up the pace! 💪"
   → Send once only (store sent flag in Redis: journey_halfway_notif:{user_id})

3. When deadline is 7 days away and roadmap is not completed:
   → "Your journey deadline is in 7 days! You have [X] obstacles left. 🏁"
   → Send once only (store sent flag in Redis: journey_7day_notif:{user_id})

4. When roadmap is completed:
   → "You completed your entire journey! 🎉 Amazing work!"

Check conditions 2 and 3 inside GET /api/journey/roadmap on every load —
if condition is met and notification not yet sent, trigger notification and set Redis flag.

---

### XP Integration (Phase 18 integration)

Hook into the existing XP system:

- Completing a roadmap obstacle (course that matches a roadmap element):
  → Award 100 bonus XP on top of regular course completion XP
  → Show XP gain toast: "+100 XP — Journey obstacle cleared!"

- Completing the entire roadmap within deadline:
  → Award 500 bonus XP
  → Show XP gain toast: "+500 XP — Journey completed on time! 🏆"

- Completing the entire roadmap after deadline:
  → Award 200 bonus XP
  → Show XP gain toast: "+200 XP — Journey completed!"

Add these XP award calls inside journey_service.check_roadmap_progress()
using the existing XP award function from Phase 18.

---

### Backend Endpoints

POST   /api/journey/roadmap/generate          — first login or post-deletion, { intent, goal, timeline_months }
GET    /api/journey/roadmap                   — returns active roadmap + per-element status + overdue/bps_upgraded flags
DELETE /api/journey/roadmap                   — requires identity confirmation, soft delete
POST   /api/journey/roadmap/verify-and-delete — verifies password/oauth then deletes
PATCH  /api/journey/roadmap/extend            — { extension_months }, only if extended = false
POST   /api/journey/roadmap/regenerate        — regenerates uncompleted elements after BPS upgrade
DELETE /api/journey/roadmap/dismiss-upgrade   — clears bps_upgraded Redis flag
GET    /api/admin/journeys                     — admin only, all users roadmap data

Redis keys:
- journey:{user_id}                → cached roadmap, TTL 1hr, invalidate on element completion
- journey_bps_upgrade:{user_id}    → BPS upgrade flag, TTL 7 days
- journey_halfway_notif:{user_id}  → halfway notification sent flag, no expiry
- journey_7day_notif:{user_id}     → 7-day warning notification sent flag, no expiry

---

### Frontend — My Journey Page

File: frontend/app/(dashboard)/journey/page.tsx

Visual design — Road/Path metaphor:
- A winding road rendered vertically or diagonally across the page
- Each element is an OBSTACLE on the road — a visual block or checkpoint
- Obstacle label = course topic name + short description
- Road behind completed obstacles is clear and bright
- Road ahead of locked obstacles is dark/foggy
- Obstacle states:
  - Completed: green, checkmark icon, road is clear
  - Current/Unlocked: highlighted with pulse/glow animation, road leads up to it
  - Locked: grey, lock icon, road blocked or foggy
- Small avatar/character on the road positioned at current progress point
- Progress bar at top: "3 of 10 obstacles cleared"
- Deadline display: "Target: [date] — [X] days remaining" or overdue badge
- If overdue and not yet extended: show extend banner with Extend button
- If bps_upgraded flag: show BPS upgrade banner with Update/Keep options
- Settings icon in corner for delete roadmap option

States the page must handle:
- No roadmap yet → trigger 3 questions modal
- Active roadmap → show road UI
- Overdue roadmap → show road UI + overdue banner
- Completed roadmap → show celebration page or completed state with "Create New Roadmap" button
- Deleted roadmap (after deletion) → trigger 3 questions modal again

---

### Courses Page — Auto Pre-fill

File: frontend/app/(dashboard)/courses/page.tsx

On mount:
→ Check for URL query param ?generate=<topic_name>
→ If present:
  - Decode the topic name
  - Auto-open the course generation card/modal
  - Pre-fill course name input field with the decoded topic name
  - Scroll to / focus the generation card
  - Remove query param from URL using window.history.replaceState
    (so refreshing the page does not re-trigger it)

---

### Admin Panel — User Journeys Section

In the admin control panel add a "User Journeys" tab:
- Table columns: User Name, Email, Intent, Goal, Timeline, Progress (X/Y),
  Deadline, Status (active/overdue/completed/deleted), Extended (yes/no)
- Clicking a row opens a detail view showing the full roadmap element list
  with per-element completion status and completion date
- Read-only — no editing or deletion from admin side

---

### What NOT to include
- Do NOT include quizzes (module or adaptive) as roadmap elements
- Do NOT include chatbot sessions as roadmap elements
- Roadmap elements = courses ONLY

---

### Implementation Checklist

#### Backend
- [x] Alembic migration — user_roadmaps table + partial unique index
- [x] backend/models/journey.py — add UserRoadmap ORM model
- [x] backend/services/journey_service.py — complete rewrite (generate, get, check_progress, check_bps_change, extend, verify_and_delete, regenerate, dismiss_upgrade)
- [x] backend/routers/journey.py — all new endpoints
- [x] Hook check_roadmap_progress() into quiz_service.py submit_module_quiz (after course completion)
- [x] Hook check_bps_change() into quiz_service.py submit_standalone_quiz
- [x] backend/services/admin_service.py — update active_roadmaps to count user_roadmaps
- [x] backend/routers/admin.py — add GET /api/admin/journeys

#### Frontend
- [x] frontend/lib/types.ts — replace Journey types with new UserRoadmap types
- [x] frontend/lib/api.ts — replace journeyApi with new endpoints
- [x] frontend/app/(dashboard)/journey/page.tsx — full road UI + all states + 3-question modal
- [x] frontend/app/(dashboard)/courses/page.tsx — add ?generate= param handling
- [x] frontend/components/courses/CourseGenerationModal.tsx — add initialTopic prop
- [x] frontend/app/(dashboard)/admin/journeys/page.tsx — read-only journeys table

---

### Phase 20 — Patch & Enhancements (Post-Implementation Fixes)

- [x] Fuzzy match algorithm defined and implemented using fuzzywuzzy (threshold ≥ 70%)
- [x] Out-of-order course completion rule defined and enforced
- [x] Gemini generation failure UX — error message + Try Again button
- [x] estimated_weeks displayed under each obstacle node on the road UI
- [x] Streak hook added for roadmap obstacle completion (Phase 18 integration)
- [x] "Other" intent free text passed correctly into Gemini prompt
- [x] Past Journeys section added to journey page showing completed roadmaps

### Phase 20 — Session 16 Fixes (2026-04-13)

**Fix 1: Obstacle always opened course generation even when course already existed**
- [x] `backend/services/journey_service.py` — `get_roadmap()` now enriches each element with `exists` (bool) and `course_id` (str|None) by querying the user's `courses` table and fuzzy-matching `elem.topic` against `course.topic` + `course.title` (token_sort_ratio ≥ 70). Added `from backend.models.course import Course` import.
- [x] `backend/services/course_service.py` — `save_course()` calls `cache_delete(f"journey:{user_id}")` after commit so the journey cache is invalidated immediately on course creation. Added `cache_delete` import.
- [x] `frontend/app/(dashboard)/courses/page.tsx` — Safety net: `?generate=<topic>` now waits for the course list to load, then checks for a matching topic (case-insensitive substring). If match found → navigates to existing course instead of opening the modal.

**Fix 2: Completing a course was not marking the roadmap obstacle as completed**
- [x] `backend/services/quiz_service.py` — `_check_course_completion_for_journey()` now passes `course.topic or course.title` instead of just `course.title`. The `topic` field is the raw input string which directly matches roadmap element topics. Creative AI-generated `title` values were scoring below the 70% threshold.

---

## Phase 21 — Chat History Page
_Status: ✅ Complete_

**Goal:** Let users browse and re-read their past chatbot conversations.

- [x] frontend/app/(dashboard)/chatbot/history/page.tsx — list all sessions from GET /api/chatbot/sessions (already implemented)
- [x] Each session shows: title (first user message, truncated to 60 chars), date, message count
- [x] Clicking a session loads full conversation via GET /api/chatbot/history?session_id=... in read-only view
- [x] frontend/components/chatbot/ChatHistoryList.tsx — session list component
- [x] Add Chat History link inside chatbot page header (History icon button + "History" label)
- [x] Backend: added title + message_count fields to ChatSessionResponse; list_sessions now fetches first user message + per-session count

---

## Phase 22 — Image Generation (Nano Banana 2)
_Status: ✅ Complete + Bug fixed (2026-04-13) + Streak milestone cards (2026-04-17)_

**Goal:** Generate personalized visual assets for Journey banners, BPS milestone cards, streak milestone cards, and course covers.

- [x] backend/services/image_service.py — generate_image() core + generate_journey_banner(), generate_course_cover(), generate_milestone_card(), generate_streak_milestone_card()
- [x] Model: gemini-3.1-flash-image-preview — called via Gemini REST API (httpx), NOT via google-generativeai SDK
  - **Bug fixed 2026-04-13:** SDK v0.7.2 raised `TypeError` on `response_modalities` → silently returned None → zero API calls made. Rewrote generate_image() to call `v1beta/models/{model}:generateContent` directly via httpx. Verified: HTTP 200, ~800 KB JPEG returned.
- [x] Images stored as base64 data URLs in TEXT columns (VARCHAR(1000) → TEXT migration applied)
- [x] generate_journey_banner() — asyncio.create_task() after roadmap save in journey_service.py
- [x] generate_course_cover() — asyncio.create_task() after course save in course_service.py
- [x] generate_milestone_card() — asyncio.create_task() when BPS level advances in quiz_service.py
- [x] generate_streak_milestone_card() — asyncio.create_task() via _generate_and_save_streak_milestone_card() in gamification_service.py when 3/7/14/30-day streak reached
- [x] Milestone card stored as image_url on bps_milestone notification (new notifications.image_url TEXT column)
- [x] Streak milestone card stored as image_url on streak_milestone notification (same image_url column)
- [x] GEMINI_IMAGE_MODEL=gemini-3.1-flash-image-preview already in .env.example
- [x] Alembic migration: 20260408_1200_phase22_image_columns.py
- [x] ORM models updated: Course.cover_image_url TEXT, LearningRoadmap.banner_image_url TEXT, Notification.image_url TEXT
- [x] get_courses_list() includes cover_image_url; also retroactively triggers _generate_and_save_cover() for courses with cover_image_url = NULL
- [x] get_course_with_progress() now includes cover_image_url (added 2026-04-13 Session 13)
- [x] NotificationResponse includes image_url
- [x] Frontend: CourseSummary + AppNotification + Course types updated (cover_image_url on Course interface added 2026-04-13)
- [x] CourseCard: h-32 cover image or gradient placeholder; 12s re-fetch already in place
- [x] Course detail page hero banner: full-width 56–64px banner with cover_image_url as object-cover bg, dark gradient overlay (from-black/70 to transparent), white title + topic text bottom-left, frosted glass Back pill top-left, gradient fallback when no cover (added 2026-04-13 Session 13)
- [x] RoadmapView: banner already handled (opacity-20 overlay) — no changes needed
- [x] NotificationPanel: bps_milestone amber trophy icon + inline milestone card image

#### Known issue (fixed 2026-04-13 Session 13)
Backend must be **manually restarted** after any code change — uvicorn runs without `--reload` in prod mode. Session 12 fixes were not live until the process was killed and restarted in Session 13.

---

## Phase 23 — Loading Skeletons + Demo Seed Data + Final Polish
_Status: 🔄 In progress_

**Goal:** Make the app feel polished and demo-ready.

### Auth UX
- [x] Login page — redirect loading overlay (logo + spinner + "Signing you in…") shown immediately after sign-in succeeds while dashboard loads

### Loading Skeletons
- [x] frontend/app/(dashboard)/dashboard/page.tsx — summaryLoading branch: 6 card skeletons + BPS bar skeleton + 2 chart skeletons (verified 2026-04-17)
- [x] frontend/app/(dashboard)/journey/page.tsx — roadmapLoading branch: title/subtitle/banner skeletons + 5 obstacle row skeletons (verified 2026-04-17)
- [x] frontend/app/(dashboard)/courses/page.tsx — skeleton for course library grid (shadcn Skeleton used)
- [ ] frontend/app/(dashboard)/admin/ — skeleton for stats and tables (not yet implemented)
- [x] frontend/components/ui/skeleton.tsx — shadcn/ui Skeleton component added

### Demo Seed Script
- [ ] backend/data/seed_demo.py — script to insert demo data: 3 pre-created user accounts, 2 completed courses per user, quiz attempts with scores, vocab learned, weak points populated, streak and XP values set
- [ ] Seed data should make admin panel, dashboard, and roadmap look like a live active system
- [ ] Document how to run: python backend/data/seed_demo.py

### Mobile Responsiveness Check
- [x] Audited all 13 target pages for mobile viewport (<768px) issues
- [x] admin/users/page.tsx — table grid wrapped in overflow-x-auto + min-w-[700px] inner wrapper; GlowCard changed from overflow-hidden to overflow-x-auto
- [x] admin/users/[userId]/page.tsx — loading skeleton + stats grid changed from grid-cols-4 to grid-cols-2 md:grid-cols-4; header flex-wrap added for Reset/Delete buttons
- [x] All other pages clean — journey, admin/index, admin/feedback, admin/journeys, spelling game, settings/*, chatbot/history all use responsive patterns already
- [x] tsc --noEmit: zero TypeScript errors after changes

### Final Polish
- [ ] Verify all sidebar links are present and correct
- [ ] Verify BPS labels appear correctly everywhere (no remaining CEFR/A1/A2/B1/B2 in UI)
- [ ] Verify pronunciation audio works on Chrome, Firefox, Safari
- [ ] Run full end-to-end smoke test of all 20 features
- [ ] Update STATUS.md to reflect all completed phases

### Session 18 Fixes (2026-04-14)

**Fix 1: XP & Streak stale in sidebar and dashboard**
- [x] `frontend/components/nav/AppSidebar.tsx` — reduced `staleTime: 60_000 → 30_000` and added `refetchOnWindowFocus: true` so sidebar re-fetches profile (XP/streak) when user returns from any activity tab
- [x] `frontend/app/(dashboard)/dashboard/page.tsx` — extracted `fetchSummary` as `useCallback` with 30s throttle; added `focus` and `visibilitychange` listeners so XP/streak stat cards refresh automatically when user tabs back in

**Fix 2: bps_milestone notification showing as "Notification"**
- [x] `frontend/components/notifications/NotificationBell.tsx` — added `bps_milestone: "Level Up!"` to titleMap
- [x] `frontend/components/ui/notification-popover.tsx` — added `bps_milestone → TrendingUp` icon (emerald-500)

**Feature: User Feedback from Settings**
- [x] `backend/schemas/evaluation.py` — extended `quiz_type` Literal to include `"general"` for settings-originated feedback
- [x] `frontend/lib/types.ts` — added `"general"` to `FeedbackPayload.quiz_type` and `AdminFeedbackItem.quiz_type`
- [x] `frontend/app/(dashboard)/settings/feedback/page.tsx` — new page: star rating (1–5), content relevance (yes/somewhat/no), optional text, POSTs to `/api/evaluation/feedback` with `quiz_type: "general"`
- [x] `frontend/app/(dashboard)/settings/page.tsx` — added "Send Feedback" entry linking to /settings/feedback
- [x] `frontend/app/(dashboard)/admin/feedback/page.tsx` — updated title to "User Feedback", added "General" badge for `quiz_type === "general"`
- [x] `frontend/app/(dashboard)/admin/page.tsx` — updated section label to "User Feedback"

**Feature: Notification Bell Relocation + Clear All**
- [x] Removed floating fixed-position bell from `frontend/app/(dashboard)/layout.tsx`
- [x] `frontend/components/notifications/NotificationBell.tsx` — refactored to inline component with `panelSide` and `panelDirection` props; added `handleClearAll` calling `notificationsApi.clearAll()`
- [x] `frontend/components/ui/notification-popover.tsx` — added `panelSide` ("left"→right-0 / "right"→left-0) and `panelDirection` ("down"→top-full / "up"→bottom-full) props; added "Clear all" button with Trash2 icon; added `onClearAll` prop
- [x] `backend/routers/notifications.py` — added `DELETE /api/notifications/` endpoint to bulk-delete all user notifications
- [x] `frontend/lib/api.ts` — added `notificationsApi.clearAll()` calling DELETE /api/notifications/
- [x] Bell placed in: mobile header (right of logo, `panelSide="left"`), desktop expanded footer (right of username, `panelSide="right" panelDirection="up"`), desktop collapsed footer (`panelSide="right" panelDirection="up"`)

---

## Phase 24 — Course Deduplication + Clone System
_Status: ✅ Complete (2026-04-14)_

**Goal:** Eliminate redundant Gemini calls when multiple users request the same or similar course topic. The first generation becomes a reusable template; all subsequent users get a deep clone in milliseconds.

### Design

**Template model:** The first Course generated for a given `topic_slug` (normalised topic + level) is marked `is_template = true`. All later requests for the same slug clone that course row-for-row without touching Gemini.

**Slug normalisation:** lowercase → collapse whitespace → strip non-alphanum → replace spaces with hyphens → append level without hyphens. Example: `"Ordering food at a Restaurant!"` + `"BPS-1"` → `"ordering-food-at-a-restaurant:bps1"`.

**Clone scope:** Copies Course + all Modules + all Classes (full lesson content, vocabulary_json, examples_json, cover_image_url). Does NOT copy UserProgress, ModuleQuizAttempt, VocabularyLearned, or any other user-specific data — clone starts completely fresh for the new user.

**Race condition handling:** After generating a fresh course, a second `_find_template()` call is made before marking it as the template. If a concurrent request just created a template for the same slug, the new course is saved as a regular user copy instead (two templates never exist for the same slug; the race window is harmless).

### Schema

**Migration:** `20260414_1400_course_dedup_template.py` (revision `d1e2f3a4b5c6`, down_revision `c9d0e1f2a3b4`)

- [x] `courses.topic_slug VARCHAR(600) NULLABLE` — normalised lookup key; NULL for pre-Phase 24 courses (they are not auto-backfilled; only new requests create templates)
- [x] `courses.is_template BOOLEAN NOT NULL DEFAULT false`
- [x] `courses.cloned_from UUID FK courses.id ON DELETE SET NULL NULLABLE`
- [x] `ix_courses_topic_slug` index on `topic_slug`
- [x] Migration applied: `alembic upgrade head` → all three columns confirmed in DB

### Backend

- [x] `backend/models/course.py` — added `topic_slug`, `is_template`, `cloned_from` mapped columns; `Boolean` added to SQLAlchemy imports
- [x] `backend/services/course_service.py` — `import re` added
- [x] `_make_topic_slug(topic, level) -> str` — pure function, deterministic, capped at 600 chars
- [x] `_find_template(slug, db) -> Course | None` — SELECT with `selectinload(modules → classes)` + `LIMIT 1`
- [x] `_clone_course(template, user_id, db) -> Course` — snapshots all ORM data into plain dicts first (prevents SQLAlchemy session-expiry mid-flush), then inserts Course → Module → Class rows in a single transaction; calls `cache_delete(f"journey:{user_id}")` on commit
- [x] `generate_course()` — fast path check at the top; slow path marks freshly saved course as template; both paths return a `Course` ORM object; job_id progress messages updated for both paths
- [x] Activity logged as `"course_clone"` (vs `"course_gen"`) in activity_logs for analytics distinction

### Frontend / Router

No changes required. `generate_course()` returns an identical `Course` object whether cloned or freshly generated. The background task, notification message, and API response shape are unchanged.

### Job Progress (clone path)

| % | Step text |
|---|---|
| 0 | "Queued…" (set by router before background task starts) |
| 5 | "Checking existing courses…" |
| 50 | "Found a matching course — personalising for you…" |
| 100 | "Course ready!" |

---

## Session 57 — Admin Panel Bug Fixes (2026-04-26)

**Goal:** Fix three broken features in the admin panel that were silently failing.

### Bug 1 — Common Weak Points: SQL crash on every call
- [x] `backend/services/admin_service.py` — `get_weak_points_distribution()`: `func.round(func.cast(func.avg(...), type_=func.Float), 2)` used `func.Float` as a type (wrong — it's a SQLAlchemy Function object, generates invalid SQL `cast(avg(x))` with no AS clause → 500 on every call). Fixed: use `func.avg(...).label("avg_strength")` + `round(float(r.avg_strength), 2)` in Python dict comprehension

### Bug 2 — Score Distribution + Weak Points: silent error = same UI as empty data
- [x] `frontend/app/(dashboard)/admin/page.tsx` — `ScoreDistributionPanel`: added `error: string | null` state; catch block sets `error`; render shows red error message when error is set (vs muted italic "no data" empty state)
- [x] `frontend/app/(dashboard)/admin/page.tsx` — `WeakPointsPanel`: same pattern

### Bug 3 — Token usage always zero (log_tokens never called)
- [x] `backend/services/gemini_service.py` — added `generate_json_with_usage(prompt, ...) → (dict, int, int)`; refactored `generate_json()` to delegate to it
- [x] `backend/services/quiz_service.py` — imported `Course`, `generate_json_with_usage`; `generate_module_quiz()` now calls `log_tokens(feature="module_quiz")`; `generate_standalone_quiz()` calls `log_tokens(feature="standalone_quiz")`
- [x] `backend/services/course_service.py` — `generate_course_skeleton()` returns `(dict, int, int)`; `generate_course()` logs tokens via `log_tokens(feature="course_gen")`

---

## Session 55 — Admin Panel Phase 2 — Evaluation Data Quality (2026-04-26)

**Goal:** Five additions that meaningfully improve the quality and depth of evaluation data visible to the admin: time-spent stat, chatbot engagement metrics, raw quiz attempt inspector, cohort score distribution histogram, cohort weak-points table.

### Backend (modified)
- [x] `backend/services/admin_service.py` — `get_user_detail()` extended with `total_time_spent_seconds` (SUM activity_logs duration), `total_chat_messages` (COUNT through chat_sessions join), `avg_messages_per_session` (1dp float)
- [x] `backend/services/admin_service.py` — new `get_quiz_attempts(user_id)` — merged ModuleQuizAttempt + StandaloneQuizAttempt, newest-first; module attempts have `questions: null` (column not stored there)
- [x] `backend/services/admin_service.py` — new `get_score_distribution(start_date?, end_date?)` — 10-point buckets, scores ×100, mean+median in Python
- [x] `backend/services/admin_service.py` — new `get_weak_points_distribution(start_date?, end_date?)` — GROUP BY (type, topic), distinct user_count, avg strength, top 20
- [x] `backend/routers/admin.py` — `GET /api/admin/users/{user_id}/quiz-attempts` (admin-gated)
- [x] `backend/routers/admin.py` — `GET /api/admin/analytics/score-distribution` (admin-gated, date params)
- [x] `backend/routers/admin.py` — `GET /api/admin/analytics/weak-points` (admin-gated, date params)

### Frontend
- [x] `frontend/lib/types.ts` — `AdminUserDetail.stats` + 3 new fields; `AdminQuizAttempt`, `ScoreDistribution`, `WeakPointDistribution` interfaces
- [x] `frontend/lib/api.ts` — `adminApi.getQuizAttempts`, `getScoreDistribution`, `getWeakPointsDistribution`
- [x] `frontend/app/(dashboard)/admin/users/[userId]/page.tsx` — `TextStatPill`; "Time on App" pill with coverage footnote; chat message + avg pills; `QuizAttemptsSection` (collapsible, lazy-fetch, Q/A with ✓/✗)
- [x] `frontend/app/(dashboard)/admin/page.tsx` — `ScoreDistributionPanel` (Recharts BarChart, date pickers, mean/median); `WeakPointsPanel` (sortable table, date pickers, category badges)

---

## Session 54 — Admin Panel Evaluation Enhancements (2026-04-26)

**Goal:** Prepare the admin panel for the 30-user evaluation study with CSV export, additional user metrics, and bug fixes.

### Backend (new file)
- [x] `backend/routers/admin_export.py` — `GET /api/admin/export/users`, `GET /api/admin/export/quiz-attempts`, `GET /api/admin/export/feedback`; all require `require_admin`; optional `start_date`/`end_date` ISO query params; `_csv_response()` StreamingResponse helper; bulk GROUP BY aggregation (not N+1)

### Backend (modified)
- [x] `backend/main.py` — import + register `admin_export` router; add `backend.models.analytics` to model import block (was missing)
- [x] `backend/services/admin_service.py` — `get_all_users()` + `start_date`/`end_date` + `last_active` from MAX(activity_logs.created_at); `get_user_detail()` + `avg_quiz_score_module`, `avg_quiz_score_standalone`, `score_trajectory` (merged, sorted asc, capped 50)
- [x] `backend/routers/admin.py` — `GET /api/admin/users` accepts `start_date` + `end_date` Query params

### Frontend
- [x] `frontend/lib/types.ts` — `AdminUser.last_active`; `AdminUserDetail.stats` avg score fields; `AdminUserDetail.score_trajectory`
- [x] `frontend/lib/api.ts` — `getUsers` date params; `exportUsers`, `exportQuizAttempts`, `exportFeedback` blob functions
- [x] `frontend/app/(dashboard)/admin/page.tsx` — `DataExportPanel` with date pickers + download buttons; `triggerBlobDownload` DOM-appends `<a>` (Firefox compat); improved error shows HTTP status
- [x] `frontend/app/(dashboard)/admin/users/page.tsx` — `formatRelativeTime()` helper; Last Active column; date range filter + Clear; grid 6→7 col
- [x] `frontend/app/(dashboard)/admin/users/[userId]/page.tsx` — avg score pills (module/adaptive %); score trajectory Recharts LineChart (connectNulls, two series)
- [x] `frontend/app/(dashboard)/admin/feedback/page.tsx` — conditional relevance label: "Content is relevant:" vs "Quiz matched weak areas:" based on quiz_type

---

## Session 34 — Chatbot Latency Optimizations (2026-04-17)

**Goal:** Reduce cold TTFT (~4.5s) and warm TTFT (~3.2s) by eliminating every avoidable sequential operation before first token delivery.

### Backend

- [x] `backend/services/langchain_service.py` — `_BPS_DESCRIPTIONS` moved from inside `stream_chat_response()` to module-level constant (was recreated on every message)
- [x] `backend/services/langchain_service.py` — `get_cached_profile()` + `invalidate_profile_cache()`: user profile (native_language, learning_goal, proficiency_level) now Redis-cached with 5 min TTL; eliminates one DB round-trip per chatbot message on warm path
- [x] `backend/services/langchain_service.py` — `_update_history_cache()`: replaces `_invalidate_history_cache()` — appends the current exchange to the cached history in-place instead of busting it; eliminates the DB re-read for history on every subsequent turn in the same session
- [x] `backend/routers/chatbot.py` — gamification XP award (`_award_chatbot_xp`) extracted to standalone async helper that opens its own `AsyncSessionLocal`; fired as `asyncio.create_task` inside `event_generator` (after ping, before LLM call) so it never blocks SSE stream startup
- [x] `backend/routers/chatbot.py` — removed blocking gamification block that ran before `return EventSourceResponse()`; that block was adding ~20–50 ms of DB/Redis latency before the client received even the ping event
- [x] `backend/routers/chatbot.py` — `GET /api/chatbot/prewarm`: lightweight endpoint that warms the profile cache; frontend calls it on chatbot page mount so first message benefits from a cache hit
- [x] `backend/routers/profile.py` — `PATCH /api/profile/` now calls `invalidate_profile_cache()` after a successful commit so chatbot picks up changed native_language / learning_goal / proficiency_level immediately

### Frontend

- [x] `frontend/components/chatbot/ChatMessage.tsx` — wrapped with `React.memo`; previous messages no longer re-render during streaming (each token only triggers a re-render of the actively streaming message)
- [x] `frontend/app/(dashboard)/chatbot/page.tsx` — token batching via `requestAnimationFrame`: tokens accumulate in a local buffer and are flushed in a single `setMessages` call per animation frame (≤60/s) instead of one setState per token (~50–100+/s); eliminates UI jank on fast Gemini responses
- [x] `frontend/app/(dashboard)/chatbot/page.tsx` — prewarm call on mount: `GET /api/chatbot/prewarm` fires once when the user loads the chatbot page (before typing), so the profile cache is warm by the time the first message is sent

