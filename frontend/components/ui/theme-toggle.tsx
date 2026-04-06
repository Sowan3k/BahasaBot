"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/use-theme";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={cn(
        "flex w-16 h-8 p-1 rounded-full cursor-pointer transition-all duration-300",
        // Use botanical theme tokens — warm muted bg with on-theme border
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
        {/* Active indicator (left in dark, right in light) */}
        <div
          className={cn(
            "flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300",
            isDark
              ? "translate-x-0 bg-primary/30"
              : "translate-x-8 bg-muted"
          )}
        >
          {isDark ? (
            <Moon className="w-4 h-4 text-primary" strokeWidth={1.5} />
          ) : (
            <Sun className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          )}
        </div>
        {/* Inactive icon */}
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
