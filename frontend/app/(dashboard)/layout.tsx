"use client";

// Single shared layout for ALL authenticated pages (dashboard, courses, quiz, chatbot).
// The sidebar is rendered ONCE here — never in individual pages.
// main is flex-col so flex-1 children (like the chatbot page) can fill the available height.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";

// Routes to prefetch as soon as the layout mounts (runs once per session).
// Next.js will download the JS chunk for each route in the background so
// sidebar navigation feels instant instead of waiting for a network fetch.
const PREFETCH_ROUTES = [
  "/chatbot",
  "/dashboard",
  "/courses",
  "/quiz/adaptive",
  "/games/spelling",
  "/settings",
];
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppSidebar } from "@/components/nav/AppSidebar";
import { CourseGenerationProvider } from "@/lib/course-generation-context";
import { CourseGenerationProgress } from "@/components/courses/CourseGenerationProgress";
import { OnboardingModal, type OnboardingResult } from "@/components/onboarding/OnboardingModal";
import { UITour } from "@/components/onboarding/UITour";
import { PageTransition } from "@/components/layout/PageTransition";
import { profileApi } from "@/lib/api";

/**
 * Watches the NextAuth session and auto-logs out when it expires.
 * Runs on every dashboard page (mounted once in the shared layout).
 * Covers two expiry cases:
 *   1. maxAge hit — NextAuth cookie expires → status becomes "unauthenticated"
 *   2. Refresh token expired (7-day limit) → session.error === "RefreshTokenExpired"
 */
function SessionWatcher() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && (session as any)?.error === "RefreshTokenExpired") {
      signOut({ callbackUrl: "/login" });
    }
  }, [status, session, router]);

  return null;
}

/**
 * Checks onboarding_completed from the shared profile query and signals the
 * parent layout to show the onboarding modal if needed.
 *
 * Uses the same query key ["profile"] as AppSidebar — React Query deduplicates
 * the fetch so only one /api/profile/ request is made per staleTime window.
 */
function OnboardingChecker({ onShowModal }: { onShowModal: () => void }) {
  const { status } = useSession();
  const hasTriggered = useRef(false);

  const { data } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.getProfile().then((r) => r.data),
    enabled: status === "authenticated",
    staleTime: 60_000,
  });

  useEffect(() => {
    if (data && !hasTriggered.current && !data.onboarding_completed) {
      hasTriggered.current = true;
      onShowModal();
    }
  }, [data, onShowModal]);

  return null;
}

/**
 * Checks has_seen_tour from the shared profile query.
 * Triggers the tour only after onboarding is dismissed (blocked=true while onboarding is open).
 */
function UITourChecker({
  onShowTour,
  blocked,
}: {
  onShowTour: () => void;
  blocked: boolean;
}) {
  const { status } = useSession();
  const hasTriggered = useRef(false);

  const { data } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.getProfile().then((r) => r.data),
    enabled: status === "authenticated",
    staleTime: 60_000,
  });

  useEffect(() => {
    // Don't trigger while onboarding is still open
    if (blocked) return;
    if (data && !hasTriggered.current && !data.has_seen_tour) {
      hasTriggered.current = true;
      // Brief delay so the main content finishes rendering before driver.js measures elements
      setTimeout(onShowTour, 600);
    }
  }, [data, blocked, onShowTour]);

  return null;
}

// ── Main layout ───────────────────────────────────────────────────────────────

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // Prefetch all main sidebar routes on layout mount so their JS chunks
  // are already cached when the user clicks a nav link.
  useEffect(() => {
    PREFETCH_ROUTES.forEach((route) => router.prefetch(route));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stable reference so OnboardingChecker's useEffect does not re-fire
  // when MainLayout re-renders for unrelated reasons.
  const handleShowOnboarding = useCallback(() => setShowOnboarding(true), []);

  /**
   * Called by OnboardingModal when it finishes or is skipped.
   *   "roadmap_ready" — roadmap was generated; show a toast pointing user to My Journey.
   *   "done"          — skipped or generation failed; just dismiss silently.
   */
  const handleOnboardingComplete = useCallback(
    (result: OnboardingResult) => {
      setShowOnboarding(false);
      // Invalidate profile cache so UITourChecker sees the updated has_seen_tour value
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      if (result === "roadmap_ready") {
        toast.success("Your learning roadmap is ready!", {
          description: "Head to My Journey in the sidebar to see your personalised plan.",
          duration: 6000,
        });
      }
    },
    [queryClient],
  );

  const handleShowTour = useCallback(() => setShowTour(true), []);

  /** Called when the driver.js tour ends (Done or Skip). Saves the flag to DB. */
  const handleTourDone = useCallback(async () => {
    setShowTour(false);
    try {
      await profileApi.updateProfile({ has_seen_tour: true });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch {
      // Non-critical — if the PATCH fails the tour will just show again next time.
      // Acceptable trade-off; no user-visible error needed.
    }
  }, [queryClient]);

  return (
    <CourseGenerationProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <SessionWatcher />
        <OnboardingChecker onShowModal={handleShowOnboarding} />
        <UITourChecker onShowTour={handleShowTour} blocked={showOnboarding} />
        {/* AppSidebar now includes the NotificationBell in the header */}
        <AppSidebar />
        {/* flex-col allows flex-1 children (chatbot) to fill height; overflow-y-auto scrolls regular pages */}
        <main className="flex-1 min-w-0 overflow-y-auto flex flex-col pt-14 md:pt-0">
          {/* PageTransition: keyed by pathname so every navigation triggers fade-in + slide-up */}
          <PageTransition key={pathname} className="flex-1 flex flex-col">
            {children}
          </PageTransition>
        </main>
        {/* Floating progress card — overlays all pages while a course generates */}
        <CourseGenerationProgress />
        {/* Onboarding modal — shown once on first login, dismissed only after completion */}
        {showOnboarding && (
          <OnboardingModal onComplete={handleOnboardingComplete} />
        )}
        {/* UI spotlight tour — shown once after onboarding completes */}
        <UITour active={showTour} onDone={handleTourDone} />
      </div>
    </CourseGenerationProvider>
  );
}
