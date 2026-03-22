import type { Tool } from "@anthropic-ai/sdk/resources/messages/messages";

/**
 * Tool definitions for Claude — file generation + inline charts.
 * Client IDs only in tool inputs; names re-injected in /api/generate-file.
 */
export const FILE_GENERATION_TOOLS: Tool[] = [
  {
    name: "generate_pptx",
    description: `Generate a professional PowerPoint presentation. Use when the advisor asks for a deck, presentation, slides, or proposal. Provide complete slide-by-slide content with layout types: title, section_divider, content, two_column, comparison, table, chart, stat_callout, closing.`,
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Presentation title" },
        subtitle: { type: "string" },
        slides: {
          type: "array",
          items: {
            type: "object",
            properties: {
              layout: {
                type: "string",
                enum: [
                  "title",
                  "section_divider",
                  "content",
                  "two_column",
                  "comparison",
                  "table",
                  "chart",
                  "stat_callout",
                  "closing",
                ],
              },
              title: { type: "string" },
              content: { type: "string" },
              left_content: { type: "string" },
              right_content: { type: "string" },
              table_data: {
                type: "object",
                properties: {
                  headers: { type: "array", items: { type: "string" } },
                  rows: {
                    type: "array",
                    items: { type: "array", items: { type: "string" } },
                  },
                },
              },
              chart_data: {
                type: "object",
                properties: {
                  chart_type: {
                    type: "string",
                    enum: [
                      "doughnut",
                      "bar",
                      "clustered_bar",
                      "line",
                      "stacked_bar",
                    ],
                  },
                  series: { type: "array" },
                },
              },
              stat_value: { type: "string" },
              stat_label: { type: "string" },
              notes: { type: "string" },
            },
            required: ["layout", "title"],
          },
        },
      },
      required: ["title", "slides"],
    },
  },
  {
    name: "generate_xlsx",
    description: `Generate an Excel workbook with formulas and formatting. Use for spreadsheets, models, worksheets, or tabular deliverables. Use Excel formulas starting with = in cells.`,
    input_schema: {
      type: "object",
      properties: {
        filename: { type: "string" },
        sheets: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              columns: { type: "array" },
              rows: { type: "array" },
              freeze_row: { type: "number" },
              auto_filter: { type: "boolean" },
            },
            required: ["name", "columns", "rows"],
          },
        },
      },
      required: ["filename", "sheets"],
    },
  },
  {
    name: "generate_pdf",
    description: `Generate a PDF report for formal client-ready documents.`,
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        date: { type: "string" },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              heading: { type: "string" },
              content: { type: "string" },
              table: {
                type: "object",
                properties: {
                  headers: { type: "array", items: { type: "string" } },
                  rows: {
                    type: "array",
                    items: { type: "array", items: { type: "string" } },
                  },
                },
              },
              callout: {
                type: "object",
                properties: {
                  value: { type: "string" },
                  label: { type: "string" },
                },
              },
            },
            required: ["heading", "content"],
          },
        },
        footer_text: { type: "string" },
      },
      required: ["title", "sections"],
    },
  },
  {
    name: "render_chart",
    description: `Render an interactive chart inline in the chat (not a file). Use to visualize allocations, comparisons, or trends.`,
    input_schema: {
      type: "object",
      properties: {
        chart_type: {
          type: "string",
          enum: [
            "bar",
            "stacked_bar",
            "grouped_bar",
            "line",
            "area",
            "pie",
            "doughnut",
            "scatter",
            "radar",
            "treemap",
          ],
        },
        title: { type: "string" },
        data: {
          type: "object",
          properties: {
            labels: { type: "array", items: { type: "string" } },
            datasets: { type: "array" },
          },
          required: ["labels", "datasets"],
        },
        x_axis_label: { type: "string" },
        y_axis_label: { type: "string" },
        show_legend: { type: "boolean" },
        show_values: { type: "boolean" },
        height: { type: "number" },
        format: {
          type: "string",
          enum: ["currency", "percentage", "number"],
        },
      },
      required: ["chart_type", "title", "data"],
    },
  },
];
