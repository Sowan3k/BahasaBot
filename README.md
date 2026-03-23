# BahasaBot

An AI-powered Bahasa Melayu (Malay) language learning platform for international students. Built as a Final Year Project (FYP).

## Overview

BahasaBot helps international students learn Malay through:
- **AI Chatbot** — personal tutor powered by Google Gemini + LangChain with RAG
- **Dynamic Course Generator** — input any topic, get a full Course > Modules > Classes curriculum
- **Module Quizzes** — auto-generated after each module; gates progression
- **Adaptive Standalone Quiz** — targets your personal weak points across all learning
- **Progress Dashboard** — vocabulary, grammar, quiz history, CEFR level (A1–B2), weak points

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 14 (App Router) | UI, routing, server components |
| Backend AI Service | FastAPI (Python) | API microservice for all AI features |
| AI Orchestration | LangChain | Chains, RAG pipelines, conversation memory |
| LLM | Google Gemini API (`gemini-1.5-flash`) | All language model responses |
| Database | PostgreSQL | All persistent data storage |
| Vector Store | pgvector (PostgreSQL extension) | RAG embeddings for Malay language corpus |
| Authentication | NextAuth.js + FastAPI JWT | User login, session management |
| Caching | Redis | Response caching, session data |
| ORM | SQLAlchemy (async) | Database access layer |
| Migrations | Alembic | Database schema versioning |
| Styling | Tailwind CSS + shadcn/ui | UI components |
| Deployment - Frontend | Vercel | Next.js hosting |
| Deployment - Backend | Railway or Render | FastAPI hosting |
| Deployment - Database | Supabase or Neon | Managed PostgreSQL with pgvector |
| Monitoring | Sentry + UptimeRobot | Error tracking + uptime |

---

## Project Structure

```
bahasabot/
├── frontend/                          # Next.js App Router application
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── courses/
│   │   │   │   └── [courseId]/
│   │   │   │       └── modules/
│   │   │   │           └── [moduleId]/
│   │   │   │               └── classes/
│   │   │   │                   └── [classId]/
│   │   │   └── quiz/
│   │   │       ├── module/[moduleId]/
│   │   │       └── adaptive/
│   │   ├── chatbot/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                        # shadcn/ui base components
│   │   ├── chatbot/                   # ChatMessage, VocabularyHighlight
│   │   ├── courses/                   # CourseGenerationModal, etc.
│   │   ├── quiz/                      # QuizQuestion renderer
│   │   └── dashboard/                 # StatsCards, CEFRProgressBar, WeakPointsChart, etc.
│   ├── lib/
│   │   ├── auth.ts                    # NextAuth configuration
│   │   ├── api.ts                     # Axios client with auth interceptors
│   │   └── types.ts                   # TypeScript interfaces
│   ├── middleware.ts                   # Route protection
│   ├── .env.local.example
│   └── package.json
│
├── backend/                           # FastAPI Python service
│   ├── main.py                        # App entry point, CORS, middleware, lifespan
│   ├── routers/
│   │   ├── auth.py                    # /api/auth/*
│   │   ├── chatbot.py                 # /api/chatbot/*
│   │   ├── courses.py                 # /api/courses/*
│   │   ├── quiz.py                    # /api/quiz/* and module quiz routes
│   │   └── dashboard.py              # /api/dashboard/*
│   ├── services/
│   │   ├── gemini_service.py          # Gemini API wrapper with retry + fallback
│   │   ├── langchain_service.py       # LangChain chains (chatbot, extraction)
│   │   ├── rag_service.py             # pgvector similarity search + corpus ingestion
│   │   ├── course_service.py          # Course generation pipeline
│   │   ├── quiz_service.py            # Quiz generation + scoring + weak points
│   │   └── progress_service.py        # Dashboard data aggregation
│   ├── models/
│   │   ├── user.py
│   │   ├── course.py
│   │   ├── quiz.py
│   │   └── progress.py
│   ├── schemas/                       # Pydantic v2 request/response schemas
│   ├── db/
│   │   ├── database.py                # Async SQLAlchemy engine + session factory
│   │   └── migrations/                # Alembic migrations
│   ├── middleware/
│   │   ├── auth_middleware.py         # JWT verification dependency
│   │   └── rate_limiter.py            # SlowAPI rate limiting
│   ├── utils/
│   │   ├── cache.py                   # Redis async wrapper
│   │   ├── content_filter.py          # Ethical topic validation
│   │   └── logger.py                  # Structlog configuration
│   ├── data/
│   │   └── malay_corpus.py            # Initial RAG corpus (50–100 BM knowledge chunks)
│   ├── .env.example
│   ├── requirements.txt
│   └── Dockerfile
│
└── database/
    └── schema.sql                     # Reference SQL schema
```

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- Python 3.12+
- PostgreSQL 15+ with pgvector extension
- Redis 7+
- Google Gemini API key

### 1. Clone and set up the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env with your credentials (see Environment Variables section below)

# Run database migrations
alembic upgrade head

# Start the backend (run from project root, not from backend/)
uvicorn backend.main:app --reload --port 8000
```

### 2. Set up the frontend

```bash
cd frontend
npm install

cp .env.local.example .env.local
# Edit .env.local with your credentials

npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Environment Variables

### Backend (`backend/.env`)

```env
# App
APP_ENV=development
SECRET_KEY=<64-character-random-string>
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
ALGORITHM=HS256

# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/bahasabot
SYNC_DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/bahasabot

# Redis
REDIS_URL=redis://localhost:6379/0

# Google Gemini
GOOGLE_API_KEY=<your-gemini-api-key>
GEMINI_MODEL=gemini-1.5-flash
EMBEDDING_MODEL=models/embedding-001

# Google OAuth
GOOGLE_CLIENT_ID=<your-google-oauth-client-id>

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Monitoring (optional for local dev)
SENTRY_DSN=

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
CHATBOT_RATE_LIMIT_PER_MINUTE=20
```

### Frontend (`frontend/.env.local`)

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<32-character-random-string>
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=BahasaBot
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
```

> **Important:** `SECRET_KEY` in the backend and `NEXTAUTH_SECRET` are used differently. The `SECRET_KEY` signs FastAPI JWT tokens. `NEXTAUTH_SECRET` encrypts the NextAuth session cookie. They do not need to match.

---

## Database Schema

Core tables:

| Table | Purpose |
|---|---|
| `users` | User accounts with CEFR proficiency level |
| `courses` | AI-generated courses per user |
| `modules` | Course modules with ordering |
| `classes` | Lesson content with vocabulary + examples JSON |
| `user_progress` | Tracks class/module completion per user |
| `module_quiz_attempts` | Module quiz scores and answers |
| `standalone_quiz_attempts` | Adaptive quiz history |
| `vocabulary_learned` | Words encountered (chatbot + courses) |
| `grammar_learned` | Grammar rules encountered |
| `weak_points` | Aggregated weak areas with strength scores |
| `chat_sessions` | Chatbot conversation sessions |
| `chat_messages` | Individual chat messages (role: user/assistant) |
| `documents` | RAG vector store (embedding: vector(768)) |

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create new account (email/password) |
| POST | `/api/auth/login` | Login with email/password, get JWT tokens |
| POST | `/api/auth/google` | Verify Google ID token, get our JWT tokens |
| POST | `/api/auth/refresh` | Exchange refresh token for new access token |
| GET | `/api/auth/me` | Get current user |

### Chatbot
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/chatbot/message` | Send message, get streamed AI response |
| GET | `/api/chatbot/history` | Get paginated chat history |

### Courses
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/courses/generate` | Generate course from topic |
| GET | `/api/courses/` | List user's courses |
| GET | `/api/courses/{id}` | Get full course with progress |
| POST | `/api/courses/{id}/modules/{mid}/complete` | Mark module complete |
| GET | `/api/courses/{id}/modules/{mid}/quiz` | Get module quiz |
| POST | `/api/courses/{id}/modules/{mid}/quiz` | Submit module quiz |

### Quiz
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/quiz/` | Get adaptive standalone quiz |
| POST | `/api/quiz/submit` | Submit quiz answers |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/` | Full dashboard summary |
| GET | `/api/dashboard/vocabulary` | Paginated vocabulary list |
| GET | `/api/dashboard/grammar` | Paginated grammar list |
| GET | `/api/dashboard/progress` | Course progress breakdown |
| GET | `/api/dashboard/weak-points` | Weak points + recommendations |

---

## Features

### AI Chatbot
- Powered by LangChain + Google Gemini (`gemini-1.5-flash`)
- RAG pipeline: retrieves relevant Malay grammar/vocabulary from pgvector at each turn
- Conversation memory: last 10 messages loaded from PostgreSQL (Redis-cached per session)
- Auto-extracts vocabulary and grammar from every AI response into the user's learning record
- Streaming responses via Server-Sent Events
- Rate limited: 20 messages/minute per user

### Dynamic Course Generator
- User inputs any topic (e.g. "ordering food at a restaurant")
- Ethical content filter (regex + Gemini moderation) validates topic before generation
- Gemini generates structured Course → Modules → Classes with vocabulary/grammar focus per class
- Class content generated in parallel (`asyncio.gather`) for speed
- Rate limited: 5 courses/hour per user

### Module Quizzes
- Auto-generated after all classes in a module are completed
- 10 questions: 60% MCQ + 40% fill-in-blank
- Score ≥ 70% required to unlock next module
- Wrong answers update `weak_points` table for adaptive learning

### Adaptive Standalone Quiz
- 15 questions targeting top weak points across all learning history
- Question mix: 40% MCQ + 40% fill-in-blank + 20% translation
- Recalculates CEFR proficiency level after each attempt

### CEFR Proficiency Levels
- Levels: A1, A2, B1, B2
- Calculated from quiz performance history (rule-based, updates after adaptive quiz)
- Displayed prominently in dashboard

---

## Build Phases

| Phase | Days | Goal |
|---|---|---|
| 1 | 10–15 | Scaffold, authentication, protected routes |
| 2 | 5–9 | Full DB schema, Alembic migrations, Redis |
| 3 | 15–17 | Gemini integration, LangChain, RAG, Chatbot |
| 4 | 25–28 | Dynamic Course Generator |
| 5 | 11–17 | Module Quiz system |
| 6 | 25–30| Standalone Adaptive Quiz |
| 7 | 20–28 | User Dashboard |
| 8 | 17–19 | Production hardening, deployment |

---

## Deployment

| Service | Provider | Notes |
|---|---|---|
| Frontend | Vercel | Automatic deploys from `main` branch |
| Backend | Railway or Render | Dockerfile-based deployment |
| Database | Supabase or Neon | Managed PostgreSQL with pgvector extension |
| Redis | Redis Cloud | Free tier (30MB) |
| Monitoring | Sentry | Frontend + backend error tracking |
| Uptime | UptimeRobot | Ping `/health` every 5 minutes |

---

## Security

- All secrets in `.env` files — never hardcoded
- JWT with expiry and refresh token rotation
- Server-side ethical content filter on all course topic inputs
- SQLAlchemy ORM throughout — no raw SQL with user input
- CORS configured to allow only the frontend domain
- Rate limiting on all endpoints (especially chatbot and course generation)
- Input sanitization on all user inputs

---

## Development Notes

- All FastAPI route handlers use `async def`
- Business logic lives in `/services/` — never in route handlers
- Pydantic v2 schemas in `/schemas/` are separate from SQLAlchemy ORM models in `/models/`
- Redis gracefully degrades (returns `None`) if unavailable — no hard dependency at runtime
- `SYNC_DATABASE_URL` (psycopg2) is used only by Alembic migrations; all runtime DB access uses asyncpg

---

## Known Issues & Compatibility Notes

### Node.js Version
shadcn/ui (`validate-npm-package-name@7.0.2`) requires Node.js `^20.17.0 || >=22.9.0`. Node.js `20.10.0` will show an `EBADENGINE` warning during `npx shadcn init` but the command still succeeds. To eliminate this warning, upgrade to Node.js `20.17.0+` or `22.x`.

### Neon PostgreSQL — Connection String Format
The raw Neon connection string (`postgresql://...?sslmode=require&channel_binding=require`) must be converted before use:

| Usage | Driver | Format |
|---|---|---|
| Runtime (`DATABASE_URL`) | asyncpg | `postgresql+asyncpg://...?ssl=require` |
| Alembic migrations (`SYNC_DATABASE_URL`) | psycopg2 | `postgresql+psycopg2://...?sslmode=require` |

> **Note:** `channel_binding=require` must be **omitted** — asyncpg does not support that parameter and will raise a connection error.

### Python Package Version Pins
`langchain-postgres` requires `pgvector>=0.2.5,<0.3.0` (Python client package). This does **not** affect the PostgreSQL extension version installed on Neon — only the Python client library. The Neon-hosted pgvector extension is always current.

### passlib + bcrypt Incompatibility
`passlib` has a bug with `bcrypt >= 4.x` that causes a 500 error on password hashing. The project uses `bcrypt` directly (`bcrypt.hashpw` / `bcrypt.checkpw`) instead of `passlib.CryptContext`.

### Google OAuth — `google-auth` vs `google-generativeai`
The project installs both `google-auth==2.29.0` (for Google ID token verification in `/api/auth/google`) and `google-generativeai` (for Gemini). They share the same `google-auth` dependency — pin to `2.29.0` to avoid version conflicts.

### Google OAuth — Users table schema
`password_hash` is nullable to support Google-only accounts. The `provider` column (`'email'` | `'google'`) tracks how the account was created. If an existing email/password account signs in via Google, its `provider` is updated to `'google'` and password login is disabled for that account.
