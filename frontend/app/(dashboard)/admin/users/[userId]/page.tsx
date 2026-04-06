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
} from "lucide-react";
import { adminApi, profileApi } from "@/lib/api";
import type { AdminUserDetail } from "@/lib/types";

const BPS_COLORS: Record<string, string> = {
  "BPS-1": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "BPS-2": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "BPS-3": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "BPS-4": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
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
  const title = isDelete ? "Delete User Account" : "Reset User Data";
  const description = isDelete
    ? `This will permanently delete "${userName}"'s account and all associated data. This cannot be undone.`
    : `This will clear all learning data for "${userName}" (courses, vocab, quiz history, chat sessions) and reset their BPS level to BPS-1. Their account login will be kept.`;
  const buttonLabel = isDelete ? "Delete Account" : "Reset Data";
  const buttonClass = isDelete
    ? "bg-red-600 hover:bg-red-700 text-white"
    : "bg-amber-500 hover:bg-amber-600 text-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDelete ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
            {isDelete ? (
              <Trash2 size={20} className="text-red-600 dark:text-red-400" />
            ) : (
              <RotateCcw size={20} className="text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>

        {/* Admin password field */}
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
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && (
            <p className="flex items-center gap-1.5 text-xs text-destructive mt-1">
              <AlertTriangle size={12} /> {error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-1">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(password)}
            disabled={!password || loading}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${buttonClass}`}
          >
            {loading ? "Processing…" : buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────

function StatPill({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 p-4 rounded-xl border border-border bg-card text-center">
      <Icon size={18} className={color} />
      <p className="font-heading text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modal, setModal] = useState<"delete" | "reset" | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Guard + load
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

  // ── Confirm delete ────────────────────────────────────────────────────────
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
        // Update local state to reflect reset
        setUser((prev) =>
          prev
            ? {
                ...prev,
                proficiency_level: res.data.proficiency_level as AdminUserDetail["proficiency_level"],
                streak_count: 0,
                xp_total: 0,
                stats: {
                  ...prev.stats,
                  courses_count: 0,
                  classes_completed: 0,
                  vocab_count: 0,
                  grammar_count: 0,
                  module_quiz_attempts: 0,
                  standalone_quiz_attempts: 0,
                  chat_sessions: 0,
                  weak_points: 0,
                },
                recent_courses: [],
              }
            : prev
        );
        setModal(null);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Action failed. Check your password and try again.";
      setModalError(msg === "Incorrect admin password" ? "Incorrect password. Please try again." : msg);
    } finally {
      setModalLoading(false);
    }
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-40 rounded-2xl bg-muted animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/10">
          <AlertTriangle size={18} className="text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error ?? "User not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Password confirmation modal ── */}
      {modal && (
        <ConfirmModal
          action={modal}
          userName={user.name}
          onConfirm={handleConfirm}
          onCancel={() => { setModal(null); setModalError(null); }}
          loading={modalLoading}
          error={modalError}
        />
      )}

      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin/users" className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">{user.name}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* ── Action buttons (only for non-admin targets) ── */}
          {user.role !== "admin" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setModal("reset"); setModalError(null); }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold border border-amber-400/40 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
              >
                <RotateCcw size={14} />
                Reset Data
              </button>
              <button
                onClick={() => { setModal("delete"); setModalError(null); }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* ── Profile card ── */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Avatar */}
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
                {user.is_active ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                    <CheckCircle size={12} /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium">
                    <XCircle size={12} /> Inactive
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Joined {new Date(user.created_at).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" })}
                {" · "}{user.provider === "google" ? "Google OAuth" : "Email + Password"}
              </p>
            </div>
          </div>

          {/* Profile details */}
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
          <h2 className="font-heading text-base font-semibold text-foreground mb-3">Activity</h2>
          <div className="grid grid-cols-4 gap-3">
            <StatPill icon={BookOpen} label="Courses" value={user.stats.courses_count} color="text-green-500" />
            <StatPill icon={BookOpen} label="Classes Done" value={user.stats.classes_completed} color="text-blue-500" />
            <StatPill icon={Brain} label="Words Learned" value={user.stats.vocab_count} color="text-purple-500" />
            <StatPill icon={Brain} label="Grammar Rules" value={user.stats.grammar_count} color="text-pink-500" />
            <StatPill icon={Brain} label="Module Quizzes" value={user.stats.module_quiz_attempts} color="text-amber-500" />
            <StatPill icon={Brain} label="Adaptive Quizzes" value={user.stats.standalone_quiz_attempts} color="text-orange-500" />
            <StatPill icon={MessageSquare} label="Chat Sessions" value={user.stats.chat_sessions} color="text-cyan-500" />
            <StatPill icon={AlertTriangle} label="Weak Points" value={user.stats.weak_points} color="text-red-400" />
          </div>
        </div>

        {/* ── Recent courses ── */}
        {user.recent_courses.length > 0 && (
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground mb-3">Recent Courses</h2>
            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
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
            </div>
          </div>
        )}
      </div>
    </>
  );
}
