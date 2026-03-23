/**
 * Skill File Store
 *
 * Uploaded documents (PPTX, PDF, XLSX, DOCX, TXT) are stored as "skill files."
 * Their full extracted text is injected into the system prompt so Claude can
 * reference the actual structure, sections, layout, and content when the
 * advisor asks it to build a new deck, spreadsheet, or report.
 *
 * These are templates to build from — not style analysis inputs.
 */

export interface SkillFile {
  id: string;
  name: string;
  type: string;
  fullText: string;
  wordCount: number;
  uploadedAt: string;
}

export interface SkillFileStore {
  firmName: string;
  files: SkillFile[];
  updatedAt: string;
}

const STORAGE_KEY = "conda_skill_files";
const BANNER_DISMISSED_KEY = "conda_skill_banner_dismissed";
const MAX_WORDS_PER_FILE = 8000;

export function saveSkillFiles(store: SkillFileStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage may be full
  }
}

export function loadSkillFiles(): SkillFileStore | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSkillFiles(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function exportSkillFiles(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function importSkillFiles(json: string): SkillFileStore | null {
  try {
    const store = JSON.parse(json) as SkillFileStore;
    if (!store.files?.length) return null;
    saveSkillFiles(store);
    return store;
  } catch {
    return null;
  }
}

export function isBannerDismissed(): boolean {
  try {
    return localStorage.getItem(BANNER_DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

export function dismissBanner(): void {
  try {
    localStorage.setItem(BANNER_DISMISSED_KEY, "true");
  } catch {
    // ignore
  }
}

function truncateForPrompt(text: string): string {
  const words = text.split(/\s+/);
  if (words.length <= MAX_WORDS_PER_FILE) return text;
  return (
    words.slice(0, MAX_WORDS_PER_FILE).join(" ") +
    `\n\n[... truncated from ${words.length} words]`
  );
}

/**
 * Build the skill file injection block for the system prompt.
 * Includes the full extracted text of each uploaded document so
 * Claude can reference exact structure, sections, and content
 * when generating new deliverables.
 */
export function getSkillFileInjection(): string {
  if (typeof window === "undefined") return "";

  const store = loadSkillFiles();
  if (!store?.files?.length) return "";

  const fileBlocks = store.files
    .map((f, i) => {
      const truncated = truncateForPrompt(f.fullText);
      return `### SKILL FILE ${i + 1}: ${f.name} (${f.type.toUpperCase()}, ~${f.wordCount.toLocaleString()} words)

\`\`\`
${truncated}
\`\`\``;
    })
    .join("\n\n");

  return `

## SKILL FILES — DOCUMENT TEMPLATES

The advisor has uploaded ${store.files.length} sample document${store.files.length !== 1 ? "s" : ""} from their firm${store.firmName ? ` (${store.firmName})` : ""}. These are real examples of the firm's work — proposals, reports, decks, worksheets.

**How to use these:**
- When the advisor asks you to create a deliverable (deck, spreadsheet, report, proposal), study the relevant skill file below and replicate its structure, section order, formatting patterns, and tone.
- If multiple skill files could apply, ask the advisor which one to use as the base: "I see you have [Skill File 1] and [Skill File 2]. Which should I base this on?"
- Match the section headings, slide order, column layouts, disclaimer text, and overall organization from the skill file — adapt the content to the new client data.
- These are templates to build from. The advisor expects output that looks like their firm produced it.

${fileBlocks}
`;
}

// Legacy aliases for backward compatibility with review page imports
export const loadStyleProfile = loadSkillFiles;
export const isStyleBannerDismissed = isBannerDismissed;
export const dismissStyleBanner = dismissBanner;
