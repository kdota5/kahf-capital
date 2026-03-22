"use client";

import type { ChatFileAttachmentState } from "@/lib/types";

const LABELS: Record<ChatFileAttachmentState["type"], string> = {
  pptx: "PowerPoint Presentation",
  xlsx: "Excel Workbook",
  pdf: "PDF Report",
};

const BG: Record<ChatFileAttachmentState["type"], string> = {
  pptx: "bg-red-500/10 border-red-500/20",
  xlsx: "bg-emerald-500/10 border-emerald-500/20",
  pdf: "bg-accent/10 border-accent/20",
};

export function ChatFileAttachment({
  file,
}: {
  file: ChatFileAttachmentState;
}) {
  const ext = file.type;
  const label = LABELS[ext];

  return (
    <div
      className={`flex items-center gap-4 rounded-xl border px-4 py-3 my-2 max-w-md ${BG[ext]}`}
    >
      <div className="text-2xl shrink-0" aria-hidden>
        {ext === "pptx" ? "📊" : ext === "xlsx" ? "📈" : "📄"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-text truncate">
          {file.name}.{ext}
        </div>
        <div className="text-[11px] text-text-muted mt-0.5">
          {file.generating ? (
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              Generating…
            </span>
          ) : file.error ? (
            <span className="text-danger">{file.error}</span>
          ) : (
            <span>{label}</span>
          )}
        </div>
      </div>
      {!file.generating && file.url && !file.error && (
        <a
          href={file.url}
          download={`${file.name}.${ext}`}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-heading font-bold hover:bg-accent/90 transition-colors"
        >
          Download
        </a>
      )}
    </div>
  );
}
