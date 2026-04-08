"use client";

/**
 * GlowCard — reusable card with rainbow glowing border hover effect
 *
 * Wraps any content with the same proximity-tracking glowing border effect
 * used on dashboard stat cards. Apply everywhere a card appears in the app.
 *
 * Usage:
 *   <GlowCard className="p-5">content</GlowCard>
 *
 * Props:
 *   className     — added to the INNER content div (padding, spacing, etc.)
 *   outerClassName — added to the outer wrapper (for height, width, etc.)
 *   as            — HTML element for the outer wrapper (default: "div")
 */

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { GlowingEffect } from "./glowing-effect";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;        // inner card styles (bg, padding, etc.)
  outerClassName?: string;   // outer wrapper styles (h-full, etc.)
  spread?: number;
  proximity?: number;
  borderWidth?: number;
}

const GlowCard = forwardRef<HTMLDivElement, GlowCardProps>(
  (
    {
      children,
      className,
      outerClassName,
      spread = 40,
      proximity = 64,
      borderWidth = 3,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-[1.25rem] border-[0.75px] border-border p-2",
          outerClassName
        )}
      >
        <GlowingEffect
          spread={spread}
          glow={true}
          disabled={false}
          proximity={proximity}
          inactiveZone={0.01}
          borderWidth={borderWidth}
        />
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border-[0.75px] border-border bg-background shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)]",
            className
          )}
        >
          {children}
        </div>
      </div>
    );
  }
);

GlowCard.displayName = "GlowCard";

export { GlowCard };
