"use client";

// Adaptive Standalone Quiz Page
// 15 questions: 6 MCQ + 6 fill-in-blank + 3 translation, personalised to user's weak points.
// Scores server-side; recalculates BPS proficiency level after submission.

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { standaloneQuizApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  StandaloneQuizQuestion,
  StandaloneQuizResult,
  QuizAnswer,
} from "@/lib/types";

// BPS level display helpers
const BPS_LABEL: Record<string, string> = {
  "BPS-1": "BPS-1 — Beginner",
  "BPS-2": "BPS-2 — Elementary",
  "BPS-3": "BPS-3 — Intermediate",
  "BPS-4": "BPS-4 — Upper Intermediate",
};

const BPS_COLOR: Record<string, string> = {
  "BPS-1": "text-slate-600",
  "BPS-2": "text-blue-600",
  "BPS-3": "text-emerald-600",
  "BPS-4": "text-violet-600",
};

export default function AdaptiveQuizPage() {
  const queryClient = useQueryClient();

  // Track user's selected/typed answers keyed by question_id
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // Holds scored results after submission
  const [result, setResult] = useState<StandaloneQuizResult | null>(null);

  // ── Fetch quiz questions ─────────────────────────────────────────────────────

  const {
    data: quiz,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["standalone-quiz"],
    queryFn: () => standaloneQuizApi.get().then((r) => r.data),
    retry: 1,
    // Do not re-fetch while the user is mid-quiz — cache for 30 minutes
    staleTime: 30 * 60 * 1000,
  });

  // ── Submit answers ───────────────────────────────────────────────────────────

  const submitMutation = useMutation({
    mutationFn: (submittedAnswers: QuizAnswer[]) =>
      standaloneQuizApi.submit(submittedAnswers).then((r) => r.data),
    onSuccess: (data) => {
      setResult(data);
      // Invalidate dashboard so BPS level + weak points refresh
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const handleSubmit = () => {
    if (!quiz) return;
    const submittedAnswers: QuizAnswer[] = quiz.questions.map((q) => ({
      question_id: q.id,
      answer: answers[q.id] ?? "",
    }));
    submitMutation.mutate(submittedAnswers);
  };

  const handleRetry = () => {
    setAnswers({});
    setResult(null);
    // Invalidate to fetch a fresh quiz (cache was cleared after last submission)
    queryClient.invalidateQueries({ queryKey: ["standalone-quiz"] });
    refetch();
  };

  const answeredCount = quiz
    ? quiz.questions.filter((q) => (answers[q.id] ?? "").trim() !== "").length
    : 0;

  // ── Loading state ────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="h-6 w-40 rounded bg-muted animate-pulse" />
        <div className="h-8 w-64 rounded bg-muted animate-pulse" />
        <div className="h-4 w-80 rounded bg-muted animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 rounded-lg border bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────

  if (isError || !quiz) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center space-y-4">
        <p className="text-destructive font-medium">
          Failed to load quiz. The AI tutor may be busy — please try again.
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  // ── Results screen ───────────────────────────────────────────────────────────

  if (result) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Score card */}
        <div className="rounded-xl border p-6 text-center space-y-3 bg-card">
          <div className="text-5xl font-bold tabular-nums font-heading">{result.score_percent}%</div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {result.correct_count} / {result.total_questions} correct
          </p>

          {/* BPS level update banner */}
          {result.level_changed ? (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 space-y-0.5">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                Level Updated!
              </p>
              <p className="text-sm text-muted-foreground">
                <span className={`font-medium ${BPS_COLOR[result.previous_proficiency_level]}`}>
                  {BPS_LABEL[result.previous_proficiency_level] ?? result.previous_proficiency_level}
                </span>
                {" → "}
                <span className={`font-medium ${BPS_COLOR[result.new_proficiency_level]}`}>
                  {BPS_LABEL[result.new_proficiency_level] ?? result.new_proficiency_level}
                </span>
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-muted/60 px-4 py-2.5">
              <p className="text-sm text-muted-foreground">
                Current level:{" "}
                <span className={`font-semibold ${BPS_COLOR[result.new_proficiency_level]}`}>
                  {BPS_LABEL[result.new_proficiency_level] ?? result.new_proficiency_level}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center flex-wrap">
          <Button onClick={handleRetry}>Take Another Quiz</Button>
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
                  <p>
                    <span className="text-muted-foreground">Correct answer: </span>
                    <span className="text-green-600 font-medium">{qr.correct_answer}</span>
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
    );
  }

  // ── Quiz form ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Adaptive Quiz</span>
      </nav>

      {/* Quiz header */}
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Adaptive Practice
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Bahasa Melayu Quiz</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {quiz.question_count} questions personalised to your weak points · Scoring updates your BPS level
        </p>
      </div>

      {/* Question type legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2.5 py-1 font-medium">
          Multiple Choice
        </span>
        <span className="rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2.5 py-1 font-medium">
          Fill in Blank
        </span>
        <span className="rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-400 px-2.5 py-1 font-medium">
          Translation
        </span>
      </div>

      {/* Progress indicator */}
      <div className="text-sm text-muted-foreground">
        {answeredCount} / {quiz.questions.length} answered
      </div>

      {/* Questions */}
      <div className="space-y-5">
        {quiz.questions.map((q: StandaloneQuizQuestion, idx: number) => (
          <StandaloneQuestionCard
            key={q.id}
            question={q}
            index={idx}
            answer={answers[q.id] ?? ""}
            onChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
          />
        ))}
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4 pt-2">
        <Button
          onClick={handleSubmit}
          disabled={submitMutation.isPending || answeredCount === 0}
          className="min-w-32"
        >
          {submitMutation.isPending ? "Submitting…" : "Submit Quiz"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Unanswered questions are marked wrong.
        </p>
      </div>

      {submitMutation.isError && (
        <p className="text-sm text-destructive">
          Submission failed. Please check your connection and try again.
        </p>
      )}
    </div>
  );
}

// ── Question card component ───────────────────────────────────────────────────

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  mcq: {
    label: "Multiple Choice",
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  fill_in_blank: {
    label: "Fill in Blank",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  translation: {
    label: "Translation",
    className: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  },
};

function StandaloneQuestionCard({
  question,
  index,
  answer,
  onChange,
}: {
  question: StandaloneQuizQuestion;
  index: number;
  answer: string;
  onChange: (value: string) => void;
}) {
  const badge = TYPE_BADGE[question.type] ?? TYPE_BADGE.fill_in_blank;

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      {/* Question header */}
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium text-base flex-1">
          <span className="text-muted-foreground mr-2">Q{index + 1}.</span>
          {question.question}
        </p>
        <span
          className={`flex-shrink-0 text-xs font-medium rounded-full px-2.5 py-1 ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      {question.type === "mcq" && question.options ? (
        // ── MCQ: radio buttons ────────────────────────────────────────────────
        <div className="space-y-2">
          {question.options.map((opt) => (
            <label
              key={opt}
              className={`flex items-center gap-3 rounded-md border px-4 py-2.5 cursor-pointer transition-colors ${
                answer === opt
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-muted/40"
              }`}
            >
              <input
                type="radio"
                name={question.id}
                value={opt}
                checked={answer === opt}
                onChange={() => onChange(opt)}
                className="accent-primary"
              />
              <span className="text-base">{opt}</span>
            </label>
          ))}
        </div>
      ) : (
        // ── Fill-in-blank / Translation: text input ───────────────────────────
        <div className="space-y-1">
          <Input
            placeholder={
              question.type === "translation"
                ? "Type the Malay translation…"
                : "Type the Malay word or phrase…"
            }
            value={answer}
            onChange={(e) => onChange(e.target.value)}
            className="max-w-sm"
          />
          <p className="text-xs text-muted-foreground">
            {question.type === "translation"
              ? "Write the full Malay sentence."
              : "Type the Malay word or short phrase."}
          </p>
        </div>
      )}
    </div>
  );
}
