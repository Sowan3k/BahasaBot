"use client";

// Adaptive Quiz Results Page
// Reads scored results from sessionStorage (written by the quiz page immediately
// before redirecting here). Shows score ring, BPS level update, per-question
// breakdown, and the evaluation feedback modal.

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Brain, RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpeakerButton } from "@/components/ui/SpeakerButton";
import { FeedbackModal } from "@/components/quiz/FeedbackModal";
import type { StandaloneQuizResult } from "@/lib/types";

// ── BPS display helpers ───────────────────────────────────────────────────────

const BPS_LABEL: Record<string, string> = {
  "BPS-1": "BPS-1 — Beginner",
  "BPS-2": "BPS-2 — Elementary",
  "BPS-3": "BPS-3 — Intermediate",
  "BPS-4": "BPS-4 — Upper Intermediate",
};

const BPS_COLOR: Record<string, string> = {
  "BPS-1": "text-muted-foreground",
  "BPS-2": "text-ring",
  "BPS-3": "text-primary",
  "BPS-4": "text-foreground",
};

// ── Circular score ring ───────────────────────────────────────────────────────

function ScoreRing({ percent }: { percent: number }) {
  const radius = 50;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color =
    percent >= 70
      ? "#22c55e"
      : percent >= 40
      ? "#f59e0b"
      : "hsl(var(--destructive))";

  return (
    <div className="relative w-36 h-36 mx-auto flex-shrink-0">
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full -rotate-90"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/40"
        />
        {/* Progress arc */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      {/* Label inside ring */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums font-heading leading-none">
          {percent}%
        </span>
        <span className="text-xs text-muted-foreground mt-0.5">Score</span>
      </div>
    </div>
  );
}

// ── Inner page (reads sessionStorage) ────────────────────────────────────────

function ResultsContent() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [result, setResult] = useState<StandaloneQuizResult | null>(null);
  const [missingData, setMissingData] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const feedbackShown = useRef(false);

  // ── Read stored result ──────────────────────────────────────────────────────

  useEffect(() => {
    const raw = sessionStorage.getItem("adaptiveQuizResult");
    if (raw) {
      try {
        setResult(JSON.parse(raw) as StandaloneQuizResult);
      } catch {
        setMissingData(true);
      }
    } else {
      setMissingData(true);
    }
  }, []);

  // ── Feedback modal ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (result && !feedbackShown.current) {
      feedbackShown.current = true;
      const timer = setTimeout(() => setShowFeedback(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [result]);

  // ── Take another quiz ───────────────────────────────────────────────────────

  const handleTakeAnother = () => {
    // Invalidate so the next attempt generates fresh questions from Gemini
    queryClient.invalidateQueries({ queryKey: ["standalone-quiz"] });
    router.push("/quiz/adaptive");
  };

  // ── Missing data fallback ───────────────────────────────────────────────────

  if (missingData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
        <p className="text-muted-foreground">
          Result data not found. Please retake the quiz to see your results.
        </p>
        <Button onClick={handleTakeAnother}>Go to Quiz</Button>
      </div>
    );
  }

  if (!result) {
    // Still reading sessionStorage (first render)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground text-sm animate-pulse">
          Loading results…
        </p>
      </div>
    );
  }

  // ── Rendered results ────────────────────────────────────────────────────────

  return (
    <>
      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        quizType="standalone"
      />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
          <span className="mx-2">/</span>
          <Link href="/quiz/adaptive" className="hover:text-foreground">
            Adaptive Quiz
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Results</span>
        </nav>

        {/* Score card */}
        <div className="rounded-xl border p-6 space-y-4 bg-card">
          {/* Ring + headline row */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ScoreRing percent={result.score_percent} />

            <div className="text-center sm:text-left space-y-1.5 flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-bold">Quiz Complete!</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                You got{" "}
                <strong>
                  {result.correct_count}/{result.total_questions}
                </strong>{" "}
                correct.
              </p>
              <p className="text-xs text-muted-foreground">
                Adaptive · 15 questions · BPS level updated
              </p>
            </div>
          </div>

          {/* BPS level update */}
          {result.level_changed ? (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  Level Updated!
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                <span
                  className={`font-medium ${BPS_COLOR[result.previous_proficiency_level]}`}
                >
                  {BPS_LABEL[result.previous_proficiency_level] ??
                    result.previous_proficiency_level}
                </span>
                {" → "}
                <span
                  className={`font-medium ${BPS_COLOR[result.new_proficiency_level]}`}
                >
                  {BPS_LABEL[result.new_proficiency_level] ??
                    result.new_proficiency_level}
                </span>
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-muted/60 px-4 py-2.5">
              <p className="text-sm text-muted-foreground">
                Current level:{" "}
                <span
                  className={`font-semibold ${BPS_COLOR[result.new_proficiency_level]}`}
                >
                  {BPS_LABEL[result.new_proficiency_level] ??
                    result.new_proficiency_level}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
          <Button onClick={handleTakeAnother}>
            <RefreshCw className="mr-1.5 w-4 h-4" />
            Take Another Quiz
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>

        {/* Per-question breakdown */}
        <div className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Question Breakdown
          </h2>

          {result.question_results.map((qr, idx) => (
            <div
              key={qr.question_id}
              className={`rounded-lg border p-4 space-y-2 ${
                qr.is_correct
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-destructive/30 bg-destructive/5"
              }`}
            >
              {/* Question header */}
              <div className="flex items-start gap-2">
                <span
                  className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded-full text-xs font-bold flex items-center justify-center ${
                    qr.is_correct
                      ? "bg-green-500 text-white"
                      : "bg-destructive text-white"
                  }`}
                >
                  {qr.is_correct ? "✓" : "✗"}
                </span>
                <p className="text-sm font-medium leading-relaxed">
                  Q{idx + 1}. {qr.question}
                </p>
              </div>

              {/* Answers */}
              <div className="pl-7 space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Your answer: </span>
                  <span
                    className={
                      qr.is_correct
                        ? "text-green-600 font-medium"
                        : "text-destructive font-medium"
                    }
                  >
                    {qr.your_answer || (
                      <em className="text-muted-foreground">no answer</em>
                    )}
                  </span>
                </p>

                {!qr.is_correct && (
                  <p className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-muted-foreground">
                      Correct answer:{" "}
                    </span>
                    <span className="text-green-600 font-medium">
                      {qr.correct_answer}
                    </span>
                    <SpeakerButton word={qr.correct_answer} size="xs" />
                  </p>
                )}

                {qr.explanation && (
                  <p className="text-muted-foreground italic text-xs mt-1">
                    {qr.explanation}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Page export — wraps in Suspense for useRouter ─────────────────────────────

export default function AdaptiveQuizResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground text-sm animate-pulse">
            Loading results…
          </p>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
