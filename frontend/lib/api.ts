// Centralized Axios API client
// All FastAPI calls go through this instance.
// Attaches Authorization: Bearer <token> from the NextAuth session automatically.

import axios from "axios";
import { getSession, signOut } from "next-auth/react";

import type {
  ClassCompleteResponse,
  ClassDetail,
  Course,
  CourseSummary,
  CourseGenerateResponse,
  DashboardSummary,
  GrammarListResponse,
  ModuleQuizResponse,
  ModuleQuizResult,
  PaginatedResponse,
  ProgressResponse,
  QuizAnswer,
  QuizHistoryResponse,
  StandaloneQuizResponse,
  StandaloneQuizResult,
  VocabularyListResponse,
  WeakPointsResponse,
} from "@/lib/types";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor — attach Bearer token ─────────────────────────────────

apiClient.interceptors.request.use(async (config) => {
  const session = await getSession();

  // Refresh token expired (or never existed) — sign out before the call
  if ((session as any)?.error === "RefreshTokenExpired") {
    await signOut({ redirect: true, callbackUrl: "/login" });
    return config;
  }

  const token = (session as any)?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ── Response interceptor — handle 401 ────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Fallback: token is still rejected after refresh — sign out.
      await signOut({ redirect: true, callbackUrl: "/login" });
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// ── Course API ────────────────────────────────────────────────────────────────

export const coursesApi = {
  /** Generate a new course from a topic. Returns the new course_id. */
  generate: (topic: string) =>
    apiClient.post<CourseGenerateResponse>("/api/courses/generate", { topic }),

  /** List the current user's courses (paginated). */
  list: (page = 1, limit = 10) =>
    apiClient.get<PaginatedResponse<CourseSummary>>("/api/courses/", {
      params: { page, limit },
    }),

  /** Get full course tree with modules, classes, and progress state. */
  get: (courseId: string) =>
    apiClient.get<Course>(`/api/courses/${courseId}`),

  /** Get full content for a single class. */
  getClass: (courseId: string, moduleId: string, classId: string) =>
    apiClient.get<ClassDetail>(
      `/api/courses/${courseId}/modules/${moduleId}/classes/${classId}`
    ),

  /** Mark a class as complete. */
  completeClass: (courseId: string, moduleId: string, classId: string) =>
    apiClient.post<ClassCompleteResponse>(
      `/api/courses/${courseId}/modules/${moduleId}/classes/${classId}/complete`
    ),

  /** Delete a course and all its data. */
  delete: (courseId: string) =>
    apiClient.delete(`/api/courses/${courseId}`),
};

// ── Quiz API ──────────────────────────────────────────────────────────────────

export const quizApi = {
  /**
   * Get the auto-generated quiz for a module.
   * Returns already_passed=true if the user already passed.
   * correct_answer is NOT included — scoring is server-side.
   */
  getModuleQuiz: (courseId: string, moduleId: string) =>
    apiClient.get<ModuleQuizResponse>(
      `/api/courses/${courseId}/modules/${moduleId}/quiz`
    ),

  /** Submit quiz answers and receive scored results. */
  submitModuleQuiz: (courseId: string, moduleId: string, answers: QuizAnswer[]) =>
    apiClient.post<ModuleQuizResult>(
      `/api/courses/${courseId}/modules/${moduleId}/quiz`,
      { answers }
    ),
};

// ── Standalone Adaptive Quiz API (Phase 6) ────────────────────────────────────

export const standaloneQuizApi = {
  /**
   * Get the adaptive standalone quiz personalised to the user's weak points.
   * Returns 15 questions (MCQ + fill-in-blank + translation).
   * correct_answer is NOT included — scoring is server-side.
   */
  get: () => apiClient.get<StandaloneQuizResponse>("/api/quiz/"),

  /** Submit answers and receive score + CEFR proficiency update. */
  submit: (answers: QuizAnswer[]) =>
    apiClient.post<StandaloneQuizResult>("/api/quiz/submit", { answers }),
};

// ── Dashboard API (Phase 7) ────────────────────────────────────────────────────

export const dashboardApi = {
  /** Full dashboard summary — stats, recent vocab/grammar, top weak points, recent quizzes. */
  getSummary: () =>
    apiClient.get<DashboardSummary>("/api/dashboard/"),

  /** Paginated vocabulary list. */
  getVocabulary: (page = 1, limit = 20) =>
    apiClient.get<VocabularyListResponse>("/api/dashboard/vocabulary", {
      params: { page, limit },
    }),

  /** Delete vocabulary entries by ID. */
  deleteVocabulary: (ids: string[]) =>
    apiClient.delete<{ deleted: number }>("/api/dashboard/vocabulary", {
      data: { ids },
    }),

  /** Paginated grammar list. */
  getGrammar: (page = 1, limit = 20) =>
    apiClient.get<GrammarListResponse>("/api/dashboard/grammar", {
      params: { page, limit },
    }),

  /** Course progress breakdown. */
  getProgress: () =>
    apiClient.get<ProgressResponse>("/api/dashboard/progress"),

  /** All weak points sorted weakest-first. */
  getWeakPoints: () =>
    apiClient.get<WeakPointsResponse>("/api/dashboard/weak-points"),

  /** Paginated quiz history (module + standalone). */
  getQuizHistory: (page = 1, limit = 20) =>
    apiClient.get<QuizHistoryResponse>("/api/dashboard/quiz-history", {
      params: { page, limit },
    }),
};
