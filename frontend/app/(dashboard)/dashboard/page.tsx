"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";

import Link from "next/link";
import { BookOpen, Zap, MessageCircle } from "lucide-react";

import { dashboardApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  DashboardSummary,
  GrammarEntry,
  GrammarListResponse,
  QuizHistoryEntry,
  QuizHistoryResponse,
  VocabularyEntry,
  VocabularyListResponse,
  WeakPointEntry,
} from "@/lib/types";

// Heavy components loaded asynchronously — keeps initial bundle small
const BPSProgressBar = dynamic(() => import("@/components/dashboard/BPSProgressBar"), { ssr: false });
const QuizHistoryTable = dynamic(() => import("@/components/dashboard/QuizHistoryTable"), { ssr: false });
const StatsCards = dynamic(() => import("@/components/dashboard/StatsCards"), { ssr: false });
const VocabularyTable = dynamic(() => import("@/components/dashboard/VocabularyTable"), { ssr: false });
const WeakPointsChart = dynamic(() => import("@/components/dashboard/WeakPointsChart"), { ssr: false });
const GlowingEffect = dynamic(
  () => import("@/components/ui/glowing-effect").then((m) => ({ default: m.GlowingEffect })),
  { ssr: false, loading: () => null }
);

// ── Simple inline grammar table ───────────────────────────────────────────────

function GrammarTable({
  items,
  total,
  page,
  limit,
  loading,
  onPageChange,
}: {
  items: GrammarEntry[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (loading) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>;
  }
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No grammar rules learned yet. Chat with the AI tutor or complete course classes.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Rule</th>
              <th className="px-4 py-2.5 text-left font-medium">Example</th>
              <th className="px-4 py-2.5 text-left font-medium">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((g) => (
              <tr key={g.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-2.5 font-medium max-w-xs">{g.rule}</td>
                <td className="px-4 py-2.5 text-muted-foreground italic max-w-xs">
                  {g.example}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      g.source_type === "chatbot"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {g.source_name}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-1">
          <span>{total} rule{total !== 1 ? "s" : ""} total</span>
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

// ── Tab type ──────────────────────────────────────────────────────────────────

type Tab = "overview" | "vocabulary" | "grammar" | "quiz-history";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "vocabulary", label: "Vocabulary" },
  { id: "grammar", label: "Grammar" },
  { id: "quiz-history", label: "Quiz History" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { status } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Summary (overview tab) — cached for 5 min via global QueryClient staleTime
  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryIsError,
  } = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => dashboardApi.getSummary().then((r) => r.data),
    enabled: status === "authenticated",
  });
  const summaryError = summaryIsError
    ? "Failed to load dashboard. Please refresh the page."
    : null;

  // Vocabulary tab
  const [vocabData, setVocabData] = useState<VocabularyListResponse | null>(null);
  const [vocabPage, setVocabPage] = useState(1);
  const [vocabLoading, setVocabLoading] = useState(false);

  // Grammar tab
  const [grammarData, setGrammarData] = useState<GrammarListResponse | null>(null);
  const [grammarPage, setGrammarPage] = useState(1);
  const [grammarLoading, setGrammarLoading] = useState(false);

  // Quiz history tab
  const [quizData, setQuizData] = useState<QuizHistoryResponse | null>(null);
  const [quizPage, setQuizPage] = useState(1);
  const [quizLoading, setQuizLoading] = useState(false);

  // Load vocabulary when tab activates or page changes
  useEffect(() => {
    if (activeTab !== "vocabulary") return;
    setVocabLoading(true);
    dashboardApi
      .getVocabulary(vocabPage, 20)
      .then((res) => setVocabData(res.data))
      .catch(() => {})
      .finally(() => setVocabLoading(false));
  }, [activeTab, vocabPage]);

  async function handleVocabDelete(ids: string[]) {
    await dashboardApi.deleteVocabulary(ids);
    // Refresh the current page; if it's now empty go back one page
    const remaining = (vocabData?.total ?? 0) - ids.length;
    const newPage = Math.min(vocabPage, Math.max(1, Math.ceil(remaining / 20)));
    if (newPage !== vocabPage) {
      setVocabPage(newPage);
    } else {
      setVocabLoading(true);
      dashboardApi
        .getVocabulary(vocabPage, 20)
        .then((res) => setVocabData(res.data))
        .catch(() => {})
        .finally(() => setVocabLoading(false));
    }
  }

  // Load grammar when tab activates or page changes
  useEffect(() => {
    if (activeTab !== "grammar") return;
    setGrammarLoading(true);
    dashboardApi
      .getGrammar(grammarPage, 20)
      .then((res) => setGrammarData(res.data))
      .catch(() => {})
      .finally(() => setGrammarLoading(false));
  }, [activeTab, grammarPage]);

  // Load quiz history when tab activates or page changes
  useEffect(() => {
    if (activeTab !== "quiz-history") return;
    setQuizLoading(true);
    dashboardApi
      .getQuizHistory(quizPage, 20)
      .then((res) => setQuizData(res.data))
      .catch(() => {})
      .finally(() => setQuizLoading(false));
  }, [activeTab, quizPage]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1 leading-relaxed break-words">
          Your Bahasa Melayu learning progress at a glance.
        </p>
      </div>

      {/* Error state */}
      {summaryError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {summaryError}
        </div>
      )}

      {/* Tabs */}
      <div className="w-full flex gap-0.5 sm:gap-1 border-b overflow-x-auto scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-medium tracking-wide border-b-2 transition-colors -mb-px whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.id === "vocabulary" && summary && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums">
                {summary.stats.vocabulary_count}
              </span>
            )}
            {tab.id === "grammar" && summary && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums">
                {summary.stats.grammar_count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview tab ───────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-3">
          {summaryLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full rounded-lg" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-36 w-full rounded-xl" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <Skeleton className="h-44 rounded-xl" />
                <Skeleton className="h-44 rounded-xl" />
              </div>
            </div>
          ) : summary ? (
            <>
              {/* BPS bar — slim, moved above stats */}
              <div className="rounded-lg border bg-background px-3 py-2">
                <BPSProgressBar level={summary.stats.proficiency_level} />
              </div>

              {/* Stats cards — compact 4×2 */}
              <StatsCards stats={summary.stats} />

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                  Continue Learning
                </Link>
                <Link
                  href="/quiz/adaptive"
                  className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
                >
                  <Zap className="w-3.5 h-3.5 flex-shrink-0" />
                  Take Quiz
                </Link>
                <Link
                  href="/chatbot"
                  className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  Chat with AI Tutor
                </Link>
              </div>

              {/* Recent vocabulary — moved up, 5 rows max */}
              {summary.recent_vocabulary.length > 0 && (
                <div className="relative rounded-[1.25rem] border-[0.75px] border-border p-1.5">
                  <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />
                  <div className="relative overflow-hidden rounded-xl border-[0.75px] border-border bg-background px-3 py-2.5 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm tracking-tight">Recently Learned Vocabulary</h3>
                      <button
                        onClick={() => setActiveTab("vocabulary")}
                        className="text-xs text-primary hover:underline"
                      >
                        View all {summary.stats.vocabulary_count} →
                      </button>
                    </div>
                    <VocabularyTable
                      items={summary.recent_vocabulary.slice(0, 5)}
                      total={summary.recent_vocabulary.length}
                    />
                  </div>
                </div>
              )}

              {/* Weak points + recent quiz history side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
                <div className="relative rounded-[1.25rem] border-[0.75px] border-border p-1.5 h-full">
                  <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />
                  <div className="relative overflow-hidden rounded-xl border-[0.75px] border-border bg-background px-3 py-2.5 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] space-y-2">
                    <h3 className="font-semibold text-sm tracking-tight">Weak Points</h3>
                    {summary.top_weak_points.length > 0 ? (
                      <WeakPointsChart weakPoints={summary.top_weak_points.slice(0, 4)} />
                    ) : (
                      <p className="text-sm text-muted-foreground py-1">
                        No weak points yet — complete a quiz to see results.
                      </p>
                    )}
                  </div>
                </div>

                <div className="relative rounded-[1.25rem] border-[0.75px] border-border p-1.5 h-full">
                  <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />
                  <div className="relative overflow-hidden rounded-xl border-[0.75px] border-border bg-background px-3 py-2.5 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] space-y-2">
                    <h3 className="font-semibold text-sm tracking-tight">Recent Quiz Attempts</h3>
                    <QuizHistoryTable
                      items={summary.recent_quiz_history.slice(0, 4)}
                      total={summary.stats.quizzes_taken}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ── Vocabulary tab ─────────────────────────────────────────────────── */}
      {activeTab === "vocabulary" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">All Vocabulary</h2>
          <VocabularyTable
            items={vocabData?.items ?? []}
            total={vocabData?.total ?? 0}
            page={vocabPage}
            limit={20}
            loading={vocabLoading}
            onPageChange={(p) => setVocabPage(p)}
            onDelete={handleVocabDelete}
          />
        </div>
      )}

      {/* ── Grammar tab ────────────────────────────────────────────────────── */}
      {activeTab === "grammar" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">All Grammar Rules</h2>
          <GrammarTable
            items={grammarData?.items ?? []}
            total={grammarData?.total ?? 0}
            page={grammarPage}
            limit={20}
            loading={grammarLoading}
            onPageChange={(p) => setGrammarPage(p)}
          />
        </div>
      )}

      {/* ── Quiz history tab ───────────────────────────────────────────────── */}
      {activeTab === "quiz-history" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Quiz History</h2>
          <QuizHistoryTable
            items={quizData?.items ?? []}
            total={quizData?.total ?? 0}
            page={quizPage}
            limit={20}
            loading={quizLoading}
            onPageChange={(p) => setQuizPage(p)}
          />
        </div>
      )}
    </div>
  );
}
