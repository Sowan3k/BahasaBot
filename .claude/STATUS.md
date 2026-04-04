# BahasaBot — Project Status
_Update this file at the end of every session_

## Last Updated: 2026-04-05 (Phase 15 — Admin Control Panel)

## Feature Status
| Feature | Status | Notes |
|---|---|---|
| Auth | ✅ Complete + Verified | Email + Google OAuth, JWT, token refresh, 30-min sessions |
| AI Chatbot Tutor | ✅ Complete + Verified | SSE streaming, LangChain, RAG — Malaysian Malay + IPA in prompt; markdown rendering; session persistence; native_language injected into system prompt |
| Course Generator | ✅ Complete + English-medium fix | Lesson content in English; Malay words taught inline; Malaysian BM only |
| Quiz | ✅ Complete + English-medium fix | Question text explicitly English; Malay vocabulary uses Malaysian BM; IPA in explanations |
| Dashboard | ✅ Complete + Vocab Delete | All 6 endpoints verified — vocab/grammar/progress/weak-points/quiz-history |
| Production Hardening | ✅ Complete + Rate Limiter Fix | Rate limiter falls back to in-memory on Redis timeout (no more 500s) |
| IPA Pronunciation | ✅ Full stack verified | Courses: IPA in all vocab items. Chatbot: /ko.soŋ/, /tə.ri.ma ka.sɪh/. Quiz: IPA in explanations |
| Chatbot UI | ✅ Complete | react-markdown rendering, VocabPill extraction, Malaysia flag avatar, session persistence in sessionStorage |
| Dark Mode | ✅ Complete | Class-based Tailwind dark mode, ThemeToggle pill in sidebar, no-FOUC inline script |
| UI Polish | ✅ Complete | Space Grotesk font, botanical color palette, glowing dashboard cards, animated auth pages |
| Local Dev Launcher | ✅ Complete | `start-bahasabot.bat` launches both frontend + backend; PM2 config removed from root |
| Background Course Generation | ✅ Complete | Non-blocking modal; floating progress card; BackgroundTasks + Redis job state; React Query polling |
| BPS Migration | ✅ Complete | CEFR labels fully retired; BPS-1/2/3/4 across DB, backend, frontend; Alembic migration written |
| DB Schema (Phase 11) | ✅ Complete + Applied | 6 new tables + 8 new columns; ORM models written; migration applied successfully |
| Forgot Password (Phase 12) | ✅ Complete | Resend email, token hashing, 15-min TTL; Google account guard; 2 frontend pages |
| User Profile + Settings (Phase 13) | ✅ Complete | GET + PATCH /api/profile/, change-password endpoint; /settings hub + /profile + /password + /about pages; Settings in sidebar |
| Onboarding Flow (Phase 14) | ✅ Complete | 5-step modal (Welcome → NativeLang → Goal → Tour → Journey CTA); triggered on first login via layout.tsx; PATCH /api/profile/ with onboarding_completed=true on finish |
| Admin Control Panel (Phase 15) | ✅ Complete | /api/admin/* with require_admin guard (403); stats, users, feedback endpoints; ADMIN_EMAIL auto-seeds admin role on register; 3 frontend pages + conditional sidebar link |

## Missing / Broken
- `frontend/app/(dashboard)/quiz/module/[moduleId]/results/page.tsx` — **stub only** (returns `<div>Module Quiz Results — TODO</div>`). Score + per-question breakdown + Continue/Retry button not yet implemented.
- `frontend/app/(dashboard)/quiz/adaptive/results/page.tsx` — redirects back to `/quiz/adaptive` (inline results used instead). Deep-link works but no standalone results page.

## Known Pre-existing Issue (not caused by recent changes)
- Module quiz cache-vs-submission misalignment: if a quiz attempt fails (0%) the cache clears and Gemini regenerates new questions. If the user re-submits using answers from the *first* GET, they score 0% again. Mitigation: frontend should re-fetch GET before showing quiz form if previous submission failed. This is a UI flow issue, not a backend bug.

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
1. **Phase 16 — Pronunciation Audio** — `usePronunciation.ts` hook + `SpeakerButton.tsx`, wired into vocab pills, course class pages, quiz explanations, dashboard vocab table.
2. **Module Quiz Results Page** — implement `quiz/module/[moduleId]/results/page.tsx` (still a TODO stub).
3. **Deploy** — push backend to Railway, frontend to Vercel, set all env vars, final smoke test.
