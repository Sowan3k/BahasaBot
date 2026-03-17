"use client";

/**
 * Chatbot Page — /chatbot
 *
 * Full-page streaming chat interface.
 * - Maintains a local message list.
 * - Sends messages to POST /api/chatbot/message and reads the SSE stream.
 * - Creates a new session on first message; reuses session_id thereafter.
 * - Parses SSE events: {type: "token"}, {type: "done"}, {type: "error"}.
 * - Auto-scrolls to the latest message.
 * - Handles loading, error, and empty states.
 */

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ChatMessage from "@/components/chatbot/ChatMessage";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

let msgCounter = 0;
function localId() {
  return `local-${++msgCounter}-${Date.now()}`;
}

export default function ChatbotPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for starter button clicks — set the input and submit
  useEffect(() => {
    function handleStarter(e: Event) {
      const text = (e as CustomEvent<string>).detail;
      if (!text || isStreaming) return;
      setInput(text);
      // Defer so React can flush the input state before sendMessage reads it
      setTimeout(() => {
        setInput("");
        setError(null);
        const userMsgId = localId();
        setMessages((prev) => [...prev, { id: userMsgId, role: "user", content: text }]);
        const assistantMsgId = localId();
        setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", content: "" }]);
        setIsStreaming(true);
        submitMessage(text, assistantMsgId);
      }, 0);
    }
    window.addEventListener("chatbot:starter", handleStarter);
    return () => window.removeEventListener("chatbot:starter", handleStarter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming, sessionId, session]);

  /** Core SSE call — shared by button submit and starter buttons */
  async function submitMessage(text: string, assistantMsgId: string) {
    try {
      const token = (session as any)?.accessToken;

      const response = await fetch(`${API_URL}/api/chatbot/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text, session_id: sessionId }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body");

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;

          try {
            const event = JSON.parse(raw) as {
              type: "token" | "done" | "error";
              content?: string;
              session_id?: string;
              message?: string;
            };

            if (event.type === "token" && event.content) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: m.content + event.content }
                    : m
                )
              );
            } else if (event.type === "done" && event.session_id) {
              setSessionId(event.session_id);
            } else if (event.type === "error") {
              setError(event.message ?? "An error occurred.");
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: event.message ?? "Sorry, something went wrong." }
                    : m
                )
              );
            }
          } catch {
            // Malformed JSON line — skip
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send message.";
      setError(msg);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: "I'm having trouble connecting right now. Please try again." }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput("");
    setError(null);

    const userMsgId = localId();
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", content: text }]);

    const assistantMsgId = localId();
    setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", content: "" }]);
    setIsStreaming(true);

    await submitMessage(text, assistantMsgId);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Submit on Enter (not Shift+Enter)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function startNewSession() {
    setSessionId(null);
    setMessages([]);
    setError(null);
    inputRef.current?.focus();
  }

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm select-none">
            BB
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900">BahasaBot</h1>
            <p className="text-xs text-gray-500">Your Bahasa Melayu tutor</p>
          </div>
        </div>
        <button
          onClick={startNewSession}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600
                     hover:bg-gray-100 transition-colors"
        >
          New chat
        </button>
      </header>

      {/* ── Message list ── */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {messages.map((msg, idx) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                isStreaming={
                  isStreaming &&
                  idx === messages.length - 1 &&
                  msg.role === "assistant"
                }
              />
            ))}
          </>
        )}

        {error && (
          <div className="text-center text-xs text-red-500 my-2">{error}</div>
        )}

        <div ref={bottomRef} />
      </main>

      {/* ── Input area ── */}
      <footer className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about Bahasa Melayu…"
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm
                       text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2
                       focus:ring-emerald-500 focus:border-transparent disabled:opacity-50
                       max-h-32 overflow-y-auto leading-relaxed"
            style={{ minHeight: "48px" }}
          />
          <button
            onClick={sendMessage}
            disabled={isStreaming || !input.trim()}
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center
                       justify-center hover:bg-emerald-700 active:scale-95 transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            aria-label="Send message"
          >
            {isStreaming ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <SendIcon />
            )}
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-500">Enter</kbd> to send &nbsp;·&nbsp;
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-500">Shift+Enter</kbd> for new line
        </p>
      </footer>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function EmptyState() {
  const starters = [
    "How do I say 'good morning' in Malay?",
    "Teach me basic Malay greetings",
    "What does 'terima kasih' mean?",
    "How do I order food in Malay?",
    "Explain the difference between 'saya' and 'aku'",
    "What are common Malay numbers?",
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-12">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
        <span className="text-3xl">🇲🇾</span>
      </div>
      <h2 className="text-lg font-semibold text-gray-800 mb-1">
        Selamat datang! Welcome!
      </h2>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">
        I&apos;m BahasaBot, your personal Bahasa Melayu tutor. Ask me anything
        about Malay language, grammar, or culture.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
        {starters.map((s) => (
          <StarterButton key={s} text={s} />
        ))}
      </div>
    </div>
  );
}

function StarterButton({ text }: { text: string }) {
  // We need the parent component's sendMessage — wire through a custom event
  function click() {
    const event = new CustomEvent("chatbot:starter", { detail: text });
    window.dispatchEvent(event);
  }

  return (
    <button
      onClick={click}
      className="text-left text-xs px-3 py-2 rounded-lg border border-gray-200
                 bg-white text-gray-700 hover:border-emerald-400 hover:text-emerald-700
                 hover:bg-emerald-50 transition-colors"
    >
      {text}
    </button>
  );
}

function SendIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  );
}
