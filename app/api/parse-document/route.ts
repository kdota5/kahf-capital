import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

/**
 * Extract text from uploaded documents.
 * Accepts PDF, PPTX, XLSX, DOCX, TXT, MD via FormData.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const name = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (name.endsWith(".pdf")) {
      text = await extractPdfText(buffer);
    } else if (name.endsWith(".pptx")) {
      text = await extractPptxText(buffer);
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      text = await extractXlsxText(buffer);
    } else if (name.endsWith(".docx")) {
      text = await extractDocxText(buffer);
    } else if (name.endsWith(".txt") || name.endsWith(".md")) {
      text = buffer.toString("utf-8");
    } else {
      return NextResponse.json(
        { error: `Unsupported file type: ${name.split(".").pop()}` },
        { status: 400 }
      );
    }

    const normalized = text
      .replace(/\r\n/g, "\n")
      .replace(/\n{4,}/g, "\n\n\n")
      .replace(/[ \t]+/g, " ")
      .trim();

    return NextResponse.json({
      text: normalized,
      wordCount: normalized.split(/\s+/).filter(Boolean).length,
      fileName: file.name,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Parse failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
  const data = await pdfParse(buffer);
  return data.text;
}

async function extractPptxText(buffer: Buffer): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);

  const slideFiles = Object.keys(zip.files)
    .filter((f) => /^ppt\/slides\/slide\d+\.xml$/i.test(f))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
      return numA - numB;
    });

  const pages: string[] = [];

  for (const slidePath of slideFiles) {
    const xml = await zip.files[slidePath].async("text");
    const texts = extractTextFromXml(xml);
    if (texts.length > 0) {
      const slideNum = slidePath.match(/slide(\d+)/)?.[1] || "?";
      pages.push(`--- Slide ${slideNum} ---\n${texts.join("\n")}`);
    }
  }

  return pages.join("\n\n");
}

function extractTextFromXml(xml: string): string[] {
  const results: string[] = [];
  const regex = /<a:t>([\s\S]*?)<\/a:t>/g;
  let match: RegExpExecArray | null;

  const runs: string[] = [];
  while ((match = regex.exec(xml)) !== null) {
    const decoded = match[1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .trim();
    if (decoded) runs.push(decoded);
  }

  const paragraphRegex = /<a:p[\s>]([\s\S]*?)<\/a:p>/g;
  let pMatch: RegExpExecArray | null;
  while ((pMatch = paragraphRegex.exec(xml)) !== null) {
    const pContent = pMatch[1];
    const textRegex = /<a:t>([\s\S]*?)<\/a:t>/g;
    let tMatch: RegExpExecArray | null;
    const parts: string[] = [];
    while ((tMatch = textRegex.exec(pContent)) !== null) {
      const decoded = tMatch[1]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .trim();
      if (decoded) parts.push(decoded);
    }
    if (parts.length > 0) {
      results.push(parts.join(" "));
    }
  }

  if (results.length === 0 && runs.length > 0) {
    return runs;
  }

  return results;
}

async function extractXlsxText(buffer: Buffer): Promise<string> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

  const sheets: string[] = [];

  workbook.eachSheet((worksheet) => {
    const rows: string[] = [];
    rows.push(`--- Sheet: ${worksheet.name} ---`);

    worksheet.eachRow((row) => {
      const cells: string[] = [];
      row.eachCell({ includeEmpty: false }, (cell) => {
        const val = cell.value;
        if (val !== null && val !== undefined) {
          cells.push(String(val));
        }
      });
      if (cells.length > 0) {
        rows.push(cells.join(" | "));
      }
    });

    if (rows.length > 1) {
      sheets.push(rows.join("\n"));
    }
  });

  return sheets.join("\n\n");
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
