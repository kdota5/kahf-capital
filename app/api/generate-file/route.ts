import { NextRequest, NextResponse } from "next/server";
import { applyClientMapToToolInput } from "@/lib/apply-client-map";
import { generatePPTX } from "@/lib/file-generators/pptx-generator";
import { generateXLSX } from "@/lib/file-generators/xlsx-generator";
import { generatePDF } from "@/lib/file-generators/pdf-generator";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tool_name,
      tool_input,
      client_map,
    }: {
      tool_name: string;
      tool_input: Record<string, unknown>;
      client_map?: Record<string, string>;
    } = body;

    if (!tool_name || !tool_input) {
      return NextResponse.json(
        { error: "Missing tool_name or tool_input" },
        { status: 400 }
      );
    }

    const processed = applyClientMapToToolInput(tool_input, client_map);

    switch (tool_name) {
      case "generate_pptx": {
        const buf = await generatePPTX(processed as Record<string, unknown>);
        const title = String((processed as { title?: string }).title || "presentation")
          .replace(/[^\w\- ]+/g, "")
          .slice(0, 80);
        return new NextResponse(new Uint8Array(buf), {
          status: 200,
          headers: {
            "Content-Type":
              "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "Content-Disposition": `attachment; filename="${title}.pptx"`,
          },
        });
      }
      case "generate_xlsx": {
        const buf = await generateXLSX(processed as Record<string, unknown>);
        const fn = String((processed as { filename?: string }).filename || "workbook").replace(
          /[^\w\- ]+/g,
          ""
        );
        return new NextResponse(new Uint8Array(buf), {
          status: 200,
          headers: {
            "Content-Type":
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${fn}.xlsx"`,
          },
        });
      }
      case "generate_pdf": {
        const buf = await generatePDF(processed as Record<string, unknown>);
        const title = String((processed as { title?: string }).title || "report")
          .replace(/[^\w\- ]+/g, "")
          .slice(0, 80);
        return new NextResponse(new Uint8Array(buf), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${title}.pdf"`,
          },
        });
      }
      default:
        return NextResponse.json({ error: "Unknown tool" }, { status: 400 });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
