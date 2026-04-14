"use client";

/**
 * ChatMessage
 *
 * Renders a single chat message bubble.
 * - User messages: right-aligned, blue background, plain text, max-w-sm.
 * - Assistant messages: left-aligned, white background, max-w-2xl.
 *   - Rendered via react-markdown so bold, lists, and inline code display correctly.
 *   - **word** = meaning patterns are extracted BEFORE markdown parsing and
 *     replaced with interactive VocabPill components (hover to see translation).
 */

import { Fragment, useMemo } from "react";
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
  // Split by the two-capture-group pattern → ["before", "malay", "english", "after", ...]
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
      <code className="px-1 py-0.5 rounded text-xs font-mono bg-primary/10 text-primary border border-primary/20">
        {children}
      </code>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-l-4 border-border pl-3 italic text-muted-foreground my-2">
        {children}
      </blockquote>
    );
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ChatMessage({
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

      <div
        className={`rounded-2xl px-4 py-3 shadow-sm
          ${isUser
            ? "max-w-sm bg-primary text-primary-foreground rounded-br-sm"
            : "max-w-2xl bg-card text-card-foreground border border-border rounded-bl-sm"
          }`}
      >
        {isUser ? (
          /* User messages: plain text, no markdown parsing */
          <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
            {content}
          </p>
        ) : (
          /* Assistant messages: full markdown + vocab pills */
          <div className="text-sm sm:text-base leading-relaxed">
            {content === "" && isStreaming ? (
              /* Typing dots — shown while waiting for the first token */
              <span className="flex gap-1 items-center py-0.5">
                <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            ) : (
              <>
                <ReactMarkdown components={mdComponents}>
                  {processedContent}
                </ReactMarkdown>
                {isStreaming && (
                  <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse rounded-sm" />
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* No "You" avatar — right-aligned blue bubble is sufficient identification */}
    </div>
  );
}
