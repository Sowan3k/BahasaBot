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

import { Fragment, memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { VocabPill } from "./VocabularyHighlight";

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

/** Split a plain text string on §V§ placeholders → React nodes. */
function parseVocabText(text: string): React.ReactNode[] {
  const parts = text.split(/§V§([^§]+)§([^§]+)§/);
  if (parts.length === 1) return [text];

  const result: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i += 3) {
    if (parts[i]) result.push(parts[i]);
    if (i + 2 < parts.length) {
      result.push(
        <VocabPill
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

// ── Typing indicator — audio-visualizer style ────────────────────────────────

function TypingBars() {
  const heights = [10, 14, 8, 13, 7];
  return (
    <span className="flex gap-0.5 items-end py-0.5 h-5">
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-0.5 bg-primary/50 rounded-sm animate-pulse"
          style={{
            height: `${h}px`,
            animationDelay: `${i * 110}ms`,
            animationDuration: "750ms",
          }}
        />
      ))}
    </span>
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
        /* ── User bubble — olive/primary tint so it's clearly distinct from bot ── */
        <div className="flex items-stretch max-w-[78%] sm:max-w-sm">
          <div className="rounded-2xl rounded-br-sm px-4 py-3
            bg-primary/25 backdrop-blur-sm
            border border-primary/30
            text-foreground shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {content}
            </p>
          </div>

          {/* Right accent line */}
          <div className="w-0.5 flex-shrink-0 rounded-full ml-2 self-stretch
            bg-gradient-to-b from-primary/70 via-primary/40 to-transparent" />
        </div>
      ) : (
        /* ── Assistant bubble — neutral glass card, clearly different from user ── */
        <div className="flex items-stretch max-w-[88%] sm:max-w-2xl">
          {/* Left accent line */}
          <div className="w-0.5 flex-shrink-0 rounded-full mr-2 self-stretch
            bg-gradient-to-b from-border via-border/50 to-transparent" />

          <div className="rounded-2xl rounded-bl-sm px-4 py-3
            bg-card/60 backdrop-blur-sm
            border border-white/8
            text-card-foreground shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
            <div className="text-sm leading-relaxed">
              {content === "" && isStreaming ? (
                <TypingBars />
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
        </div>
      )}
    </div>
  );
});

export default ChatMessage;
