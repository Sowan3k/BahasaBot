"use client";

import type { QuizHistoryEntry } from "@/lib/types";

interface Props {
  items: QuizHistoryEntry[];
  total: number;
  onPageChange?: (page: number) => void;
  page?: number;
  limit?: number;
  loading?: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
    return <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>;
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No quiz attempts yet. Take a quiz to see your history here.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Date</th>
              <th className="px-4 py-2.5 text-left font-medium">Type</th>
              <th className="px-4 py-2.5 text-left font-medium">Module</th>
              <th className="px-4 py-2.5 text-left font-medium">Score</th>
              <th className="px-4 py-2.5 text-left font-medium">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((attempt) => (
              <tr key={attempt.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                  {formatDate(attempt.taken_at)}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      attempt.quiz_type === "standalone"
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {attempt.quiz_type === "standalone" ? "Adaptive" : "Module"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {attempt.module_title ?? "—"}
                </td>
                <td className="px-4 py-2.5 font-medium tabular-nums">
                  {attempt.score_percent}%
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      attempt.passed
                        ? "bg-primary text-primary-foreground"
                        : "bg-destructive text-destructive-foreground"
                    }`}
                  >
                    {attempt.passed ? "Passed" : "Failed"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-1">
          <span>
            {total} attempt{total !== 1 ? "s" : ""} total
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-muted transition-colors"
            >
              ← Prev
            </button>
            <span>
              {page} / {totalPages}
            </span>
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
