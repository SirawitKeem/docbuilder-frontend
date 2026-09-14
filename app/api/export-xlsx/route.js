import * as XLSX from "xlsx";
import { customTemplatesRepo } from "@/lib/db/repositories";
import { replaceTokensInSheetData } from "@/lib/tokens/sheetTokenEngine";

export async function POST(request) {
  try {
    const { templateId, sheetData, values = {}, fileName } = await request.json();

    let rawSheetData = sheetData;
    let title = "Spreadsheet";

    if (templateId) {
      const tmpl = await customTemplatesRepo.getById(templateId);
      if (tmpl) {
        title = tmpl.name || title;
        if (!rawSheetData && Array.isArray(tmpl.sheetData)) {
          rawSheetData = tmpl.sheetData;
        }
      }
    }

    if (!Array.isArray(rawSheetData) || rawSheetData.length === 0) {
      // Default empty sheet if no data
      rawSheetData = [
        {
          name: "Sheet1",
          id: "sheet_01",
          celldata: []
        }
      ];
    }

    // 1. Dynamic Token Replacement (Zero-Leakage token substitution on text cells)
    const processedSheetData = replaceTokensInSheetData(rawSheetData, values);

    // 2. Build SheetJS Workbook Object with Native Formulas
    const wb = XLSX.utils.book_new();

    processedSheetData.forEach((sheet, sheetIdx) => {
      const ws = {};
      let maxR = 0;
      let maxC = 0;

      const cellList = Array.isArray(sheet.celldata) ? sheet.celldata : [];

      cellList.forEach((cell) => {
        const r = typeof cell.r === "number" ? cell.r : 0;
        const c = typeof cell.c === "number" ? cell.c : 0;
        if (r > maxR) maxR = r;
        if (c > maxC) maxC = c;

        const cellRef = XLSX.utils.encode_cell({ r, c });
        const valObj = cell.v || {};
        const cellEntry = {};

        if (valObj.f) {
          // Native Excel formula string without leading '='
          const formulaStr = String(valObj.f).startsWith("=") ? String(valObj.f).substring(1) : String(valObj.f);
          cellEntry.f = formulaStr;
          cellEntry.t = "n";
          if (valObj.v !== undefined && valObj.v !== null) {
            cellEntry.v = typeof valObj.v === "number" ? valObj.v : Number(valObj.v) || 0;
          }
        } else if (typeof valObj.v === "number") {
          cellEntry.t = "n";
          cellEntry.v = valObj.v;
        } else if (typeof valObj.v === "boolean") {
          cellEntry.t = "b";
          cellEntry.v = valObj.v;
        } else {
          cellEntry.t = "s";
          cellEntry.v = valObj.v !== undefined && valObj.v !== null ? String(valObj.v) : (valObj.m !== undefined ? String(valObj.m) : "");
        }

        ws[cellRef] = cellEntry;
      });

      ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(maxR, 10), c: Math.max(maxC, 5) } });
      const rawName = sheet.name || `Sheet${sheetIdx + 1}`;
      const safeSheetName = rawName.replace(/[:\\/?*\[\]]/g, "_").substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
    });

    // 3. Generate .xlsx Buffer using SheetJS Community Edition
    const xlsxBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
    const downloadFileName = fileName || `${title.replace(/[/\\?%*:|"<>]/g, "_")}.xlsx`;

    return new Response(xlsxBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(downloadFileName)}"`,
      },
    });
  } catch (error) {
    console.error("export-xlsx error:", error);
    return Response.json({ error: "สร้างไฟล์ Excel ไม่สำเร็จ" }, { status: 500 });
  }
}