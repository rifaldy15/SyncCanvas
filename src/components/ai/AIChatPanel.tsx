"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  documentContent: string;
}

const QUICK_ACTIONS = [
  {
    label: "📝 Summarize",
    prompt: "Summarize this document in 3-5 bullet points.",
  },
  {
    label: "✨ Improve",
    prompt:
      "Improve the writing quality of this document. Make it more professional and engaging.",
  },
  {
    label: "💡 Brainstorm",
    prompt:
      "Brainstorm 5 creative ideas related to the content of this document.",
  },
  {
    label: "🔍 Fix Grammar",
    prompt: "Find and fix any grammar or spelling errors in this document.",
  },
];

export function AIChatPanel({
  isOpen,
  onClose,
  documentContent,
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Handle incoming commands from editor (Slash Command or Floating Toolbar)
  useEffect(() => {
    function handleAskGemini(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.prefilledPrompt && detail?.text) {
        // Send the prefilled prompt along with the referenced text
        const prompt = `${detail.prefilledPrompt}\n\n"${detail.text}"`;
        // We use setTimeout to ensure the panel opens first (handled by DocumentEditor) and then sends message
        setTimeout(() => sendMessage(prompt), 100);
      } else if (detail?.text) {
        // Just prefill the input with a default prompt referring to the selected text
        setInput(`Explain this: "${detail.text}"`);
      }
    }
    window.addEventListener("ask-gemini", handleAskGemini);
    return () => window.removeEventListener("ask-gemini", handleAskGemini);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally no dependencies so it doesn't re-bind unnecessarily

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
          body: JSON.stringify({
            messages: apiMessages,
            documentContent,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get AI response");
        }

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
                  if (parsed.error) {
                    throw new Error(parsed.error);
                  }
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

        setMessages((prev) => [...prev, assistantMessage]);
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
    [messages, documentContent, loading],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-0 right-0 bottom-0 z-40 w-full max-w-md border-l border-surface-700/50 bg-surface-950 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface-700/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-accent-500 to-brand-500">
                <span className="text-sm">🤖</span>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  AI Assistant
                </h2>
                <p className="text-[10px] text-text-muted">
                  Powered by Llama 3
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-800 hover:text-text-primary">
              <svg
                className="h-5 w-5"
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4 text-4xl">✨</div>
                <h3 className="mb-2 text-sm font-semibold text-text-primary">
                  Ask me anything
                </h3>
                <p className="mb-6 text-xs text-text-muted max-w-[240px]">
                  I can summarize, rewrite, brainstorm, or help with your
                  document.
                </p>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2 w-full">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => sendMessage(action.prompt)}
                      className="glass-light rounded-xl px-3 py-2.5 text-xs text-text-secondary transition-all hover:text-text-primary hover:border-brand-500/30 text-left">
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-linear-to-r from-brand-600 to-accent-600 text-white"
                      : "bg-surface-800/60 text-text-secondary"
                  }`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}

            {/* Streaming indicator */}
            {loading && streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl bg-surface-800/60 px-4 py-2.5 text-sm leading-relaxed text-text-secondary">
                  <div className="whitespace-pre-wrap">{streamingContent}</div>
                  <span className="inline-block h-4 w-1 animate-pulse bg-brand-400 ml-0.5" />
                </div>
              </div>
            )}

            {loading && !streamingContent && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-surface-800/60 px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-2 w-2 rounded-full bg-brand-400 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="h-2 w-2 rounded-full bg-brand-400 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="h-2 w-2 rounded-full bg-brand-400 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-surface-700/50 p-4">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the AI..."
                disabled={loading}
                className="flex-1 rounded-xl border border-surface-700 bg-surface-800/50 px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-r from-brand-600 to-accent-600 text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
