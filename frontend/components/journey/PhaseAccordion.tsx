"use client";

/**
 * PhaseAccordion — collapsible roadmap phase with week grouping
 *
 * Shows phase title, completion percentage, and a list of weeks.
 * Each week contains a list of ActivityCards.
 * Phases can be expanded / collapsed by clicking the header.
 */

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import type { JourneyPhase } from "@/lib/types";
import { ActivityCard } from "./ActivityCard";
import { GlowCard } from "@/components/ui/glow-card";

interface PhaseAccordionProps {
  phase: JourneyPhase;
  completedIds: Set<string>;
  onComplete: (activityId: string) => void;
  completingId: string | null;
  defaultOpen?: boolean;
}

export function PhaseAccordion({
  phase,
  completedIds,
  onComplete,
  completingId,
  defaultOpen = false,
}: PhaseAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Count total and completed activities for this phase
  const totalActivities = phase.weeks.reduce(
    (sum, week) => sum + week.activities.length,
    0
  );
  const completedActivities = phase.weeks.reduce(
    (sum, week) =>
      sum + week.activities.filter((a) => completedIds.has(a.id)).length,
    0
  );
  const completionPct =
    totalActivities > 0
      ? Math.round((completedActivities / totalActivities) * 100)
      : 0;

  const isPhaseComplete = completedActivities === totalActivities && totalActivities > 0;

  return (
    <GlowCard className="bg-card overflow-hidden !rounded-xl">
      {/* Phase header */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/30"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Phase number badge */}
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              isPhaseComplete
                ? "bg-primary text-primary-foreground"
                : "bg-primary/15 text-primary"
            }`}
          >
            {phase.phase}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">
              {phase.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {phase.duration_weeks} week{phase.duration_weeks !== 1 ? "s" : ""}
              {" · "}
              {totalActivities} activit{totalActivities !== 1 ? "ies" : "y"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Completion percentage — always visible as text; bar hidden on xs */}
          <div className="flex items-center gap-1.5">
            <div className="hidden sm:block h-1.5 w-16 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <span
              className={`text-xs font-semibold tabular-nums ${
                isPhaseComplete ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {completionPct}%
            </span>
          </div>

          {/* Chevron */}
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Phase content */}
      {isOpen && (
        <div className="divide-y divide-border/60 border-t border-border/60">
          {phase.weeks.map((week) => {
            const weekCompleted = week.activities.filter((a) =>
              completedIds.has(a.id)
            ).length;
            const weekTotal = week.activities.length;

            return (
              <div key={week.week} className="px-5 py-4 space-y-3">
                {/* Week header */}
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Week {week.week}
                  </h4>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {weekCompleted}/{weekTotal}
                  </span>
                </div>

                {/* Activities */}
                <div className="space-y-2">
                  {week.activities.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      completed={completedIds.has(activity.id)}
                      onComplete={onComplete}
                      isCompleting={completingId === activity.id}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlowCard>
  );
}
