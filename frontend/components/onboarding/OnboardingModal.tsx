"use client";

/**
 * OnboardingModal
 *
 * Shown once per account — when onboarding_completed === false.
 * Steps (1-indexed):
 *   1. Welcome            — brief intro, no user input
 *   2. Native Language    — dropdown, skippable
 *   3. Learning Goal      — dropdown, skippable
 *   4. Sidebar Tour       — static feature overview, just "Next"
 *   5. Journey CTA        — optional redirect hint, "Get Started" completes
 *
 * On step 5 primary action: PATCH /api/profile/ with collected data +
 * onboarding_completed=true, then calls onComplete() to unmount.
 *
 * The backdrop is intentionally NOT click-to-dismiss — onboarding must be
 * fully completed (or skipped past all steps) to persist the flag in DB.
 */

import { useState } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Brain,
  Settings,
  MapPin,
} from "lucide-react";

import { profileApi } from "@/lib/api";
import { OnboardingStep } from "./OnboardingStep";

// ── Constants ──────────────────────────────────────────────────────────────────

const LANGUAGE_OPTIONS = [
  "English", "Mandarin Chinese", "Arabic", "Hindi", "Spanish",
  "French", "Bengali", "Portuguese", "Russian", "Japanese",
  "German", "Korean", "Indonesian", "Thai", "Vietnamese",
  "Tamil", "Urdu", "Turkish", "Italian", "Polish",
  "Other",
];

const GOAL_OPTIONS = [
  "Survival Malay (basic daily communication)",
  "Conversational Malay (confident everyday use)",
  "Academic Malay (university / formal settings)",
  "Business Malay (professional environment)",
  "Just curious / exploring",
];

const SIDEBAR_FEATURES = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    desc: "Track your vocabulary, quiz history, and proficiency level at a glance.",
  },
  {
    icon: MessageSquare,
    label: "AI Tutor",
    desc: "Chat freely with your personal Malay tutor powered by Google Gemini.",
  },
  {
    icon: BookOpen,
    label: "Courses",
    desc: "Generate a custom Malay course on any topic you choose.",
  },
  {
    icon: Brain,
    label: "Quiz",
    desc: "Test your knowledge with adaptive quizzes that target your weak areas.",
  },
  {
    icon: Settings,
    label: "Settings",
    desc: "Update your profile, change your password, and view app info.",
  },
];

const TOTAL_STEPS = 5;

// ── Component ──────────────────────────────────────────────────────────────────

interface OnboardingModalProps {
  /** Called after onboarding_completed is saved to DB — unmounts the modal */
  onComplete: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [nativeLanguage, setNativeLanguage] = useState("");
  const [learningGoal, setLearningGoal] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function next() {
    setSaveError(null);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  /** Complete onboarding: PATCH profile then call onComplete */
  async function finish() {
    setSaving(true);
    setSaveError(null);
    try {
      await profileApi.updateProfile({
        native_language: nativeLanguage || null,
        learning_goal: learningGoal || null,
        onboarding_completed: true,
      });
      onComplete();
    } catch {
      setSaveError("Could not save your preferences. Please try again.");
      setSaving(false);
    }
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
            subtitle="Your AI-powered companion for learning Bahasa Melayu. Let us take 60 seconds to get you set up."
            nextLabel="Get Started"
            onNext={next}
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
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </OnboardingStep>
        );

      // ── Step 3: Learning Goal ──────────────────────────────────────────────
      case 3:
        return (
          <OnboardingStep
            currentStep={3}
            totalSteps={TOTAL_STEPS}
            title="Why are you learning Malay?"
            subtitle="We will personalise your courses and quizzes around your goal."
            onNext={next}
            onSkip={next}
          >
            <select
              value={learningGoal}
              onChange={(e) => setLearningGoal(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
            >
              <option value="">— Select your goal —</option>
              {GOAL_OPTIONS.map((goal) => (
                <option key={goal} value={goal}>
                  {goal}
                </option>
              ))}
            </select>
          </OnboardingStep>
        );

      // ── Step 4: Sidebar Tour ───────────────────────────────────────────────
      case 4:
        return (
          <OnboardingStep
            currentStep={4}
            totalSteps={TOTAL_STEPS}
            title="Here is what you can do"
            subtitle="BahasaBot has everything you need to master Bahasa Melayu."
            onNext={next}
          >
            <ul className="space-y-3">
              {SIDEBAR_FEATURES.map(({ icon: Icon, label, desc }) => (
                <li key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </OnboardingStep>
        );

      // ── Step 5: Journey CTA ────────────────────────────────────────────────
      case 5:
        return (
          <OnboardingStep
            currentStep={5}
            totalSteps={TOTAL_STEPS}
            title="You are all set"
            subtitle="Start exploring BahasaBot now, or create a personalised learning roadmap to stay on track."
            nextLabel="Get Started"
            onNext={finish}
            loading={saving}
            error={saveError}
          >
            <div className="rounded-xl border border-border bg-muted/40 p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin size={18} className="text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">My Journey</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Set a learning deadline and goal — BahasaBot will generate a week-by-week
                  roadmap with recommended activities just for you. Find it in the sidebar
                  once you are inside the app.
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
    // Backdrop — not dismissible on click (onboarding must complete)
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border p-8 max-h-[90vh] overflow-y-auto">
        {renderStep()}
      </div>
    </div>
  );
}
