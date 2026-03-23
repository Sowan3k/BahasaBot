"use client";

// Module detail page
// Shows the module title, description, and its full class list with completion state.
// Links directly to each class. Shows quiz CTA when all classes are complete.

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { coursesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { Course, Module } from "@/lib/types";

export default function ModuleDetailPage({
  params,
}: {
  params: { courseId: string; moduleId: string };
}) {
  const { courseId, moduleId } = params;

  // Fetch the full course — we derive module data from it
  const { data: course, isLoading, isError } = useQuery<Course>({
    queryKey: ["course", courseId],
    queryFn: () => coursesApi.get(courseId).then((r) => r.data),
  });

  const module: Module | undefined = course?.modules.find((m) => m.id === moduleId);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="h-6 w-48 rounded bg-muted animate-pulse" />
        <div className="h-8 w-80 rounded bg-muted animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg border bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError || !course || !module) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center space-y-3">
        <p className="text-destructive">Module not found.</p>
        <Button variant="outline" asChild>
          <Link href={`/courses/${courseId}`}>Back to Course</Link>
        </Button>
      </div>
    );
  }

  if (module.is_locked) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center space-y-4">
        <span className="text-5xl">🔒</span>
        <h1 className="text-xl font-bold">{module.title}</h1>
        <p className="text-muted-foreground">
          Complete the previous module quiz to unlock this module.
        </p>
        <Button variant="outline" asChild>
          <Link href={`/courses/${courseId}`}>Back to Course</Link>
        </Button>
      </div>
    );
  }

  const completedCount = module.classes.filter((c) => c.is_completed).length;
  const total = module.classes.length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground">
        <Link href="/courses" className="hover:text-foreground">Courses</Link>
        <span className="mx-2">/</span>
        <Link href={`/courses/${courseId}`} className="hover:text-foreground">
          {course.title}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{module.title}</span>
      </nav>

      {/* Module header */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Module {module.order_index}
        </p>
        <h1 className="text-2xl font-bold tracking-tight">{module.title}</h1>
        <p className="text-muted-foreground leading-relaxed">{module.description}</p>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{completedCount} / {total} classes</span>
          <span className="font-medium">{pct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Quiz CTA */}
      {module.quiz_available && (
        <div className="rounded-md bg-primary/10 border border-primary/20 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-primary text-sm">All classes complete!</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Take the module quiz to unlock the next module.
            </p>
          </div>
          <Button size="sm" asChild>
            <Link href={`/courses/${courseId}/modules/${moduleId}/quiz`}>Start Quiz</Link>
          </Button>
        </div>
      )}

      {module.is_completed && (
        <div className="rounded-md bg-green-500/10 border border-green-500/20 p-4">
          <p className="text-sm font-medium text-green-600">Module completed ✓</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            You passed the quiz for this module.
          </p>
        </div>
      )}

      {/* Classes list */}
      <div className="space-y-2">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          Classes
        </h2>
        <ul className="space-y-2">
          {module.classes.map((cls, idx) => (
            <li key={cls.id}>
              <Link
                href={`/courses/${courseId}/modules/${moduleId}/classes/${cls.id}`}
                className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 hover:border-primary/50 hover:shadow-sm transition-all"
              >
                <span
                  className={`w-6 h-6 flex-shrink-0 rounded-full border text-xs font-medium flex items-center justify-center ${
                    cls.is_completed
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-muted-foreground text-muted-foreground"
                  }`}
                >
                  {cls.is_completed ? "✓" : idx + 1}
                </span>
                <span
                  className={`text-base font-medium ${
                    cls.is_completed ? "text-muted-foreground line-through" : ""
                  }`}
                >
                  {cls.title}
                </span>
                {!cls.is_completed && (
                  <span className="ml-auto text-xs text-muted-foreground">Start →</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
