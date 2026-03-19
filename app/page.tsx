"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-heading font-bold text-sm text-white">
            C
          </div>
          <span className="font-heading font-bold text-lg tracking-tight">
            Conda
          </span>
        </div>
        <Link
          href="/review"
          className="px-5 py-2.5 bg-accent text-white font-heading font-semibold text-sm rounded-lg hover:bg-accent/90 transition-colors"
        >
          Get Started
        </Link>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-0">
        <div className="max-w-3xl text-center space-y-6 sm:space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-dim border border-accent/20 text-accent text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse-dot" />
            Privacy-First AI Intelligence
          </div>

          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
            Your entire book.
            <br />
            <span className="text-accent">One conversation.</span>
          </h1>

          <p className="text-text-secondary text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Upload your client book — no names, no SSNs, just anonymized data —
            and have an open-ended conversation with a senior analyst who has
            memorized every portfolio, tax situation, and risk profile.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/review"
              className="px-8 py-3.5 bg-accent text-white font-heading font-bold text-base rounded-xl hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
            >
              Start Reviewing Your Book
            </Link>
            <Link
              href="/review?demo=preloaded"
              className="px-8 py-3.5 bg-surface text-text-secondary font-heading font-semibold text-base rounded-xl border border-border hover:border-border-active hover:text-text transition-all"
            >
              View Live Demo
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-8 sm:pt-12">
            {[
              {
                title: "Financial Advisors",
                desc: "Cross-reference portfolios, spot concentration risk, find Roth conversion candidates, optimize asset location.",
              },
              {
                title: "Accountants & CPAs",
                desc: "Identify AMT risk, 199A opportunities, charitable bunching candidates, underpayment flags across your book.",
              },
              {
                title: "Privacy Architecture",
                desc: "Client IDs only — no names, no SSNs. You see exactly what data enters the AI before confirming.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="p-6 bg-surface rounded-xl border border-border text-left"
              >
                <h3 className="font-heading font-bold text-base mb-2">
                  {card.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="px-4 sm:px-8 py-4 sm:py-5 border-t border-border text-center text-text-muted text-xs sm:text-sm">
        No data is stored. No accounts required. Everything is session-based and
        ephemeral.
      </footer>
    </div>
  );
}
