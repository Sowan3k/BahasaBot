"use client";

/**
 * NotificationPanel
 *
 * Dropdown panel that lists the last 20 notifications newest-first.
 * Clicking a notification marks it as read.
 * "Mark all as read" button clears the entire unread count.
 */

import { Bell, Check, CheckCheck, Flame, Star, Map, BookOpen, Trophy } from "lucide-react";
import { useCallback } from "react";
import { notificationsApi } from "@/lib/api";
import type { AppNotification } from "@/lib/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Pick an icon based on notification type. */
function NotificationIcon({ type }: { type: string }) {
  const cls = "shrink-0 mt-0.5";
  switch (type) {
    case "streak_milestone":
      return <Flame size={16} className={`${cls} text-orange-500`} />;
    case "xp_milestone":
      return <Star size={16} className={`${cls} text-yellow-500`} />;
    case "journey_reminder":
      return <Map size={16} className={`${cls} text-blue-500`} />;
    case "course_complete":
      return <BookOpen size={16} className={`${cls} text-green-500`} />;
    case "phase_complete":
      return <Trophy size={16} className={`${cls} text-purple-500`} />;
    default:
      return <Bell size={16} className={`${cls} text-muted-foreground`} />;
  }
}

/** Format an ISO date string into a relative label (e.g. "2h ago"). */
function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface NotificationPanelProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}

export function NotificationPanel({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClose,
}: NotificationPanelProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = useCallback(
    async (n: AppNotification) => {
      if (n.read) return;
      try {
        await notificationsApi.markRead(n.id);
        onMarkRead(n.id);
      } catch {
        // silently ignore — UI already updates optimistically on parent
      }
    },
    [onMarkRead]
  );

  const handleMarkAllRead = useCallback(async () => {
    try {
      await notificationsApi.markAllRead();
      onMarkAllRead();
    } catch {
      // silently ignore
    }
  }, [onMarkAllRead]);

  return (
    // Backdrop — click outside to close
    <div className="fixed inset-0 z-[80]" onClick={onClose}>
      {/* Panel — stop propagation so clicking inside doesn't close */}
      <div
        className="absolute right-3 top-16 md:right-4 md:top-4 w-80 bg-card border border-border rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              title="Mark all as read"
            >
              <CheckCheck size={13} />
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
              <Bell size={28} strokeWidth={1.5} />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleMarkRead(n)}
                className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors ${
                  n.read
                    ? "hover:bg-muted/50 opacity-60"
                    : "bg-primary/5 hover:bg-primary/10"
                }`}
              >
                <NotificationIcon type={n.type} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${n.read ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {relativeTime(n.created_at)}
                  </p>
                </div>
                {!n.read && (
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                )}
                {n.read && (
                  <Check size={13} className="mt-1 text-muted-foreground shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
