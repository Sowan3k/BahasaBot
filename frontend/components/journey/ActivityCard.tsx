"use client";

/**
 * ActivityCard — individual roadmap activity card
 *
 * Displays activity title, type badge, topic, and reason.
 * Clicking navigates to the relevant feature (course / quiz / chatbot).
 * Shows a completion checkmark when the activity is done.
 */

import { useRouter } from "next/navigation";
import { BookOpen, CheckCircle2, MessageCircle, Zap } from "lucide-react";

import type { JourneyActivity } from "@/lib/types";

interface ActivityCardProps {
  activity: JourneyActivity;
  completed: boolean;
  onComplete: (activityId: string) => void;
  isCompleting: boolean;
}

// ── Type badge config ──────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  course: {
    label: "Course",
    icon: BookOpen,
    bg: "bg-blue-500/15 dark:bg-blue-400/15",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
  },
  quiz: {
    label: "Quiz",
    icon: Zap,
    bg: "bg-amber-500/15 dark:bg-amber-400/15",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
  },
  chatbot: {
    label: "Tutor Chat",
    icon: MessageCircle,
    bg: "bg-emerald-500/15 dark:bg-emerald-400/15",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
  },
} as const;

export function ActivityCard({
  activity,
  completed,
  onComplete,
  isCompleting,
}: ActivityCardProps) {
  const router = useRouter();
  const config = TYPE_CONFIG[activity.type] ?? TYPE_CONFIG.chatbot;
  const Icon = config.icon;

  function handleClick() {
    // Navigate to the relevant feature with the topic pre-populated
    if (activity.type === "course") {
      const topic = encodeURIComponent(activity.topic);
      router.push(`/courses?topic=${topic}`);
    } else if (activity.type === "quiz") {
      router.push("/quiz/adaptive");
    } else {
      // chatbot — pre-fill prompt via query param
      const prompt = encodeURIComponent(
        `Let's practice: ${activity.topic}`
      );
      router.push(`/chatbot?prompt=${prompt}`);
    }
  }

  function handleComplete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!completed && !isCompleting) {
      onComplete(activity.id);
    }
  }

  return (
    <div
      className={`
        group relative flex items-start gap-3 rounded-xl border p-4
        transition-all duration-200 cursor-pointer
        ${
          completed
            ? "bg-primary/5 border-primary/20 opacity-80"
            : "bg-card border-border hover:border-primary/40 hover:bg-card/80 hover:shadow-sm"
        }
      `}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      aria-label={`${activity.title} — ${config.label}`}
    >
      {/* Type icon */}
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${config.bg} ${config.border}`}
      >
        <Icon className={`h-4 w-4 ${config.text}`} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Type badge */}
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${config.bg} ${config.text}`}
              >
                {config.label}
              </span>
              {completed && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Done
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-semibold text-foreground leading-snug">
              {activity.title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
              {activity.topic}
            </p>
          </div>

          {/* Complete toggle button */}
          <button
            onClick={handleComplete}
            disabled={completed || isCompleting}
            className={`
              shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-150
              ${
                completed
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-transparent text-transparent hover:border-primary/60 group-hover:border-primary/40"
              }
              disabled:cursor-default
            `}
            title={completed ? "Completed" : "Mark as done"}
            aria-label={completed ? "Completed" : "Mark as done"}
          >
            {completed && <CheckCircle2 className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Reason */}
        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed sm:line-clamp-2">
          {activity.reason}
        </p>
      </div>
    </div>
  );
}
