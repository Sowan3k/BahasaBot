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
  type LucideIcon,
} from "lucide-react";
import { adminApi, profileApi } from "@/lib/api";
import type { AdminStats } from "@/lib/types";
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
] as const;

// ── Stat card ────────────────────────────────────────────────────────────────

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
    </div>
  );
}
