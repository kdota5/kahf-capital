import type { ClientNameMap } from "./report-engine";
import type { ClientDirectory, ClientDirectoryEntry } from "./types";

const DIRECTORY_KEY = "conda_client_directory";

export function buildMapFromDirectory(directory: ClientDirectory): ClientNameMap {
  const map: ClientNameMap = {};
  for (const entry of directory.entries) {
    if (entry.client_id && entry.full_name) {
      map[entry.client_id] = entry.full_name;
    }
  }
  return map;
}

export function buildFullMapFromDirectory(
  directory: ClientDirectory
): Record<string, ClientDirectoryEntry> {
  const map: Record<string, ClientDirectoryEntry> = {};
  for (const entry of directory.entries) {
    if (entry.client_id) {
      map[entry.client_id] = entry;
    }
  }
  return map;
}

export function persistDirectory(directory: ClientDirectory): void {
  try {
    localStorage.setItem(DIRECTORY_KEY, JSON.stringify(directory));
  } catch {
    // localStorage may be full or unavailable
  }
}

export function loadPersistedDirectory(): ClientDirectory | null {
  try {
    const raw = localStorage.getItem(DIRECTORY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPersistedDirectory(): void {
  try {
    localStorage.removeItem(DIRECTORY_KEY);
  } catch {
    // noop
  }
}
