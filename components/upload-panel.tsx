"use client";

import { useState, useCallback, useRef } from "react";
import type { UserMode, ParseResult } from "@/lib/types";
import { parseUpload } from "@/lib/parser";
import {
  generateFAClientCSV,
  generateFAHoldingsCSV,
  generateAcctCSV,
} from "@/lib/templates";
import {
  FA_DEMO_CLIENTS,
  FA_DEMO_HOLDINGS,
  ACCT_DEMO_CLIENTS,
} from "@/lib/demo-data";

interface UploadPanelProps {
  mode: UserMode;
  onParsed: (result: ParseResult) => void;
  onLoadDemo: () => void;
}

export default function UploadPanel({
  mode,
  onParsed,
  onLoadDemo,
}: UploadPanelProps) {
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [holdingsFileName, setHoldingsFileName] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const holdingsRef = useRef<HTMLInputElement>(null);
  const mainFileRef = useRef<File | null>(null);

  const handleFile = useCallback(
    async (file: File, holdingsFile?: File) => {
      setParsing(true);
      setErrors([]);
      try {
        const result = await parseUpload(file, mode, holdingsFile);
        if (result.errors.length > 0) {
          setErrors(result.errors);
        }
        onParsed(result);
      } catch (e: any) {
        setErrors([e.message || "Failed to parse file"]);
      } finally {
        setParsing(false);
      }
    },
    [mode, onParsed]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        setFileName(files[0].name);
        if (files.length > 1 && mode === "financial_advisor") {
          setHoldingsFileName(files[1].name);
          handleFile(files[0], files[1]);
        } else {
          mainFileRef.current = files[0];
          handleFile(files[0]);
        }
      }
    },
    [handleFile, mode]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFileName(file.name);
        mainFileRef.current = file;
        handleFile(file);
      }
    },
    [handleFile]
  );

  const onHoldingsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && mainFileRef.current) {
        setHoldingsFileName(file.name);
        handleFile(mainFileRef.current, file);
      }
    },
    [handleFile]
  );

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

  const faColumns = [
    "client_id",
    "age",
    "filing_status",
    "federal_tax_bracket",
    "state_tax_rate",
    "risk_tolerance",
    "investment_objective",
    "time_horizon",
    "annual_income",
    "liquid_net_worth",
    "total_net_worth",
    "liquidity_needs",
  ];

  const acctColumns = [
    "client_id",
    "filing_status",
    "num_dependents",
    "state_of_residence",
    "w2_income",
    "self_employment_income",
    "business_income_loss",
    "capital_gains_short",
    "capital_gains_long",
    "interest_income",
    "mortgage_interest",
    "salt_paid",
    "charitable_cash",
    "estimated_tax_payments",
    "withholding",
  ];

  const columns = mode === "financial_advisor" ? faColumns : acctColumns;

  return (
    <div className="space-y-6 animate-fade-in">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          dragging
            ? "border-accent bg-accent-dim"
            : "border-border hover:border-border-active"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={onFileChange}
          className="hidden"
        />
        <div className="space-y-3">
          <div className="w-14 h-14 mx-auto rounded-xl bg-surface flex items-center justify-center">
            <svg
              className="w-7 h-7 text-text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>
          {fileName ? (
            <p className="text-text font-medium">
              {fileName}
              {holdingsFileName && (
                <span className="text-text-secondary">
                  {" "}
                  + {holdingsFileName}
                </span>
              )}
            </p>
          ) : (
            <>
              <p className="text-text font-medium">
                Drop your {mode === "financial_advisor" ? "client book" : "tax data"} here
              </p>
              <p className="text-text-secondary text-sm">
                CSV or Excel (.xlsx) — {mode === "financial_advisor" ? "Client data + holdings" : "Client tax data"}
              </p>
            </>
          )}
          {parsing && (
            <p className="text-accent text-sm font-medium">Parsing...</p>
          )}
        </div>
      </div>

      {mode === "financial_advisor" && fileName && !holdingsFileName && (
        <div className="flex items-center gap-3">
          <input
            ref={holdingsRef}
            type="file"
            accept=".csv"
            onChange={onHoldingsChange}
            className="hidden"
          />
          <button
            onClick={() => holdingsRef.current?.click()}
            className="px-4 py-2 text-sm bg-surface border border-border rounded-lg hover:border-border-active text-text-secondary hover:text-text transition-all"
          >
            + Add separate holdings CSV (optional)
          </button>
          <span className="text-text-muted text-xs">
            Or include holdings as a second sheet in your Excel file
          </span>
        </div>
      )}

      {errors.length > 0 && (
        <div className="bg-danger-dim border border-danger/30 rounded-lg p-4 space-y-1">
          {errors.map((err, i) => (
            <p key={i} className="text-danger text-sm">
              {err}
            </p>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
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
          Load Demo Book ({mode === "financial_advisor" ? "8 FA clients" : "8 Acct clients"})
        </button>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4">
        <p className="text-text-secondary text-xs font-medium uppercase tracking-wider mb-3">
          Expected Columns
        </p>
        <div className="flex flex-wrap gap-1.5">
          {columns.map((col) => (
            <span
              key={col}
              className="px-2 py-1 bg-surface-hover rounded text-xs font-mono text-text-secondary"
            >
              {col}
            </span>
          ))}
          <span className="px-2 py-1 rounded text-xs text-text-muted">
            + optional fields...
          </span>
        </div>
      </div>
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
