"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Link from "next/link";
import { BookOpen, Zap, MessageCircle } from "lucide-react";

import { dashboardApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { SpeakerButton } from "@/components/ui/SpeakerButton";
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
const VocabularyTable = dynamic(() => import("@/components/dashboard/VocabularyTable"), { ssr: false });
const WeakPointsChart = dynamic(() => import("@/components/dashboard/WeakPointsChart"), { ssr: false });
const GlowCard = dynamic(
  () => import("@/components/ui/glow-card").then((m) => ({ default: m.GlowCard })),
  { ssr: false, loading: () => null }
);
const GlowingEffect = dynamic(
  () => import("@/components/ui/glowing-effect").then((m) => ({ default: m.GlowingEffect })),
  { ssr: false, loading: () => null }
);

// ── SVG Progress Ring ─────────────────────────────────────────────────────────

function ProgressRing({
  pct,
  color,
  trackColor = "rgba(128,128,128,0.15)",
  centerValue,
  centerSub,
  label,
}: {
  pct: number;
  color: string;
  trackColor?: string;
  centerValue: string;
  centerSub?: string;
  label: string;
}) {
  const r = 44;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * r; // ≈ 276.46
  const clamped = Math.min(100, Math.max(0, pct));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-[72px] h-[72px] sm:w-[90px] sm:h-[90px] lg:w-[108px] lg:h-[108px]">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={trackColor}
            strokeWidth="9"
          />
          {/* Progress arc */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="text-base sm:text-lg lg:text-xl font-bold tabular-nums leading-none">
            {centerValue}
          </span>
          {centerSub && (
            <span className="text-[8px] sm:text-[9px] text-muted-foreground leading-tight text-center px-1">
              {centerSub}
            </span>
          )}
        </div>
      </div>
      <p className="text-[10px] sm:text-xs font-medium text-center text-muted-foreground leading-tight">
        {label}
      </p>
    </div>
  );
}

// ── Compact vocabulary preview (no search bar) ────────────────────────────────

function VocabPreview({
  items,
  totalCount,
  onViewAll,
}: {
  items: VocabularyEntry[];
  totalCount: number;
  onViewAll: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight">Recently Learned Vocabulary</h3>
        <button onClick={onViewAll} className="text-xs text-primary hover:underline">
          View all {totalCount} →
        </button>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full divide-y divide-border text-xs">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-1.5 text-left font-medium">Word</th>
              <th className="px-3 py-1.5 text-left font-medium">Meaning</th>
              <th className="px-3 py-1.5 text-left font-medium hidden sm:table-cell">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((v) => (
              <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-3 py-1.5 font-medium">
                  <span className="inline-flex items-center gap-1">
                    {v.word}
                    <SpeakerButton word={v.word} size="xs" />
                  </span>
                </td>
                <td className="px-3 py-1.5 text-muted-foreground">{v.meaning}</td>
                <td className="px-3 py-1.5 hidden sm:table-cell">
                  <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                    v.source_type === "chatbot"
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-accent text-accent-foreground"
                  }`}>
                    {v.source_name}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Grammar table ─────────────────────────────────────────────────────────────

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
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-5 overflow-x-hidden">
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
            <OverviewSkeleton />
          ) : summary ? (
            <OverviewContent
              summary={summary}
              onViewAllVocab={() => setActiveTab("vocabulary")}
            />
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

// ── Loading skeleton ──────────────────────────────────────────────────────────

function OverviewSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-9 w-full rounded-lg" />
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Skeleton className="h-[148px] sm:h-[168px] rounded-[1.25rem]" />
        <Skeleton className="h-[148px] sm:h-[168px] rounded-[1.25rem]" />
        <Skeleton className="h-[148px] sm:h-[168px] rounded-[1.25rem]" />
      </div>
      <Skeleton className="h-6 w-3/4 mx-auto rounded-md" />
      <div className="flex gap-2 flex-wrap">
        <Skeleton className="h-9 w-40 rounded-full" />
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-40 rounded-full" />
      </div>
      <Skeleton className="h-[180px] w-full rounded-[1.25rem]" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Skeleton className="h-[152px] rounded-[1.25rem]" />
        <Skeleton className="h-[152px] rounded-[1.25rem]" />
      </div>
    </div>
  );
}

// ── Overview content (extracted to reduce nesting) ────────────────────────────

function OverviewContent({
  summary,
  onViewAllVocab,
}: {
  summary: DashboardSummary;
  onViewAllVocab: () => void;
}) {
  const { stats, recent_vocabulary, recent_quiz_history, top_weak_points } = summary;

  // ── Ring 1: Learning Progress ─────────────────────────────────────────────
  const target = Math.max(stats.courses_created * 10, 10);
  const learningPct =
    stats.courses_created === 0
      ? 0
      : Math.min(100, Math.round((stats.classes_completed / target) * 100));

  // ── Ring 2: Vocabulary ────────────────────────────────────────────────────
  const vocabTarget = 100;
  const vocabPct = Math.min(100, Math.round((stats.vocabulary_count / vocabTarget) * 100));

  // ── Ring 3: Quiz Performance ──────────────────────────────────────────────
  const avgScore =
    recent_quiz_history.length > 0
      ? Math.round(
          recent_quiz_history.reduce((s, a) => s + a.score_percent, 0) /
            recent_quiz_history.length
        )
      : null;

  const RING_COLORS = {
    learning: "#6C5CE7",
    vocab: "#22c55e",
    quiz: "#F58623",
  };

  return (
    <>
      {/* 1. BPS bar — subtle background strip */}
      <div className="rounded-lg bg-muted/40 px-3 py-2 flex items-center">
        <BPSProgressBar level={stats.proficiency_level} />
      </div>

      {/* 2. Three progress rings */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Ring 1: Learning Progress */}
        <GlowCard className="py-3 px-2 sm:py-4 sm:px-3 flex flex-col items-center justify-center gap-1">
          <ProgressRing
            pct={learningPct}
            color={RING_COLORS.learning}
            centerValue={`${learningPct}%`}
            centerSub={stats.classes_completed > 0 ? `${stats.classes_completed} done` : "start now"}
            label="Learning Progress"
          />
        </GlowCard>

        {/* Ring 2: Vocabulary */}
        <GlowCard className="py-3 px-2 sm:py-4 sm:px-3 flex flex-col items-center justify-center gap-1">
          <ProgressRing
            pct={vocabPct}
            color={RING_COLORS.vocab}
            centerValue={String(stats.vocabulary_count)}
            centerSub="words"
            label={`Vocabulary / ${vocabTarget}`}
          />
        </GlowCard>

        {/* Ring 3: Quiz Performance */}
        <GlowCard className="py-3 px-2 sm:py-4 sm:px-3 flex flex-col items-center justify-center gap-1">
          <ProgressRing
            pct={avgScore ?? 0}
            color={RING_COLORS.quiz}
            centerValue={avgScore !== null ? `${avgScore}%` : "—"}
            centerSub={avgScore !== null ? "avg score" : "no quizzes"}
            label="Quiz Performance"
          />
        </GlowCard>
      </div>

      {/* 3. Inline stats row */}
      <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground py-0.5">
        <span>🔥 {stats.streak_count} streak</span>
        <span>⭐ {stats.xp_total} XP</span>
        <span>📚 {stats.courses_created} course{stats.courses_created !== 1 ? "s" : ""}</span>
        <span>📝 {stats.quizzes_taken} quiz{stats.quizzes_taken !== 1 ? "zes" : ""}</span>
        <span>✏️ {stats.grammar_count} grammar rule{stats.grammar_count !== 1 ? "s" : ""}</span>
      </div>

      {/* 4. Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {[
          { href: "/courses",       icon: <BookOpen className="w-3.5 h-3.5" />, label: "Continue Learning"  },
          { href: "/quiz/adaptive", icon: <Zap className="w-3.5 h-3.5" />,     label: "Take Quiz"           },
          { href: "/chatbot",       icon: <MessageCircle className="w-3.5 h-3.5" />, label: "Chat with AI Tutor" },
        ].map(({ href, icon, label }) => (
          <div
            key={href}
            className="relative rounded-full border-[0.75px] border-border p-[3px]"
          >
            <GlowingEffect spread={30} glow={true} disabled={false} proximity={48} inactiveZone={0.01} borderWidth={2} />
            <Link
              href={href}
              className="relative flex items-center gap-1.5 rounded-full border-[0.75px] border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              {icon}
              {label}
            </Link>
          </div>
        ))}
      </div>

      {/* 5. Recently Learned Vocabulary */}
      {recent_vocabulary.length > 0 && (
        <GlowCard className="px-3 py-3">
          <VocabPreview
            items={recent_vocabulary.slice(0, 5)}
            totalCount={stats.vocabulary_count}
            onViewAll={onViewAllVocab}
          />
        </GlowCard>
      )}

      {/* 6. Weak Points + Recent Quizzes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
        <GlowCard outerClassName="h-full" className="px-3 py-2.5 space-y-2">
          <h3 className="font-semibold text-sm tracking-tight">Weak Points</h3>
          {top_weak_points.length > 0 ? (
            <WeakPointsChart weakPoints={top_weak_points.slice(0, 4)} />
          ) : (
            <p className="text-sm text-muted-foreground py-1">
              No data yet — complete a quiz to see results.
            </p>
          )}
        </GlowCard>

        <GlowCard outerClassName="h-full" className="px-3 py-2.5 space-y-2">
          <h3 className="font-semibold text-sm tracking-tight">Recent Quiz Attempts</h3>
          <QuizHistoryTable
            items={recent_quiz_history.slice(0, 4)}
            total={stats.quizzes_taken}
          />
        </GlowCard>
      </div>
    </>
  );
}
