"use client";

/**
 * NotificationPanel
 *
 * Dropdown panel that slides in below the floating NotificationBell.
 * Fixed position: top-[60px] right-3 on mobile, top-[68px] right-4 on desktop.
 * The `animate-panel-slide` class (defined in globals.css) handles the
 * slide-down + fade-in entrance.
 *
 * Clicking a notification marks it as read (optimistic update in parent).
 * "Mark all as read" button in header clears the entire badge.
 */

import {
  Bell,
  BookOpen,
  Check,
  CheckCheck,
  Flame,
  Map,
  Star,
  Trophy,
} from "lucide-react";
import { useCallback } from "react";
import { notificationsApi } from "@/lib/api";
import type { AppNotification } from "@/lib/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function NotificationIcon({ type }: { type: string }) {
  const cls = "shrink-0 mt-0.5";
  switch (type) {
    case "streak_milestone":
      return <Flame size={15} className={`${cls} text-orange-500`} />;
    case "xp_milestone":
      return <Star size={15} className={`${cls} text-yellow-500`} />;
    case "journey_reminder":
      return <Map size={15} className={`${cls} text-blue-500`} />;
    case "course_complete":
      return <BookOpen size={15} className={`${cls} text-green-500`} />;
    case "phase_complete":
      return <Trophy size={15} className={`${cls} text-purple-500`} />;
    case "bps_milestone":
      return <Trophy size={15} className={`${cls} text-amber-500`} />;
    default:
      return <Bell size={15} className={`${cls} text-muted-foreground`} />;
  }
}

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
      // Optimistic update fires immediately via onMarkRead
      onMarkRead(n.id);
      try {
        await notificationsApi.markRead(n.id);
      } catch {
        // If API fails the optimistic state stays — acceptable for non-critical UX
      }
    },
    [onMarkRead]
  );

  const handleMarkAllRead = useCallback(async () => {
    onMarkAllRead();
    try {
      await notificationsApi.markAllRead();
    } catch {
      // silent
    }
  }, [onMarkAllRead]);

  return (
    /* Invisible full-screen backdrop — click anywhere outside to close */
    <div className="fixed inset-0 z-[80]" onClick={onClose}>
      {/* Panel — stop propagation so inside clicks don't close it */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={[
          // Positioning: just below the bell button on all screen sizes
          "fixed right-3 top-[60px] md:right-5 md:top-[68px]",
          "z-[81]",
          "w-80",
          // Surface
          "bg-card border border-border",
          "rounded-2xl",
          "shadow-xl shadow-black/15",
          "backdrop-blur-sm",
          "overflow-hidden",
          // Entrance animation
          "animate-panel-slide",
        ].join(" ")}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-primary" />
            <span className="text-sm font-semibold tracking-tight">Notifications</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold leading-none">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
              title="Mark all as read"
            >
              <CheckCheck size={12} />
              Mark all read
            </button>
          )}
        </div>

        {/* ── List ── */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-border/50">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                <Bell size={22} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs opacity-70">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n, i) => (
              <button
                key={n.id}
                onClick={() => handleMarkRead(n)}
                style={{ animationDelay: `${i * 30}ms` }}
                className={[
                  "w-full text-left flex items-start gap-3 px-4 py-3",
                  "transition-colors duration-150",
                  n.read
                    ? "hover:bg-muted/40 opacity-55"
                    : "bg-primary/[0.04] hover:bg-primary/[0.09]",
                ].join(" ")}
              >
                {/* Type icon */}
                <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  n.read ? "bg-muted/60" : "bg-primary/10"
                }`}>
                  <NotificationIcon type={n.type} />
                </div>

                {/* Message + time + optional milestone image */}
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] leading-snug ${
                    n.read ? "text-muted-foreground font-normal" : "text-foreground font-medium"
                  }`}>
                    {n.message}
                  </p>
                  {n.image_url && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={n.image_url}
                      alt="Achievement card"
                      className="mt-2 w-full max-w-[180px] rounded-lg object-cover shadow-sm"
                    />
                  )}
                  <p className="text-[11px] text-muted-foreground mt-0.5 opacity-80">
                    {relativeTime(n.created_at)}
                  </p>
                </div>

                {/* Read indicator */}
                <div className="mt-1.5 shrink-0">
                  {n.read ? (
                    <Check size={12} className="text-muted-foreground/50" />
                  ) : (
                    <span className="block w-2 h-2 rounded-full bg-primary shadow-sm shadow-primary/40" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* ── Footer tip ── */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-t border-border/40 text-center">
            <p className="text-[10px] text-muted-foreground/60">
              Showing last {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
