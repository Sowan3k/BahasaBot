"use client";

// Layout for the chatbot page.
// Uses h-screen + overflow-hidden so the chat interface fills exactly the viewport
// and the message list scrolls internally — the page itself never scrolls.
// The sidebar is provided by AppSidebar (same component as the dashboard layout).

import { AppSidebar } from "@/components/nav/AppSidebar";

export default function ChatbotLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar />
      {/* flex flex-col so the chatbot page (flex-1) can fill the height */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
