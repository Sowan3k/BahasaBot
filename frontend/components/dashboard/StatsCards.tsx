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
  Icon: React.ElementType;
  iconColor: string;  // Tailwind text color class for the watermark icon
}

export default function StatsCards({ stats }: Props) {
  const cards: StatCard[] = [
    {
      label: "Courses",
      value: stats.courses_created,
      description: "AI-generated",
      Icon: BookOpen,
      iconColor: "text-primary/20",
    },
    {
      label: "Modules Done",
      value: stats.modules_completed,
      description: "completed",
      Icon: BookCheck,
      iconColor: "text-primary/20",
    },
    {
      label: "Classes Done",
      value: stats.classes_completed,
      description: "lessons",
      Icon: GraduationCap,
      iconColor: "text-primary/20",
    },
    {
      label: "Quizzes",
      value: stats.quizzes_taken,
      description: "taken",
      Icon: ClipboardList,
      iconColor: "text-chart-3/30",
    },
    {
      label: "Vocabulary",
      value: stats.vocabulary_count,
      description: "Malay words",
      Icon: Languages,
      iconColor: "text-destructive/20",
    },
    {
      label: "Grammar",
      value: stats.grammar_count,
      description: "rules",
      Icon: Pencil,
      iconColor: "text-chart-5/25",
    },
    {
      label: "Streak",
      value: stats.streak_count,
      description: "days",
      Icon: Flame,
      iconColor: "text-orange-500/25",
    },
    {
      label: "Total XP",
      value: stats.xp_total,
      description: "experience",
      Icon: Star,
      iconColor: "text-yellow-500/25",
    },
  ];

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
      {cards.map((card) => (
        <li key={card.label} className="list-none">
          <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-1.5">
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
              borderWidth={3}
            />
            {/* Card body — relative so watermark icon can be absolutely placed */}
            <div className="relative overflow-hidden rounded-xl border-[0.75px] border-border
                            bg-background p-3 sm:p-4 shadow-sm
                            dark:shadow-[0px_0px_27px_0px_rgba(0,0,0,0.4)]
                            h-full flex flex-col justify-between gap-2">
              {/* Watermark icon — large, faint, top-right corner */}
              <card.Icon
                className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-10 sm:h-10 ${card.iconColor} pointer-events-none select-none`}
                aria-hidden
              />

              {/* Content — left side, ignores the icon area */}
              <div className="space-y-0.5 min-w-0 pr-8 sm:pr-10">
                <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest
                              text-muted-foreground leading-tight truncate">
                  {card.label}
                </p>
                <p className="text-2xl sm:text-3xl font-bold tabular-nums font-heading text-foreground leading-none">
                  {card.value ?? 0}
                </p>
              </div>

              <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                {card.description}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
