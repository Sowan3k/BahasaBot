"use client";

// Class (lesson) page
// Renders Markdown lesson content with proper prose typography,
// vocabulary flashcards, example sentence pairs, class progress indicator,
// "Mark Complete" with vocabulary recap, and "Next Class" navigation.

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { coursesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { ClassDetail, Course, VocabularyItem, ExampleSentence } from "@/lib/types";

// ── Vocabulary flashcards ─────────────────────────────────────────────────────

function VocabularySection({
  items,
  isCompleted,
}: {
  items: VocabularyItem[];
  isCompleted: boolean;
}) {
  if (!items.length) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-base">Vocabulary</h2>
        <span className="text-xs text-muted-foreground">{items.length} words</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="rounded-lg border bg-card p-4 border-l-4 border-l-primary/60 space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-primary">{item.word}</span>
              {isCompleted && (
                <span className="text-xs text-green-500 font-medium">✓ saved</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{item.meaning}</p>
            {item.example && (
              <p className="text-xs text-muted-foreground/80 italic border-t border-border/50 pt-1.5">
                {item.example}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Example sentence pairs ────────────────────────────────────────────────────

function ExamplesSection({ items }: { items: ExampleSentence[] }) {
  if (!items.length) return null;
  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-base">Example Sentences</h2>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border bg-card px-4 py-3 space-y-1">
            <p className="font-medium text-sm">{item.bm}</p>
            <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <span className="text-xs text-muted-foreground/50 mt-0.5 flex-shrink-0">▸</span>
              <p>{item.en}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClassPage({
  params,
}: {
  params: { courseId: string; moduleId: string; classId: string };
}) {
  const { courseId, moduleId, classId } = params;
  const queryClient = useQueryClient();
  const [justCompleted, setJustCompleted] = useState(false);

  // Fetch class detail
  const {
    data: cls,
    isLoading,
    isError,
  } = useQuery<ClassDetail>({
    queryKey: ["class", courseId, moduleId, classId],
    queryFn: () => coursesApi.getClass(courseId, moduleId, classId).then((r) => r.data),
  });

  // Fetch course for sibling class navigation — nearly always a cache hit
  // since the module page already fetches this under the same query key.
  const { data: course } = useQuery<Course>({
    queryKey: ["course", courseId],
    queryFn: () => coursesApi.get(courseId).then((r) => r.data),
    enabled: !!cls,
  });

  // Derive navigation values
  const currentModule = course?.modules.find((m) => m.id === moduleId);
  const totalInModule = currentModule?.classes.length ?? 0;
  const sortedClasses = [...(currentModule?.classes ?? [])].sort(
    (a, b) => a.order_index - b.order_index
  );
  const currentIndex = sortedClasses.findIndex((c) => c.id === classId);
  const nextClass = sortedClasses[currentIndex + 1] ?? null;

  // Mark class complete
  const completeMutation = useMutation({
    mutationFn: () => coursesApi.completeClass(courseId, moduleId, classId),
    onSuccess: () => {
      setJustCompleted(true);
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["class", courseId, moduleId, classId] });
    },
  });

  // ── Loading state ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <div className="h-4 w-48 rounded bg-muted animate-pulse" />
        <div className="h-2 w-full rounded-full bg-muted animate-pulse" />
        <div className="h-8 w-3/4 rounded bg-muted animate-pulse" />
        <div className="h-64 rounded-lg border bg-muted animate-pulse" />
        <div className="grid sm:grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg border bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !cls) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center space-y-3">
        <p className="text-destructive">Failed to load class.</p>
        <Button variant="outline" asChild>
          <Link href={`/courses/${courseId}`}>Back to Course</Link>
        </Button>
      </div>
    );
  }

  const isCompleted = cls.is_completed || justCompleted;
  const progressPct = totalInModule > 0 ? (cls.order_index / totalInModule) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground flex flex-wrap gap-1 items-center">
        <Link href="/courses" className="hover:text-foreground">Courses</Link>
        <span>/</span>
        <Link href={`/courses/${courseId}`} className="hover:text-foreground truncate max-w-[120px]">
          {cls.course_title}
        </Link>
        <span>/</span>
        <Link href={`/courses/${courseId}/modules/${moduleId}`} className="hover:text-foreground truncate max-w-[120px]">
          {cls.module_title}
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[120px]">{cls.title}</span>
      </nav>

      {/* Class header with progress indicator */}
      <div className="space-y-3">
        {totalInModule > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Class {cls.order_index} of {totalInModule} — {cls.module_title}</span>
              <span>{cls.order_index}/{totalInModule}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
        <h1 className="text-2xl font-bold leading-snug">{cls.title}</h1>
      </div>

      {/* Lesson content — prose classes now styled by @tailwindcss/typography */}
      <div className="prose prose-sm max-w-none dark:prose-invert rounded-lg border bg-card p-6">
        <ReactMarkdown>{cls.content}</ReactMarkdown>
      </div>

      {/* Vocabulary flashcards */}
      <VocabularySection items={cls.vocabulary_json} isCompleted={isCompleted} />

      {/* Example sentence pairs */}
      <ExamplesSection items={cls.examples_json} />

      {/* Mark complete / completed state */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        {isCompleted ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-lg leading-none">✓</span>
              <p className="font-medium text-green-600">Lesson completed</p>
            </div>

            {/* Vocabulary recap — shows which words were saved */}
            {cls.vocabulary_json.length > 0 && (
              <div className="rounded-md bg-muted px-3 py-2.5 space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">
                  Vocabulary saved to your learning record:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {cls.vocabulary_json.map((v, i) => (
                    <span
                      key={i}
                      className="text-xs bg-primary/10 text-primary rounded px-2 py-0.5 font-medium"
                    >
                      {v.word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Done reading? Mark this lesson as complete to track your progress.
            </p>
            <Button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="flex-shrink-0"
            >
              {completeMutation.isPending ? "Saving…" : "Mark Complete"}
            </Button>
          </div>
        )}

        {completeMutation.isError && (
          <p className="text-sm text-destructive">
            Failed to save progress. Please try again.
          </p>
        )}
      </div>

      {/* Navigation row */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/courses/${courseId}/modules/${moduleId}`}>
            ← Back to Module
          </Link>
        </Button>

        {isCompleted && (
          nextClass ? (
            <Button asChild>
              <Link href={`/courses/${courseId}/modules/${moduleId}/classes/${nextClass.id}`}>
                Next Class →
              </Link>
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link href={`/courses/${courseId}/modules/${moduleId}`}>
                {currentModule?.quiz_available ? "Take Module Quiz →" : "View Module →"}
              </Link>
            </Button>
          )
        )}
      </div>

    </div>
  );
}
