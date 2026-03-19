"use client";

import type { DashboardStats } from "@/lib/types";

interface Props {
  stats: DashboardStats;
}

interface StatCard {
  label: string;
  value: string | number;
  description: string;
}

export default function StatsCards({ stats }: Props) {
  const cards: StatCard[] = [
    {
      label: "Courses Created",
      value: stats.courses_created,
      description: "AI-generated courses",
    },
    {
      label: "Modules Completed",
      value: stats.modules_completed,
      description: `of ${stats.courses_created > 0 ? "all" : "0"} modules`,
    },
    {
      label: "Classes Completed",
      value: stats.classes_completed,
      description: "individual lessons done",
    },
    {
      label: "Quizzes Taken",
      value: stats.quizzes_taken,
      description: "module + adaptive quizzes",
    },
    {
      label: "Vocabulary Learned",
      value: stats.vocabulary_count,
      description: "unique Malay words",
    },
    {
      label: "Grammar Rules",
      value: stats.grammar_count,
      description: "rules encountered",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border bg-card p-5 space-y-1"
        >
          <p className="text-sm text-muted-foreground">{card.label}</p>
          <p className="text-3xl font-bold tabular-nums">{card.value}</p>
          <p className="text-xs text-muted-foreground">{card.description}</p>
        </div>
      ))}
    </div>
  );
}
