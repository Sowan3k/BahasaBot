"use client";

/**
 * My Journey — /journey
 *
 * States:
 *  1. Loading — skeleton
 *  2. No roadmap / deleted — 3-question setup modal
 *  3. Active / Overdue — road UI with obstacle nodes
 *  4. Completed — celebration page
 *
 * Features:
 *  - Overdue banner with optional extend (once only)
 *  - BPS upgrade banner with regenerate / dismiss
 *  - Identity-verified delete (password for email, confirm for Google)
 */

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Flag,
  GraduationCap,
  Lock,
  Map,
  PartyPopper,
  RefreshCw,
  Trash2,
  Sparkles,
  Trophy,
  X,
  Zap,
} from "lucide-react";

import type { JourneyIntent, PastJourneyItem, RoadmapElement, UserRoadmap } from "@/lib/types";
import { journeyApi, profileApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

// ── Constants ─────────────────────────────────────────────────────────────────

const INTENT_OPTIONS: { value: JourneyIntent; label: string; icon: string }[] = [
  { value: "casual",   label: "Casual Learning",        icon: "📚" },
  { value: "academic", label: "Academic Purposes",       icon: "🎓" },
  { value: "work",     label: "Work & Professional",     icon: "💼" },
  { value: "travel",   label: "Travel & Culture",        icon: "✈️" },
  { value: "other",    label: "Other",                   icon: "💡" },
];

const TIMELINE_OPTIONS = [
  { value: 1, label: "1 Month" },
  { value: 2, label: "2 Months" },
  { value: 3, label: "3 Months" },
  { value: 4, label: "4 Months" },
  { value: 5, label: "5 Months" },
  { value: 6, label: "6 Months" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getElementState(
  elem: RoadmapElement,
  index: number,
  elements: RoadmapElement[]
): "completed" | "current" | "locked" {
  if (elem.completed) return "completed";
  // Current = all previous elements are completed (or it's the first)
  const allPrevDone = elements.slice(0, index).every((e) => e.completed);
  if (allPrevDone) return "current";
  return "locked";
}

// ── Setup Modal (3-question onboarding) ──────────────────────────────────────

interface SetupModalProps {
  onGenerated: (roadmap: UserRoadmap) => void;
  onDismiss: () => void;
}

function SetupModal({ onGenerated, onDismiss }: SetupModalProps) {
  const [step, setStep]               = useState<1 | 2 | 3>(1);
  const [intent, setIntent]           = useState<JourneyIntent | "">("");
  const [intentOther, setIntentOther] = useState("");
  const [goal, setGoal]               = useState("");
  const [timeline, setTimeline]       = useState<number>(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!intent || !goal.trim()) return;
    if (intent === "other" && !intentOther.trim()) return;
    setGenerationError(null);
    setIsGenerating(true);
    try {
      const res = await journeyApi.generateRoadmap({
        intent: intent as JourneyIntent,
        goal: goal.trim(),
        timeline_months: timeline,
        intent_other: intent === "other" ? intentOther.trim() || null : null,
      });
      onGenerated(res.data);
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { message?: string; detail?: string } } })?.response?.data;
      const msg = errData?.message ?? errData?.detail ?? "Could not generate your roadmap. Please try again.";
      setGenerationError(msg);
      setIsGenerating(false);
    }
  }

  // Step 1 Continue disabled: no intent selected, or "other" selected but no free text
  const step1Disabled = !intent || (intent === "other" && !intentOther.trim());

  return (
    // pointer-events-none on backdrop so the sidebar remains clickable.
    // The card itself is pointer-events-auto.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-primary/10 border-b border-border px-6 py-5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                My Journey
              </span>
            </div>
            <button
              onClick={onDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/30"
              aria-label="Dismiss — create roadmap later"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Let&apos;s build your roadmap
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Step {step} of 3 — {step === 1 ? "Your intent" : step === 2 ? "Your goal" : "Your timeline"}
          </p>
          {/* Progress dots */}
          <div className="flex gap-2 mt-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  n <= step ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4">

          {/* Step 1 — Intent */}
          {step === 1 && (
            <>
              <p className="text-sm font-semibold text-foreground">
                What brings you to BahasaBot?
              </p>
              <div className="space-y-2">
                {INTENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setIntent(opt.value)}
                    className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-sm text-left transition-all ${
                      intent === opt.value
                        ? "border-primary bg-primary/10 text-foreground font-medium"
                        : "border-border bg-background hover:border-primary/40 text-foreground"
                    }`}
                  >
                    <span className="text-base leading-none">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
              {/* Free-text input shown only when "Other" is selected */}
              {intent === "other" && (
                <input
                  type="text"
                  value={intentOther}
                  onChange={(e) => setIntentOther(e.target.value)}
                  placeholder="Please describe your purpose..."
                  maxLength={200}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              )}
            </>
          )}

          {/* Step 2 — Goal */}
          {step === 2 && (
            <>
              <p className="text-sm font-semibold text-foreground">
                What is your main learning goal?
              </p>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. I want to be able to have basic conversations with my Malaysian colleagues"
                className="w-full min-h-[100px] rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">{goal.length}/500</p>
            </>
          )}

          {/* Step 3 — Timeline */}
          {step === 3 && (
            <>
              <p className="text-sm font-semibold text-foreground">
                When do you want to complete your journey?
              </p>
              <div className="grid grid-cols-3 gap-2">
                {TIMELINE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTimeline(opt.value)}
                    className={`rounded-xl border px-3 py-3 text-sm font-medium transition-all ${
                      timeline === opt.value
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-background hover:border-primary/40 text-muted-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Your roadmap will have{" "}
                <span className="font-semibold text-foreground">
                  {[4, 6, 9, 12, 15, 18][timeline - 1]} course obstacles
                </span>{" "}
                proportional to this timeline.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 space-y-3">
          {/* Generation error shown above buttons */}
          {generationError && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {generationError}
            </p>
          )}
          <div className="flex gap-3">
            {step > 1 && !isGenerating && (
              <button
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/30 transition-all"
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={() => setStep((s) => (s + 1) as 2 | 3)}
                disabled={step === 1 ? step1Disabled : goal.trim().length < 5}
                className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    Generating...
                  </>
                ) : generationError ? (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate My Journey
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Obstacle node ─────────────────────────────────────────────────────────────

interface ObstacleProps {
  elem: RoadmapElement;
  index: number;
  elements: RoadmapElement[];
  onClickUnlocked: (elem: RoadmapElement) => void;
}

function ObstacleNode({ elem, index, elements, onClickUnlocked }: ObstacleProps) {
  const state = getElementState(elem, index, elements);
  const [expanded, setExpanded] = useState(false);

  const isLeft = index % 2 === 0;

  // On mobile: always single-column (circle left, card right). Zigzag only on sm+.
  const containerClass = `relative flex ${
    isLeft ? "flex-row sm:flex-row" : "flex-row sm:flex-row-reverse"
  } items-center gap-3 sm:gap-4 py-2`;

  const nodeClass =
    state === "completed"
      ? "bg-emerald-500/20 border-2 border-emerald-500 text-emerald-500"
      : state === "current"
      ? "bg-primary/20 border-2 border-primary text-primary animate-pulse-subtle"
      : "bg-muted/40 border-2 border-border/40 text-muted-foreground/40";

  const labelClass =
    state === "locked"
      ? "opacity-40 cursor-not-allowed"
      : "cursor-pointer hover:opacity-80 transition-opacity";

  function handleClick() {
    if (state === "locked") return;
    onClickUnlocked(elem);
  }

  return (
    <div className={containerClass}>
      {/* Node circle */}
      <button
        onClick={handleClick}
        disabled={state === "locked"}
        className={`shrink-0 h-12 w-12 rounded-full flex items-center justify-center shadow-md transition-all ${nodeClass} ${
          state !== "locked" ? "hover:scale-110 cursor-pointer" : "cursor-not-allowed"
        }`}
        title={
          state === "completed"
            ? "Completed"
            : state === "current"
            ? "Click to start this course"
            : "Complete previous obstacles first"
        }
      >
        {state === "completed" ? (
          <CheckCircle2 className="h-6 w-6" />
        ) : state === "current" ? (
          <span className="text-xl font-bold">{index + 1}</span>
        ) : (
          <Lock className="h-5 w-5" />
        )}
      </button>

      {/* Card */}
      <div
        className={`flex-1 min-w-0 rounded-xl border bg-card p-3 sm:p-4 shadow-sm transition-all ${labelClass} ${
          state === "current" ? "border-primary/40 bg-primary/5" : ""
        } ${state === "completed" ? "border-emerald-500/20 bg-emerald-500/5" : ""}`}
        onClick={state !== "locked" ? () => setExpanded((e) => !e) : undefined}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Obstacle {index + 1}
              </span>
              {state === "completed" && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-medium">
                  Done
                </span>
              )}
              {state === "current" && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                  Up next
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-foreground line-clamp-2 break-words">{elem.topic}</p>
            {elem.estimated_weeks != null && (
              <p className="text-xs text-muted-foreground mt-0.5">
                ~{elem.estimated_weeks} week{elem.estimated_weeks !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          {state !== "locked" && (
            <button className="shrink-0 text-muted-foreground" onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>

        {expanded && (
          <div className="mt-2 pt-2 border-t border-border/50 space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">{elem.description}</p>
            <p className="text-xs text-muted-foreground">
              Estimated: ~{elem.estimated_weeks} week{elem.estimated_weeks !== 1 ? "s" : ""}
            </p>
            {elem.completed_at && (
              <p className="text-xs text-emerald-600">
                Completed {formatDate(elem.completed_at)}
              </p>
            )}
            {state === "current" && (
              <button
                onClick={(e) => { e.stopPropagation(); onClickUnlocked(elem); }}
                className="mt-1 w-full rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
              >
                Start this course →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Delete confirmation modal ──────────────────────────────────────────────────

interface DeleteModalProps {
  provider: "email" | "google";
  userEmail: string;
  onConfirm: (password?: string) => Promise<void>;
  onCancel: () => void;
  isDeleting: boolean;
  error: string | null;
}

function DeleteModal({ provider, userEmail, onConfirm, onCancel, isDeleting, error }: DeleteModalProps) {
  const [password, setPassword] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-foreground">Delete this journey?</h2>
        <p className="text-sm text-muted-foreground">
          Your current roadmap and all progress will be permanently deleted.
        </p>

        {provider === "email" ? (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Enter your password to confirm
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        ) : (
          <p className="text-sm rounded-lg bg-muted/50 px-3 py-2 text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{userEmail}</span>
          </p>
        )}

        {error && (
          <p className="text-xs text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted/30 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(provider === "email" ? password : undefined)}
            disabled={isDeleting || (provider === "email" && !password)}
            className="flex-1 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
          >
            {isDeleting ? "Deleting…" : "Yes, delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Extend modal ──────────────────────────────────────────────────────────────

interface ExtendModalProps {
  onConfirm: (months: number) => Promise<void>;
  onCancel: () => void;
  isExtending: boolean;
}

function ExtendModal({ onConfirm, onCancel, isExtending }: ExtendModalProps) {
  const [months, setMonths] = useState(1);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-foreground">Extend your journey</h2>
        <p className="text-sm text-muted-foreground">
          How many extra months do you need? (One extension allowed per journey.)
        </p>
        <div className="flex gap-2">
          {[1, 2, 3].map((m) => (
            <button
              key={m}
              onClick={() => setMonths(m)}
              className={`flex-1 rounded-xl border px-3 py-3 text-sm font-medium transition-all ${
                months === m
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40"
              }`}
            >
              +{m} month{m > 1 ? "s" : ""}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isExtending}
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted/30 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(months)}
            disabled={isExtending}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isExtending ? "Extending…" : "Extend"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Completed celebration page ────────────────────────────────────────────────

interface CelebrationProps {
  roadmap: UserRoadmap;
  userName: string;
  provider: "email" | "google";
  userEmail: string;
  onStartNew: () => void;
}

function CelebrationPage({ roadmap, userName, provider, userEmail, onStartNew }: CelebrationProps) {
  const onTime = roadmap.completed_at
    ? new Date(roadmap.completed_at) <= new Date(roadmap.deadline)
    : false;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleStartNew(password?: string) {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await journeyApi.verifyAndDelete({
        password,
        oauth_confirmed: provider === "google",
      });
      onStartNew();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Incorrect password. Please try again.";
      setDeleteError(msg);
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 py-12 text-center space-y-6">
      <div className="relative">
        <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
          <Trophy className="h-10 w-10 text-primary" />
        </div>
        <PartyPopper className="absolute -top-2 -right-2 h-8 w-8 text-amber-500 animate-bounce" />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-3xl font-bold text-foreground">
          {onTime ? "Journey Complete! 🎉" : "Better Late Than Never! 🎉"}
        </h1>
        <p className="text-muted-foreground text-base">
          {onTime
            ? `Congratulations, ${userName}! You completed all ${roadmap.total_count} obstacles on time.`
            : `Well done, ${userName}! You completed all ${roadmap.total_count} obstacles.`}
        </p>
        {roadmap.completed_at && (
          <p className="text-sm text-muted-foreground">
            Finished: {formatDate(roadmap.completed_at)}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
        >
          <Sparkles className="h-4 w-4" />
          Start a New Journey
        </button>
      </div>

      <p className="text-sm text-muted-foreground max-w-sm">
        Starting a new journey will delete this completed roadmap and let you create a fresh one.
      </p>

      {showDeleteConfirm && (
        <DeleteModal
          provider={provider}
          userEmail={userEmail}
          onConfirm={handleStartNew}
          onCancel={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
          isDeleting={isDeleting}
          error={deleteError}
        />
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function JourneyPage() {
  const router = useRouter();

  const [roadmap, setRoadmap]       = useState<UserRoadmap | null | undefined>(undefined);
  const [showSetupModal, setShowSetupModal] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [userName, setUserName] = useState("Learner");
  const [userEmail, setUserEmail] = useState("");
  const [provider, setProvider] = useState<"email" | "google">("email");
  const [history, setHistory]   = useState<PastJourneyItem[]>([]);

  const [showDelete, setShowDelete]     = useState(false);
  const [isDeleting, setIsDeleting]     = useState(false);
  const [deleteError, setDeleteError]   = useState<string | null>(null);
  const [showExtend, setShowExtend]     = useState(false);
  const [isExtending, setIsExtending]   = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const queryClient = useQueryClient();

  // Fetch roadmap, profile, and history — cached for 5 min via global staleTime
  const {
    data: roadmapQueryData,
    isLoading: roadmapLoading,
    error: roadmapQueryError,
  } = useQuery({
    queryKey: ["journey", "roadmap"],
    queryFn: async () => {
      try {
        const res = await journeyApi.getRoadmap();
        return res.data as UserRoadmap;
      } catch (err: unknown) {
        const httpStatus = (err as { response?: { status?: number } })?.response?.status;
        if (httpStatus === 404) return null;
        throw err;
      }
    },
  });

  const { data: profileQueryData } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.getProfile().then((r) => r.data),
  });

  const { data: historyQueryData } = useQuery({
    queryKey: ["journey", "history"],
    queryFn: () => journeyApi.getHistory().then((r) => r.data),
  });

  // Sync query results to local state
  useEffect(() => {
    if (!roadmapLoading && roadmapQueryData !== undefined) {
      setRoadmap(roadmapQueryData ?? null);
    }
  }, [roadmapQueryData, roadmapLoading]);

  useEffect(() => {
    if (roadmapQueryError) {
      setFetchError("Could not load your journey. Please refresh the page.");
      setRoadmap(null);
    }
  }, [roadmapQueryError]);

  useEffect(() => {
    if (profileQueryData) {
      setUserName(profileQueryData.name || "Learner");
      setUserEmail(profileQueryData.email || "");
      setProvider(profileQueryData.provider ?? "email");
    }
  }, [profileQueryData]);

  useEffect(() => {
    if (historyQueryData) setHistory(historyQueryData);
  }, [historyQueryData]);

  // ── Delete handler ──────────────────────────────────────────────────────

  async function handleDelete(password?: string) {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await journeyApi.verifyAndDelete({
        password,
        oauth_confirmed: provider === "google",
      });
      setRoadmap(null);
      queryClient.setQueryData(["journey", "roadmap"], null);
      setShowDelete(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Incorrect password. Please try again.";
      setDeleteError(msg);
      setIsDeleting(false);
    }
  }

  // ── Extend handler ──────────────────────────────────────────────────────

  async function handleExtend(months: number) {
    setIsExtending(true);
    try {
      const res = await journeyApi.extendDeadline(months);
      setRoadmap(res.data);
      queryClient.setQueryData(["journey", "roadmap"], res.data);
      setShowExtend(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Could not extend the deadline.";
      alert(msg);
    } finally {
      setIsExtending(false);
    }
  }

  // ── BPS upgrade handlers ────────────────────────────────────────────────

  async function handleRegenerate() {
    setIsRegenerating(true);
    try {
      const res = await journeyApi.regenerate();
      setRoadmap(res.data);
      queryClient.setQueryData(["journey", "roadmap"], res.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Could not regenerate. Please try again.";
      alert(msg);
    } finally {
      setIsRegenerating(false);
    }
  }

  async function handleDismissUpgrade() {
    await journeyApi.dismissUpgrade();
    setRoadmap((prev) => prev ? { ...prev, bps_upgraded: false } : prev);
    queryClient.setQueryData<UserRoadmap | null>(["journey", "roadmap"], (prev) =>
      prev ? { ...prev, bps_upgraded: false } : prev
    );
  }

  // ── Obstacle click handler ──────────────────────────────────────────────

  function handleObstacleClick(elem: RoadmapElement) {
    // CASE 1: already completed — view the completed course
    if (elem.completed && elem.course_id) {
      router.push(`/courses/${elem.course_id}`);
      return;
    }

    // CASE 2: course exists but not yet completed — continue it
    if (elem.exists && elem.course_id && !elem.completed) {
      router.push(`/courses/${elem.course_id}`);
      return;
    }

    // CASE 3 (locked) is already blocked by ObstacleNode before reaching here.

    // CASE 4: no existing course — trigger generation for this topic
    router.push(`/courses?generate=${encodeURIComponent(elem.topic)}`);
  }

  // ── Loading ─────────────────────────────────────────────────────────────

  if (roadmapLoading || roadmap === undefined) {
    return (
      <div className="w-full max-w-xl mx-auto px-3 pt-4 pb-4 sm:p-6 space-y-4 sm:space-y-5">
        {/* Header — icon+label row + title + goal text + trash button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-7 w-48 rounded" />
            <Skeleton className="h-4 w-64 rounded" />
          </div>
          <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
        </div>
        {/* Banner image — matches actual h-24 sm:h-32 */}
        <Skeleton className="h-24 sm:h-32 w-full rounded-2xl" />
        {/* Progress summary card — flag+text row + progress bar + deadline row */}
        <Skeleton className="h-24 w-full rounded-xl" />
        {/* Obstacle nodes — h-12 circle + card matching p-3 sm:p-4 content */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="relative pl-16">
            <Skeleton className="absolute left-4 top-5 h-4 w-4 rounded-full" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  // ── Fetch error ─────────────────────────────────────────────────────────

  if (fetchError) {
    return (
      <div className="w-full p-4 sm:p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {fetchError}
        </div>
      </div>
    );
  }

  // ── No roadmap — show setup modal (dismissible) ────────────────────────

  if (!roadmap) {
    return (
      <>
        {/* Background placeholder so the page isn't blank behind the modal */}
        <div className="w-full p-4 sm:p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <Map className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-lg font-semibold text-foreground">My Journey</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Your personalised learning roadmap will appear here.
          </p>
          {!showSetupModal && (
            <button
              onClick={() => setShowSetupModal(true)}
              className="mt-2 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              Create My Roadmap
            </button>
          )}
        </div>
        {showSetupModal && (
          <SetupModal
            onGenerated={(rm) => {
              setRoadmap(rm);
              queryClient.setQueryData(["journey", "roadmap"], rm);
            }}
            onDismiss={() => setShowSetupModal(false)}
          />
        )}
      </>
    );
  }

  // ── Completed roadmap ───────────────────────────────────────────────────

  if (roadmap.status === "completed") {
    return (
      <CelebrationPage
        roadmap={roadmap}
        userName={userName}
        provider={provider}
        userEmail={userEmail}
        onStartNew={() => {
          setRoadmap(null);
          queryClient.setQueryData(["journey", "roadmap"], null);
        }}
      />
    );
  }

  // ── Active / Overdue roadmap — road UI ─────────────────────────────────

  const elements = roadmap.elements;
  const completedCount = roadmap.completed_count;
  const totalCount = roadmap.total_count;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="w-full max-w-xl mx-auto px-3 pt-4 pb-4 sm:p-6 space-y-4 sm:space-y-5 overflow-x-hidden">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Map className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              My Journey
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Learning Roadmap</h1>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 break-words">{roadmap.goal}</p>
        </div>
        <button
          onClick={() => setShowDelete(true)}
          className="shrink-0 rounded-lg border border-border p-2 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
          title="Delete roadmap"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* ── Banner image ── */}
      {roadmap.banner_image_url && (
        <div className="relative overflow-hidden rounded-2xl h-24 sm:h-32">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={roadmap.banner_image_url}
            alt="Journey banner"
            className="absolute inset-0 w-full h-full object-cover opacity-60 rounded-2xl"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent rounded-2xl" />
          <div className="relative p-4 flex items-end h-full">
            <div className="flex items-center gap-3">
              <div className="text-xs font-semibold text-foreground uppercase tracking-wider">
                {roadmap.bps_level_at_creation}
              </div>
              <div className="text-muted-foreground text-xs">
                Started {formatDate(roadmap.created_at)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Progress summary ── */}
      <div className="rounded-xl border border-border bg-card p-3 sm:p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground min-w-0">
            <Flag className="h-4 w-4 shrink-0" />
            <span className="truncate">{completedCount} of {totalCount} obstacles cleared</span>
          </div>
          <span className="font-bold text-foreground shrink-0">{progressPct}%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex items-start gap-2 text-xs text-muted-foreground min-w-0">
          <Calendar className="h-3.5 w-3.5 shrink-0 mt-px" />
          <span className="break-words min-w-0">
            {roadmap.status === "overdue" ? (
              <span className="text-amber-500 font-medium">Deadline passed ({formatDate(roadmap.deadline)})</span>
            ) : (
              <>Target: {formatDate(roadmap.deadline)} — {roadmap.days_remaining}d remaining</>
            )}
          </span>
        </div>
      </div>

      {/* ── Overdue banner ── */}
      {roadmap.status === "overdue" && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-sm font-semibold text-amber-600">Your target deadline has passed.</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {roadmap.extended
              ? "You've already extended this journey once. Keep going — you can do it!"
              : "You can extend your journey by up to 3 months, or keep going at your own pace."}
          </p>
          {!roadmap.extended && (
            <button
              onClick={() => setShowExtend(true)}
              className="mt-1 flex items-center gap-1.5 rounded-lg border border-amber-500/40 px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-500/10 transition-colors"
            >
              <Calendar className="h-3.5 w-3.5" />
              Extend Deadline
            </button>
          )}
        </div>
      )}

      {/* ── BPS upgrade banner ── */}
      {roadmap.bps_upgraded && (
        <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm font-semibold text-primary">Your proficiency has improved! 🚀</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Would you like to update your roadmap to match your new level?
          </p>
          <div className="flex gap-2 mt-1">
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
              {isRegenerating ? "Updating…" : "Update Roadmap"}
            </button>
            <button
              onClick={handleDismissUpgrade}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/30 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Keep Current
            </button>
          </div>
        </div>
      )}

      {/* ── Road: vertical winding path with obstacle nodes ── */}
      <motion.div
        className="space-y-0 relative"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
      >
        {/* Vertical connector line */}
        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary/40 via-border to-border/20 rounded-full" />

        {elements.map((elem, i) => (
          <motion.div
            key={`${elem.order}-${elem.topic}`}
            className="relative pl-16"
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
            }}
          >
            {/* Road segment dot */}
            <div
              className={`absolute left-4 top-6 h-4 w-4 rounded-full border-2 z-10 transition-all ${
                elem.completed
                  ? "bg-emerald-500 border-emerald-500"
                  : getElementState(elem, i, elements) === "current"
                  ? "bg-primary border-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]"
                  : "bg-background border-border/40"
              }`}
            />
            <ObstacleNode
              elem={elem}
              index={i}
              elements={elements}
              onClickUnlocked={handleObstacleClick}
            />
          </motion.div>
        ))}

        {/* End flag */}
        <div className="relative pl-16 flex items-center gap-4 py-2">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center z-10">
            <GraduationCap className="h-3 w-3 text-primary/60" />
          </div>
          <div className="text-xs text-muted-foreground italic">
            {completedCount === totalCount
              ? "🎉 All obstacles cleared!"
              : `${totalCount - completedCount} obstacle${totalCount - completedCount !== 1 ? "s" : ""} remaining`}
          </div>
        </div>
      </motion.div>

      {/* ── Past Journeys ── */}
      {history.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Past Journeys</h2>
          </div>
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-card p-4 space-y-2 opacity-80"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{item.goal}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.timeline_months} month plan
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                      item.status === "completed"
                        ? "bg-emerald-500/20 text-emerald-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.status === "completed" ? "Completed ✅" : "Abandoned"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {item.completed_elements} of {item.total_elements} obstacles completed
                  </span>
                  <span>
                    {formatDate(item.created_at)}
                    {item.completed_at ? ` → ${formatDate(item.completed_at)}` : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showDelete && (
        <DeleteModal
          provider={provider}
          userEmail={userEmail}
          onConfirm={handleDelete}
          onCancel={() => { setShowDelete(false); setDeleteError(null); }}
          isDeleting={isDeleting}
          error={deleteError}
        />
      )}
      {showExtend && (
        <ExtendModal
          onConfirm={handleExtend}
          onCancel={() => setShowExtend(false)}
          isExtending={isExtending}
        />
      )}
    </div>
  );
}
