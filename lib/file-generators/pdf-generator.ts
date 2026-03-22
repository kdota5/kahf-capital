import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export async function generatePDF(input: Record<string, unknown>): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  });

  const MARGIN = 20;
  const PAGE_WIDTH = 215.9;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
  let y = MARGIN;

  doc.setFontSize(24);
  doc.setTextColor(15, 23, 42);
  doc.text(String(input.title || "Report"), MARGIN, y + 8);
  y += 14;

  if (input.subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(148, 163, 184);
    doc.text(String(input.subtitle), MARGIN, y + 4);
    y += 8;
  }

  if (input.date) {
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(String(input.date), MARGIN, y + 4);
    y += 8;
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, y + 2, PAGE_WIDTH - MARGIN, y + 2);
  y += 8;

  const sections = (input.sections || []) as Array<{
    heading: string;
    content: string;
    table?: { headers: string[]; rows: string[][] };
    callout?: { value: string; label: string };
  }>;

  for (const section of sections) {
    if (y > 240) {
      doc.addPage();
      y = MARGIN;
    }

    doc.setFontSize(16);
    doc.setTextColor(14, 165, 233);
    doc.text(section.heading, MARGIN, y + 6);
    y += 12;

    if (section.callout) {
      doc.setFontSize(36);
      doc.setTextColor(14, 165, 233);
      doc.text(section.callout.value, MARGIN, y + 12);
      y += 16;
      doc.setFontSize(11);
      doc.setTextColor(148, 163, 184);
      doc.text(section.callout.label, MARGIN, y + 4);
      y += 10;
    }

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(section.content, CONTENT_WIDTH);
    doc.text(lines, MARGIN, y + 4);
    y += lines.length * 5 + 6;

    if (section.table?.headers?.length) {
      autoTable(doc, {
        startY: y,
        head: [section.table.headers],
        body: section.table.rows || [],
        margin: { left: MARGIN, right: MARGIN },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontSize: 9,
        },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });
      const d = doc as unknown as { lastAutoTable?: { finalY: number } };
      y = (d.lastAutoTable?.finalY ?? y) + 8;
    }

    y += 6;
  }

  const pageCount = doc.getNumberOfPages();
  const footer = String(input.footer_text || "");
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    if (footer) {
      doc.text(footer, MARGIN, 268);
    }
    doc.text(`Page ${i} of ${pageCount}`, PAGE_WIDTH - MARGIN - 25, 268);
  }

  const buffer = doc.output("arraybuffer");
  return Buffer.from(buffer);
}
