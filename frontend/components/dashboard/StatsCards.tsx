"use client";

import type { DashboardStats } from "@/lib/types";

interface Props {
  stats: DashboardStats;
}

interface StatCard {
  label: string;
  value: string | number;
  description: string;
  color: string;
}

export default function StatsCards({ stats }: Props) {
  const cards: StatCard[] = [
    { label: "Courses Created",    value: stats.courses_created ?? 0,   description: "AI-generated",     color: "text-foreground"  },
    { label: "Modules Completed",  value: stats.modules_completed ?? 0, description: "modules done",     color: "text-primary"     },
    { label: "Classes Completed",  value: stats.classes_completed ?? 0, description: "lessons done",     color: "text-foreground"  },
    { label: "Quizzes Taken",      value: stats.quizzes_taken ?? 0,     description: "module + adaptive",color: "text-chart-4"     },
    { label: "Vocabulary Learned", value: stats.vocabulary_count ?? 0,  description: "Malay words",      color: "text-destructive" },
    { label: "Grammar Rules",      value: stats.grammar_count ?? 0,     description: "rules learned",    color: "text-chart-5"     },
    { label: "Day Streak",         value: stats.streak_count ?? 0,      description: "consecutive days", color: "text-orange-500"  },
    { label: "Total XP",           value: stats.xp_total ?? 0,          description: "experience pts",   color: "text-yellow-500"  },
  ];

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
      {cards.map((card) => (
        <li key={card.label} className="list-none">
          <div className="rounded-lg border bg-background px-3 py-2 h-full">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground leading-tight truncate">
              {card.label}
            </p>
            <p className={`text-2xl font-bold tabular-nums font-heading mt-0.5 ${card.color}`}>
              {card.value}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">{card.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
