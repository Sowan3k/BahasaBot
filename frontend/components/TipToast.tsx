"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { tipsApi, profileApi } from "@/lib/api";
import type { Tip, TipCategory } from "@/lib/types";

// ── Category display metadata ─────────────────────────────────────────────────

const CATEGORY_META: Record<
  TipCategory,
  { label: string; emoji: string }
> = {
  word_origin: { label: "Word Origin", emoji: "🌱" },
  common_mistakes: { label: "Common Mistake", emoji: "⚠️" },
  cultural_context: { label: "Culture", emoji: "🎭" },
  grammar: { label: "Grammar", emoji: "📝" },
};

// How long (ms) the toast stays before auto-dismissing
const DISPLAY_DURATION_MS = 8_000;
// Delay (ms) after mount before the toast slides in
const MOUNT_DELAY_MS = 2_000;
const SESSION_KEY = "tip_dismissed";

// ── Component ─────────────────────────────────────────────────────────────────

export default function TipToast() {
  const { status } = useSession();
  const [tip, setTip] = useState<Tip | null>(null);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100); // shrinks 100→0 over DISPLAY_DURATION_MS
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasFetched = useRef(false); // ensure we only trigger the tip once per mount

  // Read profile from the shared cache (layout.tsx already fetched it — no extra request).
  // Tip is suppressed during the new-user flow so it never overlaps onboarding or the UI tour.
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.getProfile().then((r) => r.data),
    enabled: status === "authenticated",
    staleTime: 60_000,
  });

  // ── Fetch tip once profile is known ─────────────────────────────────────

  useEffect(() => {
    // Wait until profile has loaded before deciding whether to show
    if (profile === undefined) return;
    // Only trigger once (profile may be invalidated/re-fetched in the same session)
    if (hasFetched.current) return;
    // New user: onboarding not yet done OR tour not yet seen — suppress tip entirely
    if (!profile.onboarding_completed || !profile.has_seen_tour) return;
    // Already dismissed this session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    hasFetched.current = true;

    const fetchTip = async () => {
      try {
        const res = await tipsApi.getRandom();
        setTip(res.data);

        // Wait 2 s before showing so the page has settled
        const showTimer = setTimeout(() => {
          setVisible(true);
          startTimers();
        }, MOUNT_DELAY_MS);

        return () => clearTimeout(showTimer);
      } catch {
        // Silently fail — tips are non-critical
      }
    };

    fetchTip();
  }, [profile]); // re-runs each time profile loads or is invalidated

  useEffect(() => {
    return () => clearAll();
  }, []); // cleanup timers on unmount

  // ── Auto-dismiss timers ───────────────────────────────────────────────────

  function startTimers() {
    // Shrink progress bar every 80 ms (100 ticks over 8 s)
    const tickMs = DISPLAY_DURATION_MS / 100;
    progressTimer.current = setInterval(() => {
      setProgress((p) => {
        if (p <= 0) return 0;
        return p - 1;
      });
    }, tickMs);

    dismissTimer.current = setTimeout(() => {
      dismiss();
    }, DISPLAY_DURATION_MS);
  }

  function clearAll() {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    if (progressTimer.current) clearInterval(progressTimer.current);
  }

  function dismiss() {
    clearAll();
    setVisible(false);
    sessionStorage.setItem(SESSION_KEY, "1");
  }

  // ── Nothing to show ───────────────────────────────────────────────────────

  if (!tip) return null;

  const meta =
    CATEGORY_META[tip.category as TipCategory] ?? {
      label: tip.category,
      emoji: "💡",
    };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="tip-toast"
          initial={{ opacity: 0, x: 80, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 80, y: 20 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          // Fixed bottom-right — sits above all content
          className="fixed bottom-6 right-6 z-[85] w-[320px] max-w-[calc(100vw-2rem)]"
          role="status"
          aria-live="polite"
        >
          {/* ── Card shell ── */}
          <div
            className={[
              // Base shape
              "relative overflow-hidden rounded-2xl",
              // Layered background: warm card base with subtle glass frosting
              "bg-card/95 backdrop-blur-md",
              // Border — lighter in dark mode, gentle in light mode
              "border border-border/60",
              // Shadow — deeper in dark mode for better separation
              "shadow-xl shadow-black/20 dark:shadow-black/50",
            ].join(" ")}
          >
            {/* Decorative purple glow top-right */}
            <div
              className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, #6C5CE7, transparent 70%)" }}
            />

            {/* ── Inner padding ── */}
            <div className="px-4 pt-4 pb-3">
              {/* Header row: category label + close */}
              <div className="flex items-center justify-between mb-2.5">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase"
                  style={{
                    background: "rgba(245, 134, 35, 0.15)",
                    color: "#F58623",
                  }}
                >
                  <span>{meta.emoji}</span>
                  <span>{meta.label}</span>
                </span>

                <button
                  onClick={dismiss}
                  aria-label="Close tip"
                  className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Divider */}
              <div className="h-px bg-border/50 mb-3" />

              {/* Tip text */}
              <p className="text-sm leading-relaxed text-foreground/90">
                {tip.content}
              </p>

              {/* Footer branding */}
              <div className="mt-3 flex items-center gap-1.5">
                <Sparkles size={12} className="text-primary/60" />
                <span className="text-[11px] text-muted-foreground/70">
                  Daily Malay Tip · BahasaBot
                </span>
              </div>
            </div>

            {/* ── Progress bar (purple, shrinks left-to-right) ── */}
            <div className="h-1 w-full bg-muted/60">
              <div
                className="h-full rounded-full transition-none"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #6C5CE7, #a29bfe)",
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
