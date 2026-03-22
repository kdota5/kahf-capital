import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { STYLE_REGENERATE_SYSTEM_PROMPT } from "@/lib/style-analysis-prompt";

export const maxDuration = 60;

const anthropic = new Anthropic();
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

export async function POST(req: NextRequest) {
  const { profile } = (await req.json()) as { profile: unknown };

  if (!profile) {
    return NextResponse.json(
      { error: "Profile data required" },
      { status: 400 }
    );
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: STYLE_REGENERATE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Rewrite the style guide prompt fragment based on this updated profile:\n\n${JSON.stringify(profile, null, 2)}`,
        },
      ],
    });

    const promptFragment = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    return NextResponse.json({ promptFragment });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to regenerate: ${msg}` },
      { status: 500 }
    );
  }
}
