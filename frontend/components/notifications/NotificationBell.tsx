"use client";

/**
 * NotificationBell — inline notification trigger.
 *
 * Uses React Query for fetching + polling. React Query automatically
 * deduplicates the ["notifications"] query across both mounted instances
 * (mobile header + desktop sidebar), so only ONE /api/notifications/ call
 * fires per poll interval regardless of how many bells are mounted.
 *
 * Props:
 *   panelSide — "left" (sidebar placement) | "right" (top-right placement, default)
 */

import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getNotifications().then((r) => r.data),
    enabled: status === "authenticated",
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: 30_000,
  });

  const items: AppNotification[] = data?.notifications ?? [];

  // ── Handle mark-read callbacks from popover ───────────────────────────────

  const handleChange = useCallback(
    async (updated: NotificationItem[]) => {
      // Optimistically update cache so the UI responds immediately
      queryClient.setQueryData<typeof data>(["notifications"], (old) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.map((n) => {
            const match = updated.find((u) => u.id === n.id);
            return match ? { ...n, read: match.read } : n;
          }),
        };
      });

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
    [items, queryClient]
  );

  // ── Clear all ─────────────────────────────────────────────────────────────

  const handleClearAll = useCallback(async () => {
    await notificationsApi.clearAll();
    queryClient.setQueryData(["notifications"], (old: typeof data) =>
      old ? { ...old, notifications: [] } : old
    );
  }, [queryClient]);

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
