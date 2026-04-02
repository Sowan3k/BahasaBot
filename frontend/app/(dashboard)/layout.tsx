"use client";

// Single shared layout for ALL authenticated pages (dashboard, courses, quiz, chatbot).
// The sidebar is rendered ONCE here — never in individual pages.
// main is flex-col so flex-1 children (like the chatbot page) can fill the available height.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { AppSidebar } from "@/components/nav/AppSidebar";
import { CourseGenerationProvider } from "@/lib/course-generation-context";
import { CourseGenerationProgress } from "@/components/courses/CourseGenerationProgress";

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

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <CourseGenerationProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <SessionWatcher />
        <AppSidebar />
        {/* flex-col allows flex-1 children (chatbot) to fill height; overflow-y-auto scrolls regular pages */}
        <main className="flex-1 min-w-0 overflow-y-auto flex flex-col pt-14 md:pt-0">
          {children}
        </main>
        {/* Floating progress card — overlays all pages while a course generates */}
        <CourseGenerationProgress />
      </div>
    </CourseGenerationProvider>
  );
}
