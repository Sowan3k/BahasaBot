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

/**
 * Chatbot-only inline Malay word rendering.
 * Renders as underlined text (no pill border/bg) + small trailing speaker icon.
 * The tooltip for the English meaning is in the title attribute (hover to see).
 */
function InlineMalayWord({ malay, english }: { malay: string; english: string }) {
  const { speak, isSupported } = usePronunciation();
  return (
    <span className="inline-flex items-baseline gap-0.5 mx-px">
      <span
        title={english}
        className="font-medium underline decoration-amber-600/50 decoration-dotted
                   underline-offset-2 cursor-help"
      >
        {malay}
      </span>
      {isSupported && (
        <button
          type="button"
          title={`Pronounce "${malay}"`}
          aria-label={`Pronounce ${malay}`}
          onClick={(e) => { e.stopPropagation(); speak(malay); }}
          className="inline-flex items-center text-muted-foreground/50 hover:text-primary
                     transition-colors active:scale-95 p-px"
        >
          <Volume2 size={10} />
        </button>
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
        /* ── Assistant — plain text directly on page, no bubble container ── */
        <div className="min-w-0 max-w-[92%] sm:max-w-2xl text-sm leading-relaxed">
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
      )}
    </div>
  );
});

export default ChatMessage;
