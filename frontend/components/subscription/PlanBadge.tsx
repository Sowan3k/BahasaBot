"use client";

import Link from "next/link";
import { CreditCard } from "lucide-react";

interface PlanBadgeProps {
  /** Show full pill (expanded sidebar) vs icon-only (collapsed sidebar) */
  collapsed?: boolean;
}

// Phase 25: always shows "Free Plan" — no backend subscription state yet.
export function PlanBadge({ collapsed = false }: PlanBadgeProps) {
  if (collapsed) {
    return (
      <div className="relative group/planbadge w-10 h-8 flex items-center justify-center">
        <Link
          href="/pricing"
          className="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
          title="Free Plan — view plans"
        >
          <CreditCard size={15} />
        </Link>
        <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 rounded-md bg-popover border border-border text-foreground text-xs whitespace-nowrap opacity-0 group-hover/planbadge:opacity-100 transition-opacity duration-150 delay-100 z-50 shadow-md">
          Free Plan
        </span>
      </div>
    );
  }

  return (
    <Link
      href="/pricing"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-muted/60 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors text-[11px] font-medium"
    >
      <CreditCard size={11} className="shrink-0" />
      Free Plan
    </Link>
  );
}
