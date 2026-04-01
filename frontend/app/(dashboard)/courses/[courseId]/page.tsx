"use client";

// Course overview page
// Shows the course title, description, objectives, and list of modules.
// Modules show lock state, class count, and completion status.

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { coursesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Course, Module } from "@/lib/types";

// ── Module card ───────────────────────────────────────────────────────────────

function ModuleCard({ module, courseId }: { module: Module; courseId: string }) {
  const completedCount = module.classes.filter((c) => c.is_completed).length;
  const total = module.classes.length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  if (module.is_locked) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/40 p-5 opacity-60">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
              Module {module.order_index}
            </p>
            <h3 className="font-semibold">{module.title}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{module.description}</p>
          </div>
          <span className="text-muted-foreground text-lg mt-0.5">🔒</span>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Complete the previous module quiz to unlock this module.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
            Module {module.order_index}
          </p>
          <h3 className="font-semibold text-base tracking-tight">{module.title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{module.description}</p>
        </div>
        {module.is_completed && (
          <span className="ml-3 mt-0.5 text-green-500 text-lg flex-shrink-0">✓</span>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{completedCount} / {total} classes</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Classes list */}
      <ul className="space-y-1.5">
        {module.classes.map((cls) => (
          <li key={cls.id}>
            <Link
              href={`/courses/${courseId}/modules/${module.id}/classes/${cls.id}`}
              className="flex items-center gap-2 text-sm rounded px-2 py-1.5 hover:bg-muted transition-colors"
            >
              <span
                className={`w-4 h-4 flex-shrink-0 rounded-full border text-xs flex items-center justify-center ${
                  cls.is_completed
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-muted-foreground"
                }`}
              >
                {cls.is_completed ? "✓" : ""}
              </span>
              <span className={cls.is_completed ? "text-muted-foreground line-through" : ""}>
                {cls.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Quiz CTA */}
      {module.quiz_available && (
        <div className="rounded-md bg-primary/10 border border-primary/20 p-3 flex items-center justify-between">
          <p className="text-sm font-medium text-primary">All classes done! Take the module quiz.</p>
          <Button size="sm" asChild>
            <Link href={`/courses/${courseId}/modules/${module.id}/quiz`}>Start Quiz</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CourseDetailPage({
  params,
}: {
  params: { courseId: string };
}) {
  const { courseId } = params;

  const { data: course, isLoading, isError } = useQuery<Course>({
    queryKey: ["course", courseId],
    queryFn: () => coursesApi.get(courseId).then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <div className="h-8 w-64 rounded bg-muted animate-pulse" />
        <div className="h-4 w-full rounded bg-muted animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-44 rounded-lg border bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center space-y-3">
        <p className="text-destructive">Failed to load course.</p>
        <Button variant="outline" asChild>
          <Link href="/courses">Back to Courses</Link>
        </Button>
      </div>
    );
  }

  const overallPct =
    course.total_classes > 0
      ? Math.round((course.completed_classes / course.total_classes) * 100)
      : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Back button */}
      <Link href="/courses" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} />
        Back to Courses
      </Link>

      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground">
        <Link href="/courses" className="hover:text-foreground">Courses</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{course.title}</span>
      </nav>

      {/* Course header */}
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {course.topic}
        </p>
        <h1 className="text-3xl font-bold tracking-tight leading-tight">{course.title}</h1>
        <p className="text-muted-foreground leading-relaxed">{course.description}</p>

        {/* Overall progress */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {course.completed_classes} / {course.total_classes} classes completed
            </span>
            <span className="font-medium">{overallPct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Learning objectives */}
      {course.objectives.length > 0 && (
        <div className="rounded-lg border bg-card p-5 space-y-2">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Learning Objectives</h2>
          <ul className="space-y-1">
            {course.objectives.map((obj, i) => (
              <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                <span className="text-primary mt-0.5">✓</span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modules */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Modules</h2>
        {course.modules.map((module) => (
          <ModuleCard key={module.id} module={module} courseId={courseId} />
        ))}
      </div>
    </div>
  );
}
