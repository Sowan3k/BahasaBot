"use client";

/**
 * NotificationBell
 *
 * Bell icon button that shows an unread-count badge.
 * Clicking it toggles the NotificationPanel dropdown.
 *
 * Polling: refreshes every 60 seconds while mounted so the badge
 * stays current without requiring a page reload.
 */

import { Bell } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { notificationsApi } from "@/lib/api";
import type { AppNotification } from "@/lib/types";
import { NotificationPanel } from "./NotificationPanel";

const POLL_INTERVAL_MS = 60_000; // 1 minute

export function NotificationBell() {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch notifications ─────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationsApi.getNotifications();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unread_count);
    } catch {
      // Silently fail — the bell just won't update if the request fails
    }
  }, []);

  // ── Start/stop polling based on auth state ──────────────────────────────────

  useEffect(() => {
    if (status !== "authenticated") return;

    // Initial fetch
    fetchNotifications();

    // Poll every minute to keep badge fresh
    pollerRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS);

    return () => {
      if (pollerRef.current) clearInterval(pollerRef.current);
    };
  }, [status, fetchNotifications]);

  // ── Refresh when panel opens ────────────────────────────────────────────────

  const handleOpen = useCallback(() => {
    setOpen((prev) => {
      if (!prev) fetchNotifications(); // refresh on open
      return !prev;
    });
  }, [fetchNotifications]);

  // ── Mark-read callbacks (optimistic update in local state) ──────────────────

  const handleMarkRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (status !== "authenticated") return null;

  return (
    <>
      <button
        onClick={handleOpen}
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ""}`}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Bell size={18} />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

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
