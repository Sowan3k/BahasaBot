"use client";

import { BookOpen, BookCheck, GraduationCap, ClipboardList, Languages, Pencil } from "lucide-react";
import type { DashboardStats } from "@/lib/types";
import { GlowingEffect } from "@/components/ui/glowing-effect";

interface Props {
  stats: DashboardStats;
}

interface StatCard {
  label: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
}

export default function StatsCards({ stats }: Props) {
  const cards: StatCard[] = [
    {
      label: "Courses Created",
      value: stats.courses_created,
      description: "AI-generated courses",
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      label: "Modules Completed",
      value: stats.modules_completed,
      description: `of ${stats.courses_created > 0 ? "all" : "0"} modules`,
      icon: <BookCheck className="h-4 w-4" />,
    },
    {
      label: "Classes Completed",
      value: stats.classes_completed,
      description: "individual lessons done",
      icon: <GraduationCap className="h-4 w-4" />,
    },
    {
      label: "Quizzes Taken",
      value: stats.quizzes_taken,
      description: "module + adaptive quizzes",
      icon: <ClipboardList className="h-4 w-4" />,
    },
    {
      label: "Vocabulary Learned",
      value: stats.vocabulary_count,
      description: "unique Malay words",
      icon: <Languages className="h-4 w-4" />,
    },
    {
      label: "Grammar Rules",
      value: stats.grammar_count,
      description: "rules encountered",
      icon: <Pencil className="h-4 w-4" />,
    },
  ];

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <li key={card.label} className="list-none">
          <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2">
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
              borderWidth={3}
            />
            <div className="relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-xl border-[0.75px] border-border bg-background p-5 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)]">
              <div className="w-fit rounded-lg border-[0.75px] border-border bg-muted p-2 text-muted-foreground">
                {card.icon}
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-3xl font-bold tabular-nums">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
