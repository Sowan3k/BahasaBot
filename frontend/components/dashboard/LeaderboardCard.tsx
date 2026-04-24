"use client";

import { motion } from "framer-motion";
import { Clock, Flame, Trophy } from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LeaderboardEntry, LeaderboardResponse } from "@/lib/types";

interface Props {
  data: LeaderboardResponse | undefined;
  isLoading: boolean;
}

// BPS-level avatar colour (consistent with other BPS colour usage in the app)
const BPS_COLORS: Record<string, string> = {
  "BPS-1": "bg-emerald-900/50 text-emerald-300 border-emerald-700",
  "BPS-2": "bg-sky-900/50 text-sky-300 border-sky-700",
  "BPS-3": "bg-violet-900/50 text-violet-300 border-violet-700",
  "BPS-4": "bg-amber-900/50 text-amber-300 border-amber-700",
};

const MEDALS: Record<1 | 2 | 3, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

// Platform visual per rank: height + colour tone
const PLATFORM: Record<1 | 2 | 3, { h: string; bg: string }> = {
  1: { h: "h-16", bg: "bg-amber-900/20 border-t border-x border-amber-700/25" },
  2: { h: "h-11", bg: "bg-zinc-800/35 border-t border-x border-zinc-600/20" },
  3: { h: "h-7",  bg: "bg-orange-950/25 border-t border-x border-orange-800/20" },
};

// How many calendar days remain until the next Monday (leaderboard reset)
function daysUntilReset(): number {
  const dow = new Date().getDay(); // 0 = Sunday … 6 = Saturday
  return dow === 0 ? 1 : 8 - dow;
}

// ── Avatar circle ──────────────────────────────────────────────────────────────

function Avatar({
  entry,
  large = false,
}: {
  entry: LeaderboardEntry;
  large?: boolean;
}) {
  const colorCls = BPS_COLORS[entry.bps_level] ?? "bg-muted text-muted-foreground border-border";
  const sizeCls = large ? "h-12 w-12 text-sm" : "h-7 w-7 text-[10px]";
  // Gold ring to distinguish the #1 user's own avatar on the podium
  const ringCls = entry.is_current_user && large
    ? "ring-2 ring-primary/50 ring-offset-1 ring-offset-background"
    : "";
  return (
    <div
      className={`rounded-full border-2 flex items-center justify-center font-bold shrink-0 ${sizeCls} ${colorCls} ${ringCls}`}
    >
      {entry.initials}
    </div>
  );
}

// ── Podium column (ranks 1, 2, 3) ─────────────────────────────────────────────
// Columns are aligned to the bottom of their flex parent; the platform height
// controls how high each column appears — tallest = #1 (centre).

function PodiumCol({ entry, rank }: { entry: LeaderboardEntry; rank: 1 | 2 | 3 }) {
  const { h, bg } = PLATFORM[rank];
  // Stagger: centre (1st) animates first for maximum visual impact
  const delay = rank === 1 ? 0.05 : rank === 2 ? 0.18 : 0.28;

  return (
    <motion.div
      className="flex flex-col items-center gap-0.5 flex-1 min-w-0"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.38, ease: "easeOut" }}
    >
      {/* Medal emoji */}
      <span className="text-base leading-none">{MEDALS[rank]}</span>

      {/* Avatar */}
      <Avatar entry={entry} large />

      {/* Display name — first name only to keep it compact */}
      <p className="text-[11px] font-semibold text-center truncate max-w-[72px] mt-0.5 leading-tight">
        {entry.is_current_user ? "You" : entry.name.split(" ")[0]}
      </p>

      {/* Weekly XP */}
      <p className="text-[10px] font-bold text-primary tabular-nums">
        {entry.weekly_xp} XP
      </p>

      {/* Streak (hidden on very small screens) */}
      <div className="hidden xs:flex items-center gap-0.5 text-orange-400">
        <Flame className="h-2.5 w-2.5" />
        <span className="text-[9px]">{entry.streak_count}</span>
      </div>

      {/* Platform step — height determines podium position */}
      <div className={`w-full mt-1 rounded-t-sm ${h} ${bg}`} />
    </motion.div>
  );
}

// ── Rank row (positions 4–10) ─────────────────────────────────────────────────
// Each row shows an animated XP bar relative to the top scorer's XP.

function RankRow({
  entry,
  maxXp,
  idx,
}: {
  entry: LeaderboardEntry;
  maxXp: number;
  idx: number;
}) {
  const pct = maxXp > 0 ? Math.min(100, Math.round((entry.weekly_xp / maxXp) * 100)) : 0;
  const avatarCls = BPS_COLORS[entry.bps_level] ?? "bg-muted text-muted-foreground border-border";
  const rowDelay = 0.35 + idx * 0.06;

  return (
    <motion.div
      className={[
        "flex items-center gap-2.5 px-3 py-2 rounded-lg",
        entry.is_current_user
          ? "bg-primary/10 border border-primary/25"
          : "hover:bg-white/[0.025] transition-colors",
      ].join(" ")}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rowDelay, duration: 0.28 }}
    >
      {/* Rank number */}
      <span className="w-5 text-center text-[11px] text-muted-foreground font-semibold shrink-0">
        #{entry.rank}
      </span>

      {/* Avatar */}
      <div
        className={`h-7 w-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarCls}`}
      >
        {entry.initials}
      </div>

      {/* Name + animated XP bar */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate leading-none mb-1">
          {entry.name}
          {entry.is_current_user && (
            <span className="ml-1 text-muted-foreground">(you)</span>
          )}
        </p>
        {/* Progress bar — fills to % of leader's XP */}
        <div className="h-1 w-full rounded-full bg-muted/60 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary/55"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ delay: rowDelay + 0.15, duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Streak — hidden on mobile */}
      <div className="hidden sm:flex items-center gap-0.5 text-orange-400 shrink-0">
        <Flame className="h-2.5 w-2.5" />
        <span className="text-[10px]">{entry.streak_count}</span>
      </div>

      {/* XP count */}
      <span className="text-xs font-bold text-primary shrink-0 tabular-nums">
        {entry.weekly_xp}
      </span>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function LeaderboardCard({ data, isLoading }: Props) {
  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <GlowCard className="p-5">
        <div className="flex items-center justify-between mb-5">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-5 w-20" />
        </div>
        {/* Podium skeleton — three columns aligned to bottom */}
        <div className="flex items-end gap-2 mb-5">
          <Skeleton className="flex-1 h-28 rounded-t-sm" />
          <Skeleton className="flex-1 h-36 rounded-t-sm" />
          <Skeleton className="flex-1 h-24 rounded-t-sm" />
        </div>
        <div className="space-y-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      </GlowCard>
    );
  }

  const entries = data?.entries ?? [];
  const yourRank = data?.your_rank ?? null;
  const weekLabel = data ? `${data.week_start} – ${data.week_end}` : "";
  const currentUserInList = entries.some((e) => e.is_current_user);
  const daysLeft = daysUntilReset();
  const maxXp = entries[0]?.weekly_xp ?? 1;

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (entries.length === 0) {
    return (
      <GlowCard className="p-6 text-center">
        <Trophy className="h-8 w-8 text-amber-400/50 mx-auto mb-3" />
        <p className="text-sm font-medium mb-1">No XP earned yet this week</p>
        <p className="text-xs text-muted-foreground">
          Complete lessons to appear on the leaderboard!
        </p>
      </GlowCard>
    );
  }

  // Podium ordering: 2nd (left) · 1st (centre) · 3rd (right)
  const top3 = entries.slice(0, Math.min(3, entries.length));
  const rest = entries.slice(3);
  const podiumSlots: [LeaderboardEntry | null, LeaderboardEntry | null, LeaderboardEntry | null] = [
    top3[1] ?? null, // left  — 2nd
    top3[0] ?? null, // centre — 1st
    top3[2] ?? null, // right  — 3rd
  ];
  const podiumRanks: (1 | 2 | 3)[] = [2, 1, 3];

  return (
    <GlowCard className="p-5">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold">Weekly Leaderboard</h3>
        </div>
        <div className="flex items-center gap-2">
          {weekLabel && (
            <span className="text-[11px] text-muted-foreground hidden sm:block">
              {weekLabel}
            </span>
          )}
          {/* Days until Monday reset */}
          <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            <Clock className="h-2.5 w-2.5" />
            {daysLeft}d left
          </span>
        </div>
      </div>

      {/* ── Podium (top 1–3) ──────────────────────────────────────────────────── */}
      {top3.length > 0 && (
        <div className="flex items-end gap-1.5 sm:gap-2 mb-4 px-1">
          {podiumSlots.map((entry, i) =>
            entry ? (
              <PodiumCol key={entry.rank} entry={entry} rank={podiumRanks[i]} />
            ) : (
              // Placeholder column so 1st stays centred when <3 entries
              <div key={`placeholder-${i}`} className="flex-1" />
            )
          )}
        </div>
      )}

      {/* ── Separator + rows 4–10 ─────────────────────────────────────────────── */}
      {rest.length > 0 && (
        <>
          <div className="border-t border-border/40 mb-2" />
          <div className="space-y-0.5">
            {rest.map((entry, i) => (
              <RankRow key={entry.rank} entry={entry} maxXp={maxXp} idx={i} />
            ))}
          </div>
        </>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      {yourRank !== null && !currentUserInList && (
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <span>Your rank this week:</span>
          <span className="font-bold text-primary">#{yourRank}</span>
          <span>· Earn more XP to climb!</span>
        </div>
      )}
      {yourRank === null && entries.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50 text-center text-xs text-muted-foreground">
          Earn XP this week to appear on the leaderboard!
        </div>
      )}
    </GlowCard>
  );
}
