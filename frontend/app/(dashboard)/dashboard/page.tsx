"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

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
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Summary (overview tab)
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

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

  // Load summary on mount
  useEffect(() => {
    setSummaryLoading(true);
    dashboardApi
      .getSummary()
      .then((res) => setSummary(res.data))
      .catch(() => setSummaryError("Failed to load dashboard. Please refresh the page."))
      .finally(() => setSummaryLoading(false));
  }, []);

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
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 leading-relaxed">
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
      <div className="flex gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium tracking-wide border-b-2 transition-colors -mb-px ${
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
        <div className="space-y-6">
          {summaryLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-24 w-full rounded-xl" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
              </div>
            </div>
          ) : summary ? (
            <>
              {/* Stats cards */}
              <StatsCards stats={summary.stats} />

              {/* CEFR progress */}
              <div className="relative rounded-[1.25rem] border-[0.75px] border-border p-2">
                <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />
                <div className="relative overflow-hidden rounded-xl border-[0.75px] border-border bg-background p-5 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)]">
                  <BPSProgressBar level={summary.stats.proficiency_level} />
                </div>
              </div>

              {/* Weak points + recent quiz history side by side on wider screens */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="relative rounded-[1.25rem] border-[0.75px] border-border p-2 h-full">
                  <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />
                  <div className="relative overflow-hidden rounded-xl border-[0.75px] border-border bg-background p-5 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] space-y-3">
                    <h3 className="font-semibold text-base tracking-tight">Weak Points</h3>
                    {summary.top_weak_points.length > 0 ? (
                      <WeakPointsChart weakPoints={summary.top_weak_points} />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No weak points yet — complete some quizzes to see results here.
                      </p>
                    )}
                  </div>
                </div>

                <div className="relative rounded-[1.25rem] border-[0.75px] border-border p-2 h-full">
                  <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />
                  <div className="relative overflow-hidden rounded-xl border-[0.75px] border-border bg-background p-5 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] space-y-3">
                    <h3 className="font-semibold text-base tracking-tight">Recent Quiz Attempts</h3>
                    <QuizHistoryTable
                      items={summary.recent_quiz_history}
                      total={summary.stats.quizzes_taken}
                    />
                  </div>
                </div>
              </div>

              {/* Recent vocabulary preview */}
              {summary.recent_vocabulary.length > 0 && (
                <div className="relative rounded-[1.25rem] border-[0.75px] border-border p-2">
                  <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />
                  <div className="relative overflow-hidden rounded-xl border-[0.75px] border-border bg-background p-5 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-base tracking-tight">Recently Learned Vocabulary</h3>
                      <button
                        onClick={() => setActiveTab("vocabulary")}
                        className="text-sm text-primary hover:underline"
                      >
                        View all {summary.stats.vocabulary_count} →
                      </button>
                    </div>
                    <VocabularyTable
                      items={summary.recent_vocabulary}
                      total={summary.recent_vocabulary.length}
                    />
                  </div>
                </div>
              )}
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
