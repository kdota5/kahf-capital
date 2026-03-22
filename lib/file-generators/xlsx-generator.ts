import ExcelJS from "exceljs";

export async function generateXLSX(input: Record<string, unknown>): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Conda";
  workbook.created = new Date();

  const sheets = (input.sheets || []) as Record<string, unknown>[];

  for (const sheetData of sheets) {
    const name = String(sheetData.name || "Sheet1").slice(0, 31);
    const sheet = workbook.addWorksheet(name);

    const columns = (sheetData.columns || []) as Array<{
      header: string;
      width?: number;
      format?: string;
    }>;
    const rows = (sheetData.rows || []) as (string | number | null | undefined)[][];

    const headers = columns.map((c) => c.header);
    const headerRow = sheet.getRow(1);
    headers.forEach((h, i) => {
      headerRow.getCell(i + 1).value = h;
    });
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F172A" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 28;

    columns.forEach((col, i) => {
      sheet.getColumn(i + 1).width = col.width ? col.width / 5 : 15;
    });

    for (let i = 0; i < rows.length; i++) {
      const rowData = rows[i];
      const row = sheet.getRow(i + 2);

      if (i % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" },
        };
      }

      rowData.forEach((cell, colIdx) => {
        const col = columns[colIdx];
        const excelCell = row.getCell(colIdx + 1);

        if (typeof cell === "string" && cell.trim().startsWith("=")) {
          excelCell.value = { formula: cell.trim().slice(1) };
          excelCell.font = { color: { argb: "FF000000" } };
        } else if (typeof cell === "number") {
          excelCell.value = cell;
          if (col?.format === "currency") {
            excelCell.numFmt = "$#,##0;($#,##0)";
            excelCell.font = {
              color: {
                argb:
                  cell < 0 ? "FFEF4444" : cell > 0 ? "FF10B981" : "FF000000",
              },
            };
          } else if (col?.format === "percentage") {
            excelCell.numFmt = "0.0%";
          }
        } else if (cell != null && cell !== "") {
          excelCell.value = String(cell);
        }
      });
    }

    if (sheetData.freeze_row) {
      sheet.views = [{ state: "frozen", ySplit: Number(sheetData.freeze_row) }];
    }

    if (sheetData.auto_filter && headers.length) {
      sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: headers.length },
      };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
