# BahasaBot — Documentation Audit Changes
_Audit performed: 2026-05-14. Corrections made to CLAUDE.md, STATUS.md, PHASES.md. project_truth.md created as new source-of-truth._

---

## Summary

Three existing documentation files were audited against the live codebase. This file records every correction made, confidence levels per section, and items that should be manually verified before writing the FYP report.

---

## CLAUDE.md Changes

### Section 5.8 — My Journey (Learning Roadmap)
**Status: REWRITTEN**
**Confidence: High** — verified against `backend/services/journey_service.py`, `backend/models/journey.py`, `backend/routers/journey.py`

**What was wrong:** The original description covered the Phase 11 v1 schema (learning_roadmaps table, phases/weeks/activities, type='course'|'quiz'|'chatbot' activity types). Phase 20 replaced this entirely with a flat course-obstacle model (user_roadmaps table, elements JSONB, courses-only). The old text described quiz and chatbot activity types that do NOT exist in the current codebase.

**What was fixed:** Section completely rewritten to describe Phase 20 v2: flat obstacle model, 3-question modal, fuzzywuzzy matching, road/path UI, overdue/extend states, BPS upgrade banner, notification hooks (journey_reminder type only), `user_roadmaps` table schema, 7 journey endpoints.

---

### Section 5.11 — Spelling Practice Game → Games Hub
**Status: REWRITTEN**
**Confidence: High** — verified against `backend/services/spelling_service.py`, `backend/services/word_match_service.py`, `frontend/app/(dashboard)/games/page.tsx`

**What was wrong:** Described only the Spelling game (Phase 19 v2). Phase 27 (Session 76, 2026-05-09) added:
- Difficulty modes (Easy/Medium/Hard) to Spelling
- A new Word Match game (MCQ vocabulary recognition)
- A /games hub page housing both games

**What was fixed:** Section renamed to "Games Hub", both games described with difficulty tiers and XP values.

---

### Section 5.12 — Gamification
**Status: CORRECTED**
**Confidence: High** — verified against `backend/services/gamification_service.py`

**What was wrong:**
- XP values listed as flat: "spelling word correct = 2 XP". Actual: difficulty-dependent (easy=1, medium=2, hard=4 for spelling; easy=1, medium=1, hard=2 for word match)
- No mention of the one-day grace period in streak counting
- Storage described as "user_streaks and user_xp tables (or as columns on users table)" — ambiguous; actual: `users.streak_count` + `users.xp_total` (columns on users) + `xp_logs` table for leaderboard history

**What was fixed:** XP table corrected, grace period documented, storage location clarified.

---

### Section 5.13 — Notification System
**Status: CORRECTED**
**Confidence: High** — verified against `backend/routers/notifications.py`, `frontend/components/nav/AppSidebar.tsx`

**What was wrong:** Bell icon location described as "top navigation bar" — the floating fixed-position overlay bell was removed in Session 18 and relocated into AppSidebar. Also missing the DELETE /api/notifications/ (clear-all) endpoint.

**What was fixed:** Bell location updated to AppSidebar (mobile header + desktop sidebar footer). DELETE endpoint added.

---

### Section 5.14 — Forgot Password
**Status: REWRITTEN**
**Confidence: High** — verified against `backend/routers/auth.py`, `frontend/app/(auth)/forgot-password/page.tsx`

**What was wrong:** Described a link-based reset flow (old Phase 12 design). The entire flow was rebuilt on 2026-04-15 to use a 6-digit OTP code sent by email. The reset-password page was deprecated and now redirects to /forgot-password. There are now 3 endpoints (forgot-password, verify-reset-code, reset-password) instead of 2.

**What was fixed:** Full 3-step OTP flow described; old page described as deprecated redirect.

---

### Section 5.15 — User Profile Management
**Status: CORRECTED**
**Confidence: High** — verified against `backend/routers/profile.py`

**What was wrong:** Missing the delete-account endpoint (POST /api/profile/delete-account, Session 45). Missing the `has_password` property (critical for settings/password routing). Missing note about cache invalidation after PATCH.

**What was fixed:** Delete-account endpoint added, has_password documented, cache invalidation note added.

---

### Sections 5.23, 5.24, 5.25 — New Features Added
**Status: NEW SECTIONS ADDED**
**Confidence: High** — verified against STATUS.md sessions 48, 68, and their respective files

These features appeared in STATUS.md session logs but had no entries in CLAUDE.md:
- **5.23 Daily Language Tips** (Session 68): tips table, GET /api/tips/random, TipToast component, new-user suppression logic
- **5.24 Weekly XP Leaderboard** (Session 48): xp_logs table, GET /api/dashboard/leaderboard, LeaderboardCard component, framer-motion podium
- **5.25 First-Login UI Tour** (Session 68): driver.js desktop tour, mobile card-slide alternative, has_seen_tour flag

---

### Section 6 — Database Schema
**Status: COMPLETE REWRITE**
**Confidence: Medium-High** — primary source is ORM model files; some column details confirmed by migration files

**What was wrong:** Approximately 8 missing columns and 5 missing tables:
- Missing columns: `has_seen_tour`, `gender`, `age_range` (users); `topic_slug`, `is_template`, `cloned_from` (courses); `game_type` (spelling_game_scores); `provider` (users); `image_url` (notifications)
- Missing tables: `tips`, `xp_logs` entirely absent; `user_roadmaps` listed under old Phase 11 name and schema (`learning_roadmaps`)

**What was fixed:** Complete rewrite with all tables, all columns including data types and nullable constraints, key indexes, the partial unique index on user_roadmaps.

---

### Section 7 — API Endpoints
**Status: COMPLETE REWRITE**
**Confidence: High** — derived from router file inspection

**What was wrong:** ~25 endpoints were missing from the original list, including:
- All admin export endpoints (GET /api/admin/export/*)
- Admin analytics endpoints (score-distribution, weak-points)
- Quiz attempt inspector endpoint
- Games word-match endpoints (4 new in Phase 27)
- Tips endpoints
- Leaderboard endpoint
- Session delete, chatbot prewarm, chatbot delete endpoints
- Journey history, regenerate, dismiss-upgrade endpoints
- Profile delete-account endpoint

**What was fixed:** Complete rewrite with all ~55 endpoints, auth requirements, and brief descriptions.

---

### Section 9 — Development Constraints
**Status: CORRECTED**
**Confidence: High** — verified against source files

**What was wrong:**
- Semaphore described as 3: actual is `asyncio.Semaphore(2)` (`backend/services/course_service.py:L22`)
- JWT described as 30 min: actual default is 15 min (`ACCESS_TOKEN_EXPIRE_MINUTES` in `backend/routers/auth.py`)

**What was fixed:** Both values corrected.

---

## STATUS.md Changes

### Phase 17 Notification System Entry
**Status: CORRECTED**
**Confidence: High**

**What was wrong:** Entry said "floating global icon in layout.tsx" — this was the original Phase 17 implementation. Session 18 removed the floating overlay and relocated the bell into AppSidebar.

**What was fixed:** Entry updated to reflect bell relocation, Clear-all feature, and DELETE endpoint.

---

## PHASES.md Changes

### Phase 3 — malay_corpus.py "MISSING" Flag
**Status: CORRECTED**
**Confidence: High** — file confirmed to exist at `backend/data/malay_corpus.py` (1155 lines)

**What was wrong:** Checklist item had "⚠️ backend/data/malay_corpus.py MISSING"

**What was fixed:** Flag removed; file size and content noted.

---

### Phase 4 — Semaphore Value
**Status: CORRECTED**
**Confidence: High**

**What was wrong:** "Semaphore-limited to 3"

**What was fixed:** Corrected to 2 with file path citation.

---

### Phase 6 — CEFR References
**Status: CORRECTED**
**Confidence: High**

**What was wrong:** Three CEFR/A1/A2/B1/B2 references in Phase 6 description survived the Phase 10 BPS migration

**What was fixed:** All updated to BPS terminology; `_calculate_cefr_level()` naming inconsistency noted.

---

### Phase 8 — JWT Expiry
**Status: CORRECTED**
**Confidence: High**

**What was wrong:** "access token 30 min" — default is 15 min in code

**What was fixed:** Corrected to 15 min default; env var override noted.

---

### Phase 19 Title
**Status: UPDATED**
**Confidence: High**

**What was wrong:** Status line didn't mention v3 difficulty modes (Session 76)

**What was fixed:** "v3 difficulty modes (Session 76, 2026-05-13)" appended.

---

### Phase 26 — New Phase Added
**Status: NEW SECTION**
**Confidence: High** — features verified against STATUS.md and their respective files

Groups post-Phase 25 features (Sessions 45–68):
- Delete Account
- Weekly XP Leaderboard
- Daily Language Tips
- First-Login UI Tour

---

### Phase 27 — New Phase Added
**Status: NEW SECTION**
**Confidence: High** — verified against STATUS.md session 76 and `backend/services/word_match_service.py`, `backend/db/migrations/versions/20260509_1000_add_game_type_column.py`

Covers Games Hub + Word Match game additions (Session 76, 2026-05-09).

---

## New Files Created

| File | Purpose |
|---|---|
| `project_truth.md` | Deep technical source-of-truth for FYP report; 12 sections covering stack, architecture, database, all API endpoints, services, key flows, AI pipeline, caching, integrations, algorithms, testing, feature status |
| `CHANGES.md` | This file — audit diff log |

---

## TO VERIFY Items

Items that couldn't be fully confirmed from file reads alone and should be verified before including in the FYP report:

1. **`[TO VERIFY: backend/tests/ directory]`** — `pytest 8.3.2` is in requirements but no test files were surfaced during the audit. Check if a `backend/tests/` directory exists with unit tests.

2. **`[TO VERIFY: exact Alembic migration count]`** — 15 migrations stated; the audit identified 10 specific migration files by name but the remaining 5 were inferred from feature descriptions. Run `alembic history` to confirm the exact list.

3. **`[TO VERIFY: frontend/lib/auth.ts ACCESS_TOKEN_TTL_MS]`** — The constant is set to `(30 * 60 - 60) * 1000` (targets 30-min tokens), but the backend default is 15 min. If the deployed backend uses the default, the frontend refreshes ~15 min before the actual expiry. Confirm the `ACCESS_TOKEN_EXPIRE_MINUTES` value in the production Render environment variable.

4. **`[TO VERIFY: notification.py docstring lists 'phase_complete' type]`** — The `Notification` ORM model docstring may still list `phase_complete` as a valid type. This type was retired in Phase 20 v2; no new `phase_complete` records are created. Verify and update the docstring if needed.

5. **`[TO VERIFY: _calculate_cefr_level() function name]`** — This function in `quiz_service.py` is still named with "cefr" but returns BPS labels. This is a naming inconsistency but not a runtime bug. Confirm the function name hasn't been renamed in a recent session.

6. **`[TO VERIFY: seed_demo.py]`** — Phase 23 lists this as pending. Confirm whether it exists at `backend/data/seed_demo.py` before the 30-user evaluation.

7. **`[TO VERIFY: Vercel production URL]`** — `CLAUDE.md` and project_truth.md cite `https://bahasabot-main3.vercel.app` as the production URL. Confirm this is still the canonical URL and not an old preview URL.

8. **`[TO VERIFY: tips table Alembic migration filename]`** — The migration for the `tips` table was added in Session 68 but the exact filename/revision ID was not read during this audit. Run `alembic history` to confirm.

---

## Confidence Summary

| Document | Section | Confidence | Source |
|---|---|---|---|
| CLAUDE.md | Section 5.1–5.7 | High | Cross-checked against routers + models |
| CLAUDE.md | Section 5.8 (Journey) | High | journey_service.py, models/journey.py |
| CLAUDE.md | Section 5.11–5.12 (Games/Gamification) | High | spelling_service.py, word_match_service.py |
| CLAUDE.md | Section 5.13–5.15 | High | Router files direct |
| CLAUDE.md | Section 5.23–5.25 (new) | High | STATUS.md sessions + component files |
| CLAUDE.md | Section 6 (DB Schema) | Medium-High | ORM models primary; some migration details inferred |
| CLAUDE.md | Section 7 (API Endpoints) | High | Router files direct |
| STATUS.md | All entries | High | Cross-checked against code |
| PHASES.md | Phases 1–25 | High | Consistent with code and STATUS.md |
| PHASES.md | Phase 26–27 (new) | High | STATUS.md session 76 + files |
| project_truth.md | Section A (Stack) | High | requirements.txt + package.json direct |
| project_truth.md | Section B (Architecture) | High | main.py + database.py direct |
| project_truth.md | Section C (Database) | Medium-High | ORM models; migration revision IDs partially inferred |
| project_truth.md | Section D (API) | High | All router files read |
| project_truth.md | Section E (Services) | High | All service files read |
| project_truth.md | Section F (Flows) | High | Derived from service + router code |
| project_truth.md | Section G (AI) | High | gemini_service.py + langchain_service.py direct |
| project_truth.md | Section H (Caching) | High | cache.py + service files; TTL values from code |
| project_truth.md | Section I (Integrations) | High | Confirmed in requirements + code |
| project_truth.md | Section J (Algorithms) | High | Service files direct |
| project_truth.md | Section K (Testing) | Medium | pytest present; test files not confirmed |
| project_truth.md | Section L (Feature Status) | High | STATUS.md + PHASES.md cross-checked |
