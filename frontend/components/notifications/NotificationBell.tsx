"use client";

/**
 * NotificationBell — inline notification trigger.
 *
 * Owns data fetching + polling.
 * Renders <NotificationPopover> — caller controls positioning via the wrapper.
 *
 * Props:
 *   panelSide — "left" (sidebar placement) | "right" (top-right placement, default)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { notificationsApi } from "@/lib/api";
import type { AppNotification } from "@/lib/types";
import { NotificationPopover, type NotificationItem } from "@/components/ui/notification-popover";

const POLL_INTERVAL_MS = 60_000;

/** Map BahasaBot AppNotification → NotificationItem shape used by the popover UI. */
function toPopoverItem(n: AppNotification): NotificationItem {
  const titleMap: Record<string, string> = {
    streak_milestone: "Streak Milestone",
    xp_milestone:     "XP Milestone",
    bps_milestone:    "Level Up!",
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

interface NotificationBellProps {
  /** Which horizontal side the panel anchors to. */
  panelSide?: "left" | "right";
  /** "down" (default) = panel opens below; "up" = panel opens above (use for footer bells). */
  panelDirection?: "down" | "up";
}

export function NotificationBell({ panelSide = "left", panelDirection = "down" }: NotificationBellProps) {
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
        try { await notificationsApi.markAllRead(); } catch { /* silent */ }
      } else {
        await Promise.allSettled(
          justMarked.map((id) => notificationsApi.markRead(id))
        );
      }
    },
    [items]
  );

  // ── Clear all ─────────────────────────────────────────────────────────────

  const handleClearAll = useCallback(async () => {
    await notificationsApi.clearAll(); // let error propagate — popover's try/catch handles it
    setItems([]);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  if (status !== "authenticated") return null;

  return (
    <NotificationPopover
      notifications={items.map(toPopoverItem)}
      onNotificationsChange={handleChange}
      onClearAll={handleClearAll}
      panelSide={panelSide}
      panelDirection={panelDirection}
    />
  );
}
