"use client";

// Single shared layout for ALL authenticated pages (dashboard, courses, quiz, chatbot).
// The sidebar is rendered ONCE here — never in individual pages.
// main is flex-col so flex-1 children (like the chatbot page) can fill the available height.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

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
import { useQuery } from "@tanstack/react-query";
import { AppSidebar } from "@/components/nav/AppSidebar";
import { CourseGenerationProvider } from "@/lib/course-generation-context";
import { CourseGenerationProgress } from "@/components/courses/CourseGenerationProgress";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
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

// ── Main layout ───────────────────────────────────────────────────────────────

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Prefetch all main sidebar routes on layout mount so their JS chunks
  // are already cached when the user clicks a nav link.
  useEffect(() => {
    PREFETCH_ROUTES.forEach((route) => router.prefetch(route));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stable reference so OnboardingChecker's useEffect does not re-fire
  // when MainLayout re-renders for unrelated reasons.
  const handleShowOnboarding = useCallback(() => setShowOnboarding(true), []);
  const handleOnboardingComplete = useCallback(() => setShowOnboarding(false), []);

  return (
    <CourseGenerationProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <SessionWatcher />
        <OnboardingChecker onShowModal={handleShowOnboarding} />
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
      </div>
    </CourseGenerationProvider>
  );
}
