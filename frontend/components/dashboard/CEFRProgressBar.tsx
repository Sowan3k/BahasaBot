"use client";

import type { ProficiencyLevel } from "@/lib/types";

const LEVELS: ProficiencyLevel[] = ["A1", "A2", "B1", "B2"];

const LEVEL_LABELS: Record<ProficiencyLevel, string> = {
  A1: "Beginner",
  A2: "Elementary",
  B1: "Intermediate",
  B2: "Upper-Intermediate",
};

interface Props {
  level: ProficiencyLevel;
}

export default function CEFRProgressBar({ level }: Props) {
  const currentIndex = LEVELS.indexOf(level);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">CEFR Proficiency Level</h3>
        <span className="text-sm text-muted-foreground">
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
                  ? "bg-primary"
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
      <p className="text-sm text-muted-foreground">
        {level === "B2"
          ? "You have reached the highest tracked level. Keep practising!"
          : `Next level: ${LEVELS[currentIndex + 1]} — ${LEVEL_LABELS[LEVELS[currentIndex + 1]]}. Take the adaptive quiz to improve.`}
      </p>
    </div>
  );
}
