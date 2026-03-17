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

import { useState } from "react";

// Matches:  **<malay word>** = <english meaning>
// Captures: group 1 = malay word, group 2 = english meaning
const VOCAB_PATTERN = /\*\*([^*]+)\*\*\s*=\s*([^\n*]+)/g;

interface VocabPillProps {
  malay: string;
  english: string;
}

function VocabPill({ malay, english }: VocabPillProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span className="relative inline-block mx-0.5">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium
                   bg-emerald-100 text-emerald-800 border border-emerald-300
                   hover:bg-emerald-200 transition-colors cursor-help"
        aria-label={`${malay} means ${english}`}
      >
        {malay}
        <span className="text-xs text-emerald-500">▾</span>
      </button>

      {showTooltip && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-20
                     whitespace-nowrap rounded-md px-2 py-1 text-xs
                     bg-gray-900 text-white shadow-lg pointer-events-none"
          role="tooltip"
        >
          {english}
          {/* Tooltip arrow */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4
                            border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  );
}

/**
 * parseWithVocabHighlights
 *
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
      />
    );

    lastIndex = matchStart + fullMatch.length;
  }

  // Push any remaining plain text after the last match
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}
