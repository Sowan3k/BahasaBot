"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Star,
} from "lucide-react";
import { adminApi, profileApi } from "@/lib/api";
import type { AdminFeedbackResponse } from "@/lib/types";
import { GlowCard } from "@/components/ui/glow-card";

// ── Star rating display ───────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          className={n <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}
        />
      ))}
      <span className="ml-1.5 text-xs text-muted-foreground">{rating}/5</span>
    </div>
  );
}

// ── Rating bar chart ──────────────────────────────────────────────────────────

function RatingDistribution({
  distribution,
  total,
}: {
  distribution: Record<number, number>;
  total: number;
}) {
  if (total === 0) return null;

  return (
    <div className="space-y-1.5">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution[star] ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="w-8 text-muted-foreground text-right">{star} ★</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 text-muted-foreground">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Relevant badge ────────────────────────────────────────────────────────────

function RelevanceBadge({ value }: { value: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    yes: { label: "Yes", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    no: { label: "No", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    somewhat: { label: "Somewhat", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  };
  const { label, cls } = map[value] ?? { label: value, cls: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminFeedbackResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const LIMIT = 20;

  useEffect(() => {
    profileApi.getProfile()
      .then((res) => {
        if (res.data.role !== "admin") router.replace("/dashboard");
      })
      .catch(() => router.replace("/dashboard"));
  }, [router]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    adminApi.getFeedback(page, LIMIT)
      .then((res) => setData(res.data))
      .catch(() => setError("Failed to load feedback"))
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Evaluation Feedback</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.total} responses collected` : "Loading…"}
          </p>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/10">
          <AlertTriangle size={18} className="text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* ── Aggregate stats header ── */}
      {!loading && data && data.total > 0 && (
        <GlowCard className="bg-card p-5 flex flex-col sm:flex-row gap-6">
          {/* Average rating */}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Average Rating
            </p>
            <p className="font-heading text-4xl font-bold text-foreground">
              {data.avg_rating !== null ? data.avg_rating.toFixed(1) : "—"}
              <span className="text-lg text-muted-foreground font-normal"> / 5</span>
            </p>
            <p className="text-xs text-muted-foreground">{data.total} responses</p>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Rating Distribution
            </p>
            <RatingDistribution
              distribution={data.rating_distribution}
              total={data.total}
            />
          </div>
        </GlowCard>
      )}

      {/* ── Feedback list ── */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="space-y-3">
          {data.items.map((fb) => (
            <GlowCard
              key={fb.id}
              className="bg-card p-5 space-y-3"
            >
              {/* Row 1: user + quiz type + date */}
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div>
                  <span className="text-sm font-semibold text-foreground">{fb.user_name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{fb.user_email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground capitalize">
                    {fb.quiz_type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(fb.created_at).toLocaleDateString("en-MY", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Row 2: rating + weak points relevance */}
              <div className="flex flex-wrap items-center gap-4">
                <StarRating rating={fb.rating} />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Quiz matched weak areas:</span>
                  <RelevanceBadge value={fb.weak_points_relevant} />
                </div>
              </div>

              {/* Row 3: open text comment */}
              {fb.comments && (
                <p className="text-sm text-foreground bg-muted/50 rounded-lg px-4 py-2.5 italic">
                  &ldquo;{fb.comments}&rdquo;
                </p>
              )}
            </GlowCard>
          ))}
        </div>
      ) : (
        !loading && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No feedback responses yet. They will appear here after users complete a quiz.
          </div>
        )
      )}

      {/* ── Pagination ── */}
      {data && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
