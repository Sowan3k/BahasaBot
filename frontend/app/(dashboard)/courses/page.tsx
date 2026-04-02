"use client";

// Courses library page
// Shows all of the user's generated courses with progress indicators.
// "Generate New Course" button opens the CourseGenerationModal.

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { coursesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CourseGenerationModal } from "@/components/courses/CourseGenerationModal";
import { useCourseGeneration } from "@/lib/course-generation-context";
import type { CourseSummary } from "@/lib/types";

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
    <div className="rounded-lg border bg-card hover:border-primary/50 hover:shadow-sm transition-all flex flex-col">
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

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["courses", page],
    queryFn: () => coursesApi.list(page, LIMIT).then((r) => r.data),
  });

  const courses = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
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

      {/* States */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-lg border bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center space-y-3">
          <p className="text-sm text-destructive">Failed to load courses.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && courses.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center space-y-4">
          <p className="text-muted-foreground">You haven&apos;t generated any courses yet.</p>
          <Button onClick={() => setShowModal(true)} disabled={!!activeJobId}>
            {activeJobId ? "Course generating in background…" : "Generate your first course"}
          </Button>
        </div>
      )}

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

      {/* Modal */}
      {showModal && <CourseGenerationModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
