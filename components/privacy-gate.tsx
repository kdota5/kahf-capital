"use client";

import { useState, useEffect } from "react";
import type { PIIWarning, ClientDirectory } from "@/lib/types";

interface PrivacyGateProps {
  bookHeaders: string[];
  piiWarnings: PIIWarning[];
  clientCount: number;
  directory: ClientDirectory | null;
  onConfirm: () => void;
  onBack: () => void;
}

const PII_PILLS = ["Full Name", "Email", "Phone", "Address", "Company"];
const DATA_PILLS = ["C-1001", "$1.2M AUM", "37% bracket", "Moderate Risk", "Holdings"];

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
  const [animPhase, setAnimPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setAnimPhase(1), 800),
      setTimeout(() => setAnimPhase(2), 2200),
      setTimeout(() => setAnimPhase(3), 3200),
      setTimeout(() => setAnimPhase(4), 3800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const activeWarnings = piiWarnings.filter(
    (w) => !dismissedWarnings.has(w.column)
  );
  const canProceed = confirmed && activeWarnings.length === 0;

  const localFields = directory
    ? directory.headers.filter(
        (h) => h !== "client_id" && h !== "clientid"
      )
    : [];

  const piiPills = directory
    ? localFields.slice(0, 5).map((h) => h.replace(/_/g, " "))
    : PII_PILLS;
  const dataPills =
    bookHeaders.length > 0
      ? bookHeaders.slice(0, 5).map((h) => h.replace(/_/g, " "))
      : DATA_PILLS;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Animated visualization */}
      <div className="relative h-[200px] sm:h-[220px] flex items-center justify-center overflow-hidden">
        {/* Phase 0-1: File cards */}
        <div
          className="absolute flex items-center gap-8 transition-all duration-1000 ease-out"
          style={{
            transform:
              animPhase >= 1 ? "scale(0.85)" : "scale(1)",
            opacity: animPhase >= 1 ? 0.9 : 1,
          }}
        >
          {/* Left: Directory card -> vault */}
          <div
            className="relative transition-all duration-1000 ease-out"
            style={{
              transform:
                animPhase >= 1
                  ? "translateX(-60px) sm:translateX(-80px)"
                  : "translateX(0)",
            }}
          >
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center transition-all duration-500 ${
                animPhase >= 2
                  ? "bg-surface border-2 border-accent/40 shadow-lg shadow-accent/10"
                  : "bg-surface border border-border"
              }`}
              style={
                animPhase >= 2
                  ? { animation: "pulse-lock 1s ease-in-out" }
                  : undefined
              }
            >
              <svg
                className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors duration-500 ${animPhase >= 2 ? "text-accent" : "text-text-secondary"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-text-muted whitespace-nowrap">
              Stays local
            </span>

            {/* PII pills floating out */}
            {animPhase >= 1 &&
              piiPills.map((pill, i) => (
                <span
                  key={pill}
                  className="absolute text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-danger-dim text-danger border border-danger/20 whitespace-nowrap capitalize"
                  style={{
                    top: `${-10 + i * 22}px`,
                    right: "-90px",
                    animation: `pill-to-vault 1.2s ease-in-out ${i * 0.1}s forwards`,
                  }}
                >
                  {pill}
                </span>
              ))}
          </div>

          {/* Center: connecting line */}
          {animPhase >= 2 && (
            <div className="flex flex-col items-center gap-1">
              <div
                className="border-t-2 border-dashed border-text-muted w-16 sm:w-24"
                style={{ animation: "fade-in 0.6s ease-out forwards" }}
              />
              <span
                className="text-[9px] font-mono text-accent bg-bg px-2 py-0.5 rounded border border-border"
                style={{ animation: "fade-in 0.6s ease-out 0.3s both" }}
              >
                client_id
              </span>
            </div>
          )}

          {/* Right: Book data -> AI */}
          <div
            className="relative transition-all duration-1000 ease-out"
            style={{
              transform:
                animPhase >= 1
                  ? "translateX(60px) sm:translateX(80px)"
                  : "translateX(0)",
            }}
          >
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center transition-all duration-500 ${
                animPhase >= 2
                  ? "bg-surface border-2 border-accent/30 shadow-lg shadow-accent/20"
                  : "bg-surface border border-border"
              }`}
              style={
                animPhase >= 2
                  ? { animation: "glow-ai 1s ease-in-out" }
                  : undefined
              }
            >
              <svg
                className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors duration-500 ${animPhase >= 2 ? "text-accent" : "text-text-secondary"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                />
              </svg>
            </div>
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-text-muted whitespace-nowrap">
              Sent to AI
            </span>

            {/* Data pills floating out */}
            {animPhase >= 1 &&
              dataPills.map((pill, i) => (
                <span
                  key={pill}
                  className="absolute text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-accent-dim text-accent border border-accent/20 whitespace-nowrap capitalize"
                  style={{
                    top: `${-10 + i * 22}px`,
                    left: "-110px",
                    animation: `pill-to-ai 1.2s ease-in-out ${i * 0.1}s forwards`,
                  }}
                >
                  {pill}
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* PII Warnings */}
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

      {/* Two-column detail (appears in phase 4) */}
      {animPhase >= 4 && (
        <div className="animate-fade-in">
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
                <ul className="space-y-1.5">
                  {localFields.map((h) => (
                    <li key={h} className="text-xs font-mono text-text-secondary capitalize">
                      {h.replace(/_/g, " ")}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-text-muted text-sm italic">
                  No client directory uploaded
                </p>
              )}
              <p className="text-xs text-text-muted pt-2 border-t border-border">
                Stored in browser memory only
              </p>
            </div>

            {/* Right: Sent to AI */}
            <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                <h3 className="font-heading font-bold text-text-secondary text-sm sm:text-base">
                  Sent to AI
                </h3>
              </div>
              <ul className="space-y-1.5">
                {bookHeaders.map((h) => (
                  <li key={h} className="text-xs font-mono text-text-secondary">
                    {h}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-text-muted pt-2 border-t border-border">
                Analyzed by Claude
              </p>
            </div>
          </div>

          {/* Link indicator */}
          <div className="text-center mt-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-full text-xs text-text-muted">
              <span className="font-mono text-accent">client_id</span>
              is the only link between the two files
            </span>
          </div>

          <p className="text-text-secondary text-sm text-center max-w-lg mx-auto mt-4">
            The AI analyzes your book using Client IDs. When you generate a
            report, names are re-attached locally on your device.
          </p>

          {/* Confirmation */}
          <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-4 mt-6">
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
                {clientCount > 0 && (
                  <span className="ml-1 font-mono text-accent">
                    ({clientCount} clients)
                  </span>
                )}
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
      )}
    </div>
  );
}
