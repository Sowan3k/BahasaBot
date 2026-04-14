"use client";

/**
 * UITour
 *
 * Driver.js spotlight tour shown once on the user's first dashboard visit
 * (after onboarding completes). Targets key sidebar nav items.
 *
 * Usage in layout.tsx:
 *   <UITour active={showTour} onDone={handleTourDone} />
 *
 * When active changes to true the tour starts immediately. When the user
 * finishes or skips, onDone() is called — the parent patches has_seen_tour=true.
 */

import { useEffect, useRef } from "react";
import "driver.js/dist/driver.css";

interface UITourProps {
  /** When true the tour starts. Flip to false to cancel externally. */
  active: boolean;
  /** Called when the user finishes the tour or clicks "Skip Tour". */
  onDone: () => void;
}

const TOUR_STEPS = [
  {
    element: '[data-tour="sidebar"]',
    popover: {
      title: "Your navigation hub",
      description:
        "Everything you need is in this sidebar. It collapses to icons to give you more screen space — click the arrow on its right edge.",
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

export function UITour({ active, onDone }: UITourProps) {
  const driverRef = useRef<ReturnType<typeof import("driver.js").driver> | null>(null);

  useEffect(() => {
    if (!active) return;

    // Dynamically import driver.js so it only loads when the tour is needed
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
          // Called when user clicks Done or Skip
          driverRef.current?.destroy();
          onDone();
        },
        steps: TOUR_STEPS,
      });

      // Wait one tick so the DOM has settled after navigation
      setTimeout(() => {
        driverRef.current?.drive();
      }, 400);
    });

    return () => {
      driverRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return null;
}
