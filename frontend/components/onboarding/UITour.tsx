"use client";

/**
 * UITour
 *
 * Two-mode tour component triggered once after onboarding completes.
 *
 * DESKTOP (md+): driver.js spotlight tour targeting sidebar nav elements.
 * MOBILE (<md):  Full-screen card-slide tour — the sidebar is hidden on mobile
 *                so spotlight targeting is not possible. Cards follow the
 *                industry-standard mobile onboarding pattern (Duolingo, Slack).
 *
 * Usage in layout.tsx:
 *   <UITour active={showTour && !showOnboarding} onDone={handleTourDone} />
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Brain,
  Map,
  Gamepad2,
  Settings,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import "driver.js/dist/driver.css";

// ── Shared tour step content (same copy for both modes) ───────────────────────

interface TourStep {
  icon: LucideIcon;
  color: string;    // icon circle background tint
  title: string;
  description: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    icon: Menu,
    color: "#d4a843",
    title: "Navigation Menu",
    description:
      'Tap the ☰ button (top-left) to open the menu. Every feature is one tap away — AI Tutor, Courses, Quiz, Journey, and more.',
  },
  {
    icon: LayoutDashboard,
    color: "#8d9d4f",
    title: "Dashboard",
    description:
      "Your learning HQ. Track vocabulary learned, quiz scores, streak, XP, and your overall BPS proficiency level.",
  },
  {
    icon: MessageSquare,
    color: "#c85a3c",
    title: "AI Tutor",
    description:
      "Chat freely with your personal Malay tutor powered by Google Gemini. Ask anything — grammar, pronunciation, vocabulary.",
  },
  {
    icon: BookOpen,
    color: "#d4a843",
    title: "Courses",
    description:
      "Generate a structured Malay course on any topic you choose. Complete modules and pass quizzes to unlock the next level.",
  },
  {
    icon: Brain,
    color: "#6C5CE7",
    title: "Quiz",
    description:
      "Adaptive quizzes that zero in on your weak areas. Every attempt updates your BPS proficiency score.",
  },
  {
    icon: Map,
    color: "#8d9d4f",
    title: "My Journey",
    description:
      "Your personalised learning roadmap. Complete course obstacles, track your deadline, and advance your BPS level.",
  },
  {
    icon: Gamepad2,
    color: "#c85a3c",
    title: "Spelling Game",
    description:
      "Hear a Malay word, type its spelling, and earn XP for each correct answer. Great for reinforcing vocabulary.",
  },
  {
    icon: Settings,
    color: "#7d8f6b",
    title: "Settings",
    description:
      "Update your profile, change your password, send feedback, and learn more about BahasaBot. You're all set! 🎉",
  },
];

// ── Desktop tour (driver.js spotlight) ───────────────────────────────────────

const DESKTOP_STEPS = [
  {
    element: '[data-tour="sidebar"]',
    popover: {
      title: "Your navigation hub",
      description:
        "Everything you need is in this sidebar. It collapses to icons to give you more screen space.",
      side: "right" as const,
      align: "center" as const,
    },
  },
  {
    element: '[data-tour="nav-dashboard"]',
    popover: {
      title: "Dashboard",
      description:
        "Track your vocabulary, quiz history, streak, XP, and overall proficiency at a glance.",
      side: "right" as const,
      align: "start" as const,
    },
  },
  {
    element: '[data-tour="nav-chatbot"]',
    popover: {
      title: "AI Tutor",
      description:
        "Chat freely with your personal Malay tutor powered by Google Gemini. Ask anything — grammar, pronunciation, vocabulary.",
      side: "right" as const,
      align: "start" as const,
    },
  },
  {
    element: '[data-tour="nav-courses"]',
    popover: {
      title: "Courses",
      description:
        "Generate a structured Malay course on any topic you choose. Each course has modules, classes, and a quiz you must pass to advance.",
      side: "right" as const,
      align: "start" as const,
    },
  },
  {
    element: '[data-tour="nav-quiz"]',
    popover: {
      title: "Quiz",
      description:
        "Adaptive quizzes that zero in on your weak areas. Every attempt improves your proficiency score and roadmap.",
      side: "right" as const,
      align: "start" as const,
    },
  },
  {
    element: '[data-tour="nav-journey"]',
    popover: {
      title: "My Journey",
      description:
        "Your personalised week-by-week learning roadmap. Complete obstacles, track your deadline, and level up your BPS score.",
      side: "right" as const,
      align: "start" as const,
    },
  },
  {
    element: '[data-tour="nav-games"]',
    popover: {
      title: "Spelling Game",
      description:
        "Practice spelling Malay words you have already learned. Hear the word, type it, and earn XP for each correct answer.",
      side: "right" as const,
      align: "start" as const,
    },
  },
  {
    element: '[data-tour="nav-settings"]',
    popover: {
      title: "Settings",
      description:
        "Update your profile, change your password, send feedback, and learn more about BahasaBot.",
      side: "right" as const,
      align: "start" as const,
    },
  },
];

// ── Mobile tour card component ────────────────────────────────────────────────

interface MobileTourProps {
  onDone: () => void;
}

function MobileTour({ onDone }: MobileTourProps) {
  const [step, setStep] = useState(0);
  // 1 = going forward (next step slides in from right), -1 = going back
  const [direction, setDirection] = useState(1);

  const total = TOUR_STEPS.length;
  const current = TOUR_STEPS[step];
  const Icon = current.icon;
  const isLast = step === total - 1;

  function goNext() {
    if (isLast) { onDone(); return; }
    setDirection(1);
    setStep((s) => s + 1);
  }

  function goBack() {
    if (step === 0) return;
    setDirection(-1);
    setStep((s) => s - 1);
  }

  // Slide variants: forward = enter from right, exit to left
  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 56 : -56, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -56 : 56, opacity: 0 }),
  };

  return (
    // Full-screen backdrop
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/70 backdrop-blur-sm px-5">
      {/* Card */}
      <div className="relative w-full max-w-[340px] rounded-2xl bg-card border border-border/60 shadow-2xl overflow-hidden">

        {/* Skip button — top-right corner */}
        <button
          onClick={onDone}
          aria-label="Skip tour"
          className="absolute top-3 right-3 z-10 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
        >
          <X size={12} />
          Skip
        </button>

        {/* Step counter — top-left */}
        <div className="absolute top-3 left-4 text-xs text-muted-foreground/70 font-medium select-none">
          {step + 1} / {total}
        </div>

        {/* Animated step content */}
        <div className="overflow-hidden px-6 pt-12 pb-6 min-h-[280px] flex flex-col items-center justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="flex flex-col items-center text-center w-full"
            >
              {/* Icon circle */}
              <div
                className="mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-2xl shadow-md"
                style={{
                  background: `${current.color}22`,
                  border: `1.5px solid ${current.color}55`,
                }}
              >
                <Icon size={32} style={{ color: current.color }} />
              </div>

              {/* Title */}
              <h2 className="text-lg font-bold text-foreground mb-2 leading-tight">
                {current.title}
              </h2>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {current.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/40 mx-4" />

        {/* Footer: back + progress dots + next */}
        <div className="flex items-center justify-between px-5 py-4">
          {/* Back button */}
          <button
            onClick={goBack}
            disabled={step === 0}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground disabled:opacity-0 hover:text-foreground transition-colors"
            aria-label="Previous step"
          >
            <ChevronLeft size={16} />
            Back
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 20 : 6,
                  height: 6,
                  background:
                    i === step
                      ? "#8d9d4f"
                      : i < step
                      ? "#8d9d4f66"
                      : "var(--border)",
                }}
              />
            ))}
          </div>

          {/* Next / Done button */}
          <button
            onClick={goNext}
            className="flex items-center gap-1 text-sm font-semibold transition-colors"
            style={{ color: "#8d9d4f" }}
            aria-label={isLast ? "Finish tour" : "Next step"}
          >
            {isLast ? "Done" : "Next"}
            {!isLast && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main UITour component ─────────────────────────────────────────────────────

interface UITourProps {
  /** When true the tour starts. Flip to false to cancel externally. */
  active: boolean;
  /** Called when the user finishes the tour or clicks "Skip". */
  onDone: () => void;
}

export function UITour({ active, onDone }: UITourProps) {
  // Detect mobile: below Tailwind's md breakpoint (768 px)
  const [isMobile, setIsMobile] = useState(false);
  const driverRef = useRef<ReturnType<typeof import("driver.js").driver> | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Desktop driver.js tour ──────────────────────────────────────────────
  useEffect(() => {
    if (!active || isMobile) return;

    import("driver.js").then(({ driver }) => {
      driverRef.current = driver({
        animate: true,
        smoothScroll: true,
        allowClose: false,
        overlayOpacity: 0.55,
        stagePadding: 6,
        stageRadius: 10,
        showProgress: true,
        progressText: "{{current}} of {{total}}",
        nextBtnText: "Next →",
        prevBtnText: "← Back",
        doneBtnText: "Done",
        onDestroyStarted: () => {
          driverRef.current?.destroy();
          onDone();
        },
        steps: DESKTOP_STEPS,
      });

      setTimeout(() => {
        driverRef.current?.drive();
      }, 400);
    });

    return () => {
      driverRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, isMobile]);

  // ── Mobile tour ─────────────────────────────────────────────────────────
  if (active && isMobile) {
    return <MobileTour onDone={onDone} />;
  }

  return null;
}
