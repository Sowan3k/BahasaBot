"use client";

// Adaptive Standalone Quiz Page
// 15 questions: 6 MCQ + 6 fill-in-blank + 3 translation, personalised to user's weak points.
// Scores server-side; recalculates BPS proficiency level after submission.

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Brain, ChartBar, Sparkles, CheckCircle2, BookOpen, Target, BarChart2, ArrowRight } from "lucide-react";
import { standaloneQuizApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SpeakerButton } from "@/components/ui/SpeakerButton";
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
  "BPS-1": "text-muted-foreground",
  "BPS-2": "text-ring",
  "BPS-3": "text-primary",
  "BPS-4": "text-foreground",
};

// ── Quiz generating animation ─────────────────────────────────────────────────
// Shown while Gemini generates the quiz (may take 5–15 s if not Redis-cached).
// Steps advance every 3 s to show realistic progress and keep the user informed.

const STEPS = [
  { icon: Brain,        text: "Analyzing your learning history…"        },
  { icon: ChartBar,     text: "Identifying your weak points…"            },
  { icon: Sparkles,     text: "Generating personalized questions…"       },
  { icon: CheckCircle2, text: "Finalizing your quiz…"                    },
] as const;

function QuizGeneratingLoader() {
  const [activeStep, setActiveStep] = useState(0);

  // Advance one step every 3 s, but never exceed STEPS.length - 1
  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[480px] max-w-sm mx-auto px-6 gap-10">

      {/* Spinning ring + icon ------------------------------------------------ */}
      <div className="relative w-20 h-20 flex-shrink-0">
        {/* Static background ring */}
        <div className="absolute inset-0 rounded-full border-4 border-primary/15" />
        {/* Spinning progress arc */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
        {/* Inner icon pulsing */}
        <div className="absolute inset-2 rounded-full bg-primary/10 flex items-center justify-center">
          <Brain className="w-7 h-7 text-primary animate-pulse" />
        </div>
      </div>

      {/* Step list ----------------------------------------------------------- */}
      <div className="w-full space-y-3">
        {STEPS.map(({ icon: Icon, text }, i) => {
          const done    = i < activeStep;
          const active  = i === activeStep;
          const pending = i > activeStep;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 transition-all duration-500 ${
                pending ? "opacity-30" : "opacity-100"
              }`}
            >
              {/* Step indicator */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-500 ${
                  done
                    ? "bg-primary text-primary-foreground"
                    : active
                    ? "bg-primary/15 text-primary ring-2 ring-primary/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Icon className={`w-4 h-4 ${active ? "animate-pulse" : ""}`} />
                )}
              </div>

              {/* Step text */}
              <span
                className={`text-sm transition-colors duration-500 ${
                  done    ? "text-muted-foreground line-through decoration-muted-foreground/50" :
                  active  ? "text-foreground font-medium"  :
                            "text-muted-foreground"
                }`}
              >
                {text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Caption */}
      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        Personalizing 15 questions based on your vocabulary,
        grammar, and past quiz performance. This may take a few seconds.
      </p>
    </div>
  );
}

// ── Lobby screen ──────────────────────────────────────────────────────────────
// Shown before the quiz generates — prevents accidental API calls.

function QuizLobby({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[480px] max-w-sm mx-auto px-6 gap-8 animate-in fade-in duration-300">

      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center ring-1 ring-primary/20">
        <Brain className="w-8 h-8 text-primary" />
      </div>

      {/* Heading */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Adaptive Quiz</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          15 personalized questions targeting your weak areas.
          Completing the quiz updates your BPS proficiency level.
        </p>
      </div>

      {/* Info grid */}
      <div className="w-full grid grid-cols-3 gap-2 text-center">
        {[
          { icon: BookOpen,  value: "15",        label: "questions"     },
          { icon: Target,    value: "Adaptive",  label: "to your level" },
          { icon: BarChart2, value: "BPS",       label: "level update"  },
        ].map(({ icon: Icon, value, label }) => (
          <div key={label} className="rounded-xl border bg-card py-3 px-2">
            <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
            <div className="text-sm font-bold">{value}</div>
            <div className="text-[10px] text-muted-foreground leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* Format breakdown */}
      <div className="w-full space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
          6 Multiple Choice questions
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
          6 Fill-in-the-blank questions
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-muted-foreground flex-shrink-0" />
          3 Translation questions
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onStart}
        className="w-full flex items-center justify-center gap-2 h-11 rounded-xl
                   bg-primary text-primary-foreground text-sm font-semibold
                   hover:bg-primary/90 active:scale-[0.98] transition-all"
      >
        Start Quiz
        <ArrowRight className="w-4 h-4" />
      </button>

      <p className="text-xs text-muted-foreground text-center">
        The quiz will be generated fresh or loaded from cache.
        It may take a few seconds.
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdaptiveQuizPage() {
  const queryClient = useQueryClient();

  // "lobby" = confirmation screen (no API call yet)
  // "generating" = user confirmed, quiz is being fetched
  // "quiz" / "result" = active quiz or results
  const [phase, setPhase] = useState<"lobby" | "generating">("lobby");

  // Track user's selected/typed answers keyed by question_id
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // Holds scored results after submission
  const [result, setResult] = useState<StandaloneQuizResult | null>(null);

  // ── Fetch quiz questions — only fires after user confirms ────────────────────

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
    // Only fetch after user explicitly starts — prevents accidental API calls
    enabled: phase === "generating",
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
    setPhase("lobby");
    // Invalidate so the next start triggers a fresh Gemini call
    queryClient.invalidateQueries({ queryKey: ["standalone-quiz"] });
  };

  const answeredCount = quiz
    ? quiz.questions.filter((q) => (answers[q.id] ?? "").trim() !== "").length
    : 0;

  // ── Lobby — shown before user confirms ───────────────────────────────────────

  if (phase === "lobby" && !result) {
    return (
      <QuizLobby
        onStart={() => setPhase("generating")}
      />
    );
  }

  // ── Loading state ────────────────────────────────────────────────────────────

  if (isLoading) {
    return <QuizGeneratingLoader />;
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
                  <p className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-muted-foreground">Correct answer: </span>
                    <span className="text-green-600 font-medium">{qr.correct_answer}</span>
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
        <span className="rounded-full bg-secondary text-secondary-foreground px-2.5 py-1 font-medium">
          Multiple Choice
        </span>
        <span className="rounded-full bg-accent text-accent-foreground px-2.5 py-1 font-medium">
          Fill in Blank
        </span>
        <span className="rounded-full bg-muted text-muted-foreground px-2.5 py-1 font-medium">
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
    className: "bg-secondary text-secondary-foreground",
  },
  fill_in_blank: {
    label: "Fill in Blank",
    className: "bg-accent text-accent-foreground",
  },
  translation: {
    label: "Translation",
    className: "bg-muted text-muted-foreground",
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
