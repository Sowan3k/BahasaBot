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
_Status: 🔲 Not started_

**Goal:** Allow email/password users to reset their password via a Resend email link.

### Backend
- [ ] backend/services/email_service.py — Resend SDK integration, send_reset_email() function
- [ ] backend/routers/auth.py — add POST /api/auth/forgot-password (generate token, store hash, send email)
- [ ] backend/routers/auth.py — add POST /api/auth/reset-password (validate token, update password, mark token used)
- [ ] Add RESEND_API_KEY to backend/.env.example

### Frontend
- [ ] frontend/app/(auth)/forgot-password/page.tsx — email input form, submit triggers API call, show success message
- [ ] frontend/app/(auth)/reset-password/page.tsx — reads token from URL query param, new password form, submit triggers API call
- [ ] Add "Forgot password?" link on login page pointing to /forgot-password
- [ ] Handle Google OAuth accounts: show "Use Google to reset your password" message instead of form

---

## Phase 13 — User Profile Management + Settings Hub
_Status: 🔲 Not started_

**Goal:** Let users view and edit their profile. Create the /settings hub that will also house Password and About pages.

### Backend
- [ ] backend/routers/profile.py — GET /api/profile/ (return user profile fields)
- [ ] backend/routers/profile.py — PATCH /api/profile/ (update name, native_language, learning_goal, profile_picture_url — email and role NOT changeable here)
- [ ] backend/schemas/ — ProfileResponse and ProfileUpdateRequest Pydantic schemas
- [ ] Register profile router in backend/main.py

### Frontend
- [ ] frontend/app/(dashboard)/settings/page.tsx — settings hub with links to Profile, Password, About
- [ ] frontend/app/(dashboard)/settings/profile/page.tsx — display and edit profile fields
- [ ] frontend/app/(dashboard)/settings/password/page.tsx — change password form (current password + new password)
- [ ] frontend/app/(dashboard)/settings/about/page.tsx — static About/Credits page (BahasaBot logo, USM logo, Sowan, Dr. Tan Tien Ping, academic year)
- [ ] Add Settings link to sidebar
- [ ] frontend/lib/api.ts — add profileApi.getProfile() and profileApi.updateProfile()
- [ ] frontend/lib/types.ts — add UserProfile interface

---

## Phase 14 — Onboarding Flow
_Status: 🔲 Not started_

**Goal:** Guide new users through setup on their first login only.

- [ ] frontend/components/onboarding/OnboardingModal.tsx — multi-step modal component
- [ ] frontend/components/onboarding/OnboardingStep.tsx — individual step wrapper
- [ ] Steps: Welcome → Native Language selection → Reason for learning Malay → Brief sidebar tour → Optional Journey CTA
- [ ] On step completion: PATCH /api/profile/ to save native_language and learning_goal
- [ ] On final step: PATCH /api/profile/ to set onboarding_completed = true
- [ ] Trigger: check onboarding_completed on dashboard layout load — if false, show modal
- [ ] frontend/app/(dashboard)/layout.tsx — add onboarding check and modal render

---

## Phase 15 — Admin Control Panel
_Status: 🔲 Not started_

**Goal:** Give admin users a protected dashboard to monitor system usage and view evaluation feedback.

### Backend
- [ ] backend/services/admin_service.py — get_stats(), get_all_users(), get_feedback_responses()
- [ ] backend/routers/admin.py — GET /api/admin/stats (admin only)
- [ ] backend/routers/admin.py — GET /api/admin/users (admin only, paginated)
- [ ] backend/routers/admin.py — GET /api/admin/feedback (admin only, paginated)
- [ ] backend/routers/admin.py — PATCH /api/admin/users/{id}/deactivate (admin only)
- [ ] Role check: all admin endpoints verify user.role == 'admin' — return 403 otherwise
- [ ] Seed: first user registered with ADMIN_EMAIL env var gets role='admin' automatically
- [ ] Register admin router in backend/main.py

### Frontend
- [ ] frontend/app/(dashboard)/admin/page.tsx — stats overview (total users, quiz pass rate, course count, feedback count)
- [ ] frontend/app/(dashboard)/admin/users/page.tsx — paginated user table with BPS level, last active, deactivate button
- [ ] frontend/app/(dashboard)/admin/feedback/page.tsx — feedback table with aggregate rating + open text responses
- [ ] Sidebar: show Admin link only if user.role === 'admin'
- [ ] Route protection: middleware redirects non-admin to /dashboard
- [ ] frontend/lib/api.ts — add adminApi functions
- [ ] frontend/lib/types.ts — add AdminStats, AdminUser interfaces

---

## Phase 16 — Pronunciation Audio + SpeakerButton
_Status: 🔲 Not started_

**Goal:** Add one-click Malay pronunciation to every vocabulary word across the app.

- [ ] frontend/lib/hooks/usePronunciation.ts — Web Speech API hook: speak(word, lang='ms-MY') with fallback chain ms-MY → ms → default
- [ ] frontend/components/ui/SpeakerButton.tsx — small speaker icon button that calls usePronunciation hook on click
- [ ] frontend/components/chatbot/ChatMessage.tsx — add SpeakerButton to each VocabPill
- [ ] frontend/app/(dashboard)/courses/[courseId]/modules/[moduleId]/classes/[classId]/page.tsx — add SpeakerButton next to each vocab word
- [ ] frontend/components/quiz/QuizQuestion.tsx — add SpeakerButton next to Malay words in explanations
- [ ] frontend/components/dashboard/VocabularyTable.tsx — add SpeakerButton in each vocab row
- [ ] Test fallback: verify behaviour when ms-MY voice is unavailable

---

## Phase 17 — Notification System
_Status: 🔲 Not started_

**Goal:** In-app bell notifications for streaks, XP milestones, Journey reminders, and course completion.

### Backend
- [ ] backend/routers/notifications.py — GET /api/notifications/ (last 20, with read status)
- [ ] backend/routers/notifications.py — POST /api/notifications/{id}/read
- [ ] backend/routers/notifications.py — POST /api/notifications/read-all
- [ ] backend/services/gamification_service.py — create_notification() helper used by all milestone triggers
- [ ] Register notifications router in backend/main.py

### Frontend
- [ ] frontend/components/notifications/NotificationBell.tsx — bell icon in top nav, unread count badge, click to toggle panel
- [ ] frontend/components/notifications/NotificationPanel.tsx — dropdown list of last 10 notifications, mark read on click
- [ ] frontend/app/(dashboard)/layout.tsx — render NotificationBell in top nav bar
- [ ] frontend/lib/api.ts — add notificationsApi functions
- [ ] frontend/lib/types.ts — add Notification interface

---

## Phase 18 — Gamification (Streak + XP)
_Status: 🔲 Not started_

**Goal:** Duolingo-inspired streak counter and XP system to motivate daily learning.

### Backend
- [ ] backend/services/gamification_service.py — update_streak(user_id), award_xp(user_id, amount), check_milestones(user_id)
- [ ] Wire update_streak() + award_xp() into: course class completion, quiz submission, chatbot message send, spelling game word correct
- [ ] Milestone triggers: 3/7/14/30 day streaks → create notification; every 100 XP → create notification
- [ ] GET /api/dashboard/ — include streak_count and xp_total in response

### Frontend
- [ ] frontend/components/gamification/StreakBadge.tsx — flame icon + streak count, shown in sidebar and dashboard
- [ ] frontend/components/gamification/XPBar.tsx — XP total display with progress toward next 100 XP milestone
- [ ] frontend/components/dashboard/StatsCards.tsx — add streak and XP stat cards
- [ ] frontend/app/(dashboard)/layout.tsx or sidebar — render StreakBadge in sidebar footer

---

## Phase 19 — Spelling Practice Game
_Status: 🔲 Not started_

**Goal:** Gamified spelling practice using the user's own learned vocabulary.

### Backend
- [ ] backend/services/spelling_service.py — get_next_word(user_id): picks from vocabulary_learned, prioritises least recently practiced
- [ ] backend/routers/games.py — GET /api/games/spelling/word (returns word + meaning + IPA)
- [ ] backend/routers/games.py — POST /api/games/spelling/submit (correct: award XP, save score; incorrect: return correct spelling + IPA)
- [ ] backend/services/gamification_service.py — award 2 XP on correct spelling answer
- [ ] Register games router in backend/main.py

### Frontend
- [ ] frontend/app/(dashboard)/games/spelling/page.tsx — main game page
- [ ] frontend/components/games/SpellingGame.tsx — game component: auto-play pronunciation on load, text input, submit, result display
- [ ] On correct: celebration animation, show +2 XP, load next word automatically after 1.5s
- [ ] On incorrect: reveal correct spelling with IPA, meaning, Retry or Skip button
- [ ] Session score counter shown throughout game (X correct / Y attempted)
- [ ] Add Games → Spelling link in sidebar
- [ ] frontend/lib/api.ts — add gamesApi functions

---

## Phase 20 — My Journey (Learning Roadmap)
_Status: 🔲 Not started_

**Goal:** Personalized AI-generated learning roadmap with deadline, phases, weekly activities, and deep links into existing features.

### Backend
- [ ] backend/services/journey_service.py — generate_roadmap(user_id, deadline_date, goal_type): fetches BPS level + weak points, calls Gemini with structured JSON prompt, returns roadmap JSON
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

