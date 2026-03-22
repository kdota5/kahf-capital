"use client";

import { useState, useRef, useCallback } from "react";

interface UploadedDoc {
  name: string;
  text: string;
  size: number;
  type: string;
}

interface StyleUploaderProps {
  onAnalyze: (docs: UploadedDoc[], firmName: string) => void;
  analyzing: boolean;
}

const ACCEPTED_EXTENSIONS = ".pptx,.pdf,.xlsx,.xls,.docx,.txt,.md";
const SUPPORTED_LABEL = ".pptx, .pdf, .xlsx, .docx, .txt, .md";

const FILE_ICONS: Record<string, string> = {
  pptx: "P",
  pdf: "A",
  xlsx: "X",
  xls: "X",
  docx: "W",
  txt: "T",
  md: "M",
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

function truncateText(text: string, maxWords = 15000): string {
  const normalized = text
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
  const words = normalized.split(/\s+/);
  if (words.length <= maxWords) return normalized;
  return (
    words.slice(0, maxWords).join(" ") +
    "\n\n[Truncated — original had " +
    words.length +
    " words]"
  );
}

export default function StyleUploader({
  onAnalyze,
  analyzing,
}: StyleUploaderProps) {
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [firmName, setFirmName] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFile = useCallback(
    async (file: File) => {
      if (docs.length >= 3) {
        setError("Maximum 3 documents allowed");
        return;
      }
      setError(null);
      setParsing(true);

      try {
        const ext = getExt(file.name);

        if (ext === "txt" || ext === "md") {
          const raw = await file.text();
          const text = truncateText(raw);
          if (text.length < 50) {
            setError("Document appears too short to analyze.");
            return;
          }
          setDocs((prev) => [
            ...prev,
            { name: file.name, text, size: file.size, type: ext },
          ]);
          return;
        }

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/parse-document", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Parse failed");

        const text = truncateText(data.text);
        if (text.length < 50) {
          setError(
            "Could not extract enough text from this document. Try a different file."
          );
          return;
        }

        setDocs((prev) => [
          ...prev,
          { name: file.name, text, size: file.size, type: ext },
        ]);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : `Failed to parse document. Supported: ${SUPPORTED_LABEL}`
        );
      } finally {
        setParsing(false);
      }
    },
    [docs.length]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) void addFile(file);
    },
    [addFile]
  );

  const handlePasteSubmit = useCallback(() => {
    if (!pasteText.trim()) return;
    if (docs.length >= 3) {
      setError("Maximum 3 documents allowed");
      return;
    }
    const text = truncateText(pasteText.trim());
    if (text.length < 50) {
      setError("Pasted content is too short to analyze.");
      return;
    }
    setDocs((prev) => [
      ...prev,
      {
        name: `Pasted Document ${prev.length + 1}`,
        text,
        size: text.length,
        type: "txt",
      },
    ]);
    setPasteText("");
    setShowPaste(false);
    setError(null);
  }, [pasteText, docs.length]);

  const removeDoc = useCallback((index: number) => {
    setDocs((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }, []);

  const handleSubmit = () => {
    if (docs.length === 0) return;
    onAnalyze(docs, firmName.trim() || "My Firm");
  };

  return (
    <div className="space-y-6">
      {/* Anonymization warning */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-sm text-yellow-300 leading-relaxed">
        <strong className="text-yellow-200">Before uploading:</strong> Remove all
        client names, SSNs, addresses, and contact information from your samples.
        Replace client names with &quot;[Client]&quot; or &quot;the client.&quot; These documents
        will be sent to the AI for style analysis only.
      </div>

      {/* Uploaded docs list */}
      {docs.length > 0 && (
        <div className="space-y-2">
          {docs.map((doc, i) => {
            const ext = getExt(doc.name);
            return (
              <div
                key={i}
                className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border ${FILE_COLORS[ext] || "bg-accent-dim text-accent border-accent/20"}`}
                >
                  {FILE_ICONS[ext] || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text truncate">
                    {doc.name}
                  </div>
                  <div className="text-xs text-text-muted">
                    {doc.text.split(/\s+/).length.toLocaleString()} words ·{" "}
                    {ext.toUpperCase()}
                  </div>
                </div>
                <details className="group relative">
                  <summary className="text-xs text-text-muted hover:text-text cursor-pointer transition-colors">
                    Preview
                  </summary>
                  <div className="absolute right-0 mt-2 w-80 max-h-40 overflow-y-auto p-3 rounded-lg border border-border bg-bg text-xs text-text-secondary z-10 whitespace-pre-wrap">
                    {doc.text.slice(0, 500)}
                    {doc.text.length > 500 && "..."}
                  </div>
                </details>
                <button
                  onClick={() => removeDoc(i)}
                  className="p-1.5 rounded-lg hover:bg-error/10 text-text-muted hover:text-error transition-colors shrink-0"
                  aria-label="Remove"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload zone */}
      {docs.length < 3 && (
        <div
          onDrop={handleDrop}
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
              <p className="text-sm text-text-muted">Extracting text...</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl bg-accent-dim flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                  />
                </svg>
              </div>
              <p className="text-sm text-text-secondary mb-1">
                Drop a document here or click to browse
              </p>
              <p className="text-xs text-text-muted">
                Supports {SUPPORTED_LABEL} — max 3 documents
              </p>
            </>
          )}
        </div>
      )}

      {/* Paste option */}
      <div className="text-center">
        <button
          onClick={() => setShowPaste((v) => !v)}
          className="text-xs text-text-muted hover:text-accent transition-colors underline underline-offset-2"
        >
          {showPaste ? "Hide paste option" : "Or paste document text directly"}
        </button>
      </div>
      {showPaste && (
        <div className="space-y-2">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste your document content here..."
            className="w-full h-40 px-4 py-3 rounded-xl border border-border bg-bg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50 resize-none"
          />
          <button
            onClick={handlePasteSubmit}
            disabled={!pasteText.trim()}
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium text-text hover:border-accent/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add Pasted Document
          </button>
        </div>
      )}

      {error && (
        <div className="text-sm text-error bg-error/10 border border-error/20 rounded-lg px-4 py-2.5">
          {error}
        </div>
      )}

      {/* Firm name */}
      <div className="space-y-2">
        <label
          className="text-sm font-medium text-text"
          htmlFor="firm-name-input"
        >
          Firm Name
        </label>
        <input
          id="firm-name-input"
          type="text"
          value={firmName}
          onChange={(e) => setFirmName(e.target.value)}
          placeholder="e.g., Midtown Advisory Partners"
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50"
        />
      </div>

      {/* Analyze button */}
      <button
        onClick={handleSubmit}
        disabled={docs.length === 0 || analyzing || parsing}
        className="w-full py-3 bg-accent text-white font-heading font-bold text-sm rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {analyzing ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Analyzing writing style...
          </>
        ) : (
          <>
            Analyze Writing Style ({docs.length} document
            {docs.length !== 1 ? "s" : ""})
          </>
        )}
      </button>
    </div>
  );
}
