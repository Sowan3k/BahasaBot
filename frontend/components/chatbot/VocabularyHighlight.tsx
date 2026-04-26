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
// Tooltip is rendered with position:fixed so it escapes any overflow:auto/hidden
// ancestor (e.g. the chatbot's overflow-y-auto scroll container on mobile).
const TOOLTIP_W = 220;
const TOOLTIP_H = 52;
const SAFE_MARGIN = 10; // min px gap from viewport edge
const TOOLTIP_GAP = 6;  // gap between pill edge and tooltip

type TooltipCoords = {
  top: number;    // viewport-relative top for position:fixed
  left: number;   // viewport-relative left for position:fixed
  openBelow: boolean;
};

function computeTooltipCoords(rect: DOMRect): TooltipCoords {
  const vw = window.innerWidth;

  // Vertical: default above the pill; flip below if not enough room above
  const openBelow = rect.top < TOOLTIP_H + SAFE_MARGIN;
  // When openBelow the CSS translateY(-100%) trick is not needed; use raw bottom
  const top = openBelow ? rect.bottom + TOOLTIP_GAP : rect.top - TOOLTIP_GAP;

  // Horizontal: center on pill, clamped to viewport bounds
  const cx = rect.left + rect.width / 2;
  const rawLeft = cx - TOOLTIP_W / 2;
  const left = Math.max(SAFE_MARGIN, Math.min(rawLeft, vw - TOOLTIP_W - SAFE_MARGIN));

  return { top, left, openBelow };
}

// ── VocabPill ─────────────────────────────────────────────────────────────────

export function VocabPill({ malay, english }: VocabPillProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [coords, setCoords] = useState<TooltipCoords | null>(null);

  const pillRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  // Delayed hide: gives the mouse time to travel from pill → tooltip without blinking
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards scheduleClose against synthetic mouseleave fired by mobile browsers after a tap
  const lastTouchRef = useRef(0);

  // Single hook instance covers both the outside speaker and the one inside the tooltip
  const { speak, isSupported } = usePronunciation();

  // Close tooltip when user taps/clicks outside the pill wrapper (mobile support).
  // The tooltip DOM node is still a child of wrapperRef even though it's position:fixed,
  // so contains() correctly excludes taps on the open tooltip itself.
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
      setCoords(computeTooltipCoords(pillRef.current.getBoundingClientRect()));
    }
    setShowTooltip(true);
  }

  function scheduleClose() {
    // Mobile browsers fire a synthetic mouseleave ~300ms after a tap — ignore it
    if (Date.now() - lastTouchRef.current < 500) return;
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

  // Arrow direction based on whether tooltip is above or below the pill
  const arrowEdge = coords?.openBelow
    ? "bottom-full border-b-gray-900"   // tooltip below → arrow at top pointing up
    : "top-full border-t-gray-900";     // tooltip above → arrow at bottom pointing down

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
        onTouchStart={() => { lastTouchRef.current = Date.now(); }}
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

      {/* Tooltip — rendered position:fixed so it escapes overflow:auto ancestors.
          On mobile, the chatbot's overflow-y-auto container would clip a position:absolute
          tooltip; fixed positioning uses viewport coordinates instead. */}
      {showTooltip && coords && (
        <span
          role="tooltip"
          onMouseEnter={openTooltip}
          onMouseLeave={scheduleClose}
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            width: TOOLTIP_W,
            // When above the pill, shift the box up by its own height
            transform: coords.openBelow ? undefined : "translateY(-100%)",
          }}
          className="z-50 rounded-md px-3 py-2 text-xs bg-gray-900 text-white shadow-lg"
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

          {/* Directional arrow — always centered horizontally */}
          <span
            className={`absolute left-1/2 -translate-x-1/2 ${arrowEdge} border-4 border-transparent`}
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
