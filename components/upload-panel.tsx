"use client";

import { useState, useCallback, useRef } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { UserMode, ParseResult, ClientDirectory, ClientDirectoryEntry } from "@/lib/types";
import { parseUpload } from "@/lib/parser";
import {
  generateFAClientCSV,
  generateFAHoldingsCSV,
  generateAcctCSV,
} from "@/lib/templates";

interface UploadPanelProps {
  mode: UserMode;
  onComplete: (result: ParseResult, directory: ClientDirectory | null) => void;
  onLoadDemo: () => void;
}

export default function UploadPanel({
  mode,
  onComplete,
  onLoadDemo,
}: UploadPanelProps) {
  const [directory, setDirectory] = useState<ClientDirectory | null>(null);
  const [dirFileName, setDirFileName] = useState<string | null>(null);
  const [bookResult, setBookResult] = useState<ParseResult | null>(null);
  const [bookFileName, setBookFileName] = useState<string | null>(null);
  const [holdingsFileName, setHoldingsFileName] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [dirCollapsed, setDirCollapsed] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  const dirFileRef = useRef<HTMLInputElement>(null);
  const bookFileRef = useRef<HTMLInputElement>(null);
  const holdingsFileRef = useRef<HTMLInputElement>(null);
  const mainBookFileRef = useRef<File | null>(null);

  // ── Directory parsing ──
  const parseDirectory = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    let rows: Record<string, unknown>[] = [];

    try {
      if (ext === "csv") {
        const text = await file.text();
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        rows = result.data as Record<string, unknown>[];
      } else if (ext === "xlsx" || ext === "xls") {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array" });
        rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      }
    } catch {
      setErrors((prev) => [...prev, "Failed to parse directory file."]);
      return;
    }

    if (rows.length === 0) {
      setErrors((prev) => [...prev, "Directory file has no data rows."]);
      return;
    }

    const rawHeaders = Object.keys(rows[0]);
    const headerMap: Record<string, string> = {};
    for (const h of rawHeaders) {
      const norm = h.toLowerCase().trim().replace(/[\s_-]+/g, "_");
      headerMap[h] = norm;
    }

    const hasId = rawHeaders.some(
      (h) => headerMap[h] === "client_id" || headerMap[h] === "clientid"
    );
    const hasName = rawHeaders.some(
      (h) =>
        headerMap[h] === "full_name" ||
        headerMap[h] === "fullname" ||
        headerMap[h] === "name" ||
        headerMap[h] === "client_name" ||
        headerMap[h] === "clientname"
    );

    if (!hasId || !hasName) {
      setErrors((prev) => [
        ...prev,
        `Directory file must have 'client_id' and 'full_name' columns. Found: ${rawHeaders.join(", ")}`,
      ]);
      return;
    }

    const idKey = rawHeaders.find(
      (h) => headerMap[h] === "client_id" || headerMap[h] === "clientid"
    )!;
    const nameKey = rawHeaders.find(
      (h) =>
        headerMap[h] === "full_name" ||
        headerMap[h] === "fullname" ||
        headerMap[h] === "name" ||
        headerMap[h] === "client_name" ||
        headerMap[h] === "clientname"
    )!;

    const entries: ClientDirectoryEntry[] = rows
      .map((row) => {
        const entry: ClientDirectoryEntry = {
          client_id: String(row[idKey] || "").trim(),
          full_name: String(row[nameKey] || "").trim(),
        };
        for (const h of rawHeaders) {
          const norm = headerMap[h];
          if (norm !== "client_id" && norm !== "clientid" && norm !== headerMap[nameKey]) {
            const val = row[h];
            if (val !== undefined && val !== null && val !== "") {
              entry[norm] = String(val).trim();
            }
          }
        }
        return entry;
      })
      .filter((e) => e.client_id && e.full_name);

    const dir: ClientDirectory = {
      entries,
      headers: rawHeaders.map((h) => headerMap[h]),
      loadedAt: new Date().toISOString(),
    };

    setDirectory(dir);
    setDirFileName(file.name);
    setDirCollapsed(false);
    setTimeout(() => setDirCollapsed(true), 3000);

    if (bookResult) {
      crossValidate(bookResult, dir);
    }
  }, [bookResult]);

  // ── Book data parsing ──
  const handleBookFile = useCallback(
    async (file: File, holdingsFile?: File) => {
      setErrors([]);
      try {
        const result = await parseUpload(file, mode, holdingsFile);
        if (result.errors.length > 0) {
          setErrors(result.errors);
        }
        setBookResult(result);
        setBookFileName(file.name);

        if (directory) {
          crossValidate(result, directory);
        }
      } catch (e: any) {
        setErrors([e.message || "Failed to parse book data"]);
      }
    },
    [mode, directory]
  );

  // ── Cross-validation ──
  const crossValidate = useCallback(
    (result: ParseResult, dir: ClientDirectory) => {
      const dirIds = new Set(dir.entries.map((e) => e.client_id));
      const bookIds = result.clients.map((c) => String(c.client_id || ""));
      const missing = bookIds.filter((id) => id && !dirIds.has(id));

      if (missing.length > 0) {
        setWarnings([
          `${missing.length} client${missing.length > 1 ? "s" : ""} in book data ${missing.length > 1 ? "don't" : "doesn't"} have names in your directory: ${missing.join(", ")}. They'll appear as Client IDs in reports.`,
        ]);
      } else {
        setWarnings([]);
      }
    },
    []
  );

  const canContinue = bookResult && bookResult.errors.length === 0 && bookResult.clients.length > 0;

  const downloadTemplate = useCallback(() => {
    if (mode === "financial_advisor") {
      downloadCSV(generateFAClientCSV(), "fa-clients-template.csv");
      setTimeout(
        () => downloadCSV(generateFAHoldingsCSV(), "fa-holdings-template.csv"),
        200
      );
    } else {
      downloadCSV(generateAcctCSV(), "accountant-clients-template.csv");
    }
  }, [mode]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Zone 1: Client Directory ── */}
      <div className="rounded-xl border border-border bg-surface/50 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 flex items-center gap-3 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-accent-dim flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-sm text-text">1</span>
              <h3 className="font-heading font-bold text-sm">Client Directory</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-dim text-accent font-medium">OPTIONAL</span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Names and contact info — stored locally, never sent to AI
            </p>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4">
          {directory && dirFileName ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-success font-medium">
                  {directory.entries.length} clients loaded
                </span>
                <span className="text-text-muted">from {dirFileName}</span>
                <button
                  onClick={() => {
                    setDirectory(null);
                    setDirFileName(null);
                    setDirCollapsed(false);
                    setWarnings([]);
                  }}
                  className="ml-auto text-xs text-text-muted hover:text-text transition-colors"
                >
                  Remove
                </button>
              </div>
              {!dirCollapsed && (
                <div className="text-xs text-text-secondary animate-fade-in">
                  {directory.entries.slice(0, 4).map((e) => e.full_name).join(", ")}
                  {directory.entries.length > 4 && `, +${directory.entries.length - 4} more`}
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() => dirFileRef.current?.click()}
              className="border border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-border-active transition-colors"
            >
              <input
                ref={dirFileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) parseDirectory(f);
                }}
                className="hidden"
              />
              <p className="text-text-secondary text-sm">
                Drop CSV or Excel with <span className="font-mono text-accent">client_id</span> and{" "}
                <span className="font-mono text-accent">full_name</span> columns
              </p>
              <p className="text-text-muted text-xs mt-1">
                Optional: email, phone, address, company
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Zone 2: Book Data ── */}
      <div className="rounded-xl border border-border bg-surface/30 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 flex items-center gap-3 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-sm text-text">2</span>
              <h3 className="font-heading font-bold text-sm">Book Data</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning-dim text-warning font-medium">REQUIRED</span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              {mode === "financial_advisor" ? "Portfolio holdings, risk profiles, tax brackets" : "Income, deductions, credits, tax data"} — analyzed by AI
            </p>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 space-y-4">
          {bookFileName ? (
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-success font-medium">
                {bookResult?.clients.length || 0} clients
                {bookResult?.holdings ? `, ${bookResult.holdings.length} holdings` : ""} loaded
              </span>
              <span className="text-text-muted">
                from {bookFileName}{holdingsFileName ? ` + ${holdingsFileName}` : ""}
              </span>
              <button
                onClick={() => {
                  setBookResult(null);
                  setBookFileName(null);
                  setHoldingsFileName(null);
                  setWarnings([]);
                }}
                className="ml-auto text-xs text-text-muted hover:text-text transition-colors"
              >
                Remove
              </button>
            </div>
          ) : (
            <div
              onClick={() => bookFileRef.current?.click()}
              className="border border-dashed border-border rounded-lg p-6 sm:p-8 text-center cursor-pointer hover:border-border-active transition-colors"
            >
              <input
                ref={bookFileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    mainBookFileRef.current = f;
                    handleBookFile(f);
                  }
                }}
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto rounded-xl bg-surface flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <p className="text-text font-medium text-sm">
                Drop your {mode === "financial_advisor" ? "client book" : "tax data"} here
              </p>
              <p className="text-text-secondary text-xs mt-1">
                CSV or Excel (.xlsx)
              </p>
            </div>
          )}

          {mode === "financial_advisor" && bookFileName && !holdingsFileName && (
            <div className="flex items-center gap-3">
              <input
                ref={holdingsFileRef}
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f && mainBookFileRef.current) {
                    setHoldingsFileName(f.name);
                    handleBookFile(mainBookFileRef.current, f);
                  }
                }}
                className="hidden"
              />
              <button
                onClick={() => holdingsFileRef.current?.click()}
                className="px-3 py-1.5 text-xs bg-surface border border-border rounded-lg hover:border-border-active text-text-secondary hover:text-text transition-all"
              >
                + Add holdings CSV
              </button>
              <span className="text-text-muted text-xs">
                Or include as a second sheet in Excel
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-danger-dim border border-danger/30 rounded-lg p-4 space-y-1">
          {errors.map((err, i) => (
            <p key={i} className="text-danger text-sm">{err}</p>
          ))}
        </div>
      )}

      {/* Cross-validation warnings */}
      {warnings.length > 0 && (
        <div className="bg-warning-dim border border-warning/30 rounded-lg p-4 space-y-1">
          {warnings.map((w, i) => (
            <p key={i} className="text-warning text-sm">{w}</p>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <button
          onClick={downloadTemplate}
          className="px-4 py-2.5 text-sm bg-surface border border-border rounded-lg hover:border-border-active text-text-secondary hover:text-text transition-all"
        >
          Download Template
        </button>
        <button
          onClick={onLoadDemo}
          className="px-4 py-2.5 text-sm bg-accent-dim border border-accent/20 rounded-lg hover:bg-accent/20 text-accent font-medium transition-all"
        >
          Load Full Demo
        </button>
        <div className="flex-1" />
        {canContinue && (
          <button
            onClick={() => onComplete(bookResult!, directory)}
            className="px-6 py-2.5 text-sm font-heading font-bold bg-accent text-white rounded-lg hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all"
          >
            Continue to Privacy Review
          </button>
        )}
      </div>

      {!directory && !dirFileName && (
        <p className="text-text-muted text-xs text-center">
          Without a client directory, reports will reference Client IDs instead of names.
        </p>
      )}
    </div>
  );
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
