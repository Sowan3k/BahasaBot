"use client";

// Single shared layout for ALL authenticated pages (dashboard, courses, quiz, chatbot).
// The sidebar is rendered ONCE here — never in individual pages.
// main is flex-col so flex-1 children (like the chatbot page) can fill the available height.

import { AppSidebar } from "@/components/nav/AppSidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      {/* flex-col allows flex-1 children (chatbot) to fill height; overflow-y-auto scrolls regular pages */}
      <main className="flex-1 min-w-0 overflow-y-auto flex flex-col pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
