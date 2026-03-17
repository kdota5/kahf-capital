import type { ClientNameMap } from "./report-engine";

const STORAGE_KEY = "kahf_client_mappings";

interface StoredClientMap {
  mappings: ClientNameMap;
  lastUpdated: string;
  bookHash: string;
}

function hashClientIds(ids: string[]): string {
  return ids.slice().sort().join(",");
}

export function saveClientMap(
  map: ClientNameMap,
  clientIds: string[]
): void {
  try {
    const stored: StoredClientMap = {
      mappings: map,
      lastUpdated: new Date().toISOString(),
      bookHash: hashClientIds(clientIds),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // localStorage may be full or unavailable
  }
}

export function loadClientMap(clientIds: string[]): ClientNameMap | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored: StoredClientMap = JSON.parse(raw);
    const applicable: ClientNameMap = {};
    for (const id of clientIds) {
      if (stored.mappings[id]) {
        applicable[id] = stored.mappings[id];
      }
    }
    return Object.keys(applicable).length > 0 ? applicable : null;
  } catch {
    return null;
  }
}

export function clearClientMap(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}
