"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage, UserMode, ClientDirectory } from "@/lib/types";
import { countReferencedClients } from "@/lib/report-engine";
import SuggestedQueries, { generateSuggestions } from "./suggested-queries";

interface DemoFirmInfo {
  name: string;
  clients: number;
  aum: string;
  region: string;
}

interface ChatInterfaceProps {
  systemPrompt: string;
  mode: UserMode;
  onGenerateReport?: (messages: ChatMessage[]) => void;
  directory?: ClientDirectory | null;
  onHighlightClients?: (ids: string[]) => void;
  onTokenUpdate?: (input: number, output: number) => void;
  demoFirm?: DemoFirmInfo | null;
  preloadedMessages?: ChatMessage[];
  demoBanner?: boolean;
}

const SCAN_PROMPT = `Perform an initial review of this book. Identify the 3-5 most actionable findings across all clients. Focus on:
- Immediate opportunities (tax-loss harvesting with upcoming deadlines, Roth conversion windows)
- Risks that need attention (dangerous concentrations, risk profile mismatches, underfunded positions)
- Cross-client patterns (are multiple clients exposed to the same risk? common allocation gaps?)

Be specific: name the Client IDs, cite exact dollar amounts and percentages. Format as a brief executive scan — think of it as the first thing a senior analyst would flag when reviewing this book fresh. Keep it concise — 4-6 short paragraphs max.`;

const SCAN_STATUS_LABELS = [
  "Reviewing clients...",
  "Checking concentration limits...",
  "Analyzing tax positions...",
  "Comparing risk profiles...",
  "Identifying cross-client patterns...",
  "Preparing findings...",
];

function sanitizeForAPI(
  messages: ChatMessage[],
  directory: ClientDirectory | null | undefined
): ChatMessage[] {
  if (!directory) return messages;

  const nameVariants: { name: string; id: string }[] = [];
  for (const entry of directory.entries) {
    if (entry.full_name) {
      nameVariants.push({ name: entry.full_name, id: entry.client_id });
    }
  }
  nameVariants.sort((a, b) => b.name.length - a.name.length);

  return messages.map((m) => {
    let content = m.content;
    for (const { name, id } of nameVariants) {
      const regex = new RegExp(
        name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "gi"
      );
      content = content.replace(regex, id);
    }
    return { ...m, content };
  });
}

export default function ChatInterface({
  systemPrompt,
  mode,
  onGenerateReport,
  directory,
  onHighlightClients,
  onTokenUpdate,
  demoFirm,
  preloadedMessages,
  demoBanner,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    preloadedMessages || []
  );
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [initialScanDone, setInitialScanDone] = useState(
    !!preloadedMessages?.length
  );
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scanStartRef = useRef<number>(0);
  const totalInputTokensRef = useRef(0);
  const totalOutputTokensRef = useRef(0);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Cycle scan status labels
  useEffect(() => {
    if (!scanning) return;
    const interval = setInterval(() => {
      setScanStatus((prev) => (prev + 1) % SCAN_STATUS_LABELS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [scanning]);

  const assistantMsgCount = useMemo(
    () =>
      messages.filter((m) => m.role === "assistant" && m.content.length > 0)
        .length,
    [messages]
  );

  const referencedClientCount = useMemo(
    () => countReferencedClients(messages),
    [messages]
  );

  const dynamicSuggestions = useMemo(
    () => generateSuggestions(messages, mode),
    [messages, mode]
  );

  const streamResponse = useCallback(
    async (
      apiMessages: ChatMessage[]
    ): Promise<{ content: string; inputTokens: number; outputTokens: number }> => {
      abortRef.current = new AbortController();
      const sanitized = sanitizeForAPI(apiMessages, directory);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: sanitized, systemPrompt }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || res.statusText);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      let inputTokens = 0;
      let outputTokens = 0;

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
                fullContent += parsed.text;
                setMessages((prev) => {
                  const copy = [...prev];
                  const last = copy[copy.length - 1];
                  copy[copy.length - 1] = {
                    ...last,
                    content: last.content + parsed.text,
                  };
                  return copy;
                });

                if (onHighlightClients) {
                  const ids = parsed.text.match(/C-\d{3,5}/g);
                  if (ids) {
                    onHighlightClients(Array.from(new Set(ids)));
                  }
                }
              }
              if (parsed.usage) {
                inputTokens = parsed.usage.input_tokens || 0;
                outputTokens = parsed.usage.output_tokens || 0;
              }
            } catch {}
          }
        }
      }

      return { content: fullContent, inputTokens, outputTokens };
    },
    [systemPrompt, directory, onHighlightClients]
  );

  // Auto-fire initial scan
  useEffect(() => {
    if (initialScanDone || !systemPrompt) return;
    setInitialScanDone(true);

    const runScan = async () => {
      setScanning(true);
      scanStartRef.current = performance.now();

      const scanMsg: ChatMessage = { role: "user", content: SCAN_PROMPT };
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: "",
        isInitialScan: true,
      };
      setMessages([assistantMsg]);
      setStreaming(true);

      try {
        const { content, inputTokens, outputTokens } = await streamResponse([
          scanMsg,
        ]);
        const duration = (performance.now() - scanStartRef.current) / 1000;

        totalInputTokensRef.current += inputTokens;
        totalOutputTokensRef.current += outputTokens;
        onTokenUpdate?.(
          totalInputTokensRef.current,
          totalOutputTokensRef.current
        );

        setMessages([
          {
            role: "assistant",
            content,
            isInitialScan: true,
            scanDuration: Math.round(duration * 10) / 10,
          },
        ]);
      } catch (e: any) {
        if (e.name !== "AbortError") {
          setMessages([
            {
              role: "assistant",
              content: `Error: ${e.message || "Failed to perform initial scan"}`,
              isInitialScan: true,
            },
          ]);
        }
      } finally {
        setScanning(false);
        setStreaming(false);
        abortRef.current = null;
      }
    };

    runScan();
  }, [initialScanDone, systemPrompt, streamResponse, onTokenUpdate]);

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

      try {
        const { inputTokens, outputTokens } =
          await streamResponse(newMessages);

        totalInputTokensRef.current += inputTokens;
        totalOutputTokensRef.current += outputTokens;
        onTokenUpdate?.(
          totalInputTokensRef.current,
          totalOutputTokensRef.current
        );
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
    [messages, streaming, streamResponse, onTokenUpdate]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const showReportBar =
    assistantMsgCount >= 2 && !streaming && !scanning && onGenerateReport;
  const showSuggestions = !streaming && !scanning && messages.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4">
        {/* Demo banner */}
        {demoBanner && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-accent-dim border border-accent/20 rounded-xl text-xs sm:text-sm animate-fade-in">
            <span className="text-accent">
              You&apos;re viewing a demo.
            </span>
            <a
              href="/review"
              className="text-accent font-medium hover:underline underline-offset-2 whitespace-nowrap"
            >
              Upload your own book →
            </a>
          </div>
        )}

        {/* Demo firm context */}
        {demoFirm && messages.length <= 1 && (
          <div className="px-4 py-2.5 bg-surface border border-border rounded-xl text-xs sm:text-sm text-text-secondary animate-fade-in">
            <span className="font-heading font-bold text-text">
              Demo: {demoFirm.name}
            </span>
            <span className="mx-2 text-text-muted">·</span>
            {demoFirm.clients} client households · {demoFirm.aum} AUM ·{" "}
            {demoFirm.region}
          </div>
        )}

        {/* Scanning loading state */}
        {scanning && messages.length <= 1 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-8 sm:py-12 px-2 animate-fade-in">
            <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-accent">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
                <span className="font-heading font-bold text-sm uppercase tracking-wider">
                  Scanning your book
                </span>
              </div>
              <div className="h-1.5 w-full bg-bg rounded-full overflow-hidden">
                <div className="h-full bg-accent/60 rounded-full animate-shimmer" />
              </div>
              <p className="text-text-secondary text-sm transition-all duration-300">
                {SCAN_STATUS_LABELS[scanStatus]}
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => {
          if (
            msg.role === "assistant" &&
            msg.content === "" &&
            scanning &&
            i === 0
          )
            return null;

          if (msg.isInitialScan && msg.content) {
            return (
              <div key={i} className="animate-fade-in">
                <div className="max-w-[95%] sm:max-w-[85%] rounded-xl border border-accent/20 bg-surface overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-accent/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-accent"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                        />
                      </svg>
                      <span className="font-heading font-bold text-xs text-accent uppercase tracking-wider">
                        Initial Book Scan
                      </span>
                    </div>
                    {msg.scanDuration != null && (
                      <span className="text-text-muted text-[11px] font-mono">
                        scanned in {msg.scanDuration}s
                      </span>
                    )}
                  </div>
                  <div className="px-4 py-3 markdown-body text-sm leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
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
                </div>
              </div>
            );
          }

          return (
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
                      {msg.content || ""}
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
          );
        })}
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
            suggestions={dynamicSuggestions}
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
            style={{ minHeight: "44px", maxHeight: "120px", height: "auto" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height =
                Math.min(target.scrollHeight, 120) + "px";
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
