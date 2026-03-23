"use client";

/**
 * Chatbot Page — /chatbot
 *
 * Full-page streaming chat interface.
 * Lives inside app/chatbot/layout.tsx which provides the AppSidebar and
 * a flex-col overflow-hidden main container, so this page uses flex-1 + min-h-0
 * to fill the remaining height and scroll only the message list internally.
 *
 * - Sends messages to POST /api/chatbot/message and reads the SSE stream.
 * - Creates a new session on first message; reuses session_id thereafter.
 * - Parses SSE events: {type: "token"}, {type: "done"}, {type: "error"}.
 * - Auto-scrolls to the latest message.
 */

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ChatMessage from "@/components/chatbot/ChatMessage";
import { Waves } from "@/components/ui/waves";
import { useTheme } from "@/lib/use-theme";

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

  const { theme } = useTheme();
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

  // Restore previous chat from sessionStorage when navigating back to this page
  useEffect(() => {
    const savedMessages = sessionStorage.getItem("chatbot_messages");
    const savedSessionId = sessionStorage.getItem("chatbot_session_id");
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch {
        // Corrupted storage — ignore and start fresh
        sessionStorage.removeItem("chatbot_messages");
      }
    }
    if (savedSessionId) setSessionId(savedSessionId);
  }, []);

  // Persist messages to sessionStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem("chatbot_messages", JSON.stringify(messages));
    }
  }, [messages]);

  // Persist sessionId to sessionStorage whenever it changes
  useEffect(() => {
    if (sessionId) {
      sessionStorage.setItem("chatbot_session_id", sessionId);
    }
  }, [sessionId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for starter button clicks — set the input and submit
  useEffect(() => {
    function handleStarter(e: Event) {
      const text = (e as CustomEvent<string>).detail;
      if (!text || isStreaming) return;
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function startNewSession() {
    setSessionId(null);
    setMessages([]);
    setError(null);
    sessionStorage.removeItem("chatbot_messages");
    sessionStorage.removeItem("chatbot_session_id");
    inputRef.current?.focus();
  }

  if (status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    // flex-1 min-h-0 fills the flex-col parent from the layout without overflowing
    <div className="flex flex-col flex-1 min-h-0 bg-background relative">

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b shrink-0 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs select-none">
            BB
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">AI Tutor</p>
            <p className="text-xs text-muted-foreground leading-tight">Bahasa Melayu</p>
          </div>
        </div>
        <button
          onClick={startNewSession}
          className="text-xs px-3 py-1.5 rounded-lg border text-muted-foreground
                     hover:bg-muted hover:text-foreground transition-colors"
        >
          New chat
        </button>
      </header>

      {/* ── Waves background — always visible ── */}
      <Waves
        strokeColor="#4a7c59"
        backgroundColor={theme === "dark" ? "#0d1a11" : "#f5f3ed"}
        pointerSize={0.5}
      />

      {/* ── Message list ── */}
      <main className="flex-1 overflow-y-auto min-h-0 px-4 py-4 relative z-10">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((msg, idx) => (
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
          ))
        )}

        {error && (
          <div className="text-center text-xs text-destructive my-2">{error}</div>
        )}

        <div ref={bottomRef} />
      </main>

      {/* ── Input area ── */}
      <footer className="bg-card border-t px-4 py-3 shrink-0 relative z-10">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about Bahasa Melayu…"
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none rounded-xl border px-4 py-3 text-sm bg-background
                       text-foreground placeholder:text-muted-foreground focus:outline-none
                       focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                       disabled:opacity-50 max-h-32 overflow-y-auto leading-relaxed"
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
        <p className="text-center text-xs text-muted-foreground mt-2">
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send &nbsp;·&nbsp;
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Shift+Enter</kbd> for new line
        </p>
      </footer>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────────

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
      {/* Glass card keeps content readable over the wave animation */}
      <div className="rounded-2xl px-8 py-8 backdrop-blur-sm bg-card/70 border border-primary/20 shadow-sm max-w-lg w-full mx-4">
        <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mb-4 mx-auto">
          <span className="text-3xl">🇲🇾</span>
        </div>
        <h2 className="text-lg font-semibold mb-1">Selamat datang! Welcome!</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
          I&apos;m BahasaBot, your personal Bahasa Melayu tutor. Ask me anything
          about Malay language, grammar, or culture.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
          {starters.map((s) => (
            <StarterButton key={s} text={s} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StarterButton({ text }: { text: string }) {
  function click() {
    window.dispatchEvent(new CustomEvent("chatbot:starter", { detail: text }));
  }

  return (
    <button
      onClick={click}
      className="text-left text-xs px-3 py-2 rounded-lg border bg-card
                 text-muted-foreground hover:border-primary hover:text-primary
                 hover:bg-primary/10 transition-colors"
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
