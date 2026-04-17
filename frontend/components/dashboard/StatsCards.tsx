"use client";

import { BookOpen, BookCheck, GraduationCap, ClipboardList, Languages, Pencil, Flame, Star } from "lucide-react";
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
      icon: <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
      // warm wheat accent — olive-parchment tone
      iconClass: "bg-accent/20 text-foreground border-accent/40",
    },
    {
      label: "Modules Completed",
      value: stats.modules_completed,
      description: `of ${stats.courses_created > 0 ? "all" : "0"} modules`,
      icon: <BookCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
      // olive green primary
      iconClass: "bg-primary/10 text-primary border-primary/20",
    },
    {
      label: "Classes Completed",
      value: stats.classes_completed,
      description: "individual lessons done",
      icon: <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
      // warm secondary (secondary is --decea0 wheat)
      iconClass: "bg-secondary text-secondary-foreground border-border",
    },
    {
      label: "Quizzes Taken",
      value: stats.quizzes_taken,
      description: "module + adaptive",
      icon: <ClipboardList className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
      // chart-3 (light sage) bg + chart-4 (deep sage) icon — replaces off-theme purple
      iconClass: "bg-chart-3/25 text-chart-4 border-chart-3/40 dark:bg-chart-3/15 dark:text-chart-3 dark:border-chart-3/25",
    },
    {
      label: "Vocabulary Learned",
      value: stats.vocabulary_count,
      description: "unique Malay words",
      icon: <Languages className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
      // coral destructive — warm salmon
      iconClass: "bg-destructive/10 text-destructive border-destructive/20",
    },
    {
      label: "Grammar Rules",
      value: stats.grammar_count,
      description: "rules encountered",
      icon: <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
      // chart-5 (darkest sage) for a distinct earthy tone
      iconClass: "bg-chart-5/15 text-chart-5 border-chart-5/30 dark:bg-chart-5/20 dark:text-chart-3 dark:border-chart-5/35",
    },
    {
      label: "Day Streak",
      value: stats.streak_count,
      description: "consecutive days",
      icon: <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
      iconClass: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    },
    {
      label: "Total XP",
      value: stats.xp_total,
      description: "experience points",
      icon: <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
      iconClass: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    },
  ];

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
      {cards.map((card) => (
        <li key={card.label} className="list-none">
          <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-1.5 sm:p-2">
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
              borderWidth={3}
            />
            <div className="relative flex h-full flex-col justify-between gap-2 sm:gap-4 overflow-hidden rounded-xl border-[0.75px] border-border bg-background p-2.5 sm:p-5 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)]">
              <div className={`w-fit rounded-lg border-[0.75px] p-1.5 sm:p-2 ${card.iconClass}`}>
                {card.icon}
              </div>
              <div className="space-y-0.5 min-w-0">
                <p className="text-[9px] sm:text-xs font-medium uppercase tracking-wide sm:tracking-widest text-muted-foreground leading-tight">{card.label}</p>
                {/* Use ?? 0 so undefined values (stale cache) still render as 0 */}
                <p className="text-xl sm:text-3xl font-bold tabular-nums font-heading text-foreground">
                  {card.value ?? 0}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{card.description}</p>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
