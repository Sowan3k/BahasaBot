"use client";

/**
 * VocabularyHighlight
 *
 * Parses an assistant message string and replaces patterns like:
 *   **selamat pagi** = good morning
 * with a styled inline pill showing the Malay word and its English meaning on hover.
 *
 * Returns an array of React nodes (text fragments + pill elements)
 * suitable for rendering inside a paragraph or span.
 */

import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { usePronunciation } from "@/lib/hooks/usePronunciation";

// Matches:  **<malay word>** = <english meaning>
// Captures: group 1 = malay word, group 2 = english meaning
const VOCAB_PATTERN = /\*\*([^*]+)\*\*\s*=\s*([^\n*]+)/g;

interface VocabPillProps {
  malay: string;
  english: string;
}

// ── Smart tooltip placement ───────────────────────────────────────────────────
// Approximate tooltip dimensions used to detect viewport overflow before render.
const TOOLTIP_W = 220;
const TOOLTIP_H = 52;
const SAFE_MARGIN = 10; // min px gap from viewport edge

type TooltipPlacement = {
  openBelow: boolean;  // true → render below pill (top-full), false → above (bottom-full)
  alignRight: boolean; // true → right-align tooltip to pill right edge
  alignLeft: boolean;  // true → left-align tooltip to pill left edge
};

function computePlacement(rect: DOMRect): TooltipPlacement {
  const vw = window.innerWidth;

  // Horizontal: center of pill, check if tooltip would overflow either side
  const cx = rect.left + rect.width / 2;
  const alignRight = cx + TOOLTIP_W / 2 > vw - SAFE_MARGIN;
  const alignLeft = !alignRight && cx - TOOLTIP_W / 2 < SAFE_MARGIN;

  // Vertical: default is above (bottom-full). Flip below if not enough room above.
  const openBelow = rect.top < TOOLTIP_H + SAFE_MARGIN;

  return { openBelow, alignRight, alignLeft };
}

// ── VocabPill ─────────────────────────────────────────────────────────────────

export function VocabPill({ malay, english }: VocabPillProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [placement, setPlacement] = useState<TooltipPlacement>({
    openBelow: false,
    alignRight: false,
    alignLeft: false,
  });

  const pillRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  // Delayed hide: gives the mouse time to travel from pill → tooltip without blinking
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Single hook instance covers both the outside speaker and the one inside the tooltip
  const { speak, isSupported } = usePronunciation();

  // Close tooltip when user taps/clicks outside the pill wrapper (mobile support)
  useEffect(() => {
    if (!showTooltip) return;
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowTooltip(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [showTooltip]);

  // Clear the timer on unmount to avoid setState-on-unmounted-component warnings
  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  function openTooltip() {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    if (pillRef.current) {
      setPlacement(computePlacement(pillRef.current.getBoundingClientRect()));
    }
    setShowTooltip(true);
  }

  function scheduleClose() {
    hideTimer.current = setTimeout(() => setShowTooltip(false), 120);
  }

  // Toggle on click/tap — primary interaction for mobile; on desktop complements hover
  function handlePillClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (showTooltip) {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
      setShowTooltip(false);
    } else {
      openTooltip();
    }
  }

  // ── Tooltip CSS classes (derived from placement) ─────────────────────────

  // Vertical position
  const yClass = placement.openBelow
    ? "top-full mt-1.5"     // below the pill
    : "bottom-full mb-1.5"; // above the pill (default)

  // Horizontal alignment
  const xClass = placement.alignRight
    ? "right-0"                     // right edge of tooltip aligns with right edge of wrapper
    : placement.alignLeft
    ? "left-0"                      // left edge of tooltip aligns with left edge of wrapper
    : "left-1/2 -translate-x-1/2"; // centered on pill (default)

  // Arrow: always centered in the tooltip — close enough visually, avoids
  // complex dynamic offset calculations when the tooltip is shifted.
  const arrowX = "left-1/2 -translate-x-1/2";

  // Arrow edge: points back toward the pill
  // Tooltip above → arrow at tooltip bottom, pointing down  → border-t colored
  // Tooltip below → arrow at tooltip top,    pointing up    → border-b colored
  const arrowEdge = placement.openBelow
    ? "bottom-full border-b-gray-900"
    : "top-full border-t-gray-900";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <span ref={wrapperRef} className="relative inline-flex items-center gap-0.5 mx-0.5">
      {/* Pill button — hover on desktop, tap on mobile */}
      <button
        ref={pillRef}
        type="button"
        title="Tap to see translation"
        onClick={handlePillClick}
        onMouseEnter={openTooltip}
        onMouseLeave={scheduleClose}
        onFocus={openTooltip}
        onBlur={scheduleClose}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium
                   bg-accent/20 text-amber-800 border border-accent/40
                   hover:bg-accent/30 dark:text-amber-300 dark:border-accent/30
                   transition-colors cursor-help"
        aria-label={`${malay} means ${english}`}
      >
        {malay}
        <span className="text-xs text-accent">▾</span>
      </button>

      {/* Standalone speaker button outside the tooltip (Phase 16).
          Uses the same usePronunciation hook instance — no double listener. */}
      {isSupported && (
        <button
          type="button"
          title={`Pronounce "${malay}"`}
          aria-label={`Pronounce ${malay}`}
          onClick={(e) => {
            e.stopPropagation();
            speak(malay);
          }}
          className="inline-flex items-center justify-center flex-shrink-0
                     rounded p-0.5 transition-colors
                     text-muted-foreground/60 hover:text-primary hover:bg-primary/10
                     active:scale-95"
        >
          <Volume2 size={12} />
        </button>
      )}

      {/* Smart tooltip */}
      {showTooltip && (
        <span
          role="tooltip"
          onMouseEnter={openTooltip}
          onMouseLeave={scheduleClose}
          className={`absolute ${yClass} ${xClass} z-30
                     w-max max-w-[220px] rounded-md px-3 py-2 text-xs
                     bg-gray-900 text-white shadow-lg`}
        >
          {/* Content row: meaning text + speaker button */}
          <span className="flex items-center gap-2 leading-snug">
            <span>{english}</span>
            {isSupported && (
              <button
                type="button"
                onClick={() => speak(malay)}
                onMouseEnter={openTooltip}
                className="flex-shrink-0 rounded p-0.5 text-white/70
                           hover:text-white hover:bg-white/20
                           transition-colors active:scale-95"
                aria-label={`Pronounce ${malay}`}
                title={`Pronounce ${malay}`}
              >
                <Volume2 size={12} />
              </button>
            )}
          </span>

          {/* Directional arrow */}
          <span
            className={`absolute ${arrowEdge} ${arrowX} border-4 border-transparent`}
          />
        </span>
      )}
    </span>
  );
}

// ── parseWithVocabHighlights ──────────────────────────────────────────────────

/**
 * Splits `text` on vocabulary patterns and returns an array of
 * plain string fragments and VocabPill elements.
 */
export function parseWithVocabHighlights(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset lastIndex before iterating (pattern is module-level with /g)
  VOCAB_PATTERN.lastIndex = 0;

  while ((match = VOCAB_PATTERN.exec(text)) !== null) {
    const [fullMatch, malay, english] = match;
    const matchStart = match.index;

    // Push the plain text before this match
    if (matchStart > lastIndex) {
      nodes.push(text.slice(lastIndex, matchStart));
    }

    // Push the vocab pill
    nodes.push(
      <VocabPill
        key={`${matchStart}-${malay}`}
        malay={malay.trim()}
        english={english.trim()}
      />,
    );

    lastIndex = matchStart + fullMatch.length;
  }

  // Push any remaining plain text after the last match
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}
