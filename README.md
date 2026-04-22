````markdown
# BahasaBot

An AI-powered Malay language learning platform for international students.

BahasaBot is a Final Year Project (FYP) and a full-stack software engineering system designed to help learners understand **Bahasa Melayu in context**, not just through direct translation. It combines a RAG-powered AI tutor, structured course generation, adaptive quizzes, a personalized roadmap, progress tracking, gamification, and modern web application engineering practices.

---

## Overview

BahasaBot helps international students learn Malay through:

- **AI Tutor Chatbot** — contextual Malay teaching through LangChain + Google Gemini + RAG
- **Dynamic Course Generator** — create full Topic → Modules → Classes learning paths
- **Module Quizzes** — quiz gating after each module to unlock the next one
- **Adaptive Standalone Quiz** — personalized questions based on weak areas
- **Dashboard** — progress tracking, vocabulary, grammar, quiz history, weak points, and BPS level
- **My Journey** — personalized roadmap based on goals, level, and timeline
- **Pronunciation Audio** — browser-native Malay word pronunciation
- **Spelling Practice Game** — gamified vocabulary reinforcement
- **Gamification System** — streaks, XP, milestone notifications
- **Admin Panel** — system monitoring, feedback review, user insights
- **Profile & Settings** — user personalization, password management, credits/about
- **In-App Notifications** — learning milestones, roadmap reminders, course completion
- **Evaluation Feedback** — built-in feedback collection for FYP validation

---

## Project Goals

- Build a production-ready AI-powered Malay learning platform
- Provide contextual word usage support instead of simple word-to-word translation
- Demonstrate strong software engineering depth through modular design and full-stack architecture
- Deliver adaptive, personalized learning through weak-point tracking and roadmap generation
- Support academic evaluation with measurable progress, feedback, and user analytics

---

## Core Learning Focus

BahasaBot is designed around these three core objectives:

1. **Contextual Word Explanation**  
   Help learners understand how Malay words are actually used in real contexts.

2. **Interactive Practice & Immediate Feedback**  
   Support learning through chatbot explanations, generated lessons, and quizzes.

3. **Progress Tracking & Adaptive Assessment**  
   Improve engagement and learning efficiency through tracked progress and targeted practice.

---

## Key Features

### 1. Authentication & User Management
- Email/password registration and login
- Google OAuth login
- JWT-based protected backend access
- Refresh token flow
- Forgot password flow
- Mandatory password setup for first-time Google-only accounts
- User profile management and personalization

### 2. AI Tutor Chatbot
- English/Malay conversational tutoring
- Google Gemini + LangChain orchestration
- RAG pipeline with Malay language corpus
- Session-based conversation memory
- Vocabulary and grammar extraction after each response
- Streaming responses via Server-Sent Events (SSE)
- App-aware tutor prompt that redirects users to dedicated features like Courses, Quiz, Dashboard, Journey, and Games when appropriate

### 3. Dynamic Course Generator
- User enters a topic in English
- Gemini generates:
  - Course title and objectives
  - Modules
  - Classes
  - Vocabulary/examples
- Ethical topic filtering before generation
- Sequential module locking
- Users must pass the module quiz to continue

### 4. Quiz System
#### Module Quiz
- Auto-generated after all classes in a module are completed
- Mix of question types
- 70% pass threshold required to unlock the next module

#### Adaptive Standalone Quiz
- Personalized from weak points and learning history
- Includes MCQ, fill-in-the-blank, and translation-style questions
- Updates user proficiency level after submission

### 5. Dashboard
- Courses started / modules completed / classes completed
- Vocabulary learned
- Grammar learned
- Weak points
- Quiz history
- Recommendations
- Streaks and XP
- Current proficiency level using **BPS (BahasaBot Proficiency Scale)**

### 6. My Journey
- Personalized roadmap generated from:
  - user goal
  - current BPS level
  - weak points
  - timeline
  - intent/purpose
- Activity-based roadmap structure
- One active roadmap per user
- Progress and milestone tracking
- Deadline extension support
- Completion celebration flow

### 7. Pronunciation Audio
- Speaker button for vocabulary words
- Uses browser-native Web Speech API
- Malay pronunciation playback with fallback voice logic

### 8. Spelling Practice Game
- Uses the learner’s own vocabulary data
- Audio-led spelling activity
- Score tracking
- Retry logic
- Personal best support

### 9. Gamification
- Daily streak tracking
- XP accumulation
- Milestone notifications
- Sidebar and dashboard visibility

### 10. Notification System
- Course ready notification
- Streak milestone notification
- XP milestone notification
- BPS progression notification
- Journey reminders and completion alerts

### 11. Admin Panel
- User analytics
- Feedback review
- System-level monitoring
- User activity visibility
- Admin-only protected routes

### 12. Evaluation Feedback
- In-app feedback after quizzes
- General user feedback page
- Admin review interface
- Supports FYP evaluation evidence collection

---

## Proficiency Framework

BahasaBot uses its own learner-facing proficiency scale:

- **BPS-1** — Beginner
- **BPS-2** — Elementary
- **BPS-3** — Intermediate
- **BPS-4** — Advanced

This replaces the earlier CEFR labels in the user-facing experience.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js (App Router) | UI, routing, server components |
| Backend | FastAPI (Python) | API service for all AI and application logic |
| AI Orchestration | LangChain | Chains, memory, prompt orchestration |
| LLM | Google Gemini API | Chat, generation, quiz/course content |
| Database | PostgreSQL | Persistent storage |
| Vector Store | pgvector | RAG embeddings storage |
| Authentication | NextAuth.js | Session management / OAuth integration |
| ORM | SQLAlchemy | Database access layer |
| Migrations | Alembic | Schema migration management |
| Caching | Redis | Caching, job state, performance |
| Email Service | Resend | Password reset flow |
| Image Generation | Gemini Image API | Journey banners, milestone cards, course covers |
| Audio | Web Speech API | Pronunciation playback |
| Monitoring | Sentry + UptimeRobot | Error and uptime monitoring |
| Styling | Tailwind CSS + shadcn/ui | Frontend styling and components |
| Deployment | Vercel + Railway/Render + Supabase/Neon | Hosting and infrastructure |

---

## High-Level Architecture

```text
[User Browser]
     |
[Next.js Frontend]
     |
     |--- Auth / session handling
     |--- UI routes / dashboard / chatbot / journey / games
     |
[FastAPI Backend]
     |
     |--- LangChain orchestration
     |--- Gemini API integration
     |--- RAG retrieval with pgvector
     |--- Course generation
     |--- Quiz engine
     |--- Journey engine
     |--- Gamification / notifications
     |
[PostgreSQL + pgvector]   [Redis]
````

---

## Project Structure

```text
bahasabot/
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── admin/
│   │   │   ├── journey/
│   │   │   ├── settings/
│   │   │   ├── games/
│   │   │   └── chatbot/
│   │   ├── chatbot/
│   │   ├── courses/
│   │   └── quiz/
│   ├── components/
│   │   ├── ui/
│   │   ├── chatbot/
│   │   ├── courses/
│   │   ├── quiz/
│   │   ├── dashboard/
│   │   ├── notifications/
│   │   ├── onboarding/
│   │   ├── journey/
│   │   ├── games/
│   │   └── gamification/
│   └── lib/
│
├── backend/
│   ├── routers/
│   ├── services/
│   ├── models/
│   ├── schemas/
│   ├── db/
│   ├── middleware/
│   └── utils/
│
└── database/
```

---

## Main Backend API Areas

### Auth

* `POST /api/auth/register`
* `POST /api/auth/login`
* `GET /api/auth/me`
* `POST /api/auth/forgot-password`
* `POST /api/auth/reset-password`
* `POST /api/auth/set-password`

### Chatbot

* `POST /api/chatbot/message`
* `GET /api/chatbot/history`
* `GET /api/chatbot/sessions`

### Courses

* `POST /api/courses/generate`
* `GET /api/courses/jobs/{job_id}`
* `GET /api/courses/`
* `GET /api/courses/{course_id}`

### Quiz

* `GET /api/quiz/`
* `POST /api/quiz/submit`

### Dashboard

* `GET /api/dashboard/`
* `GET /api/dashboard/vocabulary`
* `GET /api/dashboard/grammar`
* `GET /api/dashboard/progress`
* `GET /api/dashboard/weak-points`
* `GET /api/dashboard/leaderboard`

### Journey

* `POST /api/journey/roadmap/generate`
* `GET /api/journey/roadmap`
* `GET /api/journey/roadmap/history`
* `PATCH /api/journey/roadmap/extend`
* `POST /api/journey/roadmap/regenerate`

### Profile / Settings

* `GET /api/profile/`
* `PATCH /api/profile/`
* `POST /api/profile/change-password`

### Notifications

* `GET /api/notifications/`
* `POST /api/notifications/{id}/read`
* `POST /api/notifications/read-all`

### Games

* `GET /api/games/spelling/word`
* `POST /api/games/spelling/submit`
* `POST /api/games/spelling/session`
* `GET /api/games/spelling/best`

### Admin

* `GET /api/admin/stats`
* `GET /api/admin/users`
* `GET /api/admin/feedback`
* `GET /api/admin/leaderboard`

---

## Database Scope

The project includes tables for:

* users
* courses
* modules
* classes
* user_progress
* module_quiz_attempts
* standalone_quiz_attempts
* vocabulary_learned
* grammar_learned
* weak_points
* chat_sessions
* chat_messages
* documents
* user_roadmaps
* notifications
* password_reset_tokens
* evaluation_feedback
* spelling_game_scores
* token_usage_logs
* activity_logs
* xp_logs

---

## Security & Reliability

* bcrypt password hashing
* JWT-protected API routes
* Google OAuth support
* silent token refresh
* content filtering for course generation
* rate limiting for chatbot and course generation
* Redis-backed caching
* structured logging
* error monitoring with Sentry
* background job progress tracking
* SQLAlchemy ORM protections
* CORS restrictions
* production-oriented architecture despite FYP scale

---

## Development Timeline

The actual development timeline spans **six months**, starting in **December 2025** and continuing until **June 2026**.

| Period            | Focus                                                                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **December 2025** | Project initiation, requirement gathering, idea refinement                                                                                                               |
| **January 2026**  | Analysis, architecture planning, module definition, system design                                                                                                        |
| **February 2026** | Technical planning, environment preparation, implementation readiness                                                                                                    |
| **March 2026**    | Core backend/frontend implementation: auth, DB, Redis, chatbot, RAG, course generation, quiz, dashboard                                                                  |
| **April 2026**    | Major feature expansion and refinement: BPS migration, onboarding, journey, notifications, gamification, profile, forgot password, admin, UI overhaul, performance fixes |
| **May 2026**      | Testing, debugging, V&V, optimization, usability refinement                                                                                                              |
| **June 2026**     | Final deployment, documentation, final polishing, submission preparation                                                                                                 |

---

## Current Status

As of the latest project status:

* Core AI tutor system is complete
* Course generator is complete
* Quiz system is complete
* Dashboard is complete
* My Journey roadmap is complete
* Notification system is complete
* Gamification is complete
* Spelling game is complete
* Settings/profile system is complete
* Forgot password flow is complete
* Admin panel is complete
* UI overhaul and major polish are complete
* Production deployment fixes are ongoing and actively refined

---

## Target Users

BahasaBot is designed primarily for:

* international students in Malaysia
* beginners learning Malay as a second language
* learners who need contextual usage support
* users who benefit from structured, guided, adaptive learning

---

## Why BahasaBot is Different

BahasaBot is **not** a generic chatbot wrapper.

It is a modular educational platform with:

* contextual Malay-focused RAG
* structured course progression
* adaptive weak-point-driven quizzes
* roadmap generation
* measurable progress tracking
* gamification and milestone systems
* purpose-built educational flows across multiple integrated modules

---

## Local Development

### Prerequisites

* Node.js 20+
* Python 3.12+
* PostgreSQL 15+
* Redis 7+
* Google Gemini API key

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn backend.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

---

## Deployment

| Service    | Platform             |
| ---------- | -------------------- |
| Frontend   | Vercel               |
| Backend    | Railway or Render    |
| Database   | Supabase or Neon     |
| Cache      | Redis / Redis Cloud  |
| Monitoring | Sentry + UptimeRobot |

---

## Author

**Noor Mohammad Sowan**
Final Year Project, Software Engineering
Universiti Sains Malaysia

**Supervisor:** Assoc. Prof. Tan Tien Ping

---

## License

This project is developed as a university Final Year Project.
License terms can be updated depending on public release requirements.

```

A couple of small README choices I made deliberately:
- I used **BPS** instead of CEFR in the final GitHub version, because the project has already migrated to BPS in the current codebase and documentation. :contentReference[oaicite:3]{index=3}
- I used your corrected **December 2025 to June 2026** timeline, since you explicitly said the earlier compressed timeline was false.

If you want, I can also give you a **shorter, cleaner GitHub-style version** with badges, screenshots section, and a more polished open-source layout.
```
