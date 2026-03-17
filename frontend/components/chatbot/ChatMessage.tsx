"use client";

/**
 * ChatMessage
 *
 * Renders a single chat message bubble.
 * - User messages: right-aligned, blue background.
 * - Assistant messages: left-aligned, white background with vocabulary pills.
 *
 * Assistant message content is rendered line-by-line so that vocab highlight
 * patterns (**word** = meaning) are parsed per line.
 */

import { parseWithVocabHighlights } from "./VocabularyHighlight";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  /** Shows a blinking cursor — used while the assistant is still streaming */
  isStreaming?: boolean;
}

export default function ChatMessage({
  role,
  content,
  isStreaming = false,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {/* Avatar — only for assistant */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center
                        text-white text-xs font-bold mr-2 mt-1 select-none">
          BB
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm
          ${isUser
            ? "bg-blue-600 text-white rounded-br-sm"
            : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
          }`}
      >
        {isUser ? (
          // User messages: plain text, no vocab parsing
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {content}
          </p>
        ) : (
          // Assistant messages: parse line by line for vocab highlights
          <div className="text-sm leading-relaxed">
            {content.split("\n").map((line, lineIndex) => {
              const parsed = parseWithVocabHighlights(line);
              return (
                <p key={lineIndex} className="whitespace-pre-wrap break-words mb-1 last:mb-0">
                  {parsed}
                </p>
              );
            })}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-emerald-500 ml-0.5 animate-pulse rounded-sm" />
            )}
          </div>
        )}
      </div>

      {/* Avatar — only for user */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center
                        text-white text-xs font-bold ml-2 mt-1 select-none">
          You
        </div>
      )}
    </div>
  );
}
