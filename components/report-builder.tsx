"use client";

import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ReportSection, ClientNameMap } from "@/lib/report-engine";
import type { BookData, FAClientRecord, AcctClientRecord } from "@/lib/types";
import {
  downloadPDF,
  printReport,
  copyToClipboard,
  type ReportMeta,
} from "@/lib/report-renderer";
import { applyNameMapping } from "@/lib/report-engine";

interface ReportBuilderProps {
  sections: ReportSection[];
  clientMap: ClientNameMap;
  book: BookData;
  onBack: () => void;
  onEditNames: () => void;
  onBackToChat: () => void;
}

export default function ReportBuilder({
  sections,
  clientMap,
  book,
  onBack,
  onEditNames,
  onBackToChat,
}: ReportBuilderProps) {
  const [firmName, setFirmName] = useState("KAHF Capital");
  const [disclaimer, setDisclaimer] = useState(
    "This report was generated using AI-assisted analysis. All recommendations should be reviewed by a qualified financial advisor before implementation. Data was analyzed using anonymized client identifiers — no PII was transmitted to AI systems during analysis."
  );
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const allReferencedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const s of sections) {
      for (const id of s.clientIdsReferenced) ids.add(id);
    }
    return Array.from(ids);
  }, [sections]);

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

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleDownloadPDF = async () => {
    setGenerating(true);
    try {
      await downloadPDF(sections, reportMeta);
      showToast(
        "Report generated locally. Client names were added on your device and were never sent to AI."
      );
    } catch (e: any) {
      showToast("Error generating PDF: " + (e.message || "Unknown error"));
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    printReport(sections, reportMeta);
    showToast("Report generated locally. Names never sent to AI.");
  };

  const handleCopy = async () => {
    await copyToClipboard(sections, reportMeta);
    showToast("Copied to clipboard. Names were added locally, never sent to AI.");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
          <button
            onClick={onBackToChat}
            className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-text transition-colors shrink-0"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
          </button>
          <h2 className="font-heading font-bold text-sm sm:text-base whitespace-nowrap">
            Report Preview
          </h2>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => setShowSettings((p) => !p)}
            className="px-2.5 sm:px-3 py-1.5 text-xs bg-surface border border-border rounded-lg hover:border-border-active text-text-secondary hover:text-text transition-all"
          >
            Settings
          </button>
          <button
            onClick={onEditNames}
            className="px-2.5 sm:px-3 py-1.5 text-xs bg-surface border border-border rounded-lg hover:border-border-active text-text-secondary hover:text-text transition-all"
          >
            Edit Names
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="border-b border-border px-4 sm:px-6 py-4 bg-surface space-y-3 animate-fade-in">
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
          {/* Report header */}
          <div className="text-center space-y-1 pb-6 border-b border-border">
            <h1 className="font-heading text-xl sm:text-2xl font-extrabold">
              {firmName}
            </h1>
            <p className="text-text-secondary text-sm">
              Book Review Report — {reportMeta.date}
            </p>
          </div>

          {/* Clients reviewed */}
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
                      <tr
                        key={c.clientId}
                        className="border-t border-border"
                      >
                        <td className="px-3 py-2 font-mono text-accent text-xs">
                          {c.clientId}
                        </td>
                        <td className="px-3 py-2 font-medium">
                          {c.name || "—"}
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

          {/* Sections */}
          {sections.map((section, i) => (
            <div key={i} className="space-y-3">
              <h2 className="font-heading font-bold text-base sm:text-lg text-text border-b border-accent/30 pb-2">
                {i + 1}. {section.title}
              </h2>
              <div className="markdown-body text-sm leading-relaxed text-text-secondary">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {section.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}

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
            Generated by KAHF Capital Book Review Intelligence — Client names
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 sm:px-6 py-3 bg-surface border border-success/30 rounded-xl shadow-xl text-sm text-success max-w-md text-center animate-fade-in">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
