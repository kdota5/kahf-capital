"use client";

import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href="/review"
            className="p-1.5 rounded-lg hover:bg-surface transition-colors text-text-secondary hover:text-text"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center font-heading font-bold text-xs text-white">
              C
            </div>
            <span className="font-heading font-bold text-sm tracking-tight">
              Conda
            </span>
            <span className="text-text-muted text-xs ml-1">Settings</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 py-10 space-y-6">
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <Link
          href="/settings/style"
          className="block group p-5 bg-surface border border-border rounded-xl hover:border-accent/40 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent-dim flex items-center justify-center text-accent shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </div>
            <div>
              <h3 className="font-heading font-bold text-base group-hover:text-accent transition-colors">
                Firm Style Configuration
              </h3>
              <p className="text-sm text-text-secondary mt-0.5">
                Teach Conda how your firm writes. Upload sample documents to
                match your tone, structure, and vocabulary.
              </p>
            </div>
          </div>
        </Link>
      </main>
    </div>
  );
}
