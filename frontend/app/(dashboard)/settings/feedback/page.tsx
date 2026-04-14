"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Star, Send, CheckCircle2 } from "lucide-react";
import { feedbackApi } from "@/lib/api";
import { GlowCard } from "@/components/ui/glow-card";

// ── Star selector ─────────────────────────────────────────────────────────────

function StarSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`${n} star${n !== 1 ? "s" : ""}`}
          className="p-1 transition-transform hover:scale-110 focus:outline-none"
        >
          <Star
            size={28}
            className={
              n <= (hovered || value)
                ? "text-amber-400 fill-amber-400"
                : "text-muted-foreground"
            }
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm text-muted-foreground">
          {["", "Poor", "Fair", "Good", "Very good", "Excellent"][value]}
        </span>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [relevance, setRelevance] = useState<"yes" | "no" | "somewhat" | "">("");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError("Please select a rating."); return; }
    if (!relevance)   { setError("Please answer the learning content question."); return; }

    setLoading(true);
    setError(null);

    try {
      await feedbackApi.submitFeedback({
        quiz_type: "general",
        rating,
        weak_points_relevant: relevance,
        comments: comments.trim() || undefined,
      });
      setSubmitted(true);
    } catch {
      setError("Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Send Feedback</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your feedback helps us improve BahasaBot for everyone.
          </p>
        </div>
      </div>

      {submitted ? (
        /* ── Success state ── */
        <GlowCard className="bg-card p-8 flex flex-col items-center gap-4 text-center">
          <CheckCircle2 size={48} className="text-primary" />
          <div>
            <p className="font-heading text-xl font-bold text-foreground">Thank you!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your feedback has been received and will help improve BahasaBot.
            </p>
          </div>
          <Link
            href="/settings"
            className="mt-2 text-sm text-primary hover:underline"
          >
            Back to Settings
          </Link>
        </GlowCard>
      ) : (
        /* ── Form ── */
        <GlowCard className="bg-card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Q1: Overall rating */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">
                1. How would you rate your overall experience with BahasaBot?
              </label>
              <StarSelector value={rating} onChange={setRating} />
            </div>

            {/* Q2: Learning content relevance */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-foreground">
                2. Does BahasaBot&apos;s content match what you need to learn?
              </label>
              <div className="flex flex-wrap gap-2">
                {(["yes", "somewhat", "no"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setRelevance(v)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      relevance === v
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {v === "yes" ? "Yes, very relevant" : v === "somewhat" ? "Somewhat" : "Not really"}
                  </button>
                ))}
              </div>
            </div>

            {/* Q3: Open text */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">
                3. Any suggestions or issues you&apos;d like to report?{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="Tell us what's working well, what could be better, or report a bug…"
                className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
              <p className="text-xs text-muted-foreground text-right">
                {comments.length} / 1000
              </p>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              <Send size={15} />
              {loading ? "Submitting…" : "Submit Feedback"}
            </button>
          </form>
        </GlowCard>
      )}
    </div>
  );
}
