"use client";

/**
 * ChatHistoryList
 *
 * Renders a paginated list of the user's past chat sessions.
 * Each row shows:
 *  - Session title (first user message, truncated to 60 chars, or "Untitled conversation")
 *  - Relative/formatted date
 *  - Message count badge
 *  - Trash icon that opens an inline confirmation before deleting
 *
 * Delete behaviour:
 *  - Only the conversation log is deleted (session + messages).
 *  - Vocabulary and grammar words extracted from the session are kept —
 *    they represent real learning and are still used by the dashboard,
 *    spelling game, and adaptive quiz.
 *
 * Clicking a row (anywhere except the delete button) calls onSelectSession(id).
 */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { chatbotApi } from "@/lib/api";
import type { ChatSessionSummary } from "@/lib/types";

interface ChatHistoryListProps {
  onSelectSession: (sessionId: string) => void;
  /** Called after a session is successfully deleted — lets the parent clear its state */
  onSessionDeleted?: (sessionId: string) => void;
}

/** Format an ISO date string into a human-readable label. */
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

export default function ChatHistoryList({
  onSelectSession,
  onSessionDeleted,
}: ChatHistoryListProps) {
  const [page, setPage] = useState(1);
  // ID of the session showing the inline confirm prompt
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  // IDs currently being deleted (shows spinner)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  // Error message shown briefly when a delete fails
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const limit = 15;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["chatbot-sessions", page],
    queryFn: () => chatbotApi.getSessions(page, limit).then((r) => r.data),
    staleTime: 30_000,
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  async function handleDelete(sessionId: string) {
    setDeletingIds((prev) => new Set(prev).add(sessionId));
    setConfirmingId(null);
    try {
      await chatbotApi.deleteSession(sessionId);
      // Invalidate all pages of the session list so the list re-fetches
      queryClient.invalidateQueries({ queryKey: ["chatbot-sessions"] });
      onSessionDeleted?.(sessionId);
    } catch (err) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      const msg = detail ?? "Failed to delete conversation. Please try again.";
      setDeleteError(msg);
      setTimeout(() => setDeleteError(null), 4000);
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 mt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-8 text-center text-muted-foreground text-sm">
        Failed to load chat history. Please try again.
      </div>
    );
  }

  if (!data || data.sessions.length === 0) {
    return (
      <div className="mt-16 flex flex-col items-center gap-3 text-muted-foreground">
        <MessageSquare className="w-10 h-10 opacity-30" />
        <p className="text-sm">No conversations yet.</p>
        <p className="text-xs">Start a chat with your AI Tutor to see your history here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {/* Delete error banner — auto-dismisses after 4 s */}
      {deleteError && (
        <div className="mb-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20
                        text-xs text-destructive flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          {deleteError}
        </div>
      )}

      {data.sessions.map((session: ChatSessionSummary) => {
        const isConfirming = confirmingId === session.id;
        const isDeleting = deletingIds.has(session.id);

        return (
          <div
            key={session.id}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            {/* ── Main row ── */}
            <div className="flex items-stretch">
              {/* Clickable area — opens detail view */}
              <button
                onClick={() => {
                  if (isConfirming) setConfirmingId(null);
                  else onSelectSession(session.id);
                }}
                disabled={isDeleting}
                className="flex-1 text-left px-4 py-3 hover:bg-muted/60 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground truncate flex-1 leading-snug">
                    {session.title ?? "Untitled conversation"}
                  </p>
                  <span className="flex-shrink-0 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {session.message_count} msg{session.message_count !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(session.created_at)}
                  </span>
                </div>
              </button>

              {/* Delete trigger button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmingId(isConfirming ? null : session.id);
                }}
                disabled={isDeleting}
                aria-label="Delete conversation"
                className="px-3 flex items-center text-muted-foreground hover:text-destructive
                           hover:bg-destructive/10 transition-colors border-l border-border
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* ── Inline confirmation strip ── */}
            {isConfirming && (
              <div className="px-4 py-3 bg-destructive/5 border-t border-destructive/20
                              flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">
                    Delete this conversation?
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    The chat log will be removed. Vocabulary and grammar words you learned
                    from it are kept in your dashboard.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleDelete(session.id)}
                      className="text-xs px-3 py-1 rounded-lg bg-destructive text-destructive-foreground
                                 hover:bg-destructive/90 transition-colors font-medium"
                    >
                      Yes, delete
                    </button>
                    <button
                      onClick={() => setConfirmingId(null)}
                      className="text-xs px-3 py-1 rounded-lg border text-muted-foreground
                                 hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 text-sm text-muted-foreground
                       hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 text-sm text-muted-foreground
                       hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
