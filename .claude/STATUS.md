# BahasaBot — Project Status
_Update this file at the end of every session_

## Last Updated: 2026-04-01

## Feature Status
| Feature | Status | Notes |
|---|---|---|
| Auth | ✅ Complete + Verified | Email + Google OAuth, JWT, token refresh, 30-min sessions |
| AI Chatbot Tutor | ✅ Complete + Verified | SSE streaming, LangChain, RAG — Malaysian Malay + IPA in prompt |
| Course Generator | ✅ Complete + English-medium fix | Lesson content now in English; Malay words taught inline — verified live |
| Quiz | ✅ Complete + English-medium fix | Question text now explicitly English; Malay vocabulary uses Malaysian BM |
| Dashboard | ✅ Complete + Vocab Delete | All 6 endpoints verified — vocab/grammar/progress/weak-points/quiz-history |
| Production Hardening | ✅ Complete + Rate Limiter Fix | Rate limiter now falls back to in-memory on Redis timeout (no more 500s) |
| IPA Pronunciation | ✅ Full stack verified | Courses: IPA in all 9/9 classes. Chatbot: /ko.soŋ/, /tə.ri.ma ka.sɪh/. Quiz: IPA in 15/15 explanations |

## Missing / Broken
- frontend/app/(dashboard)/quiz/adaptive/results/page.tsx — completeness unknown (not tested in this session)
- frontend/app/(dashboard)/quiz/module/[moduleId]/results/page.tsx — completeness unknown (not tested in this session)

## Known Pre-existing Issue (not caused by this session's changes)
- Module quiz cache-vs-submission misalignment: if a quiz attempt fails (0%) the cache clears and Gemini regenerates new questions. If the user tries to re-submit using the answers from the *first* GET, they are answered against the *new* questions and score 0% again. Mitigation: the frontend should re-fetch GET before showing the quiz form if the previous submission failed. This is a UI flow issue, not a backend bug.

## What Was Done This Session (English-Medium Course + Quiz Fix)

### Root Cause
All three Gemini prompts in `course_service.py` said "Use Malaysian Bahasa Melayu throughout" without
distinguishing between (a) the language of instruction (must be English — international students) and
(b) the Malay vocabulary being taught (must use Malaysian BM, not Indonesian). Gemini interpreted the
instruction as "write the whole lesson in Malay."

### Fixes
- **`backend/services/course_service.py`** — skeleton prompt: added explicit "ALL titles/descriptions in ENGLISH";
  content_system: changed from "Use Malaysian Bahasa Melayu" → "Write ALL explanations in ENGLISH;
  MALAY WORDS you teach use Malaysian BM"; content_prompt: added concrete counter-example to make the
  distinction unmistakable to Gemini.
- **`backend/services/quiz_service.py`** — both `generate_module_quiz` and `generate_adaptive_quiz` prompts:
  changed "USE MALAYSIAN BAHASA MELAYU ONLY" → explicit rule that question text/explanations are in English;
  Malay words in answers/options use Malaysian BM.
- Chatbot (`langchain_service.py`) was already correct — had explicit "If student writes in ENGLISH → reply in English" rule.

### Verified
- Generated fresh course "Shopping for Fresh Produce at a Malaysian Market":
  - Titles, module names, class names: all English ✅
  - Description: English ✅
  - Lesson content: English explanations with bold Malay words taught inline ✅
  - Vocabulary: Malay words with English meanings and IPA ✅

---

## What Was Done This Session (Comprehensive Testing + Rate Limiter Fix)

### Rate Limiter Redis Fallback Fix
- **Problem found during testing**: Redis Cloud free tier had a timeout, causing SlowAPI's rate limiter to throw a `TimeoutError` that propagated as a 500 Internal Server Error on the chatbot endpoint.
- **Root cause**: SlowAPI uses synchronous Redis internally via `limits` library. A TCP timeout on the free-tier Redis kills the connection and throws an unhandled exception into the request cycle.
- **Fix**: In `rate_limiter.py`, before creating `Limiter`, probe Redis with a 3-second timeout ping. If it fails, pass `storage_uri=None` so SlowAPI uses in-memory storage instead. The limiter works fine (per-process only instead of distributed), so all endpoints stay functional.
- **File**: `backend/middleware/rate_limiter.py`

### Test Results Summary

| Test | Result | Detail |
|---|---|---|
| RAG Corpus Re-seed | ✅ PASS | 72 old → 0 → 76 new (4 IPA chunks added) |
| Course Generation — first attempt | ✅ PASS | "Food and Drinks" in 135s on first try |
| Course — Malaysian Malay | ✅ PASS | `kosong`, `mahu`, `air kosong` — no Indonesian words |
| Course — IPA in vocabulary | ✅ PASS | All 9/9 classes, every vocab item has `ipa`, `syllables`, `synonyms` |
| Mark Complete — Class 1.1 | ✅ PASS | `completed: true`, vocab saved |
| Mark Complete — Class 1.2 | ✅ PASS | `completed: true`, vocab saved |
| Mark Complete — Class 1.3 | ✅ PASS | `all_module_classes_done: true`, `quiz_unlocked: true` |
| Mark Complete — Classes 2.1–2.3 | ✅ PASS | All 3 completed, quiz unlocked |
| Mark Complete — Classes 3.1–3.3 | ✅ PASS | All 3 completed, quiz unlocked |
| Mark Complete — Idempotent re-call | ✅ PASS | Returns `completed: true` safely |
| Module 1 Quiz — GET | ✅ PASS | 10 questions generated |
| Module 1 Quiz — Submit 70% | ✅ PASS | Score 70% exactly → `passed: true` → M2 unlocked |
| Module 1 Quiz — IPA in explanations | ✅ PASS | `/mi.nu.man/`, `/na.si/`, `/a.ir ko.song/` present |
| Module 2 Quiz — GET + Submit | ✅ PASS | Score 90% → M3 unlocked |
| Module 3 Quiz — GET | ✅ PASS | 10 questions (module unlocked after M2 pass) |
| Module Locking Logic | ✅ PASS | M1 complete→M2 unlocked; M2 complete→M3 unlocked; M3 initially locked |
| Chatbot — zero → kosong | ✅ PASS | "**kosong** = zero — /ko.soŋ/" + explicit note "not 'nol' or 'sifar'" |
| Chatbot — IPA format | ✅ PASS | `/tə.ri.ma ka.sɪh/ (sounds like: tuh-REE-mah KAH-sih)` |
| Chatbot — Malaysian Malay | ✅ PASS | `awak`, `mahu`, `air` — no Indonesian vocabulary |
| Standalone Adaptive Quiz — GET | ✅ PASS | 15 questions: 6 MCQ + 6 fill + 3 translation |
| Standalone Quiz — Submit | ✅ PASS | 93% score (14/15) |
| Standalone Quiz — IPA explanations | ✅ PASS | IPA present in all 15/15 question explanations |
| CEFR Recalculation | ✅ PASS | A1 → B2 after 93% quiz; saved to `users.proficiency_level` |
| Weak Points saved | ✅ PASS | 4 weak points recorded after wrong answers |
| Dashboard — all 6 endpoints | ✅ PASS | stats, vocabulary (54), grammar (4), progress, weak-points (24), quiz-history (5) |
| Dashboard — vocab delete | ✅ PASS | `{"deleted":1}` |
| Auth — GET /me | ✅ PASS | Returns name + `proficiency_level: B2` |
| Courses list | ✅ PASS | Returns 2 courses |
| Course delete | ✅ PASS | `{"deleted": true}` |
| Chatbot sessions list | ✅ PASS | 7 sessions |
| Chatbot history | ✅ PASS | Returns messages |
| Rate Limiter (Redis down scenario) | ✅ FIXED | Falls back to in-memory, no more 500s |

### Remaining Gaps (not tested this session)
- Quiz results pages in the frontend UI (`quiz/adaptive/results` and `quiz/module/[moduleId]/results`) — these are frontend pages not testable via API. Manual browser testing required.

## What Was Done This Session (Course Reliability, Mark Complete Fix, Malaysian Malay + IPA Full Stack)

### Course Generation — True Never-Abort Reliability
- **Root cause of "required two tries"**: `_generate_class_with_retry` propagated the exception from the second attempt, aborting the entire `asyncio.gather`. User had to retry the whole course.
- **Fix**: Added a second `try/except` around the retry attempt in `_generate_class_with_retry`. If both attempts fail, returns minimal fallback content (`vocabulary_json: [], examples_json: []`) so the course always saves completely. Users see a note to re-generate that specific class.
- **File**: `backend/services/course_service.py`

### Mark Complete Button — Root Cause Found & Fixed
- **Root cause**: `item.get("word", "").strip()` — the default `""` only applies when the key is *absent*. If Gemini returns `"word": null` (null/None) or `"word": 0` (an integer, common for number-themed courses), `dict.get()` returns the null/int value and `.strip()` raises `AttributeError`. This explains why a "Number System" course's class 1 (numbers 0–10) and class 3 (numbers 21+) failed while class 2 (numbers 11–20) with text-only words like "sebelas" succeeded.
- **Fix 1**: Changed extraction to `str(item.get("word") or "").strip()[:250]` — handles None, integers, and strings, plus truncates to stay within VARCHAR(255).
- **Fix 2**: Split the DB commit into two: `UserProgress` is committed first in its own transaction so the class is marked complete even if vocab save fails. Vocab save now runs in a separate `try/except` with rollback on error.
- **Variable shadowing also fixed**: Renamed inner `existing` (vocab dedup result) to `dedup_check` to eliminate the variable name collision with the outer `existing` (UserProgress check).
- **File**: `backend/services/course_service.py`

### Chatbot — Malaysian Malay + IPA Localization
- Added explicit Malaysian Bahasa Melayu requirement to `CHATBOT_SYSTEM_PROMPT` with concrete examples (kosong not nol/sifar, kereta not mobil, mahu not mau).
- Updated vocabulary format rule: now instructs Gemini to include IPA and English "sounds like" approximation for every new word taught, plus closest Malaysian Malay synonyms.
- **File**: `backend/services/langchain_service.py`

### Quiz Prompts — Malaysian Malay + IPA
- Both `generate_module_quiz` and `generate_adaptive_quiz` prompts updated with Malaysian Bahasa Melayu requirement (same vocabulary list as chatbot).
- Added rule: vocabulary question explanations must include IPA pronunciation, e.g. `'Makanan' /ma.ka.nan/ means food.`
- **Files**: `backend/services/quiz_service.py`

### RAG Corpus — IPA Pronunciation Entries Added
- Added 4 new corpus chunks at the end of `MALAY_CORPUS`:
  1. IPA guide for greetings + key pronunciation rules (schwa /ə/, consonant clusters)
  2. IPA guide for numbers 0–10 + 11+ formation with "belas"/"puluh"
  3. IPA guide for common verbs + daily-life nouns
  4. Malaysian vs Indonesian Malay vocabulary differences (kosong/nol, kereta/mobil, mahu/mau, etc.)
- These entries will be picked up by the RAG pipeline on next re-seed (or automatically on next startup if corpus is empty).
- **File**: `backend/data/malay_corpus.py`

## What Was Done Previous Session (Course Retry, Mark Complete Fix, Malaysian Malay, IPA)

### Course Generation — First-attempt Retry
- Added `_generate_class_with_retry()` in `course_service.py`. If `generate_class_content` raises (e.g. from a 429), it waits 35s and retries once before propagating the error. Previously any transient 429 aborted the entire generation.
- All tasks in `generate_course` now use this wrapper.

### Mark Complete Button Error Fix
- Added `try/except Exception` in `complete_class` router endpoint (`courses.py`). Any unhandled DB exception from `mark_class_complete` now returns a clean 500 with a user-friendly message instead of crashing silently.
- Added `if not isinstance(item, dict): continue` guard in the vocabulary save loop inside `mark_class_complete`. Prevents AttributeError if Gemini returns malformed vocab items.

### Malaysian Bahasa Melayu Localization
- All three Gemini prompts in `course_service.py` now explicitly require **Malaysian Bahasa Melayu**, not Indonesian Malay.
- Prompts instruct: "use 'kosong' for zero (not 'sifar'/'nol'), 'awak/kamu' for you, standard Malaysian spelling conventions."
- **Files changed:** `backend/services/course_service.py` — skeleton prompt, content_system + content_prompt, structured_prompt.

### IPA Pronunciation Feature
- `structured_prompt` in `course_service.py` now requests 3 new fields per vocabulary item:
  - `ipa`: IPA transcription with slashes, e.g. `"/sə.la.mat/"`
  - `syllables`: array of `{syllable, sounds_like}` for English-approximation breakdown
  - `synonyms`: 1–3 closest Malaysian Malay synonyms, or `[]`
- `frontend/lib/types.ts`: Added `SyllableBreakdown` interface; added `ipa?`, `syllables?`, `synonyms?` optional fields to `VocabularyItem`.
- `frontend/app/(dashboard)/courses/.../classes/[classId]/page.tsx`:
  - New `SyllableTable` component renders the syllable breakdown as a compact table (Syllable | Sounds like).
  - `VocabularySection` cards now show: word → IPA → syllable table → synonyms → meaning → example.
  - All new fields are optional — existing courses without IPA data display correctly unchanged.

## What Was Done This Session (Logo, Back Buttons, Auto-Logout, Chatbot Fix)

### Project Logo Integration
- Replaced the "B" letter placeholder in the sidebar with the actual `Project Logo.png` at correct sizes.
- **Sidebar collapsed**: 36×36 logo image (was green `bg-primary` box with "B").
- **Sidebar expanded**: 32×32 logo + "BahasaBot" text.
- **Mobile header + drawer**: 28×28 logo + "BahasaBot" text.
- **Chatbot header avatar**: 28×28 logo (was "BB" initials circle).
- Auth pages and favicons were already using the logo correctly.
- **Files changed:** `frontend/components/nav/AppSidebar.tsx`, `frontend/app/(dashboard)/chatbot/page.tsx`

### Back Buttons on Course Pages
- Added a consistent `← Back` button at the top of every course page (above breadcrumb).
- Course detail → "← Back to Courses" (`/courses`)
- Module detail → "← Back to Course" (`/courses/[courseId]`)
- Class/Lesson page → "← Back to Module" (`/courses/[courseId]/modules/[moduleId]`)
- Module Quiz → "← Back to Module" (`/courses/[courseId]/modules/[moduleId]`)
- Uses `ArrowLeft` icon from lucide-react, styled `text-muted-foreground hover:text-foreground`.
- **Files changed:** all 4 course page files

### Auto-Logout on Session Expiry
- `SessionProvider` now polls every 60 s (`refetchInterval={60}`) + re-checks on tab focus (`refetchOnWindowFocus={true}`).
- Added `SessionWatcher` component in `(dashboard)/layout.tsx` — watches `status` and `session.error`. When session expires (`status === "unauthenticated"`) or refresh token expires (`error === "RefreshTokenExpired"`), automatically calls `signOut({ callbackUrl: "/login" })` and redirects.
- **Files changed:** `frontend/components/providers.tsx`, `frontend/app/(dashboard)/layout.tsx`

### Chatbot System Prompt Fix (Bot was responding generically)
- **Root cause:** `system_instruction` passed as a constructor kwarg to `ChatGoogleGenerativeAI` is silently ignored by the current `langchain-google-genai` version — Gemini fell back to its default "I'm an AI assistant" identity.
- **Fix:** Pass system prompt as `SystemMessage` at the front of the messages list — this is the correct LangChain approach and works reliably.
- **Verified:** Chatbot now correctly identifies as BahasaBot, responds in English when asked in English, and stays focused on Bahasa Melayu tutoring.
- **Files changed:** `backend/services/gemini_service.py`

### Session Expiry
- Changed session expiry from 3 min (test) → **30 minutes** for regular use.
- `ACCESS_TOKEN_EXPIRE_MINUTES=30` in `backend/.env`, `ACCESS_TOKEN_TTL_MS` = 29 min, NextAuth `maxAge` = 30 min.
- **Files changed:** `backend/.env`, `frontend/lib/auth.ts`

### Vocabulary Dedup (no more duplicate words)
- Before inserting any vocab word, a case-insensitive `.ilike()` check runs against the user's existing vocabulary. Duplicate words are silently skipped.
- Applied to **both** save paths: chatbot extraction (`langchain_service.py`) and course class completion (`course_service.py`).
- **Tested:** saving "makan" twice → second insert skipped; "MAKAN" (case) also blocked.

### Vocabulary Delete (select + delete from Dashboard)
- New `DELETE /api/dashboard/vocabulary` endpoint — accepts `{ ids: [...] }`, only deletes rows owned by the current user (security enforced at DB query level).
- `VocabularyTable.tsx` — added per-row checkboxes, select-all header checkbox, and "Delete (N)" button in toolbar. Only rendered when `onDelete` prop is passed (overview preview is unaffected).
- `dashboard/page.tsx` — `handleVocabDelete()` calls the API then refreshes the current page (or steps back if page is now empty).
- `frontend/lib/api.ts` — added `dashboardApi.deleteVocabulary(ids)`.
- **Tested end-to-end via API:** DELETE returns `{"deleted":1}`, GET after confirms count drops, deleting non-owned ID returns `{"deleted":0}`.

## What Was Done This Session (UI Polish — Colors + Typography)

### Color Distribution (Botanical Palette)
- **StatsCards** — each of 6 icon boxes now has a distinct color: Marigold (Courses), Green/Primary (Modules), Blue (Classes), Purple (Quizzes), Terracotta (Vocabulary), Marigold (Grammar).
- **CEFRProgressBar** — completed level bars changed from `bg-primary` (green) → `bg-accent` (Marigold gold).
- **QuizHistoryTable** — "Passed" result badge changed from hardcoded green → amber/Marigold. "Failed" stays red.
- **VocabularyTable** — source badges now 3-way: chatbot=blue, quiz=amber/Marigold, course=orange/Terracotta (was all green).
- **VocabularyHighlight** — chatbot vocab pills changed from hardcoded `emerald-*` classes → Marigold theme tokens (`bg-accent/20`, `border-accent/40`, `text-accent`).
- **WeakPointsChart** — high-strength bar color changed from `#eab308` (yellow-500) → `#f9a620` (Marigold); legend badge updated to match.

### Typography Overhaul
- **Font** — replaced Lora (serif) with **Space Grotesk** (modern geometric sans) as heading font. Inter stays as body font. Updated `frontend/app/layout.tsx` and `frontend/tailwind.config.ts`.
- **globals.css** — added `-webkit-font-smoothing: antialiased`, `-moz-osx-font-smoothing: grayscale`, `font-feature-settings`. All h1–h6 now get `tracking-tight` from the base layer.
- **StatsCards** — stat number uses `font-heading tabular-nums`, label uses `uppercase tracking-widest`.
- **Dashboard page** — h1 `text-3xl`, tab labels `tracking-wide`, section h3s `tracking-tight`, tab content h2s `text-xl tracking-tight`.
- **Chatbot page** — BB avatar + send button use `bg-primary` (not hardcoded emerald). Input `text-base`. Empty state h2 `text-xl tracking-tight`. Starter buttons `text-sm`.
- **ChatMessage** — bot bubble uses `bg-card border-border` (dark mode safe, replaces `bg-white border-gray-200`). Text `text-base leading-relaxed`. Inline code + blockquote use theme tokens. Streaming cursor `bg-primary`.
- **Courses page** — h1 `text-3xl tracking-tight`, card topic overline `tracking-widest`.
- **Course detail** — h1 `text-3xl tracking-tight leading-tight`, module card titles `text-base tracking-tight`, descriptions `leading-relaxed`.
- **Module detail** — h1 `text-2xl tracking-tight`, class list items `text-base`.
- **Class/Lesson page** — prose upgraded to `prose-base leading-relaxed`, Vocabulary/Examples h2 `text-lg tracking-tight`, vocab word `text-base`, example sentences `text-base leading-relaxed`.
- **Adaptive Quiz** — h1 `text-3xl tracking-tight`, score display `text-5xl font-heading tabular-nums`, question text `text-base`, MCQ options `text-base`, breakdown label `tracking-widest`.
- **CEFRProgressBar** — heading `text-base tracking-tight`, description `leading-relaxed`.
- **AppSidebar** — nav links all `font-medium`, user name `font-medium`.

## What Was Done Previous Session (Course Generator Debug)
- **Bug fix 1: SlowAPI parameter naming** — `backend/routers/courses.py`: renamed `http_request: Request` → `request: Request` and `request: CourseGenerateRequest` → `body: CourseGenerateRequest`. SlowAPI requires the Starlette `Request` to be named exactly `request` — any other name causes 500 before the route executes.
- **Bug fix 2: `load_dotenv` import order** — `backend/main.py`: moved `load_dotenv()` to before all local module imports. Previously `rate_limiter.py` was imported before `load_dotenv()` ran, so `REDIS_URL` always captured `redis://localhost:6379/0` fallback.
- **Bug fix 3: Gemini 429 retry delay** — `backend/services/gemini_service.py`: `_invoke_with_retry` now parses the API-suggested retry delay from 429 `ResourceExhausted` errors ("retry in 26.6s") and waits that duration. Free tier is 5 RPM; course generation fires 13 API calls — without proper backoff it always failed.
- **Bug fix 4: `generate_json` 429 delay** — `backend/services/gemini_service.py`: outer retry loop in `generate_json` also respects the 429 retry delay (was using 1s/2s which is far too short).
- **Bug fix 5: Rate limiter keyed by IP not user** — `backend/middleware/rate_limiter.py`: `_get_user_id_or_ip` was reading `request.state.user` which is never populated before SlowAPI runs. Now decodes the JWT from the `Authorization` header directly to extract user ID — rate limits are now truly per-user.
- **Bug fix 6: 429 shown as generic error in UI** — `frontend/components/courses/CourseGenerationModal.tsx`: added explicit `status === 429` branch to show "You've reached the course generation limit (5 per hour). Please try again later."
- **Improvement: Semaphore 3 → 2** — `backend/services/course_service.py`: reduced concurrent Gemini calls to ease pressure on 5 RPM free-tier limit.
- **Verified end-to-end**: Generated "Mastering Malay Numbers for Daily Use" for `nurmohammadsowan119@gmail.com` — 3 modules, 9 classes, each ~3400 chars + vocab + examples. Rate limit key confirmed as user-UUID (not IP).

## What Was Done Previous Session (UI Overhaul)
- **Dark mode system** — class-based Tailwind dark mode (`darkMode: ["class"]`). Added `frontend/lib/use-theme.ts` (ThemeContext + useTheme + useThemeState hooks), wired ThemeContext.Provider in `frontend/components/providers.tsx`, and added a no-FOUC inline `<script>` in `frontend/app/layout.tsx` that reads localStorage/system pref before React hydrates. Preference persisted in localStorage.
- **ThemeToggle pill** — new `frontend/components/ui/theme-toggle.tsx`. Sliding Moon/Sun pill wired to `useTheme()`. Integrated into AppSidebar footer (expanded = full pill, collapsed = scaled-down pill).
- **Auth page redesign** — `frontend/app/(auth)/login/page.tsx` and `register/page.tsx` fully rewritten with `frontend/components/ui/auth-card.tsx` shell: Three.js GLSL shader full-screen background (`ShaderAnimation`), framer-motion 3D card tilt, traveling border beam animation, glass card surface (`bg-black/50 backdrop-blur-xl`). All auth logic (react-hook-form, Zod, Google OAuth) preserved.
- **GlowingEffect dashboard cards** — new `frontend/components/ui/glowing-effect.tsx` (mouse-following conic gradient border via `motion/react`). Applied to all cards in `frontend/app/(dashboard)/dashboard/page.tsx` and `frontend/components/dashboard/StatsCards.tsx`.
- **Chatbot dark mode fix** — `frontend/app/chatbot/page.tsx`: Waves background color now reactive to theme (`#0d1a11` dark / `#f5f3ed` light). Welcome tile and starter buttons updated to use CSS variable tokens (`bg-card/70`, `border-primary/20`, `hover:bg-primary/10`).
- **New packages installed** — `motion` (for GlowingEffect's `animate`), `simplex-noise` (for Waves component).

## What Was Done Previous Session (Auth Debug)
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
