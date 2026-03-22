import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  STYLE_ANALYSIS_SYSTEM_PROMPT,
  buildStyleAnalysisUserPrompt,
} from "@/lib/style-analysis-prompt";

export const maxDuration = 120;

const anthropic = new Anthropic();

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

const PII_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
];

export async function POST(req: NextRequest) {
  const { documentTexts, firmName } = (await req.json()) as {
    documentTexts: string[];
    firmName?: string;
  };

  if (!documentTexts?.length || documentTexts.length > 3) {
    return NextResponse.json(
      { error: "Provide 1-3 document samples" },
      { status: 400 }
    );
  }

  for (const text of documentTexts) {
    for (const pattern of PII_PATTERNS) {
      if (pattern.test(text)) {
        return NextResponse.json(
          {
            error:
              "PII detected in sample document. Please anonymize client names, SSNs, and contact info before uploading.",
          },
          { status: 400 }
        );
      }
    }
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: STYLE_ANALYSIS_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildStyleAnalysisUserPrompt(documentTexts),
        },
      ],
    });

    const responseText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const clean = responseText.replace(/```json\n?|```\n?/g, "").trim();
    const profile = JSON.parse(clean);

    return NextResponse.json({
      profile: {
        ...profile,
        id: crypto.randomUUID(),
        firmName: firmName || "My Firm",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        samplesUsed: documentTexts.length,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to parse style analysis: ${msg}` },
      { status: 500 }
    );
  }
}
