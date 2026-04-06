"use client";

/**
 * NotificationBell — global floating button (fixed top-right, all screens)
 *
 * Sits at z-[55] — above the mobile header (z-50) but below the mobile drawer (z-[70]).
 * On mobile (< md): positioned at top-3 right-14 to sit beside the ThemeToggle in the header.
 * On desktop (md+): top-5 right-5, floating above the main content area.
 *
 * Animations:
 *  • bell-ring  — icon swings when unread count is > 0 (fires on mount + each new unread)
 *  • bell-glow  — soft pulsing ring on the button when unread > 0
 *  • badge-pop  — badge scales in with a spring when it first appears
 *  • ping       — Tailwind animate-ping on a ghost circle behind the badge
 *  • panel-slide — panel slides + fades in on open (handled in NotificationPanel)
 *  • active:scale-90 — button squishes on click
 *  • hover:scale-105  — gentle lift on hover
 */

import { Bell } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { notificationsApi } from "@/lib/api";
import type { AppNotification } from "@/lib/types";
import { NotificationPanel } from "./NotificationPanel";

const POLL_INTERVAL_MS = 60_000;

export function NotificationBell() {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Track previous unread so we can re-trigger the ring animation on new notifications
  const prevUnread = useRef(0);
  const [ringKey, setRingKey] = useState(0);
  const [badgeKey, setBadgeKey] = useState(0);

  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationsApi.getNotifications();
      const { notifications: items, unread_count } = res.data;
      setNotifications(items);
      setUnreadCount(unread_count);

      // Re-trigger ring animation whenever unread count increases
      if (unread_count > prevUnread.current) {
        setRingKey((k) => k + 1);
        if (prevUnread.current === 0) setBadgeKey((k) => k + 1);
      }
      prevUnread.current = unread_count;
    } catch {
      // Silently fail — badge just won't update
    }
  }, []);

  // ── Polling ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchNotifications();
    pollerRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => { if (pollerRef.current) clearInterval(pollerRef.current); };
  }, [status, fetchNotifications]);

  // ── Open / close ────────────────────────────────────────────────────────────

  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      if (!prev) fetchNotifications();
      return !prev;
    });
  }, [fetchNotifications]);

  // ── Optimistic mark-read ────────────────────────────────────────────────────

  const handleMarkRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((prev) => {
      const next = Math.max(0, prev - 1);
      prevUnread.current = next;
      return next;
    });
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    prevUnread.current = 0;
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (status !== "authenticated") return null;

  const hasUnread = unreadCount > 0;

  return (
    <>
      {/* ── Floating bell button ── */}
      <button
        onClick={handleToggle}
        aria-label={`Notifications${hasUnread ? ` — ${unreadCount} unread` : ""}`}
        className={[
          // Positioning — beside mobile header ThemeToggle; floating top-right on desktop
          "fixed top-3 right-14 md:top-5 md:right-5",
          "z-[55]",
          // Shape & surface
          "w-10 h-10 rounded-full",
          "bg-card/90 dark:bg-card/95",
          "backdrop-blur-sm",
          "border border-border",
          "shadow-md shadow-black/10",
          // Layout
          "flex items-center justify-center",
          // Icon colour
          "text-foreground/70",
          // Interactions
          "transition-all duration-200 ease-out",
          "hover:scale-105 hover:shadow-lg hover:text-primary hover:border-primary/50",
          "active:scale-90 active:shadow-sm",
          // Glow pulse when there are unread notifications
          hasUnread ? "animate-bell-glow" : "",
        ].filter(Boolean).join(" ")}
      >
        {/* Bell icon — re-keyed to replay ring animation on new notifications */}
        <Bell
          key={ringKey}
          size={18}
          strokeWidth={2}
          className={hasUnread ? "animate-bell-ring" : ""}
          style={{ transformOrigin: "top center" }}
        />

        {/* Unread badge */}
        {hasUnread && (
          <span
            key={`badge-${badgeKey}`}
            className="absolute -top-1 -right-1 flex items-center justify-center animate-badge-pop"
          >
            {/* Ping ghost ring — disappears after one cycle */}
            <span className="absolute w-full h-full rounded-full bg-primary opacity-60 animate-ping" />
            {/* Solid badge */}
            <span className="relative min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center leading-none shadow-sm">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* ── Notification panel ── */}
      {open && (
        <NotificationPanel
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
