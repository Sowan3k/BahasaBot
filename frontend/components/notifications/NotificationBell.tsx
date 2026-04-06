"use client";

/**
 * NotificationBell — global floating wrapper (fixed top-right, all screens)
 *
 * This component owns data fetching and polling.
 * All visual rendering is delegated to <NotificationPopover> from /components/ui/.
 *
 * Positioning:
 *   Mobile (< md): top-3 right-14  — beside the ThemeToggle in the mobile header
 *   Desktop (md+): top-5 right-5   — floating above the main content area
 *   z-[55] — above the mobile header (z-50), below the mobile drawer (z-[70])
 *
 * The NotificationPopover renders its panel as `absolute right-0 mt-3` relative
 * to this fixed container, so no additional positioning needed on the panel.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { notificationsApi } from "@/lib/api";
import type { AppNotification } from "@/lib/types";
import { NotificationPopover, type NotificationItem } from "@/components/ui/notification-popover";

const POLL_INTERVAL_MS = 60_000;

/** Map BahasaBot AppNotification → NotificationItem shape used by the popover UI. */
function toPopoverItem(n: AppNotification): NotificationItem {
  // Derive a human-friendly title from the notification type
  const titleMap: Record<string, string> = {
    streak_milestone: "Streak Milestone",
    xp_milestone:     "XP Milestone",
    journey_reminder: "Journey Reminder",
    course_complete:  "Course Ready",
    phase_complete:   "Phase Complete",
  };
  return {
    id:          n.id,
    title:       titleMap[n.type] ?? "Notification",
    description: n.message,
    timestamp:   new Date(n.created_at),
    type:        n.type,
    read:        n.read,
  };
}

export function NotificationBell() {
  const { status } = useSession();
  const [items, setItems] = useState<AppNotification[]>([]);
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationsApi.getNotifications();
      setItems(res.data.notifications);
    } catch {
      // Silent — bell just won't refresh
    }
  }, []);

  // ── Start polling ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchNotifications();
    pollerRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => { if (pollerRef.current) clearInterval(pollerRef.current); };
  }, [status, fetchNotifications]);

  // ── Handle mark-read callbacks from popover ───────────────────────────────

  const handleChange = useCallback(
    async (updated: NotificationItem[]) => {
      // Sync local state back to AppNotification shape
      setItems((prev) =>
        prev.map((n) => {
          const match = updated.find((u) => u.id === n.id);
          return match ? { ...n, read: match.read } : n;
        })
      );

      // Determine which IDs just became read and call the API
      const nowRead = updated.filter((u) => u.read).map((u) => u.id);
      const wasUnread = items.filter((n) => !n.read).map((n) => n.id);
      const justMarked = wasUnread.filter((id) => nowRead.includes(id));

      if (justMarked.length === wasUnread.length && justMarked.length > 1) {
        // All were marked — use mark-all-read endpoint
        try { await notificationsApi.markAllRead(); } catch { /* silent */ }
      } else {
        // Individual marks
        await Promise.allSettled(
          justMarked.map((id) => notificationsApi.markRead(id))
        );
      }
    },
    [items]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  if (status !== "authenticated") return null;

  return (
    /* Fixed container — the popover panel is absolute relative to this */
    <div className="fixed top-3 right-14 md:top-5 md:right-5 z-[55]">
      <NotificationPopover
        notifications={items.map(toPopoverItem)}
        onNotificationsChange={handleChange}
      />
    </div>
  );
}
