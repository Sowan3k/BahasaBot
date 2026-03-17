// Core TypeScript interfaces for BahasaBot
// Extended per phase as new features are added.

// ── User ──────────────────────────────────────────────────────────────────────

export type ProficiencyLevel = "A1" | "A2" | "B1" | "B2";

export interface User {
  id: string;
  email: string;
  name: string;
  proficiency_level: ProficiencyLevel;
  created_at: string;
  provider: "email" | "google";
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface AccessTokenResponse {
  access_token: string;
  token_type: string;
}

// ── NextAuth session extensions ───────────────────────────────────────────────
// These extend the default NextAuth Session/JWT types.
// next-auth.d.ts picks these up automatically.

export interface ExtendedSession {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ── Generic API wrappers ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// ── Courses (Phase 4) — stub types ───────────────────────────────────────────

export interface Course {
  id: string;
  title: string;
  description: string;
  topic: string;
  created_at: string;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  is_locked: boolean;
}

export interface Class {
  id: string;
  module_id: string;
  title: string;
  content: string;
  order_index: number;
  is_completed: boolean;
}

// ── Chatbot (Phase 3) — stub types ───────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// ── Quiz (Phase 5/6) — stub types ────────────────────────────────────────────

export type QuestionType = "mcq" | "fill_in_blank" | "translation";

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question_bm: string;
  question_en: string;
  options?: string[];      // MCQ only
  correct_answer: string;
  explanation: string;
}
