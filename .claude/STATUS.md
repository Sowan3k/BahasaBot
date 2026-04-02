# BahasaBot — Project Status
_Update this file at the end of every session_

## Last Updated: 2026-04-02

## Feature Status
| Feature | Status | Notes |
|---|---|---|
| Auth | ✅ Complete + Verified | Email + Google OAuth, JWT, token refresh, 30-min sessions |
| AI Chatbot Tutor | ✅ Complete + Verified | SSE streaming, LangChain, RAG — Malaysian Malay + IPA in prompt; markdown rendering; session persistence |
| Course Generator | ✅ Complete + English-medium fix | Lesson content in English; Malay words taught inline; Malaysian BM only |
| Quiz | ✅ Complete + English-medium fix | Question text explicitly English; Malay vocabulary uses Malaysian BM; IPA in explanations |
| Dashboard | ✅ Complete + Vocab Delete | All 6 endpoints verified — vocab/grammar/progress/weak-points/quiz-history |
| Production Hardening | ✅ Complete + Rate Limiter Fix | Rate limiter falls back to in-memory on Redis timeout (no more 500s) |
| IPA Pronunciation | ✅ Full stack verified | Courses: IPA in all vocab items. Chatbot: /ko.soŋ/, /tə.ri.ma ka.sɪh/. Quiz: IPA in explanations |
| Chatbot UI | ✅ Complete | react-markdown rendering, VocabPill extraction, Malaysia flag avatar, session persistence in sessionStorage |
| Dark Mode | ✅ Complete | Class-based Tailwind dark mode, ThemeToggle pill in sidebar, no-FOUC inline script |
| UI Polish | ✅ Complete | Space Grotesk font, botanical color palette, glowing dashboard cards, animated auth pages |
| Local Dev Launcher | ✅ Complete | `start-bahasabot.bat` launches both frontend + backend; PM2 config removed from root |

## Missing / Broken
- `frontend/app/(dashboard)/quiz/module/[moduleId]/results/page.tsx` — **stub only** (returns `<div>Module Quiz Results — TODO</div>`). Score + per-question breakdown + Continue/Retry button not yet implemented.
- `frontend/app/(dashboard)/quiz/adaptive/results/page.tsx` — redirects back to `/quiz/adaptive` (inline results used instead). Deep-link works but no standalone results page.

## Known Pre-existing Issue (not caused by recent changes)
- Module quiz cache-vs-submission misalignment: if a quiz attempt fails (0%) the cache clears and Gemini regenerates new questions. If the user re-submits using answers from the *first* GET, they score 0% again. Mitigation: frontend should re-fetch GET before showing quiz form if previous submission failed. This is a UI flow issue, not a backend bug.

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
1. **Module Quiz Results Page** — implement `quiz/module/[moduleId]/results/page.tsx` (currently a TODO stub): show score, per-question breakdown with explanations, Continue (pass) or Retry (fail) button.
2. **Phase 9 — Background Course Generation** — non-blocking modal, floating progress card, `BackgroundTasks` + Redis job state + React polling.
3. **Deploy** — push backend to Railway, frontend to Vercel, set all env vars, final smoke test.
