# CLAUDE.md — Bahasa Bot Project Context

> This file is the single source of truth for the Bahasa Bot project.
> Read this file completely before making any decisions, generating any code, or suggesting any changes.
> Every response, every file generated, every architectural decision must align with what is written here.

---

## 1. Project Overview

**Project Name:** Bahasa Bot
**Type:** Final Year Project (FYP) — Academic submission + real-world deployment
**Purpose:** A web-based AI-powered platform that helps international students learn Bahasa Melayu (Malay language) through an interactive chatbot, dynamic course generation, quizzes, and a personalized learning dashboard.
**Target Users:** International students learning Malay as a second language
**Expected Traffic:** ~20 concurrent users (production-level quality is still required)
**Deployment Goal:** Publicly accessible web application — not just a demo

---

## 2. Goals & Objectives

- Build a fully functional, production-ready Malay language learning platform
- Demonstrate a complete full-stack AI application using modern technologies
- Showcase modular software architecture suitable for academic evaluation
- Provide real learning value to users through AI-generated, personalized content
- Handle real traffic securely and reliably

---

## 3. Mandatory Tech Stack

This tech stack is FIXED and cannot be removed. All listed technologies MUST be used and must appear clearly in the codebase. Additional technologies may be added if needed.

| Layer                 | Technology                      | Purpose                          |
| --------------------- | ------------------------------- | -------------------------------- |
| Frontend              | Next.js (App Router)            | UI, routing, server components   |
| Backend AI Service    | FastAPI (Python)                | API microservice for AI features |
| AI Orchestration      | LangChain                       | Chains, RAG pipelines, memory    |
| LLM                   | Google Gemini API               | All language model responses     |
| Database              | PostgreSQL                      | All persistent data storage      |
| Vector Store          | pgvector (PostgreSQL extension) | RAG embeddings storage           |
| Authentication        | NextAuth.js or Supabase Auth    | User login, session management   |
| Caching               | Redis                           | Response caching, session data   |
| Deployment - Frontend | Vercel                          | Next.js hosting                  |
| Deployment - Backend  | Railway or Render               | FastAPI hosting                  |
| Deployment - Database | Supabase or Neon                | Managed PostgreSQL               |

### Permitted Additions (if needed):

- Celery — background task queue for long-running course generation
- Sentry — error monitoring (frontend + backend)
- UptimeRobot — uptime monitoring
- Redis Cloud — managed Redis (free tier)
- Tailwind CSS — styling
- shadcn/ui — UI components
- Alembic — database migrations
- SQLAlchemy — ORM for FastAPI

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
│   │   │   └── register/
│   │   ├── (dashboard)/
│   │   │   └── dashboard/
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
│   │   └── dashboard/
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
│   │   └── auth.py
│   ├── services/
│   │   ├── gemini_service.py        # Gemini API calls
│   │   ├── langchain_service.py     # LangChain chains setup
│   │   ├── rag_service.py           # RAG pipeline logic
│   │   ├── course_service.py        # Course generation logic
│   │   ├── quiz_service.py          # Quiz generation logic
│   │   └── progress_service.py      # User progress tracking
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
- Current proficiency level (mapped to CEFR: A1, A2, B1, B2)
- Proficiency is calculated based on quiz scores + content completed
- Recommended next steps (what to study next)

---

## 6. Database Schema (Core Tables)

```sql
-- Users
users (id, email, password_hash, name, created_at, proficiency_level)

-- Courses
courses (id, user_id, title, description, topic, objectives, created_at)
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
chat_sessions (id, user_id, created_at)
chat_messages (id, session_id, role [user/assistant], content, created_at)

-- RAG
documents (id, content, embedding vector(768), metadata_json, created_at)
```

---

## 7. API Design

### FastAPI Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

POST   /api/chatbot/message          # Send message, get AI response
GET    /api/chatbot/history          # Get chat history for user

POST   /api/courses/generate         # Generate a new course from topic
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
```

---

## 8. Production Requirements

Even though this is an FYP with ~20 users, it MUST be built to production standards. This is non-negotiable.

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
- **Scope Lock:** Do not add features beyond what is listed in Section 5 without explicit instruction

---

## 10. Risk Management

| Risk                            | Likelihood | Impact | Mitigation                                                     |
| ------------------------------- | ---------- | ------ | -------------------------------------------------------------- |
| Gemini API slow/unavailable     | Medium     | High   | Retry logic + fallback error messages + Redis cache            |
| Gemini API cost overrun         | Medium     | Medium | Rate limiting per user per day, cache repeated queries         |
| Course generation too slow      | High       | Medium | Use streaming or background task with progress indicator       |
| pgvector setup failure          | Medium     | High   | Test early in Phase 1; have fallback to basic keyword search   |
| Auth security vulnerability     | Low        | High   | Use proven library (NextAuth/Supabase), never roll custom auth |
| DB schema changes mid-build     | Medium     | Medium | Use Alembic migrations from Day 1                              |
| Frontend-Backend CORS issues    | High       | Medium | Configure CORS explicitly on Day 1                             |
| Scope creep                     | High       | High   | Strictly follow feature list; no additions without full review |
| Deployment environment mismatch | Medium     | Medium | Use `.env.example`, Docker optional but document all env vars  |
| Ethical content filter bypass   | Low        | High   | Server-side validation only; never trust frontend alone        |

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
```

---

## 13. Build Order (Recommended)

Follow this order strictly. Do not jump ahead.

1. **Phase 1 (Days 1–2):** Project scaffold, folder structure, environment setup, authentication (register/login), protected routes
2. **Phase 2 (Days 3–4):** PostgreSQL schema, Alembic migrations, SQLAlchemy models, base FastAPI setup, Redis connection
3. **Phase 3 (Days 5–7):** Gemini API integration, LangChain setup, RAG pipeline with pgvector, AI Chatbot feature end-to-end
4. **Phase 4 (Days 8–10):** Dynamic Course Generator — topic input, content filter, Gemini course generation, course/module/class storage and display
5. **Phase 5 (Days 11–12):** Module Quiz — auto-generation after module completion, scoring, weak point tracking
6. **Phase 6 (Days 13–14):** Standalone Quiz Section — adaptive quiz generation, scoring history
7. **Phase 7 (Days 15–16):** User Dashboard — progress, vocabulary, grammar, weak points, proficiency level
8. **Phase 8 (Days 17–19):** Production hardening (rate limiting, caching, error handling, monitoring), deployment, final testing

---

## 14. Important Reminders for Claude Code

- **Always check this file before starting any task**
- **Never remove or replace a mandatory tech stack item**
- **Always generate modular code** — each feature is its own module/router/service
- **Never put business logic inside route handlers** — use service files
- **Always handle errors** — no unhandled promises, no bare except clauses
- **Always use environment variables** — never hardcode any value that belongs in .env
- **Ask before making architectural decisions** not covered in this file
- **Keep the codebase consistent** — follow established patterns already in the project
- **Production level only** — no shortcuts, no "TODO: add this later" in critical paths
