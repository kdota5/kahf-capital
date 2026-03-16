"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage, UserMode } from "@/lib/types";
import SuggestedQueries from "./suggested-queries";

interface ChatInterfaceProps {
  systemPrompt: string;
  mode: UserMode;
}

export default function ChatInterface({
  systemPrompt,
  mode,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || streaming) return;

      const userMsg: ChatMessage = { role: "user", content: content.trim() };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");
      setStreaming(true);

      const assistantMsg: ChatMessage = { role: "assistant", content: "" };
      setMessages([...newMessages, assistantMsg]);

      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages,
            systemPrompt,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Unknown error" }));
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = {
              role: "assistant",
              content: `Error: ${err.error || res.statusText}`,
            };
            return copy;
          });
          setStreaming(false);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  setMessages((prev) => {
                    const copy = [...prev];
                    const last = copy[copy.length - 1];
                    copy[copy.length - 1] = {
                      ...last,
                      content: last.content + parsed.text,
                    };
                    return copy;
                  });
                }
              } catch {}
            }
          }
        }
      } catch (e: any) {
        if (e.name !== "AbortError") {
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = {
              role: "assistant",
              content: `Error: ${e.message || "Connection failed"}`,
            };
            return copy;
          });
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, streaming, systemPrompt]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const showSuggestions = messages.length === 0 && !streaming;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-12">
            <div className="space-y-2">
              <h2 className="font-heading text-2xl font-bold text-text">
                Your book is loaded
              </h2>
              <p className="text-text-secondary max-w-md">
                Ask anything about your clients. Cross-reference portfolios,
                identify opportunities, flag risks — across your entire book.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-accent/15 border border-accent/20 text-text"
                  : "bg-surface border border-border text-text"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="markdown-body text-sm leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content || (streaming && i === messages.length - 1 ? "" : "")}
                  </ReactMarkdown>
                  {streaming && i === messages.length - 1 && (
                    <span className="inline-flex gap-1 ml-1">
                      <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse-dot" />
                      <span
                        className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse-dot"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse-dot"
                        style={{ animationDelay: "0.4s" }}
                      />
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border px-6 py-4 space-y-3">
        {showSuggestions && (
          <SuggestedQueries
            mode={mode}
            onSelect={(q) => sendMessage(q)}
            compact
          />
        )}
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your book..."
            rows={1}
            className="flex-1 bg-bg border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none resize-none"
            style={{
              minHeight: "44px",
              maxHeight: "120px",
              height: "auto",
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            className={`px-5 py-3 rounded-xl font-heading font-bold text-sm transition-all ${
              input.trim() && !streaming
                ? "bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20"
                : "bg-surface-hover text-text-muted cursor-not-allowed"
            }`}
          >
            {streaming ? (
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-pulse-dot" />
                <span
                  className="w-1.5 h-1.5 bg-text-muted rounded-full animate-pulse-dot"
                  style={{ animationDelay: "0.2s" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-text-muted rounded-full animate-pulse-dot"
                  style={{ animationDelay: "0.4s" }}
                />
              </span>
            ) : (
              "Send"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
