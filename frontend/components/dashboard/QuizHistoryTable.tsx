"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { QuizHistoryEntry } from "@/lib/types";

interface Props {
  items: QuizHistoryEntry[];
  total: number;
  onPageChange?: (page: number) => void;
  page?: number;
  limit?: number;
  loading?: boolean;
}

/** Relative time label for dates within 7 days, absolute otherwise. */
function formatDate(iso: string): string {
  const d    = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60)   return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)    return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)    return `${days}d ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function scoreStyle(pct: number): { ring: string; text: string } {
  if (pct >= 70) return { ring: "border-emerald-500", text: "text-emerald-500" };
  if (pct >= 50) return { ring: "border-yellow-500",  text: "text-yellow-500"  };
  return           { ring: "border-red-500",           text: "text-red-500"    };
}

/** Trend across last 3 attempts (requires ≥ 2 items, newest first). */
function trendIcon(items: QuizHistoryEntry[]) {
  if (items.length < 2) return null;
  const recent = items[0].score_percent;
  const prev   = items[1].score_percent;
  const delta  = recent - prev;
  if (delta > 5)  return <TrendingUp  className="w-3.5 h-3.5 text-emerald-500" />;
  if (delta < -5) return <TrendingDown className="w-3.5 h-3.5 text-red-500"    />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
}

export default function QuizHistoryTable({
  items,
  total,
  onPageChange,
  page = 1,
  limit = 20,
  loading = false,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No quiz attempts yet. Take a quiz to see your history here.
      </p>
    );
  }

  // Average score across shown items
  const avg = Math.round(items.reduce((s, a) => s + a.score_percent, 0) / items.length);
  const passCount = items.filter((a) => a.passed).length;

  return (
    <div className="flex flex-col gap-3">

      {/* ── Summary row ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          {trendIcon(items)}
          <span className="text-xs text-muted-foreground">
            Avg score: <span className="font-semibold text-foreground">{avg}%</span>
          </span>
        </div>
        <span className="text-muted-foreground/40 text-xs">·</span>
        <span className="text-xs text-muted-foreground">
          <span className="font-semibold text-emerald-500">{passCount}</span>
          /{items.length} passed
        </span>
        <span className="text-muted-foreground/40 text-xs">·</span>
        <span className="text-xs text-muted-foreground">
          {total} total attempt{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Attempt rows ── */}
      <div className="space-y-0.5">
        {items.map((attempt) => {
          const pct = attempt.score_percent;
          const s   = scoreStyle(pct);
          return (
            <div
              key={attempt.id}
              className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50 transition-colors"
            >
              {/* Score ring */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 ${s.ring} flex items-center justify-center bg-background`}>
                <span className={`text-[11px] font-bold tabular-nums ${s.text}`}>{pct}%</span>
              </div>

              {/* Type + module */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${
                    attempt.quiz_type === "standalone"
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}>
                    {attempt.quiz_type === "standalone" ? "Adaptive" : "Module"}
                  </span>
                  <span className={`text-[10px] font-medium ${attempt.passed ? "text-emerald-500" : "text-red-500"}`}>
                    {attempt.passed ? "Passed" : "Failed"}
                  </span>
                </div>
                {attempt.module_title ? (
                  <p className="text-xs text-muted-foreground truncate leading-tight">
                    {attempt.module_title}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground/50 leading-tight italic">Adaptive quiz</p>
                )}
              </div>

              {/* Date */}
              <div className="flex-shrink-0 text-right">
                <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {formatDate(attempt.taken_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Pagination (full Quiz History tab only) ── */}
      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
          <span>{total} attempts</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-muted transition-colors"
            >
              ← Prev
            </button>
            <span>{page} / {totalPages}</span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-muted transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
