import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 120;

const anthropic = new Anthropic();
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

const SAMPLE_SCENARIO = `Client C-1001 has a $1.2M portfolio that is 42% concentrated in mega-cap technology stocks. Their stated risk tolerance is Moderate with a 10+ year time horizon. They have $180,000 in unrealized long-term gains and $23,000 in short-term losses. Their federal tax bracket is 37%.

Write a brief analysis (3-4 paragraphs) covering the key findings and recommendations for this client.`;

export async function POST(req: NextRequest) {
  const { styleFragment } = (await req.json()) as {
    styleFragment: string;
  };

  if (!styleFragment) {
    return NextResponse.json(
      { error: "Style fragment required" },
      { status: 400 }
    );
  }

  try {
    const [defaultRes, styledRes] = await Promise.all([
      anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system:
          "You are a financial analyst. Provide clear, professional analysis.",
        messages: [{ role: "user", content: SAMPLE_SCENARIO }],
      }),
      anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: `You are a financial analyst writing for a specific firm. Follow this style guide precisely:\n\n${styleFragment}`,
        messages: [{ role: "user", content: SAMPLE_SCENARIO }],
      }),
    ]);

    const defaultText = defaultRes.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const styledText = styledRes.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    return NextResponse.json({ defaultText, styledText });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Comparison failed: ${msg}` },
      { status: 500 }
    );
  }
}
