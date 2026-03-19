# BahasaBot — Claude Context

## Stack
- Frontend: Next.js 14 App Router → Vercel
- Backend: FastAPI → Railway/Render
- DB: PostgreSQL + pgvector → Supabase (Prisma ORM)
- AI: LangChain + Google Gemini API

## Feature → File Map

### Auth
- frontend/app/(auth)/login/page.tsx, register/page.tsx
- frontend/lib/auth.ts, frontend/middleware.ts
- frontend/app/api/auth/[...nextauth]/route.ts
- backend/routers/auth.py, backend/models/user.py
- backend/middleware/auth_middleware.py

### AI Chatbot
- frontend/app/chatbot/page.tsx, layout.tsx
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

### Dashboard (Phase 7 — NOT YET IMPLEMENTED)
- frontend/app/(dashboard)/dashboard/page.tsx
- frontend/components/dashboard/StatsCards.tsx
- frontend/components/dashboard/CEFRProgressBar.tsx
- frontend/components/dashboard/WeakPointsChart.tsx
- frontend/components/dashboard/VocabularyTable.tsx
- frontend/components/dashboard/QuizHistoryTable.tsx
- backend/routers/dashboard.py (STUB)
- backend/services/progress_service.py (STUB)

## Shared Types & Utilities
- frontend/lib/types.ts — all TypeScript interfaces
- frontend/lib/api.ts — all API calls (Axios client)
- backend/db/database.py — async DB session
- backend/middleware/auth_middleware.py — JWT dependency
- backend/.env.example — all environment variables

## Rules
- NEVER read entire files — use grep and line ranges
- NEVER modify auth logic unless explicitly asked
- NEVER change DB column names without explicit instruction
- NEVER touch venv/ or node_modules/
- Always ask which specific file/function to focus on before starting
- This is production-grade: always include error handling and input validation
- Read .claude/STATUS.md and .claude/PHASES.md at the start of every session
