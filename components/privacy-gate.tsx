"use client";

import { useState } from "react";
import type { PIIWarning } from "@/lib/types";

interface PrivacyGateProps {
  headers: string[];
  piiWarnings: PIIWarning[];
  clientCount: number;
  onConfirm: () => void;
  onBack: () => void;
}

const PII_LABELS: Record<string, string> = {
  names: "Client Names",
  ssn: "Social Security Numbers",
  addresses: "Addresses",
  phone: "Phone Numbers",
  email: "Email Addresses",
  employer: "Employer Info",
  dob: "Dates of Birth",
};

export default function PrivacyGate({
  headers,
  piiWarnings,
  clientCount,
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="font-heading text-2xl font-bold">Privacy Review</h2>
        <p className="text-text-secondary">
          Review exactly what data will enter the AI before proceeding.
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
            <svg
              className="w-5 h-5 text-danger"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <h3 className="text-danger font-heading font-bold">
              Potential PII Detected
            </h3>
          </div>
          {activeWarnings.map((w) => (
            <div
              key={w.column}
              className="flex items-center justify-between bg-bg/50 rounded-lg p-3"
            >
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-success-dim border border-success/20 rounded-xl p-6">
          <h3 className="font-heading font-bold text-success mb-4 flex items-center gap-2">
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
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Data Entering the AI
          </h3>
          <ul className="space-y-2">
            {headers.map((h) => (
              <li key={h} className="flex items-center gap-2 text-sm">
                <span className="w-4 h-4 rounded-full bg-success/20 flex items-center justify-center">
                  <svg
                    className="w-2.5 h-2.5 text-success"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                </span>
                <span className="font-mono text-text-secondary">{h}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="font-heading font-bold text-danger mb-4 flex items-center gap-2">
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
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
            Data NOT Present
          </h3>
          <ul className="space-y-2">
            {Object.entries(PII_LABELS).map(([key, label]) => (
              <li key={key} className="flex items-center gap-2 text-sm">
                <span className="w-4 h-4 rounded-full bg-danger/20 flex items-center justify-center">
                  <svg
                    className="w-2.5 h-2.5 text-danger"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </span>
                <span className="text-text-secondary">
                  {label} — <span className="text-text-muted">not uploaded</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded border-border-active bg-bg accent-accent"
          />
          <span className="text-sm text-text-secondary group-hover:text-text transition-colors">
            I confirm this data contains no personally identifiable information.
            Client IDs are the only identifiers, and I understand this data will
            be sent to Claude for analysis.
          </span>
        </label>

        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-5 py-2.5 text-sm bg-surface border border-border rounded-lg hover:border-border-active text-text-secondary hover:text-text transition-all"
          >
            Back
          </button>
          <button
            onClick={onConfirm}
            disabled={!canProceed}
            className={`px-6 py-2.5 text-sm font-heading font-bold rounded-lg transition-all ${
              canProceed
                ? "bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20"
                : "bg-surface-hover text-text-muted cursor-not-allowed"
            }`}
          >
            Start Reviewing My Book
          </button>
        </div>
      </div>
    </div>
  );
}
