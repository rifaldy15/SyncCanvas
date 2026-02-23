"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/dashboard/Sidebar";

interface AIAssistantContentProps {
  user: { email: string; fullName: string };
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

const getStorageKey = (email: string) => `synccanvas_ai_sessions_${email}`;

function loadSessions(email: string): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(email));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(email: string, sessions: ChatSession[]) {
  localStorage.setItem(getStorageKey(email), JSON.stringify(sessions));
}

const SUGGESTIONS = [
  {
    icon: "✍️",
    label: "Write an essay",
    prompt: "Help me write a professional essay about",
  },
  {
    icon: "📝",
    label: "Summarize text",
    prompt: "Summarize the following text:",
  },
  {
    icon: "💡",
    label: "Brainstorm ideas",
    prompt: "Help me brainstorm ideas for",
  },
  {
    icon: "📧",
    label: "Draft an email",
    prompt: "Draft a professional email about",
  },
  { icon: "🐛", label: "Debug code", prompt: "Help me debug this code:" },
  { icon: "📊", label: "Analyze data", prompt: "Analyze the following data:" },
];

export function AIAssistantContent({ user }: AIAssistantContentProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [historySidebarOpen, setHistorySidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load sessions on mount
  useEffect(() => {
    const loaded = loadSessions();
    setSessions(loaded);
    if (loaded.length > 0) {
      setActiveSessionId(loaded[0].id);
    }
  }, []);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;
  const messages = activeSession?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  function updateSession(sessionId: string, newMessages: ChatMessage[]) {
    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              messages: newMessages,
              title:
                s.title === "New Chat" && newMessages.length > 0
                  ? newMessages[0].content.substring(0, 40) +
                    (newMessages[0].content.length > 40 ? "..." : "")
                  : s.title,
              updatedAt: Date.now(),
            }
          : s,
      );
      // Sort by most recent
      updated.sort((a, b) => b.updatedAt - a.updatedAt);
      saveSessions(user.email, updated);
      return updated;
    });
  }

  function createNewChat() {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      updatedAt: Date.now(),
    };
    setSessions((prev) => {
      const updated = [newSession, ...prev];
      saveSessions(user.email, updated);
      return updated;
    });
    setActiveSessionId(newSession.id);
    setInput("");
  }

  function deleteSession(id: string) {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      saveSessions(user.email, updated);
      return updated;
    });
    if (activeSessionId === id) {
      setActiveSessionId(sessions.find((s) => s.id !== id)?.id || null);
    }
  }

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || loading) return;

      // Create session if none active
      let currentSessionId = activeSessionId;
      if (!currentSessionId) {
        const newSession: ChatSession = {
          id: Date.now().toString(),
          title: "New Chat",
          messages: [],
          updatedAt: Date.now(),
        };
        setSessions((prev) => {
          const updated = [newSession, ...prev];
          saveSessions(user.email, updated);
          return updated;
        });
        currentSessionId = newSession.id;
        setActiveSessionId(newSession.id);
      }

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: content.trim(),
      };

      const currentMessages =
        sessions.find((s) => s.id === currentSessionId)?.messages || [];
      const newMessages = [...currentMessages, userMessage];
      updateSession(currentSessionId, newMessages);

      setInput("");
      setLoading(true);
      setStreamingContent("");

      try {
        const apiMessages = newMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages }),
        });

        if (!response.ok) throw new Error("Failed to get AI response");

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    fullContent += parsed.content;
                    setStreamingContent(fullContent);
                  }
                  if (parsed.error) throw new Error(parsed.error);
                } catch (e) {
                  if (e instanceof SyntaxError) continue;
                  throw e;
                }
              }
            }
          }
        }

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: fullContent,
        };
        updateSession(currentSessionId, [...newMessages, assistantMessage]);
        setStreamingContent("");
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        const errMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `⚠️ Error: ${errorMsg}`,
        };
        updateSession(currentSessionId, [...newMessages, errMessage]);
        setStreamingContent("");
      }

      setLoading(false);
    },
    [activeSessionId, sessions, loading],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function formatTime(ts: number) {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString();
  }

  return (
    <div className="min-h-screen bg-surface-950">
      <Sidebar user={user} />

      <div className="lg:ml-60 flex h-screen">
        {/* Chat History Sidebar */}
        <AnimatePresence>
          {historySidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col border-r border-surface-700/50 bg-surface-900/30 overflow-hidden shrink-0">
              {/* History Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/50">
                <h2 className="text-sm font-semibold text-text-primary">
                  Chat History
                </h2>
                <button
                  onClick={createNewChat}
                  className="rounded-lg p-1.5 text-text-muted hover:bg-surface-700 hover:text-text-primary transition-colors"
                  title="New Chat">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              </div>

              {/* Session List */}
              <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
                {sessions.length === 0 ? (
                  <div className="px-3 py-8 text-center">
                    <p className="text-xs text-text-muted">
                      No chat history yet
                    </p>
                    <p className="mt-1 text-[10px] text-text-muted">
                      Start a conversation below
                    </p>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => setActiveSessionId(session.id)}
                      className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition-all ${
                        activeSessionId === session.id
                          ? "bg-brand-600/15 text-brand-300"
                          : "text-text-secondary hover:bg-surface-800/50"
                      }`}>
                      <svg
                        className="h-4 w-4 shrink-0 text-text-muted"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{session.title}</p>
                        <p className="text-[10px] text-text-muted">
                          {formatTime(session.updatedAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                        className="rounded p-1 text-text-muted opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <div className="flex items-center gap-3 border-b border-surface-700/50 px-4 py-2.5 pl-14 lg:pl-4">
            <button
              onClick={() => setHistorySidebarOpen(!historySidebarOpen)}
              className="rounded-lg p-1.5 text-text-muted hover:bg-surface-800 hover:text-text-primary transition-colors">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
            </button>
            <h1 className="text-sm font-semibold text-text-primary">
              {activeSession?.title || "AI Assistant"}
            </h1>
            <div className="flex-1" />
            <button
              onClick={createNewChat}
              className="flex items-center gap-1.5 rounded-lg border border-surface-700 px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-brand-500/30 hover:text-text-primary">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Chat
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              /* Welcome Screen */
              <div className="flex flex-col items-center justify-center h-full px-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-center max-w-2xl">
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-xl shadow-brand-500/20">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <h1 className="text-3xl font-bold text-text-primary mb-2">
                    AI Assistant
                  </h1>
                  <p className="text-text-secondary mb-10">
                    I can help you write, brainstorm, analyze, and more. What
                    would you like to do?
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s.label}
                        onClick={() => setInput(s.prompt + " ")}
                        className="flex flex-col items-center gap-2 rounded-xl border border-surface-700/50 bg-surface-800/30 p-4 text-center transition-all hover:border-brand-500/30 hover:bg-surface-800/60 hover:scale-[1.03] active:scale-95">
                        <span className="text-xl">{s.icon}</span>
                        <span className="text-xs font-medium text-text-secondary">
                          {s.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>
            ) : (
              /* Chat Messages */
              <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
                {messages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-brand-500 shadow-md">
                        <span className="text-xs">✨</span>
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-brand-600 text-white rounded-br-md"
                          : "bg-surface-800/60 text-text-primary border border-surface-700/30 rounded-bl-md"
                      }`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                    {msg.role === "user" && (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-bold text-white shadow-md">
                        {(user.fullName || user.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </motion.div>
                ))}

                {loading && streamingContent && (
                  <div className="flex gap-3">
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-brand-500 shadow-md">
                      <span className="text-xs">✨</span>
                    </div>
                    <div className="max-w-[75%] rounded-2xl rounded-bl-md bg-surface-800/60 border border-surface-700/30 px-4 py-3 text-sm text-text-primary">
                      <div className="whitespace-pre-wrap">
                        {streamingContent}
                      </div>
                      <span className="inline-block h-4 w-0.5 animate-pulse bg-brand-400 ml-0.5" />
                    </div>
                  </div>
                )}

                {loading && !streamingContent && (
                  <div className="flex gap-3">
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-accent-500 to-brand-500 shadow-md">
                      <span className="text-xs">✨</span>
                    </div>
                    <div className="flex-1 max-w-[75%] rounded-2xl rounded-bl-md bg-surface-800/60 border border-surface-700/30 px-5 py-4 space-y-2.5">
                      <div className="ai-shimmer-line w-[85%]" />
                      <div
                        className="ai-shimmer-line w-[65%]"
                        style={{ animationDelay: "0.15s" }}
                      />
                      <div
                        className="ai-shimmer-line w-[75%]"
                        style={{ animationDelay: "0.3s" }}
                      />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-surface-700/50 bg-surface-950/80 backdrop-blur-xl px-4 sm:px-6 py-4">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
              <div className="relative flex items-end rounded-2xl border border-surface-700 bg-surface-800/50 transition-all focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask AI anything..."
                  disabled={loading}
                  rows={1}
                  className="flex-1 resize-none bg-transparent px-4 py-3.5 text-sm text-text-primary placeholder-text-muted outline-none disabled:opacity-50"
                  style={{ maxHeight: "150px" }}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="m-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition-all hover:bg-brand-500 hover:scale-105 active:scale-95 disabled:opacity-40">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] text-text-muted">
                AI Assistant powered by Google Gemini
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
