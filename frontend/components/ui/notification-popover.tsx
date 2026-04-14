"use client";

/**
 * NotificationPopover — BahasaBot UI component
 *
 * Adapted from the notification-popover pattern (framer-motion, shadcn Button).
 * Uses BahasaBot's CSS variable palette so it respects light/dark mode.
 *
 * Props let callers override colours; the defaults match the botanical palette.
 *
 * Usage (see NotificationBell.tsx for the full wired-up version):
 *   <NotificationPopover
 *     notifications={items}
 *     onNotificationsChange={handleChange}
 *   />
 */

import React, { useState } from "react";
import { Bell, BookOpen, Check, CheckCheck, Flame, Map, Star, Trash2, Trophy, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotificationItem = {
  id: string;
  /** Display title — maps to notification type label in BahasaBot */
  title: string;
  /** Body text — maps to notification message in BahasaBot */
  description: string;
  timestamp: Date;
  /** Notification category string (used for icon selection) */
  type?: string;
  read: boolean;
};

// ── Per-type icon ─────────────────────────────────────────────────────────────

function TypeIcon({ type }: { type?: string }) {
  const cls = "shrink-0";
  switch (type) {
    case "streak_milestone": return <Flame     size={13} className={`${cls} text-orange-500`} />;
    case "xp_milestone":     return <Star      size={13} className={`${cls} text-yellow-500`} />;
    case "bps_milestone":    return <TrendingUp size={13} className={`${cls} text-emerald-500`} />;
    case "journey_reminder": return <Map       size={13} className={`${cls} text-blue-500`} />;
    case "course_complete":  return <BookOpen  size={13} className={`${cls} text-green-500`} />;
    case "phase_complete":   return <Trophy    size={13} className={`${cls} text-purple-500`} />;
    default:                 return <Bell    size={13} className={`${cls} text-muted-foreground`} />;
  }
}

// ── Single notification row ───────────────────────────────────────────────────

interface NotificationRowProps {
  notification: NotificationItem;
  index: number;
  onMarkAsRead: (id: string) => void;
}

const NotificationRow = ({ notification, index, onMarkAsRead }: NotificationRowProps) => (
  <motion.div
    initial={{ opacity: 0, x: 16, filter: "blur(6px)" }}
    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
    transition={{ duration: 0.25, delay: index * 0.07 }}
    className={cn(
      "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors duration-150",
      notification.read
        ? "opacity-55 hover:bg-muted/40"
        : "bg-primary/[0.04] hover:bg-primary/[0.09]"
    )}
    onClick={() => onMarkAsRead(notification.id)}
  >
    {/* Icon circle */}
    <div className={cn(
      "mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0",
      notification.read ? "bg-muted/60" : "bg-primary/10"
    )}>
      <TypeIcon type={notification.type} />
    </div>

    {/* Text */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className={cn(
          "text-[13px] leading-snug truncate",
          notification.read ? "text-muted-foreground font-normal" : "text-foreground font-semibold"
        )}>
          {notification.title}
        </p>
        <span className="text-[10px] text-muted-foreground/70 shrink-0">
          {notification.timestamp.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
      </div>
      <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">
        {notification.description}
      </p>
    </div>

    {/* Read dot / check */}
    <div className="mt-1.5 shrink-0">
      {notification.read
        ? <Check size={11} className="text-muted-foreground/40" />
        : <span className="block w-2 h-2 rounded-full bg-primary shadow-sm shadow-primary/30" />
      }
    </div>
  </motion.div>
);

// ── List ──────────────────────────────────────────────────────────────────────

interface NotificationListProps {
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
}

const NotificationList = ({ notifications, onMarkAsRead }: NotificationListProps) => (
  <div className="divide-y divide-border/50">
    {notifications.map((n, i) => (
      <NotificationRow
        key={n.id}
        notification={n}
        index={i}
        onMarkAsRead={onMarkAsRead}
      />
    ))}
  </div>
);

// ── Main popover ──────────────────────────────────────────────────────────────

export interface NotificationPopoverProps {
  notifications?: NotificationItem[];
  onNotificationsChange?: (notifications: NotificationItem[]) => void;
  /** Called when the user clicks "Clear all" — parent should delete from API */
  onClearAll?: () => Promise<void>;
  /** Extra classes on the trigger button */
  buttonClassName?: string;
  /** Extra classes on the popover panel */
  popoverClassName?: string;
  /**
   * Which horizontal side the panel anchors to.
   * "right" → left-0  (panel extends right, for left-side triggers)
   * "left"  → right-0 (panel extends left, for right-side triggers)
   */
  panelSide?: "left" | "right";
  /**
   * Which vertical direction the panel opens.
   * "down" → below the trigger (default, for header/top placements)
   * "up"   → above the trigger (for footer/bottom placements)
   */
  panelDirection?: "down" | "up";
}

export const NotificationPopover = ({
  notifications: initialNotifications = [],
  onNotificationsChange,
  onClearAll,
  buttonClassName,
  popoverClassName,
  panelSide = "left",
  panelDirection = "down",
}: NotificationPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  // Sync when parent passes a new array (e.g. after polling)
  React.useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    onNotificationsChange?.(updated);
  };

  const handleClearAll = async () => {
    if (!onClearAll) return;
    setClearing(true);
    try {
      await onClearAll();
      setNotifications([]);
      onNotificationsChange?.([]);
    } catch {
      // API failed — notifications stay, user can retry; error is already logged server-side
    } finally {
      setClearing(false);
    }
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map((n) => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    onNotificationsChange?.(updated);
  };

  return (
    <div className="relative">
      {/* ── Bell trigger button ── */}
      <Button
        onClick={() => setIsOpen((v) => !v)}
        size="icon"
        className={cn(
          // Floating pill style — backdrop blur, BahasaBot card colours
          "relative w-10 h-10 rounded-full",
          "bg-card/90 hover:bg-card dark:bg-card/95",
          "backdrop-blur-sm",
          "border border-border",
          "shadow-md hover:shadow-lg",
          "text-foreground/70 hover:text-primary",
          "transition-all duration-200 ease-out",
          "hover:scale-105 active:scale-90 active:shadow-sm",
          // Glow ring when unread
          unreadCount > 0 ? "animate-bell-glow" : "",
          buttonClassName
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ""}`}
      >
        {/* Icon — re-key triggers bell-ring animation on new notifications */}
        <Bell
          size={17}
          strokeWidth={2}
          className={unreadCount > 0 ? "animate-bell-ring" : ""}
          style={{ transformOrigin: "top center" }}
        />

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center animate-badge-pop">
            <span className="absolute w-full h-full rounded-full bg-primary opacity-60 animate-ping" />
            <span className="relative min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center leading-none shadow-sm">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </span>
        )}
      </Button>

      {/* ── Popover panel ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Click-outside backdrop (invisible, z below panel) */}
            <motion.div
              className="fixed inset-0 z-[79]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "absolute w-80 z-[80]",
                panelDirection === "up" ? "bottom-full mb-3" : "top-full mt-3",
                panelSide === "right" ? "left-0" : "right-0",
                "bg-card/95 backdrop-blur-md",
                "border border-border",
                "rounded-2xl",
                "shadow-xl shadow-black/15",
                "overflow-hidden",
                popoverClassName
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Bell size={13} className="text-primary" />
                  <h3 className="text-sm font-semibold tracking-tight">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold leading-none">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <Button
                      onClick={markAllAsRead}
                      variant="ghost"
                      size="sm"
                      className="h-auto py-1 px-2 text-[11px] text-muted-foreground hover:text-primary gap-1"
                    >
                      <CheckCheck size={11} />
                      Mark all read
                    </Button>
                  )}
                  {notifications.length > 0 && onClearAll && (
                    <Button
                      onClick={handleClearAll}
                      disabled={clearing}
                      variant="ghost"
                      size="sm"
                      className="h-auto py-1 px-2 text-[11px] text-muted-foreground hover:text-destructive gap-1"
                      title="Clear all notifications"
                    >
                      <Trash2 size={11} />
                      {clearing ? "…" : "Clear all"}
                    </Button>
                  )}
                </div>
              </div>

              {/* List or empty state */}
              <div className="max-h-[360px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                      <Bell size={22} strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-medium">All caught up!</p>
                    <p className="text-xs opacity-60">No notifications yet</p>
                  </div>
                ) : (
                  <NotificationList
                    notifications={notifications}
                    onMarkAsRead={markAsRead}
                  />
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-2 border-t border-border/40 text-center">
                  <p className="text-[10px] text-muted-foreground/50">
                    Showing last {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
