import type { ClientNameMap } from "./report-engine";

/**
 * Replace Client IDs in generated file payloads with "Name (ID)" for deliverables.
 * Used only in /api/generate-file — never in /api/chat.
 */
export function applyClientMapToToolInput<T>(
  input: T,
  clientMap: ClientNameMap | Record<string, string> | null | undefined
): T {
  if (!clientMap || Object.keys(clientMap).length === 0) return input;
  let str = JSON.stringify(input);
  for (const [id, name] of Object.entries(clientMap)) {
    if (!name) continue;
    const rep = `${name} (${id})`;
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    str = str.replace(new RegExp(escaped, "g"), rep);
  }
  return JSON.parse(str) as T;
}
