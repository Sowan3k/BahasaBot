"use client";

/**
 * StreakBadge — shows the user's current learning streak.
 *
 * Usage:
 *   <StreakBadge count={7} />
 *   <StreakBadge count={7} size="sm" />
 *
 * Sizes:
 *   sm — compact, for sidebar footer (collapsed state)
 *   md — default, for sidebar expanded / dashboard
 */

import { Flame } from "lucide-react";

interface Props {
  count: number;
  /** "sm" for compact sidebar; "md" (default) for dashboard cards */
  size?: "sm" | "md";
}

export default function StreakBadge({ count, size = "md" }: Props) {
  const iconSize = size === "sm" ? 14 : 16;
  const textClass =
    size === "sm"
      ? "text-xs font-bold tabular-nums leading-none"
      : "text-sm font-bold tabular-nums";

  return (
    <div className="flex items-center gap-1" title={`${count}-day streak`}>
      <Flame
        size={iconSize}
        className={count > 0 ? "text-orange-500" : "text-muted-foreground"}
        aria-hidden
      />
      <span className={textClass}>{count}</span>
    </div>
  );
}
