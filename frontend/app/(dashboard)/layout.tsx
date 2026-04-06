"use client";

// Single shared layout for ALL authenticated pages (dashboard, courses, quiz, chatbot).
// The sidebar is rendered ONCE here — never in individual pages.
// main is flex-col so flex-1 children (like the chatbot page) can fill the available height.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { AppSidebar } from "@/components/nav/AppSidebar";
import { CourseGenerationProvider } from "@/lib/course-generation-context";
import { CourseGenerationProgress } from "@/components/courses/CourseGenerationProgress";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { NotificationBell } from "@/components/notifications/NotificationBell";
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
 * Fetches the user profile once after the session is authenticated and
 * signals the parent layout to show the onboarding modal if
 * onboarding_completed === false.
 *
 * Uses a ref flag so the check only fires once per mount, even if
 * the session object re-renders (e.g., during token refresh).
 */
function OnboardingChecker({ onShowModal }: { onShowModal: () => void }) {
  const { status } = useSession();
  const hasChecked = useRef(false);

  useEffect(() => {
    // Only run once and only after session is confirmed authenticated.
    // The JWT is attached to API requests via the apiClient interceptor,
    // so we must wait until status === "authenticated".
    if (status !== "authenticated" || hasChecked.current) return;
    hasChecked.current = true;

    profileApi
      .getProfile()
      .then((res) => {
        if (!res.data.onboarding_completed) {
          onShowModal();
        }
      })
      .catch(() => {
        // Silently swallow — a failed profile fetch must never block the dashboard.
        // The onboarding will be shown on the next successful session.
      });
  }, [status, onShowModal]);

  return null;
}

// ── Main layout ───────────────────────────────────────────────────────────────

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Stable reference so OnboardingChecker's useEffect does not re-fire
  // when MainLayout re-renders for unrelated reasons.
  const handleShowOnboarding = useCallback(() => setShowOnboarding(true), []);
  const handleOnboardingComplete = useCallback(() => setShowOnboarding(false), []);

  return (
    <CourseGenerationProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <SessionWatcher />
        <OnboardingChecker onShowModal={handleShowOnboarding} />
        <AppSidebar />
        {/* flex-col allows flex-1 children (chatbot) to fill height; overflow-y-auto scrolls regular pages */}
        <main className="flex-1 min-w-0 overflow-y-auto flex flex-col pt-14 md:pt-0">
          {children}
        </main>
        {/* Floating notification bell — fixed top-right on all screen sizes */}
        <NotificationBell />
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
