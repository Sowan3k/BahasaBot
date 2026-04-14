"use client";

/**
 * OnboardingModal
 *
 * Shown once per account — when onboarding_completed === false.
 * Steps (1-indexed):
 *   1. Welcome            — brief intro, no user input
 *   2. Native Language    — dropdown, skippable
 *   3. Why learning Malay — maps to journey intent, skippable
 *   4. Current Malay level — maps to BPS scale, skippable
 *   5. Your goal          — free-text, skippable
 *   6. Timeline           — months slider, skippable
 *   7. Daily study time   — radio buttons, primary action = Generate Roadmap
 *
 * On step 7 primary action:
 *   1. PATCH /api/profile/ with all collected data + onboarding_completed=true
 *   2. POST /api/journey/roadmap/generate with mapped payload
 *   3. Shows a loading screen while the roadmap generates
 *   4. Calls onComplete("roadmap_ready") on success, onComplete("done") on error
 *
 * Skip at any point → PATCH profile with collected data + onboarding_completed=true,
 * then calls onComplete("done") — no roadmap is generated.
 *
 * The backdrop is NOT click-to-dismiss.
 */

import { useState } from "react";
import Image from "next/image";
import { MapPin, Loader2 } from "lucide-react";

import { profileApi, journeyApi } from "@/lib/api";
import { OnboardingStep } from "./OnboardingStep";
import type { JourneyIntent } from "@/lib/types";

// ── Constants ──────────────────────────────────────────────────────────────────

const LANGUAGE_OPTIONS = [
  "English", "Mandarin Chinese", "Arabic", "Hindi", "Spanish",
  "French", "Bengali", "Portuguese", "Russian", "Japanese",
  "German", "Korean", "Indonesian", "Thai", "Vietnamese",
  "Tamil", "Urdu", "Turkish", "Italian", "Polish",
  "Other",
];

/** Maps user-facing goal text → JourneyIntent used by the roadmap API */
const GOAL_OPTIONS: { label: string; intent: JourneyIntent }[] = [
  { label: "Survival Malay — basic daily communication",  intent: "travel"   },
  { label: "Conversational Malay — confident everyday use", intent: "casual"  },
  { label: "Academic Malay — university / formal settings", intent: "academic" },
  { label: "Business Malay — professional environment",   intent: "work"     },
  { label: "Just curious / exploring",                    intent: "casual"   },
];

const BPS_OPTIONS = [
  { value: "BPS-1", label: "BPS-1 — Beginner",      desc: "I know very little or no Malay" },
  { value: "BPS-2", label: "BPS-2 — Elementary",    desc: "I know some basic words and phrases" },
  { value: "BPS-3", label: "BPS-3 — Intermediate",  desc: "I can handle simple conversations" },
  { value: "BPS-4", label: "BPS-4 — Advanced",      desc: "I can read and write with confidence" },
] as const;

const TIMELINE_OPTIONS = [
  { value: 1, label: "1 month"  },
  { value: 2, label: "2 months" },
  { value: 3, label: "3 months" },
  { value: 4, label: "4 months" },
  { value: 5, label: "5 months" },
  { value: 6, label: "6 months" },
];

const STUDY_TIME_OPTIONS = [
  { value: "15 minutes", label: "15 min / day",  desc: "Light practice" },
  { value: "30 minutes", label: "30 min / day",  desc: "Steady progress" },
  { value: "1 hour",     label: "1 hr / day",    desc: "Focused learning" },
  { value: "2+ hours",   label: "2+ hrs / day",  desc: "Intensive study" },
];

const TOTAL_STEPS = 7;

// ── Component ──────────────────────────────────────────────────────────────────

export type OnboardingResult = "roadmap_ready" | "done";

interface OnboardingModalProps {
  /** Called after onboarding_completed is saved to DB. */
  onComplete: (result: OnboardingResult) => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);

  // Collected answers
  const [nativeLanguage, setNativeLanguage] = useState("");
  const [goalOption, setGoalOption] = useState<(typeof GOAL_OPTIONS)[number] | null>(null);
  const [bpsLevel, setBpsLevel] = useState("");
  const [goalText, setGoalText] = useState("");
  const [timelineMonths, setTimelineMonths] = useState<number>(3);
  const [studyTime, setStudyTime] = useState("");

  // UI state
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function next() {
    setSaveError(null);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  /**
   * Build the profile PATCH payload from whatever answers were collected.
   * Called on both "finish" and "skip" paths.
   */
  function buildProfilePayload() {
    // Combine intent label + goal text + study time into a single learning_goal string
    const parts: string[] = [];
    if (goalOption) parts.push(goalOption.label);
    if (goalText.trim()) parts.push(goalText.trim());
    if (studyTime) parts.push(`Studying ${studyTime}`);
    const combinedGoal = parts.join(" — ") || null;

    return {
      native_language: nativeLanguage || null,
      learning_goal: combinedGoal,
      onboarding_completed: true as const,
    };
  }

  /** Skip: save whatever was collected, do not generate roadmap */
  async function skip() {
    setSaving(true);
    setSaveError(null);
    try {
      await profileApi.updateProfile(buildProfilePayload());
      onComplete("done");
    } catch {
      setSaveError("Could not save your preferences. Please try again.");
      setSaving(false);
    }
  }

  /**
   * Final step primary action — save profile then generate roadmap.
   * Shows a loading screen while the roadmap generates.
   */
  async function generateRoadmap() {
    setSaving(true);
    setSaveError(null);
    try {
      await profileApi.updateProfile(buildProfilePayload());
    } catch {
      setSaveError("Could not save your preferences. Please try again.");
      setSaving(false);
      return;
    }
    setSaving(false);

    // Switch to loading screen
    setGenerating(true);
    setGenError(null);

    try {
      // Map collected answers → GenerateRoadmapPayload
      const intent: JourneyIntent = goalOption?.intent ?? "casual";
      const goalParts: string[] = [];
      if (goalText.trim()) goalParts.push(goalText.trim());
      if (studyTime) goalParts.push(`studying ${studyTime}`);
      const goal = goalParts.join(", ") || goalOption?.label || "Learn Bahasa Melayu";

      await journeyApi.generateRoadmap({
        intent,
        goal,
        timeline_months: timelineMonths,
      });

      onComplete("roadmap_ready");
    } catch {
      // Roadmap generation failed — complete onboarding anyway, just without roadmap
      setGenError("Could not generate your roadmap right now. You can create one later from My Journey.");
      // Show error briefly, then finish
      setTimeout(() => onComplete("done"), 3000);
    }
  }

  // ── Loading screen ────────────────────────────────────────────────────────────

  if (generating) {
    return (
      // During active roadmap generation the card is pointer-events-auto but the backdrop
      // keeps pointer-events-none so the sidebar remains accessible.
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border p-10 flex flex-col items-center gap-6 text-center">
          {genError ? (
            <>
              <p className="text-sm text-muted-foreground leading-relaxed">{genError}</p>
              <p className="text-xs text-muted-foreground">Redirecting to your dashboard…</p>
            </>
          ) : (
            <>
              <Loader2 size={40} className="text-primary animate-spin" />
              <div className="space-y-2">
                <p className="font-heading text-lg font-bold text-foreground">
                  Building your learning roadmap…
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  BahasaBot is creating a personalised week-by-week plan just for you.
                  This takes about 10–20 seconds.
                </p>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-[roadmap-progress_15s_ease-in-out_forwards]" />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Steps ─────────────────────────────────────────────────────────────────────

  function renderStep() {
    switch (step) {
      // ── Step 1: Welcome ────────────────────────────────────────────────────
      case 1:
        return (
          <OnboardingStep
            currentStep={1}
            totalSteps={TOTAL_STEPS}
            title="Welcome to BahasaBot"
            subtitle="Your AI-powered companion for learning Bahasa Melayu. Let us take 60 seconds to personalise your experience."
            nextLabel="Get Started"
            onNext={next}
            onSkip={skip}
            loading={saving}
          >
            <div className="flex justify-center py-2">
              <Image
                src="/Logo new (1).svg"
                alt="BahasaBot"
                width={201}
                height={64}
                priority
                className="object-contain"
              />
            </div>
          </OnboardingStep>
        );

      // ── Step 2: Native Language ────────────────────────────────────────────
      case 2:
        return (
          <OnboardingStep
            currentStep={2}
            totalSteps={TOTAL_STEPS}
            title="What is your native language?"
            subtitle="This helps BahasaBot explain Malay in a way that makes sense for you."
            onNext={next}
            onSkip={next}
          >
            <select
              value={nativeLanguage}
              onChange={(e) => setNativeLanguage(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
            >
              <option value="">— Select your native language —</option>
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </OnboardingStep>
        );

      // ── Step 3: Why Learning Malay ─────────────────────────────────────────
      case 3:
        return (
          <OnboardingStep
            currentStep={3}
            totalSteps={TOTAL_STEPS}
            title="Why are you learning Malay?"
            subtitle="We will personalise your roadmap and courses around your goal."
            onNext={next}
            onSkip={next}
          >
            <div className="space-y-2">
              {GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setGoalOption(opt)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                    goalOption?.intent === opt.intent && goalOption?.label === opt.label
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </OnboardingStep>
        );

      // ── Step 4: Current Malay Level ────────────────────────────────────────
      case 4:
        return (
          <OnboardingStep
            currentStep={4}
            totalSteps={TOTAL_STEPS}
            title="What is your current Malay level?"
            subtitle="Be honest — BahasaBot will calibrate your roadmap accordingly."
            onNext={next}
            onSkip={next}
          >
            <div className="space-y-2">
              {BPS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBpsLevel(opt.value)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    bpsLevel === opt.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <p className={`text-sm font-medium ${bpsLevel === opt.value ? "text-primary" : "text-foreground"}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </OnboardingStep>
        );

      // ── Step 5: Their Goal ─────────────────────────────────────────────────
      case 5:
        return (
          <OnboardingStep
            currentStep={5}
            totalSteps={TOTAL_STEPS}
            title="What do you want to achieve?"
            subtitle="Describe what you want to be able to do in Malay — in your own words."
            onNext={next}
            onSkip={next}
          >
            <div className="space-y-2">
              <textarea
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder="e.g. I want to hold a basic conversation with my Malaysian colleagues at work…"
                className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
              <p className="text-xs text-muted-foreground text-right">{goalText.length} / 300</p>
            </div>
          </OnboardingStep>
        );

      // ── Step 6: Timeline ───────────────────────────────────────────────────
      case 6:
        return (
          <OnboardingStep
            currentStep={6}
            totalSteps={TOTAL_STEPS}
            title="How long do you have?"
            subtitle="Choose a realistic timeline — you can always extend it later."
            onNext={next}
            onSkip={next}
          >
            <div className="grid grid-cols-3 gap-2">
              {TIMELINE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTimelineMonths(opt.value)}
                  className={`px-3 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    timelineMonths === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </OnboardingStep>
        );

      // ── Step 7: Daily Study Time ───────────────────────────────────────────
      case 7:
        return (
          <OnboardingStep
            currentStep={7}
            totalSteps={TOTAL_STEPS}
            title="How much time can you study each day?"
            subtitle="This helps BahasaBot set the right pace for your roadmap."
            nextLabel="Generate My Roadmap"
            onNext={generateRoadmap}
            onSkip={skip}
            loading={saving}
            error={saveError}
          >
            <div className="space-y-2">
              {STUDY_TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStudyTime(opt.value)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    studyTime === opt.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <p className={`text-sm font-semibold ${studyTime === opt.value ? "text-primary" : "text-foreground"}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
            {/* Journey preview card */}
            <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin size={18} className="text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">My Journey</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  BahasaBot will generate a week-by-week roadmap with recommended activities
                  based on your answers. Find it in the sidebar once you are inside the app.
                </p>
              </div>
            </div>
          </OnboardingStep>
        );

      default:
        return null;
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    // pointer-events-none on the backdrop so the sidebar and other layout elements
    // remain clickable while the modal is visible.  The card itself is pointer-events-auto.
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border p-8 max-h-[90vh] overflow-y-auto">
        {renderStep()}
      </div>
    </div>
  );
}
