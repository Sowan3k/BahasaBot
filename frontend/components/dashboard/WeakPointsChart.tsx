"use client";

import Link from "next/link";
import { AlertTriangle, BookOpen, ChevronRight } from "lucide-react";
import type { WeakPointEntry } from "@/lib/types";

interface Props {
  weakPoints: WeakPointEntry[];
}

function scoreStatus(score: number): { label: string; color: string; bar: string; bg: string } {
  if (score < 0.3) return {
    label: "Critical",
    color: "text-red-500",
    bar:   "bg-red-500",
    bg:    "bg-red-500/10 text-red-600 dark:text-red-400",
  };
  if (score < 0.6) return {
    label: "Needs work",
    color: "text-orange-500",
    bar:   "bg-orange-500",
    bg:    "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  };
  return {
    label: "Improving",
    color: "text-primary",
    bar:   "bg-primary",
    bg:    "bg-primary/10 text-primary",
  };
}

export default function WeakPointsChart({ weakPoints }: Props) {
  if (weakPoints.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No weak points yet — complete a quiz to see results.
      </p>
    );
  }

  const critical  = weakPoints.filter((w) => w.strength_score < 0.3).length;
  const needsWork = weakPoints.filter((w) => w.strength_score >= 0.3 && w.strength_score < 0.6).length;

  return (
    <div className="flex flex-col gap-3">

      {/* ── Summary pill row ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {critical > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-3 h-3" />
            {critical} critical
          </span>
        )}
        {needsWork > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400">
            {needsWork} needs work
          </span>
        )}
        {critical === 0 && needsWork === 0 && (
          <span className="text-xs text-muted-foreground">All areas improving</span>
        )}
      </div>

      {/* ── Weak point rows ── */}
      <div className="space-y-0.5">
        {weakPoints.slice(0, 4).map((wp) => {
          const pct = Math.round(wp.strength_score * 100);
          const s   = scoreStatus(wp.strength_score);
          return (
            <div
              key={wp.id}
              className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors"
            >
              {/* Type badge */}
              <span className={`flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${
                wp.type === "vocab"
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
              }`}>
                {wp.type === "vocab" ? "Vocab" : "Grammar"}
              </span>

              {/* Topic + bar */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate leading-tight">{wp.topic}</p>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.bar} transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Score + status */}
              <div className="flex-shrink-0 text-right w-16">
                <p className={`text-sm font-bold tabular-nums leading-tight ${s.color}`}>{pct}%</p>
                <p className={`text-[10px] leading-tight ${s.color} opacity-70`}>{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── CTA ── */}
      <Link
        href="/quiz/adaptive"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline mt-1"
      >
        Practice with adaptive quiz
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
