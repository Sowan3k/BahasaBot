# BahasaBot — Claude Master Context

> This file is the single source of truth for the BahasaBot project.
> Read this file completely before making any decisions, generating any code, or suggesting any changes.
> Every response, every file generated, every architectural decision must align with what is written here.

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
│   │   ├── audio_service.py         # Pronunciation helpers
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

### 5.2 AI Chatbot (Personal Tutor)

- Users chat freely in English or Malay to learn Bahasa Melayu
- Powered by LangChain + Google Gemini API
- Maintains conversation memory per session using LangChain memory
- RAG pipeline: retrieves relevant Malay language knowledge from pgvector
- Automatically tracks and saves vocabulary and grammar encountered in chat
- Responses are always educational, patient, and tutor-like in tone
- Must handle slow AI responses gracefully on frontend (streaming preferred)

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

- User sets a learning deadline (2 months to 1 year) and a goal type (survival, conversational, academic Malay)
- System fetches user's current proficiency level and weak_points from DB
- Gemini generates a structured JSON roadmap: phases → weeks → activities
- Each activity has a type: 'course', 'quiz', or 'chatbot'
- type='course' → clicking navigates to /courses with topic pre-populated in CourseGenerationModal
- type='quiz' → clicking navigates to /quiz/adaptive with topic context
- type='chatbot' → clicking navigates to /chatbot with a suggested prompt pre-filled
- Roadmap is saved to DB (learning_roadmaps table) as JSONB — one active roadmap per user
- Activity completions tracked in roadmap_activity_completions table
- Completed activities cross-referenced against user_progress and standalone_quiz_attempts to show visual progress
- User can delete roadmap and generate a new one with a new deadline at any time
- Nano Banana 2 generates a personalized banner image for the roadmap on creation

### 5.9 Onboarding Flow

- Shown to new users on first login only (tracked via onboarding_completed boolean on users table)
- Multi-step modal/page: Welcome → What is your native language? → Why are you learning Malay? → Set your first goal (optional — can skip to Journey later) → Tour of sidebar features
- Data collected feeds into Journey roadmap personalization and chatbot tone

### 5.10 Pronunciation Audio

- Every vocabulary word displayed anywhere in the app (chatbot VocabPills, course class pages, quiz explanations, spelling game) must have a speaker icon
- Clicking the speaker icon triggers Web Speech API (SpeechSynthesis) with lang='ms-MY' to pronounce the Malay word
- Fallback: if ms-MY voice not available, use ms voice, then default
- No external API needed — fully browser-native, zero cost

### 5.11 Spelling Practice Game

- Accessible from sidebar under Games
- System picks a Malay vocabulary word from the user's vocabulary_learned table
- Audio plays automatically: user hears the word pronounced
- User types the spelling into an input field
- Correct: +XP, visual celebration, next word
- Incorrect: show correct spelling with IPA, explanation, try again option
- Score tracked per session; personal best saved to DB

### 5.12 Gamification — Streak & XP

- Streak: consecutive days the user has completed at least one learning activity (course class, quiz, chatbot session, spelling game)
- Streak displayed in sidebar and dashboard
- XP points awarded: course class completed = 10 XP, quiz passed = 25 XP, chatbot session = 5 XP, spelling word correct = 2 XP
- XP total and streak stored in user_streaks and user_xp tables (or as columns on users table)
- Milestone notifications triggered at streak milestones (3, 7, 14, 30 days) and XP milestones

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
- Notifications stored in notifications table (user_id, type, message, read, created_at)
- GET /api/notifications/ — list last 20 notifications with unread count
- POST /api/notifications/{id}/read — mark as read
- POST /api/notifications/read-all — mark all read
- Notifications panel: dropdown from bell icon showing last 20 notifications

### 5.14 Forgot Password

- POST /api/auth/forgot-password — accepts email, generates a secure time-limited reset token (15 min TTL), sends email via Resend
- POST /api/auth/reset-password — accepts token + new password, validates token not expired, updates password hash
- Reset tokens stored in password_reset_tokens table (token_hash, user_id, expires_at, used)
- Frontend: /forgot-password page and /reset-password?token=... page
- Only works for email/password accounts — Google OAuth accounts show a message directing them to Google

### 5.15 User Profile Management

- GET /api/profile/ — get current user profile
- PATCH /api/profile/ — update name, native language, learning goal, profile picture (URL)
- Profile page at /settings/profile
- Fields: display name, email (read-only), native language, reason for learning Malay, profile picture upload
- Profile data feeds into Journey roadmap generation and chatbot personalization

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
  2. Milestone cards — generated when user reaches a new BPS level or streak milestone
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

---

## 6. Database Schema (Core Tables)

```sql
-- Users
-- proficiency_level stores BPS values (BPS-1 through BPS-4); the column name was never changed
users (id, email, password_hash, name, created_at, proficiency_level,
       onboarding_completed, native_language, learning_goal,
       profile_picture_url, role, streak_count, xp_total)

-- Courses
courses (id, user_id, title, description, topic, objectives, created_at, cover_image_url TEXT)
modules (id, course_id, title, description, order_index)
classes (id, module_id, title, content, vocabulary_json, examples_json, order_index)

-- Progress
user_progress (id, user_id, course_id, module_id, class_id, completed_at)
module_quiz_attempts (id, user_id, module_id, score, answers_json, taken_at)
standalone_quiz_attempts (id, user_id, score, questions_json, answers_json, taken_at)

-- Learning Tracking
vocabulary_learned (id, user_id, word, meaning, source_type, source_id, learned_at)
grammar_learned (id, user_id, rule, example, source_type, source_id, learned_at)
weak_points (id, user_id, topic, type [vocab/grammar], strength_score, updated_at)

-- Chatbot
chat_sessions (id, user_id, title TEXT, created_at)
chat_messages (id, session_id, role [user/assistant], content, created_at)

-- RAG
documents (id, content, embedding vector(768), metadata_json, created_at)

-- Journey / Roadmap
-- Partial unique index on user_id WHERE status = 'active' enforces one active roadmap per user
user_roadmaps (id UUID, user_id UUID FK users, intent VARCHAR(100), goal TEXT,
               timeline_months INTEGER CHECK (timeline_months BETWEEN 1 AND 6),
               elements JSONB, status VARCHAR(20) DEFAULT 'active', deadline DATE,
               extended BOOLEAN DEFAULT false, created_at TIMESTAMPTZ,
               completed_at TIMESTAMPTZ, bps_level_at_creation VARCHAR(10),
               banner_image_url TEXT)

-- Notifications
notifications (id, user_id, type, message, read BOOLEAN, image_url TEXT, created_at)

-- Auth
password_reset_tokens (id, user_id, token_hash, expires_at, used BOOLEAN, created_at)

-- Evaluation
evaluation_feedback (id, user_id, quiz_type, rating, weak_points_relevant, comments, created_at)

-- Games
spelling_game_scores (id, user_id, words_correct, words_attempted, session_date)

-- Analytics / Monitoring
token_usage_logs (id, user_id, feature, input_tokens, output_tokens, total_tokens, created_at)
activity_logs (id, user_id, feature, duration_seconds, created_at)
```

---

## 7. API Design

### FastAPI Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

POST   /api/chatbot/message          # Send message, get AI response
GET    /api/chatbot/history          # Get chat history for user
GET    /api/chatbot/sessions         # List user's sessions

POST   /api/courses/generate         # Generate a new course from topic (enqueues background job)
GET    /api/courses/jobs/{job_id}    # Poll background course generation status
GET    /api/courses/                 # List user's courses
GET    /api/courses/{course_id}      # Get full course structure
POST   /api/courses/{course_id}/modules/{module_id}/complete   # Mark module done
GET    /api/courses/{course_id}/modules/{module_id}/quiz       # Get module quiz
POST   /api/courses/{course_id}/modules/{module_id}/quiz       # Submit module quiz

GET    /api/quiz/                    # Get adaptive standalone quiz
POST   /api/quiz/submit              # Submit standalone quiz

GET    /api/dashboard/               # Get full dashboard data
GET    /api/dashboard/vocabulary     # Get vocabulary list
GET    /api/dashboard/grammar        # Get grammar list
GET    /api/dashboard/progress       # Get progress stats
GET    /api/dashboard/weak-points    # Get weak points

GET    /api/profile/                 # Get current user profile
PATCH  /api/profile/                 # Update profile fields
POST   /api/profile/change-password  # Change password (Google-account guard)

GET    /api/admin/stats              # Admin dashboard stats
GET    /api/admin/users              # Admin user list
GET    /api/admin/feedback           # Admin evaluation feedback view
GET    /api/admin/journeys           # Admin: all user roadmaps (read-only)

POST   /api/journey/roadmap/generate          # Generate new roadmap (3-question input)
GET    /api/journey/roadmap                    # Get active roadmap + flags
GET    /api/journey/roadmap/history            # Get past completed/deleted roadmaps
POST   /api/journey/roadmap/verify-and-delete  # Identity-verified deletion
PATCH  /api/journey/roadmap/extend             # Extend deadline (one-time)
POST   /api/journey/roadmap/regenerate         # Regen uncompleted after BPS upgrade
DELETE /api/journey/roadmap/dismiss-upgrade    # Clear BPS upgrade flag

GET    /api/notifications/           # List unread notifications
POST   /api/notifications/{id}/read  # Mark notification as read
POST   /api/notifications/read-all   # Mark all notifications read

GET    /api/games/spelling/word      # Get next spelling word
POST   /api/games/spelling/submit    # Submit spelling attempt
POST   /api/games/spelling/session   # Save session score
GET    /api/games/spelling/best      # Get personal best

POST   /api/evaluation/feedback      # Submit optional user feedback
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
- **Timeline:** ~16–21 days to a publishable version
- **Scope Lock:** Scope is now extended — refer to Section 5 features 5.1 through 5.20 as the complete and locked feature list

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
```

### Backend (.env)

```
DATABASE_URL=                 # PostgreSQL connection string
REDIS_URL=                    # Redis connection string
GEMINI_API_KEY=               # Google Gemini API key
JWT_SECRET=
FRONTEND_URL=                 # Next.js frontend URL (for CORS)
ENVIRONMENT=                  # development / production
RESEND_API_KEY=               # Resend email service API key
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image-preview
ADMIN_EMAIL=                  # Email address that gets admin role on first registration
```

---

## 13. Feature → File Map

### Auth
- frontend/app/(auth)/login/page.tsx, register/page.tsx
- frontend/lib/auth.ts, frontend/middleware.ts
- frontend/app/api/auth/[...nextauth]/route.ts
- backend/routers/auth.py, backend/models/user.py
- backend/middleware/auth_middleware.py

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
`password_hash` is nullable to support Google-only accounts. The `provider` column (`'email'` | `'google'`) tracks account creation method. If an existing email/password account signs in via Google, its `provider` is updated to `'google'` and password login is disabled for that account.

---

## 15. Claude Code Rules

- NEVER read entire files — use grep and line ranges
- NEVER modify auth logic unless explicitly asked
- NEVER change DB column names without explicit instruction
- NEVER touch venv/ or node_modules/
- Always ask which specific file/function to focus on before starting
- This is production-grade: always include error handling and input validation
- Read .claude/STATUS.md and .claude/PHASES.md at the start of every session
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
