# BahasaBot — Project Status
_Update this file at the end of every session_

## Last Updated: 2026-03-25

## Feature Status
| Feature | Status | Notes |
|---|---|---|
| Auth | ✅ Complete + Verified | Email + Google OAuth, JWT, token refresh, 7-day sessions — smoke-tested end-to-end |
| AI Chatbot Tutor | ✅ Complete + Verified | SSE streaming, LangChain, RAG — all tested end-to-end |
| Course Generator | ✅ Complete + Verified | 4 bugs fixed + end-to-end tested (see debug session below) |
| Quiz | ✅ Complete | Module quiz (70% pass gate) + Adaptive quiz (CEFR) |
| Dashboard | ✅ Complete | Phase 7 — all endpoints + all frontend components implemented |
| Production Hardening | ✅ Code complete | Phase 8 — rate limiting, Sentry, deployment config, .env audit |

## Missing / Broken
- frontend/app/(dashboard)/quiz/adaptive/results/page.tsx — completeness unknown
- frontend/app/(dashboard)/quiz/module/[moduleId]/results/page.tsx — completeness unknown

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
