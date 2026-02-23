"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_ACTIONS = [
  {
    label: "Summarize All",
    prompt: "Give me a summary of my workspace and documents.",
  },
  {
    label: "Draft Email",
    prompt: "Draft a professional email about the latest project updates.",
  },
  {
    label: "Check Errors",
    prompt: "Check my recent documents for any errors or inconsistencies.",
  },
];

export function DashboardAIPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I see you're working on your workspace. Would you like me to summarize the latest changes or help with anything?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || loading) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: content.trim(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);
      setStreamingContent("");

      try {
        const apiMessages = [...messages, userMessage].map((m) => ({
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

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: fullContent,
          },
        ]);
        setStreamingContent("");
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `⚠️ Error: ${errorMsg}`,
          },
        ]);
        setStreamingContent("");
      }

      setLoading(false);
    },
    [messages, loading],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="fixed top-0 right-0 bottom-0 z-30 flex w-80 flex-col border-l border-surface-700/50 bg-surface-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-700/50 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-brand-500">
            <span className="text-xs">🤖</span>
          </div>
          <h2 className="text-sm font-semibold text-text-primary">
            AI Workspace Chat
          </h2>
        </div>
        <button className="rounded-lg p-1 text-text-muted hover:text-text-primary hover:bg-surface-800 transition-colors">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-brand-500">
                <span className="text-[10px]">✨</span>
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-brand-600 text-white rounded-br-sm"
                  : "bg-surface-800/60 text-text-secondary rounded-bl-sm"
              }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && streamingContent && (
          <div className="flex justify-start">
            <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-brand-500">
              <span className="text-[10px]">✨</span>
            </div>
            <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-surface-800/60 px-3.5 py-2.5 text-sm text-text-secondary">
              <div className="whitespace-pre-wrap">{streamingContent}</div>
              <span className="inline-block h-3.5 w-0.5 animate-pulse bg-brand-400 ml-0.5" />
            </div>
          </div>
        )}

        {loading && !streamingContent && (
          <div className="flex justify-start">
            <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-brand-500">
              <span className="text-[10px]">✨</span>
            </div>
            <div className="rounded-2xl rounded-bl-sm bg-surface-800/60 px-4 py-3">
              <div className="flex items-center gap-1">
                <div
                  className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input + Quick Actions */}
      <div className="border-t border-surface-700/50 p-3 space-y-2">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI assistant..."
            disabled={loading}
            className="flex-1 rounded-xl border border-surface-700 bg-surface-800/50 px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white transition-all hover:bg-brand-500 disabled:opacity-50">
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
        </form>

        {/* Quick Actions */}
        <div className="flex gap-1.5">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => sendMessage(action.prompt)}
              disabled={loading}
              className="flex-1 rounded-lg bg-surface-800/50 px-2 py-1.5 text-[11px] font-medium text-text-muted transition-all hover:bg-surface-700/50 hover:text-text-secondary disabled:opacity-50">
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
