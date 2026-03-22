import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { FILE_GENERATION_TOOLS } from "@/lib/tools";

export const maxDuration = 120;

const anthropic = new Anthropic();

const MODEL =
  process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

const PII_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages, systemPrompt, enableFileTools } = body as {
    messages: { role: string; content: string }[];
    systemPrompt: string;
    enableFileTools?: boolean;
  };

  if (!systemPrompt || !messages) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  for (const pattern of PII_PATTERNS) {
    if (pattern.test(systemPrompt)) {
      return new Response(
        JSON.stringify({
          error:
            "PII detected in system prompt. Please remove personal identifiers.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  const apiMessages = messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  try {
    // Non-streaming JSON response with tool use (file generation)
    if (enableFileTools) {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 8192,
        system: systemPrompt,
        messages: apiMessages,
        tools: FILE_GENERATION_TOOLS,
      });

      let text = "";
      const tool_calls: Array<{ id: string; name: string; input: unknown }> =
        [];

      for (const block of response.content) {
        if (block.type === "text") {
          text += block.text;
        } else if (block.type === "tool_use") {
          tool_calls.push({
            id: block.id,
            name: block.name,
            input: block.input,
          });
        }
      }

      return new Response(
        JSON.stringify({
          text,
          tool_calls,
          usage: response.usage
            ? {
                input_tokens: response.usage.input_tokens,
                output_tokens: response.usage.output_tokens,
              }
            : undefined,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Streaming (initial scan & legacy)
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: apiMessages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
                )
              );
            }
          }

          const finalMessage = await stream.finalMessage();
          if (finalMessage.usage) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  usage: {
                    input_tokens: finalMessage.usage.input_tokens,
                    output_tokens: finalMessage.usage.output_tokens,
                  },
                })}\n\n`
              )
            );
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : "Stream error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to connect to AI";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
