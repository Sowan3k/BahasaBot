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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base tracking-tight">BahasaBot Proficiency Scale (BPS)</h3>
        <span className="text-sm font-medium text-muted-foreground">
          {level} — {LEVEL_LABELS[level]}
        </span>
      </div>

      {/* Track */}
      <div className="flex gap-1">
        {LEVELS.map((l, i) => (
          <div key={l} className="flex-1 space-y-1">
            <div
              className={`h-2.5 rounded-full transition-colors ${
                i <= currentIndex
                  ? "bg-accent"
                  : "bg-muted"
              }`}
            />
            <p
              className={`text-xs text-center font-medium ${
                l === level ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {l}
            </p>
          </div>
        ))}
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {level === "BPS-4"
          ? "You have reached the highest tracked level. Keep practising!"
          : `Next level: ${LEVELS[currentIndex + 1]} — ${LEVEL_LABELS[LEVELS[currentIndex + 1]]}. Take the adaptive quiz to improve.`}
      </p>
    </div>
  );
}
