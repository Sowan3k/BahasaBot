// Centralized Axios API client
// All FastAPI calls go through this instance.
// Attaches Authorization: Bearer <token> from the NextAuth session automatically.

import axios from "axios";
import { getSession, signOut } from "next-auth/react";

import type {
  AdminFeedbackResponse,
  AdminStats,
  AdminUser,
  AdminUserAnalytics,
  AdminUserDetail,
  ChangePasswordPayload,
  ChangePasswordResponse,
  ChatHistoryResponse,
  ClassCompleteResponse,
  ClassDetail,
  Course,
  CourseSummary,
  CourseGenerateResponse,
  JobStatusResponse,
  DashboardSummary,
  FeedbackPayload,
  FeedbackSubmitResponse,
  GrammarListResponse,
  ModuleQuizResponse,
  ModuleQuizResult,
  PaginatedResponse,
  ProfileUpdatePayload,
  ProgressResponse,
  QuizAnswer,
  QuizHistoryResponse,
  SessionListResponse,
  StandaloneQuizResponse,
  StandaloneQuizResult,
  UserProfile,
  VocabularyListResponse,
  WeakPointsResponse,
  NotificationListResponse,
  SpellingWord,
  SpellingSubmitResponse,
  SpellingPersonalBest,
  UserRoadmap,
  GenerateRoadmapPayload,
  AdminRoadmapRow,
  PastJourneyItem,
  Tip,
  TipListResponse,
  GenerateTipsPayload,
  GenerateTipsResponse,
  LeaderboardResponse,
} from "@/lib/types";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Session cache — avoids a /api/auth/session round-trip on every request ────
// The access token refreshes every 29 minutes; caching for 60s is safe and
// eliminates the N-concurrent-session-lookups pattern on first page load.

type CachedSession = Awaited<ReturnType<typeof getSession>>;
let _sessionCache: { value: CachedSession; expiresAt: number } | null = null;
const SESSION_CACHE_TTL_MS = 60_000; // 1 minute

async function getCachedSession(): Promise<CachedSession> {
  if (_sessionCache && Date.now() < _sessionCache.expiresAt) {
    return _sessionCache.value;
  }
  const session = await getSession();
  _sessionCache = { value: session, expiresAt: Date.now() + SESSION_CACHE_TTL_MS };
  return session;
}

/** Call this on sign-out or after a new sign-in so the cache is refreshed. */
export function invalidateSessionCache() {
  _sessionCache = null;
}

// ── Request interceptor — attach Bearer token ─────────────────────────────────

apiClient.interceptors.request.use(async (config) => {
  const session = await getCachedSession();

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
      // Clear stale session cache before signing out.
      invalidateSessionCache();
      await signOut({ redirect: true, callbackUrl: "/login" });
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// ── Auth API ──────────────────────────────────────────────────────────────────

export const authApi = {
  /**
   * Set an initial password for a Google account that has none yet.
   * Only callable when the user has no password_hash in the DB.
   * Use POST /api/profile/change-password for subsequent changes.
   */
  setPassword: (new_password: string) =>
    apiClient.post<{ success: boolean }>("/api/auth/set-password", { new_password }),
};

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

  /** Poll the status of a background course generation job. */
  getJobStatus: (jobId: string) =>
    apiClient.get<JobStatusResponse>(`/api/courses/jobs/${jobId}`),
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

  /** Weekly XP leaderboard — top 10 users + current user's rank. */
  getLeaderboard: () =>
    apiClient.get<LeaderboardResponse>("/api/dashboard/leaderboard"),
};

// ── Profile API (Phase 13) ────────────────────────────────────────────────────

export const profileApi = {
  /** Get the current user's full profile. */
  getProfile: () =>
    apiClient.get<UserProfile>("/api/profile/"),

  /** Update editable profile fields. Only provided fields are updated. */
  updateProfile: (payload: ProfileUpdatePayload) =>
    apiClient.patch<UserProfile>("/api/profile/", payload),

  /** Change password (email accounts only). */
  changePassword: (payload: ChangePasswordPayload) =>
    apiClient.post<ChangePasswordResponse>("/api/profile/change-password", payload),

  /**
   * Permanently delete the current user's account.
   * Email accounts must supply { password }.
   * Google-only accounts must supply { confirm_email } matching their email.
   */
  deleteAccount: (payload: { password?: string; confirm_email?: string }) =>
    apiClient.post<{ deleted: boolean; message: string }>(
      "/api/profile/delete-account",
      payload
    ),
};

// ── Admin API (Phase 15) ──────────────────────────────────────────────────────

export const adminApi = {
  /** Aggregate system stats for the admin overview dashboard. */
  getStats: () =>
    apiClient.get<AdminStats>("/api/admin/stats"),

  /** Paginated + searchable list of all users. */
  getUsers: (page = 1, limit = 20, search = "") =>
    apiClient.get<PaginatedResponse<AdminUser>>("/api/admin/users", {
      params: { page, limit, search },
    }),

  /** Full profile + activity stats for a single user. */
  getUserDetail: (userId: string) =>
    apiClient.get<AdminUserDetail>(`/api/admin/users/${userId}`),

  /** Token usage + activity timeline charts for a single user. */
  getUserAnalytics: (userId: string, days = 30) =>
    apiClient.get<AdminUserAnalytics>(`/api/admin/users/${userId}/analytics`, {
      params: { days },
    }),

  /** Deactivate a user account by ID. */
  deactivateUser: (userId: string) =>
    apiClient.patch<{ id: string; is_active: boolean }>(
      `/api/admin/users/${userId}/deactivate`
    ),

  /** Permanently delete a user account. Requires admin password confirmation. */
  deleteUser: (userId: string, adminPassword: string) =>
    apiClient.delete<void>(`/api/admin/users/${userId}`, {
      data: { admin_password: adminPassword },
    }),

  /** Reset all learning data for a user. Requires admin password confirmation. */
  resetUserData: (userId: string, adminPassword: string) =>
    apiClient.post<{ id: string; email: string; proficiency_level: string }>(
      `/api/admin/users/${userId}/reset`,
      { admin_password: adminPassword }
    ),

  /** Paginated evaluation feedback responses with aggregate stats. */
  getFeedback: (page = 1, limit = 20) =>
    apiClient.get<AdminFeedbackResponse>("/api/admin/feedback", {
      params: { page, limit },
    }),

  /** Admin weekly XP leaderboard (includes email). */
  getLeaderboard: () =>
    apiClient.get<LeaderboardResponse>("/api/admin/leaderboard"),
};

// ── Notifications API (Phase 17) ──────────────────────────────────────────────

export const notificationsApi = {
  /** List the last 20 notifications with unread count. */
  getNotifications: () =>
    apiClient.get<NotificationListResponse>("/api/notifications/"),

  /** Mark a single notification as read by its ID. */
  markRead: (notificationId: string) =>
    apiClient.post<{ id: string; read: boolean }>(
      `/api/notifications/${notificationId}/read`
    ),

  /** Mark all notifications as read. */
  markAllRead: () =>
    apiClient.post<{ success: boolean }>("/api/notifications/read-all"),

  /** Delete all notifications for the current user (clear history). */
  clearAll: () =>
    apiClient.delete<{ success: boolean; message: string }>("/api/notifications/"),
};

// ── Games API (Phase 19) ──────────────────────────────────────────────────────

export const gamesApi = {
  /** Fetch the next vocabulary word to spell. Returns 404 if not enough vocab. */
  getSpellingWord: () => apiClient.get<SpellingWord>("/api/games/spelling/word"),

  /** Submit a spelling attempt. Returns evaluation result + XP awarded. */
  submitSpellingAnswer: (vocab_id: string, answer: string) =>
    apiClient.post<SpellingSubmitResponse>("/api/games/spelling/submit", {
      vocab_id,
      answer,
    }),

  /** Save the final session score (called when a session is complete or quit). */
  endSession: (words_correct: number, words_attempted: number) =>
    apiClient.post<{ success: boolean }>("/api/games/spelling/session", {
      words_correct,
      words_attempted,
    }),

  /** Get the user's all-time personal best score. */
  getPersonalBest: () =>
    apiClient.get<SpellingPersonalBest>("/api/games/spelling/best"),
};

// ── Journey API (Phase 20 v2) ─────────────────────────────────────────────────

export const journeyApi = {
  /** Generate a new roadmap from the 3-question onboarding answers. */
  generateRoadmap: (payload: GenerateRoadmapPayload) =>
    apiClient.post<UserRoadmap>("/api/journey/roadmap/generate", payload),

  /** Get active/overdue/completed roadmap + flags. Returns 404 if none exists. */
  getRoadmap: () => apiClient.get<UserRoadmap>("/api/journey/roadmap"),

  /** Soft-delete after identity verification. */
  verifyAndDelete: (body: { password?: string; oauth_confirmed?: boolean }) =>
    apiClient.post<void>("/api/journey/roadmap/verify-and-delete", body),

  /** Extend deadline by 1-3 months (once per roadmap). */
  extendDeadline: (extension_months: number) =>
    apiClient.patch<UserRoadmap>("/api/journey/roadmap/extend", { extension_months }),

  /** Regenerate uncompleted elements after BPS upgrade. */
  regenerate: () => apiClient.post<UserRoadmap>("/api/journey/roadmap/regenerate"),

  /** Dismiss the BPS upgrade banner without regenerating. */
  dismissUpgrade: () => apiClient.delete<void>("/api/journey/roadmap/dismiss-upgrade"),

  /** Admin: all users' roadmaps. */
  getAdminJourneys: () => apiClient.get<AdminRoadmapRow[]>("/api/admin/journeys"),

  /** Past (completed/deleted) roadmaps for the current user — summary only. */
  getHistory: () => apiClient.get<PastJourneyItem[]>("/api/journey/roadmap/history"),
};

// ── Chatbot History API (Phase 21) ────────────────────────────────────────────

export const chatbotApi = {
  /** List the current user's chat sessions, newest first (paginated). */
  getSessions: (page = 1, limit = 20) =>
    apiClient.get<SessionListResponse>("/api/chatbot/sessions", {
      params: { page, limit },
    }),

  /** Get full message history for a specific session (paginated). */
  getHistory: (sessionId: string, page = 1, limit = 100) =>
    apiClient.get<ChatHistoryResponse>("/api/chatbot/history", {
      params: { session_id: sessionId, page, limit },
    }),

  /**
   * Delete a chat session and all its messages.
   * Vocabulary/grammar words extracted from the session are intentionally kept.
   */
  deleteSession: (sessionId: string) =>
    apiClient.delete<{ deleted: boolean; session_id: string }>(
      `/api/chatbot/sessions/${sessionId}`
    ),
};

// ── Evaluation Feedback API (Phase 20 / Section 5.20) ────────────────────────

export const feedbackApi = {
  /** Submit an optional survey response after completing a quiz. */
  submitFeedback: (payload: FeedbackPayload) =>
    apiClient.post<FeedbackSubmitResponse>("/api/evaluation/feedback", payload),
};

// ── Tips API — Daily Language Tips ───────────────────────────────────────────

export const tipsApi = {
  /** Get today's random tip — public, no auth required. */
  getRandom: () =>
    apiClient.get<Tip>("/api/tips/random"),

  /** Admin: generate N tips for a given category via Gemini. */
  generate: (payload: GenerateTipsPayload) =>
    apiClient.post<GenerateTipsResponse>("/api/tips/generate", payload),

  /** Admin: list all tips paginated, filterable by category and status. */
  getAll: (page = 1, limit = 20, category?: string, is_active?: boolean) =>
    apiClient.get<TipListResponse>("/api/tips/all", {
      params: {
        page,
        limit,
        ...(category ? { category } : {}),
        ...(is_active !== undefined ? { is_active } : {}),
      },
    }),

  /** Admin: toggle is_active or update content for a tip. */
  update: (tipId: string, payload: { is_active?: boolean; content?: string }) =>
    apiClient.patch<Tip>(`/api/tips/${tipId}`, payload),
};
