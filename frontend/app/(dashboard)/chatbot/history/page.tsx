"use client";

/**
 * Chat History Page — /chatbot/history
 *
 * Two-panel flow:
 *  1. List view  — shows all past chat sessions via ChatHistoryList
 *  2. Detail view — when ?session=<id> is in the URL, loads and displays that
 *     session's messages in read-only format using the ChatMessage component.
 *
 * Navigation between list and detail uses URL search params so the browser
 * Back button works naturally.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import ChatHistoryList from "@/components/chatbot/ChatHistoryList";
import ChatMessage from "@/components/chatbot/ChatMessage";
import { chatbotApi } from "@/lib/api";

export default function ChatHistoryPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSessionId = searchParams.get("session");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Auto-scroll to bottom when session detail loads
  useEffect(() => {
    if (selectedSessionId) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedSessionId]);

  function handleSelectSession(id: string) {
    router.push(`/chatbot/history?session=${id}`);
  }

  function handleBackToList() {
    router.push("/chatbot/history");
  }

  // If the currently-viewed session was deleted, go back to the list
  function handleSessionDeleted(deletedId: string) {
    if (selectedSessionId === deletedId) {
      router.push("/chatbot/history");
    }
  }

  if (status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background">
      {/* ── Header ── */}
      <header className="flex items-center gap-3 px-4 py-3 bg-card border-b shrink-0">
        {selectedSessionId ? (
          <button
            onClick={handleBackToList}
            className="flex items-center gap-1.5 text-sm text-muted-foreground
                       hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to history
          </button>
        ) : (
          <>
            <Link
              href="/chatbot"
              className="flex items-center gap-1.5 text-sm text-muted-foreground
                         hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              AI Tutor
            </Link>
            <span className="text-muted-foreground/40 select-none">|</span>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <h1 className="text-sm font-semibold">Chat History</h1>
            </div>
          </>
        )}
      </header>

      {/* ── Body ── */}
      <main className="flex-1 overflow-y-auto min-h-0 px-4 py-4 max-w-3xl w-full mx-auto">
        {selectedSessionId ? (
          <SessionDetail
            sessionId={selectedSessionId}
            bottomRef={bottomRef}
          />
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              Your past conversations with the AI Tutor. Click any session to read it.
            </p>
            <ChatHistoryList
              onSelectSession={handleSelectSession}
              onSessionDeleted={handleSessionDeleted}
            />
          </>
        )}
      </main>
    </div>
  );
}

// ── Session Detail ──────────────────────────────────────────────────────────────

interface SessionDetailProps {
  sessionId: string;
  bottomRef: React.RefObject<HTMLDivElement>;
}

function SessionDetail({ sessionId, bottomRef }: SessionDetailProps) {
  const [page, setPage] = useState(1);
  const limit = 100; // Load up to 100 messages per page (sessions are rarely this long)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["chatbot-history", sessionId, page],
    queryFn: () =>
      chatbotApi.getHistory(sessionId, page, limit).then((r) => r.data),
    staleTime: 60_000,
  });

  useEffect(() => {
    // Scroll to bottom after messages load
    if (data && !isLoading) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [data, isLoading, bottomRef]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 mt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-14 rounded-xl bg-muted/50 animate-pulse ${
              i % 2 === 0 ? "ml-auto w-3/4" : "w-3/4"
            }`}
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-8 text-center text-muted-foreground text-sm">
        Failed to load this conversation. Please try again.
      </div>
    );
  }

  if (!data || data.messages.length === 0) {
    return (
      <div className="mt-16 text-center text-muted-foreground text-sm">
        This conversation has no messages.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Read-only badge */}
      <div className="flex justify-center mb-4">
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          Read-only — past conversation
        </span>
      </div>

      {/* Messages */}
      {data.messages.map((msg) => (
        <ChatMessage
          key={msg.id}
          role={msg.role as "user" | "assistant"}
          content={msg.content}
          isStreaming={false}
        />
      ))}

      {/* Load more if paginated */}
      {data.total > page * limit && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="text-sm text-primary hover:underline"
          >
            Load older messages
          </button>
        </div>
      )}

      <div ref={bottomRef} className="h-4" />
    </div>
  );
}
