export interface FirmStyleProfile {
  id: string;
  firmName: string;
  createdAt: string;
  updatedAt: string;
  samplesUsed: number;

  structure: {
    sectionOrder: string[];
    executiveSummaryStyle: string;
    sectionTransitions: string;
    conclusionStyle: string;
    typicalSectionCount: number;
    usesNumberedSections: boolean;
    usesAppendices: boolean;
  };

  tone: {
    formality: "formal" | "professional_conversational" | "conversational";
    personPronouns: string;
    technicalDepth: "simplified" | "moderate" | "technical";
    confidenceStyle: string;
    clientRelationship: string;
  };

  formatting: {
    dataPresentation: string;
    numberFormat: string;
    usesCharts: boolean;
    chartStyle: string;
    usesBulletPoints: boolean;
    bulletStyle: string;
    tableStyle: string;
  };

  vocabulary: {
    preferredTerms: Record<string, string>;
    avoidedTerms: string[];
    signaturePhrases: string[];
    jargonLevel: string;
  };

  compliance: {
    requiredDisclaimers: string[];
    performanceDisclosure: string;
    complianceNotes: string;
  };

  promptFragment: string;
}

const STORAGE_KEY = "conda_firm_style";
const BANNER_DISMISSED_KEY = "conda_style_banner_dismissed";

export function saveStyleProfile(profile: FirmStyleProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // localStorage may be full or unavailable
  }
}

export function loadStyleProfile(): FirmStyleProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearStyleProfile(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function exportStyleProfile(): string | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw;
}

export function importStyleProfile(json: string): FirmStyleProfile | null {
  try {
    const profile = JSON.parse(json) as FirmStyleProfile;
    if (!profile.id || !profile.promptFragment) return null;
    saveStyleProfile(profile);
    return profile;
  } catch {
    return null;
  }
}

export function isStyleBannerDismissed(): boolean {
  try {
    return localStorage.getItem(BANNER_DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

export function dismissStyleBanner(): void {
  try {
    localStorage.setItem(BANNER_DISMISSED_KEY, "true");
  } catch {
    // ignore
  }
}

/**
 * Build the style injection fragment for the system prompt.
 * Returns empty string if no style profile is configured.
 */
export function getStylePromptInjection(): string {
  if (typeof window === "undefined") return "";

  const profile = loadStyleProfile();
  if (!profile?.promptFragment) return "";

  const preferredTermLines = Object.entries(profile.vocabulary.preferredTerms || {})
    .map(([k, v]) => `- Use "${v}" instead of "${k}"`)
    .join("\n");

  return `

## FIRM WRITING STYLE — MANDATORY

The advisor's firm has a specific writing style that ALL generated content must follow. This includes chat responses, proposals, reports, presentation text, and any other written output.

${profile.promptFragment}

### Structural requirements:
- Section order: ${profile.structure.sectionOrder.join(" → ")}
- Executive summaries: ${profile.structure.executiveSummaryStyle}
- Transitions: ${profile.structure.sectionTransitions}
- Conclusions: ${profile.structure.conclusionStyle}
${profile.structure.usesAppendices ? "- Include appendices for detailed data when appropriate" : "- Do not use appendices — keep everything in the main body"}

### Tone:
- Formality: ${profile.tone.formality}
- Pronouns: ${profile.tone.personPronouns}
- Technical depth: ${profile.tone.technicalDepth}
- Confidence: ${profile.tone.confidenceStyle}

### Formatting:
- Data presentation: ${profile.formatting.dataPresentation}
- Number format: ${profile.formatting.numberFormat}
${profile.formatting.usesBulletPoints ? `- Bullets: ${profile.formatting.bulletStyle}` : "- Do not use bullet points — write in prose paragraphs"}
- Tables: ${profile.formatting.tableStyle}

### Vocabulary:
${preferredTermLines}
- Avoid: ${(profile.vocabulary.avoidedTerms || []).join(", ")}
${(profile.vocabulary.signaturePhrases || []).length > 0 ? `- Incorporate naturally: ${profile.vocabulary.signaturePhrases.map((p) => `"${p}"`).join(", ")}` : ""}

### Required disclaimers:
${(profile.compliance.requiredDisclaimers || []).map((d) => `- "${d}"`).join("\n")}
${profile.compliance.performanceDisclosure ? `- Forward-looking statements: ${profile.compliance.performanceDisclosure}` : ""}
`;
}
