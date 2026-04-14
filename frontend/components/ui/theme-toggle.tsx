"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/use-theme";

interface ThemeToggleProps {
  /** "pill" (default) — full w-16 h-8 toggle; "icon" — compact w-8 h-8 icon button */
  variant?: "pill" | "icon";
  className?: string;
}

export function ThemeToggle({ variant = "pill", className }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  if (variant === "icon") {
    return (
      <button
        onClick={toggle}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className={cn(
          // Match the NotificationBell button exactly — same size, shape, border, shadow
          "w-10 h-10 flex items-center justify-center rounded-full",
          "bg-card/90 hover:bg-card dark:bg-card/95",
          "border border-border",
          "shadow-md hover:shadow-lg",
          "text-foreground/70 hover:text-foreground",
          "transition-all duration-200 ease-out",
          "hover:scale-105 active:scale-90 active:shadow-sm",
          className
        )}
      >
        {isDark ? (
          <Sun className="w-4 h-4" strokeWidth={1.5} />
        ) : (
          <Moon className="w-4 h-4" strokeWidth={1.5} />
        )}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex w-16 h-8 p-1 rounded-full cursor-pointer transition-all duration-300",
        isDark
          ? "bg-muted border border-border"
          : "bg-background border border-border",
        className
      )}
      onClick={toggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && toggle()}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="flex justify-between items-center w-full">
        <div
          className={cn(
            "flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300",
            isDark ? "translate-x-0 bg-primary/30" : "translate-x-8 bg-muted"
          )}
        >
          {isDark ? (
            <Moon className="w-4 h-4 text-primary" strokeWidth={1.5} />
          ) : (
            <Sun className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          )}
        </div>
        <div
          className={cn(
            "flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300",
            isDark ? "bg-transparent" : "-translate-x-8"
          )}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          ) : (
            <Moon className="w-4 h-4 text-foreground" strokeWidth={1.5} />
          )}
        </div>
      </div>
    </div>
  );
}
