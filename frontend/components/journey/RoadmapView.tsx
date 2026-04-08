"use client";

/**
 * RoadmapView — full roadmap display with banner, progress summary, and phase accordions
 *
 * Receives the LearningRoadmap object and completion mutation handlers.
 * Manages local optimistic completion state for instant UI feedback.
 */

import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  GraduationCap,
  Map,
  Target,
  Trash2,
} from "lucide-react";

import type { LearningRoadmap } from "@/lib/types";
import { journeyApi } from "@/lib/api";
import { PhaseAccordion } from "./PhaseAccordion";

interface RoadmapViewProps {
  roadmap: LearningRoadmap;
  onDeleted: () => void;
}

const GOAL_LABELS: Record<string, string> = {
  survival: "Survival Malay",
  conversational: "Conversational Malay",
  academic: "Academic / Formal Malay",
};

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function daysUntil(isoDate: string): number {
  const now = new Date();
  const deadline = new Date(isoDate);
  const diff = deadline.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function RoadmapView({ roadmap, onDeleted }: RoadmapViewProps) {
  // Optimistic completion state — starts with server-confirmed completions
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    () => new Set(roadmap.completed_activity_ids)
  );
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const totalActivities = roadmap.total_activities;
  const completedCount = completedIds.size;
  const progressPct =
    totalActivities > 0 ? Math.round((completedCount / totalActivities) * 100) : 0;
  const days = daysUntil(roadmap.deadline_date);

  async function handleComplete(activityId: string) {
    if (completedIds.has(activityId) || completingId) return;
    setCompletingId(activityId);
    // Optimistic update — avoid spread of Set (TypeScript downlevel compat)
    setCompletedIds((prev) => { const next = new Set(prev); next.add(activityId); return next; });
    try {
      await journeyApi.completeActivity(activityId);
    } catch {
      // Revert on failure
      setCompletedIds((prev) => {
        const next = new Set(prev);
        next.delete(activityId);
        return next;
      });
    } finally {
      setCompletingId(null);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await journeyApi.deleteRoadmap();
      onDeleted();
    } catch {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Banner / hero area */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6">
        {roadmap.banner_image_url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={roadmap.banner_image_url}
            alt="Journey banner"
            className="absolute inset-0 h-full w-full object-cover opacity-20 rounded-2xl"
          />
        )}
        <div className="relative space-y-4">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Map className="h-5 w-5 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  My Learning Journey
                </span>
              </div>
              <h1 className="text-xl font-bold text-foreground">
                {GOAL_LABELS[roadmap.goal_type] ?? roadmap.goal_type}
              </h1>
            </div>

            {/* Delete button */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="shrink-0 flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              New Plan
            </button>
          </div>

          {/* Meta row — wraps cleanly on mobile */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span>
                Deadline: {formatDate(roadmap.deadline_date)}
                {days > 0 && (
                  <span className="ml-1 font-medium text-foreground">
                    ({days}d left)
                  </span>
                )}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              {roadmap.roadmap_json.phases.length} phase{roadmap.roadmap_json.phases.length !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              {totalActivities} activit{totalActivities !== 1 ? "ies" : "y"}
            </span>
          </div>

          {/* Overall progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Overall Progress</span>
              <span className="font-bold text-foreground">
                {completedCount}/{totalActivities} ({progressPct}%)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-background/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Completion badge */}
          {progressPct === 100 && (
            <div className="flex items-center gap-2 rounded-lg bg-primary/20 border border-primary/30 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                Journey complete! You've reached your goal.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Phase accordions — full width single column (expands naturally) */}
      <div className="space-y-2 sm:space-y-3">
        {roadmap.roadmap_json.phases.map((phase, idx) => (
          <PhaseAccordion
            key={phase.phase}
            phase={phase}
            completedIds={completedIds}
            onComplete={handleComplete}
            completingId={completingId}
            defaultOpen={idx === 0}
          />
        ))}
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground">Start a new plan?</h2>
              <p className="text-sm text-muted-foreground">
                Your current roadmap and all progress will be deleted. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
