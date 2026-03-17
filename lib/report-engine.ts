import type { ChatMessage } from "./types";

export interface ExtractedClientRef {
  clientId: string;
  mentionCount: number;
  firstMentionContext: string;
  appearsInAssistantMessages: boolean;
}

export interface ClientNameMap {
  [clientId: string]: string;
}

export interface ReportSection {
  title: string;
  content: string;
  clientIdsReferenced: string[];
}

const CLIENT_ID_PATTERN = /\bC-\d{3,5}\b/g;
const NOISE_MESSAGES = /^(thanks|thank you|ok|okay|got it|great|perfect|cool|nice|understood|yep|yes|no|sure)[\s.!]*$/i;

function extractSnippet(text: string, id: string, radius: number = 60): string {
  const idx = text.indexOf(id);
  if (idx === -1) return "";
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + id.length + radius);
  let snippet = text.slice(start, end).replace(/\n/g, " ").trim();
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";
  return snippet;
}

export function extractClientReferences(
  messages: ChatMessage[]
): ExtractedClientRef[] {
  const refMap: Map<
    string,
    { count: number; firstContext: string; inAssistant: boolean }
  > = new Map();
  const orderSeen: string[] = [];

  for (const msg of messages) {
    const matches = msg.content.match(CLIENT_ID_PATTERN);
    if (!matches) continue;
    for (const id of matches) {
      const existing = refMap.get(id);
      if (existing) {
        existing.count++;
        if (msg.role === "assistant") existing.inAssistant = true;
      } else {
        refMap.set(id, {
          count: 1,
          firstContext: extractSnippet(msg.content, id),
          inAssistant: msg.role === "assistant",
        });
        orderSeen.push(id);
      }
    }
  }

  return orderSeen
    .map((id) => {
      const data = refMap.get(id)!;
      return {
        clientId: id,
        mentionCount: data.count,
        firstMentionContext: data.firstContext,
        appearsInAssistantMessages: data.inAssistant,
      };
    })
    .sort((a, b) => b.mentionCount - a.mentionCount);
}

export function countReferencedClients(messages: ChatMessage[]): number {
  const ids = new Set<string>();
  for (const msg of messages) {
    const matches = msg.content.match(CLIENT_ID_PATTERN);
    if (matches) {
      for (const id of matches) ids.add(id);
    }
  }
  return ids.size;
}

function deriveTitle(question: string): string {
  const q = question.trim().replace(/[?.!]+$/, "").trim();

  const patterns: [RegExp, string][] = [
    [/roth\s*conversion/i, "Roth Conversion Analysis"],
    [/concentration\s*(risk)?/i, "Concentration Risk"],
    [/tax[\s-]*loss\s*harvest/i, "Tax-Loss Harvesting Opportunities"],
    [/asset\s*location/i, "Asset Location Optimization"],
    [/risk\s*(tolerance|mismatch|profile)/i, "Risk Profile Analysis"],
    [/retirement/i, "Retirement Readiness"],
    [/international/i, "International Allocation"],
    [/overweight|underweight/i, "Portfolio Allocation Analysis"],
    [/tax\s*drag/i, "Tax Drag Analysis"],
    [/fixed\s*income|bond/i, "Fixed Income Positioning"],
    [/amt/i, "Alternative Minimum Tax (AMT) Risk"],
    [/itemiz|standard\s*deduction/i, "Itemized vs. Standard Deduction"],
    [/estimated\s*tax|underpay/i, "Estimated Tax Payment Analysis"],
    [/199a|qbi/i, "Section 199A QBI Deduction"],
    [/charitab|bunch|daf/i, "Charitable Giving Strategy"],
    [/effective\s*tax\s*rate/i, "Effective Tax Rate Analysis"],
    [/state\s*residen/i, "State Residency & Filing"],
    [/capital\s*gain/i, "Capital Gains Analysis"],
    [/tell\s*me\s*about\s*(C-\d+)/i, "Client Deep Dive"],
    [/overview|summary/i, "Client Overview"],
  ];

  for (const [pattern, title] of patterns) {
    if (pattern.test(q)) return title;
  }

  const maxLen = 50;
  let title = q.replace(/^(which|who|what|show me|flag|rank|list|give me|tell me)\s*/i, "");
  title = title.charAt(0).toUpperCase() + title.slice(1);
  if (title.length > maxLen) title = title.slice(0, maxLen) + "...";
  return title || "Analysis";
}

function isFollowUp(question: string): boolean {
  const followUpPatterns = [
    /^(what about|and what|how about|can you|could you|also|tell me more|elaborate|expand|dig deeper|drill down|go deeper)/i,
    /^(for those|for the ones|the ones you|for each|for them|those clients|regarding)/i,
    /^(what would|what if|what's the|walk me through)/i,
  ];
  return followUpPatterns.some((p) => p.test(question.trim()));
}

function extractIdsFromText(text: string): string[] {
  const matches = text.match(CLIENT_ID_PATTERN);
  if (!matches) return [];
  return Array.from(new Set(matches));
}

export function applyNameMapping(
  text: string,
  clientMap: ClientNameMap
): string {
  let result = text;
  const sortedIds = Object.keys(clientMap).sort(
    (a, b) => b.length - a.length
  );
  for (const id of sortedIds) {
    const name = clientMap[id];
    if (!name) continue;
    const regex = new RegExp(`\\b${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
    result = result.replace(regex, `${name} (${id})`);
  }
  return result;
}

export function buildReportContent(
  messages: ChatMessage[],
  clientMap: ClientNameMap
): ReportSection[] {
  const sections: ReportSection[] = [];
  let i = 0;

  while (i < messages.length) {
    const msg = messages[i];

    if (msg.role === "user") {
      if (NOISE_MESSAGES.test(msg.content)) {
        i++;
        continue;
      }

      const assistantResponses: string[] = [];
      let j = i + 1;

      while (j < messages.length && messages[j].role === "assistant") {
        assistantResponses.push(messages[j].content);
        j++;
      }

      while (
        j < messages.length &&
        messages[j].role === "user" &&
        isFollowUp(messages[j].content)
      ) {
        j++;
        while (j < messages.length && messages[j].role === "assistant") {
          assistantResponses.push(messages[j].content);
          j++;
        }
      }

      if (assistantResponses.length > 0) {
        const combinedContent = assistantResponses.join("\n\n---\n\n");
        const mappedContent = applyNameMapping(combinedContent, clientMap);

        sections.push({
          title: deriveTitle(msg.content),
          content: mappedContent,
          clientIdsReferenced: extractIdsFromText(combinedContent),
        });
      }

      i = j;
    } else {
      i++;
    }
  }

  return sections;
}
