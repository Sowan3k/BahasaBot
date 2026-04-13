"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  RotateCcw,
  Eye,
  EyeOff,
  BookOpen,
  MessageSquare,
  Brain,
  Flame,
  Star,
  User as UserIcon,
  Shield,
  Globe,
  Zap,
  BarChart2,
  type LucideIcon,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { adminApi, profileApi } from "@/lib/api";
import type { AdminUserDetail, AdminUserAnalytics } from "@/lib/types";
import { GlowCard } from "@/components/ui/glow-card";

const BPS_COLORS: Record<string, string> = {
  "BPS-1": "bg-muted text-muted-foreground",
  "BPS-2": "bg-secondary text-secondary-foreground",
  "BPS-3": "bg-accent text-accent-foreground",
  "BPS-4": "bg-primary text-primary-foreground",
};

const FEATURE_LABELS: Record<string, string> = {
  chatbot: "AI Tutor",
  course_gen: "Course Gen",
  module_quiz: "Module Quiz",
  standalone_quiz: "Adaptive Quiz",
  spelling_game: "Spelling Game",
};

// ── Password Confirmation Modal ───────────────────────────────────────────────

interface ConfirmModalProps {
  action: "delete" | "reset";
  userName: string;
  onConfirm: (password: string) => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}

function ConfirmModal({ action, userName, onConfirm, onCancel, loading, error }: ConfirmModalProps) {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const isDelete = action === "delete";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDelete ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
            {isDelete ? <Trash2 size={20} className="text-red-600 dark:text-red-400" /> : <RotateCcw size={20} className="text-amber-600 dark:text-amber-400" />}
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-foreground">
              {isDelete ? "Delete User Account" : "Reset User Data"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isDelete
                ? `Permanently delete "${userName}"'s account and all data. This cannot be undone.`
                : `Clear all learning data for "${userName}" and reset BPS level to BPS-1. Account login is kept.`}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Confirm with your admin password
          </label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && password && onConfirm(password)}
              className="w-full px-4 py-2.5 pr-10 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
            <button type="button" onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && (
            <p className="flex items-center gap-1.5 text-xs text-destructive mt-1">
              <AlertTriangle size={12} /> {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-1">
          <button onClick={onCancel} disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={() => onConfirm(password)} disabled={!password || loading}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${isDelete ? "bg-red-600 hover:bg-red-700 text-white" : "bg-amber-500 hover:bg-amber-600 text-white"}`}>
            {loading ? "Processing…" : isDelete ? "Delete Account" : "Reset Data"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Small stat pill ───────────────────────────────────────────────────────────

function StatPill({ icon: Icon, label, value, color }: {
  icon: LucideIcon;
  label: string; value: number; color: string;
}) {
  return (
    <GlowCard className="bg-card p-4 flex flex-col items-center gap-1 text-center">
      <Icon size={18} className={color} />
      <p className="font-heading text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </GlowCard>
  );
}

// ── Feature breakdown bar ─────────────────────────────────────────────────────

function FeatureBreakdown({ data, colorClass }: { data: Record<string, number>; colorClass: string }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map((e) => e[1]), 1);
  if (entries.length === 0) return <p className="text-xs text-muted-foreground italic">No data yet</p>;
  return (
    <div className="space-y-2">
      {entries.map(([feat, val]) => (
        <div key={feat} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-28 shrink-0 truncate">
            {FEATURE_LABELS[feat] ?? feat}
          </span>
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full ${colorClass} transition-all duration-500`}
              style={{ width: `${Math.round((val / max) * 100)}%` }} />
          </div>
          <span className="text-xs font-medium text-foreground w-12 text-right">{val.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ── Custom chart tooltip ──────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-semibold text-foreground">
          {p.name}: <span className="text-primary">{p.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [analytics, setAnalytics] = useState<AdminUserAnalytics | null>(null);
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<"delete" | "reset" | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Guard + load profile
  useEffect(() => {
    profileApi.getProfile()
      .then((res) => { if (res.data.role !== "admin") router.replace("/dashboard"); })
      .catch(() => router.replace("/dashboard"));
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    adminApi.getUserDetail(userId)
      .then((res) => setUser(res.data))
      .catch(() => setError("Failed to load user details"))
      .finally(() => setLoading(false));
  }, [userId]);

  // Load analytics (re-fetches when days selector changes)
  useEffect(() => {
    if (!userId) return;
    setAnalyticsLoading(true);
    adminApi.getUserAnalytics(userId, analyticsDays)
      .then((res) => setAnalytics(res.data))
      .catch(() => setAnalytics(null))
      .finally(() => setAnalyticsLoading(false));
  }, [userId, analyticsDays]);

  async function handleConfirm(password: string) {
    if (!modal || !userId) return;
    setModalLoading(true);
    setModalError(null);
    try {
      if (modal === "delete") {
        await adminApi.deleteUser(userId, password);
        router.push("/admin/users");
      } else {
        const res = await adminApi.resetUserData(userId, password);
        setUser((prev) => prev ? {
          ...prev,
          proficiency_level: res.data.proficiency_level as AdminUserDetail["proficiency_level"],
          streak_count: 0, xp_total: 0,
          stats: { ...prev.stats, courses_count: 0, classes_completed: 0, vocab_count: 0,
            grammar_count: 0, module_quiz_attempts: 0, standalone_quiz_attempts: 0,
            chat_sessions: 0, weak_points: 0 },
          recent_courses: [],
        } : prev);
        setModal(null);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        ?? "Action failed. Check your password and try again.";
      setModalError(msg === "Incorrect admin password" ? "Incorrect password. Please try again." : msg);
    } finally {
      setModalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-40 rounded-2xl bg-muted animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/10">
          <AlertTriangle size={18} className="text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error ?? "User not found"}</p>
        </div>
      </div>
    );
  }

  const tok = analytics?.token_usage;
  const act = analytics?.activity;

  // Format date labels for charts — show only day/month to keep them short
  const fmtDate = (d: string) => {
    const dt = new Date(d);
    return `${dt.getDate()}/${dt.getMonth() + 1}`;
  };

  const tokenChartData = tok?.daily.map((d) => ({ ...d, date: fmtDate(d.date) })) ?? [];
  const activityChartData = act?.daily.map((d) => ({ ...d, date: fmtDate(d.date) })) ?? [];

  // Sparse x-axis: show ~7 labels
  const tickInterval = Math.max(1, Math.floor(tokenChartData.length / 7));

  return (
    <>
      {modal && (
        <ConfirmModal action={modal} userName={user.name}
          onConfirm={handleConfirm}
          onCancel={() => { setModal(null); setModalError(null); }}
          loading={modalLoading} error={modalError} />
      )}

      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin/users" className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">{user.name}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          {user.role !== "admin" && (
            <div className="flex items-center gap-2">
              <button onClick={() => { setModal("reset"); setModalError(null); }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold border border-amber-400/40 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                <RotateCcw size={14} /> Reset Data
              </button>
              <button onClick={() => { setModal("delete"); setModalError(null); }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>

        {/* ── Profile card ── */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold shrink-0">
              {user.name[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${BPS_COLORS[user.proficiency_level] ?? "bg-muted text-muted-foreground"}`}>
                  {user.proficiency_level}
                </span>
                {user.role === "admin" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                    <Shield size={11} /> Admin
                  </span>
                )}
                {user.is_active
                  ? <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium"><CheckCircle size={12} /> Active</span>
                  : <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium"><XCircle size={12} /> Inactive</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Joined {new Date(user.created_at).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" })}
                {" · "}{user.provider === "google" ? "Google OAuth" : "Email + Password"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm pt-1">
            {[
              { icon: UserIcon, label: "Native Language", value: user.native_language ?? "—" },
              { icon: Globe, label: "Learning Goal", value: user.learning_goal ?? "—" },
              { icon: Flame, label: "Streak", value: `${user.streak_count} days` },
              { icon: Star, label: "XP Total", value: `${user.xp_total} XP` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-muted/50">
                <Icon size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium text-foreground">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Activity stats ── */}
        <div>
          <h2 className="font-heading text-base font-semibold text-foreground mb-3">Learning Activity</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatPill icon={BookOpen} label="Courses" value={user.stats.courses_count} color="text-green-500" />
            <StatPill icon={BookOpen} label="Classes Done" value={user.stats.classes_completed} color="text-primary" />
            <StatPill icon={Brain} label="Words Learned" value={user.stats.vocab_count} color="text-purple-500" />
            <StatPill icon={Brain} label="Grammar Rules" value={user.stats.grammar_count} color="text-pink-500" />
            <StatPill icon={Brain} label="Module Quizzes" value={user.stats.module_quiz_attempts} color="text-amber-500" />
            <StatPill icon={Brain} label="Adaptive Quizzes" value={user.stats.standalone_quiz_attempts} color="text-orange-500" />
            <StatPill icon={MessageSquare} label="Chat Sessions" value={user.stats.chat_sessions} color="text-cyan-500" />
            <StatPill icon={AlertTriangle} label="Weak Points" value={user.stats.weak_points} color="text-red-400" />
          </div>
        </div>

        {/* ── Analytics section ── */}
        <div className="space-y-6">
          {/* Header + days selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 size={18} className="text-primary" />
              <h2 className="font-heading text-base font-semibold text-foreground">Usage Analytics</h2>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
              {[7, 14, 30, 60, 90].map((d) => (
                <button key={d} onClick={() => setAnalyticsDays(d)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${analyticsDays === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {analyticsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[...Array(4)].map((_, i) => <div key={i} className="h-52 rounded-2xl bg-muted animate-pulse" />)}
            </div>
          ) : !analytics ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Analytics data unavailable.</div>
          ) : (
            <div className="space-y-5">

              {/* ── Row 1: Token totals + Activity totals ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Tokens Used", value: tok!.total_tokens.toLocaleString(), icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500/10" },
                  { label: "Input Tokens", value: tok!.total_input_tokens.toLocaleString(), icon: Zap, color: "text-ring", bg: "bg-secondary" },
                  { label: "Output Tokens", value: tok!.total_output_tokens.toLocaleString(), icon: Zap, color: "text-purple-500", bg: "bg-purple-500/10" },
                  { label: "Total Activities", value: act!.total_events.toLocaleString(), icon: BarChart2, color: "text-green-500", bg: "bg-green-500/10" },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <GlowCard key={label} className="bg-card p-4 flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                      <Icon size={18} className={color} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-heading text-lg font-bold text-foreground">{value}</p>
                    </div>
                  </GlowCard>
                ))}
              </div>

              {/* ── Row 2: Daily tokens line chart + Daily activity bar chart ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Token line chart */}
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-sm font-semibold text-foreground mb-4">Daily Token Usage</p>
                  {tokenChartData.every((d) => d.tokens === 0) ? (
                    <div className="h-40 flex items-center justify-center text-xs text-muted-foreground italic">
                      No token data in this period. Use the chatbot or generate a course to see data here.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={tokenChartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={tickInterval} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Line type="monotone" dataKey="tokens" name="Tokens" stroke="#6d28d9" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Activity bar chart */}
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-sm font-semibold text-foreground mb-4">Daily Activity Events</p>
                  {activityChartData.every((d) => d.events === 0) ? (
                    <div className="h-40 flex items-center justify-center text-xs text-muted-foreground italic">
                      No activity data in this period yet.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={activityChartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={tickInterval} />
                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="events" name="Events" fill="#059669" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* ── Row 3: Feature breakdowns ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-sm font-semibold text-foreground mb-4">Tokens by Feature</p>
                  <FeatureBreakdown
                    data={Object.fromEntries(Object.entries(tok!.by_feature).map(([k, v]) => [k, v.total]))}
                    colorClass="bg-purple-500"
                  />
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-sm font-semibold text-foreground mb-4">Activity by Feature</p>
                  <FeatureBreakdown data={act!.by_feature} colorClass="bg-green-500" />
                </div>
              </div>

            </div>
          )}
        </div>

        {/* ── Recent courses ── */}
        {user.recent_courses.length > 0 && (
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground mb-3">Recent Courses</h2>
            <GlowCard className="bg-card divide-y divide-border overflow-hidden !rounded-xl">
              {user.recent_courses.map((course) => (
                <div key={course.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{course.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{course.topic}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(course.created_at).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
              ))}
            </GlowCard>
          </div>
        )}

      </div>
    </>
  );
}
