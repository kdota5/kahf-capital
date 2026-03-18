"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type {
  UserMode,
  BookData,
  BookAnalytics,
  ParseResult,
  FAClientRecord,
  FAHolding,
  AcctClientRecord,
  ChatMessage,
  ClientDirectory,
} from "@/lib/types";
import { computeAnalytics } from "@/lib/analytics";
import { buildSystemPrompt } from "@/lib/system-prompt";
import {
  buildReportContent,
  type ClientNameMap,
  type ReportSection,
} from "@/lib/report-engine";
import {
  buildMapFromDirectory,
  persistDirectory,
} from "@/lib/client-map-store";
import {
  FA_DEMO_CLIENTS,
  FA_DEMO_HOLDINGS,
  ACCT_DEMO_CLIENTS,
  FA_DEMO_DIRECTORY,
  ACCT_DEMO_DIRECTORY,
} from "@/lib/demo-data";
import UploadPanel from "@/components/upload-panel";
import PrivacyGate from "@/components/privacy-gate";
import BookSummary from "@/components/book-summary";
import ClientTable from "@/components/client-table";
import ChatInterface from "@/components/chat-interface";
import ReportBuilder from "@/components/report-builder";

type Step = "mode" | "upload" | "privacy" | "chat" | "report_preview";

function prepareMessagesForAPI(
  messages: ChatMessage[],
  directory: ClientDirectory | null
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
      const regex = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      content = content.replace(regex, id);
    }
    return { ...m, content };
  });
}

function ReviewContent() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("mode");
  const [mode, setMode] = useState<UserMode | null>(null);
  const [book, setBook] = useState<BookData | null>(null);
  const [analytics, setAnalytics] = useState<BookAnalytics | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [directory, setDirectory] = useState<ClientDirectory | null>(null);
  const [clientNameMap, setClientNameMap] = useState<ClientNameMap>({});
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reportSections, setReportSections] = useState<ReportSection[]>([]);

  useEffect(() => {
    const demo = searchParams.get("demo");
    if (demo === "fa") {
      setMode("financial_advisor");
      loadDemo("financial_advisor");
    } else if (demo === "acct") {
      setMode("accountant");
      loadDemo("accountant");
    }
  }, [searchParams]);

  const loadDemo = useCallback((m: UserMode) => {
    let bookData: BookData;
    const demoDir: ClientDirectory = {
      entries: m === "financial_advisor" ? FA_DEMO_DIRECTORY : ACCT_DEMO_DIRECTORY,
      headers: ["client_id", "full_name", "email", "phone", "company"],
      loadedAt: new Date().toISOString(),
    };

    if (m === "financial_advisor") {
      bookData = {
        mode: "financial_advisor",
        clients: FA_DEMO_CLIENTS,
        holdings: FA_DEMO_HOLDINGS,
        rawHeaders: [
          "client_id", "age", "filing_status", "federal_tax_bracket",
          "state_tax_rate", "risk_tolerance", "investment_objective",
          "time_horizon", "annual_income", "liquid_net_worth",
          "total_net_worth", "liquidity_needs",
        ],
        rowCount: FA_DEMO_CLIENTS.length,
        uploadedAt: new Date().toISOString(),
      };
    } else {
      bookData = {
        mode: "accountant",
        clients: ACCT_DEMO_CLIENTS,
        rawHeaders: [
          "client_id", "filing_status", "num_dependents",
          "state_of_residence", "w2_income", "self_employment_income",
          "business_income_loss", "rental_income_loss",
          "capital_gains_short", "capital_gains_long", "interest_income",
          "dividend_income_qualified", "dividend_income_ordinary",
          "mortgage_interest", "salt_paid", "charitable_cash",
          "estimated_tax_payments", "withholding",
        ],
        rowCount: ACCT_DEMO_CLIENTS.length,
        uploadedAt: new Date().toISOString(),
      };
    }

    setBook(bookData);
    setDirectory(demoDir);
    const nameMap = buildMapFromDirectory(demoDir);
    setClientNameMap(nameMap);
    persistDirectory(demoDir);

    const a = computeAnalytics(bookData);
    setAnalytics(a);
    setParseResult({
      clients: bookData.clients as unknown as Record<string, unknown>[],
      holdings: bookData.holdings as unknown as Record<string, unknown>[] | undefined,
      headers: bookData.rawHeaders,
      errors: [],
      piiWarnings: [],
    });
    setStep("privacy");
  }, []);

  const handleModeSelect = (m: UserMode) => {
    setMode(m);
    setStep("upload");
  };

  const handleUploadComplete = useCallback(
    (result: ParseResult, dir: ClientDirectory | null) => {
      setParseResult(result);
      if (result.errors.length > 0) return;

      if (dir) {
        setDirectory(dir);
        const nameMap = buildMapFromDirectory(dir);
        setClientNameMap(nameMap);
        persistDirectory(dir);
      }

      const bookData: BookData = {
        mode: mode!,
        clients:
          mode === "financial_advisor"
            ? (result.clients as unknown as FAClientRecord[])
            : (result.clients as unknown as AcctClientRecord[]),
        holdings:
          mode === "financial_advisor"
            ? (result.holdings as unknown as FAHolding[] | undefined)
            : undefined,
        rawHeaders: result.headers,
        rowCount: result.clients.length,
        uploadedAt: new Date().toISOString(),
      };

      setBook(bookData);
      const a = computeAnalytics(bookData);
      setAnalytics(a);
      setStep("privacy");
    },
    [mode]
  );

  const handlePrivacyConfirm = useCallback(() => {
    if (book && analytics) {
      const prompt = buildSystemPrompt(book, analytics);
      setSystemPrompt(prompt);
      setStep("chat");
    }
  }, [book, analytics]);

  const handleGenerateReport = useCallback(
    (messages: ChatMessage[]) => {
      const sections = buildReportContent(messages, clientNameMap);
      setReportSections(sections);
      setStep("report_preview");
    },
    [clientNameMap]
  );

  const handleClientClick = useCallback((clientId: string) => {
    const chatInterface = document.querySelector("textarea");
    if (chatInterface) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
      )?.set;
      nativeInputValueSetter?.call(
        chatInterface,
        `Tell me about ${clientId} — give me a complete overview`
      );
      chatInterface.dispatchEvent(new Event("input", { bubbles: true }));
      chatInterface.focus();
    }
  }, []);

  const faFilters = [
    { key: "concentration", label: "High Concentration" },
    { key: "harvesting", label: "Tax Harvesting" },
    { key: "roth", label: "Roth Candidates" },
    { key: "retirement", label: "Near Retirement" },
  ];

  const acctFilters = [
    { key: "amt", label: "AMT Risk" },
    { key: "salt", label: "High SALT" },
    { key: "bunching", label: "Bunching Candidates" },
    { key: "underpayment", label: "Underpayment Risk" },
  ];

  // ── Mode Selection ──
  if (step === "mode") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 sm:py-0">
          <div className="max-w-3xl w-full space-y-6 sm:space-y-8 animate-fade-in">
            <div className="text-center space-y-2">
              <h1 className="font-heading text-2xl sm:text-3xl font-bold">
                Select Your Mode
              </h1>
              <p className="text-text-secondary">
                This determines the expected data schema and AI analysis focus.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ModeCard
                title="Financial Advisor"
                desc="Portfolio data, holdings, risk profiles, tax brackets, account types"
                icon={
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                }
                onClick={() => handleModeSelect("financial_advisor")}
              />
              <ModeCard
                title="Accountant"
                desc="Income sources, deductions, credits, tax planning data, filing status"
                icon={
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                }
                onClick={() => handleModeSelect("accountant")}
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Upload (two-zone) ──
  if (step === "upload" && mode) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onBack={() => setStep("mode")} />
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-2xl w-full space-y-6">
            <div className="text-center space-y-2">
              <h1 className="font-heading text-2xl sm:text-3xl font-bold">
                Upload Your Data
              </h1>
              <p className="text-text-secondary text-sm sm:text-base">
                Two files: a private client directory (optional) and your anonymized book data.
              </p>
            </div>
            <UploadPanel
              mode={mode}
              onComplete={handleUploadComplete}
              onLoadDemo={() => loadDemo(mode)}
            />
          </div>
        </main>
      </div>
    );
  }

  // ── Privacy Gate ──
  if (step === "privacy" && parseResult) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onBack={() => setStep("upload")} />
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
          <PrivacyGate
            bookHeaders={parseResult.headers}
            piiWarnings={parseResult.piiWarnings}
            clientCount={parseResult.clients.length}
            directory={directory}
            onConfirm={handlePrivacyConfirm}
            onBack={() => setStep("upload")}
          />
        </main>
      </div>
    );
  }

  // ── Chat ──
  if (step === "chat" && book && analytics && mode) {
    const filters = mode === "financial_advisor" ? faFilters : acctFilters;
    const hasNames = Object.keys(clientNameMap).length > 0;

    const sidebarContent = (
      <>
        <BookSummary analytics={analytics} />
        <ClientTable
          book={book}
          onClientClick={(id) => {
            handleClientClick(id);
            setSidebarOpen(false);
          }}
          activeFilter={activeFilter}
          clientNameMap={hasNames ? clientNameMap : undefined}
        />
        <div className="space-y-2">
          <p className="text-xs text-text-muted font-medium uppercase tracking-wider">
            Quick Filters
          </p>
          <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() =>
                  setActiveFilter((prev) =>
                    prev === f.key ? null : f.key
                  )
                }
                className={`px-2.5 py-1.5 text-xs rounded-lg border transition-all ${
                  activeFilter === f.key
                    ? "bg-accent-dim border-accent/40 text-accent"
                    : "bg-surface border-border text-text-secondary hover:border-border-active hover:text-text"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </>
    );

    return (
      <div className="h-[100dvh] flex flex-col">
        <Header minimal onToggleSidebar={() => setSidebarOpen((o) => !o)} showSidebarToggle />
        <div className="flex-1 flex overflow-hidden relative">
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <div
            className={`
              fixed inset-y-0 left-0 z-40 w-[320px] sm:w-[360px] bg-sidebar border-r border-border overflow-y-auto p-4 space-y-6
              transform transition-transform duration-300 ease-in-out
              lg:relative lg:translate-x-0 lg:z-auto
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            `}
          >
            <div className="flex items-center justify-between lg:hidden mb-2">
              <span className="font-heading font-bold text-sm">Book Data</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-text transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {sidebarContent}
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <ChatInterface
              systemPrompt={systemPrompt}
              mode={mode}
              onGenerateReport={handleGenerateReport}
              directory={directory}
            />
          </div>
        </div>

        {/* Privacy footer */}
        <div className="border-t border-border bg-sidebar px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
            <span className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-success-dim text-success border border-success/20 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              <span className="hidden sm:inline">No PII in context</span>
              <span className="sm:hidden">No PII</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border text-text-secondary whitespace-nowrap">
              Client IDs only
            </span>
            <span className="text-text-muted font-mono whitespace-nowrap">
              {book.rowCount} clients
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="text-text-muted font-mono hidden sm:inline">Claude Sonnet 4</span>
            <button
              onClick={() => setPrivacyModalOpen(true)}
              className="text-text-muted hover:text-text-secondary transition-colors underline underline-offset-2 whitespace-nowrap"
            >
              <span className="hidden sm:inline">How we protect your data</span>
              <span className="sm:hidden">Privacy</span>
            </button>
          </div>
        </div>

        {/* Privacy modal */}
        {privacyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-sidebar border border-border rounded-2xl p-6 sm:p-8 max-w-lg w-full mx-4 sm:mx-6 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-lg">Privacy Architecture</h3>
                <button onClick={() => setPrivacyModalOpen(false)} className="text-text-muted hover:text-text transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
                <p><strong className="text-text">Two-file architecture.</strong> Your client directory (names, contact info) stays in your browser. Only anonymized book data (Client IDs, holdings, tax info) is sent to the AI.</p>
                <p><strong className="text-text">PII safety net.</strong> If you accidentally type a client name in chat, the system automatically replaces it with the Client ID before sending to the AI.</p>
                <p><strong className="text-text">Reports generated locally.</strong> When you create a report, names are re-attached on your device. The AI never sees them.</p>
                <p><strong className="text-text">No data is stored.</strong> Everything is session-based. When you close the tab, the data is gone.</p>
              </div>
              <button onClick={() => setPrivacyModalOpen(false)} className="w-full py-2.5 bg-accent text-white font-heading font-bold text-sm rounded-lg hover:bg-accent/90 transition-colors">
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Report Preview ──
  if (step === "report_preview" && book && mode) {
    return (
      <div className="h-[100dvh] flex flex-col">
        <ReportBuilder
          sections={reportSections}
          clientMap={clientNameMap}
          book={book}
          onBack={() => setStep("report_preview")}
          onEditNames={() => {}}
          onBackToChat={() => setStep("chat")}
        />
      </div>
    );
  }

  return null;
}

function Header({
  onBack,
  minimal,
  onToggleSidebar,
  showSidebarToggle,
}: {
  onBack?: () => void;
  minimal?: boolean;
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}) {
  return (
    <header className={`flex items-center justify-between px-4 sm:px-6 border-b border-border ${minimal ? "py-2.5" : "py-4"}`}>
      <div className="flex items-center gap-2 sm:gap-3">
        {showSidebarToggle && (
          <button onClick={onToggleSidebar} className="p-1.5 rounded-lg hover:bg-surface transition-colors text-text-secondary hover:text-text lg:hidden">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        )}
        {onBack && (
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-surface transition-colors text-text-secondary hover:text-text">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
        )}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center font-heading font-bold text-xs text-white">C</div>
          <span className="font-heading font-bold text-sm tracking-tight">Conda</span>
          {!minimal && <span className="text-text-muted text-xs ml-1 hidden sm:inline">Book Review Intelligence</span>}
        </div>
      </div>
    </header>
  );
}

function ModeCard({ title, desc, icon, onClick }: { title: string; desc: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group text-left p-6 sm:p-8 bg-surface border border-border rounded-2xl hover:border-accent/40 hover:bg-accent-dim transition-all space-y-4">
      <div className="w-14 h-14 rounded-xl bg-bg flex items-center justify-center text-text-secondary group-hover:text-accent transition-colors">{icon}</div>
      <div>
        <h3 className="font-heading font-bold text-xl mb-2 group-hover:text-accent transition-colors">{title}</h3>
        <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
      </div>
      <div className="pt-2"><span className="text-accent text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">Select →</span></div>
    </button>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>}>
      <ReviewContent />
    </Suspense>
  );
}
