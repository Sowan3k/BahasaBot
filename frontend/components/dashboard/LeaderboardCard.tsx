"use client";

import { Flame, Trophy } from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LeaderboardEntry, LeaderboardResponse } from "@/lib/types";

interface Props {
  data: LeaderboardResponse | undefined;
  isLoading: boolean;
}

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

/** Color palette per BPS level for the avatar badge */
const BPS_AVATAR: Record<string, string> = {
  "BPS-1": "bg-emerald-900/50 text-emerald-300 border-emerald-700/60",
  "BPS-2": "bg-sky-900/50 text-sky-300 border-sky-700/60",
  "BPS-3": "bg-violet-900/50 text-violet-300 border-violet-700/60",
  "BPS-4": "bg-amber-900/50 text-amber-300 border-amber-700/60",
};

const BPS_BADGE: Record<string, string> = {
  "BPS-1": "bg-emerald-950 text-emerald-400 border-emerald-800",
  "BPS-2": "bg-sky-950 text-sky-400 border-sky-800",
  "BPS-3": "bg-violet-950 text-violet-400 border-violet-800",
  "BPS-4": "bg-amber-950 text-amber-400 border-amber-800",
};

function EntryRow({ entry }: { entry: LeaderboardEntry }) {
  const avatarCls = BPS_AVATAR[entry.bps_level] ?? "bg-muted text-muted-foreground border-border";
  const badgeCls = BPS_BADGE[entry.bps_level] ?? "bg-muted text-muted-foreground border-border";
  const medal = MEDAL[entry.rank];

  return (
    <div
      className={[
        "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors",
        entry.is_current_user
          ? "bg-accent/10 border border-accent/30"
          : "hover:bg-white/[0.03]",
      ].join(" ")}
    >
      {/* Rank */}
      <span className="w-7 text-center text-sm font-bold shrink-0">
        {medal ?? <span className="text-muted-foreground">#{entry.rank}</span>}
      </span>

      {/* Avatar */}
      <div
        className={[
          "h-8 w-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0",
          avatarCls,
        ].join(" ")}
      >
        {entry.initials}
      </div>

      {/* Name + BPS */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {entry.name}
          {entry.is_current_user && (
            <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
          )}
        </p>
        <span className={`inline-block mt-0.5 text-[10px] px-1.5 py-px rounded border font-medium ${badgeCls}`}>
          {entry.bps_level}
        </span>
      </div>

      {/* Streak — hidden on xs */}
      <div className="hidden sm:flex items-center gap-0.5 text-orange-400 text-xs shrink-0">
        <Flame className="h-3 w-3" />
        <span>{entry.streak_count}</span>
      </div>

      {/* Weekly XP */}
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-accent">{entry.weekly_xp}</p>
        <p className="text-[10px] text-muted-foreground">XP</p>
      </div>
    </div>
  );
}

export default function LeaderboardCard({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <GlowCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </GlowCard>
    );
  }

  const entries = data?.entries ?? [];
  const yourRank = data?.your_rank ?? null;
  const weekLabel = data ? `${data.week_start} – ${data.week_end}` : "";
  const currentUserInList = entries.some((e) => e.is_current_user);

  return (
    <GlowCard className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold">Weekly Leaderboard</h3>
        </div>
        {weekLabel && (
          <span className="text-xs text-muted-foreground">Week {weekLabel}</span>
        )}
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No XP earned yet this week — start learning!
        </div>
      ) : (
        <div className="space-y-1">
          {entries.map((entry) => (
            <EntryRow key={entry.rank} entry={entry} />
          ))}
        </div>
      )}

      {/* Your rank footer (only when outside top 10) */}
      {yourRank !== null && !currentUserInList && (
        <div className="mt-3 pt-3 border-t border-border/50 text-center text-xs text-muted-foreground">
          Your rank this week:{" "}
          <span className="font-semibold text-accent">#{yourRank}</span>
        </div>
      )}

      {/* No rank yet */}
      {yourRank === null && entries.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50 text-center text-xs text-muted-foreground">
          Earn XP this week to appear on the leaderboard!
        </div>
      )}
    </GlowCard>
  );
}
