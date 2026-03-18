"use client";

import { useState } from "react";
import type { PIIWarning, ClientDirectory } from "@/lib/types";

interface PrivacyGateProps {
  bookHeaders: string[];
  piiWarnings: PIIWarning[];
  clientCount: number;
  directory: ClientDirectory | null;
  onConfirm: () => void;
  onBack: () => void;
}

export default function PrivacyGate({
  bookHeaders,
  piiWarnings,
  clientCount,
  directory,
  onConfirm,
  onBack,
}: PrivacyGateProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(
    new Set()
  );

  const activeWarnings = piiWarnings.filter(
    (w) => !dismissedWarnings.has(w.column)
  );
  const canProceed = confirmed && activeWarnings.length === 0;

  const localFields = directory
    ? directory.headers.filter(
        (h) => h !== "client_id" && h !== "clientid"
      )
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="font-heading text-xl sm:text-2xl font-bold">
          Privacy Review
        </h2>
        <p className="text-text-secondary text-sm sm:text-base">
          Your data is processed in two separate streams.
          {clientCount > 0 && (
            <span className="text-accent font-mono ml-1">
              {clientCount} clients loaded
            </span>
          )}
        </p>
      </div>

      {activeWarnings.length > 0 && (
        <div className="bg-danger-dim border border-danger/30 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <h3 className="text-danger font-heading font-bold">
              Potential PII Detected in Book Data
            </h3>
          </div>
          {activeWarnings.map((w) => (
            <div key={w.column} className="flex items-center justify-between bg-bg/50 rounded-lg p-3">
              <p className="text-danger text-sm">{w.reason}</p>
              <button
                onClick={() =>
                  setDismissedWarnings((prev) => {
                    const next = new Set(prev);
                    next.add(w.column);
                    return next;
                  })
                }
                className="ml-4 shrink-0 px-3 py-1.5 text-xs bg-danger/20 text-danger rounded-lg hover:bg-danger/30 transition-colors"
              >
                I confirm this is safe
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Two-column data split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Left: Local only */}
        <div className="bg-surface/50 border border-accent/20 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <h3 className="font-heading font-bold text-accent text-sm sm:text-base">
              Stays Local
            </h3>
          </div>

          {directory && localFields.length > 0 ? (
            <ul className="space-y-2">
              {localFields.map((h) => (
                <li key={h} className="flex items-center gap-2 text-sm">
                  <span className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <svg className="w-2.5 h-2.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75" />
                    </svg>
                  </span>
                  <span className="font-mono text-text-secondary text-xs">{h}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-text-muted text-sm italic">
              No client directory uploaded — reports will use Client IDs only
            </p>
          )}

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-text-muted">
              Source: Client Directory file<br />
              Stored in browser memory only
            </p>
          </div>
        </div>

        {/* Right: Sent to AI */}
        <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            <h3 className="font-heading font-bold text-text-secondary text-sm sm:text-base">
              Sent to AI
            </h3>
          </div>

          <ul className="space-y-2">
            {bookHeaders.map((h) => (
              <li key={h} className="flex items-center gap-2 text-sm">
                <span className="w-4 h-4 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                  <svg className="w-2.5 h-2.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                <span className="font-mono text-text-secondary text-xs">{h}</span>
              </li>
            ))}
          </ul>

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-text-muted">
              Source: Book Data file<br />
              Analyzed by Claude
            </p>
          </div>
        </div>
      </div>

      {/* Link indicator */}
      <div className="text-center">
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-full text-xs text-text-muted">
          <span className="font-mono text-accent">client_id</span>
          is the only link between the two files
        </span>
      </div>

      <p className="text-text-secondary text-sm text-center max-w-lg mx-auto">
        The AI analyzes your book using Client IDs. When you generate a report, names are re-attached locally on your device.
      </p>

      {/* Confirmation */}
      <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded border-border-active bg-bg accent-accent"
          />
          <span className="text-sm text-text-secondary group-hover:text-text transition-colors">
            I confirm the Book Data file contains no personally identifiable
            information beyond Client IDs.
          </span>
        </label>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            onClick={onBack}
            className="px-5 py-2.5 text-sm bg-surface border border-border rounded-lg hover:border-border-active text-text-secondary hover:text-text transition-all"
          >
            Back
          </button>
          <div className="flex-1" />
          <button
            onClick={onConfirm}
            disabled={!canProceed}
            className={`px-6 py-2.5 text-sm font-heading font-bold rounded-lg transition-all ${
              canProceed
                ? "bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20"
                : "bg-surface-hover text-text-muted cursor-not-allowed"
            }`}
          >
            Start Book Review
          </button>
        </div>
      </div>
    </div>
  );
}
