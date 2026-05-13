# BahasaBot — Claude Master Context

> This file is the single source of truth for the BahasaBot project.
> Read this file completely before making any decisions, generating any code, or suggesting any changes.
> Every response, every file generated, every architectural decision must align with what is written here.

---

## ⚡ Session Start Protocol (READ FIRST, EVERY SESSION)

Before responding to ANY user message in this project, Claude Code MUST:

1. Read `.claude/STATUS.md` in full — this contains the latest session log, known bugs, recent fixes, and current state of every feature.
2. Read `.claude/PHASES.md` in full — this contains all completed and in-progress phases with file-level checklists.
3. Confirm understanding of the current project state before writing any code or making any architectural decision.

If the user asks to "work on Phase X" — go directly to that phase in PHASES.md after the read.

If the user asks a question that depends on current state (e.g. "what's deployed?", "is X done?", "what changed recently?") — answer from STATUS.md, NOT from memory or assumption.

Skipping this protocol leads to outdated assumptions, duplicate work, and broken features. It is non-negotiable.

---

## 1. Project Overview

**Project Name:** BahasaBot
**Type:** Final Year Project (FYP) — Academic submission + real-world deployment
**Purpose:** A web-based AI-powered platform that helps international students learn Bahasa Melayu (Malay language) through an interactive chatbot, dynamic course generation, quizzes, and a personalized learning dashboard.
**Target Users:** International students learning Malay as a second language
**Expected Traffic:** ~30 concurrent users (production-level quality is still required)
**Deployment Goal:** Publicly accessible web application — not just a demo

---

## 2. Goals & Objectives

- Build a fully functional, production-ready Malay language learning platform
- Demonstrate a complete full-stack AI application using modern technologies
- Showcase modular software architecture suitable for academic evaluation
- Provide real learning value to users through AI-generated, personalized content
- Handle real traffic securely and reliably
- Provide evaluatable evidence of personalized learning through weak point tracking, vocabulary collection, and adaptive quiz generation

---

## 3. Mandatory Tech Stack

This tech stack is FIXED and cannot be removed. All listed technologies MUST be used and must appear clearly in the codebase. Additional technologies may be added if needed.

| Layer                 | Technology                                              | Purpose                          |
| --------------------- | ------------------------------------------------------- | -------------------------------- |
| Frontend              | Next.js (App Router)                                    | UI, routing, server components   |
| Backend AI Service    | FastAPI (Python)                                        | API microservice for AI features |
| AI Orchestration      | LangChain                                               | Chains, RAG pipelines, memory    |
| LLM                   | Google Gemini API                                       | All language model responses     |
| Database              | PostgreSQL                                              | All persistent data storage      |
| Vector Store          | pgvector (PostgreSQL extension)                         | RAG embeddings storage           |
| Authentication        | NextAuth.js or Supabase Auth                            | User login, session management   |
| Caching               | Redis                                                   | Response caching, session data   |
| Deployment - Frontend | Vercel                                                  | Next.js hosting                  |
| Deployment - Backend  | Railway or Render                                       | FastAPI hosting                  |
| Deployment - Database | Supabase or Neon                                        | Managed PostgreSQL               |
| Email Service         | Resend                                                  | Password reset emails            |
| Image Generation      | Google Gemini Image API (gemini-3.1-flash-image-preview) | Journey banners, milestone cards, course covers |
| Audio                 | Web Speech API (browser-native)                         | Pronunciation audio for vocabulary |

### Permitted Additions (if needed):

- Celery — background task queue for long-running course generation
- Sentry — error monitoring (frontend + backend)
- UptimeRobot — uptime monitoring
- Redis Cloud — managed Redis (free tier)
- Tailwind CSS — styling
- shadcn/ui — UI components
- Alembic — database migrations
- SQLAlchemy — ORM for FastAPI
- Resend Python SDK — transactional email for forgot password flow

---

## 4. Project Architecture

### High-Level Architecture

```
[User Browser]
     |
[Next.js Frontend — Vercel]
     |
     |--- Auth requests ---------> [NextAuth.js / Supabase Auth]
     |--- AI feature requests ---> [FastAPI Backend — Railway/Render]
                                        |
                                        |--- LangChain chains
                                        |--- Google Gemini API
                                        |--- RAG pipeline (pgvector)
                                        |--- PostgreSQL (Supabase/Neon)
                                        |--- Redis cache
```

### Folder Structure

```
bahasabot/
├── frontend/                        # Next.js App
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── admin/               # Admin control panel
│   │   │   ├── journey/             # My Journey / Learning Roadmap
│   │   │   ├── settings/            # User profile, password, about page
│   │   │   ├── games/
│   │   │   │   └── spelling/        # Spelling practice game
│   │   │   └── chatbot/
│   │   │       └── history/         # Chat history page
│   │   ├── chatbot/
│   │   ├── courses/
│   │   │   ├── [courseId]/
│   │   │   │   └── modules/
│   │   │   │       └── [moduleId]/
│   │   └── quiz/
│   ├── components/
│   │   ├── ui/                      # Reusable UI components
│   │   ├── chatbot/
│   │   ├── courses/
│   │   ├── quiz/
│   │   ├── dashboard/
│   │   ├── notifications/           # In-app notification components
│   │   ├── onboarding/              # Onboarding flow components
│   │   ├── journey/                 # Roadmap UI components
│   │   ├── games/                   # Game components
│   │   └── gamification/            # Streak, XP components
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── api.ts                   # API client for FastAPI calls
│   │   └── types.ts
│   └── public/
│
├── backend/                         # FastAPI Python Service
│   ├── main.py
│   ├── routers/
│   │   ├── chatbot.py
│   │   ├── courses.py
│   │   ├── quiz.py
│   │   ├── dashboard.py
│   │   ├── auth.py
│   │   ├── admin.py                 # /api/admin/*
│   │   ├── journey.py               # /api/journey/*
│   │   ├── notifications.py         # /api/notifications/*
│   │   ├── games.py                 # /api/games/*
│   │   └── profile.py               # /api/profile/*
│   ├── services/
│   │   ├── gemini_service.py        # Gemini API calls
│   │   ├── langchain_service.py     # LangChain chains setup
│   │   ├── rag_service.py           # RAG pipeline logic
│   │   ├── course_service.py        # Course generation logic
│   │   ├── quiz_service.py          # Quiz generation logic
│   │   ├── progress_service.py      # User progress tracking
│   │   ├── journey_service.py       # Roadmap generation logic
│   │   ├── image_service.py         # Nano Banana 2 image generation
│   │   ├── email_service.py         # Resend email integration
│   │   └── gamification_service.py  # Streak + XP logic
│   ├── models/
│   │   ├── user.py
│   │   ├── course.py
│   │   ├── quiz.py
│   │   └── progress.py
│   ├── db/
│   │   ├── database.py              # SQLAlchemy connection + pool
│   │   └── migrations/              # Alembic migrations
│   ├── middleware/
│   │   ├── rate_limiter.py
│   │   └── auth_middleware.py
│   ├── utils/
│   │   ├── content_filter.py        # Ethical content validation
│   │   ├── cache.py                 # Redis helpers
│   │   └── logger.py
│   └── requirements.txt
│
└── database/
    └── schema.sql                   # Initial schema reference
```

---

## 5. Core Features

### 5.1 Authentication

- Email + password registration and login
- JWT-based sessions with refresh tokens
- Protected routes (frontend + backend)
- User profile stored in PostgreSQL
- Google OAuth users are required to set a password immediately after their first Google sign-in via a non-dismissible SetPasswordModal before reaching the dashboard
- Once a password is set, users can sign in via either Google OAuth or email + password regardless of how they registered
- Email/password login is blocked only if password_hash is NULL (user signed up with Google and has not set a password yet)

### 5.2 AI Chatbot (Personal Tutor)

- Users chat freely in English or Malay to learn Bahasa Melayu
- Powered by LangChain + Google Gemini API
- Maintains conversation memory per session using LangChain memory
- RAG pipeline: retrieves relevant Malay language knowledge from pgvector
- Automatically tracks and saves vocabulary and grammar encountered in chat
- Responses are always educational, patient, and tutor-like in tone
- Must handle slow AI responses gracefully on frontend (streaming preferred)
- **App-wide feature awareness:** The chatbot system prompt includes full knowledge of all BahasaBot features (Courses, Quiz, Dashboard, My Journey, Games, Settings). When a user asks the chatbot to do something that belongs to another feature, it: (1) acknowledges the request warmly, (2) explains BahasaBot has a dedicated feature for it, (3) gives exact sidebar navigation instructions, (4) offers to help with something related it CAN do in chat. The chatbot never attempts to simulate or substitute for another feature. Implemented in `CHATBOT_SYSTEM_PROMPT` inside `backend/services/langchain_service.py`.

### 5.3 Dynamic Course Generator

- User inputs any topic in English (e.g. "ordering food at a restaurant")
- Content filter validates the topic is ethical and appropriate before generation
- Gemini + LangChain generates a structured course:
  - Course (title, description, learning objectives)
    - Module 1 (title, description)
      - Class 1.1 (lesson content, vocabulary, examples)
      - Class 1.2
      - Class 1.3
    - Module 2
      - Class 2.1 ...
    - Module N ...
- After completing ALL classes in a module, a Module Quiz is auto-generated
- Users must pass the module quiz before unlocking the next module
- All generated courses and progress are saved to PostgreSQL per user
- Users can view and resume their courses at any time

### 5.4 Module Quiz

- Auto-generated after user completes all classes in a module
- Questions are based on that module's content
- Multiple choice + fill-in-the-blank format
- Score is recorded
- Weak areas from quiz are flagged and saved to user profile
- User must complete quiz to unlock next module

### 5.5 Standalone Quiz Section

- Separate from module quizzes
- Adaptive — generates questions based on everything the user has learned (chatbot + all courses)
- Focuses on identified weak points from past quizzes and chat sessions
- Tracks score history over time
- Question types: MCQ, fill-in-the-blank, translation

### 5.6 User Dashboard

The dashboard must display:

- Overall progress (courses started, modules completed, classes completed)
- Vocabulary learned (word, meaning, source — chatbot or course name)
- Grammar points covered (rule, example, source)
- Quiz performance history (scores over time, improvement trend)
- Weak points (specific vocabulary or grammar areas needing review)
- Current proficiency level (mapped to BPS: BPS-1, BPS-2, BPS-3, BPS-4)
- Proficiency is calculated based on quiz scores + content completed
- Recommended next steps (what to study next)

### 5.7 Admin Control Panel

- Accessible only to users with role = 'admin' in the users table
- Admin dashboard: total users, active sessions, quiz pass rates, course generation counts
- User management: view all users, their proficiency level, activity, ability to deactivate accounts
- Content overview: view all generated courses and flag inappropriate ones
- Evaluation management: view all in-app feedback survey responses from the 30-user evaluation
- Protected route: /admin — returns 403 for non-admin users

### 5.8 My Journey — Personalized Learning Roadmap

- User answers 3 questions on first login: intent (5 preset options + free text), learning goal (free text), target timeline (1–6 months)
- System fetches user's current BPS level, weak_points, and native_language from DB
- Gemini generates an ordered flat list of course obstacle topics proportional to timeline: 1 month = 4, 2 months = 6, 3 months = 9, 4 months = 12, 5 months = 15, 6 months = 18
- Roadmap elements are COURSES ONLY — no quiz or chatbot activity types (v1 structure was retired in Phase 20 v2)
- Each obstacle: { order, topic, description, estimated_weeks, completed, completed_at }
- Completion tracked by fuzzy-matching completed course topics (fuzzywuzzy ≥ 70%) against obstacle topics in JSONB
- Roadmap stored in user_roadmaps table (JSONB elements); partial unique index enforces one active roadmap per user
- Visual road/path UI: completed (green checkmark), current (pulse/glow), locked (grey/foggy)
- Overdue state: if today > deadline and not complete → status = 'overdue'; user can extend once (extended=true after use)
- BPS upgrade banner: if BPS improved, Redis flag `journey_bps_upgrade:{user_id}` shown; user can regenerate uncompleted elements
- Identity-verified deletion: email users confirm password; Google OAuth users confirm email
- Past completed roadmaps shown in history section
- Nano Banana 2 generates a personalized banner image on creation (uses gender + age_range for subject prompt)
- User can delete roadmap and generate a new one with a new deadline at any time

### 5.9 Onboarding Flow

- Shown to new users on first login only (tracked via onboarding_completed boolean on users table)
- Multi-step modal/page: Welcome → What is your native language? → Why are you learning Malay? → Set your first goal (optional — can skip to Journey later) → Tour of sidebar features
- Data collected feeds into Journey roadmap personalization and chatbot tone
- Note: If the user later creates a Journey roadmap, the Journey's goal text overwrites the onboarding learning_goal on the users table, ensuring chatbot personalization stays current.

### 5.10 Pronunciation Audio

- Every vocabulary word displayed anywhere in the app (chatbot VocabPills, course class pages, quiz explanations, spelling game) must have a speaker icon
- Clicking the speaker icon triggers Web Speech API (SpeechSynthesis) with lang='ms-MY' to pronounce the Malay word
- Fallback: if ms-MY voice not available, use ms voice, then default
- No external API needed — fully browser-native, zero cost

### 5.11 Games Hub (Spelling Practice + Word Match)

- Accessible from sidebar via /games — a hub page showing both games as cards
- Games launch inline (no page navigation); "← Back to Games" returns to card selector
- **Spelling Practice Game**: user hears a word, types the spelling; difficulty modes Easy/Medium/Hard with per-difficulty timers (20s/10s/5s) and XP rewards (+1/+2/+4 XP respectively); Leitner-box weighted word selection (wrong words ×3 priority); fuzzy "Almost!" feedback (Levenshtein distance 1); 3-2-1 countdown; combo multiplier; session summary
- **Word Match Game**: shows a Malay word → user picks the correct English meaning from 4 options; difficulty modes Easy/Medium/Hard (20s/10s/5s timers; +1/+1/+2 XP); correct answer auto-plays audio; wrong answer reveals correct in green; same session summary pattern
- Both games use vocabulary_learned table; minimum 4 vocabulary entries required for Word Match
- Scores tracked in spelling_game_scores table with game_type column ('spelling' | 'word_match')
- Personal bests stored and displayed per game type

### 5.12 Gamification — Streak & XP

- Streak: consecutive days the user has completed at least one learning activity (course class, quiz, chatbot session, spelling/word-match game)
- **One-day grace period**: missing one calendar day does not reset the streak (two consecutive missed days still reset to 1) — implemented via `last_date in (yesterday, day_before_yesterday)` check in `gamification_service.py`
- Streak displayed in sidebar and dashboard
- XP points awarded: course class completed = 10 XP, quiz passed = 25 XP, chatbot session = 5 XP; spelling/word-match XP is difficulty-dependent:
  - Spelling: Easy = +1 XP, Medium = +2 XP, Hard = +4 XP (see `XP_TABLE` in `spelling_service.py`)
  - Word Match: Easy = +1 XP, Medium = +1 XP, Hard = +2 XP (see `games.py` router)
- Roadmap obstacle completed = +100 XP; roadmap completed on time = +500 XP; after deadline = +200 XP
- XP total and streak stored as columns on the users table (`streak_count`, `xp_total`); every XP award also appended to `xp_logs` table for weekly leaderboard aggregation
- Milestone notifications triggered at streak milestones (3, 7, 14, 30 days) and every 100 XP
- Streak milestone cards and BPS milestone cards generated by Nano Banana 2 and attached as `image_url` on the notification

### 5.13 In-App Notification System

- Bell icon in top navigation bar showing unread count badge
- Notification types (verified against codebase — all strings stored in notifications.type):
  - `streak_milestone` — fired at 3/7/14/30-day streak milestones (gamification_service.py)
  - `xp_milestone` — fired every 100 XP (gamification_service.py)
  - `course_complete` — fired when background course generation finishes (routers/courses.py)
  - `bps_milestone` — fired when user advances BPS level after a standalone quiz (quiz_service.py)
  - `journey_reminder` — reused for all four Phase 20 v2 journey hooks (journey_service.py):
    - Obstacle cleared: "You cleared an obstacle! ✅ '[topic]' is done."
    - Halfway-timeline warning: >50% of timeline elapsed but <30% of elements completed (one-time, Redis-gated)
    - 7-day deadline warning: deadline ≤ 7 days away and roadmap not completed (one-time, Redis-gated)
    - Journey completed: "You completed your entire journey! 🎉"
- Notifications stored in notifications table (user_id, type, message, read, image_url, created_at)
- GET /api/notifications/ — list last 20 notifications with unread count
- POST /api/notifications/{id}/read — mark as read
- POST /api/notifications/read-all — mark all read
- DELETE /api/notifications/ — delete all notifications for the user (clear-all button in panel)
- Notifications panel: dropdown from bell icon in AppSidebar (mobile header + desktop sidebar footer); panelSide + panelDirection props control popup direction

### 5.14 Forgot Password

- **3-endpoint 6-digit OTP flow** (no clickable links — more mobile-friendly and enumeration-safe):
  - POST /api/auth/forgot-password — accepts email; generates a 6-digit code; stores SHA256(email:code) hash (10-min TTL) in password_reset_tokens; sends styled email via Resend; returns 200 for both valid and non-existent emails (enumeration protection)
  - POST /api/auth/verify-reset-code — accepts email + code; validates hash; returns 200 (code not yet consumed)
  - POST /api/auth/reset-password — accepts email + code + new password; validates atomically; updates password hash; marks code used
- Reset tokens stored in password_reset_tokens table (token_hash, user_id, expires_at, used, created_at); expired tokens cleaned up opportunistically on each /forgot-password call
- Frontend: /forgot-password page — 4-step single-page flow (Email → 6-digit OTP boxes + resend cooldown → New Password → Success auto-redirect 4s); /reset-password page deprecated (shows redirect message)
- Only works for email/password accounts — Google OAuth accounts (password_hash IS NULL) receive an appropriate message

### 5.15 User Profile Management

- GET /api/profile/ — get current user profile (includes has_password bool for conditional password UI)
- PATCH /api/profile/ — update name, native language, learning goal, profile picture URL, onboarding_completed, has_seen_tour, gender, age_range; invalidates Redis profile cache on commit
- POST /api/profile/change-password — change password (requires current password; Google OAuth guard: blocked if password_hash IS NULL)
- POST /api/profile/delete-account — permanently delete account; bcrypt verify for email accounts, email-match confirm for Google OAuth; signs user out and cascades all DB rows
- Profile page at /settings/profile; uses free-text input + datalist for native_language (accommodates any format stored in DB); textarea for learning_goal
- Profile data feeds into Journey roadmap generation and chatbot personalization (Redis-cached 5 min in langchain_service)

### 5.16 Chat History Page

- /chatbot/history — lists all past chat sessions with title (first message as title), date, message count
- Clicking a session loads the full conversation in read-only view
- chat_sessions and chat_messages tables already exist — this is primarily a frontend feature
- GET /api/chatbot/sessions — already implemented, use this endpoint

### 5.17 Proficiency Framework — BahasaBot Proficiency Scale (BPS)

- CEFR labels (A1, A2, B1, B2) are renamed throughout the entire codebase and UI to BPS labels:
  - A1 → BPS-1 (Beginner)
  - A2 → BPS-2 (Elementary)
  - B1 → BPS-3 (Intermediate)
  - B2 → BPS-4 (Advanced)
- The system explains: "BahasaBot Proficiency Scale (BPS) measures your Malay proficiency based on quiz performance, vocabulary growth, and learning activity."
- All DB column values, frontend labels, dashboard displays, quiz results updated accordingly
- CEFR string is completely removed from user-facing text

### 5.18 Image Generation — Nano Banana 2

- Model: gemini-3.1-flash-image-preview via Gemini API
- Used in three places only:
  1. Journey roadmap banner — generated once when user creates their roadmap
  2. Milestone cards — generated when user reaches a new BPS level OR a streak milestone (3/7/14/30 days); both are fully implemented
     - BPS level-up: quiz_service._generate_and_save_milestone_card() → generate_milestone_card()
     - Streak milestone: gamification_service._generate_and_save_streak_milestone_card() → generate_streak_milestone_card()
  3. Course cover images — generated once when a course is first created, stored as URL
- Images stored as URLs in DB (not binary) — generate once, cache forever
- backend/services/image_service.py handles all generation calls
- Env var: GEMINI_IMAGE_MODEL=gemini-3.1-flash-image-preview

### 5.19 About / Credits Page

- Located at /settings/about
- Accessible from sidebar Settings section
- Displays: BahasaBot logo, USM logo, project name, version, developer name (Sowan), supervisor name (Dr. Tan Tien Ping), FYP academic year
- Simple, clean, professional page — not prominent but findable

### 5.20 30-User Evaluation & In-App Feedback Survey

- After a user completes any quiz (module or standalone), show an optional feedback prompt
- 3-question survey: overall experience rating (1–5), did the quiz reflect your weak areas? (yes/no/somewhat), open text feedback
- Responses stored in evaluation_feedback table (user_id, quiz_type, rating, weak_points_relevant, comments, created_at)
- Admin panel shows all feedback responses with aggregate stats
- This provides structured evidence for the FYP evaluation that the system collects and uses user learning data

### 5.21 Course Deduplication & Templating (Phase 24)

- The first course generated for a given topic+BPS-level combination is marked is_template=true and becomes the canonical reusable version
- Subsequent users requesting the same topic+level get a deep clone of the template in milliseconds, with zero Gemini API calls
- Topic slug normalisation: lowercase → strip non-alphanum → collapse whitespace → append level (e.g. "Ordering food at a Restaurant!" + "BPS-1" → "ordering-food-at-a-restaurant:bps1")
- DB columns on courses table: topic_slug (VARCHAR 600, indexed), is_template (BOOLEAN), cloned_from (UUID FK to courses.id, ON DELETE SET NULL)
- Clone scope: Course + all Modules + all Classes + cover_image_url; does NOT copy user-specific data (UserProgress, ModuleQuizAttempt, VocabularyLearned)
- Race condition handling: if two users hit the slow path simultaneously, only one becomes the template (the second checks again before claiming template status)
- Activity logged as "course_clone" vs "course_gen" in activity_logs for analytics distinction
- Implementation: backend/services/course_service.py — _make_topic_slug(), _find_template(), _clone_course(); generate_course() checks for template before calling Gemini

### 5.22 Subscription Marketing Pages (Phase 25 — Frontend-Only)

- Display-only pricing pages — NO backend, NO DB tables, NO feature gating, NO real payment integration
- /pricing — public page (reachable logged-out) showing 4 planned tiers: Free / 7-Day Power Pass / Monthly Pro / Semester Pass
- /settings/billing — logged-in mock view showing "Free Plan" + link to /pricing
- All plan data hardcoded in frontend/lib/subscription-plans.ts — never fetched from any API
- ComingSoonModal triggered by all "Start Free Trial" / "Subscribe" CTAs — explains payment integration is post-graduation
- Sidebar shows top-level "Pricing" nav item + PlanBadge ("Free Plan") in footer
- Every existing BahasaBot feature works exactly as before for every user — chat, course gen, quizzes, pronunciation, chat history, roadmap all remain unchanged and ungated
- The full backend monetization spec (Stripe integration, trial card-on-file, usage tracking, session enforcement, referral system, webhooks, cron jobs, admin panel additions) is documented in .claude/SUBSCRIPTION.md as a post-graduation roadmap, not built for the FYP
- Demo narrative for PIXEL 2026: "Pricing UI is built and locked; payment gateway integration is the next milestone, planned post-graduation alongside SSM business registration"

### 5.23 Daily Language Tips

- GET /api/tips/random — returns a random active tip from the tips table; shown as a `TipToast` framer-motion slide-in (8 s auto-dismiss) on the dashboard
- POST /api/tips/generate — admin-only; bulk-generates categorised tips via Gemini and stores them
- Tips suppressed for new users: TipToast reads the shared `["profile"]` React Query cache; does not show if `onboarding_completed === false` OR `has_seen_tour === false`
- Tips table: id, content, category (word_origin | common_mistakes | cultural_context | grammar), generated_by, is_active, created_at
- Alembic migration: 20260419_1000_tips_table.py

### 5.24 Weekly XP Leaderboard

- GET /api/dashboard/leaderboard — top-10 users by XP earned in the current calendar week (Mon–Sun); includes current user's rank even if outside top 10; Redis-cached 5 min; week resets Monday
- xp_logs table records every individual XP award event (user_id, xp_amount, source, created_at); weekly aggregation is a GROUP BY + SUM query on created_at >= Monday 00:00 UTC
- Frontend: LeaderboardCard with framer-motion animated podium (2nd–1st–3rd) for top 3; animated XP progress bars for ranks 4–10; days-until-Monday countdown chip
- Alembic migration: 20260420_1200_xp_logs_table.py

### 5.25 First-Login UI Tour

- Driver.js spotlight tour on desktop (md+ breakpoint), framer-motion card-slide tour on mobile (<768px)
- 8 steps covering all main sidebar features (Dashboard, AI Tutor, Courses, Quiz, Journey, Spelling Game, Settings)
- Tour state tracked via `has_seen_tour` boolean on users table; PATCH /api/profile/ sets it true on completion
- Tour fires after onboarding modal closes (gated by `!showOnboarding`); never shown concurrently with onboarding
- Mobile tour: full-screen dark overlay, 340px card, directional slide animations, pill progress dots, Skip button
- Alembic migration: 20260414_2100_add_has_seen_tour.py

---

## 6. Database Schema (Core Tables)

```sql
-- Users
-- proficiency_level stores BPS values (BPS-1 through BPS-4); the column name was never changed
-- provider: 'email' | 'google' — tracks original sign-up method only
users (id UUID, email VARCHAR(255) UNIQUE, password_hash VARCHAR(255) NULLABLE,
       name VARCHAR(255), provider VARCHAR(20) DEFAULT 'email',
       proficiency_level VARCHAR(10) DEFAULT 'BPS-1',  -- Enum: BPS-1/BPS-2/BPS-3/BPS-4
       is_active BOOLEAN DEFAULT true,
       onboarding_completed BOOLEAN DEFAULT false,
       has_seen_tour BOOLEAN DEFAULT false,
       native_language VARCHAR(100), learning_goal VARCHAR(500),
       profile_picture_url VARCHAR(1000),
       role VARCHAR(20) DEFAULT 'user',  -- 'user' | 'admin'
       streak_count INTEGER DEFAULT 0, xp_total INTEGER DEFAULT 0,
       gender VARCHAR(20),      -- 'male'|'female'|'non-binary'|'prefer_not_to_say'
       age_range VARCHAR(20),   -- 'under_18'|'18-24'|'25-34'|'35-44'|'45+'
       created_at TIMESTAMPTZ)

-- Courses (deduplication columns added Phase 24)
courses (id UUID, user_id UUID FK users, title VARCHAR(500), description TEXT,
         topic VARCHAR(500), objectives JSON, cover_image_url TEXT,
         topic_slug VARCHAR(600) INDEXED,  -- normalised "topic:level" lookup key
         is_template BOOLEAN DEFAULT false,
         cloned_from UUID FK courses ON DELETE SET NULL,
         created_at TIMESTAMPTZ)
modules (id UUID, course_id UUID FK courses, title VARCHAR(500), description TEXT,
         order_index INTEGER, created_at TIMESTAMPTZ)
classes (id UUID, module_id UUID FK modules, title VARCHAR(500), content TEXT,
         vocabulary_json JSON,  -- [{word, meaning, example}]
         examples_json JSON,    -- [{bm, en}]
         order_index INTEGER, created_at TIMESTAMPTZ)

-- Progress
user_progress (id UUID, user_id UUID, course_id UUID, module_id UUID,
               class_id UUID NULLABLE, completed_at TIMESTAMPTZ)
module_quiz_attempts (id UUID, user_id UUID, module_id UUID,
                      score FLOAT,  -- normalised 0.0–1.0; >= 0.70 = pass
                      answers_json JSON, taken_at TIMESTAMPTZ)
standalone_quiz_attempts (id UUID, user_id UUID, score FLOAT,
                          questions_json JSON, answers_json JSON, taken_at TIMESTAMPTZ)

-- Learning Tracking
vocabulary_learned (id UUID, user_id UUID, word VARCHAR(255), meaning TEXT,
                    source_type VARCHAR(20),  -- 'chatbot' | 'course'
                    source_id UUID, learned_at TIMESTAMPTZ)
grammar_learned (id UUID, user_id UUID, rule TEXT, example TEXT,
                 source_type VARCHAR(20), source_id UUID, learned_at TIMESTAMPTZ)
weak_points (id UUID, user_id UUID, topic VARCHAR(500),
             type VARCHAR(20),  -- 'vocab' | 'grammar'
             strength_score FLOAT DEFAULT 0.5,  -- 0.0 (very weak) → 1.0 (mastered)
             updated_at TIMESTAMPTZ)

-- Chatbot
chat_sessions (id UUID, user_id UUID, title TEXT, created_at TIMESTAMPTZ)
chat_messages (id UUID, session_id UUID FK chat_sessions,
               role VARCHAR(20),  -- 'user' | 'assistant'
               content TEXT, created_at TIMESTAMPTZ)

-- RAG
documents (id UUID, content TEXT, embedding vector(768), metadata_json JSON, created_at TIMESTAMPTZ)

-- Journey / Roadmap
-- Partial unique index user_roadmaps_one_active_per_user ON user_id WHERE status = 'active'
user_roadmaps (id UUID, user_id UUID FK users, intent VARCHAR(100), goal TEXT,
               timeline_months INTEGER CHECK (1 <= timeline_months <= 6),
               elements JSONB,  -- [{order, topic, description, estimated_weeks, completed, completed_at}]
               status VARCHAR(20) DEFAULT 'active',  -- 'active'|'overdue'|'completed'|'deleted'
               deadline DATE, extended BOOLEAN DEFAULT false,
               created_at TIMESTAMPTZ, completed_at TIMESTAMPTZ,
               bps_level_at_creation VARCHAR(10), banner_image_url TEXT)

-- Notifications
notifications (id UUID, user_id UUID, type VARCHAR(50), message TEXT,
               read BOOLEAN DEFAULT false, image_url TEXT, created_at TIMESTAMPTZ)

-- Auth
password_reset_tokens (id UUID, user_id UUID, token_hash VARCHAR(255),
                       expires_at TIMESTAMPTZ, used BOOLEAN DEFAULT false, created_at TIMESTAMPTZ)

-- Evaluation
evaluation_feedback (id UUID, user_id UUID,
                     quiz_type VARCHAR(20),  -- 'module' | 'standalone' | 'general'
                     rating INTEGER,  -- 1–5
                     weak_points_relevant VARCHAR(20),  -- 'yes'|'no'|'somewhat'
                     comments TEXT, created_at TIMESTAMPTZ)

-- Games (multi-game; game_type distinguishes spelling vs word_match)
spelling_game_scores (id UUID, user_id UUID, words_correct INTEGER,
                      words_attempted INTEGER, session_date DATE,
                      game_type VARCHAR(50) DEFAULT 'spelling')

-- Leaderboard
xp_logs (id UUID, user_id UUID FK users, xp_amount INTEGER, source VARCHAR(50), created_at TIMESTAMPTZ)

-- Daily Tips
tips (id UUID, content TEXT, category VARCHAR(50),
      generated_by VARCHAR(50) DEFAULT 'gemini',
      is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ)

-- Analytics / Monitoring
token_usage_logs (id UUID, user_id UUID, feature VARCHAR(30),
                  input_tokens INTEGER, output_tokens INTEGER,
                  total_tokens INTEGER, created_at TIMESTAMPTZ)
activity_logs (id UUID, user_id UUID, feature VARCHAR(30),
               duration_seconds INTEGER DEFAULT 0, created_at TIMESTAMPTZ)
```

---

## 7. API Design

### FastAPI Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/refresh             # Exchange refresh token for new access token
POST   /api/auth/google              # Verify Google ID token, return JWT tokens
POST   /api/auth/forgot-password     # Send 6-digit OTP to email
POST   /api/auth/verify-reset-code   # Validate OTP (does not consume it)
POST   /api/auth/reset-password      # Consume OTP + update password
POST   /api/auth/set-password        # Set password for Google users with NULL password_hash

POST   /api/chatbot/message          # Send message, receive SSE streaming response
GET    /api/chatbot/history          # Paginated message history for a session
GET    /api/chatbot/sessions         # List user's sessions (with title + message count)
DELETE /api/chatbot/sessions/{id}    # Delete session + cascade messages
GET    /api/chatbot/prewarm          # Warm the profile Redis cache before first message

POST   /api/courses/generate         # Generate/clone course from topic (202 + job_id)
GET    /api/courses/jobs/{job_id}    # Poll background job status
GET    /api/courses/                 # Paginated course list with progress
GET    /api/courses/{course_id}      # Full course tree + per-class lock/progress state
GET    /api/courses/{course_id}/cover # Raw cover image bytes (immutable, browser-cached)
GET    /api/courses/{course_id}/modules/{module_id}/classes/{class_id}  # Class detail
POST   /api/courses/{course_id}/modules/{module_id}/classes/{class_id}/complete  # Mark done
GET    /api/courses/{course_id}/modules/{module_id}/quiz    # Get/generate module quiz
POST   /api/courses/{course_id}/modules/{module_id}/quiz    # Submit module quiz
DELETE /api/courses/{course_id}      # Delete course + cascade

GET    /api/quiz/                    # Generate adaptive standalone quiz (15 questions)
POST   /api/quiz/submit              # Score + update weak_points + recalculate BPS level

GET    /api/dashboard/               # Full dashboard summary (Redis cached 5 min)
GET    /api/dashboard/vocabulary     # Paginated vocabulary list
GET    /api/dashboard/grammar        # Paginated grammar list
GET    /api/dashboard/progress       # Course progress breakdown
GET    /api/dashboard/weak-points    # Weak points + recommendations
GET    /api/dashboard/quiz-history   # Paginated quiz history
GET    /api/dashboard/leaderboard    # Top-10 weekly XP leaderboard + current user rank

GET    /api/profile/                 # Get current user profile (includes has_password)
PATCH  /api/profile/                 # Update profile fields (invalidates chatbot profile cache)
POST   /api/profile/change-password  # Change password (Google-account guard)
POST   /api/profile/delete-account   # Permanently delete account (bcrypt/email confirm)

GET    /api/admin/stats              # Admin dashboard stats (Redis cached 2 min)
GET    /api/admin/users              # Paginated user list (search, date filter, last_active)
GET    /api/admin/users/{id}         # Full user profile + 8 stat counts
GET    /api/admin/users/{id}/analytics  # Token/activity charts (7–90 day range)
GET    /api/admin/users/{id}/quiz-attempts  # Raw Q&A quiz history (collapsible)
PATCH  /api/admin/users/{id}/deactivate     # Deactivate user account
DELETE /api/admin/users/{id}         # Delete user (admin_password body required)
POST   /api/admin/users/{id}/reset   # Reset user data (admin_password body required)
GET    /api/admin/feedback           # Paginated evaluation feedback
GET    /api/admin/journeys           # All user roadmaps (read-only)
GET    /api/admin/analytics/score-distribution   # Cohort score histogram + mean/median
GET    /api/admin/analytics/weak-points          # Top 20 weak-point topics (sortable)
GET    /api/admin/export/users       # CSV export: all users
GET    /api/admin/export/quiz-attempts  # CSV export: all quiz attempts
GET    /api/admin/export/feedback    # CSV export: all feedback

POST   /api/journey/roadmap/generate          # Generate new roadmap (3-question input)
GET    /api/journey/roadmap                    # Get active roadmap + flags (checks overdue/BPS)
GET    /api/journey/roadmap/history            # Past completed/deleted roadmaps
POST   /api/journey/roadmap/verify-and-delete  # Identity-verified soft-delete
PATCH  /api/journey/roadmap/extend             # Extend deadline once (extended=true after)
POST   /api/journey/roadmap/regenerate         # Regen uncompleted elements after BPS upgrade
DELETE /api/journey/roadmap/dismiss-upgrade    # Clear BPS upgrade Redis flag

GET    /api/notifications/           # Last 20 notifications + unread count
POST   /api/notifications/{id}/read  # Mark single notification read
POST   /api/notifications/read-all   # Mark all read
DELETE /api/notifications/           # Delete all notifications (clear-all)

GET    /api/games/spelling/word      # Next weighted spelling word
POST   /api/games/spelling/submit    # Submit answer (difficulty param; fuzzy matching)
POST   /api/games/spelling/session   # Save session score (upsert best per day per game_type)
GET    /api/games/spelling/best      # Personal best for spelling game
GET    /api/games/word-match/question  # Next MCQ word match question (4 shuffled options)
POST   /api/games/word-match/submit    # Submit MCQ answer
POST   /api/games/word-match/session   # Save word match session score
GET    /api/games/word-match/best      # Personal best for word match game

POST   /api/evaluation/feedback      # Submit survey (quiz_type: module|standalone|general)

GET    /api/tips/random              # Random active tip (suppressed during onboarding)
POST   /api/tips/generate            # Admin only: bulk-generate tips via Gemini

GET    /health                       # Health check: app status + Redis ping
```

---

## 8. Production Requirements

Even though this is an FYP with ~30 users, it MUST be built to production standards. This is non-negotiable.

### Security

- All environment variables in `.env` files — never hardcoded
- Input sanitization on ALL user inputs (especially course topic generator)
- Ethical content filter on course topic input (no harmful/offensive topics)
- JWT tokens with proper expiry and refresh logic
- CORS configured properly — only allow the frontend domain
- SQL injection protection via SQLAlchemy ORM (no raw SQL with user input)
- Rate limiting on all endpoints — especially chatbot and course generator

### Performance

- Async FastAPI throughout — use `async def` for all route handlers
- Redis caching for:
  - Repeated/similar Gemini API responses
  - Dashboard data (refresh every 5 mins)
  - Quiz questions (cache generated quizzes)
- PostgreSQL connection pooling via SQLAlchemy
- Proper DB indexes on: user_id, course_id, module_id, created_at
- Pagination on all list endpoints (courses, vocabulary, quiz history)
- Streaming responses for chatbot (don't wait for full Gemini response)

### Reliability

- Try/catch error handling on EVERY Gemini API call
- Fallback messages when AI fails ("Sorry, I'm having trouble right now...")
- Frontend loading states for all async operations
- Frontend error boundaries for unexpected crashes
- All background tasks (course generation) handled gracefully

### Monitoring

- Python logging throughout FastAPI (INFO + ERROR levels minimum)
- Sentry integration on both frontend and backend (free tier)
- UptimeRobot monitoring on the deployed backend URL

---

## 9. Development Constraints & Limitations

- **FYP Constraint:** All mandatory tech stack items MUST be clearly used and demonstrable
- **LLM Constraint:** Only Google Gemini API is used for LLM — do not switch to OpenAI or Anthropic
- **Budget Constraint:** Deployment must fit within free tiers of Vercel, Railway/Render, Supabase/Neon
- **Gemini API Cost:** Rate limit chatbot and course generation to avoid excessive API costs
- **Solo Developer:** One developer — keep code readable, well-commented, and avoid over-engineering
- **Deployment Status:** Project is deployed in production at https://bahasabot-main3.vercel.app — ongoing iteration and feature additions
- **Scope Lock:** Refer to Section 5 features 5.1 through 5.25 as the complete and locked feature list
- **Concurrency:** Course class content generation is limited to `asyncio.Semaphore(2)` — NOT 3 — to respect the free-tier Gemini RPM limit (`_CONTENT_SEMAPHORE = asyncio.Semaphore(2)` in `backend/services/course_service.py`)
- **JWT Timing:** Access token default is 15 minutes (`ACCESS_TOKEN_EXPIRE_MINUTES=15` env var, overridable); refresh token is 7 days; NextAuth front-end refreshes 60 s before expiry (29-minute client-side TTL)

---

## 10. Risk Management

| Risk                              | Likelihood | Impact | Mitigation                                                        |
| --------------------------------- | ---------- | ------ | ----------------------------------------------------------------- |
| Gemini API slow/unavailable       | Medium     | High   | Retry logic + fallback error messages + Redis cache               |
| Gemini API cost overrun           | Medium     | Medium | Rate limiting per user per day, cache repeated queries            |
| Course generation too slow        | High       | Medium | Use streaming or background task with progress indicator          |
| pgvector setup failure            | Medium     | High   | Test early in Phase 1; have fallback to basic keyword search      |
| Auth security vulnerability       | Low        | High   | Use proven library (NextAuth/Supabase), never roll custom auth    |
| DB schema changes mid-build       | Medium     | Medium | Use Alembic migrations from Day 1                                 |
| Frontend-Backend CORS issues      | High       | Medium | Configure CORS explicitly on Day 1                                |
| Scope creep                       | High       | High   | Strictly follow feature list; no additions without full review    |
| Deployment environment mismatch   | Medium     | Medium | Use `.env.example`, Docker optional but document all env vars     |
| Ethical content filter bypass     | Low        | High   | Server-side validation only; never trust frontend alone           |
| Gemini Image API cost overrun     | Low        | Medium | Generate images once per event, store URL, never regenerate       |
| Resend email delivery failure     | Low        | Low    | Log failed sends, show user a manual reset link fallback          |
| 30-user evaluation coordination   | High       | High   | Prepare seed accounts + evaluation guide doc in advance           |

---

## 11. Coding Standards

Always follow these standards throughout the project:

### General

- Write clean, readable, well-commented code
- Every function/class should have a docstring or inline comment explaining purpose
- No hardcoded secrets, API keys, or credentials anywhere in code
- Use `.env` for all environment-specific values

### Python (FastAPI backend)

- Use `async def` for all route handlers and service calls
- Pydantic models for all request/response schemas
- SQLAlchemy ORM — no raw SQL with user input
- Raise proper HTTP exceptions with meaningful messages
- Log errors with full traceback using Python `logging` module

### TypeScript (Next.js frontend)

- Use TypeScript strictly — no `any` types
- All API calls go through a central `lib/api.ts` client
- Handle all loading, error, and empty states in every component
- Use Next.js App Router patterns (server components where possible)
- Never expose backend URLs or secrets in frontend code

### Database

- Always use Alembic for schema changes — no manual DB edits in production
- Every table must have `id` (UUID preferred), `created_at`, and appropriate foreign keys
- Add DB indexes from the start on frequently queried columns

---

## 12. Environment Variables

### Frontend (.env.local)

```
NEXTAUTH_URL=
NEXTAUTH_SECRET=
NEXT_PUBLIC_API_URL=          # FastAPI backend URL
NEXT_PUBLIC_SUPABASE_URL=     # If using Supabase Auth
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GOOGLE_CLIENT_ID= # Google OAuth client ID (must match backend GOOGLE_CLIENT_ID)
NEXT_PUBLIC_SENTRY_DSN=       # Sentry DSN for frontend error monitoring (optional)
```

### Backend (.env)

```
DATABASE_URL=                 # PostgreSQL connection string (asyncpg driver, ssl=require)
SYNC_DATABASE_URL=            # PostgreSQL sync connection string for Alembic migrations (psycopg2 driver, sslmode=require)
REDIS_URL=                    # Redis connection string
GEMINI_API_KEY=               # Google Gemini API key
JWT_SECRET=
FRONTEND_URL=                 # Next.js frontend URL (for CORS)
ENVIRONMENT=                  # development / production
RESEND_API_KEY=               # Resend email service API key
RESEND_FROM_EMAIL=            # From-address for transactional emails (e.g. noreply@yourdomain.com)
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image-preview
ADMIN_EMAILS=                 # Comma-separated emails that get role='admin' on registration (e.g. dev@example.com,supervisor@example.com). Falls back to ADMIN_EMAIL if not set.
GOOGLE_CLIENT_ID=             # Google OAuth client ID (must match frontend NEXT_PUBLIC_GOOGLE_CLIENT_ID)
GOOGLE_CLIENT_SECRET=         # Google OAuth client secret (backend only, never expose)
SENTRY_DSN=                   # Sentry DSN for backend error monitoring (optional but recommended)
```

### Notes on environment variables
- DATABASE_URL must use postgresql+asyncpg://...?ssl=require (omit channel_binding=require — asyncpg does not support it)
- SYNC_DATABASE_URL must use postgresql+psycopg2://...?sslmode=require (Alembic only)
- For Neon pooled connections, statement_cache_size=0 is required in code (already applied in backend/db/database.py) — do NOT remove
- GOOGLE_CLIENT_ID in backend and NEXT_PUBLIC_GOOGLE_CLIENT_ID in frontend MUST be identical

---

## 13. Feature → File Map

### Auth
- frontend/app/(auth)/login/page.tsx, register/page.tsx
- frontend/lib/auth.ts, frontend/middleware.ts
- frontend/app/api/auth/[...nextauth]/route.ts
- backend/routers/auth.py, backend/models/user.py
- backend/middleware/auth_middleware.py
- frontend/components/auth/SetPasswordModal.tsx

### AI Chatbot
- frontend/app/(dashboard)/chatbot/page.tsx, layout.tsx
- frontend/components/chatbot/ChatMessage.tsx, VocabularyHighlight.tsx
- backend/routers/chatbot.py
- backend/services/langchain_service.py, rag_service.py, gemini_service.py

### Course Generator
- frontend/app/(dashboard)/courses/page.tsx
- frontend/app/(dashboard)/courses/[courseId]/page.tsx
- frontend/app/(dashboard)/courses/[courseId]/modules/[moduleId]/page.tsx
- frontend/app/(dashboard)/courses/[courseId]/modules/[moduleId]/classes/[classId]/page.tsx
- frontend/components/courses/CourseGenerationModal.tsx
- backend/routers/courses.py, backend/services/course_service.py
- backend/utils/content_filter.py

### Quiz
- frontend/app/(dashboard)/quiz/adaptive/page.tsx, results/page.tsx
- frontend/app/(dashboard)/quiz/module/[moduleId]/page.tsx, results/page.tsx
- frontend/app/(dashboard)/courses/[courseId]/modules/[moduleId]/quiz/page.tsx
- frontend/components/quiz/QuizQuestion.tsx
- backend/routers/quiz.py, backend/services/quiz_service.py

### Dashboard
- frontend/app/(dashboard)/dashboard/page.tsx
- frontend/components/dashboard/StatsCards.tsx
- frontend/components/dashboard/BPSProgressBar.tsx
- frontend/components/dashboard/WeakPointsChart.tsx
- frontend/components/dashboard/VocabularyTable.tsx
- frontend/components/dashboard/QuizHistoryTable.tsx
- backend/routers/dashboard.py
- backend/services/progress_service.py

### Shared Types & Utilities
- frontend/lib/types.ts — all TypeScript interfaces
- frontend/lib/api.ts — all API calls (Axios client)
- backend/db/database.py — async DB session
- backend/middleware/auth_middleware.py — JWT dependency
- backend/.env.example — all environment variables

### Admin Panel
- frontend/app/(dashboard)/admin/page.tsx
- frontend/app/(dashboard)/admin/users/page.tsx
- frontend/app/(dashboard)/admin/users/[userId]/page.tsx
- frontend/app/(dashboard)/admin/feedback/page.tsx
- frontend/app/(dashboard)/admin/journeys/page.tsx
- backend/routers/admin.py
- backend/services/admin_service.py
- backend/models/analytics.py
- backend/utils/analytics.py

### My Journey
- frontend/app/(dashboard)/journey/page.tsx (self-contained road UI + 3-question modal + all states)
- backend/routers/journey.py
- backend/services/journey_service.py
- backend/models/journey.py (UserRoadmap ORM model)

### Onboarding
- frontend/components/onboarding/OnboardingModal.tsx
- frontend/components/onboarding/OnboardingStep.tsx

### Pronunciation Audio
- frontend/hooks/usePronunciation.ts — Web Speech API hook
- frontend/components/ui/SpeakerButton.tsx — reusable speaker icon button

### Spelling Game
- frontend/app/(dashboard)/games/spelling/page.tsx
- frontend/components/games/SpellingGame.tsx
- backend/routers/games.py
- backend/services/spelling_service.py

### Gamification
- frontend/components/gamification/StreakBadge.tsx
- frontend/components/gamification/XPBar.tsx
- backend/services/gamification_service.py

### Notifications
- frontend/components/notifications/NotificationBell.tsx
- frontend/components/notifications/NotificationPanel.tsx
- backend/routers/notifications.py

### Profile & Settings
- frontend/app/(dashboard)/settings/profile/page.tsx
- frontend/app/(dashboard)/settings/about/page.tsx
- frontend/app/(dashboard)/settings/password/page.tsx
- backend/routers/profile.py

### Forgot Password
- frontend/app/(auth)/forgot-password/page.tsx
- frontend/app/(auth)/reset-password/page.tsx
- backend/services/email_service.py

### Chat History
- frontend/app/(dashboard)/chatbot/history/page.tsx
- frontend/components/chatbot/ChatHistoryList.tsx

### Image Generation
- backend/services/image_service.py

### Evaluation Feedback
- frontend/components/quiz/EvaluationFeedbackModal.tsx
- backend/routers/evaluation.py

---

## 14. Known Issues & Compatibility Notes

### Admin Accounts
`ADMIN_EMAILS` (comma-separated) in `.env` grants `role='admin'` automatically to any listed email on registration. Current value: `sowangemini@gmail.com,drtan@supervisor.com`.

| Name | Email |
|---|---|
| Noor Mohammad Sowan | sowangemini@gmail.com |
| Dr. Tan (FYP supervisor) | drtan@supervisor.com |

To add more admins: append to `ADMIN_EMAILS` in `.env` and redeploy, then register with that email.

### Node.js Version
shadcn/ui (`validate-npm-package-name@7.0.2`) requires Node.js `^20.17.0` or `>=22.9.0`. Node.js `20.10.0` will show an `EBADENGINE` warning during `npx shadcn init` but the command still succeeds. To eliminate the warning, upgrade to Node.js `20.17.0+` or `22.x`.

### Neon PostgreSQL — Connection String Format
The raw Neon connection string must be converted before use:
- **Runtime (`DATABASE_URL`):** driver `asyncpg`, format `postgresql+asyncpg://...?ssl=require`
- **Alembic migrations (`SYNC_DATABASE_URL`):** driver `psycopg2`, format `postgresql+psycopg2://...?sslmode=require`
- `channel_binding=require` must be omitted — asyncpg does not support it and will raise a connection error.

### Python Package Version Pins
`langchain-postgres` requires `pgvector>=0.2.5,<0.3.0` (Python client package only). This does not affect the PostgreSQL extension version on Neon.

### passlib + bcrypt Incompatibility
`passlib` has a bug with `bcrypt >= 4.x` causing 500 errors on password hashing. The project uses `bcrypt` directly (`bcrypt.hashpw` / `bcrypt.checkpw`) instead of `passlib.CryptContext`.

### Google OAuth — Package Versions
The project installs both `google-auth==2.29.0` (for Google ID token verification) and `google-generativeai` (for Gemini). Pin `google-auth` to `2.29.0` to avoid version conflicts.

### Google OAuth — Users Table Schema
`password_hash` is nullable to support Google-only accounts. The `provider` column (`'email'` | `'google'`) tracks original sign-up method but does NOT restrict login method. All users can use both Google OAuth and email/password once a password is set. Google-created accounts with NULL `password_hash` are prompted to set a password immediately after first Google sign-in via the mandatory `SetPasswordModal`.

### Neon PgBouncer + asyncpg — Prepared Statement Cache
The `DATABASE_URL` uses Neon's pooler endpoint (`-pooler.` in hostname), which runs PgBouncer in transaction mode. asyncpg caches prepared statements per connection by default; PgBouncer recycles the underlying server connection after each transaction, so the server no longer has those statements. This causes `prepared statement "..." does not exist` errors ~5 minutes after first use. Fix: `connect_args={"statement_cache_size": 0}` in `create_async_engine()` — already applied in `backend/db/database.py`. Do NOT remove this setting.

### Vercel Deployment URLs — CORS
Vercel generates a unique subdomain for every push (e.g. `bahasa-<hash>-noor-mohammad-sowans-projects.vercel.app`). The canonical domain (`bahasa-bot.vercel.app`) is always in `ALLOWED_ORIGINS`, but deployment-specific preview URLs change every deploy. The backend uses `allow_origin_regex=r"https://bahasa-.*\.vercel\.app"` in CORSMiddleware to accept all of them without hardcoding — already applied in `backend/main.py`. Do NOT remove this regex.

---

## 15. Claude Code Rules

- NEVER read entire files — use grep and line ranges
- NEVER modify auth logic unless explicitly asked
- NEVER change DB column names without explicit instruction
- NEVER touch venv/ or node_modules/
- Always ask which specific file/function to focus on before starting
- This is production-grade: always include error handling and input validation
- ALWAYS read .claude/STATUS.md and .claude/PHASES.md at the start of EVERY session — this is enforced by the Session Start Protocol at the top of this file. Do not skip this step even for trivial-seeming tasks.
- **Always check this file before starting any task**
- **Never remove or replace a mandatory tech stack item**
- **Always generate modular code** — each feature is its own module/router/service
- **Never put business logic inside route handlers** — use service files
- **Always handle errors** — no unhandled promises, no bare except clauses
- **Always use environment variables** — never hardcode any value that belongs in .env
- **Ask before making architectural decisions** not covered in this file
- **Keep the codebase consistent** — follow established patterns already in the project
- **Production level only** — no shortcuts, no "TODO: add this later" in critical paths
- NEVER regenerate images that already have a stored URL in the DB
- NEVER expose admin routes to non-admin users — always check role server-side
- BPS level labels (BPS-1 through BPS-4) must be used everywhere — CEFR labels are fully retired
- All new features must follow the same service/router pattern — no business logic in route handlers
