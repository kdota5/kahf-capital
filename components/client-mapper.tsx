"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ExtractedClientRef, ClientNameMap } from "@/lib/report-engine";
import { saveClientMap, loadClientMap } from "@/lib/client-map-store";

interface ClientMapperProps {
  extractedClients: ExtractedClientRef[];
  allClientIds: string[];
  onGenerate: (map: ClientNameMap) => void;
  onSkip: () => void;
  onBack: () => void;
}

export default function ClientMapper({
  extractedClients,
  allClientIds,
  onGenerate,
  onSkip,
  onBack,
}: ClientMapperProps) {
  const [nameMap, setNameMap] = useState<ClientNameMap>(() => {
    const stored = loadClientMap(allClientIds);
    return stored || {};
  });
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const stored = loadClientMap(allClientIds);
    if (stored) {
      setNameMap((prev) => ({ ...stored, ...prev }));
    }
  }, [allClientIds]);

  const updateName = useCallback(
    (clientId: string, name: string) => {
      setNameMap((prev) => {
        const next = { ...prev, [clientId]: name };
        saveClientMap(next, allClientIds);
        return next;
      });
    },
    [allClientIds]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent, index: number) => {
      const text = e.clipboardData?.getData("text");
      if (!text || !text.includes("\n")) return;

      e.preventDefault();
      const lines = text.trim().split("\n");
      const mappings = lines
        .map((line) => {
          const parts = line.split(/[\t,]/).map((s) => s.trim());
          if (parts.length >= 2) {
            return { id: parts[0], name: parts[1] };
          }
          return null;
        })
        .filter(Boolean) as { id: string; name: string }[];

      if (mappings.length > 0) {
        setNameMap((prev) => {
          const next = { ...prev };
          for (const m of mappings) {
            const matchingClient = extractedClients.find(
              (c) =>
                c.clientId === m.id ||
                c.clientId === m.id.replace(/^C/, "C-") ||
                c.clientId.replace("C-", "") === m.id.replace("C-", "")
            );
            if (matchingClient) {
              next[matchingClient.clientId] = m.name;
            }
          }
          saveClientMap(next, allClientIds);
          return next;
        });
      }
    },
    [extractedClients, allClientIds]
  );

  const handleCSVUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (!text) return;
        const lines = text.trim().split("\n");
        setNameMap((prev) => {
          const next = { ...prev };
          for (const line of lines) {
            const parts = line.split(/[\t,]/).map((s) => s.trim().replace(/^"|"$/g, ""));
            if (parts.length >= 2) {
              const id = parts[0];
              const name = parts[1];
              const match = extractedClients.find(
                (c) => c.clientId === id || c.clientId.replace("C-", "") === id.replace("C-", "")
              );
              if (match) {
                next[match.clientId] = name;
              }
            }
          }
          saveClientMap(next, allClientIds);
          return next;
        });
      };
      reader.readAsText(file);
    },
    [extractedClients, allClientIds]
  );

  const filledCount = extractedClients.filter(
    (c) => nameMap[c.clientId]?.trim()
  ).length;

  const csvRef = useRef<HTMLInputElement>(null);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="font-heading text-xl sm:text-2xl font-bold">
          Map Client Names
        </h2>
        <p className="text-text-secondary text-sm sm:text-base">
          We found{" "}
          <span className="text-accent font-mono font-bold">
            {extractedClients.length}
          </span>{" "}
          clients referenced in your conversation. Fill in their names to
          generate a personalized report.
        </p>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 bg-accent-dim border border-accent/20 rounded-xl text-sm">
        <svg
          className="w-4 h-4 text-accent shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
        <span className="text-text-secondary">
          Names stay on your device — never sent to AI.
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-hover">
              <th className="px-3 sm:px-4 py-3 text-left text-text-muted text-xs font-medium uppercase tracking-wider">
                Client ID
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-text-muted text-xs font-medium uppercase tracking-wider hidden sm:table-cell">
                Mentions
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-text-muted text-xs font-medium uppercase tracking-wider hidden md:table-cell">
                Context
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-text-muted text-xs font-medium uppercase tracking-wider">
                Client Name
              </th>
            </tr>
          </thead>
          <tbody>
            {extractedClients.map((client, idx) => (
              <tr
                key={client.clientId}
                className="border-t border-border hover:bg-surface/50 transition-colors"
              >
                <td className="px-3 sm:px-4 py-3 font-mono text-accent font-medium whitespace-nowrap">
                  {client.clientId}
                </td>
                <td className="px-3 sm:px-4 py-3 text-text-secondary hidden sm:table-cell">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface rounded-full text-xs font-mono">
                    {client.mentionCount}x
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-3 text-text-muted text-xs max-w-[200px] truncate hidden md:table-cell">
                  {client.firstMentionContext}
                </td>
                <td className="px-3 sm:px-4 py-3">
                  <input
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    value={nameMap[client.clientId] || ""}
                    onChange={(e) =>
                      updateName(client.clientId, e.target.value)
                    }
                    onPaste={(e) => handlePaste(e, idx)}
                    onKeyDown={(e) => {
                      if (e.key === "Tab" && !e.shiftKey) {
                        if (idx < extractedClients.length - 1) {
                          e.preventDefault();
                          inputRefs.current[idx + 1]?.focus();
                        }
                      }
                    }}
                    placeholder="Enter name..."
                    className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 text-sm">
        <input
          ref={csvRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleCSVUpload}
          className="hidden"
        />
        <button
          onClick={() => csvRef.current?.click()}
          className="px-4 py-2.5 bg-surface border border-border rounded-lg hover:border-border-active text-text-secondary hover:text-text transition-all"
        >
          Upload CSV Mapping
        </button>
        <div className="flex-1" />
        <span className="text-text-muted text-xs text-center sm:text-left">
          {filledCount}/{extractedClients.length} mapped
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-2">
        <button
          onClick={onBack}
          className="px-5 py-2.5 text-sm bg-surface border border-border rounded-lg hover:border-border-active text-text-secondary hover:text-text transition-all"
        >
          Back to Chat
        </button>
        <button
          onClick={onSkip}
          className="px-5 py-2.5 text-sm bg-surface border border-border rounded-lg hover:border-border-active text-text-secondary hover:text-text transition-all"
        >
          Skip — Keep Client IDs
        </button>
        <div className="flex-1" />
        <button
          onClick={() => onGenerate(nameMap)}
          className="px-6 py-2.5 text-sm font-heading font-bold bg-accent text-white rounded-lg hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all"
        >
          Generate Report
        </button>
      </div>
    </div>
  );
}
