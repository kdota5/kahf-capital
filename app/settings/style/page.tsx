"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import type { SkillFile, SkillFileStore } from "@/lib/style-engine";
import {
  saveSkillFiles,
  loadSkillFiles,
  clearSkillFiles,
  exportSkillFiles,
  importSkillFiles,
} from "@/lib/style-engine";

const ACCEPTED_EXTENSIONS = ".pptx,.pdf,.xlsx,.xls,.docx,.txt,.md";
const SUPPORTED_LABEL = ".pptx, .pdf, .xlsx, .docx, .txt, .md";

const FILE_ICONS: Record<string, string> = {
  pptx: "P", pdf: "A", xlsx: "X", xls: "X",
  docx: "W", txt: "T", md: "M",
};

const FILE_COLORS: Record<string, string> = {
  pptx: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  pdf: "bg-red-500/15 text-red-400 border-red-500/20",
  xlsx: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  xls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  docx: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  txt: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  md: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
};

function getExt(name: string): string {
  return name.split(".").pop()?.toLowerCase() || "";
}

function truncateForStorage(text: string, maxWords = 15000): string {
  const normalized = text.replace(/\n{3,}/g, "\n\n").replace(/[ \t]+/g, " ").trim();
  const words = normalized.split(/\s+/);
  if (words.length <= maxWords) return normalized;
  return words.slice(0, maxWords).join(" ") + "\n\n[Truncated]";
}

export default function SkillFilesPage() {
  const [store, setStore] = useState<SkillFileStore | null>(null);
  const [firmName, setFirmName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = loadSkillFiles();
    if (stored) {
      setStore(stored);
      setFirmName(stored.firmName || "");
    }
  }, []);

  const files = store?.files || [];

  const addFile = useCallback(
    async (file: File) => {
      if (files.length >= 5) {
        setError("Maximum 5 skill files allowed");
        return;
      }
      setError(null);
      setParsing(true);

      try {
        const ext = getExt(file.name);
        let text: string;

        if (ext === "txt" || ext === "md") {
          text = await file.text();
        } else {
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch("/api/parse-document", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Parse failed");
          text = data.text;
        }

        const fullText = truncateForStorage(text);
        if (fullText.length < 50) {
          setError("Could not extract enough content from this file.");
          return;
        }

        const newFile: SkillFile = {
          id: crypto.randomUUID(),
          name: file.name,
          type: ext,
          fullText,
          wordCount: fullText.split(/\s+/).filter(Boolean).length,
          uploadedAt: new Date().toISOString(),
        };

        const updated: SkillFileStore = {
          firmName: firmName || store?.firmName || "",
          files: [...files, newFile],
          updatedAt: new Date().toISOString(),
        };

        setStore(updated);
        saveSkillFiles(updated);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : `Failed to parse. Supported: ${SUPPORTED_LABEL}`
        );
      } finally {
        setParsing(false);
      }
    },
    [files, firmName, store]
  );

  const removeFile = useCallback(
    (id: string) => {
      const updated: SkillFileStore = {
        firmName: firmName || store?.firmName || "",
        files: files.filter((f) => f.id !== id),
        updatedAt: new Date().toISOString(),
      };
      setStore(updated);
      saveSkillFiles(updated);
      if (expandedFile === id) setExpandedFile(null);
    },
    [files, firmName, store, expandedFile]
  );

  const handleFirmNameBlur = useCallback(() => {
    if (!store) return;
    const updated = { ...store, firmName, updatedAt: new Date().toISOString() };
    setStore(updated);
    saveSkillFiles(updated);
  }, [store, firmName]);

  const handleReset = useCallback(() => {
    clearSkillFiles();
    setStore(null);
    setFirmName("");
    setError(null);
    setExpandedFile(null);
  }, []);

  const handleExport = useCallback(() => {
    const json = exportSkillFiles();
    if (!json) return;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "conda-skill-files.json";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = importSkillFiles(text);
        if (imported) {
          setStore(imported);
          setFirmName(imported.firmName || "");
        } else {
          setError("Invalid skill file export");
        }
      } catch {
        setError("Failed to read file");
      }
      e.target.value = "";
    },
    []
  );

  const handleSave = useCallback(() => {
    if (!store) return;
    saveSkillFiles(store);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [store]);

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      {/* Header */}
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
            <span className="text-text-muted text-xs ml-1 hidden sm:inline">
              Skill Files
            </span>
          </div>
        </div>
        {files.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => importRef.current?.click()}
              className="px-3 py-1.5 text-xs text-text-muted hover:text-text border border-border rounded-lg hover:border-border-active transition-colors"
            >
              Import
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 text-xs text-text-muted hover:text-text border border-border rounded-lg hover:border-border-active transition-colors"
            >
              Export
            </button>
            <input
              ref={importRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        )}
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Title */}
        <div className="space-y-2">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">
            Skill Files
          </h1>
          <p className="text-text-secondary text-sm sm:text-base leading-relaxed">
            Upload sample documents your firm uses — proposals, decks, reports,
            worksheets. Conda reads them and builds from them when you ask it
            to create new deliverables.
          </p>
        </div>

        {error && (
          <div className="text-sm text-error bg-error/10 border border-error/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Firm name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text" htmlFor="firm-name">
            Firm Name (optional)
          </label>
          <input
            id="firm-name"
            type="text"
            value={firmName}
            onChange={(e) => setFirmName(e.target.value)}
            onBlur={handleFirmNameBlur}
            placeholder="e.g., Midtown Advisory Partners"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50"
          />
        </div>

        {/* Stored files list */}
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-text-muted">
                Uploaded Templates ({files.length})
              </h2>
              <span className="text-xs text-text-muted">
                {files.reduce((s, f) => s + f.wordCount, 0).toLocaleString()} total words in context
              </span>
            </div>
            {files.map((f) => {
              const ext = getExt(f.name);
              const isExpanded = expandedFile === f.id;
              return (
                <div
                  key={f.id}
                  className="bg-surface border border-border rounded-xl overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border ${FILE_COLORS[ext] || "bg-accent-dim text-accent border-accent/20"}`}
                    >
                      {FILE_ICONS[ext] || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text truncate">
                        {f.name}
                      </div>
                      <div className="text-xs text-text-muted">
                        {f.wordCount.toLocaleString()} words ·{" "}
                        {ext.toUpperCase()} ·{" "}
                        {new Date(f.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setExpandedFile(isExpanded ? null : f.id)
                      }
                      className="text-xs text-text-muted hover:text-text transition-colors px-2 py-1 rounded-lg hover:bg-bg"
                    >
                      {isExpanded ? "Hide" : "Preview"}
                    </button>
                    <button
                      onClick={() => removeFile(f.id)}
                      className="p-1.5 rounded-lg hover:bg-error/10 text-text-muted hover:text-error transition-colors shrink-0"
                      aria-label="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-border px-4 py-3 max-h-64 overflow-y-auto">
                      <pre className="text-xs text-text-secondary whitespace-pre-wrap font-mono leading-relaxed">
                        {f.fullText.slice(0, 3000)}
                        {f.fullText.length > 3000 && "\n\n..."}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Upload zone */}
        {files.length < 5 && (
          <div
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) void addFile(file);
            }}
            onDragOver={(e) => e.preventDefault()}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${parsing ? "border-accent/40 bg-accent/5" : "border-border hover:border-accent/40"}`}
            onClick={() => !parsing && fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void addFile(f);
                e.target.value = "";
              }}
            />
            {parsing ? (
              <div className="space-y-3">
                <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-text-muted">Extracting content...</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-accent-dim flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                </div>
                <p className="text-sm text-text-secondary mb-1">
                  Drop a file here or click to browse
                </p>
                <p className="text-xs text-text-muted">
                  Supports {SUPPORTED_LABEL} — max 5 files
                </p>
              </>
            )}
          </div>
        )}

        {/* Info callout */}
        <div className="bg-accent-dim/50 border border-accent/10 rounded-xl p-4 text-sm text-text-secondary leading-relaxed">
          <strong className="text-accent">How skill files work:</strong> The
          full text of each uploaded document is included in Conda&apos;s context.
          When you ask it to &quot;build a proposal&quot; or &quot;create a
          rebalancing deck,&quot; it references these files and replicates the
          structure, section order, and formatting with your client data.
        </div>

        {/* Actions */}
        {files.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-accent text-white font-heading font-bold text-sm rounded-xl hover:bg-accent/90 transition-colors flex items-center gap-2"
            >
              {saved ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Saved
                </>
              ) : (
                `Save ${files.length} Skill File${files.length !== 1 ? "s" : ""}`
              )}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm text-text-muted hover:text-error border border-border rounded-xl hover:border-error/30 transition-colors"
            >
              Clear All
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
