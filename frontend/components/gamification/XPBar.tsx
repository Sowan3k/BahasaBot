"use client";

/**
 * XPBar — shows total XP and a progress bar toward the next 100-XP milestone.
 *
 * Usage:
 *   <XPBar xpTotal={240} />
 *
 * Example: 240 XP → next milestone 300 XP → 40% filled bar.
 */

import { Star } from "lucide-react";

interface Props {
  xpTotal: number;
}

export default function XPBar({ xpTotal }: Props) {
  // Which 100-XP band are we in?
  const prevMilestone = Math.floor(xpTotal / 100) * 100;
  const nextMilestone = prevMilestone + 100;
  const progressPct = ((xpTotal - prevMilestone) / 100) * 100;

  return (
    <div className="space-y-1 w-full">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Star size={13} className="text-yellow-500" aria-hidden />
          <span className="text-xs font-semibold tabular-nums">{xpTotal} XP</span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          /{nextMilestone}
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-yellow-500 transition-all duration-500"
          style={{ width: `${Math.min(progressPct, 100)}%` }}
        />
      </div>
    </div>
  );
}
