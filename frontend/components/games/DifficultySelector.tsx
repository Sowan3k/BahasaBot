"use client";

import type { GameDifficulty } from "@/lib/types";

export const DIFFICULTY_TIMER: Record<GameDifficulty, number> = {
  easy: 20,
  medium: 10,
  hard: 5,
};

const LABELS: Record<GameDifficulty, { label: string; emoji: string }> = {
  easy:   { label: "Easy",   emoji: "🌱" },
  medium: { label: "Medium", emoji: "⚡" },
  hard:   { label: "Hard",   emoji: "🔥" },
};

interface DifficultySelectorProps {
  value: GameDifficulty;
  onChange: (d: GameDifficulty) => void;
  xpTable: Record<GameDifficulty, number>;
  disabled?: boolean;
}

export function DifficultySelector({
  value, onChange, xpTable, disabled = false,
}: DifficultySelectorProps) {
  const difficulties: GameDifficulty[] = ["easy", "medium", "hard"];

  return (
    <div className="flex gap-2">
      {difficulties.map((d) => {
        const isSelected = value === d;
        return (
          <button
            key={d}
            onClick={() => !disabled && onChange(d)}
            disabled={disabled}
            className={[
              "flex-1 flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl border text-center transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              "disabled:cursor-not-allowed disabled:opacity-60",
              isSelected
                ? "bg-primary/10 border-primary ring-1 ring-primary/30"
                : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
            ].join(" ")}
            aria-pressed={isSelected}
          >
            <span className="text-base leading-none">{LABELS[d].emoji}</span>
            <span className="text-xs font-semibold leading-tight">{LABELS[d].label}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">
              {DIFFICULTY_TIMER[d]}s · +{xpTable[d]} XP
            </span>
          </button>
        );
      })}
    </div>
  );
}
