"use client";

// Shared layout for all dashboard/course/quiz pages.
// Sidebar navigation is provided by the AppSidebar component (supports collapse toggle).

import { AppSidebar } from "@/components/nav/AppSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      {/* Page content — overflow-auto lets each page scroll independently */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
