# BahasaBot — Project Status
_Update this file at the end of every session_

## Last Updated: 2026-04-07 (Phase 19 complete — Spelling Practice Game v2 + vocab pipeline fix)

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
| Spelling Practice Game (Phase 19) | ✅ Complete + v2 redesign | Leitner-box word selection; Levenshtein fuzzy matching; Start screen → 3-2-1 countdown → 10s per-word timer (green→yellow→red pulse) → Time's Up screen with Next/Start Over; combo multiplier; session summary; keyboard shortcuts (Enter/Space/Escape); personal best; Games link in sidebar |
| Chatbot vocab pipeline fix | ✅ Fixed | _extract_and_save() now opens its own AsyncSessionLocal session — asyncio.create_task with request-scoped session was silently failing after SSE stream ended; vocab/grammar now reliably saved after every chatbot response |

## Missing / Broken
- `frontend/app/(dashboard)/quiz/module/[moduleId]/results/page.tsx` — **stub only** (returns `<div>Module Quiz Results — TODO</div>`). Score + per-question breakdown + Continue/Retry button not yet implemented.
- `frontend/app/(dashboard)/quiz/adaptive/results/page.tsx` — redirects back to `/quiz/adaptive` (inline results used instead). Deep-link works but no standalone results page.

## Known Pre-existing Issue (not caused by recent changes)
- Module quiz cache-vs-submission misalignment: if a quiz attempt fails (0%) the cache clears and Gemini regenerates new questions. If the user re-submits using answers from the *first* GET, they score 0% again. Mitigation: frontend should re-fetch GET before showing quiz form if previous submission failed. This is a UI flow issue, not a backend bug.

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
1. **Phase 17 — Notification System** — bell icon, NotificationBell + NotificationPanel components, backend router + gamification_service.
2. **Module Quiz Results Page** — implement `quiz/module/[moduleId]/results/page.tsx` (still a TODO stub).
3. **Deploy** — push backend to Railway, frontend to Vercel, set all env vars, final smoke test.
