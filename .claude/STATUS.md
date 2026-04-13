# BahasaBot — Project Status
_Update this file at the end of every session_

## Last Updated: 2026-04-13 (Session 13 — Course cover hero banner + image generation root cause fix)

## Feature Status
| Feature | Status | Notes |
|---|---|---|
| Auth | ✅ Complete + Verified | Email + Google OAuth, JWT, token refresh, 30-min sessions |
| AI Chatbot Tutor | ✅ Complete + Verified | SSE streaming, LangChain, RAG — Malaysian Malay + IPA in prompt; markdown rendering; session persistence; native_language injected into system prompt |
| Course Generator | ✅ Complete + English-medium fix | Lesson content in English; Malay words taught inline; Malaysian BM only |
| Quiz | ✅ Complete + English-medium fix | Question text explicitly English; Malay vocabulary uses Malaysian BM; IPA in explanations |
| Dashboard | ✅ Complete + Vocab Delete | All 6 endpoints verified — vocab/grammar/progress/weak-points/quiz-history; streak + XP now included |
| Production Hardening | ✅ Complete + Rate Limiter Fix | Rate limiter falls back to in-memory on Redis timeout (no more 500s) |
| IPA Pronunciation | ✅ Full stack verified | Courses: IPA in all vocab items. Chatbot: /ko.soŋ/, /tə.ri.ma ka.sɪh/. Quiz: IPA in explanations |
| Chatbot UI | ✅ Complete + Logo fix | react-markdown rendering, VocabPill extraction, Malaysia flag avatar; welcome screen now shows BahasaBot logo (was broken 🇲🇾 emoji showing as "MY" on Windows) |
| Dark Mode | ✅ Complete + Repositioned | ThemeToggle moved to top-right of sidebar header row (industry standard); icon variant added for collapsed/mobile |
| UI Polish | ✅ Complete | Space Grotesk font, botanical color palette, glowing dashboard cards, animated auth pages |
| Local Dev Launcher | ✅ Complete | `start-bahasabot.bat` launches both frontend + backend; PM2 config removed from root |
| Background Course Generation | ✅ Complete | Non-blocking modal; floating progress card; BackgroundTasks + Redis job state; React Query polling |
| BPS Migration | ✅ Complete | CEFR labels fully retired; BPS-1/2/3/4 across DB, backend, frontend; Alembic migration written |
| DB Schema (Phase 11) | ✅ Complete + Applied | 6 new tables + 8 new columns; ORM models written; migration applied successfully |
| Forgot Password (Phase 12) | ✅ Complete | Resend email, token hashing, 15-min TTL; Google account guard; 2 frontend pages |
| User Profile + Settings (Phase 13) | ✅ Complete | GET + PATCH /api/profile/, change-password endpoint; /settings hub + /profile + /password + /about pages; Settings in sidebar |
| Onboarding Flow (Phase 14) | ✅ Complete | 5-step modal (Welcome → NativeLang → Goal → Tour → Journey CTA); triggered on first login via layout.tsx; PATCH /api/profile/ with onboarding_completed=true on finish |
| Admin Control Panel (Phase 15) | ✅ Complete + Verified | /api/admin/* fully tested; stats, users (search + detail + delete + reset + analytics), feedback; password guards verified; recharts LineChart + BarChart confirmed working; analytics bug fixed (NullType → timedelta) |
| Pronunciation Audio (Phase 16) | ✅ Complete + Debugged | usePronunciation hook (ms-MY → ms → default fallback); SpeakerButton component; wired into VocabPills (chatbot), course class vocab cards, quiz results breakdown, dashboard vocabulary table; 3 post-implementation bugs fixed |
| Notification System (Phase 17) | ✅ Complete | GET /api/notifications/ (last 20 + unread_count), POST mark-read, POST read-all; NotificationBell (60s polling, unread badge) + NotificationPanel; floating global icon in layout.tsx |
| Gamification — Streak + XP (Phase 18) | ✅ Complete | record_learning_activity() in gamification_service.py; Redis-keyed daily streak; XP awards: class=10, quiz pass=25, chatbot session=5; milestone notifications (streak 3/7/14/30, every 100 XP); wired into 4 routers (courses, quiz, chatbot); StreakBadge + XPBar components; dashboard +2 stat cards; sidebar footer shows streak+XP |
| Sidebar Polish | ✅ Complete | Double divider removed (no border-b on logo area); ThemeToggle repositioned to header row; footer items centered except XP bar; collapsed tooltips use theme-aware bg-popover |
| My Journey — Learning Roadmap (Phase 20) | ✅ Complete (v2 + patches) | New user_roadmaps table; flat course-obstacle model; 3-question modal; road/path UI; overdue+extend; BPS upgrade banner; identity-verified delete; check_roadmap_progress hook; admin journeys page. Phase 20 fully complete including all 7 post-implementation patches: fuzzy match (fuzzywuzzy token_sort_ratio ≥ 70%), sequential completion enforcement, Gemini failure UX with Try Again, estimated_weeks displayed on nodes, streak hook, Other intent free text, past journeys history section. |
| Chat History Page (Phase 21) | ✅ Complete | /chatbot/history; ChatHistoryList (paginated, title from first user msg, message count); session detail read-only view; History button in chatbot header; backend ChatSessionResponse extended with title + message_count |
| Image Generation — Nano Banana 2 (Phase 22) | ✅ Complete + Bug fixed + Hero banner | image_service.py uses Gemini REST API via httpx; get_courses_list() retroactive cover healing; cover_image_url now included in get_course_with_progress(); course detail page shows full-width hero banner with cover as background + dark gradient overlay + white title text |
| Spelling Practice Game (Phase 19) | ✅ Complete + v2 redesign | Leitner-box word selection; Levenshtein fuzzy matching; Start screen → 3-2-1 countdown → 10s per-word timer (green→yellow→red pulse) → Time's Up screen with Next/Start Over; combo multiplier; session summary; keyboard shortcuts (Enter/Space/Escape); personal best; Games link in sidebar |
| Chatbot vocab pipeline fix | ✅ Fixed | _extract_and_save() now opens its own AsyncSessionLocal session — asyncio.create_task with request-scoped session was silently failing after SSE stream ended; vocab/grammar now reliably saved after every chatbot response |
| Frontend Performance Optimizations | ✅ Complete | Session cache in api.ts (60s TTL, eliminates /api/auth/session round-trip on every API call); profile fetch deduplication via shared useQuery(['profile']) key in AppSidebar + OnboardingChecker; login router.refresh() race condition removed; redirect loading overlay added |
| UI Overhaul (2026-04-08) | ✅ Complete | Split-screen auth (branding left, glass form right); unified dark olive palette (#25221a bg, #1c1a13 sidebar, #2e2b22 card); box logo across all icon contexts; autofill CSS fix; quiz generating loader; WeakPoints + QuizHistory tile redesign; spelling game exit button; chatbot Waves color fix; sidebar bg-sidebar token; custom themed Google button (hides iframe, uses ref click); shader intensity reduced; left panel gradient overlay; storeSession() CSRF retry |
| Evaluation Feedback (Section 5.20) | ✅ Complete | POST /api/evaluation/feedback; backend/schemas/evaluation.py + backend/routers/evaluation.py; FeedbackModal component (3-question survey: star rating, Yes/No/Somewhat, optional textarea); wired into adaptive quiz (3s delay) and module quiz results page; feedbackApi in api.ts; FeedbackPayload + FeedbackSubmitResponse types added |
| Module Quiz Results Page | ✅ Complete | Full results page replacing TODO stub; sessionStorage data-passing pattern (quiz page stores result before redirect); SVG circular score ring; Pass/Fail state with Module Unlocked banner; Continue to Next Module button (fetches course structure via React Query to resolve next module's first class); Retry Quiz + Review Module on fail; per-question breakdown with SpeakerButton on wrong answers; FeedbackModal wired in |

## Missing / Broken
- `frontend/app/(dashboard)/quiz/adaptive/results/page.tsx` — redirects back to `/quiz/adaptive` (inline results used instead). Deep-link works but no standalone results page.

## Known Pre-existing Issue (not caused by recent changes)
- Module quiz cache-vs-submission misalignment: if a quiz attempt fails (0%) the cache clears and Gemini regenerates new questions. If the user re-submits using answers from the *first* GET, they score 0% again. Mitigation: frontend should re-fetch GET before showing quiz form if previous submission failed. This is a UI flow issue, not a backend bug.

## ✅ Fixed Issues (Session 10)
- **Login broken (2026-04-13):** `fuzzywuzzy` and `python-Levenshtein` were in `requirements.txt` but not installed in the venv. `journey_service.py` imports `fuzzywuzzy`, so backend crashed on startup — port 8000 never opened, all API calls returned "connection refused". Fix: `pip install fuzzywuzzy==0.18.0 python-Levenshtein==0.25.1` (packages confirmed installed via `pip check`).
- **Gemini image model name (2026-04-13):** `backend/.env` and `image_service.py` fallback had old model `gemini-2.0-flash-preview-image-generation`. That model is **deprecated and shuts down June 1, 2026**. Correct model is `gemini-3.1-flash-image-preview` (released Feb 26, 2026 — matches CLAUDE.md and .env.example). Updated: `backend/.env`, `image_service.py` default + docstring.

## ✅ Fixed Issues (Session 13)
- **Course covers not appearing (2026-04-13):** Session 12 correctly fixed `image_service.py` (httpx REST API) and `course_service.py` (retroactive healing + `asyncio.create_task`), but the backend was **never restarted** after those changes were made. Uvicorn started at 08:19, files modified at 14:22–14:28 — old broken code was still running. Fix: killed old uvicorn PIDs (18316, 25012), started fresh process on port 8000. Also manually ran `_generate_and_save_cover()` for all 3 existing courses that had `cover_image_url = NULL`. All verified: Gemini REST API returns JPEG (~1.1 MB base64, ~17s), DB save works, `GET /api/courses/` returns cover correctly. **Important**: after any code change to the backend, the uvicorn process MUST be restarted manually (no `--reload` flag in prod mode).

---

## What Was Done This Session (2026-04-13 Session 13 — Course cover hero banner + image fix)

### Root cause of "cover not appearing" confirmed
- Traced that uvicorn was started at 08:19 AM but Session 12's `image_service.py` and `course_service.py` were written at 14:22–14:28. No `--reload` flag → old broken code was still serving requests.
- Killed old uvicorn PIDs (18316, 25012), started fresh backend process. Verified health check passes.
- Manually ran `_generate_and_save_cover()` via Python test script for all 3 courses that had `cover_image_url = NULL` — covers now saved in DB (~1.1 MB base64 JPEG each).

### Course cover used as hero banner on course detail page
**3 files changed:**
- `frontend/lib/types.ts` — added `cover_image_url: string | null` to `Course` interface
- `backend/services/course_service.py` — `get_course_with_progress()` return dict now includes `cover_image_url`
- `frontend/app/(dashboard)/courses/[courseId]/page.tsx` — replaced flat header with full-width hero:
  - Cover image fills a 56–64px tall banner as `object-cover`
  - Dark gradient overlay (`from-black/70` to transparent) keeps text readable
  - Course topic label + title sit bottom-left in white with `drop-shadow`
  - "Back" pill floats top-left with `backdrop-blur-sm` frosted glass style
  - Falls back to primary gradient if `cover_image_url` is null
  - Page body scoped to `max-w-3xl` below the full-bleed hero

---

## What Was Done This Session (2026-04-13 Session 12 — Image Generation bug fix)

### Root cause
`image_service.py` used `google-generativeai==0.7.2` which raises:
```
TypeError: GenerationConfig.__init__() got an unexpected keyword argument 'response_modalities'
```
This was caught by the broad `except Exception` in `_generate_sync()`, silently returning `None` on every call. **Zero Gemini image API calls were ever made** — confirmed via Google AI Studio showing no image generation traffic.

Could not install `google-genai` (new SDK) to fix it — that package requires `google-auth>=2.48.1` but the project pins `==2.29.0` to avoid Google OAuth conflicts (CLAUDE.md Known Issues).

### Fix — `backend/services/image_service.py` (full rewrite)
- Dropped `google.generativeai` SDK and `ThreadPoolExecutor` entirely
- Rewrote `generate_image()` as a direct async `httpx` call to the Gemini REST API (`v1beta/models/{model}:generateContent`)
- REST API accepts `generationConfig.responseModalities: ["IMAGE"]` (camelCase — no SDK version constraint)
- `httpx==0.27.0` is already a declared dependency — no new packages added
- Verified: `generate_image()` returns an `image/jpeg` base64 data URL (~800 KB) in ~22 seconds
- Added `[IMAGE]` diagnostic logging throughout (`generate_image`, `generate_course_cover`, `generate_journey_banner`, `generate_milestone_card`)

### Fix — `backend/services/course_service.py`
- Added `[IMAGE]` log at the `asyncio.create_task()` trigger inside `generate_course()`
- Added `[IMAGE]` logs inside `_generate_and_save_cover()` at every step (start, None-guard, DB-save, already-exists guard)
- **Retroactive healing:** `get_courses_list()` now calls `asyncio.create_task(_generate_and_save_cover(...))` for any course with `cover_image_url = NULL` — courses created while the bug was active will get their cover generated the next time the user visits `/courses`. The frontend's existing 12-second re-fetch picks it up automatically

---

## What Was Done This Session (2026-04-13 Session 11 — Phase 23 Mobile Responsiveness Check)

### Mobile Responsiveness Audit — 13 pages checked

Pages audited for mobile viewport (<768px) issues — hardcoded widths, non-collapsing grids, table overflow, oversized text, modal sizing:

**2 files fixed:**

- **`frontend/app/(dashboard)/admin/users/page.tsx`**
  - Table used `grid-cols-[2fr_2fr_1fr_1fr_1fr_auto]` inside `overflow-hidden` GlowCard — no horizontal scroll on mobile
  - Fix: Changed GlowCard to `overflow-x-auto`; wrapped header + all rows in `<div className="min-w-[700px]">` for clean horizontal scroll

- **`frontend/app/(dashboard)/admin/users/[userId]/page.tsx`**
  - Loading skeleton grid: `grid-cols-4` → `grid-cols-2 md:grid-cols-4`
  - Stats grid (8 StatPill cards): `grid-cols-4` → `grid-cols-2 md:grid-cols-4` (2×4 on mobile, 4×2 on desktop)
  - Page header: added `flex-wrap` so Reset Data + Delete buttons wrap below name/email on narrow viewports

**11 pages with no issues:**
- `/journey` — SetupModal `w-full max-w-md`; road view `max-w-xl mx-auto`; all responsive
- `/admin` (index) — already uses `grid-cols-2 lg:grid-cols-3`
- `/admin/feedback` — flex-col layout, no tables
- `/admin/journeys` — table already wrapped in `overflow-x-auto`
- `/games/spelling` — `max-w-md mx-auto` throughout all phases
- `/settings`, `/settings/profile`, `/settings/password`, `/settings/about` — all `max-w-2xl mx-auto px-4`
- `/chatbot/history` — `max-w-3xl w-full mx-auto`

`tsc --noEmit` → exit 0, zero TypeScript errors.

---

## What Was Done This Session (2026-04-13 Session 10 — v1 Journey cleanup + Login fix + Gemini model fix)

### v1 Journey Model Cleanup
- **`backend/models/journey.py`** — Removed `LearningRoadmap` and `RoadmapActivityCompletion` class definitions (v1 tables superseded by `user_roadmaps` in Phase 20 v2). Updated module docstring.
- **`backend/models/__init__.py`** — Replaced `LearningRoadmap, RoadmapActivityCompletion` export with `UserRoadmap` only.
- **`backend/services/admin_service.py`** — Fixed admin "reset user data" function: was deleting from `LearningRoadmap` (v1, dead data), now correctly deletes from `UserRoadmap` (v2). Removed `LearningRoadmap` import.
- **`backend/db/migrations/versions/20260413_1200_drop_v1_journey_tables.py`** — New Alembic migration (revision `c9d0e1f2a3b4`, chains from `b8c9d0e1f2a3`) that DROPs `roadmap_activity_completions` and `learning_roadmaps`. Down migration recreates both tables with TEXT `banner_image_url` (Phase 22 state). **Not yet run — run manually after review.**

### Login Fix
- **Root cause:** `fuzzywuzzy` and `python-Levenshtein` missing from venv → backend startup crash → port 8000 never opened
- **Fix:** Installed via pip; `pip check` confirms no broken requirements

### Gemini Image Model Fix
- **`backend/services/image_service.py`** — Updated fallback model name from old `gemini-2.0-flash-preview-image-generation` to correct `gemini-3.1-flash-image-preview`; updated docstring + stale `learning_roadmaps` comment
- **`backend/.env`** — Updated `GEMINI_IMAGE_MODEL` to `gemini-3.1-flash-image-preview`

---

## What Was Done This Session (2026-04-13 Session 9 — Docs sync + Evaluation Feedback + Module Quiz Results)

### CLAUDE.md Corrections (Section 6, 7, 13)

#### Section 6 — Database Schema
- **`users` table**: removed non-existent `bps_level` column; added clarifying comment that `proficiency_level` stores BPS values; removed incorrect migration note
- **`courses` table**: added `cover_image_url TEXT` (Phase 22)
- **`chat_sessions` table**: added `title TEXT` (Phase 21)
- **Journey / Roadmap**: replaced obsolete `learning_roadmaps` + `roadmap_activity_completions` with current `user_roadmaps` table (full column list + partial unique index note)
- **`notifications` table**: added `image_url TEXT` (Phase 22)
- **New tables added**: `token_usage_logs`, `activity_logs` (Phase 15 analytics)

#### Section 7 — API Endpoints
- **Journey**: replaced 3 v1 endpoints (`GET/POST/DELETE /api/journey/`) with 7 current v2 endpoints under `/api/journey/roadmap/...`; added `GET /api/journey/roadmap/history`
- **Admin**: added `GET /api/admin/journeys`
- **Profile**: added `POST /api/profile/change-password`
- **Notifications**: added `POST /api/notifications/read-all`
- **Games**: added `POST /api/games/spelling/session` + `GET /api/games/spelling/best`
- **Courses**: added `GET /api/courses/jobs/{job_id}`
- **Evaluation**: updated comment; endpoint was already present

#### Section 13 — Feature → File Map
- **Dashboard**: `CEFRProgressBar.tsx` → `BPSProgressBar.tsx`
- **Admin Panel**: added `admin/users/[userId]/page.tsx`, `admin/journeys/page.tsx`, `backend/models/analytics.py`, `backend/utils/analytics.py`
- **My Journey**: removed 3 deleted component files (`RoadmapView.tsx`, `ActivityCard.tsx`, `PhaseAccordion.tsx`); updated page.tsx description; added `backend/models/journey.py`

### PHASES.md Corrections
- **Phase 20** status: updated from `🔲 In Progress` → `✅ Complete (v2 + patches — 2026-04-13)`
- **Phase 20** checklist: all 14 items (8 backend + 6 frontend) marked `[x]`

---

### Evaluation Feedback (Section 5.20)

#### New Files
- **`backend/schemas/evaluation.py`** — `FeedbackSubmitRequest` (quiz_type, rating 1–5, weak_points_relevant, optional comments ≤1000 chars) + `FeedbackSubmitResponse`
- **`backend/routers/evaluation.py`** — `POST /api/evaluation/feedback`; auth required via `get_current_user`; inserts into `evaluation_feedback` table (table already existed from Phase 11); returns 201 `{ success: true, message: "Thank you for your feedback!" }`
- **`frontend/components/quiz/FeedbackModal.tsx`** — 3-question survey modal: Q1 5-star rating (hover + click), Q2 Yes/No/Somewhat buttons, Q3 optional textarea (max 1000 chars); success thank-you state auto-closes after 2s; inline error with retry; Skip link; uses bg-card / border-border card pattern

#### Modified Files
- **`backend/main.py`** — imported `evaluation` router + `backend.models.evaluation`; registered at `/api/evaluation`
- **`frontend/lib/types.ts`** — added `FeedbackPayload`, `FeedbackSubmitResponse`
- **`frontend/lib/api.ts`** — added `FeedbackPayload` + `FeedbackSubmitResponse` imports; added `feedbackApi.submitFeedback()`
- **`frontend/app/(dashboard)/quiz/adaptive/page.tsx`** — added `useRef` import; `showFeedback` state + `feedbackShown` ref; `useEffect` triggers modal 3s after results appear (once per attempt); `<FeedbackModal quizType="standalone" />` rendered in results block; ref resets in `handleRetry`

#### Test Results
| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| Python syntax (evaluation.py, schemas/evaluation.py, main.py) | ✅ OK |

---

### Module Quiz Results Page (stub → full implementation)

#### Problem
`frontend/app/(dashboard)/quiz/module/[moduleId]/results/page.tsx` was a TODO stub. The quiz page previously rendered results inline but had no actual results page for the `/quiz/module/[moduleId]/results` route.

#### Data-passing pattern
Quiz page (`courses/[courseId]/modules/[moduleId]/quiz/page.tsx`) stores result + courseId + moduleTitle in `sessionStorage['moduleQuizResult_${moduleId}']` immediately before `router.push` to the results route. Results page reads from sessionStorage on mount.

#### Modified Files
- **`frontend/app/(dashboard)/courses/[courseId]/modules/[moduleId]/quiz/page.tsx`**
  - Added `useRouter` import
  - `onSuccess`: stores to sessionStorage, then `router.push('/quiz/module/${moduleId}/results?courseId=${courseId}')`
  - Removed entire inline results block (`if (result)`) and `handleRetry` function
  - Added brief "Loading results…" redirect overlay for `submitMutation.isSuccess`

#### New File
- **`frontend/app/(dashboard)/quiz/module/[moduleId]/results/page.tsx`** — full results page:
  - Reads sessionStorage on mount; graceful fallback if data missing (direct URL access)
  - **SVG circular score ring**: animated stroke-dashoffset, PASS/FAIL label inside ring
  - **Pass state**: "Module Unlocked! 🎉" + `Trophy` icon + "Continue to Next Module" button → fetches course via `coursesApi.get()` (React Query) to resolve next module's first class href
  - **Fail state**: "Keep practising!" + "Retry Quiz" + "Review Module" buttons
  - **Per-question breakdown**: SpeakerButton (xs) on every wrong `correct_answer`
  - **FeedbackModal**: triggered 3s after mount with `quizType="module"`
  - Breadcrumb, Back to Course link, fully styled to match adaptive quiz results
  - Wrapped in `<Suspense>` for `useSearchParams` (Next.js App Router requirement)

#### Test Results
| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |

---

## What Was Done This Session (2026-04-09 Session 7 — Phase 20 Full Rewrite)

### Phase 20 — My Journey (Learning Roadmap) — Complete Rewrite

#### Why it was rewritten
The Phase 20 v1 implementation used a phases/weeks/activities structure with three activity types ('course', 'quiz', 'chatbot'). The new spec redefines the roadmap as a flat ordered list of **course obstacles only**, with a new 3-question onboarding modal, identity-verified delete, deadline extension, BPS upgrade regeneration, and a road/path visual metaphor.

#### DB Changes
- [x] New `user_roadmaps` table — flat ordered course obstacles in JSONB, status (active/overdue/completed/deleted), partial unique index for one active roadmap per user, deadline, extended flag, bps_level_at_creation, banner_image_url
- [x] Alembic migration: `20260409_0900_phase20_user_roadmaps.py` (revision `b8c9d0e1f2a3`, down_revision `a7b8c9d0e1f2`)
- [x] Old `learning_roadmaps` + `roadmap_activity_completions` tables kept for backward compat (not used for new journey logic)

#### Backend
- [x] `backend/models/journey.py` — added `UserRoadmap` ORM model alongside old models
- [x] `backend/services/journey_service.py` — complete rewrite: generate_roadmap, get_roadmap (overdue check + notification triggers + BPS upgrade flag), check_roadmap_progress (fuzzy match + XP awards), check_bps_change (Redis flag), extend_deadline, verify_and_delete (bcrypt for email / oauth_confirmed for Google), regenerate_uncompleted, dismiss_bps_upgrade, get_all_roadmaps_admin
- [x] `backend/routers/journey.py` — complete rewrite: POST /roadmap/generate, GET /roadmap, POST /roadmap/verify-and-delete, PATCH /roadmap/extend, POST /roadmap/regenerate, DELETE /roadmap/dismiss-upgrade
- [x] `backend/services/quiz_service.py` — added `_check_course_completion_for_journey()` background task; hooks `check_roadmap_progress()` after all modules in a course are passed; hooks `check_bps_change()` after BPS recalculation in `submit_standalone_quiz()`
- [x] `backend/services/admin_service.py` — `active_roadmaps` now counts `user_roadmaps WHERE status='active'`
- [x] `backend/routers/admin.py` — added `GET /api/admin/journeys` (read-only, all roadmaps for admin)

#### Frontend
- [x] `frontend/lib/types.ts` — replaced old Journey types with `UserRoadmap`, `RoadmapElement`, `GenerateRoadmapPayload` (v2), `AdminRoadmapRow`
- [x] `frontend/lib/api.ts` — replaced old `journeyApi` with new endpoints (generate, getRoadmap, verifyAndDelete, extendDeadline, regenerate, dismissUpgrade, getAdminJourneys)
- [x] `frontend/app/(dashboard)/journey/page.tsx` — complete rewrite with road/path UI, 3-question setup modal, obstacle nodes (completed/current/locked states), overdue banner + extend modal, BPS upgrade banner, identity-verified delete modal, celebration page
- [x] `frontend/app/(dashboard)/courses/page.tsx` — added `?generate=<topic>` param handling: reads on mount, auto-opens modal with pre-filled topic, clears param from URL via `window.history.replaceState`
- [x] `frontend/components/courses/CourseGenerationModal.tsx` — added `initialTopic` prop; state initialized from it
- [x] `frontend/app/(dashboard)/admin/journeys/page.tsx` — new read-only admin page: table of all roadmaps with expandable obstacle detail rows; summary chips (total/active/overdue/completed)
- [x] `frontend/app/(dashboard)/admin/page.tsx` — added "User Journeys" section card linking to `/admin/journeys`
- [x] Deleted old Phase 20 v1 components: `RoadmapView.tsx`, `PhaseAccordion.tsx`, `ActivityCard.tsx`

#### Syntax Checks
| Check | Result |
|---|---|
| Python syntax — 7 backend files | ✅ All OK |
| `tsc --noEmit` | ✅ 0 errors |

#### Applied / Resolved (2026-04-13 diagnosis session)
- ✅ Alembic migrations applied: `f1a2b3c4d5e6 → a7b8c9d0e1f2 → b8c9d0e1f2a3` (Phase 22 image columns + Phase 20 user_roadmaps table)
- `user_roadmaps` table, `ix_user_roadmaps_user_id` index, `user_roadmaps_one_active_per_user` partial unique index, and `notifications.image_url` column all confirmed present in DB
- Journey page renders inline obstacle components (no separate component files needed — road UI is self-contained)
- Journey v1 endpoints gone; no old frontend routes reference them

---

## What Was Done This Session (2026-04-08 Session 6 — Testing & Validation Pass)

### Full Validation Pass — Phase 21 + Phase 22

#### Tests Run
| Check | Result |
|---|---|
| TypeScript compile (`tsc --noEmit`) | ✅ 0 errors |
| Python syntax — 10 Phase 21+22 files | ✅ All OK |
| Python syntax — 4 fixed files re-check | ✅ All OK |

#### Bugs Found and Fixed
| File | Issue | Fix |
|---|---|---|
| `backend/routers/chatbot.py` | `import uuid as _uuid` — unused (0 references) | Removed |
| `backend/services/journey_service.py` | `import uuid as _uuid` — unused (0 references) | Removed |
| `backend/services/image_service.py` | `asyncio.get_event_loop()` — deprecated in Python 3.10+ when called from async context | Changed to `asyncio.get_running_loop()` |
| `backend/services/quiz_service.py` | `import asyncio as _asyncio` inside an `if` block — non-standard pattern | Moved `import asyncio` to top-level; changed `_asyncio.create_task(...)` to `asyncio.create_task(...)` |

### Pending Migration
Phase 22 Alembic migration (`20260408_1200_phase22_image_columns.py`, revision `a7b8c9d0e1f2`) must be applied before first run:
```
alembic upgrade head
```
Adds: `courses.cover_image_url TEXT`, `learning_roadmaps.banner_image_url TEXT`, `notifications.image_url TEXT NULL`

---

## What Was Done This Session (2026-04-08 Session 3 — Chatbot personalization + Notification completion loop)

### Chatbot System Prompt Personalization
- **`backend/services/langchain_service.py`** — The DB query now fetches `native_language`, `learning_goal`, AND `proficiency_level` together (single query replacing the previous single-field lookup).
  - Added `{learning_goal_context}` — if set, tells Gemini: "The user is learning Malay for: [goal]. Tailor formality and examples accordingly."
  - Added `{proficiency_context}` — always injected; tells Gemini the BPS level with human description (e.g. "BPS-1 — Beginner — focus on basics"). Gemini was previously guessing level from conversation alone.
  - Both placeholders appended inline to the system prompt template alongside `{native_language_context}`.

### Phase Completion Notifications
- **`backend/services/journey_service.py`** — Added `_get_phase_activity_ids(roadmap_json, activity_id)` and `_get_phase_title(roadmap_json, activity_id)` pure helper functions.
  - `complete_activity()` now, after committing the new completion row, queries how many of the phase's activities are completed. If `completed == total`, fires a `phase_complete` notification (fire-and-forget, wrapped in try/except so it never blocks the response).
  - Import added: `func` from `sqlalchemy`, `create_notification_fire_and_forget` from `gamification_service`.

### Course Completion Notifications
- **`backend/routers/courses.py`** — In `_run_generation_task()`, the return value of `generate_course()` is now captured as `course`. After success, fires a `course_complete` notification: "Your course '{title}' is ready! Head to Courses to start learning."
  - Import added: `create_notification_fire_and_forget` from `gamification_service`.
  - The notification fires in the same `AsyncSessionLocal` context as the course generation.

### Profile Settings UX
- **`frontend/app/(dashboard)/settings/profile/page.tsx`** — Added helper text below both profile dropdowns:
  - Native language: "Helps BahasaBot draw comparisons between your language and Malay during tutoring sessions."
  - Learning goal: "Used to personalize your AI tutor tone and your Journey learning roadmap."

### Notification Type Coverage
| Type | Frontend icon | Backend fires |
|---|---|---|
| streak_milestone | Flame | ✅ |
| xp_milestone | Star | ✅ |
| phase_complete | Trophy (purple) | ✅ (this session) |
| course_complete | BookOpen (green) | ✅ (this session) |
| journey_reminder | Map (blue) | ❌ (needs scheduler) |

### Dashboard Streak/XP Structural Fix
- **`backend/routers/dashboard.py`** — `dashboard_summary` endpoint now overwrites `streak_count` and `xp_total` from the cached summary with fresh values from `current_user` (which is already a live DB read via `Depends(get_current_user)`). This permanently prevents any divergence between sidebar (profile API, always fresh) and dashboard cards (summary API, Redis-cached). Other summary fields (courses, modules, weak points, etc.) still benefit from the 5-min cache.

### Test Results (2026-04-08 Session 3)
| Check | Result |
|---|---|
| Python syntax — langchain_service.py | OK |
| Python syntax — journey_service.py | OK |
| Python syntax — courses.py | OK |
| Python syntax — dashboard.py | OK |
| Dashboard streak/XP — structural root cause identified | current_user always fresh, cache always overridden |

---

## What Was Done This Session (2026-04-08 Session 2 — GlowCard global rollout + login logo)

### GlowCard applied globally
All card-like `<div className="rounded-xl border border-border bg-card ...">` elements replaced with `<GlowCard className="bg-card ...">` across the entire project:
- **Settings pages**: `settings/page.tsx`, `settings/profile/page.tsx`, `settings/password/page.tsx`, `settings/about/page.tsx`
- **Journey**: `journey/page.tsx` (3 feature mini-cards), `components/journey/PhaseAccordion.tsx`
- **Admin**: `admin/page.tsx` (StatCard + nav list), `admin/users/page.tsx` (skeleton + data table), `admin/users/[userId]/page.tsx` (StatPill + analytics stat cards + recent courses list), `admin/feedback/page.tsx` (aggregate stats card + each feedback card)
- Two intentionally excluded: analytics day-selector tab bar (pill UI), search input field — both are not semantic cards

### Login page logo fix
- **`frontend/components/ui/auth-card.tsx`** — changed branding panel layout from `flex-col` (logo above title) to `flex-row items-center gap-4` (logo beside title). The 14×14 square logo now appears inline to the left of "BahasaBot" text. Tagline moved below the row.

### Test Results (2026-04-08)
| Check | Result |
|---|---|
| TypeScript compile | Not run (UI-only changes, no type changes) |
| GlowCard import added to all updated files | ✅ |
| Closing tags matched (GlowCard vs. old div) | ✅ Verified |
| Login logo position | ✅ Logo beside title, tagline below |

---

## What Was Done This Session (2026-04-07 — Frontend performance optimizations)

### Root causes identified
1. **Transient "login error" flash** — `router.refresh()` was called immediately after `router.push("/dashboard")`, causing a race where the middleware re-ran before the NextAuth session cookie was fully stable, briefly surfacing an error state.
2. **No loading feedback during redirect** — after successful sign-in, the login form stayed visible until the full dashboard rendered, with no visual indicator.
3. **`getSession()` on every API call** — `apiClient` interceptor was calling `getSession()` (a `/api/auth/session` network hop) before every single request. On a page that fires 5 concurrent API calls, that's 5 parallel session lookups.
4. **Duplicate profile API calls** — both `AppSidebar` and `OnboardingChecker` in `layout.tsx` independently called `profileApi.getProfile()` on every page mount (2 separate network requests for identical data).

### Fixes

#### `frontend/app/(auth)/login/page.tsx`
- Removed `router.refresh()` from both email and Google sign-in success paths — eliminates the middleware race condition that caused the transient login error.
- Added `redirecting` boolean state; set to `true` immediately after `storeSession()` succeeds.
- When `redirecting === true`, renders a full-screen loading overlay (logo + spinner + "Signing you in…") instead of the login form, giving instant visual feedback.

#### `frontend/lib/api.ts`
- Added `getCachedSession()` — module-level cache wrapping `getSession()` with a 60-second TTL. The first API call in a window fetches the real session; subsequent calls within 60 s return instantly from the in-memory cache.
- Added `invalidateSessionCache()` export — called from the 401 response interceptor to force a fresh session lookup on token failure.
- `tsc --noEmit`: ✅ 0 errors.

#### `frontend/components/nav/AppSidebar.tsx`
- Replaced `useEffect + profileApi.getProfile()` with `useQuery({ queryKey: ["profile"], staleTime: 60_000 })`.
- Simplified sidebar collapsed state initialization to a lazy `useState(() => localStorage.getItem(...))` — removes a second `useEffect` that was only needed for the old `setCollapsed` approach.

#### `frontend/app/(dashboard)/layout.tsx` — `OnboardingChecker`
- Replaced `useEffect + useRef + profileApi.getProfile()` with `useQuery({ queryKey: ["profile"], staleTime: 60_000 })`.
- **Result**: `AppSidebar` and `OnboardingChecker` now share the same React Query key — only **one** `/api/profile/` request fires per page load (down from 2); subsequent navigations within the stale window hit the cache instantly.

### Test Results (2026-04-07)
| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| Login error flash | ✅ No longer occurs — `router.refresh()` removed |
| Redirect loading overlay | ✅ Shows immediately after sign-in button press |
| Profile API calls per page load | ✅ 1 (down from 2) — confirmed by shared query key dedup |
| Session lookup per API call | ✅ Cached after first call — no extra /api/auth/session round-trips |

---

## What Was Done This Session (2026-04-07 — Phase 19 v2: Game redesign + vocab pipeline fix)

### Critical Bug Fix — Chatbot vocab extraction
- **`backend/services/langchain_service.py`** — `_extract_and_save()` was called via `asyncio.create_task()` using the request-scoped DB session. After the SSE stream ended, FastAPI closed the session. The background task then ran against a closed session, silently rolled back, and saved nothing. Fix: `_extract_and_save()` now opens its own `async with AsyncSessionLocal()` session, fully independent of the request lifecycle. `db_factory` parameter removed. Call site updated to pass only `assistant_text, user_id, session_id`.

### Spelling Game v2 — Full redesign
- **`frontend/components/games/SpellingGame.tsx`** — New state machine: `start → countdown → loading → ready → submitted/timeout → summary`
  - **Start screen**: "Ready to be tested?" with 4-rule card strip (audio/timer/combo/session), personal best display, "Let's Go!" CTA button
  - **3-2-1 countdown**: animated `zoom-in-50` number (700ms per tick); transitions directly to first word fetch
  - **10-second per-word timer**: shrinking progress bar + countdown number; color transitions green→yellow→red; red pulsing at ≤3s; auto-triggers `handleTimeout()` when `timeLeft === 0`
  - **Time's Up screen**: `Clock` icon, correct word + IPA + replay button, "Start Over" and "Next Word →" side-by-side buttons
  - **Keyboard**: `Enter` starts game from start screen; `Escape` returns to start screen from anywhere; `Space` replays audio; `Enter` advances in submitted/timeout phases
  - Timer cleanup: `stopTimer()` called in every branch that exits `ready` phase; `useEffect(() => () => stopTimer(), [])` cleanup on unmount

### Icon fix
- Empty vocab state icon changed from 📚 emoji to `<BookOpen className="w-8 h-8 text-primary" />` inside `bg-primary/10` circle — matches app theme

### Test Results (2026-04-07)
| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| Direct DB check — user vocab rows | ✅ 164 rows confirmed |
| `get_next_word()` with real user ID | ✅ Returns word |
| GET /api/games/spelling/word (live API, JWT) | ✅ 200 — word="sembilan" |
| POST /submit correct | ✅ correct=True, xp=2 |
| POST /submit almost (1 char off) | ✅ correct=False, almost=True |
| POST /submit wrong | ✅ correct=False, almost=False |
| GET /best | ✅ 200 |

---

## What Was Done This Session (2026-04-07 — Phase 19: Spelling Practice Game)

### Backend — New Files
- **`backend/services/spelling_service.py`** *(new)* — `get_next_word()`: weighted random selection (wrong words ×3); `_levenshtein()`: O(n) DP edit-distance; `_extract_ipa()`: regex IPA extractor from meaning strings; `evaluate_answer()`: exact/almost/incorrect outcomes + Redis wrong-list; `save_session_score()`: upsert best-run-per-day; `get_personal_best()`.
- **`backend/routers/games.py`** *(new)* — 4 endpoints with Pydantic schemas: `GET /api/games/spelling/word`, `POST /api/games/spelling/submit` (+2 XP via record_learning_activity), `POST /api/games/spelling/session`, `GET /api/games/spelling/best`.
- **`backend/main.py`** — added `games` router import + `app.include_router(..., prefix="/api/games")`.

### Frontend — New Files
- **`frontend/components/games/SpellingGame.tsx`** *(new)* — full game component: auto-play audio (usePronunciation, 350ms delay), combo multiplier display (×1/×1.5/×2), fuzzy "Almost!" yellow feedback, session summary modal (10 words: accuracy, XP, peak combo, mastered vs. review lists), keyboard shortcuts (Enter=submit/next, Space=replay audio), personal best footer.
- **`frontend/app/(dashboard)/games/spelling/page.tsx`** *(new)* — page wrapper with 3-tip how-to strip (Listen/Type/Combos) + `<SpellingGame />`.

### Frontend — Modified Files
- **`frontend/lib/types.ts`** — added `SpellingWord`, `SpellingSubmitResponse`, `SpellingPersonalBest` interfaces.
- **`frontend/lib/api.ts`** — added `gamesApi` (getSpellingWord, submitSpellingAnswer, endSession, getPersonalBest); moved game types import to top-of-file block.
- **`frontend/components/nav/AppSidebar.tsx`** — added `Gamepad2` icon import + `Games` nav item (`href=/games/spelling`) between Quiz and Settings.

### Test Results (2026-04-07)
| Check | Result |
|---|---|
| `tsc --noEmit` (frontend) | ✅ 0 errors |
| Python syntax check (spelling_service.py, games.py, main.py) | ✅ OK |
| Levenshtein unit tests (5 cases) | ✅ All pass |
| IPA extraction unit tests (3 cases) | ✅ All pass |
| Router import + 4-route check | ✅ Confirmed |
| games router mounted in main app | ✅ /api/games/spelling/* confirmed |

---

## What Was Done This Session (2026-04-07 — Phase 18: Gamification + Sidebar + Chatbot fixes)

### Backend — Gamification
- **`backend/services/gamification_service.py`** — added `record_learning_activity(user_id, db, xp_amount)`:  Redis-keyed daily streak (key `gamif:streak:<uid>`, 48h TTL); streak increments if last activity was yesterday, resets to 1 if older/missing; XP added to `users.xp_total`; milestone notifications at streak 3/7/14/30 and every 100 XP.
- **`backend/routers/courses.py`** — wired gamification into `complete_class` (+10 XP) and `submit_module_quiz_endpoint` (+25 XP if passed).
- **`backend/routers/quiz.py`** — wired into `submit_adaptive_quiz` (+25 XP if score_percent ≥ 70).
- **`backend/routers/chatbot.py`** — wired into `send_message`; 5 XP on first message of each session (Redis dedup key `gamif:chatbot_xp:<session_id>`, 48h TTL); streak updated every message.
- **`backend/services/progress_service.py`** — `get_dashboard_summary()` now includes `streak_count` and `xp_total` in the `stats` dict.

### Frontend — Gamification
- **`frontend/lib/types.ts`** — `DashboardStats` extended with `streak_count: number` + `xp_total: number`.
- **`frontend/components/gamification/StreakBadge.tsx`** *(new)* — `Flame` icon + count, `sm`/`md` size prop.
- **`frontend/components/gamification/XPBar.tsx`** *(new)* — XP total + progress bar to next 100 XP milestone.
- **`frontend/components/dashboard/StatsCards.tsx`** — 2 new cards (Day Streak, Total XP); grid updated to `lg:grid-cols-4`.

### Frontend — Sidebar Polish
- **`frontend/components/ui/theme-toggle.tsx`** — added `variant="icon"` (compact `w-8 h-8` icon button for collapsed/mobile).
- **`frontend/components/nav/AppSidebar.tsx`** — full redesign:
  - `border-b` removed from logo area (single `border-t` divider above footer only)
  - `ThemeToggle variant="pill"` moved to top-right of logo header row (industry standard)
  - `ThemeToggle variant="icon"` in collapsed footer and mobile header
  - Expanded footer: `flex flex-col items-center` — avatar, streak+XP inline row, and buttons all centered; XP bar is `w-full` (exception)
  - Streak (🔥) + XP (⭐) displayed inline with `|` divider; no redundant labels
  - All tooltips use `bg-popover border border-border shadow-md` (theme-aware, not hardcoded dark)

### Chatbot Welcome Screen Fix
- **`frontend/app/(dashboard)/chatbot/page.tsx`** — replaced `🇲🇾` emoji (renders as "MY" on Windows) with `<Image src="/Project Logo.png" />` in the `EmptyState` welcome card. The logo shows a branded 64×64 rounded avatar with `ring-2 ring-primary/20`.

---

## What Was Done This Session (2026-04-07 — Phase 17: Notification System)

### Files Created
- **`backend/services/gamification_service.py`** — `create_notification(db, user_id, type, message)` + `create_notification_fire_and_forget()` non-blocking wrapper (try/except, never disrupts request).
- **`backend/routers/notifications.py`** — 3 endpoints with Pydantic response schemas:
  - `GET /api/notifications/` — last 20 newest-first, returns `{notifications, unread_count}`
  - `POST /api/notifications/read-all` — registered before `/{id}/read` to avoid UUID path conflict
  - `POST /api/notifications/{notification_id}/read` — 404 if not owned by caller
- **`frontend/components/notifications/NotificationBell.tsx`** — bell icon + red badge; polls every 60s; refreshes on open; optimistic mark-read state updates.
- **`frontend/components/notifications/NotificationPanel.tsx`** — dropdown with per-type icons (Flame/Star/Map/BookOpen/Trophy), relative timestamps, mark-all-read button, empty state. `fixed inset-0` backdrop closes on outside click.

### Files Modified
- **`backend/main.py`** — added `notifications` router import + `app.include_router(...)`; added `backend.models.notification` model import.
- **`frontend/lib/types.ts`** — added `AppNotification`, `NotificationType`, `NotificationListResponse`.
- **`frontend/lib/api.ts`** — added `notificationsApi` (`getNotifications`, `markRead`, `markAllRead`).
- **`frontend/components/nav/AppSidebar.tsx`** — `NotificationBell` wired in 3 locations: mobile header bar, desktop collapsed footer, desktop expanded footer.

### Test Results (2026-04-07)
| Check | Result |
|---|---|
| `tsc --noEmit` (frontend) | ✅ 0 errors |
| Python syntax check (all 3 backend files) | ✅ OK |
| `GET /api/notifications/` (fresh user) | ✅ 200, unread_count=0 |
| Seed 3 notifications via `create_notification()` | ✅ Logged + stored |
| `GET /api/notifications/` after seed | ✅ 200, unread_count=3, items=3 |
| `POST /api/notifications/{id}/read` | ✅ 200, read=True |
| `GET` after single mark-read | ✅ unread_count=2 |
| `POST /api/notifications/read-all` | ✅ 200, success=True |
| `GET` after read-all | ✅ unread_count=0 |
| Invalid Bearer token | ✅ 401 |

---

## What Was Done This Session (2026-04-06 — VocabPill Debug Pass)

### Bugs Found and Fixed in `VocabularyHighlight.tsx`

End-to-end debug pass over all Phase 16 + tooltip changes. Three bugs identified and fixed:

| # | Bug | Root Cause | Fix |
|---|-----|-----------|-----|
| 1 | Double `usePronunciation` hook instances | `VocabPill` called the hook directly AND rendered `<SpeakerButton>` which also called it internally — two hook instances per pill, doubling `voiceschanged` event listeners | Removed `<SpeakerButton>` import from VocabularyHighlight; inlined the outer speaker button as a raw `<button>` using `speak`/`isSupported` already in scope from VocabPill's single hook call |
| 2 | Unused `vh` variable in `computePlacement` | `const vh = window.innerHeight` declared but never read (dead code) | Removed the declaration |
| 3 | Arrow misaligned on flipped tooltip | `right-3`/`left-3` (12px hardcoded) used as arrow offset in right/left-flipped cases — doesn't track actual pill center | Simplified `arrowX` to always `"left-1/2 -translate-x-1/2"` — clean, consistent |

**Verification:** `npx tsc --noEmit` → zero errors; `/chatbot`, `/dashboard` compile clean (200) with no runtime errors in dev server log.

---

## What Was Done This Session (2026-04-06 — VocabPill Tooltip Fixes)

### VocabPill — Overflow Fix + Speaker Button in Tooltip

**File:** `frontend/components/chatbot/VocabularyHighlight.tsx`

- **Tooltip overflow**: Added `computePlacement()` that calls `getBoundingClientRect()` on the pill ref on every hover open. Checks three cases: right-overflow (`alignRight: true` → `right-0`), left-overflow (`alignLeft: true` → `left-0`), top-overflow (`openBelow: true` → `top-full mt-1.5`). Arrow direction and horizontal alignment update to match.
- **Delayed hide**: Replaced instant `setShowTooltip(false)` with a 120 ms `setTimeout` stored in `hideTimer` ref. Both the pill button and the tooltip itself call `openTooltip` on `mouseEnter` and `scheduleClose` on `mouseLeave` — mouse can travel pill → tooltip without flicker. Timer cleared on unmount.
- **Speaker button inside tooltip**: `usePronunciation` hook called in VocabPill; tooltip content is now a flex row: meaning text + `Volume2` button (12px). `pointer-events-none` removed from tooltip so button is clickable. Button calls `speak(malay)` and has its own `onMouseEnter={openTooltip}` to prevent accidental close during interaction.
- **Phase 16 SpeakerButton outside the pill** retained (not removed).

---

## What Was Done This Session (2026-04-06 — Phase 16: Pronunciation Audio)

### Phase 16 — Pronunciation Audio + SpeakerButton

- **`frontend/lib/hooks/usePronunciation.ts`** *(new)* — Web Speech API hook; `speak(word)` function with voice selection fallback chain: ms-MY → ms → default (lang hint). Uses `voiceschanged` listener for Chrome async voice loading. Rate: 0.85 (learner-friendly). Returns `{ speak, isSpeaking, isSupported }`.
- **`frontend/components/ui/SpeakerButton.tsx`** *(new)* — Reusable Volume2 icon button; renders `null` when `isSupported === false` (no SSR issues); `e.stopPropagation()` prevents parent card/row click interference; two sizes: `sm` (14px) and `xs` (12px).
- **`frontend/components/chatbot/VocabularyHighlight.tsx`** — `SpeakerButton` (xs) added after each VocabPill button. Outer `<span>` changed from `inline-block` to `inline-flex items-center` to align pill and speaker icon.
- **`frontend/app/(dashboard)/courses/[courseId]/modules/[moduleId]/classes/[classId]/page.tsx`** — `SpeakerButton` (sm) added beside each vocab word heading in `VocabularySection`.
- **`frontend/app/(dashboard)/quiz/adaptive/page.tsx`** — `SpeakerButton` (xs) added next to `correct_answer` in per-question results breakdown (only shown when answer is wrong, so user can hear the correct Malay word).
- **`frontend/components/dashboard/VocabularyTable.tsx`** — `SpeakerButton` (xs) added inline in the Malay Word cell.
- **TypeScript:** `npx tsc --noEmit` — zero errors.

---

## What Was Done This Session (2026-04-06 — Phase 15 Debug + Full Test Pass)

### Bugs Found and Fixed

- **Analytics 500 error — NullType**: `get_user_analytics()` used `func.cast(f"{days} days", type_=None)` which generates a `NullType` column that PostgreSQL/asyncpg rejects. First fix attempt with `Interval` type also failed because asyncpg can't accept a raw string `"30 days"`. Final fix: replaced with `datetime.now(timezone.utc) - timedelta(days=days)` — asyncpg handles Python datetime objects correctly.
- **Backend serving stale code**: Old uvicorn process (PID from previous session) was holding port 8000. New process couldn't bind and silently fell through. Fixed by identifying PID via `netstat -ano`, killing it, and restarting cleanly.
- **TypeScript errors in admin pages**: `StatCard` and `StatPill` components used `React.ComponentType<{ size?: number; ... }>` for icon props, which conflicted with Lucide's `ForwardRefExoticComponent` (its `size` accepts `string | number`). Fixed by importing and using `LucideIcon` type directly.
- **Dead branch TS error in VocabularyTable**: `source_type === "quiz"` was always false (type is `"chatbot" | "course"`). Branch removed.

### Test Results (all pass)

| Endpoint | Result |
|---|---|
| `GET /api/admin/stats` | ✅ 16 users, 6 courses, 42.9% quiz pass rate |
| `GET /api/admin/users?search=sowan` | ✅ Returns filtered results correctly |
| `GET /api/admin/users/{id}` | ✅ Full profile + 8 activity stat counts |
| `GET /api/admin/users/{id}/analytics?days=7` | ✅ 7-item daily array, activity logged after quiz |
| `GET /api/admin/users/{id}/analytics?days=14/30/90` | ✅ Correct array lengths |
| `POST /api/admin/users/{id}/reset` (wrong password) | ✅ HTTP 403 |
| `POST /api/admin/users/{id}/reset` (own account) | ✅ HTTP 400 |
| `PATCH /api/admin/users/{id}/deactivate` (own account) | ✅ HTTP 400 |
| Activity logging end-to-end | ✅ Quiz submit → `standalone_quiz: 1` logged immediately |
| TypeScript `npx tsc --noEmit` | ✅ Zero errors |

### Files Modified This Session
- **`backend/services/admin_service.py`** — analytics query fix: `func.cast(NullType)` → `datetime.now(utc) - timedelta(days=days)`
- **`frontend/app/(dashboard)/admin/page.tsx`** — `LucideIcon` type fix
- **`frontend/app/(dashboard)/admin/users/[userId]/page.tsx`** — `LucideIcon` type fix
- **`frontend/components/dashboard/VocabularyTable.tsx`** — removed dead `source_type === "quiz"` branch

---

## What Was Done This Session (2026-04-05 — Phase 15 Analytics: Token Usage + Activity Tracking)

### Phase 15 Analytics Extension

- **`backend/models/analytics.py`** *(new)* — `TokenUsageLog` (token_usage_logs table: user_id, feature, input_tokens, output_tokens, total_tokens) + `ActivityLog` (activity_logs table: user_id, feature, duration_seconds); both indexed on user_id + created_at
- **`backend/db/migrations/versions/20260406_0900_analytics_tables.py`** *(new)* — Alembic migration f1a2b3c4d5e6; creates both tables with indexes; applied via `alembic upgrade head`
- **`backend/utils/analytics.py`** *(new)* — `log_tokens()` + `log_activity()` fire-and-forget helpers; wrapped in try/except with rollback so failures never crash user requests
- **`backend/services/gemini_service.py`** — `_invoke_with_retry` now returns `(text, input_tokens, output_tokens)`; `generate_text_with_usage()` added; `generate_text()` + `generate_json()` updated to unpack tuple
- **`backend/services/langchain_service.py`** — step 9 after chat response: `asyncio.create_task(log_activity(..., feature="chatbot"))` (fire-and-forget, no token count in streaming mode)
- **`backend/services/course_service.py`** — after `save_course()` succeeds: `log_activity(..., feature="course_gen")`
- **`backend/routers/quiz.py`** — after standalone quiz submit: `log_activity(..., feature="standalone_quiz")`
- **`backend/routers/courses.py`** — after module quiz submit: `log_activity(..., feature="module_quiz")`
- **`backend/services/admin_service.py`** — `get_user_analytics(db, user_id, days)`: queries both log tables, zero-fills missing days, returns daily arrays + totals + by_feature breakdowns
- **`backend/routers/admin.py`** — `GET /api/admin/users/{user_id}/analytics?days=30` (7–90 days); added `DELETE /users/{user_id}` + `POST /users/{user_id}/reset` with `AdminPasswordBody` confirmation
- **`frontend/app/(dashboard)/admin/users/[userId]/page.tsx`** *(new)* — user profile card + 8 StatPills + analytics section: day-range selector (7/14/30/60/90d), 4 summary stat cards, LineChart (daily tokens) + BarChart (daily events), feature breakdown horizontal bars, ConfirmModal for delete/reset with password field
- **`frontend/app/(dashboard)/admin/page.tsx`** — fixed `LucideIcon` prop type (was `React.ComponentType<...>`, caused TS error)
- **`frontend/components/dashboard/VocabularyTable.tsx`** — removed dead `source_type === "quiz"` branch (TS error)
- **`frontend/lib/types.ts`** + **`frontend/lib/api.ts`** — added `AdminUserDetail`, `AdminUserAnalytics`; `adminApi.getUserDetail`, `getUserAnalytics`, `deleteUser`, `resetUserData`

---

## What Was Done This Session (2026-04-05 — Phase 15: Admin Control Panel)

### Phase 15 — Admin Control Panel

- **`backend/services/admin_service.py`** *(new)* — `get_stats()` (6 aggregate metrics inc. quiz pass rate + avg feedback rating), `get_all_users()` (paginated, newest-first), `get_feedback_responses()` (paginated + rating distribution + avg), `deactivate_user()` (sets `is_active=False`)
- **`backend/routers/admin.py`** *(new)* — `require_admin` FastAPI dependency (raises HTTP 403 for non-admin); 4 endpoints: `GET /api/admin/stats`, `GET /api/admin/users`, `GET /api/admin/feedback`, `PATCH /api/admin/users/{id}/deactivate`; admin cannot deactivate own account guard
- **`backend/routers/auth.py`** — `register()` now reads `ADMIN_EMAIL` env var; if registering email matches, sets `role='admin'` automatically
- **`backend/main.py`** — registered `admin.router` at `/api/admin/`
- **`backend/.env.example`** — added `ADMIN_EMAIL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `GEMINI_IMAGE_MODEL` entries
- **`frontend/lib/types.ts`** — added `AdminStats`, `AdminUser`, `AdminFeedbackItem`, `AdminFeedbackResponse`
- **`frontend/lib/api.ts`** — added `adminApi` (`getStats`, `getUsers`, `deactivateUser`, `getFeedback`)
- **`frontend/app/(dashboard)/admin/page.tsx`** *(new)* — stats overview (6 stat cards: total/active users, courses, quiz pass rate, feedback count, avg rating) + section nav cards to Users and Feedback; redirects non-admin to /dashboard on mount
- **`frontend/app/(dashboard)/admin/users/page.tsx`** *(new)* — paginated user table (name, email, BPS level badge, XP, active/inactive status, deactivate button); optimistic UI update on deactivate; confirm dialog guard
- **`frontend/app/(dashboard)/admin/feedback/page.tsx`** *(new)* — feedback cards (star rating, relevance badge, open text quote); aggregate header (avg rating + rating bar distribution chart); all admin pages redirect non-admin to /dashboard
- **`frontend/components/nav/AppSidebar.tsx`** — added `isAdmin` state; fetches `/api/profile/` once on session load; appends Admin (ShieldCheck icon) nav item when `role === 'admin'`

---

## What Was Done This Session (2026-04-04 — Phase 14: Onboarding Flow)

### Phase 14 — Onboarding Flow

- **`backend/schemas/profile.py`** — added `onboarding_completed: bool | None = None` to `ProfileUpdateRequest`
- **`backend/routers/profile.py`** — added `if body.onboarding_completed is not None:` block in `update_profile`; PATCH now marks onboarding complete in DB
- **`frontend/lib/types.ts`** — added `onboarding_completed?: boolean` to `ProfileUpdatePayload`
- **`frontend/components/onboarding/OnboardingStep.tsx`** *(new)* — reusable step wrapper: progress dots, title, subtitle, body slot, skip/next buttons, loading state, inline error
- **`frontend/components/onboarding/OnboardingModal.tsx`** *(new)* — 5-step modal; z-[80] (above mobile sidebar z-[70]); max-h-[90vh] overflow-y-auto (step 4 tall on small screens); steps:
  1. Welcome — BahasaBot logo + intro text
  2. Native Language — dropdown, skippable
  3. Learning Goal — dropdown, skippable
  4. Sidebar Tour — 5 feature cards (Dashboard, AI Tutor, Courses, Quiz, Settings)
  5. Journey CTA — informational My Journey card; "Get Started" triggers PATCH + onComplete()
- **`frontend/app/(dashboard)/layout.tsx`** — added `OnboardingChecker` sub-component (fires once after session authenticated, `hasChecked` ref prevents re-runs); `showOnboarding` state; stable `useCallback` callbacks; `<OnboardingModal>` conditionally rendered

#### Bugs found and fixed during self-test
- Redundant dot-indicator condition in `OnboardingStep.tsx` (dead code cleaned up)
- Removed `Link to /journey` in step 5 — Phase 20 (My Journey) not yet built; removed the Link import too
- z-index conflict: modal z-50 < mobile sidebar drawer z-[70] → raised to z-[80]
- Step 4 viewport overflow risk on small screens → added `max-h-[90vh] overflow-y-auto` to modal card

---

## What Was Done This Session (2026-04-04 — Phase 13: User Profile + Settings)

### Phase 13 — User Profile Management + Settings Hub

- **`backend/schemas/profile.py`** *(new)* — `ProfileResponse` (all editable + read-only fields), `ProfileUpdateRequest` (name, native_language, learning_goal, profile_picture_url with validators)
- **`backend/routers/profile.py`** *(new)* — 3 endpoints:
  - `GET /api/profile/` — returns full profile via `ProfileResponse`
  - `PATCH /api/profile/` — partial update; only provided fields saved; email/role NOT updateable
  - `POST /api/profile/change-password` — verifies current password, hashes new, Google-account guard, proper error messages
- **`backend/main.py`** — registered `profile.router` at `/api/profile/`
- **`frontend/lib/types.ts`** — added `UserProfile`, `ProfileUpdatePayload`, `ChangePasswordPayload`, `ChangePasswordResponse`
- **`frontend/lib/api.ts`** — added `profileApi` (`getProfile`, `updateProfile`, `changePassword`)
- **`frontend/app/(dashboard)/settings/page.tsx`** *(new)* — settings hub with 3 card links (Profile, Password, About)
- **`frontend/app/(dashboard)/settings/profile/page.tsx`** *(new)* — loads profile on mount, displays avatar/email badge, editable name + native language (dropdown) + learning goal (dropdown), Save button disabled when no changes made, success/error inline feedback
- **`frontend/app/(dashboard)/settings/password/page.tsx`** *(new)* — current + new + confirm password fields with show/hide toggles; Google account guard (shows informational message instead of form); "Forgot password?" link; proper error mapping
- **`frontend/app/(dashboard)/settings/about/page.tsx`** *(new)* — BahasaBot logo, version, institution (USM), developer (Sowan), supervisor (Dr. Tan Tien Ping), academic year, tech stack pills
- **`frontend/components/nav/AppSidebar.tsx`** — added Settings (gear icon) as 5th nav item, pointing to `/settings`

---

## What Was Done This Session (2026-04-04 — Phase 12: Forgot Password)

### Phase 12 — Forgot Password

- **`backend/requirements.txt`** — added `resend==2.6.0`
- **`backend/services/email_service.py`** *(new)* — Resend SDK integration; `send_reset_email(to, token)` runs SDK in `asyncio.to_thread` so it doesn't block event loop; HTML email template with BahasaBot green CTA button; graceful error logging if send fails
- **`backend/schemas/auth.py`** — added `ForgotPasswordRequest`, `ForgotPasswordResponse`, `ResetPasswordRequest`, `ResetPasswordResponse` Pydantic models
- **`backend/routers/auth.py`** — added two endpoints:
  - `POST /api/auth/forgot-password` — generates `secrets.token_urlsafe(32)`, stores SHA-256 hash in `password_reset_tokens` (15-min TTL), sends email; always returns 200 generic message (prevents email enumeration); returns 400 `google_account_no_password` for Google-only accounts
  - `POST /api/auth/reset-password` — hashes incoming token, looks up by hash, validates not used/expired, updates `password_hash`, marks token `used=True`
- **`backend/.env.example`** — added `RESEND_API_KEY` and `RESEND_FROM_EMAIL` entries
- **`frontend/app/(auth)/forgot-password/page.tsx`** *(new)* — email form with animated AuthCard; 3 states: form → success message → Google-account message; "Back to Sign In" link
- **`frontend/app/(auth)/reset-password/page.tsx`** *(new)* — reads `?token=` from URL; new password + confirm fields with show/hide toggles; success state auto-redirects to /login after 3 s; missing-token guard; wrapped in `<Suspense>` for `useSearchParams`

**Pending:** Add `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to `backend/.env` (user handles manually). Login page already had "Forgot password?" link pointing to `/forgot-password` from a prior session.

---

## What Was Done This Session (2026-04-02 — Phase 11: DB Schema Migration)

### Phase 11 — DB Schema Migration

- **Alembic migration** `20260402_1100_phase11_schema.py` — revision `e6f7a8b9c0d1`, chained from `d5e6f7a8b9c0`. Applied successfully via `alembic upgrade head`.
- **New tables:** `learning_roadmaps`, `roadmap_activity_completions`, `notifications`, `password_reset_tokens`, `evaluation_feedback`, `spelling_game_scores`
- **New columns on `users`:** `onboarding_completed`, `native_language`, `learning_goal`, `profile_picture_url`, `role` (default `'user'`), `streak_count` (default `0`), `xp_total` (default `0`)
- **New column on `courses`:** `cover_image_url` (nullable)
- **DB indexes added:** `ix_notifications_user_id`, `ix_learning_roadmaps_user_id`, `ix_password_reset_tokens_token_hash`
- **New ORM model files:**
  - `backend/models/journey.py` — `LearningRoadmap`, `RoadmapActivityCompletion`
  - `backend/models/notification.py` — `Notification`
  - `backend/models/password_reset.py` — `PasswordResetToken`
  - `backend/models/evaluation.py` — `EvaluationFeedback`
  - `backend/models/game.py` — `SpellingGameScore`
- **`backend/models/user.py`** — 7 new mapped columns added
- **`backend/models/course.py`** — `cover_image_url` mapped column added
- **`backend/models/__init__.py`** — now exports all 16 ORM models for Alembic autogenerate
- **Migration fix** `20260318_0002_convert_proficiency_level_to_varchar.py` — added DROP DEFAULT + SET DEFAULT before `DROP TYPE proficiency_level_enum` to clear the dependent server_default; was blocking `alembic upgrade head`

---

## What Was Done This Session (2026-04-02 — Phase 10: BPS Migration)

### BPS Migration — CEFR Labels Fully Retired

- **Alembic migration** `20260402_1000_bps_migration.py` — UPDATEs all stored values in `users.proficiency_level`: A1→BPS-1, A2→BPS-2, B1→BPS-3, B2→BPS-4. Down migration reverses. Run `alembic upgrade head` to apply.
- **`backend/models/user.py`** — Enum changed to `"BPS-1", "BPS-2", "BPS-3", "BPS-4"`; `default` and `server_default` → `"BPS-1"`.
- **`backend/schemas/auth.py`** — `UserResponse.proficiency_level` Literal updated to BPS labels.
- **`backend/schemas/quiz.py`** — Comments updated (CEFR → BPS).
- **`backend/services/quiz_service.py`** — `_calculate_cefr_level()` now returns `"BPS-1"` through `"BPS-4"`; default fallback `"BPS-1"`.
- **`backend/services/progress_service.py`** — Default fallback `"A1"` → `"BPS-1"`.
- **`backend/routers/courses.py`** — Default fallback `"A1"` → `"BPS-1"`.
- **`backend/services/course_service.py`** — Skeleton prompt updated: `BPS-1=beginner … BPS-4=upper-intermediate`.
- **`frontend/lib/types.ts`** — `ProficiencyLevel` type → `"BPS-1" | "BPS-2" | "BPS-3" | "BPS-4"`.
- **`frontend/components/dashboard/BPSProgressBar.tsx`** — New component (replaces CEFRProgressBar); heading "BahasaBot Proficiency Scale (BPS)"; BPS-4 is the max level check.
- **`frontend/app/(dashboard)/dashboard/page.tsx`** — Import swapped to `BPSProgressBar`.
- **`frontend/app/(dashboard)/quiz/adaptive/page.tsx`** — `CEFR_LABEL`/`CEFR_COLOR` renamed to `BPS_LABEL`/`BPS_COLOR` with BPS keys; user-facing text updated.

---

## What Was Done This Session (2026-04-02 — Quiz/Course/LangChain + Cleanup)

### Chatbot Prompt — Dialect Rule Hardened
- Added explicit `CRITICAL — DIALECT RULE` block to `CHATBOT_SYSTEM_PROMPT` in `langchain_service.py`.
- Lists Malaysian-vs-Indonesian vocabulary examples inline: kosong/nol, kereta/mobil, bas/bis, etc.
- Vocabulary format rule updated: every new word must include IPA + English "sounds like" approximation + closest Malaysian synonyms.
- **File:** `backend/services/langchain_service.py`

### Quiz Prompts — English-Medium Language Rules Added
- Both `generate_module_quiz` and `generate_adaptive_quiz` now have a `LANGUAGE RULES` block at the top.
- Question text and explanations must be in English; Malay words/answers use Malaysian BM only.
- IPA rule added: vocabulary explanations must include IPA, e.g. `'Makanan' /ma.ka.nan/ means food.`
- **File:** `backend/services/quiz_service.py`

### Course Prompts — English-Medium Overhaul
- Skeleton prompt: all titles/descriptions/objectives must be in English; concrete counter-examples added.
- `content_system` + `content_prompt`: rewritten to explicitly say "ENGLISH-medium" with Malaysian BM for Malay words only.
- `structured_prompt`: full IPA/syllables/synonyms spec preserved and reinforced with Malaysian BM examples.
- **File:** `backend/services/course_service.py`

### Courses Router — `complete_class` Error Handling
- Wrapped `mark_class_complete()` in try/except in `courses.py`.
- Unhandled DB exceptions now return a clean `HTTP 500` with a user-friendly message instead of crashing silently.
- **File:** `backend/routers/courses.py`

### Cleanup
- Removed `ecosystem.config.js` (PM2 config) and `botanical-garden.md` (debug/test file) from project root.
- `start-bahasabot.bat` launcher retained for local dev.

---

## What Was Done Previous Session (2026-04-01 — Chatbot UI: Markdown + Session + Avatar)

### Chatbot — react-markdown Rendering
- `ChatMessage.tsx` rewritten: bot responses now render with `react-markdown` (bold, lists, inline code, blockquotes).
- `**word** = meaning` vocab patterns are extracted BEFORE markdown parsing → rendered as interactive `VocabPill` components (hover shows translation).
- Bot bubble: `max-w-2xl`, user bubble: `max-w-sm`. Redundant "You" avatar removed.
- **File:** `frontend/components/chatbot/ChatMessage.tsx`

### Chatbot — Session Persistence
- Messages + `sessionId` persisted in `sessionStorage` — chat history survives page navigation without re-fetch.
- **File:** `frontend/app/(dashboard)/chatbot/page.tsx` (and formerly `frontend/app/chatbot/page.tsx`)

### Chatbot — Malaysia Flag Avatar
- Bot avatar changed from "BB" initials circle → Malaysia flag PNG.
- **File:** `frontend/public/malaysia-flag.png` (added), `ChatMessage.tsx`

---

## What Was Done Previous Session (2026-04-01 — Logo, Back Buttons, Auto-Logout, Chatbot Fix)

### Project Logo Integration
- Sidebar (collapsed + expanded), mobile header/drawer, chatbot header: all updated to use `Project Logo.png`.
- **Files:** `frontend/components/nav/AppSidebar.tsx`, `frontend/app/(dashboard)/chatbot/page.tsx`

### Back Buttons on Course Pages
- Consistent `← Back` button added to: Course detail, Module detail, Class/Lesson page, Module Quiz page.
- **Files:** all 4 course page files

### Auto-Logout on Session Expiry
- `SessionProvider` polls every 60 s + re-checks on tab focus.
- `SessionWatcher` component watches `status` + `session.error`; auto-calls `signOut()` when session expires.
- **Files:** `frontend/components/providers.tsx`, `frontend/app/(dashboard)/layout.tsx`

### Chatbot System Prompt Fix
- `system_instruction` kwarg to `ChatGoogleGenerativeAI` is silently ignored by current `langchain-google-genai`.
- Fix: pass system prompt as `SystemMessage` at front of messages list.
- **File:** `backend/services/gemini_service.py`

### Session Expiry
- Changed from 3 min (test) → 30 minutes.
- `ACCESS_TOKEN_EXPIRE_MINUTES=30`, `ACCESS_TOKEN_TTL_MS` = 29 min, NextAuth `maxAge` = 30 min.
- **Files:** `backend/.env`, `frontend/lib/auth.ts`

### Vocabulary Dedup + Delete
- Case-insensitive dedup check before inserting vocab (both chatbot + course completion paths).
- `DELETE /api/dashboard/vocabulary` endpoint with checkbox UI in `VocabularyTable.tsx`.
- **Files:** `langchain_service.py`, `course_service.py`, `backend/routers/dashboard.py`, `frontend/components/dashboard/VocabularyTable.tsx`, `frontend/app/(dashboard)/dashboard/page.tsx`, `frontend/lib/api.ts`

---

## What Was Done Previous Session (2026-03-24 — UI Polish: Colors + Typography)

### Color Distribution (Botanical Palette)
- StatsCards: 6 distinct icon colors (Marigold, Green, Blue, Purple, Terracotta).
- CEFRProgressBar: completed bars → `bg-accent` (Marigold gold).
- QuizHistoryTable: Passed badge → amber/Marigold.
- VocabularyTable: source badges 3-way (chatbot=blue, quiz=amber, course=orange).
- VocabularyHighlight: vocab pills → Marigold theme tokens.
- WeakPointsChart: high-strength bar → `#f9a620` (Marigold).

### Typography Overhaul
- Font: Lora (serif) → **Space Grotesk** (geometric sans) as heading font. Inter stays as body.
- `globals.css`: font smoothing, `font-feature-settings`, h1–h6 `tracking-tight` from base layer.
- All major pages updated: StatsCards, Dashboard, Chatbot, ChatMessage, Courses, Course detail, Module detail, Class page, Adaptive Quiz, CEFRProgressBar, AppSidebar.

---

## What Was Done Previous Session (2026-03-20 — UI Overhaul: Dark Mode + Animated Auth)

- Dark mode: class-based Tailwind, `ThemeContext`, no-FOUC inline script, `localStorage` persistence.
- ThemeToggle pill: Moon/Sun sliding pill in sidebar footer.
- Auth page redesign: Three.js GLSL shader background, framer-motion 3D tilt, traveling border beam, glass card.
- GlowingEffect dashboard cards: mouse-following conic gradient border.
- Chatbot dark mode fix: Waves background reactive to theme.
- New packages: `motion`, `simplex-noise`.

---

## What Was Done Previous Session (Rate Limiter Fix + Comprehensive Testing)

### Rate Limiter Redis Fallback Fix
- Redis Cloud free tier timeout caused `TimeoutError` → 500s on chatbot endpoint.
- Fix: probe Redis with 3-second ping before creating `Limiter`; fall back to in-memory if it fails.
- **File:** `backend/middleware/rate_limiter.py`

### Test Results Summary (all pass)
- RAG Corpus Re-seed ✅ | Course Generation ✅ | Malaysian Malay ✅ | IPA in vocab ✅
- Mark Complete (all 9 classes across 3 modules) ✅ | Module locking logic ✅
- Module Quiz GET+Submit ✅ | Standalone Quiz GET+Submit ✅ | CEFR Recalculation ✅
- Weak Points ✅ | Dashboard all 6 endpoints ✅ | Vocab delete ✅
- Auth GET /me ✅ | Chatbot sessions + history ✅ | Rate limiter fallback ✅

---

## What Was Done Previous Session (English-Medium Course + Quiz Fix)

### Root Cause
All three Gemini prompts in `course_service.py` said "Use Malaysian Bahasa Melayu throughout" without distinguishing instruction language (English) from vocabulary being taught (Malaysian BM).

### Fixes
- `course_service.py`: skeleton prompt + content_system + content_prompt updated.
- `quiz_service.py`: both quiz generators updated.
- `langchain_service.py`: already correct — had English-first rule.

---

## What Was Done Previous Session (Course Reliability, Mark Complete Fix, Malaysian Malay + IPA)

### Course Generation — True Never-Abort
- Second `try/except` around retry in `_generate_class_with_retry` → returns minimal fallback if both attempts fail. Course always saves completely.

### Mark Complete — Root Cause Fixed
- `item.get("word", "")` failed on `null` and integer values (number-themed courses). Fixed with `str(item.get("word") or "").strip()[:250]`.
- Split DB commit: `UserProgress` committed first in own transaction; vocab save in separate `try/except`.
- Variable shadowing fixed: inner `existing` → `dedup_check`.

### Chatbot + Quiz — Malaysian Malay + IPA
- `CHATBOT_SYSTEM_PROMPT`: Malaysian BM requirement + IPA format for every new word.
- Both quiz prompts: Malaysian BM + IPA in explanations.
- `malay_corpus.py`: 4 new IPA pronunciation chunks added.

---

## Current Model Config
| Variable | Value |
|---|---|
| `GEMINI_MODEL` | `gemini-2.5-flash` |
| `CHATBOT_GEMINI_MODEL` | `gemini-2.5-flash` |
| `EMBEDDING_MODEL` | `models/gemini-embedding-001` |

---

## Next Priority
1. **Phase 20 — My Journey (Learning Roadmap)** — next major unbuilt feature.
2. **Module Quiz Results Page** — `quiz/module/[moduleId]/results/page.tsx` still a TODO stub.
3. **Deploy** — push backend to Railway, frontend to Vercel, set all env vars, final smoke test.

---

## What Was Done This Session (2026-04-08 — UI/UX Overhaul)

### Auth Pages — Split-screen layout
- **`frontend/components/ui/auth-card.tsx`** — full rewrite: split-screen layout with `ShaderAnimation` filling entire background; LEFT panel (lg+) has dark gradient overlay + box logo 64px + CSS "BahasaBot" heading + subtitle + feature bullet list + tagline; RIGHT panel is `w-[460px]` `bg-black/50 backdrop-blur-2xl border-l border-white/[0.07]` glass surface; mobile shows compact brand bar + full-width form
- **`frontend/app/(auth)/login/page.tsx`** — header simplified to "Welcome back" h2 + subtitle only (branding on left panel); `storeSession()` retry: 600ms retry on NextAuth CSRF race condition; custom themed Google button using ref-click relay over hidden `<GoogleLogin>`; `useRef` added for googleBtnRef
- **`frontend/app/(auth)/register/page.tsx`** — same header + Google button pattern as login; `useRef` added
- **`frontend/app/(auth)/forgot-password/page.tsx`** — box logo replaces wide SVG in 56×56 context
- **`frontend/app/(auth)/reset-password/page.tsx`** — box logo replaces wide SVG in 56×56 context

### Dark Palette — Unified depth hierarchy
- **`frontend/app/globals.css`** — complete dark mode CSS var overhaul:
  - `--background: #25221a` (was `#3a3529`)
  - `--card: #2e2b22` (was `#413c33`)
  - `--muted: #363228`, `--border: #3d3a2e`, `--input: #3d3a2e`
  - `--sidebar: #1c1a13` (was `#3a3529` = same as background, now distinct)
  - Browser autofill override: `-webkit-box-shadow: 0 0 0 1000px rgba(0,0,0,0.35) inset !important`

### Logo — Box logo for all icon contexts
- `frontend/public/Logo new only box (1).svg` (886×872 square) used in: collapsed sidebar, chatbot header, login/register redirecting overlay, forgot/reset password, favicon
- Wide horizontal logo `Logo new (1).svg` kept for: sidebar expanded, mobile drawer, onboarding, about page, chatbot EmptyState
- **`frontend/app/layout.tsx`** — favicon updated to box logo SVG

### Sidebar
- **`frontend/components/nav/AppSidebar.tsx`** — `bg-card` → `bg-sidebar` on both desktop aside + mobile drawer; collapsed logo uses box logo directly (no scale hack); nav icon color `text-sidebar-foreground/60` hover `text-sidebar-foreground` for better legibility on dark sidebar

### Shader
- **`frontend/components/ui/shader-animation.tsx`** — color multipliers reduced (`×0.7`, `×0.5`, `×0.6`, `×0.15`) to prevent overexposure; background color `#14120a`

### Chatbot
- **`frontend/app/(dashboard)/chatbot/page.tsx`** — Waves `backgroundColor` `#3a3529` → `#25221a`

### Spelling Game
- **`frontend/components/games/SpellingGame.tsx`** — Exit button added to countdown, timeout, and main game phases; calls `resetSession()` which skips `endSession()` so stats not saved on exit; `X` icon imported from lucide-react

### Dashboard tiles
- **`frontend/components/dashboard/WeakPointsChart.tsx`** — removed recharts; pure CSS rows with type badge + topic + h-1.5 progress bar + score% + status label; summary pills; CTA link
- **`frontend/components/dashboard/QuizHistoryTable.tsx`** — summary row with trend icon + avg score + pass rate; score ring; type badge + pass/fail; loading skeleton

### Quiz
- **`frontend/app/(dashboard)/quiz/adaptive/page.tsx`** — `QuizGeneratingLoader` component: 4-step animated progress screen with pulsing brain icon, step indicators, spinning arc border
