"use client";

/**
 * Journey Page — /journey
 *
 * Two states:
 *  1. Empty state  — user has no roadmap → show goal-setting form
 *  2. Roadmap view — user has an active roadmap → show RoadmapView
 *
 * Generation can take 10-20s (Gemini call). A loading state with spinner is shown.
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, Map, Sparkles } from "lucide-react";

import type { GoalType, LearningRoadmap } from "@/lib/types";
import { journeyApi } from "@/lib/api";
import { RoadmapView } from "@/components/journey/RoadmapView";
import { GlowCard } from "@/components/ui/glow-card";

// ── Constants ─────────────────────────────────────────────────────────────────

const GOAL_OPTIONS: { value: GoalType; label: string; description: string }[] = [
  {
    value: "survival",
    label: "Survival Malay",
    description: "Greetings, shopping, transport, and emergencies",
  },
  {
    value: "conversational",
    label: "Conversational Malay",
    description: "Everyday topics, social interactions, and work settings",
  },
  {
    value: "academic",
    label: "Academic / Formal Malay",
    description: "Writing, presentations, and official communication",
  },
];

// Minimum and maximum deadline: 2 months → 2 years from today
function minDeadline(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 2);
  return d.toISOString().split("T")[0];
}
function maxDeadline(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 2);
  return d.toISOString().split("T")[0];
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function JourneyPage() {
  const searchParams = useSearchParams();

  const [roadmap, setRoadmap] = useState<LearningRoadmap | null | undefined>(
    undefined
  ); // undefined = loading
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Goal form state
  const [goalType, setGoalType] = useState<GoalType>("conversational");
  const [deadlineDate, setDeadlineDate] = useState<string>(() => {
    // Default: 6 months from today
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split("T")[0];
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Load existing roadmap on mount
  useEffect(() => {
    journeyApi
      .getRoadmap()
      .then((res) => setRoadmap(res.data))
      .catch((err) => {
        if (err?.response?.status === 404) {
          setRoadmap(null); // No roadmap — show form
        } else {
          setFetchError("Could not load your roadmap. Please refresh the page.");
          setRoadmap(null);
        }
      });
  }, []);

  async function handleGenerate() {
    if (!deadlineDate || !goalType) return;
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const res = await journeyApi.generateRoadmap({
        deadline_date: deadlineDate,
        goal_type: goalType,
      });
      setRoadmap(res.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Could not generate your roadmap. Please try again.";
      setGenerateError(msg);
    } finally {
      setIsGenerating(false);
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────

  if (roadmap === undefined) {
    return (
      <div className="w-full p-3 sm:p-5 lg:p-6 space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-40 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
        </div>
        <div className="rounded-2xl bg-muted h-40 w-full" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-5 w-32 rounded bg-muted" />
              <div className="h-4 w-16 rounded bg-muted" />
            </div>
            <div className="space-y-2">
              {[1, 2].map((j) => (
                <div key={j} className="h-14 rounded-lg bg-muted" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────

  if (fetchError) {
    return (
      <div className="w-full p-3 sm:p-5 lg:p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {fetchError}
        </div>
      </div>
    );
  }

  // ── Roadmap generation loading state ───────────────────────────────────────

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-6">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-foreground">
            Crafting your personalised roadmap…
          </p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Our AI is analysing your proficiency, weak points, and goal to build a
            tailored learning plan. This takes about 15–20 seconds.
          </p>
        </div>
        {/* Animated steps */}
        <div className="flex flex-col gap-2 w-full max-w-xs">
          {[
            "Fetching your learning profile",
            "Analysing weak points",
            "Designing phase structure",
            "Writing personalised activities",
          ].map((step, i) => (
            <div
              key={step}
              className="flex items-center gap-2 text-xs text-muted-foreground"
              style={{ animationDelay: `${i * 0.5}s` }}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              {step}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Active roadmap ─────────────────────────────────────────────────────────

  if (roadmap) {
    return (
      <div className="w-full p-3 sm:p-5 lg:p-6">
        <RoadmapView
          roadmap={roadmap}
          onDeleted={() => setRoadmap(null)}
        />
      </div>
    );
  }

  // ── Empty state — goal-setting form ───────────────────────────────────────

  return (
    <div className="w-full p-3 sm:p-5 lg:p-6 space-y-6 max-w-xl mx-auto">
      {/* Page header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">My Journey</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Set your learning goal and deadline. We&apos;ll build a personalised roadmap
          that guides you step by step.
        </p>
      </div>

      {/* Goal-setting card */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
        {/* Step 1: Goal type */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-foreground">
            What is your learning goal?
          </label>
          <div className="space-y-2">
            {GOAL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setGoalType(opt.value)}
                className={`
                  w-full text-left rounded-xl border p-4 transition-all duration-150
                  ${
                    goalType === opt.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                  }
                `}
              >
                <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {opt.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Deadline */}
        <div className="space-y-2">
          <label
            htmlFor="deadline"
            className="text-sm font-semibold text-foreground"
          >
            When do you want to reach your goal?
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              id="deadline"
              type="date"
              value={deadlineDate}
              min={minDeadline()}
              max={maxDeadline()}
              onChange={(e) => setDeadlineDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Choose a date between 2 months and 2 years from now.
          </p>
        </div>

        {/* Error */}
        {generateError && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {generateError}
          </p>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!deadlineDate || !goalType}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
        >
          <Sparkles className="h-4 w-4" />
          Generate My Roadmap
        </button>
      </div>

      {/* Info strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            title: "Personalised",
            desc: "Built around your BPS level and weak areas",
          },
          {
            title: "Structured",
            desc: "Phases, weeks, and linked activities",
          },
          {
            title: "Flexible",
            desc: "Delete and regenerate a new plan anytime",
          },
        ].map((item) => (
          <GlowCard
            key={item.title}
            className="bg-card p-4 text-center space-y-1"
          >
            <p className="text-xs font-semibold text-foreground">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </GlowCard>
        ))}
      </div>
    </div>
  );
}
