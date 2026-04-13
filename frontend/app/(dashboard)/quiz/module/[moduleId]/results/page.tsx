"use client";

// Module Quiz Results Page
// Reads scored results from sessionStorage (written by the quiz page immediately
// before redirecting here). Uses React Query to fetch course structure so the
// "Continue to Next Module" button can link to the first class of the next module.

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, RefreshCw, RotateCcw, Trophy } from "lucide-react";
import { coursesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { SpeakerButton } from "@/components/ui/SpeakerButton";
import { FeedbackModal } from "@/components/quiz/FeedbackModal";
import type { ModuleQuizResult, Course } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StoredQuizResult {
  result: ModuleQuizResult;
  courseId: string;
  moduleTitle: string;
}

// ── Circular score ring ───────────────────────────────────────────────────────

function ScoreRing({
  percent,
  passed,
}: {
  percent: number;
  passed: boolean;
}) {
  const radius = 50;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color = passed ? "#22c55e" : "hsl(var(--destructive))";

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
        <span
          className={`text-xs font-semibold mt-0.5 ${
            passed ? "text-green-600 dark:text-green-400" : "text-destructive"
          }`}
        >
          {passed ? "PASS" : "FAIL"}
        </span>
      </div>
    </div>
  );
}

// ── Inner page (reads searchParams) ──────────────────────────────────────────

function ResultsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const moduleId = params.moduleId as string;
  const courseId = searchParams.get("courseId") ?? "";

  // ── Read stored result ────────────────────────────────────────────────────

  const [stored, setStored] = useState<StoredQuizResult | null>(null);
  const [missingData, setMissingData] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(`moduleQuizResult_${moduleId}`);
    if (raw) {
      try {
        setStored(JSON.parse(raw) as StoredQuizResult);
      } catch {
        setMissingData(true);
      }
    } else {
      setMissingData(true);
    }
  }, [moduleId]);

  // ── Feedback modal ────────────────────────────────────────────────────────

  const [showFeedback, setShowFeedback] = useState(false);
  const feedbackShown = useRef(false);

  useEffect(() => {
    if (stored && !feedbackShown.current) {
      feedbackShown.current = true;
      const timer = setTimeout(() => setShowFeedback(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [stored]);

  // ── Fetch course structure (for next-module navigation) ───────────────────

  const resolvedCourseId = stored?.courseId ?? courseId;

  const { data: course } = useQuery<Course>({
    queryKey: ["course", resolvedCourseId],
    queryFn: () => coursesApi.get(resolvedCourseId).then((r) => r.data),
    enabled: !!resolvedCourseId,
    staleTime: 5 * 60 * 1000,
  });

  // ── Derive next module ────────────────────────────────────────────────────

  const currentModuleIndex =
    course?.modules.findIndex((m) => m.id === moduleId) ?? -1;
  const nextModule =
    currentModuleIndex >= 0
      ? course?.modules[currentModuleIndex + 1]
      : undefined;
  const nextModuleFirstClass = nextModule?.classes?.[0];

  // ── Missing data fallback ─────────────────────────────────────────────────

  if (missingData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
        <p className="text-muted-foreground">
          Result data not found. Please retake the quiz to see your results.
        </p>
        <Button asChild>
          <Link
            href={
              courseId
                ? `/courses/${courseId}/modules/${moduleId}/quiz`
                : "/courses"
            }
          >
            Back to Quiz
          </Link>
        </Button>
      </div>
    );
  }

  if (!stored) {
    // Still reading sessionStorage (first render)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground text-sm animate-pulse">Loading results…</p>
      </div>
    );
  }

  const { result, moduleTitle } = stored;
  const cid = stored.courseId || courseId;

  // ── Rendered results ──────────────────────────────────────────────────────

  return (
    <>
      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        quizType="module"
      />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Back link */}
        <Link
          href={`/courses/${cid}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Course
        </Link>

        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground">
          <Link href="/courses" className="hover:text-foreground">Courses</Link>
          <span className="mx-2">/</span>
          <Link href={`/courses/${cid}`} className="hover:text-foreground">Course</Link>
          <span className="mx-2">/</span>
          <Link
            href={`/courses/${cid}/modules/${moduleId}`}
            className="hover:text-foreground"
          >
            {moduleTitle || "Module"}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Quiz Results</span>
        </nav>

        {/* Score card */}
        <div
          className={`rounded-xl border p-6 space-y-4 ${
            result.passed
              ? "bg-green-500/5 border-green-500/25"
              : "bg-destructive/5 border-destructive/25"
          }`}
        >
          {/* Ring + headline row */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ScoreRing percent={result.score_percent} passed={result.passed} />

            <div className="text-center sm:text-left space-y-1.5 flex-1">
              {result.passed ? (
                <>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Trophy className="w-5 h-5 text-green-500" />
                    <h1 className="text-xl font-bold text-green-700 dark:text-green-400">
                      Module Unlocked!
                    </h1>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You passed with{" "}
                    <strong>{result.correct_count}/{result.total_questions}</strong> correct.
                    {result.module_unlocked && (
                      <> The next module is now available.</>
                    )}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-xl font-bold">Keep practising!</h1>
                  <p className="text-sm text-muted-foreground">
                    You got <strong>{result.correct_count}/{result.total_questions}</strong> correct.
                    You need 70% or above to unlock the next module.
                  </p>
                </>
              )}

              <p className="text-xs text-muted-foreground">
                Pass threshold: 70% · {moduleTitle}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
          {result.passed ? (
            nextModule && nextModuleFirstClass ? (
              <Button asChild>
                <Link
                  href={`/courses/${cid}/modules/${nextModule.id}/classes/${nextModuleFirstClass.id}`}
                >
                  Continue to Next Module
                  <ArrowRight className="ml-1.5 w-4 h-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href={`/courses/${cid}`}>
                  Back to Course
                  <ArrowRight className="ml-1.5 w-4 h-4" />
                </Link>
              </Button>
            )
          ) : (
            <>
              <Button
                onClick={() =>
                  router.push(`/courses/${cid}/modules/${moduleId}/quiz`)
                }
              >
                <RefreshCw className="mr-1.5 w-4 h-4" />
                Retry Quiz
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/courses/${cid}/modules/${moduleId}`}>
                  <BookOpen className="mr-1.5 w-4 h-4" />
                  Review Module
                </Link>
              </Button>
            </>
          )}
          <Button variant="ghost" asChild>
            <Link href={`/courses/${cid}`}>
              <RotateCcw className="mr-1.5 w-4 h-4" />
              Back to Course
            </Link>
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
                    <span className="text-muted-foreground">Correct answer: </span>
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

// ── Page export — wraps in Suspense for useSearchParams ───────────────────────

export default function ModuleQuizResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground text-sm animate-pulse">Loading results…</p>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
