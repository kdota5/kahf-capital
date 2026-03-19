"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ReportSection, ClientNameMap } from "@/lib/report-engine";
import type { BookData, FAClientRecord, AcctClientRecord, ClientDirectory } from "@/lib/types";
import {
  downloadPDF,
  printReport,
  copyToClipboard,
  downloadComplianceLog,
  type ReportMeta,
} from "@/lib/report-renderer";

interface ReportBuilderProps {
  sections: ReportSection[];
  clientMap: ClientNameMap;
  book: BookData;
  onBack: () => void;
  onEditNames?: () => void;
  onBackToChat: () => void;
  directory?: ClientDirectory | null;
}

function AnimatedName({
  clientId,
  fullName,
  delay,
}: {
  clientId: string;
  fullName: string;
  delay: number;
}) {
  const [showName, setShowName] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowName(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!fullName) {
    return <span className="text-accent font-mono text-sm">{clientId}</span>;
  }

  return (
    <span className="inline-block relative">
      <span
        className={`transition-all duration-300 ${showName ? "opacity-0 scale-95 blur-sm absolute" : "opacity-100"} text-accent font-mono text-sm`}
      >
        {clientId}
      </span>
      <span
        className={`transition-all duration-300 ${showName ? "opacity-100 scale-100" : "opacity-0 scale-105"} font-medium text-text`}
      >
        {fullName}
        <span className="text-text-muted text-xs ml-1">({clientId})</span>
      </span>
    </span>
  );
}

export default function ReportBuilder({
  sections,
  clientMap,
  book,
  onBack,
  onBackToChat,
  directory,
}: ReportBuilderProps) {
  const [editableSections, setEditableSections] = useState<ReportSection[]>(
    () => sections.map((s) => ({ ...s }))
  );
  const [firmName, setFirmName] = useState("Conda");
  const [advisorName, setAdvisorName] = useState("");
  const [disclaimer, setDisclaimer] = useState(
    "This report was generated using AI-assisted analysis. All recommendations should be reviewed by a qualified financial advisor before implementation. Data was analyzed using anonymized client identifiers — no PII was transmitted to AI systems during analysis."
  );
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [editingTitle, setEditingTitle] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState<number | null>(null);
  const [removedSection, setRemovedSection] = useState<{
    section: ReportSection;
    index: number;
  } | null>(null);
  const removeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const allReferencedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const s of editableSections) {
      for (const id of s.clientIdsReferenced) ids.add(id);
    }
    return Array.from(ids);
  }, [editableSections]);

  const clientSummaries = useMemo(() => {
    return allReferencedIds.map((id) => {
      const name = clientMap[id] || "";
      let meta = "";
      if (book.mode === "financial_advisor") {
        const c = (book.clients as FAClientRecord[]).find(
          (cl) => cl.client_id === id
        );
        if (c) meta = `Age ${c.age} · ${c.risk_tolerance} · ${c.filing_status}`;
      } else {
        const c = (book.clients as AcctClientRecord[]).find(
          (cl) => cl.client_id === id
        );
        if (c) meta = `${c.filing_status} · ${c.state_of_residence} · ${c.num_dependents} dep.`;
      }
      return { clientId: id, name, meta };
    });
  }, [allReferencedIds, clientMap, book]);

  const reportMeta: ReportMeta = {
    firmName,
    date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    disclaimer,
    clientSummaries,
  };

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 5000);
  }, []);

  const handleDownloadPDF = async () => {
    setGenerating(true);
    try {
      await downloadPDF(editableSections, reportMeta);
      showToast("Report generated locally. Client names were added on your device and were never sent to AI.");
    } catch (e: any) {
      showToast("Error generating PDF: " + (e.message || "Unknown error"));
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    printReport(editableSections, reportMeta);
    showToast("Report generated locally. Names never sent to AI.");
  };

  const handleCopy = async () => {
    await copyToClipboard(editableSections, reportMeta);
    showToast("Copied to clipboard. Names were added locally, never sent to AI.");
  };

  const handleComplianceLog = () => {
    downloadComplianceLog({
      firmName,
      advisorName,
      clientCount: book.rowCount,
      clientIds: allReferencedIds,
      bookHeaders: book.rawHeaders,
      directoryHeaders: directory?.headers || [],
      sections: editableSections,
    });
    showToast("Compliance log downloaded.");
  };

  const handleRemoveSection = (index: number) => {
    const removed = editableSections[index];
    setRemovedSection({ section: removed, index });
    setEditableSections((prev) => prev.filter((_, i) => i !== index));
    if (removeTimerRef.current) clearTimeout(removeTimerRef.current);
    removeTimerRef.current = setTimeout(() => setRemovedSection(null), 5000);
  };

  const handleUndoRemove = () => {
    if (!removedSection) return;
    setEditableSections((prev) => {
      const next = [...prev];
      next.splice(removedSection.index, 0, removedSection.section);
      return next;
    });
    setRemovedSection(null);
    if (removeTimerRef.current) clearTimeout(removeTimerRef.current);
  };

  const handleAddSection = () => {
    setEditableSections((prev) => [
      ...prev,
      { title: "Custom Notes", content: "", clientIdsReferenced: [] },
    ]);
    setEditingTitle(editableSections.length);
    setEditingContent(editableSections.length);
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setEditableSections((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  const nameAnimationDelay = useCallback(
    () => Math.random() * 800 + 200,
    []
  );

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onBackToChat}
            className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-text transition-colors shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="font-heading font-bold text-sm sm:text-base whitespace-nowrap">
            Book Review Report
          </h2>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={handleComplianceLog}
            className="px-2.5 sm:px-3 py-1.5 text-xs bg-transparent border border-border rounded-lg hover:border-border-active text-text-muted hover:text-text transition-all"
          >
            Compliance Log
          </button>
          <button
            onClick={() => setShowSettings((p) => !p)}
            className="px-2.5 sm:px-3 py-1.5 text-xs bg-surface border border-border rounded-lg hover:border-border-active text-text-secondary hover:text-text transition-all"
          >
            Settings
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="border-b border-border px-4 sm:px-6 py-4 bg-surface space-y-3 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-medium">
                Firm Name
              </label>
              <input
                type="text"
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                className="mt-1 w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-medium">
                Advisor Name
              </label>
              <input
                type="text"
                value={advisorName}
                onChange={(e) => setAdvisorName(e.target.value)}
                placeholder="Optional"
                className="mt-1 w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider font-medium">
              Disclaimer
            </label>
            <textarea
              value={disclaimer}
              onChange={(e) => setDisclaimer(e.target.value)}
              rows={3}
              className="mt-1 w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:border-accent focus:outline-none resize-none"
            />
          </div>
        </div>
      )}

      {/* Report content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-8">
          {/* Header */}
          <div className="text-center space-y-1 pb-6 border-b border-border">
            <h1 className="font-heading text-xl sm:text-2xl font-extrabold">
              {firmName}
            </h1>
            <p className="text-text-secondary text-sm">
              Book Review Report — {reportMeta.date}
            </p>
          </div>

          {/* Clients reviewed with name animation */}
          {clientSummaries.length > 0 && (
            <div>
              <h2 className="font-heading font-bold text-base mb-3 text-accent">
                Clients Reviewed
              </h2>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-hover">
                      <th className="px-3 py-2 text-left text-text-muted text-xs font-medium uppercase">
                        ID
                      </th>
                      <th className="px-3 py-2 text-left text-text-muted text-xs font-medium uppercase">
                        Name
                      </th>
                      <th className="px-3 py-2 text-left text-text-muted text-xs font-medium uppercase hidden sm:table-cell">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientSummaries.map((c) => (
                      <tr key={c.clientId} className="border-t border-border">
                        <td className="px-3 py-2 font-mono text-accent text-xs">
                          {c.clientId}
                        </td>
                        <td className="px-3 py-2">
                          <AnimatedName
                            clientId={c.clientId}
                            fullName={c.name}
                            delay={nameAnimationDelay()}
                          />
                        </td>
                        <td className="px-3 py-2 text-text-secondary text-xs hidden sm:table-cell">
                          {c.meta}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Editable sections */}
          {editableSections.map((section, i) => (
            <div
              key={`section-${i}`}
              className={`space-y-3 group relative ${dragIdx === i ? "opacity-50" : ""}`}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
            >
              {/* Drag handle + remove */}
              <div className="absolute -left-6 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                <span className="cursor-grab text-text-muted text-xs select-none">
                  ⠿
                </span>
              </div>
              <button
                onClick={() => handleRemoveSection(i)}
                className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-danger text-xs px-1.5 py-0.5 rounded hover:bg-danger-dim"
              >
                Remove
              </button>

              {/* Title */}
              {editingTitle === i ? (
                <input
                  autoFocus
                  value={section.title}
                  onChange={(e) =>
                    setEditableSections((prev) => {
                      const next = [...prev];
                      next[i] = { ...next[i], title: e.target.value };
                      return next;
                    })
                  }
                  onBlur={() => setEditingTitle(null)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingTitle(null)}
                  className="font-heading font-bold text-base sm:text-lg text-text border-b-2 border-accent bg-transparent outline-none w-full pb-1"
                />
              ) : (
                <h2
                  onClick={() => setEditingTitle(i)}
                  className="font-heading font-bold text-base sm:text-lg text-text border-b border-accent/30 pb-2 cursor-text hover:border-accent transition-colors"
                >
                  {i + 1}. {section.title}
                </h2>
              )}

              {/* Content */}
              {editingContent === i ? (
                <textarea
                  autoFocus
                  value={section.content}
                  onChange={(e) =>
                    setEditableSections((prev) => {
                      const next = [...prev];
                      next[i] = { ...next[i], content: e.target.value };
                      return next;
                    })
                  }
                  onBlur={() => setEditingContent(null)}
                  className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm leading-relaxed text-text-secondary focus:border-accent focus:outline-none resize-y min-h-[120px]"
                  style={{ height: "auto" }}
                  ref={(el) => {
                    if (el) {
                      el.style.height = "auto";
                      el.style.height = el.scrollHeight + "px";
                    }
                  }}
                />
              ) : (
                <div
                  onClick={() => setEditingContent(i)}
                  className="markdown-body text-sm leading-relaxed text-text-secondary cursor-text hover:bg-surface/50 rounded-lg p-1 -m-1 transition-colors"
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {section.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          ))}

          {/* Add section button */}
          <button
            onClick={handleAddSection}
            className="w-full py-2.5 text-xs text-text-muted border border-dashed border-border rounded-lg hover:border-border-active hover:text-text-secondary transition-all"
          >
            + Add custom section
          </button>

          {/* Disclaimer */}
          <div className="border-t border-border pt-6 space-y-2">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Disclaimer
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              {disclaimer}
            </p>
          </div>

          <p className="text-center text-[11px] text-text-muted">
            Generated by Conda Book Review Intelligence — Client names
            added locally, never transmitted to AI
          </p>
        </div>
      </div>

      {/* Action bar */}
      <div className="border-t border-border px-4 sm:px-6 py-3 flex flex-wrap items-center gap-2 shrink-0">
        <button
          onClick={handleDownloadPDF}
          disabled={generating}
          className={`px-4 sm:px-5 py-2.5 text-sm font-heading font-bold rounded-lg transition-all ${
            generating
              ? "bg-surface-hover text-text-muted cursor-not-allowed"
              : "bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20"
          }`}
        >
          {generating ? "Generating..." : "Download PDF"}
        </button>
        <button
          onClick={handlePrint}
          className="px-4 py-2.5 text-sm bg-surface border border-border rounded-lg hover:border-border-active text-text-secondary hover:text-text transition-all"
        >
          Print
        </button>
        <button
          onClick={handleCopy}
          className="px-4 py-2.5 text-sm bg-surface border border-border rounded-lg hover:border-border-active text-text-secondary hover:text-text transition-all"
        >
          Copy
        </button>
      </div>

      {/* Toast / Undo */}
      {(toast || removedSection) && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] px-4 sm:px-6 py-3 bg-surface border border-success/30 rounded-xl shadow-xl text-sm max-w-md text-center animate-fade-in">
          {removedSection ? (
            <div className="flex items-center gap-3 text-text-secondary">
              <span>Section removed.</span>
              <button
                onClick={handleUndoRemove}
                className="text-accent font-medium hover:underline"
              >
                Undo
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-success">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              {toast}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
