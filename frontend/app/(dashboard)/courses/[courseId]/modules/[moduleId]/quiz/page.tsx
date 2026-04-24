"use client";

// Module Quiz Page
// Displayed after a user completes all classes in a module.
// Shows 10 questions (6 MCQ + 4 fill-in-blank), scores server-side, unlocks next module on pass.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { quizApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import type {
  ModuleQuizQuestion,
  ModuleQuizResult,
  QuizAnswer,
} from "@/lib/types";

export default function ModuleQuizPage({
  params,
}: {
  params: { courseId: string; moduleId: string };
}) {
  const { courseId, moduleId } = params;
  const router = useRouter();
  const queryClient = useQueryClient();

  // Track user's selected / typed answers keyed by question_id
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // ── Fetch quiz questions ───────────────────────────────────────────────────

  const {
    data: quiz,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["module-quiz", courseId, moduleId],
    queryFn: () =>
      quizApi.getModuleQuiz(courseId, moduleId).then((r) => r.data),
    retry: 1,
  });

  // ── Submit answers ────────────────────────────────────────────────────────

  const submitMutation = useMutation({
    mutationFn: (submittedAnswers: QuizAnswer[]) =>
      quizApi
        .submitModuleQuiz(courseId, moduleId, submittedAnswers)
        .then((r) => r.data),
    onSuccess: (data: ModuleQuizResult) => {
      // Invalidate course cache so module lock states refresh correctly
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      // Store result in sessionStorage so the results page can read it without
      // an extra API call. The key is namespaced by moduleId to avoid collisions.
      sessionStorage.setItem(
        `moduleQuizResult_${moduleId}`,
        JSON.stringify({ result: data, courseId, moduleTitle: quiz?.module_title ?? "" })
      );
      router.push(`/quiz/module/${moduleId}/results?courseId=${courseId}`);
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

  const answeredCount = quiz
    ? quiz.questions.filter((q) => (answers[q.id] ?? "").trim() !== "").length
    : 0;

  // ── Submitting redirect state ─────────────────────────────────────────────
  // After submitMutation.onSuccess fires, router.push navigates away.
  // Show a brief redirect overlay so the user doesn't see a flash of the form.
  if (submitMutation.isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground text-sm animate-pulse">Loading results…</p>
      </div>
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="h-6 w-48 rounded bg-muted animate-pulse" />
        <div className="h-8 w-72 rounded bg-muted animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-lg border bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (isError || !quiz) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center space-y-4">
        <p className="text-destructive font-medium">
          Failed to load quiz. Please try again.
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
        <Button variant="ghost" asChild>
          <Link href={`/courses/${courseId}/modules/${moduleId}`}>
            Back to Module
          </Link>
        </Button>
      </div>
    );
  }

  // ── Already passed state ──────────────────────────────────────────────────

  if (quiz.already_passed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center space-y-4">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold">Module Completed!</h1>
        <p className="text-muted-foreground">
          You already passed the quiz for <strong>{quiz.module_title}</strong>.
        </p>
        <Button asChild>
          <Link href={`/courses/${courseId}`}>Back to Course</Link>
        </Button>
      </div>
    );
  }

  // ── Quiz form ─────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Back button */}
      <Link href={`/courses/${courseId}/modules/${moduleId}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} />
        Back to Module
      </Link>

      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground">
        <Link href="/courses" className="hover:text-foreground">Courses</Link>
        <span className="mx-2">/</span>
        <Link href={`/courses/${courseId}`} className="hover:text-foreground">Course</Link>
        <span className="mx-2">/</span>
        <Link href={`/courses/${courseId}/modules/${moduleId}`} className="hover:text-foreground">
          {quiz.module_title}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Quiz</span>
      </nav>

      {/* Quiz header */}
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Module Quiz
        </p>
        <h1 className="text-2xl font-bold">{quiz.module_title}</h1>
        <p className="text-sm text-muted-foreground">
          {quiz.questions.length} questions · Score 70% or above to unlock the next module
        </p>
      </div>

      {/* Progress indicator */}
      <div className="text-sm text-muted-foreground">
        {answeredCount} / {quiz.questions.length} answered
      </div>

      {/* Questions */}
      <div className="space-y-5">
        {quiz.questions.map((q: ModuleQuizQuestion, idx: number) => (
          <QuestionCard
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
          You can submit with unanswered questions — they will be marked wrong.
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

// ── Question card component ────────────────────────────────────────────────────

function QuestionCard({
  question,
  index,
  answer,
  onChange,
}: {
  question: ModuleQuizQuestion;
  index: number;
  answer: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <p className="font-medium text-sm">
        <span className="text-muted-foreground mr-2">Q{index + 1}.</span>
        {question.question}
      </p>

      {question.type === "mcq" && question.options ? (
        // ── MCQ: radio buttons ─────────────────────────────────────────────
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
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      ) : (
        // ── Fill-in-blank: text input ──────────────────────────────────────
        <div className="space-y-1">
          <Input
            placeholder="Type your answer in Malay…"
            value={answer}
            onChange={(e) => onChange(e.target.value)}
            className="max-w-sm"
          />
          <p className="text-xs text-muted-foreground">
            Type the Malay word or phrase.
          </p>
        </div>
      )}
    </div>
  );
}
