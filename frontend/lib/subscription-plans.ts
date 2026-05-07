// Hardcoded subscription plan data — never fetched from API.
// Source of truth: .claude/SUBSCRIPTION.md Sections 2 & 3.
// Phase 25 is display-only; no backend enforcement is wired here.

export interface SubscriptionPlan {
  id: "free" | "power_pass" | "monthly_pro" | "semester_pass";
  name: string;
  tagline: string;
  priceRM: number;
  /** Human-readable billing period, e.g. "Forever", "7 days" */
  period: string;
  /** Number of calendar days; 0 = forever */
  durationDays: number;
  chatLimitDaily: number | "Unlimited";
  courseGenLimitDaily: number | "Unlimited";
  quizAttempts: "Unlimited";
  adaptiveQuiz: boolean;
  pronunciationAudio: boolean;
  chatHistory: boolean;
  learningRoadmap: boolean;
  activeSessions: number;
  /** Highlight this plan as the recommended / most-popular option */
  featured: boolean;
  /** Short badge shown on the card when featured */
  featuredLabel?: string;
  /** Accent colour class (Tailwind) for visual differentiation */
  accentClass: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Explore Bahasa Melayu at your own pace",
    priceRM: 0,
    period: "Forever",
    durationDays: 0,
    chatLimitDaily: 30,
    courseGenLimitDaily: 1,
    quizAttempts: "Unlimited",
    adaptiveQuiz: false,
    pronunciationAudio: false,
    chatHistory: false,
    learningRoadmap: false,
    activeSessions: 1,
    featured: false,
    accentClass: "text-muted-foreground",
  },
  {
    id: "power_pass",
    name: "7-Day Power Pass",
    tagline: "Cram smart before your Bahasa Malaysia exam",
    priceRM: 35,
    period: "7 days",
    durationDays: 7,
    chatLimitDaily: 300,
    courseGenLimitDaily: 10,
    quizAttempts: "Unlimited",
    adaptiveQuiz: true,
    pronunciationAudio: true,
    chatHistory: true,
    learningRoadmap: true,
    activeSessions: 1,
    featured: true,
    featuredLabel: "Most Popular",
    accentClass: "text-primary",
  },
  {
    id: "monthly_pro",
    name: "Monthly Pro",
    tagline: "Consistent, structured learning all semester",
    priceRM: 60,
    period: "30 days",
    durationDays: 30,
    chatLimitDaily: 500,
    courseGenLimitDaily: 5,
    quizAttempts: "Unlimited",
    adaptiveQuiz: true,
    pronunciationAudio: true,
    chatHistory: true,
    learningRoadmap: true,
    activeSessions: 1,
    featured: false,
    accentClass: "text-blue-500",
  },
  {
    id: "semester_pass",
    name: "Semester Pass",
    tagline: "Best value for a full semester of Malay mastery",
    priceRM: 280,
    period: "6 months",
    durationDays: 180,
    chatLimitDaily: 500,
    courseGenLimitDaily: 5,
    quizAttempts: "Unlimited",
    adaptiveQuiz: true,
    pronunciationAudio: true,
    chatHistory: true,
    learningRoadmap: true,
    activeSessions: 1,
    featured: false,
    accentClass: "text-purple-500",
  },
];
