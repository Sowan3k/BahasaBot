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
  iconClass: string;
}

export default function StatsCards({ stats }: Props) {
  const cards: StatCard[] = [
    {
      label: "Courses Created",
      value: stats.courses_created,
      description: "AI-generated courses",
      icon: <BookOpen className="h-4 w-4" />,
      iconClass: "bg-accent/20 text-amber-700 border-accent/30 dark:text-amber-400",
    },
    {
      label: "Modules Completed",
      value: stats.modules_completed,
      description: `of ${stats.courses_created > 0 ? "all" : "0"} modules`,
      icon: <BookCheck className="h-4 w-4" />,
      iconClass: "bg-primary/10 text-primary border-primary/20",
    },
    {
      label: "Classes Completed",
      value: stats.classes_completed,
      description: "individual lessons done",
      icon: <GraduationCap className="h-4 w-4" />,
      iconClass: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    },
    {
      label: "Quizzes Taken",
      value: stats.quizzes_taken,
      description: "module + adaptive quizzes",
      icon: <ClipboardList className="h-4 w-4" />,
      iconClass: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
    },
    {
      label: "Vocabulary Learned",
      value: stats.vocabulary_count,
      description: "unique Malay words",
      icon: <Languages className="h-4 w-4" />,
      iconClass: "bg-destructive/10 text-destructive border-destructive/20",
    },
    {
      label: "Grammar Rules",
      value: stats.grammar_count,
      description: "rules encountered",
      icon: <Pencil className="h-4 w-4" />,
      iconClass: "bg-accent/20 text-amber-700 border-accent/30 dark:text-amber-400",
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
              <div className={`w-fit rounded-lg border-[0.75px] p-2 ${card.iconClass}`}>
                {card.icon}
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{card.label}</p>
                <p className="text-3xl font-bold tabular-nums font-heading">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
