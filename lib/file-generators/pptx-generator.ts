import PptxGenJS from "pptxgenjs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Slide = any;

type Pres = InstanceType<typeof PptxGenJS>;

const COLORS = {
  navy: "0A0F1C",
  slate: "0F172A",
  teal: "0EA5E9",
  emerald: "10B981",
  white: "FFFFFF",
  textLight: "F8FAFC",
  textMuted: "94A3B8",
  textDark: "0F172A",
  border: "E2E8F0",
};

function isNumericCell(str: string): boolean {
  return /^[\$\-\(\d]/.test((str || "").trim());
}

export async function generatePPTX(input: Record<string, unknown>): Promise<Buffer> {
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_WIDE";
  pres.author = "Conda";
  pres.title = String(input.title || "Presentation");

  const slides = (input.slides || []) as Record<string, unknown>[];
  const subtitle = String(input.subtitle || "");

  for (const slideData of slides) {
    const layout = String(slideData.layout || "content");
    const slide = pres.addSlide();

    switch (layout) {
      case "title":
        renderTitleSlide(slide, pres, slideData, String(input.title || ""), subtitle);
        break;
      case "section_divider":
        renderSectionDivider(slide, pres, slideData);
        break;
      case "two_column":
      case "comparison":
        renderTwoColumnSlide(slide, pres, slideData);
        break;
      case "table":
        renderTableSlide(slide, pres, slideData);
        break;
      case "chart":
        renderChartSlide(slide, pres, slideData);
        break;
      case "stat_callout":
        renderStatCallout(slide, pres, slideData);
        break;
      case "closing":
        renderClosingSlide(slide, pres, slideData, String(input.title || ""));
        break;
      default:
        renderContentSlide(slide, pres, slideData);
    }

    if (slideData.notes) {
      slide.addNotes(String(slideData.notes));
    }
  }

  const buffer = await pres.write({ outputType: "nodebuffer" });
  return buffer as Buffer;
}

function renderTitleSlide(
  slide: Slide,
  pres: Pres,
  data: Record<string, unknown>,
  title: string,
  subtitleFallback: string
) {
  slide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 7.5,
    fill: { color: COLORS.navy },
  });
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8,
    y: 3.0,
    w: 1.5,
    h: 0.06,
    fill: { color: COLORS.teal },
  });
  slide.addText(String(data.title || title), {
    x: 0.8,
    y: 3.3,
    w: 11,
    h: 1.2,
    fontSize: 36,
    fontFace: "Calibri",
    color: COLORS.textLight,
    bold: true,
    align: "left",
  });
  const sub = String(data.content || subtitleFallback || "");
  if (sub) {
    slide.addText(sub, {
      x: 0.8,
      y: 4.5,
      w: 8,
      h: 0.8,
      fontSize: 16,
      fontFace: "Calibri",
      color: COLORS.textMuted,
      align: "left",
    });
  }
  slide.addText(
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    {
      x: 0.8,
      y: 6.5,
      w: 4,
      h: 0.5,
      fontSize: 11,
      fontFace: "Calibri",
      color: COLORS.textMuted,
    }
  );
}

function renderSectionDivider(
  slide: Slide,
  pres: Pres,
  data: Record<string, unknown>
) {
  slide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 7.5,
    fill: { color: COLORS.slate },
  });
  slide.addText(String(data.title || ""), {
    x: 1,
    y: 3,
    w: 11,
    h: 1.5,
    fontSize: 32,
    fontFace: "Calibri",
    color: COLORS.teal,
    bold: true,
    align: "center",
  });
}

function renderContentSlide(
  slide: Slide,
  pres: Pres,
  data: Record<string, unknown>
) {
  slide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 1.2,
    fill: { color: COLORS.slate },
  });
  slide.addText(String(data.title || ""), {
    x: 0.8,
    y: 0.15,
    w: 11,
    h: 0.9,
    fontSize: 22,
    fontFace: "Calibri",
    color: COLORS.textLight,
    bold: true,
    valign: "middle",
  });
  if (data.content) {
    slide.addText(String(data.content), {
      x: 0.8,
      y: 1.6,
      w: 11.5,
      h: 5.2,
      fontSize: 14,
      fontFace: "Calibri",
      color: COLORS.textDark,
      lineSpacingMultiple: 1.4,
      valign: "top",
    });
  }
}

function renderTwoColumnSlide(
  slide: Slide,
  pres: Pres,
  data: Record<string, unknown>
) {
  slide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 1.2,
    fill: { color: COLORS.slate },
  });
  slide.addText(String(data.title || ""), {
    x: 0.8,
    y: 0.15,
    w: 11,
    h: 0.9,
    fontSize: 22,
    fontFace: "Calibri",
    color: COLORS.textLight,
    bold: true,
    valign: "middle",
  });
  slide.addText(String(data.left_content || ""), {
    x: 0.6,
    y: 1.5,
    w: 5.8,
    h: 5.5,
    fontSize: 13,
    fontFace: "Calibri",
    color: COLORS.textDark,
    valign: "top",
  });
  slide.addText(String(data.right_content || ""), {
    x: 6.8,
    y: 1.5,
    w: 5.8,
    h: 5.5,
    fontSize: 13,
    fontFace: "Calibri",
    color: COLORS.textDark,
    valign: "top",
  });
}

function renderTableSlide(
  slide: Slide,
  pres: Pres,
  data: Record<string, unknown>
) {
  slide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 1.2,
    fill: { color: COLORS.slate },
  });
  slide.addText(String(data.title || ""), {
    x: 0.8,
    y: 0.15,
    w: 11,
    h: 0.9,
    fontSize: 22,
    fontFace: "Calibri",
    color: COLORS.textLight,
    bold: true,
    valign: "middle",
  });

  const tableData = data.table_data as
    | { headers: string[]; rows: string[][] }
    | undefined;
  if (!tableData?.headers?.length) return;

  const rows = tableData.rows || [];
  const tableRows = [
    tableData.headers.map((h) => ({
      text: h,
      options: {
        bold: true,
        color: COLORS.textLight,
        fill: { color: COLORS.navy },
        fontSize: 10,
        fontFace: "Calibri",
        align: "left",
        valign: "middle",
      },
    })),
    ...rows.map((row, i) =>
      row.map((cell) => ({
        text: cell,
        options: {
          fontSize: 10,
          fontFace: "Calibri",
          color: COLORS.textDark,
          fill: { color: i % 2 === 0 ? COLORS.white : "F8FAFC" },
          align: isNumericCell(cell) ? "right" : "left",
          valign: "middle",
        },
      }))
    ),
  ];

  slide.addTable(tableRows, {
    x: 0.6,
    y: 1.5,
    w: 12,
    border: { type: "solid", pt: 0.5, color: COLORS.border },
    colW: tableData.headers.map(() => 12 / tableData.headers.length),
  });
}

function renderChartSlide(
  slide: Slide,
  pres: Pres,
  data: Record<string, unknown>
) {
  slide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 1.2,
    fill: { color: COLORS.slate },
  });
  slide.addText(String(data.title || ""), {
    x: 0.8,
    y: 0.15,
    w: 11,
    h: 0.9,
    fontSize: 22,
    fontFace: "Calibri",
    color: COLORS.textLight,
    bold: true,
    valign: "middle",
  });

  const chartData = data.chart_data as
    | {
        chart_type?: string;
        series?: Array<{ name?: string; labels?: string[]; values?: number[] }>;
      }
    | undefined;
  if (!chartData?.series?.length) return;

  const chartTypeMap: Record<string, Pres["ChartType"][keyof Pres["ChartType"]]> = {
    doughnut: pres.ChartType.doughnut,
    bar: pres.ChartType.bar,
    clustered_bar: pres.ChartType.bar,
    line: pres.ChartType.line,
    stacked_bar: pres.ChartType.bar,
  };
  const type =
    chartTypeMap[chartData.chart_type || "bar"] || pres.ChartType.bar;

  const series = chartData.series.map((s) => ({
    name: s.name || "Series",
    labels: s.labels || [],
    values: s.values || [],
  }));

  slide.addChart(type, series, {
    x: 1,
    y: 1.8,
    w: 11,
    h: 5,
    showLegend: true,
    legendPos: "b",
    chartColors: [COLORS.teal, COLORS.navy, COLORS.slate, COLORS.emerald],
    barGrouping: chartData.chart_type === "stacked_bar" ? "stacked" : "clustered",
  });
}

function renderStatCallout(
  slide: Slide,
  pres: Pres,
  data: Record<string, unknown>
) {
  slide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 7.5,
    fill: { color: COLORS.navy },
  });
  slide.addText(String(data.stat_value || data.title || ""), {
    x: 1,
    y: 2,
    w: 11,
    h: 2,
    fontSize: 64,
    fontFace: "Calibri",
    color: COLORS.teal,
    bold: true,
    align: "center",
    valign: "middle",
  });
  slide.addText(String(data.stat_label || data.content || ""), {
    x: 2,
    y: 4.2,
    w: 9,
    h: 1,
    fontSize: 18,
    fontFace: "Calibri",
    color: COLORS.textMuted,
    align: "center",
  });
}

function renderClosingSlide(
  slide: Slide,
  pres: Pres,
  data: Record<string, unknown>,
  title: string
) {
  slide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 7.5,
    fill: { color: COLORS.navy },
  });
  slide.addText(String(data.title || "Thank you"), {
    x: 1,
    y: 2.8,
    w: 11,
    h: 1.2,
    fontSize: 36,
    fontFace: "Calibri",
    color: COLORS.textLight,
    bold: true,
    align: "center",
  });
  slide.addText(title, {
    x: 1,
    y: 4.2,
    w: 11,
    h: 0.6,
    fontSize: 14,
    fontFace: "Calibri",
    color: COLORS.textMuted,
    align: "center",
  });
}
