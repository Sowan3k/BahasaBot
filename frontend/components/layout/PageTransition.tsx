"use client";

/**
 * PageTransition
 *
 * Wraps page content with a subtle fade-in animation on mount.
 * Used in the shared dashboard layout keyed by pathname so every navigation
 * triggers the entrance animation without an exit delay.
 *
 * Props:
 *   children — page content
 *   className — optional extra Tailwind classes (e.g. "flex-1 flex flex-col")
 */

import { motion } from "framer-motion";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      // min-h-0 keeps the flex height chain intact for flex-fill pages (e.g. chatbot).
      // Without it, the motion.div's default min-height:auto breaks the chatbot's
      // internal scroll (footer gets pushed below the viewport).
      // y-translation is intentionally omitted: a translateY offset shifts content
      // visually past the viewport edge, clipping the chatbot footer and quiz bottom elements.
      style={{ minHeight: 0 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
