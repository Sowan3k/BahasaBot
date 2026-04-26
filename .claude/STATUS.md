# BahasaBot — Project Status
_Update this file at the end of every session_

## Last Updated: 2026-04-27 (Session 61 — Chatbot mobile vocab tooltip + assistant bubble fix)

## Feature Status
| Feature | Status | Notes |
|---|---|---|
| Auth | ✅ Complete + Google password setup | Email + Google OAuth, JWT, token refresh, 30-min sessions; mandatory SetPasswordModal for Google users with NULL password_hash; POST /api/auth/set-password; has_password in profile API; settings/password page now routes to SetPassword vs ChangePassword form based on has_password |
| AI Chatbot Tutor | ✅ Complete + App-awareness (Session 40) + Language rule (Session 51) + Latency optimizations (Session 59) | SSE streaming, LangChain, RAG — Malaysian Malay + IPA in prompt; markdown rendering; session persistence; native_language injected into system prompt; RAG context Redis-cached (5 min) saving ~1.3s on repeat queries; ping SSE event for early frontend feedback; **ThinkingIndicator**: 3 bouncing dots + "Thinking…" label replaces the invisible 2px audio bars — shows immediately when user sends message; user profile Redis-cached (5 min TTL, invalidated on PATCH /profile); history cache updated in-place after each message (no more DB re-read on next turn); gamification XP awarded as asyncio.create_task with own session (no longer blocks SSE startup); GET /api/chatbot/prewarm warms profile cache on page load; ChatMessage wrapped in React.memo (previous messages never re-render during streaming); token batching via requestAnimationFrame (cuts setState calls from ~100/s to ≤60/s during streaming); **language detection rule**: if student writes in English → full English response; if Malay → full Malay; if mixed → English (overrides all other rules); dialect rule demoted to secondary; **Session 59 latency**: three Redis cache_get calls now run via asyncio.gather() (parallel) before any DB fallback — saves ~10–15ms per message on warm paths; RAG k reduced 5→3 (faster embedding query + smaller context fed to Gemini) |
| Course Generator | ✅ Complete + English-medium fix | Lesson content in English; Malay words taught inline; Malaysian BM only |
| Quiz | ✅ Complete + English-medium fix | Question text explicitly English; Malay vocabulary uses Malaysian BM; IPA in explanations |
| Dashboard | ✅ Complete + Wave background + Mobile fix (Session 53) | All 6 endpoints verified; Overview tab completely redesigned: 3 SVG progress rings (Learning/Vocabulary/Quiz) with GlowCard hover, BPS slim strip, inline stats row (emoji), glowing pill Quick Actions, compact VocabPreview (no search bar, 5 rows, SpeakerButton), Weak Points + Quiz History in GlowCards; mobile-responsive (rings stay 3-col, wrap gracefully); StatsCards removed from overview; `DashboardWaveBackground` canvas component: slow sine-wave animation at ¼ resolution, dark-mode-only, faint olive tint at peaks, fixed full-screen z-0, content at z-10; Session 53: `overflow-x-hidden` masking removed from layout.tsx + dashboard container; stat grid corrected to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` so tiles fit at all mobile widths without horizontal scroll |
| Production Hardening | ✅ Complete + Rate Limiter Fix | Rate limiter falls back to in-memory on Redis timeout (no more 500s) |
| IPA Pronunciation | ✅ Full stack verified | Courses: IPA in all vocab items. Chatbot: /ko.soŋ/, /tə.ri.ma ka.sɪh/. Quiz: IPA in explanations |
| Chatbot UI | ✅ Complete + Full redesign + UX polish (Session 52) + Mobile vocab fix (Session 61) | react-markdown rendering, VocabPill extraction, Malaysia flag avatar; header: backdrop-blur + live green status pulse dot + Plus icon on "New chat"; input footer: backdrop-blur + top shadow + decorative glow line + border-primary textarea + send button `bg-foreground text-background` with audio-visualizer bars while streaming; EmptyState: ambient logo glow + decorative side lines on title + starter buttons with `›` prefix arrow; error: styled bordered card; message bubbles: user → `bg-primary/25 backdrop-blur` with right gradient accent line; bot → `bg-card/55 backdrop-blur-md` with left gradient accent line; chatbot markdown inline Malay words now use a real tap/hover tooltip instead of browser `title`, fixing mobile translation visibility and preserving inline alignment |
| Dark Mode | ✅ Complete + Repositioned | ThemeToggle moved to top-right of sidebar header row (industry standard); icon variant added for collapsed/mobile |
| UI Polish | ✅ Complete | Space Grotesk font, botanical color palette, glowing dashboard cards, animated auth pages |
| Local Dev Launcher | ✅ Complete | `start-bahasabot.bat` launches both frontend + backend; PM2 config removed from root |
| Background Course Generation | ✅ Complete + Animation upgrade (Session 60) | Non-blocking modal; floating progress card; BackgroundTasks + Redis job state; React Query polling; Desktop: spinning pinwheel (botanical palette, overflow-clipped flower, no stick); Mobile: compact 220px bottom-center pill with domino-falling bars — non-blocking |
| BPS Migration | ✅ Complete | CEFR labels fully retired; BPS-1/2/3/4 across DB, backend, frontend; Alembic migration written |
| DB Schema (Phase 11) | ✅ Complete + Applied | 6 new tables + 8 new columns; ORM models written; migration applied successfully |
| Forgot Password (Phase 12) | ✅ Rebuilt — 6-digit code flow | 3-endpoint backend (forgot/verify/reset); 4-step frontend (email→code→password→success); OTP boxes + resend cooldown; old link page deprecated; full E2E verified |
| User Profile + Settings (Phase 13) | ✅ Complete | GET + PATCH /api/profile/, change-password endpoint; /settings hub + /profile + /password + /about pages; Settings in sidebar |
| Onboarding Flow (Phase 14) | ✅ Complete + Enhanced (Session 26) | 8-step questionnaire (Welcome → Gender/Age → NativeLang → WhyLearning → CurrentLevel → Goal → Timeline → DailyStudy); gender + age_range collected for personalised roadmap banner; roadmap auto-generated on finish; loading screen during generation; sonner toast on roadmap_ready; skip at any step saves partial data |
| First-Login UI Tour | ✅ Complete + Race-fix + Dark theme (Session 30) | driver.js spotlight tour; 8 steps covering sidebar + all nav sections; triggers once after onboarding; has_seen_tour flag on users table; PATCH saves flag on tour done/skip. Race condition fixed: `active={showTour && !showOnboarding}`. Popover fully re-themed: dark card #2e2b22, warm text, olive-green Next button, ghost Back button, matching arrow — replaces default white popover |
| Admin Control Panel (Phase 15) | ✅ Complete + Evaluation enhancements (Session 54) + Phase 2 (Session 55) + Bug fixes (Session 57) | /api/admin/* fully tested; stats, users (search + detail + delete + reset + analytics), feedback; password guards verified; recharts LineChart + BarChart confirmed working; analytics bug fixed (NullType → timedelta); CSV export endpoints (users/quiz-attempts/feedback with optional date range); last_active column on user list; date range filter; avg quiz score pills + score trajectory LineChart; feedback label fix. Session 55: total_time_spent (with coverage caveat), total_chat_messages, avg_msgs_per_session on user detail; GET /api/admin/users/{id}/quiz-attempts (raw Q&A with correct/incorrect indicators, collapsible section); GET /api/admin/analytics/score-distribution (cohort histogram + mean/median, date filter); GET /api/admin/analytics/weak-points (top 20 topics by user count, sortable table, date filter). Session 57 bugs fixed: weak-points endpoint crashed with SQL error (func.Float is not a valid SQLAlchemy type; replaced with Python-side round()); score distribution + weak points panels now show distinct red error message vs italic "no data" empty state; token_usage_logs was always empty because log_tokens() was never called — now wired: generate_json_with_usage() added to gemini_service; module_quiz + standalone_quiz + course skeleton generation all call log_tokens() so per-user token charts in admin/users/{id} populate correctly |
| Pronunciation Audio (Phase 16) | ✅ Complete + Debugged + Mobile tap fix (Session 56) + Overflow fix (Session 58) | usePronunciation hook (ms-MY → ms → default fallback); SpeakerButton component; wired into VocabPills (chatbot), course class vocab cards, quiz results breakdown, dashboard vocabulary table; 3 post-implementation bugs fixed; VocabPill now opens on tap (mobile) and closes on outside-tap — previously hover-only, broken on touchscreens; Session 58: tooltip now position:fixed (was position:absolute — clipped by overflow-y-auto on chatbot main container); synthetic mouseleave guard added (onTouchStart records timestamp; scheduleClose skipped within 500ms of a touch) |
| Notification System (Phase 17) | ✅ Complete | GET /api/notifications/ (last 20 + unread_count), POST mark-read, POST read-all; NotificationBell (60s polling, unread badge) + NotificationPanel; floating global icon in layout.tsx |
| Gamification — Streak + XP (Phase 18) | ✅ Complete | record_learning_activity() in gamification_service.py; Redis-keyed daily streak; XP awards: class=10, quiz pass=25, chatbot session=5; milestone notifications (streak 3/7/14/30, every 100 XP); wired into 4 routers (courses, quiz, chatbot); StreakBadge + XPBar components; dashboard +2 stat cards; sidebar footer shows streak+XP |
| Sidebar Polish | ✅ Complete | Double divider removed (no border-b on logo area); ThemeToggle repositioned to header row; footer items centered except XP bar; collapsed tooltips use theme-aware bg-popover |
| My Journey — Learning Roadmap (Phase 20) | ✅ Complete (v2 + patches + Session 16 fixes) | New user_roadmaps table; flat course-obstacle model; 3-question modal; road/path UI; overdue+extend; BPS upgrade banner; identity-verified delete; check_roadmap_progress hook; admin journeys page. Phase 20 fully complete including all 7 post-implementation patches + Session 16: obstacle → existing course navigation fixed (get_roadmap enriches elements with exists/course_id via fuzzy match); obstacle completion fix (check_roadmap_progress now uses course.topic for better fuzzy match); journey cache invalidated on new course save. |
| Chat History Page (Phase 21) | ✅ Complete + Session Delete | /chatbot/history; ChatHistoryList (paginated, title from first user msg, message count); session detail read-only view; History button in chatbot header; backend ChatSessionResponse extended with title + message_count; DELETE /api/chatbot/sessions/{id} (ownership-verified, cascade messages, preserves vocab/grammar); Trash2 icon + inline confirm strip per row; error banner with 4s auto-dismiss |
| Image Generation — Nano Banana 2 (Phase 22) | ✅ Complete + Personalised banners + Cover endpoint (Session 36) + Streak milestone cards | image_service.py uses Gemini REST API via httpx; list endpoint returns has_cover bool (no blob); GET /api/courses/{id}/cover serves raw bytes with Cache-Control: immutable (browser caches permanently); course detail page hero banner; journey banners use gender + age_range for personalised subject prompt. generate_streak_milestone_card() added to image_service.py; _generate_and_save_streak_milestone_card() background task added to gamification_service.py — streak_milestone notifications now include image_url, matching the BPS milestone card pattern in quiz_service.py. |
| Course Deduplication + Clone System (Phase 24) | ✅ Complete | topic_slug + is_template + cloned_from columns on courses; Alembic migration applied; _make_topic_slug(), _find_template(), _clone_course() in course_service.py; generate_course() checks for template before calling Gemini — clone path completes in milliseconds; frontend/router unchanged |
| Spelling Practice Game (Phase 19) | ✅ Complete + v2 redesign | Leitner-box word selection; Levenshtein fuzzy matching; Start screen → 3-2-1 countdown → 10s per-word timer (green→yellow→red pulse) → Time's Up screen with Next/Start Over; combo multiplier; session summary; keyboard shortcuts (Enter/Space/Escape); personal best; Games link in sidebar |
| Chatbot vocab pipeline fix | ✅ Fixed | _extract_and_save() now opens its own AsyncSessionLocal session — asyncio.create_task with request-scoped session was silently failing after SSE stream ended; vocab/grammar now reliably saved after every chatbot response |
| Frontend Performance Optimizations | ✅ Complete | Session cache in api.ts (60s TTL, eliminates /api/auth/session round-trip on every API call); profile fetch deduplication via shared useQuery(['profile']) key in AppSidebar + OnboardingChecker; login router.refresh() race condition removed; redirect loading overlay added |
| Performance + Animations (Session 14) | ✅ Complete | Admin stats Redis cache (2min TTL, key: admin:stats); admin page parallel Promise.allSettled replacing sequential waterfall; PageTransition component (fade+slide, 0.3s) wired into layout keyed by pathname; journey obstacle stagger (0.08s between nodes); course card stagger + whileHover scale 1.02 |
| UI Overhaul (2026-04-08) | ✅ Complete | Split-screen auth (branding left, glass form right); unified dark olive palette (#25221a bg, #1c1a13 sidebar, #2e2b22 card); box logo across all icon contexts; autofill CSS fix; quiz generating loader; WeakPoints + QuizHistory tile redesign; spelling game exit button; chatbot Waves color fix; sidebar bg-sidebar token; custom themed Google button (hides iframe, uses ref click); shader intensity reduced; left panel gradient overlay; storeSession() CSRF retry |
| Evaluation Feedback (Section 5.20) | ✅ Complete | POST /api/evaluation/feedback; backend/schemas/evaluation.py + backend/routers/evaluation.py; FeedbackModal component (3-question survey: star rating, Yes/No/Somewhat, optional textarea); wired into adaptive quiz (3s delay) and module quiz results page; feedbackApi in api.ts; FeedbackPayload + FeedbackSubmitResponse types added |
| Module Quiz Results Page | ✅ Complete | Full results page replacing TODO stub; sessionStorage data-passing pattern (quiz page stores result before redirect); SVG circular score ring; Pass/Fail state with Module Unlocked banner; Continue to Next Module button (fetches course structure via React Query to resolve next module's first class); Retry Quiz + Review Module on fail; per-question breakdown with SpeakerButton on wrong answers; FeedbackModal wired in |
| XP / Streak Display (Session 18) | ✅ Fixed | Dashboard refetches on window focus/visibilitychange (30s throttle); sidebar profile staleTime 60→30s + refetchOnWindowFocus; bps_milestone added to notification title map + TrendingUp icon |
| User Feedback — Settings (Session 18) | ✅ Complete | /settings/feedback page (star rating + relevance + textarea → POST /api/evaluation/feedback quiz_type="general"); backend schema extended to accept "general"; admin feedback page shows "General" badge; admin main page label updated to "User Feedback" |
| Notification Bell UX (Session 18) | ✅ Relocated + Clear-all | Bell moved from floating fixed overlay into AppSidebar: mobile header (opens left/downward), desktop expanded footer next to username (opens right/upward), desktop collapsed footer (opens right/upward); DELETE /api/notifications/ backend endpoint; "Clear all" button in panel header; panelSide + panelDirection props added to NotificationPopover |
| Mobile Layout Fixes (Session 24) | ✅ Complete | Dashboard: StatsCards grid gap-2→sm:gap-4, reduced card padding/icon/font sizes on mobile (no overflow at 375px); h1 text-2xl on mobile; subtitle breaks correctly; tabs px tightened. Journey: outer container px-3 pt-4; ObstacleNode always flex-row on mobile (zigzag only on sm+); topic title line-clamp-2 instead of truncate; card min-w-0; progress card p-3 on mobile; deadline row flex-wrap + break-words; header min-w-0 + flex-1. Both pages verified zero horizontal overflow at 375px. |
| Mandatory Google password setup (Session 33) | ✅ Complete | POST /api/auth/set-password; SetPasswordRequest + SetPasswordResponse schemas; requires_password_setup in TokenResponse; has_password property on User model + ProfileResponse; SetPasswordModal (non-dismissible, z-[90]); login + register pages show modal when flag true; settings/password page routes to SetPasswordForm vs ChangePasswordForm based on has_password; change-password guard updated to check password_hash IS NULL only |
| Adaptive Quiz Results Page | ✅ Complete | Dedicated /quiz/adaptive/results page; sessionStorage data-passing (quiz page stores result then router.push); score ring (green/amber/red by score); BPS level update banner with TrendingUp; per-question breakdown with SpeakerButton on wrong answers; FeedbackModal after 3s delay; Take Another Quiz invalidates cache + navigates to lobby; inline results block removed from quiz page |

| User Profile + Settings (Phase 13) | ✅ Complete + Debugged (Session 45) | native_language fixed: switched from `<select>` to free-text `<input list="...">` with datalist — now shows any DB value regardless of format; learning_goal fixed: switched from `<select>` (predefined options that don't match Journey free-text goal) to `<textarea>` with 500-char counter; form rewritten with controlled inputs + useRef origin tracking (no react-hook-form/reset timing issues); Delete Account: POST /api/profile/delete-account (bcrypt verify for email accounts, email match for Google); frontend DeleteAccountModal with danger zone card; signs user out + redirects to /login after deletion; About page: Developer name updated to "Noor Mohammad Sowan" |
| Daily Language Tips | ✅ Complete + Random-per-login + visibility fix (Session 50) | tips table + Alembic migration; GET /api/tips/random (public, no cache - returns a fresh random tip on every call so each login sees a different tip); POST /api/tips/generate (admin, Gemini, 4 categories); GET /api/tips/all (admin, paginated+filterable); PATCH /api/tips/{id} (toggle active); TipToast component (framer-motion slide-in, 8s auto-dismiss, shrinking progress bar, pretty dark+light); wired into dashboard; login/register now clear `tip_dismissed` so a fresh sign-in can show a tip again; TipToast z-index raised above onboarding; Language Tips panel in admin (All Tips tab + Generate New tab with category tiles + range slider) |
| Weekly XP Leaderboard | ✅ Complete + Visual Redesign (Session 48) | New xp_logs table (Alembic migration c1d2e3f4a5b6); XPLog ORM model; record_learning_activity() now inserts into xp_logs on every XP award; GET /api/dashboard/leaderboard (top-10 by weekly XP, current-user rank, Redis-cached 5 min, week resets Monday); LeaderboardCard fully redesigned: animated framer-motion podium (2nd–1st–3rd) for top 3; animated XP progress bars for ranks 4–10 (relative to leader's XP); days-until-Monday-reset countdown chip; empty/loading/outside-top-10 states; tsc --noEmit: 0 errors |
| Page-refresh Bug Fix | ✅ Fixed (Session 48) | Global React Query staleTime reduced from 5 min → 0 (stale-while-revalidate: data shown instantly from cache while background refetch runs); after class completion now also invalidates ["courses"] and ["dashboard"] queries (previously only ["course", courseId] was invalidated); after module quiz submission also invalidates ["courses"] and ["dashboard"]; AppSidebar profile staleTime lowered 5 min → 60s to match layout (keeps XP/streak display fresh) |

## Missing / Broken
*(no known missing items)*

## ⚠️ Manual Action Required (Google OAuth Production)
- Add the production Vercel URL to **Authorized JavaScript origins** in Google Cloud Console (OAuth Client → your client ID)
- Add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to Vercel environment variables (must match `backend/.env` `GOOGLE_CLIENT_ID`)
- Redeploy after adding the Vercel env var — it is not hot-reloaded

## Known Pre-existing Issue (not caused by recent changes)
- Module quiz cache-vs-submission misalignment: if a quiz attempt fails (0%) the cache clears and Gemini regenerates new questions. If the user re-submits using answers from the *first* GET, they score 0% again. Mitigation: frontend should re-fetch GET before showing quiz form if previous submission failed. This is a UI flow issue, not a backend bug.

## ✅ Fixed Issues (Session 10)
- **Login broken (2026-04-13):** `fuzzywuzzy` and `python-Levenshtein` were in `requirements.txt` but not installed in the venv. `journey_service.py` imports `fuzzywuzzy`, so backend crashed on startup — port 8000 never opened, all API calls returned "connection refused". Fix: `pip install fuzzywuzzy==0.18.0 python-Levenshtein==0.25.1` (packages confirmed installed via `pip check`).
- **Gemini image model name (2026-04-13):** `backend/.env` and `image_service.py` fallback had old model `gemini-2.0-flash-preview-image-generation`. That model is **deprecated and shuts down June 1, 2026**. Correct model is `gemini-3.1-flash-image-preview` (released Feb 26, 2026 — matches CLAUDE.md and .env.example). Updated: `backend/.env`, `image_service.py` default + docstring.

## ✅ Fixed Issues (Session 13)
- **Course covers not appearing (2026-04-13):** Session 12 correctly fixed `image_service.py` (httpx REST API) and `course_service.py` (retroactive healing + `asyncio.create_task`), but the backend was **never restarted** after those changes were made. Uvicorn started at 08:19, files modified at 14:22–14:28 — old broken code was still running. Fix: killed old uvicorn PIDs (18316, 25012), started fresh process on port 8000. Also manually ran `_generate_and_save_cover()` for all 3 existing courses that had `cover_image_url = NULL`. All verified: Gemini REST API returns JPEG (~1.1 MB base64, ~17s), DB save works, `GET /api/courses/` returns cover correctly. **Important**: after any code change to the backend, the uvicorn process MUST be restarted manually (no `--reload` flag in prod mode).

---

## What Was Done This Session (2026-04-27 Session 60 — Course generation popup animation upgrade)

### Goal
Replace the plain emoji+progress bar popup with two purpose-built CSS animations that match the project's botanical color palette. Desktop gets a spinning pinwheel; mobile gets a compact non-blocking pill with falling domino bars.

### File changed — `frontend/components/courses/CourseGenerationProgress.tsx`

**Desktop card (md+) — pinwheel animation:**
- Adapted the m1her/hungry-kangaroo-29 pinwheel from UIverse: four petal-leaf arms rotating on a 3s linear loop
- Colours remapped to botanical palette: rust `#c85a3c`, gold `#d4a843`, olive `#8d9d4f`, sage `#7d8f6b` — work on both light (`#e4d7b0`) and dark (`#111110`) card backgrounds
- Stick omitted (card context; floating flower is cleaner); overflow-clipped wrapper (100px height, scale 0.6) so the flower is centred without layout overflow
- Card layout: [animation zone] → "Generating your course…" label + step text (visually attached below animation) → slim progress bar + `%` counter → "View Course →" / "Dismiss" when done

**Mobile pill (<md) — domino bars animation:**
- Adapted the shadowfax29/silly-octopus-9 domino animation: five coloured bars falling in staggered sequence (same botanical colours)
- Compact `220px` wide bottom-centre pill — occupies only the bottom-centre strip, page content visible on both sides
- Expands to `260px` when done/failed to accommodate action buttons
- `safe-area-inset-bottom` so it clears the iPhone home bar
- "Generating course…" + current step text shown inline next to the animation

**All states handled:**
- Active: animation + step text + progress %
- Done: `CheckCircle2` icon + "Course ready!" + "View Course →" + "Dismiss"
- Failed: `XCircle` icon + error message + "Dismiss"

**Technical notes:**
- All CSS embedded via `<style dangerouslySetInnerHTML>` with `bb-` prefix to avoid global class collisions
- `scale: 1.5` CSS property used on petal wrappers (Chrome 107+, Firefox 110+, Safari 15.4+ — all supported)
- `tsc --noEmit`: 0 errors

**Post-session bug fixes (continuation):**
- Fixed "narrow space" desktop rendering: Pinwheel container was a flex child with all-absolute content → collapsed to 0px width. Fix: `width: "100%"` added to the container div.
- Added touch-drag to mobile pill: `useState` drag offset + `useRef` for start coords; `onTouchStart`/`onTouchMove` handlers; `touchAction: none` to prevent scroll interference; `transition-[width]` (not `transition-all`) so drag is instant while width animates; offset resets to origin when `activeJobId` changes.

---

## What Was Done Previous Session (2026-04-27 Session 59 — Chatbot typing animation + latency optimizations)

### Goal
Two improvements: (1) make the "waiting" animation visible and professional while the AI thinks, and (2) reduce backend latency before the first token arrives.

### Frontend — `frontend/components/chatbot/ChatMessage.tsx`
- Replaced `TypingBars` (5 audio-visualizer bars, 2px wide, `animate-pulse` fade) with `ThinkingIndicator`: three 8px bouncing dots (`animate-bounce`, 0/160/320ms stagger) + "Thinking…" label in muted text

### Backend — `backend/services/langchain_service.py`
- **Parallel Redis lookups**: three pre-stream cache checks now use `asyncio.gather()` — saves ~10–15ms per message on warm paths
- **RAG k reduced 5 → 3**: faster embedding query + smaller context fed to Gemini

### Verified
- Python syntax check: OK; Backend health: OK; TTFT ~2.7–4.2s; `hits=3` confirmed in logs

---

## What Was Done Previous Session (2026-04-27 Session 58 — VocabPill mobile tooltip fix)

### Goal
VocabPill tooltips were not appearing on mobile despite Session 56 adding the onClick toggle. Two root causes found and fixed.

### Bug 1 — `position:absolute` tooltip clipped by `overflow-y:auto` ancestor
- The chatbot `<main>` has `overflow-y-auto`. CSS spec: when one overflow axis is non-`visible`, the other computed value can't be `visible` either — so `overflow-x` was also `auto`, clipping any absolutely-positioned child that overflowed the container.
- **Fix (`VocabularyHighlight.tsx`):** Replaced `position: absolute` + Tailwind class-based layout with `position: fixed` + inline `style` using pixel coords computed from `getBoundingClientRect()`. Renamed `TooltipPlacement` → `TooltipCoords` (stores `top`, `left`, `openBelow`); `computePlacement()` → `computeTooltipCoords()` returns pixel values. Horizontal position is clamped to viewport width with `SAFE_MARGIN`. `translateY(-100%)` applied when tooltip opens above the pill. `z-index` raised from `z-30` → `z-50`.

### Bug 2 — Synthetic `mouseleave` after tap fired `scheduleClose`
- After a mobile tap, browsers fire a synthetic `mouseleave` event ~300 ms later as part of the touch→mouse compatibility shim. This called `scheduleClose()`, starting a 120 ms timer that closed the tooltip immediately after `onClick` opened it — making it appear as if nothing happened.
- **Fix (`VocabularyHighlight.tsx`):** Added `lastTouchRef = useRef(0)`. `onTouchStart` on the pill button sets `lastTouchRef.current = Date.now()`. `scheduleClose()` returns early if called within 500 ms of a touch event.

### Checks
- `tsc --noEmit`: 0 errors
- Desktop hover + delayed-close behavior unchanged

---

## What Was Done Previous Session (2026-04-26 Session 57 — Admin panel bug fixes)

### Goal
Fix three bugs in the admin panel: (1) Common Weak Points panel always returned 500 due to invalid SQL, (2) both panels silently swallowed API errors and showed the same empty state as "no data", (3) per-user token usage charts were always zero because `log_tokens()` was never called anywhere.

### Backend — `backend/services/gemini_service.py`
- Added `generate_json_with_usage(prompt, system_prompt?, max_retries?) → (dict, int, int)` — like `generate_json` but returns `(result, input_tokens, output_tokens)`; accumulates tokens across JSON parse retries
- Refactored `generate_json()` to delegate to `generate_json_with_usage()` (single implementation, no duplication)

### Backend — `backend/services/admin_service.py`
- `get_weak_points_distribution()`: removed `func.round(func.cast(func.avg(...), type_=func.Float), 2)` — `func.Float` is a SQLAlchemy Function object, not a type; it generated invalid SQL (`cast(avg(x))` with no AS clause), causing a 500 error on every call. Fixed by removing the SQL cast and using `func.avg(...).label("avg_strength")` + Python-side `round(float(r.avg_strength), 2)` in the dict comprehension

### Backend — `backend/services/quiz_service.py`
- Imported `Course` from `backend.models.course` and `generate_json_with_usage` from `gemini_service`
- `generate_module_quiz()`: switched from `generate_json()` to `generate_json_with_usage()`; looks up `user_id` from `module.course_id → Course.user_id`; calls `log_tokens(db, user_id, feature="module_quiz", ...)`
- `generate_standalone_quiz()`: switched to `generate_json_with_usage()`; calls `log_tokens(db, user_id, feature="standalone_quiz", ...)`

### Backend — `backend/services/course_service.py`
- Imported `generate_json_with_usage`
- `generate_course_skeleton()`: return type changed from `dict` to `tuple[dict, int, int]`; uses `generate_json_with_usage()` and returns `(skeleton, input_tokens, output_tokens)`
- `generate_course()`: unpacks the new tuple; calls `log_tokens(db, user_id, feature="course_gen", ...)` after skeleton generation

### Frontend — `frontend/app/(dashboard)/admin/page.tsx`
- `ScoreDistributionPanel`: added `error: string | null` state; catch block now sets `error` instead of leaving `data=null`; render shows a red error message when `error` is set (distinct from the italic muted "no attempts" empty state)
- `WeakPointsPanel`: same pattern — `error` state + red error message on failure

### Syntax/type checks
- Python AST: all 4 modified `.py` files parse clean
- `tsc --noEmit`: 0 errors

---

## What Was Done Previous Session (2026-04-26 Session 56 — VocabPill mobile tap fix)

### Goal
VocabularyHighlight VocabPills in the chatbot were hover-only. On mobile (touch screens), hover events never fire, so the translation + pronunciation tooltip was completely inaccessible.

### Changes — `frontend/components/chatbot/VocabularyHighlight.tsx`
- Added `wrapperRef` (useRef<HTMLSpanElement>) to the outer `<span>` wrapper — needed for outside-click detection
- Added `handlePillClick(e)` toggle function: if tooltip is already open → clear delay timer + close immediately; if closed → call existing `openTooltip()`
- Added `onClick={handlePillClick}` to the pill `<button>` — fires on both desktop click and mobile tap
- Added `useEffect` that attaches `mousedown` + `touchstart` listeners to `document` while tooltip is open; closes tooltip when event target is outside `wrapperRef` — standard outside-click pattern
- Changed pill `title` from "Hover to see translation" → "Tap to see translation"
- Desktop hover behavior (`onMouseEnter`/`onMouseLeave` with 120ms delay) is fully preserved
- `tsc --noEmit`: 0 errors

---

## What Was Done Two Sessions Ago (2026-04-26 Session 55 — Admin Panel Phase 2: evaluation data quality)

### Goal
Five evaluation-quality additions to the admin panel: surface time-spent with a coverage caveat, chatbot engagement metrics, a raw quiz attempt inspector, a cohort score distribution histogram, and a cohort weak-points table.

### Backend — `admin_service.py`
- `get_user_detail()` extended:
  - `total_time_spent_seconds` = SUM(activity_logs.duration_seconds) for user (0 if none)
  - `total_chat_messages` = COUNT(chat_messages) JOINed through chat_sessions.user_id
  - `avg_messages_per_session` = messages / sessions, 1dp, 0 if no sessions
- New `get_quiz_attempts(user_id)` — merges ModuleQuizAttempt + StandaloneQuizAttempt, sorted newest first; module attempts return `questions: null` (not stored in that table)
- New `get_score_distribution(start_date, end_date)` — 10-point buckets across both tables; scores×100; mean+median computed in Python; optional date filter on taken_at
- New `get_weak_points_distribution(start_date, end_date)` — GROUP BY (type, topic); distinct user_count; avg strength_score; date filter on updated_at; top 20 by user_count; `type` column renamed to `category` in API response

### Backend — `admin.py`
- `GET /api/admin/users/{user_id}/quiz-attempts` (new, admin-gated)
- `GET /api/admin/analytics/score-distribution` (new, admin-gated, optional date params)
- `GET /api/admin/analytics/weak-points` (new, admin-gated, optional date params)

### Frontend — `types.ts`
- `AdminUserDetail.stats` extended: `total_time_spent_seconds`, `total_chat_messages`, `avg_messages_per_session`
- New interfaces: `AdminQuizAttempt`, `ScoreDistribution`, `WeakPointDistribution`

### Frontend — `api.ts`
- `adminApi.getQuizAttempts(userId)`, `getScoreDistribution(sd?, ed?)`, `getWeakPointsDistribution(sd?, ed?)`

### Frontend — `admin/users/[userId]/page.tsx`
- `fmtDuration(seconds)` helper → "2h 15m" / "45m" / "0m"
- `TextStatPill` component for non-integer display values
- "Time on App" pill with coverage footnote ("Quizzes & spelling only — chatbot/browsing not tracked")
- "Chat Messages" (count) + "Msgs / Session" (avg) stat pills
- `QuizAttemptsSection` — collapsible, lazy-fetches on first open; `AttemptCard` shows type badge, score%, timestamp, Q/A pairs with CheckCircle/XCircle indicators

### Frontend — `admin/page.tsx`
- `ScoreDistributionPanel` — Recharts BarChart, date pickers (re-fetch on change), mean+median text labels above chart
- `WeakPointsPanel` — sortable table (click header to sort by user_count or avg_strength_score), date pickers, category badge (vocab/grammar), strength score coloured by threshold (red/amber/green)

### Data shape decisions (divergences from spec)
- `attempt_id` is UUID string (not int) — IDs are UUIDs throughout the DB
- Module quiz `questions` = null (questions_json column does not exist on module_quiz_attempts — only answers_json is stored)
- Weak-point `category` maps to the DB column `type` ("vocab"/"grammar") — renamed for API clarity
- Weak-point date filter uses `updated_at` (only timestamp on the weak_points table; no `created_at`)

### Methodological caveats (for evaluation methodology doc)
- **Time on app** undercounts: activity_logs only records quiz and spelling game duration. Chatbot browsing time and course reading time are event-counted (not timed), so `total_time_spent_seconds` is a lower bound.
- **Score distribution** mixes module quizzes (pass threshold ≥70%) and standalone adaptive quizzes (no gate) — a learner can retake module quizzes until passing, biasing module scores upward.
- **Weak point strength_score** is a rolling value (updated on each quiz miss/hit), not a creation-time score — the date filter on `updated_at` reflects when a weak point was last touched, not when it was first identified.

### Smoke test results
- `tsc --noEmit`: 0 errors
- Python import check: all 4 new service functions exist + are async; all 3 new routes registered at correct paths

---

## What Was Done Previous Session (2026-04-26 Session 54 — Admin panel evaluation enhancements)

### Goal
Harden the admin panel for the 30-user evaluation study: add CSV export for all three datasets, surface last_active on the user list, add date range filters to user list and exports, show avg quiz score + score trajectory on user detail, and fix the feedback label bug (general feedback showed "Quiz matched weak areas" instead of "Content is relevant").

### New files
- `backend/routers/admin_export.py` — three CSV export endpoints under `/api/admin/export/*` (users, quiz-attempts, feedback), all gated by `require_admin`; `_csv_response()` helper; `_start_dt()` / `_end_dt()` ISO date → UTC-aware datetime; bulk GROUP BY aggregation (not N+1)

### Backend changes
- `backend/main.py` — import + register `admin_export` router; add missing `backend.models.analytics` to model import block
- `backend/services/admin_service.py` — `get_all_users()` extended with `start_date/end_date` params + `last_active` from `MAX(activity_logs.created_at)` GROUP BY; `get_user_detail()` extended with `avg_quiz_score_module`, `avg_quiz_score_standalone`, and `score_trajectory` (merged module+standalone, sorted asc, capped at 50)
- `backend/routers/admin.py` — `GET /api/admin/users` now accepts `start_date` + `end_date` Query params

### Frontend changes
- `frontend/lib/types.ts` — `AdminUser.last_active: string | null`; `AdminUserDetail.stats` + avg score fields; `AdminUserDetail.score_trajectory` array
- `frontend/lib/api.ts` — `getUsers` extended with date params; `exportUsers`, `exportQuizAttempts`, `exportFeedback` blob functions added
- `frontend/app/(dashboard)/admin/page.tsx` — `DataExportPanel` component with date pickers + three download buttons; `triggerBlobDownload` (DOM-attached `<a>` for Firefox compat); improved catch block shows HTTP status + `console.error`
- `frontend/app/(dashboard)/admin/users/page.tsx` — `formatRelativeTime()` helper; `last_active` column; start/end date inputs + Clear filters button; table grid 6-col → 7-col
- `frontend/app/(dashboard)/admin/users/[userId]/page.tsx` — two avg score pills (module %, adaptive %); Recharts `LineChart` for score trajectory (module=purple, adaptive=green, `connectNulls`)
- `frontend/app/(dashboard)/admin/feedback/page.tsx` — conditional label: `quiz_type === "general"` → "Content is relevant:" else "Quiz matched weak areas:"

### Known issue
CSV download requires backend restart to pick up the new `admin_export.py` module. If downloads show an HTTP 404 error, restart uvicorn.

---

## What Was Done Previous Session (2026-04-25 Session 53 — Corrective mobile dashboard fix)

### Goal
Session 52's mobile dashboard fix used `overflow-x: hidden` to mask horizontal overflow rather than resolving it — content on the right side of the viewport became silently unreachable (not scrollable, just clipped). Session 53 removes the masking and fixes the root cause by making the stat grid single-column at mobile.

### Changes

**`frontend/app/(dashboard)/layout.tsx`**
- Removed `overflow-x-hidden` from `<main>` (the shared authenticated layout wrapper) — was masking overflowing content on every dashboard page

**`frontend/app/(dashboard)/dashboard/page.tsx`**
- Removed `overflow-x-hidden` from the dashboard container div
- Inline loading skeleton stat grid: `grid-cols-2 sm:grid-cols-3` → `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`

**`frontend/app/(dashboard)/dashboard/loading.tsx`**
- Stat card skeleton grid: `grid-cols-2 sm:grid-cols-3` → `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`

**`frontend/components/dashboard/StatsCards.tsx`**
- Live stat grid: `grid-cols-2 sm:grid-cols-3` → `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- The Session 52 tile redesign (watermark icon top-right, left-aligned content, label/value/description layout) is unchanged

### What was NOT changed
- Dark mode palette (globals.css) — Session 52 work kept
- Chatbot changes (asymmetric bubbles, InlineMalayWord, Waves opacity) — Session 52 work kept
- BPSProgressBar mobile stacking — Session 52 work kept
- Stat tile visual composition — Session 52 work kept; only the grid column count changed
- Light mode — untouched in both sessions

### Root cause analysis
`overflow-x: hidden` on a flex scroll container parent clips absolutely-positioned children and hidden overflow rather than causing reflow. The correct approach is ensuring children actually fit within the viewport — done here by making the stat grid single-column at mobile so no tile can exceed viewport width.

---

## What Was Done Previous Session (2026-04-25 Session 52 — UI polish pass: dark mode + mobile + chatbot UX)

### Goal
Six-issue UI polish pass: dark mode overhaul, background animation subtlety, chatbot asymmetric bubbles + inline vocab chips + header tagline removal, mobile top-bar overlap fix, mobile dashboard horizontal scroll fix, and stat tile layout redesign.

### Changes

**`frontend/app/globals.css`**
- Dark mode variables completely rethought — "library night mode" palette:
  - `--background`: #25221a (muddy olive) → **#111110** (near-black, barely warm)
  - `--card`: #2e2b22 → **#1c1b1a** (one shade lighter than bg, neutral)
  - `--border`: #3d3a2e → **#2e2c2a** (subtle, visible)
  - `--input` / `--secondary` / `--muted`: all updated to neutral dark
  - `--muted-foreground`: #a8a096 → **#888480** (neutral grey, not olive)
  - `--sidebar`: #1c1a13 → **#0b0b0a** (deepest surface for sidebar)
  - `--foreground`: #ede4d4 → **#e6e1d8** (warm off-white, unchanged feel)
  - Primary (#8a9f7b) and accent (#a18f5c) kept — they appear on action elements only
- Driver.js popover overrides updated to new neutral palette (#1c1b1a bg, #e6e1d8 title, #888480 desc)

**`frontend/components/ui/dashboard-wave-background.tsx`**
- Dark palette updated to match new bg: #111110 → #1e1d1b (13-unit range vs old 19-unit)
- Sage tint threshold raised from 0.6 to 0.7, intensity halved — barely perceptible at peaks

**`frontend/app/(dashboard)/chatbot/page.tsx`**
- **Background animations fix**: Waves stroke in dark mode changed from `#8a9f7b` (fully visible) to `rgba(138,159,123,0.09)` — ambient texture only, not competing with content
- Waves background color updated from `#25221a` → `#111110` to match new dark bg
- **Header tagline removed**: "Bahasa Melayu" subtitle line removed; live green pulse dot moved inline with "AI Tutor" title

**`frontend/components/chatbot/ChatMessage.tsx`**
- **Asymmetric bubbles**: Assistant message container (`bg-card/60 backdrop-blur border`) replaced with plain unstyled div — no bubble, no border, text renders directly on page background (avatar remains as visual anchor)
- **Inline vocab chips**: `VocabPill` import replaced with `InlineMalayWord` — chatbot-only component that renders vocab as `font-medium underline decoration-amber-600/50 decoration-dotted` + trailing `Volume2` speaker icon at 10px (no pill border, no background fill). The VocabPill component in VocabularyHighlight.tsx is unchanged — course/quiz/dashboard uses the full pill, only chatbot uses the inline style.
- User bubble unchanged (tinted pill with right accent line)

**`frontend/app/(dashboard)/layout.tsx`**
- Added `overflow-x-hidden` to `<main>` — prevents any absolute/glow-effect child from causing a viewport-level horizontal scrollbar on any page

**`frontend/components/dashboard/BPSProgressBar.tsx`**
- Header row: `flex items-center justify-between` → `flex flex-col sm:flex-row ...` — "BahasaBot Proficiency Scale (BPS)" and level badge now stack vertically on mobile instead of overflowing
- Title: `text-base` → `text-sm sm:text-base`, level badge: `text-sm` → `text-xs sm:text-sm`
- Track div: added `min-w-0` on container and each segment to prevent flex overflow

**`frontend/components/dashboard/StatsCards.tsx`**
- **Stat tile redesign**: icon top-left small box → large faint watermark icon absolutely positioned top-right corner (`w-8 h-8 sm:w-10 sm:h-10`, opacity ~20–25% via Tailwind `/20`-`/30` text color utility)
- Content now left-aligned without competing with a redundant icon box; label truncated at `text-[9px] sm:text-[10px]` with `tracking-widest`; value at `text-2xl sm:text-3xl`; description separated below
- Tile labels shortened ("Courses Created" → "Courses", "Classes Completed" → "Classes Done", etc.) to prevent overflow at `tracking-widest` on mobile
- `pr-8 sm:pr-10` on the text block ensures number doesn't overlap the watermark icon

### Judgement calls
- Dark mode background: chose #111110 (slight warmth, not cold pure-black) to avoid feeling completely disconnected from the light-mode parchment brand. Sidebar at #0b0b0a to give clear hierarchy depth.
- Waves stroke opacity: 0.09 (9%) — verified this is visible if you look for it but doesn't distract while reading messages.
- Stat tile icon: chose "large faint watermark top-right" over "icon on the left, value on the right" or "icon centered as background" because it fills the previously dead right space while keeping the hierarchy (number is the most important element, reads first top-left).
- Vocab chips: `title` attribute holds the English meaning (native browser tooltip on hover). No explicit tooltip overlay needed — keeps the implementation minimal and accessible.

---

## What Was Done Previous Session (2026-04-25 Session 51 — Chatbot redesign + skeleton overhaul + wave background)

### Goal
Polish the chatbot UI, fix the chatbot language detection bug, overhaul all loading skeletons to match real page layouts, and add an animated wave background to the dashboard.

### Changes

**`backend/services/langchain_service.py`**
- Added explicit `RESPONSE LANGUAGE RULE` at the top of `CHATBOT_SYSTEM_PROMPT` (overrides everything else):
  - Student wrote in English → entire response must be in English (Malay appears as teaching examples only)
  - Student wrote in Malay → entire response in Malay
  - Mixed → respond in English
- Renamed old "CRITICAL — DIALECT RULE" → "CRITICAL — MALAY DIALECT RULE (applies to Malay examples and responses only)"
- Root cause: tutor was writing full Malay paragraphs when students asked questions in English

**`frontend/components/chatbot/ChatMessage.tsx`**
- User bubble: `bg-primary` solid → `bg-primary/25 backdrop-blur-sm border border-primary/30` + right gradient accent line
- Bot bubble: `bg-card border` → `bg-card/60 backdrop-blur-sm border border-white/8` + left gradient accent line + deeper drop shadow
- Typing indicator: 3 bouncing dots → `TypingBars` component (5 audio-visualizer bars with staggered pulse)
- Streaming cursor: `w-1.5 h-4` → `w-1 h-4 bg-primary/70`
- Blockquote: `border-l-4 border-border` → `border-l-2 border-primary/40`
- Inline code: `rounded` → `rounded-sm`

**`frontend/app/(dashboard)/chatbot/page.tsx`**
- Header: `bg-card border-b` → `bg-background/90 backdrop-blur-xl shadow-[0_4px_24px_...]`; live green pulse dot beside "Bahasa Melayu" subtitle; History + New chat buttons use `border-primary/20 hover:border-primary/50 hover:bg-primary/5`; New chat gets `Plus` icon
- Input footer: `bg-card border-t` → `bg-background/90 backdrop-blur-xl shadow-[0_-6px_28px_...]` + decorative top glow line; textarea `border-primary/30` + larger min-height (48px); send button redesigned `bg-foreground text-background`; streaming state shows 5-bar visualizer (matches `TypingBars`)
- Error banner: plain text → bordered `bg-destructive/5 border border-destructive/30` pill card
- `EmptyState`: logo removed from glass card, now floats with ambient blur glow; decorative `h-px` side lines flank the welcome title; starter buttons get `›` prefix arrow + `backdrop-blur-sm`

**`frontend/app/(dashboard)/chatbot/loading.tsx`**
- Reflects new header (2 buttons) and new footer (input + separate send button)

**`frontend/app/(dashboard)/admin/loading.tsx` + inline skeleton in `admin/page.tsx`**
- Complete overhaul: header (icon+title+subtitle), 7 stat cards in `grid-cols-2 lg:grid-cols-3`, navigation section with 4 list items (icon+title+description+chevron)
- Both `loading.tsx` and the `if (loading)` block in `page.tsx` are now identical (eliminates flash of different skeleton on client hydration)
- Resolves the "Admin loading skeletons" missing item

**`frontend/app/(dashboard)/courses/loading.tsx` + inline skeleton in `courses/page.tsx`**
- Both updated to precisely mirror `CourseCard`: cover image area (`h-24 sm:h-32`), padded content section, progress bar, delete row at bottom

**`frontend/app/(dashboard)/dashboard/loading.tsx` + inline skeleton in `dashboard/page.tsx`**
- `loading.tsx`: header, 5-tab strip with realistic widths, 8 stat cards (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`), tall BPS strip, 2-column weak points/quiz history
- Inline skeleton: stat card count 6 → 8, `h-24 rounded-lg` → `h-28 sm:h-40 rounded-[1.25rem]`, BPS block `h-[140px]`, weak-points/quiz grid updated

**`frontend/app/(dashboard)/journey/loading.tsx` + inline skeleton in `journey/page.tsx`**
- Both updated to match road UI: header with delete button, banner image, progress summary card, obstacle nodes with `pl-16` layout (absolute dot + card)

**`frontend/app/(dashboard)/settings/loading.tsx`**
- Refreshed to match settings hub: header, GlowCard list with icon+title+description+chevron rows

**`frontend/app/(dashboard)/settings/about/page.tsx`**
- `backdrop-blur-sm` → `backdrop-blur-xl` on all three GlowCards (minor visual polish)

**`frontend/components/ui/dashboard-wave-background.tsx`** *(new)*
- Canvas-based animated wave background for the dashboard
- Dark mode only — light mode clears to transparent (CSS bg shows through unchanged)
- Slow sine-wave shader (4 octaves) at ¼ resolution (16× cheaper); bilinear upscale via `drawImage`
- Palette: #25221a → #38332a (≈19 RGB units) with faint olive tint (`g += peak * 6`) at peaks > 0.6
- Pre-built 1024-entry sin/cos lookup tables; correct negative-modulo handling to prevent flat bands
- `fixed inset-0 z-0`; dashboard content wrapped in `relative z-10`

**`frontend/components/ui/background-paths.tsx`**
- `absolute inset-0` → `fixed inset-0 z-0` (auth pages: paths now cover full viewport on all screen sizes)
- Added `preserveAspectRatio="xMidYMid slice"` to SVG (prevents letterboxing)

---

## What Was Done Previous Session (2026-04-25 Session 50 — Daily tips visibility fix)

### Goal
Fix the Daily Language Tips toast not appearing after login even though the tips feature and random endpoint were already implemented.

### Root Cause
Two frontend issues prevented users from seeing tips:
- `TipToast.tsx` stores `sessionStorage["tip_dismissed"] = "1"` after auto-dismiss or manual close. Login and registration only cleared chatbot session keys, so a later logout/login in the same browser tab skipped the tip entirely.
- On first-login flows, onboarding renders at `z-[80]`, the same layer as the tip toast. Onboarding is rendered later in the dashboard layout and can cover the tip while the 8-second timer continues, dismissing it invisibly.

### Fix
- `frontend/app/(auth)/login/page.tsx` — email and Google login now call `sessionStorage.removeItem("tip_dismissed")` after successful login
- `frontend/app/(auth)/register/page.tsx` — email and Google registration now clear `tip_dismissed` after successful registration
- `frontend/components/TipToast.tsx` — z-index raised from `z-[80]` to `z-[85]` (above onboarding `z-[80]`, below SetPasswordModal `z-[90]`)

---

## What Was Done This Session (2026-04-20 Session 47 — Production deployment bug fixes)

### Goal
Fix production deployment breaking after login: "Failed to load courses", excessive API calls, doubled polling.

### Root Causes Found & Fixed

1. **Double NotificationBell polling (main culprit for excess API calls)**
   - `AppSidebar.tsx` rendered `<NotificationBell>` at line 96 (inside `md:hidden` mobile header) AND at line 261 (desktop sidebar footer)
   - CSS `display:none` via `md:hidden` does NOT unmount the React component — both bells were mounted and polling simultaneously on desktop
   - This doubled every `/api/notifications/` call AND doubled the session cache misses
   - **Fix**: Converted `NotificationBell` from `setInterval` → `useQuery({ refetchInterval })`. React Query automatically deduplicates the `["notifications"]` query across all mounted instances — only ONE fetch fires per poll interval regardless of how many bells are mounted

2. **Session cache thundering herd (concurrent requests all calling getSession())**
   - When multiple components mount simultaneously (page load), all called `getCachedSession()` concurrently with empty cache — each made its own `getSession()` → `/api/auth/session` network call
   - **Fix**: Added `_sessionInflight` promise dedup in `getCachedSession()` in `api.ts` — concurrent calls share one in-flight `getSession()` promise

3. **gamification_service.py missing rollback on failure**
   - `record_learning_activity()` caught its own exceptions but didn't rollback the shared request-scoped session — leaving it in an aborted transaction state that could corrupt subsequent DB calls in the same request
   - **Fix**: Added explicit `await db.rollback()` in the except block

4. **Missing `import backend.models.xp_log` in main.py**
   - XPLog model was imported transitively but not explicitly registered in the startup model imports
   - **Fix**: Added `import backend.models.xp_log  # noqa: F401` to main.py

### Files Changed
- `backend/main.py` — added xp_log model import
- `backend/services/gamification_service.py` — explicit rollback on failure
- `frontend/lib/api.ts` — session cache deduplication via `_sessionInflight` promise
- `frontend/components/notifications/NotificationBell.tsx` — converted to React Query (eliminates double-polling)
- `.claude/STATUS.md` — this update

## What Was Done This Session (2026-04-20 Session 46 — Weekly XP Leaderboard)

### Goal
Add a weekly XP leaderboard so users can see who earned the most XP in the current week.

### Changes

**Backend:**
- `backend/db/migrations/versions/20260420_1200_xp_logs_table.py` — new Alembic migration; creates `xp_logs` table and indexes
- `backend/models/xp_log.py` — new XPLog ORM model (user_id, xp_amount, source, created_at)
- `backend/db/migrations/env.py` — added XPLog import
- `backend/services/gamification_service.py` — added `XPLog` import + `source` param to `record_learning_activity()` + inserts into `xp_logs` on every XP award
- `backend/services/journey_service.py` — passes `source="roadmap_obstacle"/"roadmap_complete"/"roadmap_complete_late"` to roadmap XP calls
- `backend/routers/chatbot.py` — passes `source="chatbot_session"`
- `backend/routers/courses.py` — passes `source="class_complete"` and `source="quiz_pass"`
- `backend/routers/games.py` — passes `source="spelling_correct"`
- `backend/routers/quiz.py` — passes `source="quiz_pass"`
- `backend/services/progress_service.py` — added `get_weekly_leaderboard()` (ISO week window, top-N users, current-user rank, Redis cache 5 min)
- `backend/schemas/dashboard.py` — added `LeaderboardEntry`, `AdminLeaderboardEntry`, `LeaderboardResponse`
- `backend/routers/dashboard.py` — added `GET /api/dashboard/leaderboard`
- `backend/routers/admin.py` — added `GET /api/admin/leaderboard`

**Frontend:**
- `frontend/lib/types.ts` — added `LeaderboardEntry`, `LeaderboardResponse`
- `frontend/lib/api.ts` — added `dashboardApi.getLeaderboard()`, `adminApi.getLeaderboard()`
- `frontend/components/dashboard/LeaderboardCard.tsx` — new component (GlowCard, medal/avatar/BPS/streak/XP rows, current-user highlight, mobile-responsive)
- `frontend/app/(dashboard)/dashboard/page.tsx` — added 5th "🏆 Leaderboard" tab + `useQuery(["leaderboard"])` + `LeaderboardCard`
- `frontend/app/(dashboard)/admin/page.tsx` — added `Trophy` icon import + "Weekly Leaderboard" entry to ADMIN_SECTIONS
- `frontend/app/(dashboard)/admin/leaderboard/page.tsx` — new admin page (full table with email, BPS, streak, weekly XP)

## What Was Done This Session (2026-04-20 Session 45 — Settings debugged + account deletion)

### Goal
Debug the profile settings page (native language always showing blank), add account deletion, update the about page.

### Root Causes Found

**Bug 1 — native_language always blank in select:**
`react-hook-form`'s `reset()` sets the select value correctly only if the stored value matches a `<option value="">` exactly. The onboarding modal stores free-text (e.g. "Mandarin" vs "Mandarin Chinese"); Journey roadmap generation stores long free-text goals like "I want to pass my Malay proficiency exam" which NEVER match the 5 predefined `GOAL_OPTIONS` entries. Any mismatch silently falls back to the placeholder.

**Bug 2 — learning_goal always blank in select:**
The Journey modal's `goal` field is free text and overwrites `users.learning_goal` (by design, per CLAUDE.md). So the profile page's fixed 5-option dropdown will never match it after first Journey creation.

**Fix:** Replaced both `<select>` elements with controlled inputs — `native_language` → `<input type="text" list="lang-suggestions">` with datalist; `learning_goal` → `<textarea>`. Also rewrote the form to use plain `useState` + `useRef` for dirty tracking (removes the react-hook-form `reset()` timing dependency entirely).

### Files Changed

**`backend/routers/profile.py`**
- Added `POST /api/profile/delete-account`: verifies identity (bcrypt for email accounts; email match for Google-only accounts), then `DELETE FROM users WHERE id = ?` (cascade clears all child rows), busts profile cache

**`frontend/lib/api.ts`**
- Added `profileApi.deleteAccount({ password? | confirm_email? })`

**`frontend/app/(dashboard)/settings/profile/page.tsx`** — complete rewrite
- Form rewritten with plain controlled `useState` + `useRef` origin tracking; no `react-hook-form`
- `native_language`: free-text `<input list="lang-suggestions">` with datalist (shows any DB value)
- `learning_goal`: `<textarea>` with 500-char counter (shows any DB value)
- `DeleteAccountModal`: red danger modal; email accounts → password field; Google accounts → email confirmation field; calls `POST /api/profile/delete-account`, then `signOut()` + redirect to `/login`
- "Danger Zone" card added at bottom of page

**`frontend/app/(dashboard)/settings/about/page.tsx`**
- Developer row updated: "Sowan" → "Noor Mohammad Sowan"

### native_language — Is it fulfilling its purpose?
Yes. `langchain_service.py` injects it into the chatbot system prompt as:
> "The user's native language is {native_language}. Where helpful, draw on similarities or differences between {native_language} and Malay to aid understanding."
It works correctly whenever a value is stored. The fix ensures the UI now reliably shows and saves that value.

---

## What Was Done This Session (2026-04-19 Session 44 — Daily Language Tips)

### Goal
Implement a full end-to-end Daily Language Tips feature: DB table, FastAPI router, frontend toast, and admin panel section.

### Files Changed

**`backend/db/migrations/versions/20260419_1000_tips_table.py`** *(new)*
- Alembic migration: creates `tips` table (id UUID, content TEXT, category VARCHAR(50), generated_by VARCHAR(50), is_active BOOLEAN, created_at TIMESTAMPTZ); indexes on category + is_active

**`backend/models/tip.py`** *(new)*
- SQLAlchemy ORM model for `tips` table; follows same pattern as `notification.py`

**`backend/routers/tips.py`** *(new)*
- `GET /api/tips/random` — public, picks one random active tip; Redis-cached for rest of UTC day (TTL = seconds until next midnight); returns 404 if no tips exist
- `POST /api/tips/generate` — admin only; accepts category + count (1–10); calls Gemini with category-specific prompt; saves all string items to DB; invalidates daily cache
- `GET /api/tips/all` — admin only; paginated (default 10/page), filterable by category + is_active; newest-first
- `PATCH /api/tips/{tip_id}` — admin only; toggle is_active or update content; invalidates daily cache

**`backend/main.py`**
- Imported `tips` model (for Alembic detection) and `tips` router; registered at `/api/tips`

**`frontend/lib/types.ts`**
- Added `TipCategory`, `Tip`, `TipListResponse`, `GenerateTipsPayload`, `GenerateTipsResponse`

**`frontend/lib/api.ts`**
- Added `tipsApi` (getRandom, generate, getAll, update) with correct TypeScript generics

**`frontend/components/TipToast.tsx`** *(new)*
- Fetches random tip on mount; 2s delay before showing; checks sessionStorage `tip_dismissed` — skips entirely if set; framer-motion spring slide-in from bottom-right (x+80, y+20); 8s auto-dismiss with 100→0 shrinking purple progress bar; X button for instant close; orange category badge with emoji; purple glow decoration; dark/light compatible using `bg-card/95 backdrop-blur-md border-border/60`; max-width 320px; never blocks page content (z-[80])

**`frontend/app/(dashboard)/dashboard/page.tsx`**
- Imported and rendered `<TipToast />` at top of return fragment

**`frontend/app/(dashboard)/admin/page.tsx`**
- Added `LanguageTipsPanel` component with two tabs: "All Tips" (paginated table, category + active filters, inline toggle with CheckCircle2/XCircle icons, refresh button) and "Generate New" (4-category tile picker, range slider for count 1–10, Gemini generate button with loading state, success banner); panel added after the Sections nav list

---

## What Was Done This Session (2026-04-19 Session 43 — Production deployment fixes)

### Goal
Fix login failures after deployment to Render + Vercel. Two separate root causes identified and resolved.

### Files Changed

**`backend/db/database.py`**
- Added `connect_args={"statement_cache_size": 0}` — required for Neon PgBouncer (transaction mode). asyncpg caches prepared statements per connection; PgBouncer recycles the underlying server connection after each transaction, invalidating those statements. This was causing login failures after ~5 minutes of idle time.
- Added `pool_recycle=240` — proactively recycles connections every 4 min before Neon's 5-min idle timeout kills them
- Reduced `pool_size=10→5`, `max_overflow=20→10` — right-sized for single-worker Render free instance

**`backend/main.py`**
- Added `allow_origin_regex=r"https://bahasa-.*\.vercel\.app"` to CORSMiddleware — Vercel generates a new deployment-specific subdomain (e.g. `bahasa-<hash>.vercel.app`) on every push; these were not in `ALLOWED_ORIGINS`, causing OPTIONS preflight 400 rejections immediately after every Vercel deploy

### Also done this session
- Deleted 18 test/development user accounts and all their cascaded data (courses, progress, chat sessions, roadmaps, notifications, etc.) from the production DB. Kept 5 real users: sowangemini@gmail.com (admin), sowannoor04@gmail.com, nurmohammadsowan119@gmail.com, jannatul25056@diit.edu.bd, yessir@gmail.com.
- Verified Phase 24 course deduplication system: 4 template courses exist, 0 clones (expected — only one user has generated courses). Schema, ORM model, migration, and code all confirmed working.

---

## What Was Done This Session (2026-04-18 Session 42 — Dashboard progress-ring redesign)

### Goal
Complete visual overhaul of Dashboard Overview tab replacing 8-card stat grid with a modern progress-ring-focused layout. Frontend only — no backend/API changes.

### Files Changed

**`frontend/app/(dashboard)/dashboard/page.tsx`** — complete Overview tab rewrite
- Removed `StatsCards` dynamic import (no longer used in overview)
- Added `GlowCard` and `SpeakerButton` imports
- New inline components (all defined in the same file):
  - `ProgressRing` — SVG circular ring with track + progress arc + center value/sub-label; responsive sizing `72px→90px→108px` across mobile/sm/lg breakpoints; 1.2s cubic-bezier stroke animation
  - `VocabPreview` — compact vocab table without search bar; SpeakerButton on each word; source column hidden on mobile
  - `OverviewContent` — all overview logic extracted into a separate function to reduce nesting; accepts `summary` + `onViewAllVocab` props
  - `OverviewSkeleton` — loading skeleton matching new layout shapes
- **Overview layout (top to bottom):**
  1. BPS bar — `bg-muted/40 rounded-lg` strip (no border card)
  2. Three rings in `grid-cols-3` — GlowCard each; purple #6C5CE7 / green #22c55e / orange #F58623; Learning (classes/target×10), Vocabulary (/100 target), Quiz (avg from recent_quiz_history)
  3. Stats row — centered, 13px, `flex-wrap gap-x-4`; emoji + actual stats data
  4. Quick Actions — GlowingEffect on pill-shaped `rounded-full` divs wrapping Links; Continue Learning/Take Quiz/Chat with AI Tutor
  5. VocabPreview in GlowCard (conditional — only shown when vocab exists)
  6. Weak Points + Recent Quiz Attempts in GlowCards, `grid-cols-1 lg:grid-cols-2`
- Other tabs (Vocabulary, Grammar, Quiz History) unchanged

### Mobile handling
- Rings: `grid-cols-3` always (3-col at all widths); ring SVG scales down to 72px on mobile
- BPS bar: `flex-wrap sm:flex-nowrap` already in BPSProgressBar component
- Quick actions: `flex-wrap gap-2` — buttons wrap on narrow screens
- Vocab source column: `hidden sm:table-cell`
- Weak+Quiz: stacks on mobile, side-by-side on `lg+`

---

## What Was Done This Session (2026-04-18 Session 41 — Dashboard density redesign)

### Goal
Dr. Tan (FYP supervisor) requested more information density with less scrolling on the Dashboard Overview tab. Target: entire Overview visible without scrolling on a 1080p screen.

### Files Changed (frontend only — no backend/API changes)

**`frontend/components/dashboard/StatsCards.tsx`** — complete rewrite
- Removed all icons and GlowingEffect wrappers
- Changed grid from `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` with large padding to `grid-cols-2 sm:grid-cols-4 gap-1.5`
- Each card reduced to: 10px label + 24px bold number + 10px description with `px-3 py-2` padding
- Card height reduced from ~120px to ~70px

**`frontend/components/dashboard/BPSProgressBar.tsx`** — complete rewrite
- Replaced tall card layout (heading + bar + description = ~90px) with slim single-line bar (~36px)
- Format: `BPS Level: BPS-X — Label [████░░░░] Next: BPS-Y — Label. Take adaptive quiz to advance.`
- Fully responsive: wraps on mobile with `flex-wrap sm:flex-nowrap`

**`frontend/components/dashboard/WeakPointsChart.tsx`** — targeted edits
- Empty state: replaced large icon+text block with single `<p>` line (py-2)
- Rows: reduced `py-2.5` → `py-1.5`
- Item limit: `slice(0, 6)` → `slice(0, 4)` (overview shows 4 max)

**`frontend/components/dashboard/QuizHistoryTable.tsx`** — targeted edits
- Empty state: `py-6` → `py-2`
- Rows: `py-2` → `py-1.5`
- Score ring: `w-10 h-10` → `w-8 h-8`

**`frontend/app/(dashboard)/dashboard/page.tsx`** — Overview tab restructure
- Reduced `space-y-6` → `space-y-3` throughout Overview
- **New order:** BPS bar → Stats → Quick Actions → Vocabulary → Weak Points + Quiz side-by-side
- BPS section: removed GlowingEffect wrapper, now `rounded-lg border bg-background px-3 py-2`
- Quick Actions: 3 inline `Link` buttons (Continue Learning → /courses, Take Quiz → /quiz/adaptive, Chat with AI Tutor → /chatbot)
- Vocabulary moved above Weak Points, sliced to 5 rows, container padding `p-5` → `px-3 py-2.5`
- Weak Points + Quiz History: gap-6 → gap-3, padding p-5 → px-3 py-2.5, items sliced to 4
- Loading skeleton updated to match new layout (8 compact stat skeletons, slim BPS, etc.)

---

## What Was Done This Session (2026-04-17 Session 40 — Chatbot app-wide feature awareness)

### Problem
The chatbot had no knowledge that it exists inside a larger platform. When users asked the chatbot to "generate a course", "give me a quiz", or "show my progress", it responded confusingly — either trying to handle the request itself (broken) or ignoring it.

### Solution
Updated `CHATBOT_SYSTEM_PROMPT` in `backend/services/langchain_service.py` with a new `BAHASABOT APP CONTEXT` section and a `REDIRECT RULE` block.

**What was added to the prompt (no other code changed):**

1. **App identity clarification** — The chatbot now knows it is the "AI Tutor" feature within BahasaBot, not the whole app.

2. **Full feature directory** — 7 features listed with their purpose and exact sidebar navigation path:
   - Courses → sidebar → Courses → + New Course → type topic
   - Quiz → sidebar → Quiz (adaptive, targets weak points)
   - Dashboard → sidebar → Dashboard (progress, vocab, grammar, BPS level)
   - My Journey → sidebar → My Journey (personalised roadmap)
   - Games → sidebar → Games (spelling practice)
   - Chat History → AI Tutor page → history icon
   - Settings → sidebar → Settings

3. **Role boundary** — Explicit instruction that the chatbot handles ONLY conversational Malay learning and must never simulate other features.

4. **REDIRECT RULE** — 4-step rule: (1) acknowledge warmly, (2) name the dedicated feature, (3) give exact navigation, (4) offer something related it CAN do in chat. Followed by 6 concrete redirect pattern examples covering all common misdirected requests.

**Verified:**
- `python -m py_compile backend/services/langchain_service.py` → OK
- CLAUDE.md Section 5.2 updated with app-awareness note
- Prompt format strings (`{context}`, `{native_language_context}`, `{learning_goal_context}`, `{proficiency_context}`) unchanged — no impact on surrounding code

**Manual test scenarios (restart backend first to pick up new prompt):**
- "Generate a course for me" → should redirect to Courses
- "Give me a quiz" → should redirect to Quiz
- "Show my progress" → should redirect to Dashboard
- "What should I learn next?" → should redirect to My Journey
- "I want to play a game" → should redirect to Games
- "Teach me how to greet someone" → should respond normally as tutor (regression check)

---

## What Was Done This Session (2026-04-17 Session 39 — Notification panel z-index fix + About page animation)

### Problem 1 — Notification panel overlapping course cards (z-index bug)
The sidebar has `z-[1]` creating a CSS stacking context. The notification panel inside the sidebar had `z-[80]`, but that z-80 only applied within the sidebar's own stacking context — so the panel was effectively z-1 globally. The courses page content wrapper had `relative z-10`, giving it a higher global z-index than the sidebar. This caused course cards to paint on top of the notification panel.

### Fix
**`frontend/components/ui/notification-popover.tsx`:**
- Added `createPortal` from `react-dom` — panel now renders directly into `document.body`, completely escaping the sidebar's stacking context
- Added `triggerRef` (useRef on bell button) and `panelStyle` state to compute `fixed` pixel coordinates from `getBoundingClientRect()`
- `computePosition()` runs on panel open and on `window resize` (cleanup on close)
- Panel uses `position: fixed` with computed `top`/`bottom`/`left`/`right` values instead of `absolute` with CSS utility classes
- Added `mounted` SSR guard so `createPortal` is only called client-side
- `panelDirection="up"` → `bottom = window.innerHeight - rect.top + 12px`
- `panelSide="right"` → `left = rect.left` (panel extends right from button's left edge)
- `panelSide="left"` → `right = window.innerWidth - rect.right` (panel extends left from button's right edge)
- Backdrop remains `fixed inset-0 z-[79]`; panel is `fixed z-[80]` — both rendered via portal at body level, guaranteed above all page content

**`frontend/app/(dashboard)/courses/page.tsx`:**
- Removed `z-10` from the page content wrapper div — it was creating an unnecessary stacking context. The portal-based notification panel no longer needs this to be absent, but removing it avoids future stacking surprises on other pages.

### Problem 2 — About page has no visual flair
### Fix
**`frontend/components/ui/background-paths.tsx`** (new file):
- Animated SVG floating path component adapted from the BackgroundPaths pattern
- 36 curved SVG paths animating `pathLength`, `opacity`, and `pathOffset` in a loop
- Uses `text-primary/20 dark:text-primary/15` — matches BahasaBot's olive-green palette in both modes
- Stripped to just the animation layer (no title/button overlay)

**`frontend/app/(dashboard)/settings/about/page.tsx`:**
- Wrapped in `relative min-h-full` container with `<BackgroundPaths />` as absolute background
- All three `GlowCard`s get `backdrop-blur-sm` + `bg-card/80` so they stay readable over the animated paths
- Content div is `relative z-10`

---

## What Was Done This Session (2026-04-17 Session 36 — Course cover image fix)

### Problem
Session 35 stripped `cover_image_url` from the list endpoint to eliminate the ~9 MB payload (9 × ~1 MB base64 blobs). This broke cover images on the courses page entirely.

### Solution
Dedicated cover image endpoint with permanent browser caching — list stays small, images load fast.

**`backend/routers/courses.py`:**
- Added `import base64`
- Added `GET /api/courses/{course_id}/cover` — no auth (UUID is unguessable), reads base64 data URL from DB, decodes to raw bytes, returns with `Cache-Control: public, max-age=31536000, immutable`
- Browser caches each cover permanently on disk after first fetch — all subsequent page loads cost 0 bytes for covers

**`backend/services/course_service.py` — `get_courses_list()`:**
- Added `"has_cover": course.cover_image_url is not None` to each list item (tiny boolean, negligible payload)
- `cover_image_url` remains `None` in list response

**`frontend/lib/types.ts`:**
- Added `has_cover: boolean` to `CourseSummary`

**`frontend/app/(dashboard)/courses/page.tsx`:**
- Added module-level `API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"`
- `CourseCard`: renders `<img src="${API_URL}/api/courses/${id}/cover" loading="lazy" />` when `has_cover` is true; placeholder gradient when false

**Verified:** `tsc --noEmit` → 0 errors; `python -m py_compile` on both backend files → OK

---

## What Was Done This Session (2026-04-17 Session 35 — Page load performance optimizations)

### Goal
Eliminate the biggest payload and caching bottlenecks across the courses list, dashboard, journey, and sidebar to make every page feel fast on repeat visits.

### Changes — Backend

`backend/services/course_service.py` — `get_courses_list()`:
- Changed `"cover_image_url": course.cover_image_url` → `"cover_image_url": None`
- Eliminates ~1 MB base64 image blob per course from the list response (9 courses = ~9 MB → ~9 KB)
- Full URL still returned in the per-course detail endpoint (`get_course_with_progress()`)

### Changes — Frontend

`frontend/components/providers.tsx`:
- Global QueryClient `staleTime`: `60 * 1000` (1 min) → `5 * 60 * 1000` (5 min)
- Reduces unnecessary background refetches on every navigation

`frontend/components/nav/AppSidebar.tsx`:
- Profile query `staleTime`: `30_000` → `5 * 60 * 1000`
- Removed explicit `refetchOnWindowFocus: true` override (inherits global default `false`)
- Profile no longer refetches on every tab switch

`frontend/app/(dashboard)/courses/page.tsx`:
- Removed 12-second setTimeout cover-image refetch timer (cover_image_url is now always null in list; cover displayed only in detail view)
- Removed unused `useRef` import

`frontend/app/(dashboard)/dashboard/page.tsx`:
- Converted summary fetch from manual `useState` + `useCallback` + `useEffect` + focus/visibility listeners to `useQuery(["dashboard", "summary"])`
- Cached for 5 min; React Query's built-in refetchOnWindowFocus replaces manual listeners
- Removed `useCallback`, `useRef` imports

`frontend/app/(dashboard)/journey/page.tsx`:
- Added `useQuery, useQueryClient` imports
- Replaced `Promise.allSettled([getRoadmap, getProfile, getHistory])` useEffect with three `useQuery` hooks:
  - `["journey", "roadmap"]` — handles 404 → null without throwing
  - `["profile"]` — reuses the same cache key as AppSidebar (saves 1 API call on every journey visit)
  - `["journey", "history"]`
- Added 4 sync useEffects to propagate query data into local state
- Loading check changed: `roadmapLoading || roadmap === undefined`
- All mutations (`handleDelete`, `handleExtend`, `handleRegenerate`, `handleDismissUpgrade`, `onGenerated`, `onStartNew`) now also call `queryClient.setQueryData(["journey", "roadmap"], ...)` to keep cache in sync

### Build results (`npx next build` — clean, 0 errors)
| Route | First Load JS |
|---|---|
| /chatbot | 241 kB |
| /courses | 284 kB |
| /dashboard | 233 kB |
| /journey | 283 kB |
| /games/spelling | 234 kB |
| Shared chunks | 187 kB |

---

## What Was Done This Session (2026-04-17 Session 33 — Mandatory password setup for Google sign-in)

### Feature: Mandatory password setup for Google OAuth accounts

All Google-authenticated users with `password_hash = NULL` are now required to set a password immediately after sign-in via a non-dismissible `SetPasswordModal` before reaching the dashboard.

**Backend — 5 files changed:**

`backend/schemas/auth.py`:
- Added `requires_password_setup: bool = False` field to `TokenResponse`
- Added `SetPasswordRequest` (new_password, min 8 chars validator) + `SetPasswordResponse` schemas

`backend/routers/auth.py`:
- `POST /api/auth/google` — now returns `requires_password_setup=True` when `user.password_hash is None`
- Added `POST /api/auth/set-password` — authenticated endpoint; only works when `password_hash IS NULL` (returns 400 if password already exists); bcrypt-hashes and saves the new password
- `POST /api/auth/login` — changed `google_signin_required` error code to `no_password_set` (HTTP 400 instead of 401) with descriptive message

`backend/models/user.py`:
- Added `has_password: bool` Python property (computed from `password_hash is not None`)
- Pydantic's `from_attributes=True` in `ProfileResponse` picks this up automatically — no schema change needed beyond adding the field

`backend/schemas/profile.py`:
- Added `has_password: bool` to `ProfileResponse` — derived server-side, never exposes the actual hash

`backend/routers/profile.py`:
- `POST /api/profile/change-password` guard updated: removed `provider == "google"` condition, now only blocks when `password_hash IS NULL`. Google users who have set a password can now change it.

**Frontend — 6 files changed:**

`frontend/lib/types.ts`:
- Added `requires_password_setup: boolean` to `TokenResponse`
- Added `has_password: boolean` to `UserProfile`

`frontend/lib/api.ts`:
- Added `authApi` namespace with `setPassword(new_password)` → `POST /api/auth/set-password`

`frontend/components/auth/SetPasswordModal.tsx` (new):
- Full-screen, non-dismissible modal (`z-[90]`, above sidebar + onboarding)
- ShieldCheck icon + heading "One last step — set your password" + explanatory subtext
- New password + confirm fields with show/hide toggles
- Client-side validation: min 8 chars + must match
- On submit: `authApi.setPassword()` then `router.push("/dashboard")`
- Edge case: if password already set (race condition), silently continues to dashboard
- Loading spinner on submit button; inline error display

`frontend/app/(auth)/login/page.tsx`:
- Added `showSetPassword` state; after Google sign-in success, checks `data.requires_password_setup`
- If true: renders `<SetPasswordModal />` instead of redirecting
- Updated `no_password_set` error handling in email login form

`frontend/app/(auth)/register/page.tsx`:
- Same `showSetPassword` state + `SetPasswordModal` integration for Google sign-up path

`frontend/app/(dashboard)/settings/password/page.tsx`:
- Replaced `useSession()` provider check with `useQuery(['profile'])` → `profile.has_password`
- `has_password === false`: shows `SetPasswordForm` (no current password field, calls `authApi.setPassword`)
- `has_password === true`: shows `ChangePasswordForm` (existing 3-field form, calls `profileApi.changePassword`)
- Informational banner in `SetPasswordForm` explaining the Google Sign-In context

**CLAUDE.md updated:** Section 5.1 (auth rules), Section 7 (new endpoint), Section 13 (file map), Section 14 (Google OAuth note corrected)

**Verified:** `tsc --noEmit` → 0 errors; `python -m py_compile` on all 5 backend files → OK

---

## What Was Done This Session (2026-04-17 Session 32 — Auth debug: register page fixes)

### Audit: sign-in, sign-out, forgot password, signup

All auth flows were reviewed end-to-end. Backend endpoints verified live (`/api/auth/login`, `/api/auth/forgot-password`, etc. all respond correctly). Sign-out (`signOut({ callbackUrl: "/login" })`) and forgot-password (6-digit code flow) had no bugs. Three bugs were found and fixed in the register page.

### Fix 1: Google sign-up button never worked on register page

`frontend/app/(auth)/register/page.tsx` — The hidden `GoogleLogin` container was `1×1px` with `pointer-events-none`. Google's GIS iframe cannot render a usable button at 1×1px, so clicking the custom "Continue with Google" button had no effect. Fixed by matching the login page's approach: off-screen container at full size (`position: absolute; top: -9999px; left: -9999px; width: 340px; height: 44px; overflow: hidden`) so the GIS iframe renders correctly and the programmatic `.click()` lands on the button.

### Fix 2: Missing CSRF retry in storeSession()

`frontend/app/(auth)/register/page.tsx` — `storeSession()` called `signIn("jwt", ...)` once with no retry. On fresh page loads the NextAuth CSRF token may not be ready, causing intermittent "Account created but sign-in failed" errors. Added the same 600ms retry that already exists in the login page's `storeSession()`.

### Fix 3: router.refresh() race condition after register

`frontend/app/(auth)/register/page.tsx` — Both the email and Google sign-up handlers called `router.push("/dashboard")` then immediately `router.refresh()`. The refresh re-ran middleware before the session cookie was stable. Removed both `router.refresh()` calls (same fix applied to the login page in Session 8).

---

## What Was Done This Session (2026-04-17 Session 31 — Mobile auth logo fix)

### Fix: login/register pages had no logo on mobile; wrong placement on auth pages

**Problem 1:** `AuthCard` had a top-left mobile brand bar (logo + "BahasaBot" text as a row) sitting above the form area — visually disconnected from the page heading and too small/peripheral.

**Problem 2:** After moving it, placing the logo in `auth-card.tsx` above `{children}` caused a double-logo on `forgot-password` and `reset-password` pages which already had their own logos inside the form.

**Fix:**
- `frontend/components/ui/auth-card.tsx` — removed the mobile brand bar entirely; form panel is now clean with no logo of its own
- `frontend/app/(auth)/login/page.tsx` — added `lg:hidden` logo + "BahasaBot" wordmark (`text-2xl font-bold`) centered directly above the "Welcome back" heading, with `mb-6` spacing
- `frontend/app/(auth)/register/page.tsx` — same block added above "Create account" heading
- `forgot-password` and `reset-password` pages — untouched, their existing logos remain

Result: on mobile, login and register show a centered logo + "BahasaBot" text above the form heading. On desktop, the left branding panel handles the logo — no change.

---

## What Was Done This Session (2026-04-17 Session 30 — UI Tour dark-theme styling)

### Fix: driver.js tour popover uses default white theme (doesn't match dark UI)

The UI tour popover rendered with driver.js default styles — white background, dark text, grey borders, white arrow — clashing with the BahasaBot dark botanical palette.

**`frontend/app/globals.css`**: Added a `/* Driver.js tour */` CSS override block at the end of the file that re-themes every part of the driver.js popover to match the dark UI:

| Element | Change |
|---|---|
| Popover background | White `#fff` → dark card `#2e2b22` |
| Popover border | None → `1px solid #4a4636` + layered box-shadow with olive glow |
| Popover border-radius | `5px` → `12px` |
| Title text | Near-black `#2d2d2d` → warm cream `#ede4d4` |
| Description text | Dark grey → muted warm grey `#a8a096` |
| Progress text ("3 of 8") | Mid grey `#727272` → dimmed `#6b6456` |
| Back / Done buttons | White box → ghost (transparent bg, `#4a4636` border, `#c8bfa8` text) |
| Next button | White box → olive green `#8a9f7b` bg (matches `--primary`), dark text |
| Close (×) button | Dark grey → dimmed `#6b6456`, brightens to `#ede4d4` on hover |
| Arrow | White `#fff` → `#2e2b22` (matches popover bg so arrow blends seamlessly) |
| Overlay opacity | 55% → 72% |

All overrides use `!important` to beat driver.js's own `all: unset` button resets. Arrow is overridden via `.driver-popover-arrow { border-color: #2e2b22 !important }` — the side-specific classes that make 3 of 4 border sides transparent still apply on top, leaving the correct directional arrow visible.

---

## What Was Done This Session (2026-04-15 Session 29 — Hide scrollbars site-wide)

### Fix: scrollbar visible on all pages (desktop)

The `@media (pointer: fine)` block in `globals.css` rendered a thin olive-themed scrollbar on every scrollable element for mouse users. Changed it to match the existing mobile rule — `scrollbar-width: none`, `-ms-overflow-style: none`, and `display: none` on the webkit pseudo-element. Content on every page remains fully scrollable; no visible scrollbar chrome on any device.

**`frontend/app/globals.css`**: replaced the 4-rule desktop scrollbar block with the same universal-hide pattern already used for touch devices.

---

## What Was Done This Session (2026-04-15 Session 28 — Onboarding / UITour race condition fix)

### Fix: driver.js UI tour fires on top of onboarding welcome modal

New users saw both modals simultaneously — the Driver.js spotlight tooltip ("Your navigation hub", 1 of 8) appeared over the blurred onboarding welcome screen, pointing at the sidebar behind it.

**Root cause:** `OnboardingChecker` and `UITourChecker` both react to the same `["profile"]` React Query result. When data first arrives, both `useEffect` hooks fire synchronously. `UITourChecker` reads `blocked=false` (the `setShowOnboarding(true)` from `OnboardingChecker` hasn't applied yet) and schedules a 600ms timer. After 600ms the tour starts even though `showOnboarding` is now `true`.

**`frontend/app/(dashboard)/layout.tsx`**:
- Changed `<UITour active={showTour} ...>` → `<UITour active={showTour && !showOnboarding} ...>`
- The tour's `active` prop is now gated so it can never visually fire while the onboarding modal is present
- When the timer fires during onboarding, `showTour` becomes `true` but `active` stays `false`; the tour starts naturally the moment onboarding closes and `showOnboarding` flips to `false`

---

## What Was Done This Session (2026-04-15 Session 27 — Journey SetupModal dismissible)

### Fix: SetupModal blocks all navigation when user has no roadmap

After deleting a roadmap, the `SetupModal` auto-opened with no way to close it. The sidebar was visible but the modal card covered the content area and there was no X button, forcing the user to create a roadmap immediately or be stuck.

**`frontend/app/(dashboard)/journey/page.tsx`**:
- Added `onDismiss: () => void` to `SetupModalProps`.
- Added X (`<X />`) button in the modal header (top-right of the `bg-primary/10` header bar) that calls `onDismiss`.
- Added `showSetupModal` state (default `true`) to the main `JourneyPage` component.
- No-roadmap render block now:
  - Wraps `<SetupModal>` in `{showSetupModal && ...}` — dismissing hides the modal and restores full page access.
  - Shows a "Create My Roadmap" `<Sparkles>` button in the empty-state placeholder when `showSetupModal=false`, so the user can reopen the modal whenever ready.
- Behaviour unchanged for first visit — modal still auto-shows on page load.

---

## What Was Done This Session (2026-04-15 Session 26 — Google button full-size fix, gender/age onboarding + personalised banner)

### Fix 1: Google Sign-In button dead-click bug

Root cause: Google Identity Services renders the Sign-In button inside a cross-origin `<iframe>` from `accounts.google.com`. A programmatic `.click()` on an iframe fires at coordinate (0, 0) of the iframe element. The hidden container was `width:1px; height:1px`, so the button rendered at its natural size (≈300×44px) but its centre was far outside the (0,0) hit-point — every custom-button click missed.

**Fix (`frontend/app/(auth)/login/page.tsx`)**:
- Changed hidden container positioning from `width:1; height:1` (1px box) to:
  ```tsx
  position: "absolute", top: "-9999px", left: "-9999px",
  width: "340px", height: "44px", overflow: "hidden"
  ```
  The container is now offscreen but full-size, so the iframe button is centred and its (0,0) hit point overlaps the actual button element. Click path: custom-styled button → `gsiButtonRef.current.click()` → 340×44 hidden iframe → Google Sign-In button centred inside it → OAuth popup opens.

### Feature: Collect gender + age range in onboarding for personalised roadmap banners

**Problem:** Roadmap banner images were generating a generic young woman figure regardless of user demographics. Gemini defaults to that archetype without an explicit subject description.

**Solution (8 files):**

1. **`backend/models/user.py`** — added `gender: Mapped[str | None]` and `age_range: Mapped[str | None]` nullable columns.

2. **`backend/db/migrations/versions/20260415_2200_add_gender_age_range.py`** — Alembic migration (rev `f3a4b5c6d7e8`, down_rev `e2f3a4b5c6d7`). Adds `gender VARCHAR(20) NULL` and `age_range VARCHAR(20) NULL` to users table. Run `alembic upgrade head` to apply.

3. **`backend/schemas/profile.py`** — `gender: str | None` and `age_range: str | None` added to both `ProfileResponse` and `ProfileUpdateRequest`.

4. **`backend/routers/profile.py`** — PATCH handler now writes `gender` and `age_range` when present in request body.

5. **`frontend/lib/types.ts`** — `UserProfile` gets `gender: string | null` and `age_range: string | null`; `ProfileUpdatePayload` gets `gender?: string | null` and `age_range?: string | null`.

6. **`frontend/components/onboarding/OnboardingModal.tsx`** — New Step 2 "Tell us about yourself":
   - `TOTAL_STEPS` bumped 7 → 8; gender/ageRange state added.
   - `GENDER_OPTIONS`: Male / Female / Non-binary / Prefer not to say.
   - `AGE_OPTIONS`: Under 18 / 18–24 / 25–34 / 35–44 / 45+.
   - Both use pill-button grids (same style as WhyLearning step). Both are optional — user can skip.
   - All subsequent steps renumbered (old 2→3 through old 7→8). `buildProfilePayload()` includes `gender` and `age_range`.

7. **`backend/services/journey_service.py`** — `_fetch_user_context()` now SELECTs `User.gender` and `User.age_range` and returns them in the context dict. `generate_roadmap()` passes `gender=ctx.get("gender")` and `age_range=ctx.get("age_range")` to the banner background task.

8. **`backend/services/image_service.py`** — `generate_journey_banner()` signature gains `gender: str | None = None` and `age_range: str | None = None`. Prompt now builds a specific subject string:
   ```python
   gender_map = {"male": "a male student", "female": "a female student", ...}
   age_map = {"18-24": "young adult", "25-34": "adult", "45+": "mature adult", ...}
   subject = f"{age} {gender}".strip()  # e.g. "adult male student"
   # → "The central figure is adult male student studying Malay with enthusiasm."
   ```
   Safe null fallback: if either field is missing, `subject_gender` defaults to `"a student"`.

**Rule unchanged:** banner is still generated only once per roadmap — no regeneration if `banner_image_url` already exists. Existing users who want gender-personalised banner must delete and regenerate their roadmap.

### ⚠️ Manual action required after this session
- Run `alembic upgrade head` on the backend to apply migration `f3a4b5c6d7e8` (gender + age_range columns).
- Restart the uvicorn process after migration so the new ORM column mappings are loaded.

---

## What Was Done This Session (2026-04-15 Session 25 — Modal lock, banner GC, Google OAuth hardening)

### Fix 1: Onboarding & Journey modal navigation lock

Both `OnboardingModal` and the Journey `SetupModal` used `fixed inset-0` backdrop divs with no `pointer-events-none`. This captured all pointer events across the viewport, blocking sidebar navigation while the modal was visible.

- **`frontend/components/onboarding/OnboardingModal.tsx`**: Outer backdrop div gets `pointer-events-none`; inner card gets `pointer-events-auto`. Applied to both the step-wizard render path and the loading-screen path. Added `onSkip={skip}` + `loading={saving}` to Step 1 so users have an explicit escape hatch from the very first screen (previously Step 1 had no Skip).
- **`frontend/app/(dashboard)/journey/page.tsx`** (`SetupModal`): Same `pointer-events-none` + `pointer-events-auto` pattern on backdrop/card.
- **UITour**: No change needed — `UITourChecker` already uses `blocked={showOnboarding}` to prevent the driver.js tour from starting while the onboarding modal is open.

### Fix 2: Roadmap banner generation — asyncio GC + cache invalidation

Two root causes made banner images fail non-deterministically:

1. **GC cancellation**: `asyncio.create_task()` returns a task with no strong reference. Python GC can collect (and silently cancel) the task during the 17–90 s Gemini image request.
2. **Cache not invalidated**: After `_generate_and_save_banner` saved `banner_image_url` to the DB, it never called `cache_delete` on the roadmap Redis key. Users saw `banner_image_url=null` for up to 1 hour (the cache TTL) even when the URL was correctly stored.

**`backend/services/journey_service.py`**:
- Added module-level `_background_tasks: set[asyncio.Task]` and `_fire_background(coro)` helper — keeps a strong reference per Python docs recommendation.
- Replaced both `asyncio.create_task()` calls (banner generation at line ~341, timeline notifications at `get_roadmap`) with `_fire_background()`.
- `_generate_and_save_banner` now accepts `roadmap_id: UUID, user_id: UUID` (UUID objects, not strings) and calls `cache_delete(_ROADMAP_CACHE_KEY.format(user_id))` immediately after a successful DB commit.

### Fix 3: Google OAuth production hardening

Two root causes: (a) `NEXT_PUBLIC_GOOGLE_CLIENT_ID` not set in Vercel env vars → `GoogleOAuthProvider clientId=""` → Google returns `invalid_request: missing client_id`; (b) Vercel deployment URL not in Google Cloud Console authorized origins → `400: origin_mismatch`.

- **`frontend/components/providers.tsx`**: `console.error` fires at app startup when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is absent, surfacing the misconfiguration before users encounter a cryptic Google error.
- **`frontend/app/(auth)/login/page.tsx`**: `GOOGLE_CLIENT_ID_PRESENT` boolean guards the `<GoogleLogin>` component render — when the env var is absent, the component is never mounted (preventing the Google SDK error), and the visible button is `disabled` + `cursor-not-allowed` with a descriptive tooltip. No more silent failure.
- **Remaining manual steps**: Add Vercel URL to Google Console authorized origins; add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to Vercel env vars; redeploy. (See ⚠️ section above.)

---

## What Was Done This Session (2026-04-15 Session 24 — Dashboard + Journey mobile layout fixes)

### Dashboard mobile layout

Fixed horizontal overflow and content clipping at 375px viewport:

- **StatsCards.tsx**: grid `gap-2 sm:gap-4`; outer wrapper `p-1.5 sm:p-2`; inner card `p-2.5 sm:p-5`; icon `p-1.5 sm:p-2`; all icons `h-3.5 w-3.5 sm:h-4 sm:w-4`; label `text-[9px] tracking-wide sm:tracking-widest leading-tight`; value `text-xl sm:text-3xl`; description `text-[10px] sm:text-xs leading-tight`; shorter description strings for Quizzes/Streak/XP cards; `min-w-0` on text container.
- **dashboard/page.tsx**: h1 `text-2xl sm:text-3xl`; subtitle `text-sm sm:text-base break-words`; tabs div gets `w-full` and button px tightened to `px-2.5 sm:px-4`.

### Journey mobile layout

Fixed zigzag overflow and title clipping at 375px viewport:

- **journey/page.tsx**: outer container `px-3 pt-4 pb-4 sm:p-6` (was `p-3`).
- **ObstacleNode**: `containerClass` now always `flex-row` on mobile, zigzag (`sm:flex-row-reverse`) only on `sm+`; gap `gap-3 sm:gap-4`.
- Card: `min-w-0 p-3 sm:p-4` (was `p-4`) to prevent flex-1 card from overflowing.
- Topic title: `line-clamp-2 break-words` (was `truncate`) — full titles now wrap instead of being cut with ellipsis.
- Progress card: `p-3 sm:p-4`; top row `gap-2 min-w-0` with `shrink-0` on percentage; deadline row `items-start flex-wrap break-words` so long date strings wrap.
- Header: `gap-3`, inner div `min-w-0 flex-1`; h1 `text-xl sm:text-2xl`; goal `break-words`.

---

## What Was Done This Session (2026-04-14 Session 21 — Enhanced onboarding + first-login UI tour)

### Feature 1: Enhanced Onboarding Questionnaire

Extended the existing 5-step onboarding modal to a 7-step questionnaire that collects richer user context and automatically generates a learning roadmap on completion.

**New steps (replacing old static Tour + Journey CTA steps):**
- Step 3: Why learning Malay → radio button selection; maps to `JourneyIntent` for roadmap API
- Step 4: Current Malay level → BPS-1–4 selector
- Step 5: Your goal → free-text textarea (300 chars)
- Step 6: Timeline → 6-button grid (1–6 months) for `timeline_months`
- Step 7: Daily study time → radio buttons (15min / 30min / 1hr / 2hr+); primary CTA = "Generate My Roadmap"

**Roadmap auto-generation flow:**
1. PATCH /api/profile/ with all collected data + `onboarding_completed=true`
2. POST /api/journey/roadmap/generate (mapped from questionnaire answers)
3. Loading screen shown while generating (progress bar animation, ~15s)
4. Success → `onComplete("roadmap_ready")` → layout shows sonner success toast
5. Error → `onComplete("done")` after 3s delay — onboarding still completes

**Skip at any step:** saves whatever was collected + `onboarding_completed=true`, no roadmap generated.

**Files changed:** `frontend/components/onboarding/OnboardingModal.tsx` (full rewrite), `frontend/app/globals.css` (roadmap-progress keyframe)

### Feature 2: First-Login UI Tour

Driver.js spotlight tour that shows once after onboarding completes, walking users through 8 key UI sections.

**DB:** `has_seen_tour BOOLEAN NOT NULL DEFAULT false` added to users table via Alembic migration `e2f3a4b5c6d7`.

**Tour steps:** Sidebar (overall) → Dashboard → AI Tutor → Courses → Quiz → My Journey → Games → Settings. Each step uses a `data-tour="nav-{section}"` attribute on the corresponding sidebar `<div>` wrapper (added to `AppSidebar.tsx`).

**Flow:** `UITourChecker` in `layout.tsx` reads `has_seen_tour` from the shared `["profile"]` React Query cache. It fires only after `showOnboarding=false`. When tour finishes or is skipped, `handleTourDone()` PATCHes `has_seen_tour=true`.

**Files changed:**
- `backend/db/migrations/versions/20260414_2100_add_has_seen_tour.py` — Alembic migration
- `backend/models/user.py` — `has_seen_tour` mapped column
- `backend/schemas/profile.py` — `has_seen_tour` in both ProfileResponse and ProfileUpdateRequest
- `backend/routers/profile.py` — PATCH handler for `has_seen_tour`
- `frontend/lib/types.ts` — `has_seen_tour` in UserProfile and ProfileUpdatePayload
- `frontend/components/nav/AppSidebar.tsx` — `data-tour` attributes on aside + nav item divs
- `frontend/components/onboarding/UITour.tsx` — new component (driver.js, 8 steps)
- `frontend/app/(dashboard)/layout.tsx` — `UITourChecker`, `OnboardingResult` type, sonner toast, `useQueryClient`
- `frontend/components/providers.tsx` — `<Toaster />` from sonner

**New packages:** `sonner@^2.0.7`, `driver.js@^1.4.0`

---

## What Was Done This Session (2026-04-15 Session 23 — Forgot password + global mobile scrollbar hide)

### Fix: Mobile Scrollbar Hidden Globally

**Problem:** A visible scrollbar track/thumb was showing on the right side of all pages (Dashboard, Courses, and any scrollable page) on mobile view. The existing global CSS forced a `width: 6px` scrollbar via `::-webkit-scrollbar` and `scrollbar-width: thin` on all elements, overriding the browser's native "no scrollbar on touch" behaviour.

**Fix — `frontend/app/globals.css`:**
- Wrapped the existing themed scrollbar rules in `@media (pointer: fine)` — this targets desktop/mouse users only. Mouse-driven browsers get the slim 6px olive-themed scrollbar as before.
- Added `@media (pointer: coarse)` block that applies `scrollbar-width: none`, `-ms-overflow-style: none`, and `display: none` / `width: 0` on `::-webkit-scrollbar` to ALL elements on touch/mobile devices. Pages remain fully scrollable via touch gestures — only the visual track is hidden.
- Added `@layer utilities { .scrollbar-none { ... } }` — defines the `.scrollbar-none` CSS utility class used in the dashboard tab bar and anywhere else it's referenced in the codebase (the Tailwind config has no scrollbar plugin, so this was silently missing).

**Scope:** Single file change (`globals.css`) fixes every page globally — Dashboard, Courses, Chatbot, Journey, Settings, Auth pages, etc.

---

## What Was Done This Session (2026-04-15 Session 23 — Forgot password: 6-digit code flow)

Replaced the old "click-a-link" forgot-password flow with a modern 6-digit verification code flow. No DB schema changes required (reused `password_reset_tokens` table).

**Backend — 5 files changed:**

`backend/schemas/auth.py`:
- Added `VerifyResetCodeRequest(email, code)` + `VerifyResetCodeResponse`
- Changed `ResetPasswordRequest` from `{token, new_password}` to `{email, code, new_password}` — `email` is needed to reconstruct the `SHA256(email:code)` hash

`backend/services/email_service.py`:
- Replaced `send_reset_email(to, reset_token)` with `send_reset_email(to, code)`
- Email template now shows a large styled 6-digit code box instead of a "Reset Password" button
- Subject line: `"{code} is your BahasaBot verification code"`

`backend/routers/auth.py`:
- `POST /forgot-password` — generates `secrets.randbelow(1_000_000)` zero-padded to 6 digits; stores `SHA256(email.lower():code)`; TTL 10 min (was 15 min); calls new `send_reset_email(email, code)`
- `POST /verify-reset-code` (new) — validates hash + expiry + used; returns 200 if valid; does NOT mark as used (read-only check)
- `POST /reset-password` — validates hash + expiry + used again (atomic); marks used, updates bcrypt hash
- Added `_make_code_hash(email, code)` helper; imported new schemas

`frontend/app/(auth)/forgot-password/page.tsx`:
- Full rewrite as 4-step single-page component:
  - Step 1 (Email): email input, sends code, Google guard message
  - Step 2 (Code): 6 individual digit input boxes, handles paste, auto-advances focus; 60s resend cooldown; calls `/verify-reset-code`
  - Step 3 (Password): new password + confirm, calls `/reset-password` with email+code+password
  - Step 4 (Success): checkmark, auto-redirect to /login after 4s
- Progress bar shows 3 steps (email/code/password); step-specific title + subtitle

`frontend/app/(auth)/reset-password/page.tsx`:
- Replaced with a simple "links no longer supported" page that auto-redirects to `/forgot-password` in 3s

**End-to-end verified:**
1. `POST /forgot-password` → 200 (email/password account) ✅
2. `POST /forgot-password` → 400 `google_account_no_password` (Google account) ✅
3. `POST /forgot-password` → 200 (non-existent email, enumeration protection) ✅
4. `POST /verify-reset-code` correct code → 200 ✅
5. `POST /verify-reset-code` wrong code → 400 ✅
6. `POST /reset-password` → 200, password updated ✅
7. Code reuse blocked → 400 ✅
8. `POST /login` with new password → 200 ✅

---

## What Was Done This Session (2026-04-14 Session 22 — Mobile/responsive UI fixes)

13 targeted mobile/responsive fixes applied to the frontend. No backend changes.

**FIX 1 — Auth card mobile (auth-card.tsx):**
- Mobile logo size increased: w-8→w-12, h-8→h-12, sizes="32px"→"48px"
- Logo bar padding: `gap-2.5 px-8 pt-10` → `gap-3 px-6 pt-8`; brand text: `text-sm` → `text-base`
- Right panel: `min-h-screen` → `lg:min-h-screen min-h-[100dvh]`; `bg-black/50 backdrop-blur-2xl` → `bg-black/60 backdrop-blur-xl`; added `lg:rounded-none sm:rounded-none`
- Form container: `px-8 py-10` → `px-6 sm:px-8 py-6 sm:py-10`

**FIX 2 — Fresh chat on login (login/page.tsx):**
- After storeSession() succeeds in both `onSubmit` and `handleGoogleSuccess`, clears `chatbot_messages` and `chatbot_session_id` from sessionStorage before setTheme/redirect.

**FIX 3 — Fresh chat on register (register/page.tsx):**
- Same sessionStorage clear in both `onSubmit` and `handleGoogleSuccess` before `router.push("/dashboard")`.

**FIX 4 — Chatbot textarea mobile (chatbot/page.tsx):**
- Added `autoComplete="off"`; responsive padding/text size; minHeight 48→44px; footer responsive padding.

**FIX 5 — Chat text size (ChatMessage.tsx):**
- User + assistant message text: `text-base` → `text-sm sm:text-base`

**FIX 6 — Dashboard mobile (dashboard/page.tsx):**
- Outer container: added responsive px/py/spacing + `overflow-x-hidden`
- Tabs: `overflow-x-auto scrollbar-none`; tab buttons: responsive px/text + `whitespace-nowrap flex-shrink-0`

**FIX 7 — StatsCards mobile (StatsCards.tsx):**
- Card inner: `gap-4 p-5` → `gap-3 sm:gap-4 p-3 sm:p-5`; stat value: `text-3xl` → `text-2xl sm:text-3xl`; label: `text-xs` → `text-[10px] sm:text-xs`

**FIX 8 — Courses card mobile (courses/page.tsx):**
- Cover/placeholder height: `h-32` → `h-24 sm:h-32`; card padding: `p-5 space-y-3` → `p-3 sm:p-5 space-y-2 sm:space-y-3`

**FIX 9 — Settings page padding (settings/page.tsx):** `py-8` → `py-6`

**FIX 10 — Journey overflow (journey/page.tsx):** Active roadmap container: added responsive padding + `overflow-x-hidden`

**FIX 11 — Sidebar mobile (AppSidebar.tsx):**
- Hamburger + close buttons: `p-2` → `p-2.5`, added 44px min touch targets
- Mobile header logo: wrapped in `<Link href="/dashboard">`
- Nav links: `py-2.5` → `py-3`, added `min-h-[44px]`
- Drawer width: `w-64` → `w-[280px]`

**FIX 12 — Settings sub-pages:** All four (profile, password, about, feedback) already had correct back buttons to `/settings`. No changes required.

**FIX 13 — Courses header mobile (courses/page.tsx):**
- `items-center justify-between` → `items-start justify-between gap-3`; H1 `text-3xl` → `text-2xl sm:text-3xl`; subtitle `text-sm` → `text-xs sm:text-sm`; button: added `shrink-0`

---

## What Was Done This Session (2026-04-14 Session 19 — Course deduplication + clone system)

### Feature: Course Deduplication + Clone System (Phase 24)

**Problem:** Every user who requested the same or similar topic triggered a full Gemini generation pipeline (~30–60 s, multiple API calls), burning tokens unnecessarily. With 30 evaluation users, popular topics like "ordering food" could be generated 10+ times identically.

**Design:** Template + clone model. The first user to generate a given topic+level combination becomes the template. All subsequent users get a deep clone of the template in milliseconds, with no Gemini calls at all.

**Schema (migration `d1e2f3a4b5c6`):**
- `courses.topic_slug VARCHAR(600)` — normalised `"topic:level"` lookup key (e.g. `"ordering-food-at-a-restaurant:bps1"`)
- `courses.is_template BOOLEAN NOT NULL DEFAULT false` — marks the canonical reusable version
- `courses.cloned_from UUID FK courses.id SET NULL` — traceability: which template was cloned
- Index on `topic_slug` for fast template lookup on every generate request

**backend/models/course.py:**
- Added three mapped columns (`topic_slug`, `is_template`, `cloned_from`); added `Boolean` to SQLAlchemy imports

**backend/services/course_service.py:**
- `_make_topic_slug(topic, level)` — lowercase + strip non-alphanum + normalise whitespace → stable slug, capped at 600 chars
- `_find_template(slug, db)` — single SELECT with `selectinload` of modules+classes; returns `None` if no template exists yet
- `_clone_course(template, user_id, db)` — snapshots all template data into plain dicts first (avoids SQLAlchemy session-expiry issues mid-flush), then inserts new `Course` / `Module` / `Class` rows; copies `cover_image_url` directly (no regeneration); never touches any user-specific data (no progress, quizzes, vocabulary)
- `generate_course()` — now starts with slug computation + `_find_template()` check:
  - **Fast path (clone):** template found → `_clone_course()` → job hits 100% near-instantly (~ms)
  - **Slow path (generate):** no template → full Gemini pipeline → after `save_course()`, re-checks for a concurrent template; if still none, marks itself as template with `is_template=True`; if race condition produced a second template, saves as user copy instead (harmless)
- Job progress messages updated: clone path shows "Checking existing courses…" → "Found a matching course — personalising for you…" → "Course ready!"

**No frontend or router changes** — `generate_course()` returns a `Course` ORM object either way; the background task flow, notification, and API response are identical.

**Migration applied:** `alembic upgrade head` confirmed `d1e2f3a4b5c6` applied successfully; all three columns verified in DB.

---

## What Was Done This Session (2026-04-14 Session 18 — XP/streak fixes + user feedback + notification bell UX)

### Fix 1: XP and Streak display not updating

**Root causes:**
- Dashboard `useEffect` ran once on mount — if user earned XP in another tab/chatbot, dashboard showed stale data until hard refresh
- Sidebar profile `staleTime: 60_000` meant XP/streak could lag 60 s behind real DB values
- `bps_milestone` notification type had no entry in `NotificationBell.tsx` titleMap (showed as "Notification") and no icon in `notification-popover.tsx`

**Fixes:**
- `dashboard/page.tsx` — extracted `fetchSummary` into `useCallback`, added `window focus` + `visibilitychange` listeners with 30 s throttle so XP/streak refresh when user tabs back from chatbot/quiz
- `AppSidebar.tsx` — `staleTime: 60_000 → 30_000`, added `refetchOnWindowFocus: true`
- `NotificationBell.tsx` — added `bps_milestone: "Level Up!"` to titleMap
- `notification-popover.tsx` — added `TrendingUp` icon for `bps_milestone`

### Fix 2: User feedback form in Settings

Users had no way to submit general feedback outside of quiz surveys; only admins could see evaluation responses.

**Built:**
- `backend/schemas/evaluation.py` — `quiz_type` Literal extended to include `"general"`
- `frontend/lib/types.ts` — `FeedbackPayload` + `AdminFeedbackItem` updated to include `"general"`
- `frontend/app/(dashboard)/settings/feedback/page.tsx` — new page: star rating (1–5) + relevance selector + optional textarea → `POST /api/evaluation/feedback` with `quiz_type="general"`
- `frontend/app/(dashboard)/settings/page.tsx` — "Send Feedback" entry added with `MessageSquarePlus` icon
- `frontend/app/(dashboard)/admin/feedback/page.tsx` — "General" badge shown for general feedback; header/empty-state text updated
- `frontend/app/(dashboard)/admin/page.tsx` — section label "Evaluation Feedback" → "User Feedback"

### Fix 3: Notification bell — placement + clear-all

**Problem:** Bell floated as a fixed overlay at `top-3 right-14 / top-5 right-5` — not part of any standard UI element.

**Backend:** `DELETE /api/notifications/` endpoint added to `routers/notifications.py` — deletes all notifications for current user.

**Frontend:**
- `frontend/lib/api.ts` — `notificationsApi.clearAll()` added
- `notification-popover.tsx` — `panelSide` prop ("left"=right-0 / "right"=left-0), `panelDirection` prop ("down"=below / "up"=above), `onClearAll` prop + "Clear all" button with `Trash2` icon
- `NotificationBell.tsx` — removed fixed-position wrapper; now an inline component; accepts `panelSide` + `panelDirection`; calls `notificationsApi.clearAll()` on clear
- `layout.tsx` — `<NotificationBell />` import + render removed
- `AppSidebar.tsx` — bell integrated in three spots:
  - Mobile header: between logo and ThemeToggle (`panelSide="left"` / `panelDirection="down"`)
  - Desktop expanded footer: right of username row (`panelSide="right"` / `panelDirection="up"`)
  - Desktop collapsed footer: above streak row (`panelSide="right"` / `panelDirection="up"`)

---

## What Was Done This Session (2026-04-14 Session 17 — Chatbot performance + UX + post-login bug fixes)

### Bug 1: Dashboard blank/error on first visit after login

**Root cause:** `dashboard/page.tsx` fired `getSummary()` immediately on mount with no check on session readiness. Right after `router.push("/dashboard")` from login, the NextAuth session token might not be fully propagated yet, causing a 401 on the first API call.

**Fix:** Added `useSession` to dashboard page. The `useEffect` that fetches summary now has `[status]` dependency and early-returns when `status !== "authenticated"`, ensuring the API call only fires once the session is confirmed.

### Bug 2: Chatbot background animation showing dark mode after login

**Root cause:** The login page was calling `localStorage.setItem("theme", "light")` and `document.documentElement.classList.remove("dark")` directly — which updates the DOM and localStorage but NOT the React `ThemeContext` state (which lives in `Providers`, mounted once for the entire SPA session). After SPA navigation to the chatbot, `useTheme()` returned the stale `"dark"` state, so `Waves` rendered with dark colors despite the user being in light mode.

**Fix:** Added `setTheme(t: Theme)` to `ThemeContextValue` and `useThemeState`. Login page now calls `setTheme("light")` instead of raw DOM manipulation — this updates React state + localStorage + DOM class atomically.

### Bug 3: Chatbot slow first-token delay (~4.5s) + UX improvements

**Root causes:**
- RAG embedding + pgvector search runs on every message: ~500ms warm / ~1500ms cold
- Module-level `ChatGoogleGenerativeAI` and `GoogleGenerativeAIEmbeddings` instances recreated on every request
- Frontend showed empty bubble with just a cursor while waiting 4+ seconds for first token
- No early signal to frontend that the server received the request

**Fixes:**
- **`backend/services/gemini_service.py`** — Converted `_chat_llm()`, `_chatbot_llm()`, and `_embeddings_model()` to module-level singletons (created once per process, reused across requests). Keeps HTTP connection pool warm.
- **`backend/services/langchain_service.py`** — Added `_get_rag_context()` with Redis caching (5-min TTL, key = `rag:ctx:{sha256(message[:150][:16])}`). On cache hit, skips entire embedding+pgvector path. Saves ~1.3 seconds on repeated/similar queries (confirmed: 4477ms cold → 3177ms warm). Reduced `HISTORY_WINDOW` 10→6 to decrease Gemini input tokens.
- **`backend/routers/chatbot.py`** — Added `{"type":"ping"}` as the first yield in `event_generator`. Arrives at client ~800-1000ms after request, before RAG+LLM completes.
- **`frontend/components/chatbot/ChatMessage.tsx`** — Shows 3-dot bouncing animation when `isStreaming=true` AND `content=""` (waiting for first token), then switches to blinking cursor once text starts flowing.
- **`frontend/app/(dashboard)/chatbot/page.tsx`** — Added `"ping"` to the SSE event type union; `ping` events are skipped (they exist only to trigger the typing animation via the empty assistant message).

**Verified test results (local):**
- Ping event arrives: ~800ms after request
- Cold RAG + Gemini TTFT: ~4.5s (unchanged — Gemini's inherent latency)
- Warm RAG cache + Gemini TTFT: ~3.2s (1.3s improvement)
- Chatbot reply: ✅ confirmed working for standard Malay learning queries

---

## What Was Done This Session (2026-04-13 Session 16 — Journey obstacle → existing course + layout border clashing fix)

### Bug 1: Journey obstacle always opens course generation even if course already exists

**Root cause:** `get_roadmap()` in `journey_service.py` was returning elements straight from the JSONB column without populating `exists` or `course_id`. The `handleObstacleClick` handler on the journey page was already checking for those fields (CASE 1/2) but they were always `undefined`, so it always fell through to CASE 4 (generate new course).

**Fixes:**
- **`backend/services/journey_service.py`** — `get_roadmap()` now queries the user's `courses` table after fetching the roadmap. For each element it fuzzy-matches the element `topic` against `course.topic` and `course.title` (fuzzywuzzy `token_sort_ratio ≥ 70`). Matching elements are enriched with `exists: true` and `course_id`. Non-matching get `exists: false, course_id: null`. Added `from backend.models.course import Course` import.
- **`backend/services/course_service.py`** — `save_course()` now calls `cache_delete(f"journey:{user_id}")` after committing the new course, so the 1-hour journey Redis cache is invalidated immediately. Added `cache_delete` to imports.
- **`frontend/app/(dashboard)/courses/page.tsx`** — Safety net: when `?generate=<topic>` URL param arrives, waits for the course list to load, then checks for a matching topic (case-insensitive substring match). If found, navigates to `courses/${existing.id}` instead of opening the generation modal. Added `useRouter` import and `pendingGenerateTopic` state.

### Bug 2: Completing a course was not marking the obstacle as completed

**Root cause:** `_check_course_completion_for_journey()` in `quiz_service.py` was passing `course.title` (the AI-generated title, e.g. "Hello Melayu: A Beginner's Guide to Greetings") to `check_roadmap_progress()`. The fuzzy matcher then compared this creative title against the element topic (e.g. "Greetings and Self-Introduction") — often scoring below the 70% threshold. The `course.topic` field holds the raw input string (identical or near-identical to the element topic) and would match much better.

**Fix:** Changed the `check_roadmap_progress()` call to pass `course.topic or course.title` — uses raw topic string as primary match, falls back to title only if topic is empty.

### Bug 3: Chat page and quiz page elements clashing with viewport border

**Root cause:** `PageTransition` used `initial={{ opacity: 0, y: 16 }}`. A CSS `transform: translateY(16px)` shifts the element's *visual* position without affecting layout. For pages that fill the full viewport height (e.g. chatbot: `flex-1 min-h-0` chain), the entire content was visually 16px too low — pushing the chatbot footer and quiz bottom elements past the viewport edge, making them appear clipped against the border.

Additionally, without `min-h-0` on the `motion.div`, the flex height chain (`main → motion.div → chatbot-div`) was not properly bounded, allowing the chatbot's internal scroll to break.

**Fix:** **`frontend/components/layout/PageTransition.tsx`** — removed `y` translation entirely (opacity-only fade: `initial={{ opacity: 0 }} → animate={{ opacity: 1 }}`); reduced duration to 0.2s; added `style={{ minHeight: 0 }}` to ensure `min-h-0` is applied to the motion.div and the flex height chain stays intact.

---

## What Was Done This Session (2026-04-13 Session 15 — Post-login animation bug fix + dashboard query optimization)

### White screen bug root cause
The curtain (`showCurtain` state) started as `false`, so the dashboard's PageTransition was already fading in (opacity 0→1). The `useEffect` then fired and SET `showCurtain = true`, which slapped a fully-opaque `bg-background` div on top of the already-visible content — causing the white flash the user saw. This is the opposite of what a curtain should do.

### Fixes
**`frontend/app/(dashboard)/layout.tsx`** — removed the entire curtain: `showCurtain` state, `useEffect`, `AnimatePresence`, `motion` import, and the overlay `motion.div`. The PageTransition with `key={pathname}` already plays a 0.3s fade-in + slide-up on every navigation including the post-login arrival at `/dashboard`. No extra overlay needed.

**`frontend/app/(auth)/login/page.tsx`** — removed `sessionStorage.setItem("fromLogin", "1")` from both sign-in paths (email + Google). Kept `localStorage.setItem("theme", "light")` + `document.documentElement.classList.remove("dark")` so light mode is always forced on sign-in.

**`backend/services/progress_service.py`** — `get_dashboard_summary()` reduced from **8 sequential DB round-trips to 2** on cache miss:
- Round trip 1: Fetch 3 user columns (proficiency_level, streak_count, xp_total) — was loading the entire User ORM object
- Round trip 2: All 7 aggregate COUNTs (courses, modules, classes, mq, sq, vocab, grammar) in ONE query using scalar subqueries — PostgreSQL evaluates them in parallel internally
- The remaining 4 operations (recent vocab, recent grammar, weak points, quiz history) stay sequential — these return row data, not scalars, and are harder to merge without UNION complexity

### Dashboard loading: confirmed OK
- Dashboard summary: Redis-cached (5-min TTL, `dashboard:summary:{user_id}`) — confirmed in progress_service.py
- Dashboard page: shows proper skeleton loaders immediately (`summaryLoading = true` by default)
- Slowness on first load = Railway/Render free-tier cold start (10-20s) — not a code issue
- After first request, all subsequent loads return in <100ms from Redis

---

## What Was Done This Session (2026-04-13 Session 14 — Performance fixes + Framer Motion)

### Root causes diagnosed
- **Admin page (12–20s):** `profileApi.getProfile()` blocked `adminApi.getStats()` in a sequential `.then()` chain — two full round-trips before anything rendered. Fixed with `Promise.allSettled`.
- **Admin stats endpoint:** 8 sequential DB queries with zero caching. Fixed with 2-min Redis cache (`admin:stats`).
- **General slowness:** Railway/Render free-tier cold start on first request. Sequential calls doubled the cold-start penalty.
- **Journey + Courses:** Already parallel (Promise.allSettled / React Query). Journey service already had Redis cache. Not problematic.

### Backend changes
**`backend/routers/admin.py`** — 2 changes:
- Added `cache_get` / `cache_set` / `cache_delete` import from `backend.utils.cache`
- `GET /stats` now checks `admin:stats` Redis key first; on miss fetches from DB and caches result for 120s

### Frontend changes
**`frontend/components/layout/PageTransition.tsx`** — NEW file:
- `motion.div` with `initial={{ opacity: 0, y: 16 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ duration: 0.3, ease: "easeOut" }}`

**`frontend/app/(dashboard)/layout.tsx`** — 3 changes:
- Added `usePathname` import
- Added `PageTransition` import
- Wrapped `{children}` inside `<PageTransition key={pathname}>` — page fade-in triggers on every navigation

**`frontend/app/(dashboard)/admin/page.tsx`** — 1 change:
- Replaced sequential `.then()` chain with `Promise.allSettled([profileApi.getProfile(), adminApi.getStats()])` — both requests fire simultaneously

**`frontend/app/(dashboard)/journey/page.tsx`** — 2 changes:
- Added `motion` import from `framer-motion`
- Road obstacle container `div` → `motion.div` with `staggerChildren: 0.08`; each node `div` → `motion.div` with `hidden/show` variants (0.3s, easeOut, y: 0→20)

**`frontend/app/(dashboard)/courses/page.tsx`** — 2 changes:
- Added `motion` import from `framer-motion`
- Course grid `div` → `motion.div` with `staggerChildren: 0.08`; each card wrapped in `motion.div` with same variants + `whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}`

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

## What Was Done This Session (2026-04-27 — Chatbot mobile vocab tooltip + assistant bubble fix)

### Chatbot inline Malay words
- **`frontend/components/chatbot/ChatMessage.tsx`** — replaced the browser `title`-only inline Malay word hint with a real fixed-position tooltip that opens on hover/focus for desktop and tap for mobile.
- Tooltip placement is clamped to the viewport, opens below the word when there is not enough space above, and closes on outside tap/click.
- The inline word and speaker icon now use baseline-friendly inline styling so mobile text flow stays aligned instead of reserving broken-looking space.

### Assistant message bubble
- **`frontend/components/chatbot/ChatMessage.tsx`** — restored the assistant response glass bubble with `bg-card/55 backdrop-blur-md`, border, shadow, and left accent line so bot messages visually match the user's blurred message treatment.

### Verification
- `npx tsc --noEmit` passed.
- `npm run lint` could not run non-interactively because Next.js prompts to create an ESLint config in this repo.
- `npm run build` did not complete before the 3-minute command timeout; no TypeScript errors were reported by the targeted check.

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

---

## Session 19 — Sidebar UX + Notification Clear Fix (2026-04-14)

### Notification "Clear All" error fixed
- **`frontend/components/ui/notification-popover.tsx`** — added `catch` block to `handleClearAll`; previously `try/finally` with no `catch` caused API errors to bubble as unhandled rejections → "1 error" toast on screen
- **`frontend/components/notifications/NotificationBell.tsx`** — `handleClearAll` now re-throws so popover's `catch` handles it cleanly; `setItems([])` only called on success

### Sidebar collapse/expand handle
- **`frontend/components/nav/AppSidebar.tsx`** — replaced in-footer collapse/expand text buttons (mis-click prone, too close to Sign Out) with a single circular arrow handle absolutely positioned on the right border at vertical center (`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-[60]`); uses shadcn `Button` variant="outline" size="icon"; shows `←` / `→` chevron; `z-[60]` ensures it sits above main content flex sibling

### Bell + ThemeToggle utility strip
- Moved both icons out of the footer and the logo header into a dedicated utility strip between nav items and footer border
- Both collapsed and expanded states: `justify-center gap-3`; collapsed = `flex-col`, expanded = `flex-row`
- Icon order: ThemeToggle first, NotificationBell second (consistent in desktop strip and mobile header)
- ThemeToggle `icon` variant updated to match NotificationBell button exactly: `w-10 h-10 rounded-full bg-card/90 border border-border shadow-md hover:shadow-lg hover:scale-105` — visually consistent pair
- Logo header enlarged: `width 140→176px`, `h-14→h-16`, full width now that ThemeToggle is removed from that area

---

## Session 20 — Collapse Button Fix + Polish (2026-04-14)

### Collapse handle click reliability fixed
- **`frontend/components/nav/AppSidebar.tsx`** — replaced shadcn `<Button size="icon">` with plain `<button>`; `size="icon"` was injecting `h-9 w-9` into the class list, conflicting with the intended `w-6 h-6` and making hit target unpredictable
- Added `z-[1]` to `<aside>` to create a stacking context above the `<main>` flex sibling; previously the half of the button extending past the border (`translate-x-1/2`) was captured by `<main>`'s paint layer and swallowing click events
- Removed unused `Button` import from shadcn

### Collapsed sidebar scrollbar removed
- `overflow-y-auto` → `overflow-hidden` on nav when `collapsed=true`; in collapsed mode icons never overflow so the scrollbar track was appearing between Settings icon and utility strip for no reason

### Clear All backend verified working
- Identified root cause: backend process was serving stale bytecode from before the `DELETE /api/notifications/` route was added — route showed as only `GET` in OpenAPI spec
- Cleared all `.pyc` files (`find backend -name "*.pyc" -delete`), killed stale process (PID 21312 via PowerShell), restarted with venv python
- End-to-end test confirmed: 4 notifications → `DELETE /api/notifications/` → `{"success":true}` → 0 notifications ✅
- **`frontend/components/ui/notification-popover.tsx`** — `catch` block added so API errors don't surface as unhandled promise rejections ("1 error" toast)

### Feedback page TS fix
- **`frontend/app/(dashboard)/settings/feedback/page.tsx`** — `feedbackApi.submit` → `feedbackApi.submitFeedback` (wrong method name causing runtime error on form submit)
- Zero TypeScript errors confirmed via `tsc --noEmit`

## What Was Done This Session (2026-04-25 Session 48 — Stale-data bug fix + Leaderboard redesign)

### Goal 1 — Fix pages requiring hard reload between navigations

**Root cause:** React Query global `staleTime: 5 * 60 * 1000` (5 min). When navigating to a page visited within 5 min, React Query served cached data without refetching. Any server-side changes (completed class, quiz passed, XP awarded) were invisible until either 5 min elapsed or the user hard-reloaded.

**Fixes:**
1. `frontend/components/providers.tsx` — global `staleTime: 0` (stale-while-revalidate: cached data shown instantly while background refetch runs)
2. `frontend/app/(dashboard)/courses/[courseId]/modules/[moduleId]/classes/[classId]/page.tsx` — class completion `onSuccess` now also invalidates `["courses"]` and `["dashboard"]` (previously only `["course", courseId]` and `["class", ...]`)
3. `frontend/app/(dashboard)/courses/[courseId]/modules/[moduleId]/quiz/page.tsx` — module quiz submission now also invalidates `["courses"]` and `["dashboard"]`
4. `frontend/components/nav/AppSidebar.tsx` — profile `staleTime: 5 min → 60s` (consistent with layout; keeps XP/streak sidebar display fresh)

### Goal 2 — Leaderboard visualization redesign

**Purpose of leaderboard:** Motivate weekly XP earning through social competition. Ranks all learners by XP earned in the current Monday–Sunday window; resets every Monday. Combined with streak tracking, creates a two-dimensional motivation layer.

**Problem with old design:** Flat list with emoji medals — no visual hierarchy, no relative performance context, no urgency around weekly reset.

**New design in `frontend/components/dashboard/LeaderboardCard.tsx`:**
- **Animated podium** (framer-motion): top 3 displayed as 2nd (left) · 1st (centre, tallest) · 3rd (right) — platform height creates natural visual hierarchy; staggered entrance animation
- **Animated XP progress bars** for ranks 4–10: each bar fills from 0 → (user_xp / leader_xp) on mount, giving instant visual comparison context
- **Days-until-reset chip** in header showing countdown to next Monday reset (creates urgency)
- **Current user highlighting**: `ring-2 ring-primary/50` on podium avatar + `bg-primary/10 border border-primary/25` on rank rows
- **Edge cases handled**: <3 entrants (placeholder columns keep #1 centred), outside top-10 (rank shown in footer), no XP yet (empty state), loading (skeleton matches new podium layout)
- `tsc --noEmit`: 0 errors

### Files Changed
- `frontend/components/providers.tsx` — staleTime 5 min → 0
- `frontend/app/(dashboard)/courses/[courseId]/modules/[moduleId]/classes/[classId]/page.tsx` — invalidate courses + dashboard on class complete
- `frontend/app/(dashboard)/courses/[courseId]/modules/[moduleId]/quiz/page.tsx` — invalidate courses + dashboard on module quiz submit
- `frontend/components/nav/AppSidebar.tsx` — profile staleTime 5 min → 60s
- `frontend/components/dashboard/LeaderboardCard.tsx` — full visual redesign (podium + animated bars + countdown)
- `.claude/STATUS.md` — this update
