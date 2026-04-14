// Core TypeScript interfaces for BahasaBot
// Extended per phase as new features are added.

// ── User ──────────────────────────────────────────────────────────────────────

export type ProficiencyLevel = "BPS-1" | "BPS-2" | "BPS-3" | "BPS-4";

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

// ── Courses (Phase 4) ─────────────────────────────────────────────────────────

export interface SyllableBreakdown {
  syllable: string;
  sounds_like: string;
}

export interface VocabularyItem {
  word: string;
  meaning: string;
  example: string;
  ipa?: string;               // IPA transcription e.g. "/sə.la.mat/"
  syllables?: SyllableBreakdown[];
  synonyms?: string[];        // Malaysian Malay synonyms
}

export interface ExampleSentence {
  bm: string;
  en: string;
}

export interface ClassSummary {
  id: string;
  module_id: string;
  title: string;
  order_index: number;
  is_completed: boolean;
}

export interface ClassDetail {
  id: string;
  module_id: string;
  title: string;
  content: string;
  vocabulary_json: VocabularyItem[];
  examples_json: ExampleSentence[];
  order_index: number;
  created_at: string;
  is_completed: boolean;
  module_title: string;
  course_title: string;
}

export interface ClassCompleteResponse {
  class_id: string;
  completed: boolean;
  all_module_classes_done: boolean;
  quiz_unlocked: boolean;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  created_at: string;
  classes: ClassSummary[];
  is_locked: boolean;
  is_completed: boolean;
  quiz_available: boolean;
}

export interface Course {
  id: string;
  user_id: string;
  title: string;
  description: string;
  topic: string;
  objectives: string[];
  created_at: string;
  modules: Module[];
  total_classes: number;
  completed_classes: number;
  cover_image_url: string | null;
}

export interface CourseSummary {
  id: string;
  title: string;
  description: string;
  topic: string;
  cover_image_url: string | null;
  created_at: string;
  total_classes: number;
  completed_classes: number;
  module_count: number;
}

export interface CourseGenerateResponse {
  /** job_id is returned immediately (HTTP 202). Poll /api/courses/jobs/{job_id} for status. */
  job_id: string;
  message: string;
}

export type JobStatus = "pending" | "running" | "complete" | "failed";

export interface JobStatusResponse {
  job_id: string;
  status: JobStatus;
  progress: number;   // 0–100
  step: string;
  course_id?: string; // Present when status === "complete"
  error?: string;     // Present when status === "failed"
}

// ── Chatbot (Phase 3 + Phase 21) ─────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

/** A chat session summary as returned by GET /api/chatbot/sessions */
export interface ChatSessionSummary {
  id: string;
  created_at: string;
  last_message: string | null;
  /** First user message truncated to 60 chars — used as display title */
  title: string | null;
  message_count: number;
}

/** Paginated list of chat sessions */
export interface SessionListResponse {
  sessions: ChatSessionSummary[];
  total: number;
  page: number;
  limit: number;
}

/** Full message history for a single session */
export interface ChatHistoryResponse {
  session_id: string;
  messages: ChatMessage[];
  total: number;
  page: number;
  limit: number;
}

// ── Quiz (Phase 5) ────────────────────────────────────────────────────────────

export type QuestionType = "mcq" | "fill_in_blank";

/** A single quiz question returned by GET /quiz — correct_answer is NOT included. */
export interface ModuleQuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options: string[] | null; // MCQ only; null for fill_in_blank
}

/** GET /courses/{courseId}/modules/{moduleId}/quiz response */
export interface ModuleQuizResponse {
  module_id: string;
  module_title: string;
  questions: ModuleQuizQuestion[];
  already_passed: boolean;
}

/** A single answer the user submits */
export interface QuizAnswer {
  question_id: string;
  answer: string;
}

/** Per-question result after scoring */
export interface QuestionResult {
  question_id: string;
  question: string;
  your_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
}

/** POST /courses/{courseId}/modules/{moduleId}/quiz response */
export interface ModuleQuizResult {
  score: number;          // 0.0–1.0
  score_percent: number;  // 0–100
  passed: boolean;
  correct_count: number;
  total_questions: number;
  question_results: QuestionResult[];
  module_unlocked: boolean;
}

// ── Standalone Adaptive Quiz (Phase 6) ────────────────────────────────────────

export type StandaloneQuestionType = "mcq" | "fill_in_blank" | "translation";

/** A single standalone quiz question (correct_answer not included). */
export interface StandaloneQuizQuestion {
  id: string;
  type: StandaloneQuestionType;
  question: string;
  options: string[] | null; // MCQ only; null for fill_in_blank/translation
}

/** GET /api/quiz/ response */
export interface StandaloneQuizResponse {
  questions: StandaloneQuizQuestion[];
  question_count: number;
}

/** POST /api/quiz/submit response */
export interface StandaloneQuizResult {
  score: number;                      // 0.0–1.0
  score_percent: number;              // 0–100
  correct_count: number;
  total_questions: number;
  question_results: QuestionResult[];
  new_proficiency_level: ProficiencyLevel;
  previous_proficiency_level: ProficiencyLevel;
  level_changed: boolean;
}

// ── Dashboard (Phase 7) ───────────────────────────────────────────────────────

export interface DashboardStats {
  courses_created: number;
  modules_completed: number;
  classes_completed: number;
  quizzes_taken: number;
  vocabulary_count: number;
  grammar_count: number;
  proficiency_level: ProficiencyLevel;
  streak_count: number;
  xp_total: number;
}

export interface VocabularyEntry {
  id: string;
  word: string;
  meaning: string;
  source_type: "chatbot" | "course";
  source_name: string;
  learned_at: string;
}

export interface GrammarEntry {
  id: string;
  rule: string;
  example: string;
  source_type: "chatbot" | "course";
  source_name: string;
  learned_at: string;
}

export interface WeakPointEntry {
  id: string;
  topic: string;
  type: "vocab" | "grammar";
  strength_score: number;  // 0.0–1.0
  recommendation: string;
}

export interface QuizHistoryEntry {
  id: string;
  quiz_type: "module" | "standalone";
  module_title: string | null;
  score: number;          // 0.0–1.0
  score_percent: number;  // 0–100
  passed: boolean;
  taken_at: string;
}

export interface CourseProgressItem {
  course_id: string;
  course_title: string;
  total_classes: number;
  completed_classes: number;
  progress_percent: number;  // 0–100
}

/** GET /api/dashboard/ */
export interface DashboardSummary {
  stats: DashboardStats;
  recent_vocabulary: VocabularyEntry[];
  recent_grammar: GrammarEntry[];
  top_weak_points: WeakPointEntry[];
  recent_quiz_history: QuizHistoryEntry[];
}

/** GET /api/dashboard/vocabulary */
export interface VocabularyListResponse {
  items: VocabularyEntry[];
  total: number;
  page: number;
  limit: number;
}

/** GET /api/dashboard/grammar */
export interface GrammarListResponse {
  items: GrammarEntry[];
  total: number;
  page: number;
  limit: number;
}

/** GET /api/dashboard/progress */
export interface ProgressResponse {
  courses: CourseProgressItem[];
  total_modules: number;
  completed_modules: number;
}

/** GET /api/dashboard/weak-points */
export interface WeakPointsResponse {
  weak_points: WeakPointEntry[];
  total: number;
}

/** GET /api/dashboard/quiz-history */
export interface QuizHistoryResponse {
  items: QuizHistoryEntry[];
  total: number;
  page: number;
  limit: number;
}

// ── Profile (Phase 13) ────────────────────────────────────────────────────────

/** GET /api/profile/ */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  native_language: string | null;
  learning_goal: string | null;
  profile_picture_url: string | null;
  proficiency_level: ProficiencyLevel;
  role: string;
  streak_count: number;
  xp_total: number;
  onboarding_completed: boolean;
  has_seen_tour: boolean;
  provider: "email" | "google";
  gender: string | null;
  age_range: string | null;
}

/** PATCH /api/profile/ request body */
export interface ProfileUpdatePayload {
  name?: string;
  native_language?: string | null;
  learning_goal?: string | null;
  profile_picture_url?: string | null;
  onboarding_completed?: boolean;
  has_seen_tour?: boolean;
  gender?: string | null;
  age_range?: string | null;
}

/** POST /api/profile/change-password request body */
export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

/** POST /api/profile/change-password response */
export interface ChangePasswordResponse {
  message: string;
}

// ── Admin (Phase 15) ──────────────────────────────────────────────────────────

/** GET /api/admin/stats */
export interface AdminStats {
  total_users: number;
  active_users: number;
  total_courses_generated: number;
  total_quiz_attempts: number;
  quiz_pass_rate: number;       // 0–100
  feedback_count: number;
  avg_feedback_rating: number | null;
  active_roadmaps: number;
}

/** Row in GET /api/admin/users */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  proficiency_level: ProficiencyLevel;
  role: "user" | "admin";
  is_active: boolean;
  streak_count: number;
  xp_total: number;
  provider: "email" | "google";
  created_at: string;
}

/** Row in GET /api/admin/feedback */
export interface AdminFeedbackItem {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  quiz_type: "module" | "standalone" | "general";
  rating: number;               // 1–5
  weak_points_relevant: "yes" | "no" | "somewhat";
  comments: string | null;
  created_at: string;
}

/** GET /api/admin/feedback response */
export interface AdminFeedbackResponse {
  items: AdminFeedbackItem[];
  total: number;
  page: number;
  limit: number;
  avg_rating: number | null;
  rating_distribution: Record<number, number>;
}

/** GET /api/admin/users/{userId}/analytics */
export interface AdminUserAnalytics {
  token_usage: {
    total_input_tokens: number;
    total_output_tokens: number;
    total_tokens: number;
    by_feature: Record<string, { input: number; output: number; total: number }>;
    daily: { date: string; tokens: number }[];
  };
  activity: {
    total_events: number;
    by_feature: Record<string, number>;
    daily: { date: string; events: number }[];
  };
}

/** GET /api/admin/users/{userId} — full user detail */
export interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  provider: "email" | "google";
  is_active: boolean;
  proficiency_level: ProficiencyLevel;
  native_language: string | null;
  learning_goal: string | null;
  profile_picture_url: string | null;
  streak_count: number;
  xp_total: number;
  onboarding_completed: boolean;
  created_at: string;
  stats: {
    courses_count: number;
    classes_completed: number;
    vocab_count: number;
    grammar_count: number;
    module_quiz_attempts: number;
    standalone_quiz_attempts: number;
    chat_sessions: number;
    weak_points: number;
  };
  recent_courses: { id: string; title: string; topic: string; created_at: string }[];
}

// ── Notifications (Phase 17) ───────────────────────────────────────────────────

export type NotificationType =
  | "streak_milestone"
  | "xp_milestone"
  | "journey_reminder"
  | "course_complete"
  | "phase_complete";

export interface AppNotification {
  id: string;
  type: NotificationType | string;
  message: string;
  read: boolean;
  created_at: string;
  /** Base64 data URL for visual notifications (e.g. BPS milestone card) */
  image_url: string | null;
}

export interface NotificationListResponse {
  notifications: AppNotification[];
  unread_count: number;
}

// ── Games — Spelling Practice (Phase 19) ──────────────────────────────────────

export interface SpellingWord {
  id: string;
  word: string;
  meaning: string;
  ipa: string | null;
  source_type: string;
}

export interface SpellingSubmitResponse {
  correct: boolean;
  /** True when the answer is off by exactly one character (edit-distance 1). */
  almost: boolean;
  correct_word: string;
  ipa: string | null;
  meaning: string;
  xp_awarded: number;
}

export interface SpellingPersonalBest {
  best_correct: number;
  best_attempted: number;
}

// ── Journey — My Learning Roadmap (Phase 20 v2) ───────────────────────────────

/** Intent options shown in the 3-question onboarding modal */
export type JourneyIntent = "casual" | "academic" | "work" | "travel" | "other";

/** A single course obstacle in the roadmap */
export interface RoadmapElement {
  order: number;
  topic: string;
  description: string;
  estimated_weeks: number;
  completed: boolean;
  completed_at: string | null;
  /** True when the user already has a course matching this topic */
  exists?: boolean;
  /** The existing course ID, populated when exists === true */
  course_id?: string | null;
}

/** Full roadmap as returned by GET /api/journey/roadmap */
export interface UserRoadmap {
  id: string;
  intent: JourneyIntent;
  goal: string;
  timeline_months: number;
  elements: RoadmapElement[];
  status: "active" | "overdue" | "completed" | "deleted";
  deadline: string;            // ISO date string
  extended: boolean;
  created_at: string;
  completed_at: string | null;
  bps_level_at_creation: string;
  banner_image_url: string | null;
  completed_count: number;
  total_count: number;
  bps_upgraded: boolean;       // true if BPS level went up since roadmap was created
  days_remaining: number;
}

/** POST /api/journey/roadmap/generate request body */
export interface GenerateRoadmapPayload {
  intent: JourneyIntent;
  goal: string;
  timeline_months: number;     // 1–6
  intent_other?: string | null;  // required when intent === 'other'
}

/** GET /api/journey/roadmap/history — one past roadmap summary */
export interface PastJourneyItem {
  id: string;
  intent: string;
  goal: string;
  timeline_months: number;
  deadline: string;
  completed_at: string | null;
  status: "completed" | "deleted";
  total_elements: number;
  completed_elements: number;
  created_at: string;
}

// ── Evaluation Feedback (Phase 20 / Section 5.20) ────────────────────────────

/** POST /api/evaluation/feedback request body */
export interface FeedbackPayload {
  quiz_type: "module" | "standalone" | "general";
  rating: number;               // 1–5
  weak_points_relevant: "yes" | "no" | "somewhat";
  comments?: string;            // optional, max 1000 chars
}

/** POST /api/evaluation/feedback response */
export interface FeedbackSubmitResponse {
  success: boolean;
  message: string;
}

/** Admin: one row in the journeys table */
export interface AdminRoadmapRow {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  intent: string;
  goal: string;
  timeline_months: number;
  status: string;
  deadline: string;
  extended: boolean;
  created_at: string;
  completed_at: string | null;
  bps_level_at_creation: string;
  total_count: number;
  completed_count: number;
  elements: RoadmapElement[];
}
