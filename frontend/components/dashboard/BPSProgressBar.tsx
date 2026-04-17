"use client";

import type { ProficiencyLevel } from "@/lib/types";

const LEVELS: ProficiencyLevel[] = ["BPS-1", "BPS-2", "BPS-3", "BPS-4"];

const LEVEL_LABELS: Record<ProficiencyLevel, string> = {
  "BPS-1": "Beginner",
  "BPS-2": "Elementary",
  "BPS-3": "Intermediate",
  "BPS-4": "Upper-Intermediate",
};

interface Props {
  level: ProficiencyLevel;
}

export default function BPSProgressBar({ level }: Props) {
  const currentIndex = LEVELS.indexOf(level);
  const nextLevel = currentIndex < LEVELS.length - 1 ? LEVELS[currentIndex + 1] : null;

  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap min-w-0">
      <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap flex-shrink-0">
        BPS Level:
      </span>
      <span className="text-xs font-bold text-primary whitespace-nowrap flex-shrink-0">
        {level} — {LEVEL_LABELS[level]}
      </span>
      <div className="flex gap-0.5 flex-1 min-w-[60px]">
        {LEVELS.map((l, i) => (
          <div
            key={l}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= currentIndex ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </div>
      {nextLevel ? (
        <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
          Next: {nextLevel} — {LEVEL_LABELS[nextLevel]}. Take adaptive quiz to advance.
        </span>
      ) : (
        <span className="text-[10px] text-primary font-medium whitespace-nowrap flex-shrink-0">
          Max level reached — keep practising!
        </span>
      )}
    </div>
  );
}
