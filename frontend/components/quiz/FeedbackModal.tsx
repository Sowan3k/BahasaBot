"use client";

/**
 * FeedbackModal
 *
 * Optional 3-question survey shown after quiz results.
 * Appears with a 3-second delay so it doesn't interrupt the results view.
 *
 * Q1 — Star rating 1–5
 * Q2 — "Did the quiz reflect your weak areas?" (Yes / No / Somewhat)
 * Q3 — Optional free-text comment (max 1000 chars)
 *
 * On success: shows a thank-you message then auto-closes after 2 seconds.
 * On error:   shows an inline error and allows retry.
 * Skip link:  dismisses without submitting.
 */

import { useState } from "react";
import { Star, X } from "lucide-react";
import { feedbackApi } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type WeakPointsRelevant = "yes" | "no" | "somewhat";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizType: "module" | "standalone";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FeedbackModal({ isOpen, onClose, quizType }: FeedbackModalProps) {
  const [rating, setRating]             = useState<number>(0);
  const [hoverRating, setHoverRating]   = useState<number>(0);
  const [relevant, setRelevant]         = useState<WeakPointsRelevant | null>(null);
  const [comments, setComments]         = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [submitted, setSubmitted]       = useState(false);

  if (!isOpen) return null;

  const canSubmit = rating > 0 && relevant !== null && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      await feedbackApi.submitFeedback({
        quiz_type: quizType,
        rating,
        weak_points_relevant: relevant!,
        comments: comments.trim() || undefined,
      });
      setSubmitted(true);
      // Auto-close after 2 seconds
      setTimeout(onClose, 2000);
    } catch {
      setError("Failed to submit feedback. Please try again.");
      setSubmitting(false);
    }
  };

  // ── Thank-you state ───────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-card p-8 text-center shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
            <Star className="w-6 h-6 text-primary fill-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Thank you!</h3>
          <p className="text-sm text-muted-foreground">
            Your feedback helps improve BahasaBot for all learners.
          </p>
        </div>
      </div>
    );
  }

  // ── Survey form ───────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card shadow-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
          <div>
            <h3 className="text-base font-semibold">Quick Feedback</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Optional — takes less than a minute
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Q1 — Star rating */}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              How would you rate your experience?
            </p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= (hoverRating || rating);
                return (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110 active:scale-95"
                    aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        filled
                          ? "text-amber-400 fill-amber-400"
                          : "text-muted-foreground/40"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Q2 — Weak areas relevance */}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Did the quiz reflect your weak areas?
            </p>
            <div className="flex gap-2">
              {(["yes", "no", "somewhat"] as WeakPointsRelevant[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setRelevant(opt)}
                  className={`flex-1 h-9 rounded-lg border text-sm font-medium capitalize transition-colors ${
                    relevant === opt
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Q3 — Optional comments */}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Any additional feedback?{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </p>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value.slice(0, 1000))}
              placeholder="Share your thoughts…"
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm
                         placeholder:text-muted-foreground resize-none
                         focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1
                         transition-colors"
            />
            <p className="text-xs text-muted-foreground text-right">
              {comments.length} / 1000
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-5">
          <button
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium
                       hover:bg-primary/90 active:scale-[0.98] transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
