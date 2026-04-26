"use client";

/**
 * ChatMessage
 *
 * Renders a single chat message bubble.
 * - User messages: right-aligned, gradient primary bg, sharp rounded corners.
 * - Assistant messages: left-aligned, glass card with left accent line, max-w-2xl.
 *   - Rendered via react-markdown so bold, lists, and inline code display correctly.
 *   - **word** = meaning patterns are extracted BEFORE markdown parsing and
 *     replaced with interactive VocabPill components (hover to see translation).
 */

import { Fragment, memo, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { Volume2 } from "lucide-react";
import { usePronunciation } from "@/lib/hooks/usePronunciation";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  /** Shows a blinking cursor while the assistant is still streaming */
  isStreaming?: boolean;
}

// ── Vocab pre-processing ─────────────────────────────────────────────────────

/**
 * Matches **word** = meaning in assistant output.
 * Extracted BEFORE react-markdown sees the string so that these patterns
 * become VocabPills rather than plain <strong> elements.
 */
const VOCAB_EXTRACT_RE = /\*\*([^*]+)\*\*\s*=\s*([^\n*]+)/g;

/** Replace every **word** = meaning with the §V§word§meaning§ placeholder. */
function preprocessContent(text: string): string {
  VOCAB_EXTRACT_RE.lastIndex = 0;
  return text.replace(
    VOCAB_EXTRACT_RE,
    (_, malay, english) => `§V§${malay.trim()}§${english.trim()}§`,
  );
}

const INLINE_TOOLTIP_W = 220;
const INLINE_TOOLTIP_H = 64;
const INLINE_TOOLTIP_MARGIN = 10;
const INLINE_TOOLTIP_GAP = 8;

type InlineTooltipCoords = {
  top: number;
  left: number;
  openBelow: boolean;
};

function computeInlineTooltipCoords(rect: DOMRect): InlineTooltipCoords {
  const vw = window.innerWidth;
  const openBelow = rect.top < INLINE_TOOLTIP_H + INLINE_TOOLTIP_MARGIN;
  const top = openBelow
    ? rect.bottom + INLINE_TOOLTIP_GAP
    : rect.top - INLINE_TOOLTIP_GAP;
  const centeredLeft = rect.left + rect.width / 2 - INLINE_TOOLTIP_W / 2;
  const left = Math.max(
    INLINE_TOOLTIP_MARGIN,
    Math.min(centeredLeft, vw - INLINE_TOOLTIP_W - INLINE_TOOLTIP_MARGIN),
  );

  return { top, left, openBelow };
}

/**
 * Chatbot-only inline Malay word rendering.
 * Desktop users can hover/focus; touch users can tap to open the same tooltip.
 */
function InlineMalayWord({ malay, english }: { malay: string; english: string }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [coords, setCoords] = useState<InlineTooltipCoords | null>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const wordRef = useRef<HTMLButtonElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTouchRef = useRef(0);
  const { speak, isSupported } = usePronunciation();

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
    if (wordRef.current) {
      setCoords(computeInlineTooltipCoords(wordRef.current.getBoundingClientRect()));
    }
    setShowTooltip(true);
  }

  function scheduleClose() {
    if (Date.now() - lastTouchRef.current < 500) return;
    hideTimer.current = setTimeout(() => setShowTooltip(false), 120);
  }

  function toggleTooltip(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    if (showTooltip) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setShowTooltip(false);
      return;
    }
    openTooltip();
  }

  const arrowClass = coords?.openBelow
    ? "bottom-full border-b-gray-900"
    : "top-full border-t-gray-900";

  return (
    <span ref={wrapperRef} className="relative inline align-baseline mx-px">
      <button
        ref={wordRef}
        type="button"
        onClick={toggleTooltip}
        onMouseEnter={openTooltip}
        onMouseLeave={scheduleClose}
        onFocus={openTooltip}
        onBlur={scheduleClose}
        onTouchStart={() => { lastTouchRef.current = Date.now(); }}
        className="inline border-0 bg-transparent p-0 align-baseline font-medium leading-normal
                   text-foreground underline decoration-amber-600/60 decoration-dotted
                   underline-offset-2 cursor-help transition-colors
                   hover:text-primary focus-visible:outline-none focus-visible:text-primary"
        aria-label={`${malay} means ${english}`}
      >
        {malay}
      </button>
      {isSupported && (
        <button
          type="button"
          title={`Pronounce "${malay}"`}
          aria-label={`Pronounce ${malay}`}
          onClick={(e) => { e.stopPropagation(); speak(malay); }}
          className="mx-0.5 inline-flex translate-y-[1px] items-center align-baseline
                     text-muted-foreground/55 hover:text-primary
                     transition-colors active:scale-95 p-px"
        >
          <Volume2 size={10} />
        </button>
      )}

      {showTooltip && coords && (
        <span
          role="tooltip"
          onMouseEnter={openTooltip}
          onMouseLeave={scheduleClose}
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            width: INLINE_TOOLTIP_W,
            transform: coords.openBelow ? undefined : "translateY(-100%)",
          }}
          className="z-50 rounded-md bg-gray-900 px-3 py-2 text-xs text-white shadow-lg"
        >
          <span className="flex items-center gap-2 leading-snug">
            <span className="min-w-0 break-words">{english}</span>
            {isSupported && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); speak(malay); }}
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
          <span
            className={`absolute left-1/2 -translate-x-1/2 ${arrowClass} border-4 border-transparent`}
          />
        </span>
      )}
    </span>
  );
}

/** Split a plain text string on §V§ placeholders → React nodes. */
function parseVocabText(text: string): React.ReactNode[] {
  const parts = text.split(/§V§([^§]+)§([^§]+)§/);
  if (parts.length === 1) return [text];

  const result: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i += 3) {
    if (parts[i]) result.push(parts[i]);
    if (i + 2 < parts.length) {
      result.push(
        <InlineMalayWord
          key={`vp-${i}-${parts[i + 1]}`}
          malay={parts[i + 1]}
          english={parts[i + 2]}
        />,
      );
    }
  }
  return result;
}

/**
 * Walk React children recursively.
 * String nodes are scanned for §V§ placeholders and expanded into VocabPills.
 * React elements (e.g. <strong>) are passed through unchanged.
 */
function processNodes(node: React.ReactNode): React.ReactNode {
  if (typeof node === "string") {
    const parts = parseVocabText(node);
    return parts.length === 1 && typeof parts[0] === "string"
      ? parts[0]
      : <>{parts}</>;
  }
  if (Array.isArray(node)) {
    return (
      <>
        {node.map((child, i) => (
          <Fragment key={i}>{processNodes(child)}</Fragment>
        ))}
      </>
    );
  }
  return node;
}

// ── Markdown component renderers ─────────────────────────────────────────────

const mdComponents: Components = {
  p({ children }) {
    return (
      <p className="mb-2 last:mb-0 leading-relaxed">
        {processNodes(children)}
      </p>
    );
  },
  ul({ children }) {
    return (
      <ul className="list-disc list-outside pl-5 mb-2 space-y-0.5">
        {children}
      </ul>
    );
  },
  ol({ children }) {
    return (
      <ol className="list-decimal list-outside pl-5 mb-2 space-y-0.5">
        {children}
      </ol>
    );
  },
  li({ children }) {
    return <li className="leading-relaxed">{processNodes(children)}</li>;
  },
  strong({ children }) {
    return <strong className="font-semibold">{children}</strong>;
  },
  em({ children }) {
    return <em className="italic">{children}</em>;
  },
  code({ children }) {
    return (
      <code className="px-1 py-0.5 rounded-sm text-xs font-mono bg-primary/10 text-primary border border-primary/20">
        {children}
      </code>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-l-2 border-primary/40 pl-3 italic text-muted-foreground my-2">
        {children}
      </blockquote>
    );
  },
};

// ── Typing / thinking indicator ───────────────────────────────────────────────

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2.5 py-1">
      {/* Three bouncing dots */}
      <span className="flex items-end gap-1">
        {[0, 160, 320].map((delay, i) => (
          <span
            key={i}
            className="block w-2 h-2 rounded-full bg-primary/70 animate-bounce"
            style={{ animationDelay: `${delay}ms`, animationDuration: "1.1s" }}
          />
        ))}
      </span>
      <span className="text-xs text-muted-foreground/60 select-none tracking-wide">
        Thinking…
      </span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

const ChatMessage = memo(function ChatMessage({
  role,
  content,
  isStreaming = false,
}: ChatMessageProps) {
  const isUser = role === "user";

  /** Pre-process assistant content to extract vocab patterns before markdown parsing. */
  const processedContent = useMemo(
    () => (isUser ? content : preprocessContent(content)),
    [content, isUser],
  );

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-3`}>

      {/* Avatar — bot only */}
      {!isUser && (
        <img
          src="/malaysia-flag.png"
          alt="BahasaBot"
          className="flex-shrink-0 w-8 h-8 rounded-full mr-2 mt-1 select-none object-cover"
        />
      )}

      {isUser ? (
        /* ── User bubble — tinted pill, clearly distinct from assistant ── */
        <div className="flex items-stretch max-w-[78%] sm:max-w-sm">
          <div className="rounded-2xl rounded-br-sm px-4 py-3
            bg-primary/20 backdrop-blur-sm
            border border-primary/25
            text-foreground shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {content}
            </p>
          </div>
          {/* Right accent line */}
          <div className="w-0.5 flex-shrink-0 rounded-full ml-2 self-stretch
            bg-gradient-to-b from-primary/60 via-primary/30 to-transparent" />
        </div>
      ) : (
        <div className="flex items-stretch min-w-0 max-w-[92%] sm:max-w-2xl">
          <div className="w-0.5 flex-shrink-0 rounded-full mr-2 self-stretch
            bg-gradient-to-b from-primary/50 via-primary/25 to-transparent" />
          <div className="min-w-0 rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed
            bg-card/55 backdrop-blur-md border border-border/70
            shadow-[0_2px_14px_rgba(0,0,0,0.18)]">
            {content === "" && isStreaming ? (
              <ThinkingIndicator />
            ) : (
              <>
                <ReactMarkdown components={mdComponents}>
                  {processedContent}
                </ReactMarkdown>
                {isStreaming && (
                  <span className="inline-block w-1 h-4 bg-primary/70 ml-0.5 animate-pulse rounded-sm" />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default ChatMessage;
