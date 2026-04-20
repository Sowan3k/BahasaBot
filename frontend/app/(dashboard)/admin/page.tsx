"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Users,
  BookOpen,
  ClipboardList,
  Map,
  Star,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { adminApi, profileApi, tipsApi } from "@/lib/api";
import type { AdminStats, Tip, TipCategory } from "@/lib/types";
import { GlowCard } from "@/components/ui/glow-card";
import { Skeleton } from "@/components/ui/skeleton";

// ── Admin sub-sections ────────────────────────────────────────────────────────

const ADMIN_SECTIONS = [
  {
    href: "/admin/users",
    icon: Users,
    label: "User Management",
    description: "View all registered users, BPS levels, and deactivate accounts",
    color: "text-primary",
    bg: "bg-secondary",
  },
  {
    href: "/admin/feedback",
    icon: ClipboardList,
    label: "User Feedback",
    description: "View quiz survey responses and general feedback submitted by users",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    href: "/admin/journeys",
    icon: Map,
    label: "User Journeys",
    description: "Read-only view of all user learning roadmaps, progress, and deadlines",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    href: "/admin/leaderboard",
    icon: Trophy,
    label: "Weekly Leaderboard",
    description: "Top users ranked by XP earned this week — resets every Monday",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
] as const;

// ── Category display helpers ───────────────────────────────────────────────────

const CATEGORY_OPTIONS: { value: TipCategory; label: string; emoji: string }[] = [
  { value: "word_origin", label: "Word Origin", emoji: "🌱" },
  { value: "common_mistakes", label: "Common Mistakes", emoji: "⚠️" },
  { value: "cultural_context", label: "Cultural Context", emoji: "🎭" },
  { value: "grammar", label: "Grammar", emoji: "📝" },
];

function categoryLabel(cat: string): string {
  return CATEGORY_OPTIONS.find((c) => c.value === cat)?.label ?? cat;
}
function categoryEmoji(cat: string): string {
  return CATEGORY_OPTIONS.find((c) => c.value === cat)?.emoji ?? "💡";
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  sub,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bg: string;
  sub?: string;
}) {
  return (
    <GlowCard className="bg-card p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
        <Icon size={22} className={color} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="font-heading text-2xl font-bold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </GlowCard>
  );
}

// ── Language Tips panel ───────────────────────────────────────────────────────

type TipsTab = "all" | "generate";

function LanguageTipsPanel() {
  const [tab, setTab] = useState<TipsTab>("all");

  // ── All Tips tab state ────────────────────────────────────────────────────
  const [tips, setTips] = useState<Tip[]>([]);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [tipsError, setTipsError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterActive, setFilterActive] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toggling, setToggling] = useState<string | null>(null);

  // ── Generate tab state ────────────────────────────────────────────────────
  const [genCategory, setGenCategory] = useState<TipCategory>("word_origin");
  const [genCount, setGenCount] = useState(5);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genResult, setGenResult] = useState<{ saved: number; category: string } | null>(null);
  const [preview, setPreview] = useState<string[]>([]);

  // ── Fetch tips ────────────────────────────────────────────────────────────

  const fetchTips = async (p = page) => {
    setTipsLoading(true);
    setTipsError(null);
    try {
      const active =
        filterActive === "true" ? true : filterActive === "false" ? false : undefined;
      const res = await tipsApi.getAll(p, 10, filterCategory || undefined, active);
      setTips(res.data.items);
      setTotalPages(res.data.total_pages);
    } catch {
      setTipsError("Failed to load tips");
    } finally {
      setTipsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "all") fetchTips(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, filterCategory, filterActive]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchTips(p);
  };

  // ── Toggle is_active ──────────────────────────────────────────────────────

  const handleToggle = async (tip: Tip) => {
    setToggling(tip.id);
    try {
      await tipsApi.update(tip.id, { is_active: !tip.is_active });
      setTips((prev) =>
        prev.map((t) => (t.id === tip.id ? { ...t, is_active: !t.is_active } : t))
      );
    } catch {
      // Silently ignore — UI stays unchanged
    } finally {
      setToggling(null);
    }
  };

  // ── Generate tips ─────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    setGenLoading(true);
    setGenError(null);
    setGenResult(null);
    setPreview([]);
    try {
      const res = await tipsApi.generate({ category: genCategory, count: genCount });
      setGenResult(res.data);
      // Refresh "All Tips" list so the new tips appear immediately
      if (tab === "all") fetchTips(1);
    } catch (err: any) {
      setGenError(err?.response?.data?.detail ?? "Generation failed — please try again");
    } finally {
      setGenLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
          <Lightbulb size={18} className="text-violet-500" />
        </div>
        <div>
          <h2 className="font-heading text-base font-semibold text-foreground">Language Tips</h2>
          <p className="text-xs text-muted-foreground">Daily Bahasa Melayu tips shown to users</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-4 p-1 rounded-lg bg-muted/60 w-fit border border-border/40">
        {(["all", "generate"] as TipsTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
              tab === t
                ? "bg-card text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {t === "all" ? "All Tips" : "Generate New"}
          </button>
        ))}
      </div>

      {/* ── All Tips tab ── */}
      {tab === "all" && (
        <GlowCard className="bg-card overflow-hidden">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 p-4 border-b border-border/50">
            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
              className="text-sm rounded-lg border border-border bg-background text-foreground px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">All categories</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>

            <select
              value={filterActive}
              onChange={(e) => { setFilterActive(e.target.value); setPage(1); }}
              className="text-sm rounded-lg border border-border bg-background text-foreground px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Any status</option>
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
            </select>

            <button
              onClick={() => fetchTips(page)}
              disabled={tipsLoading}
              className="ml-auto flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 disabled:opacity-50"
            >
              <RefreshCw size={14} className={tipsLoading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Error */}
          {tipsError && (
            <div className="flex items-center gap-2 px-4 py-3 bg-destructive/10 border-b border-destructive/20">
              <AlertTriangle size={14} className="text-destructive shrink-0" />
              <p className="text-sm text-destructive">{tipsError}</p>
            </div>
          )}

          {/* Table */}
          {tipsLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : tips.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <Lightbulb size={32} className="opacity-30" />
              <p className="text-sm">No tips found. Switch to "Generate New" to create some.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {tips.map((tip) => (
                <div
                  key={tip.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
                >
                  {/* Category badge */}
                  <span className="shrink-0 mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: "rgba(108,92,231,0.12)", color: "#6C5CE7" }}>
                    <span>{categoryEmoji(tip.category)}</span>
                    <span className="hidden sm:inline">{categoryLabel(tip.category)}</span>
                  </span>

                  {/* Content */}
                  <p className="flex-1 text-sm text-foreground/90 leading-relaxed line-clamp-2">
                    {tip.content}
                  </p>

                  {/* Date */}
                  <span className="shrink-0 text-[11px] text-muted-foreground hidden sm:block mt-0.5 whitespace-nowrap">
                    {new Date(tip.created_at).toLocaleDateString()}
                  </span>

                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(tip)}
                    disabled={toggling === tip.id}
                    title={tip.is_active ? "Deactivate" : "Activate"}
                    className="shrink-0 mt-0.5 disabled:opacity-50"
                  >
                    {toggling === tip.id ? (
                      <Loader2 size={18} className="animate-spin text-muted-foreground" />
                    ) : tip.is_active ? (
                      <CheckCircle2 size={18} className="text-emerald-500 hover:text-emerald-600 transition-colors" />
                    ) : (
                      <XCircle size={18} className="text-muted-foreground hover:text-destructive transition-colors" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronUp size={14} className="rotate-[-90deg]" />
                Prev
              </button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
              >
                Next
                <ChevronDown size={14} className="rotate-[-90deg]" />
              </button>
            </div>
          )}
        </GlowCard>
      )}

      {/* ── Generate New tab ── */}
      {tab === "generate" && (
        <GlowCard className="bg-card overflow-hidden">
          <div className="p-5 space-y-5">
            {/* Category picker */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setGenCategory(opt.value)}
                    className={[
                      "flex flex-col items-center gap-1.5 rounded-xl border py-3 px-2 text-xs font-medium transition-all",
                      genCategory === opt.value
                        ? "border-primary/60 bg-primary/10 text-primary shadow-sm"
                        : "border-border/60 bg-card text-muted-foreground hover:border-border hover:text-foreground hover:bg-muted/40",
                    ].join(" ")}
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Count */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Number of tips to generate{" "}
                <span className="text-muted-foreground font-normal">(1–10)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={genCount}
                  onChange={(e) => setGenCount(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="w-10 text-center rounded-lg border border-border bg-muted/40 py-1 text-sm font-semibold text-foreground">
                  {genCount}
                </span>
              </div>
            </div>

            {/* Error */}
            {genError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5">
                <AlertTriangle size={14} className="text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{genError}</p>
              </div>
            )}

            {/* Success */}
            {genResult && !genLoading && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                <Sparkles size={16} className="text-emerald-500 shrink-0" />
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  Successfully saved {genResult.saved} tip{genResult.saved !== 1 ? "s" : ""}!
                  Switch to "All Tips" to see them.
                </p>
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={genLoading}
              className={[
                "w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all",
                "text-white shadow-md",
                genLoading
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:opacity-90 active:scale-[0.98]",
              ].join(" ")}
              style={{
                background: "linear-gradient(135deg, #6C5CE7, #a29bfe)",
              }}
            >
              {genLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating with Gemini…
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate {genCount} Tip{genCount !== 1 ? "s" : ""}
                </>
              )}
            </button>

            <p className="text-xs text-muted-foreground text-center">
              Tips are saved immediately and the daily cache resets so a new tip can surface today.
            </p>
          </div>
        </GlowCard>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fire both requests in parallel — eliminates the sequential waterfall.
    // If the stats request returns 403, the user is not an admin and we redirect.
    Promise.allSettled([profileApi.getProfile(), adminApi.getStats()])
      .then(([profileResult, statsResult]) => {
        if (profileResult.status === "rejected") {
          setError("Failed to load admin data");
          return;
        }
        if (profileResult.value.data.role !== "admin") {
          router.replace("/dashboard");
          return;
        }
        if (statsResult.status === "fulfilled") {
          setStats(statsResult.value.data);
        } else {
          setError("Failed to load admin stats");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-36 rounded" />
            <Skeleton className="h-4 w-52 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/10">
          <AlertTriangle size={20} className="text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ShieldCheck size={22} className="text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">System overview and user management</p>
        </div>
      </div>

      {/* ── Stats grid ── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Total Users"
            value={stats.total_users}
            icon={Users}
            color="text-primary"
            bg="bg-secondary"
            sub={`${stats.active_users} active`}
          />
          <StatCard
            label="Courses Generated"
            value={stats.total_courses_generated}
            icon={BookOpen}
            color="text-green-500"
            bg="bg-green-500/10"
          />
          <StatCard
            label="Quiz Pass Rate"
            value={`${stats.quiz_pass_rate}%`}
            icon={TrendingUp}
            color="text-purple-500"
            bg="bg-purple-500/10"
            sub={`${stats.total_quiz_attempts} attempts`}
          />
          <StatCard
            label="Feedback Responses"
            value={stats.feedback_count}
            icon={ClipboardList}
            color="text-amber-500"
            bg="bg-amber-500/10"
          />
          <StatCard
            label="Avg Rating"
            value={stats.avg_feedback_rating !== null ? `${stats.avg_feedback_rating} / 5` : "—"}
            icon={Star}
            color="text-orange-500"
            bg="bg-orange-500/10"
          />
          <StatCard
            label="Active Roadmaps"
            value={stats.active_roadmaps ?? 0}
            icon={Map}
            color="text-teal-500"
            bg="bg-teal-500/10"
            sub="users with a journey plan"
          />
          <StatCard
            label="Inactive Users"
            value={stats.total_users - stats.active_users}
            icon={Users}
            color="text-red-500"
            bg="bg-red-500/10"
          />
        </div>
      )}

      {/* ── Navigation cards ── */}
      <div>
        <h2 className="font-heading text-base font-semibold text-foreground mb-3">Sections</h2>
        <GlowCard className="bg-card divide-y divide-border overflow-hidden !rounded-xl">
          {ADMIN_SECTIONS.map(({ href, icon: Icon, label, description, color, bg }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors group"
            >
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                <Icon size={20} className={color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </div>
              <ChevronRight
                size={16}
                className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0"
              />
            </Link>
          ))}
        </GlowCard>
      </div>

      {/* ── Language Tips ── */}
      <LanguageTipsPanel />
    </div>
  );
}
