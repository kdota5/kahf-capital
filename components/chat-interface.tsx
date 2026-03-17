"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage, UserMode } from "@/lib/types";
import { countReferencedClients } from "@/lib/report-engine";
import SuggestedQueries from "./suggested-queries";

interface ChatInterfaceProps {
  systemPrompt: string;
  mode: UserMode;
  onGenerateReport?: (messages: ChatMessage[]) => void;
}

export default function ChatInterface({
  systemPrompt,
  mode,
  onGenerateReport,
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

  const assistantMsgCount = useMemo(
    () => messages.filter((m) => m.role === "assistant" && m.content.length > 0).length,
    [messages]
  );

  const referencedClientCount = useMemo(
    () => countReferencedClients(messages),
    [messages]
  );

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
  const showReportBar =
    assistantMsgCount >= 2 && !streaming && onGenerateReport;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-8 sm:py-12 px-2">
            <div className="space-y-2">
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-text">
                Your book is loaded
              </h2>
              <p className="text-text-secondary text-sm sm:text-base max-w-md">
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
              className={`max-w-[95%] sm:max-w-[85%] rounded-xl px-3 sm:px-4 py-3 ${
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

      <div className="border-t border-border px-3 sm:px-6 py-3 sm:py-4 space-y-3">
        {showReportBar && (
          <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 bg-surface border border-border rounded-xl">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-text-secondary">
              <svg
                className="w-4 h-4 text-accent shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              <span>
                <span className="font-mono text-accent font-medium">
                  {referencedClientCount}
                </span>{" "}
                client{referencedClientCount !== 1 ? "s" : ""} discussed
              </span>
            </div>
            <button
              onClick={() => onGenerateReport?.(messages)}
              className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-heading font-bold bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors whitespace-nowrap"
            >
              Generate Report
            </button>
          </div>
        )}

        {showSuggestions && (
          <SuggestedQueries
            mode={mode}
            onSelect={(q) => sendMessage(q)}
            compact
          />
        )}
        <div className="flex gap-2 sm:gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your book..."
            rows={1}
            className="flex-1 bg-bg border border-border rounded-xl px-3 sm:px-4 py-3 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none resize-none"
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
            className={`px-4 sm:px-5 py-3 rounded-xl font-heading font-bold text-sm transition-all shrink-0 ${
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
