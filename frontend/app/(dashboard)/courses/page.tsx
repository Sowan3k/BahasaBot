"use client";

// Courses library page
// Shows all of the user's generated courses with progress indicators.
// "Generate New Course" button opens the CourseGenerationModal.

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { coursesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { useCourseGeneration } from "@/lib/course-generation-context";
import { useTheme } from "@/lib/use-theme";
import type { CourseSummary } from "@/lib/types";

// Heavy components — code-split to avoid blocking the initial bundle
const CourseGenerationModal = dynamic(
  () => import("@/components/courses/CourseGenerationModal").then((m) => ({ default: m.CourseGenerationModal })),
  { ssr: false }
);
const SVGFollower = dynamic(
  () => import("@/components/ui/svg-follower").then((m) => ({ default: m.SVGFollower })),
  { ssr: false, loading: () => null }
);

// Theme-matched colour palettes for the SVG trail animation.
// Spans the full tonal range — light sparkles, warm pops, mid greens, dark anchors —
// so the trails read as vibrant rather than flat.
//
// Light:  cream → wheat → coral → sage greens → warm brown → dark walnut
const LIGHT_COLORS = [
  "#f3ead2", // cream (popover)       — bright sparkle trails
  "#dbc894", // warm wheat (accent)   — warm, luminous
  "#d98b7e", // coral rose (destructive) — warm pop of colour
  "#bac9b4", // light sage (chart-3)  — airy green
  "#8d9d4f", // olive green (primary) — hero tone
  "#9db18c", // sage (ring/chart-1)   — mid green
  "#b19681", // warm brown (border)   — earthy
  "#5c4b3e", // dark walnut (foreground) — deep anchor
];
//
// Dark:   cream → amber → coral → sage greens → warm grey → dark brown
const DARK_COLORS = [
  "#ede4d4", // warm cream (foreground) — bright sparkle against dark bg
  "#a18f5c", // warm amber/gold (accent) — luminous warm tone
  "#b5766a", // muted coral (destructive) — warm pop
  "#9db18c", // lighter sage (chart-2)  — lighter green lift
  "#8a9f7b", // sage green (primary)    — hero tone
  "#71856a", // deep sage (chart-3)     — mid-dark green
  "#a8a096", // warm grey (muted-fg)    — neutral buffer
  "#5a5345", // dark brown (input/border) — deep anchor
];

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{value} / {max} classes</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Course card ───────────────────────────────────────────────────────────────

function CourseCard({ course }: { course: CourseSummary }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => coursesApi.delete(course.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  return (
    <div className="rounded-lg border bg-card/90 backdrop-blur-sm hover:border-primary/50 hover:shadow-sm transition-all flex flex-col">
      {/* Clickable content area */}
      <Link
        href={`/courses/${course.id}`}
        className="block p-5 space-y-3 flex-1"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
            {course.topic}
          </p>
          <h3 className="font-semibold text-base leading-snug line-clamp-2">{course.title}</h3>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed line-clamp-2">{course.description}</p>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{course.module_count} module{course.module_count !== 1 ? "s" : ""}</span>
          <span>·</span>
          <span>{new Date(course.created_at).toLocaleDateString()}</span>
        </div>

        <ProgressBar value={course.completed_classes} max={course.total_classes} />
      </Link>

      {/* Delete row — outside the Link so it doesn't trigger navigation */}
      <div className="px-5 pb-4 pt-1 border-t border-border/50 flex items-center justify-end gap-2">
        {confirming ? (
          <>
            <span className="text-xs text-muted-foreground mr-auto">Delete this course?</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setConfirming(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 text-xs"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Yes, delete"}
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-destructive"
            onClick={() => setConfirming(true)}
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CoursesPage() {
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const LIMIT = 9;
  const { activeJobId } = useCourseGeneration();
  const { theme } = useTheme();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["courses", page],
    queryFn: () => coursesApi.list(page, LIMIT).then((r) => r.data),
  });

  const courses = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    /* Outer wrapper is relative + min-h-full so the absolute background fills it */
    <div className="relative min-h-full">

      {/* ── SVG trail animation — below all content, no pointer events ──
           The wrapper is the only absolutely-positioned element; SVGFollower's
           own `relative` class wins when both `relative` and `absolute` are on
           the same element (Tailwind CSS ordering), which would push content
           below the viewport. Separate wrapper avoids that conflict entirely. */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <SVGFollower
          colors={theme === "dark" ? DARK_COLORS : LIGHT_COLORS}
          removeDelay={500}
          opacity={0.55}
          useWindowEvents
          className="w-full h-full"
        />
      </div>

      {/* ── Page content ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              AI-generated Malay language courses personalised to your topics
            </p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            disabled={!!activeJobId}
            title={activeJobId ? "A course is already being generated" : undefined}
          >
            {activeJobId ? "Generating…" : "+ New Course"}
          </Button>
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 rounded-lg border bg-card/80 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center space-y-3">
            <p className="text-sm text-destructive">Failed to load courses.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && courses.length === 0 && (
          <div className="rounded-lg border border-dashed bg-card/70 backdrop-blur-sm p-12 text-center space-y-4">
            <p className="text-muted-foreground">You haven&apos;t generated any courses yet.</p>
            <Button onClick={() => setShowModal(true)} disabled={!!activeJobId}>
              {activeJobId ? "Course generating in background…" : "Generate your first course"}
            </Button>
          </div>
        )}

        {/* Course grid */}
        {!isLoading && !isError && courses.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && <CourseGenerationModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
