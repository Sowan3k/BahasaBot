"use client";

/**
 * Admin — Weekly Leaderboard
 *
 * Full leaderboard table showing all users ranked by XP earned this week.
 * Includes email (admin-only), BPS level, streak, and all-time XP.
 * Resets automatically each Monday (queries the live xp_logs table).
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, ShieldCheck, Trophy } from "lucide-react";

import { adminApi, profileApi } from "@/lib/api";
import type { LeaderboardEntry } from "@/lib/types";
import { GlowCard } from "@/components/ui/glow-card";
import { Skeleton } from "@/components/ui/skeleton";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

const BPS_BADGE: Record<string, string> = {
  "BPS-1": "bg-emerald-950 text-emerald-400 border-emerald-800",
  "BPS-2": "bg-sky-950 text-sky-400 border-sky-800",
  "BPS-3": "bg-violet-950 text-violet-400 border-violet-800",
  "BPS-4": "bg-amber-950 text-amber-400 border-amber-800",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminLeaderboardPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [weekLabel, setWeekLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Guard: only admins can see this page
    profileApi.getProfile().then((res) => {
      if (res.data.role !== "admin") router.replace("/dashboard");
    });

    adminApi.getLeaderboard()
      .then((res) => {
        const data = res.data as { entries: LeaderboardEntry[]; week_start: string; week_end: string };
        setEntries(data.entries);
        if (data.week_start && data.week_end) {
          setWeekLabel(`${data.week_start} – ${data.week_end}`);
        }
      })
      .catch(() => setError("Failed to load leaderboard. Please try again."))
      .finally(() => setLoading(false));
  }, [router]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center">
          <Trophy size={22} className="text-amber-400" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold">Weekly Leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            Top learners by XP this week{weekLabel ? ` (${weekLabel})` : ""} — resets every Monday
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <GlowCard className="p-5">
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </GlowCard>
      ) : entries.length === 0 ? (
        <GlowCard className="p-10 text-center">
          <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            No XP activity recorded this week yet.
          </p>
        </GlowCard>
      ) : (
        <GlowCard className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium w-12">Rank</th>
                <th className="text-left px-4 py-3 font-medium">User</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-center px-4 py-3 font-medium">BPS Level</th>
                <th className="text-center px-4 py-3 font-medium">Streak</th>
                <th className="text-right px-4 py-3 font-medium">Weekly XP</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const badgeCls = BPS_BADGE[entry.bps_level] ?? "bg-muted text-muted-foreground border-border";
                const medal = MEDAL[entry.rank];
                return (
                  <tr
                    key={entry.rank}
                    className={[
                      "border-b border-border/50 transition-colors",
                      entry.is_current_user ? "bg-accent/5" : "hover:bg-white/[0.02]",
                    ].join(" ")}
                  >
                    {/* Rank */}
                    <td className="px-4 py-3 text-center font-bold">
                      {medal ?? <span className="text-muted-foreground">#{entry.rank}</span>}
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3 font-medium">{entry.name}</td>

                    {/* Email */}
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {(entry as LeaderboardEntry & { email?: string }).email ?? "—"}
                    </td>

                    {/* BPS */}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block text-[10px] px-1.5 py-px rounded border font-medium ${badgeCls}`}>
                        {entry.bps_level}
                      </span>
                    </td>

                    {/* Streak */}
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-0.5 text-orange-400 text-xs">
                        <Flame className="h-3 w-3" />
                        {entry.streak_count}
                      </span>
                    </td>

                    {/* Weekly XP */}
                    <td className="px-4 py-3 text-right font-bold text-accent">
                      {entry.weekly_xp} XP
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </GlowCard>
      )}
    </div>
  );
}
