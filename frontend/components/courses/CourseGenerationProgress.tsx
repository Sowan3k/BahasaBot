"use client";

// Floating bottom-right card that tracks a background course generation job.
// Polls GET /api/courses/jobs/{job_id} every 3 seconds via React Query.
// Shown automatically when activeJobId is set in CourseGenerationContext.

import Link from "next/link";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { coursesApi } from "@/lib/api";
import { useCourseGeneration } from "@/lib/course-generation-context";
import type { JobStatusResponse } from "@/lib/types";

// How many consecutive 404s before giving up (Redis TTL expired or job never ran)
const MAX_MISSES = 5;

export function CourseGenerationProgress() {
  const { activeJobId, setActiveJobId } = useCourseGeneration();
  const queryClient = useQueryClient();

  const { data, failureCount } = useQuery<JobStatusResponse>({
    queryKey: ["courseJob", activeJobId],
    queryFn: () => coursesApi.getJobStatus(activeJobId!).then((r) => r.data),
    enabled: !!activeJobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Stop polling once the job has reached a terminal state
      if (status === "complete" || status === "failed") return false;
      return 3000; // poll every 3 s
    },
    retry: MAX_MISSES,
  });

  // Clear job if we hit too many 404s (Redis miss / job expired)
  if (failureCount >= MAX_MISSES && activeJobId) {
    setActiveJobId(null);
  }

  // Invalidate courses list when generation completes so the new card appears
  if (data?.status === "complete") {
    queryClient.invalidateQueries({ queryKey: ["courses"] });
  }

  if (!activeJobId || !data) return null;

  const isDone = data.status === "complete";
  const isFailed = data.status === "failed";
  const isActive = data.status === "pending" || data.status === "running";

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 rounded-xl border bg-background shadow-2xl overflow-hidden">
      {/* Progress bar */}
      <div className="h-1 w-full bg-muted">
        <div
          className={`h-full transition-all duration-500 ${isFailed ? "bg-destructive" : "bg-primary"}`}
          style={{ width: `${data.progress}%` }}
        />
      </div>

      <div className="p-4 space-y-3">
        {/* Status row */}
        <div className="flex items-start gap-3">
          {/* Spinner or icon */}
          <span className="mt-0.5 text-lg shrink-0">
            {isDone ? "✅" : isFailed ? "❌" : "⏳"}
          </span>

          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">
              {isDone
                ? "Course ready!"
                : isFailed
                ? "Generation failed"
                : "Generating course…"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {isFailed ? (data.error ?? "Something went wrong.") : data.step}
            </p>
          </div>

          {/* Progress % when running */}
          {isActive && (
            <span className="ml-auto shrink-0 text-xs font-mono text-muted-foreground">
              {data.progress}%
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2">
          {isDone && data.course_id && (
            <Link
              href={`/courses/${data.course_id}`}
              onClick={() => setActiveJobId(null)}
              className="text-xs font-medium text-primary hover:underline"
            >
              View Course →
            </Link>
          )}
          {(isDone || isFailed) && (
            <button
              onClick={() => setActiveJobId(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
