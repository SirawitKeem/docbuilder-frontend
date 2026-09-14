import { DEFAULT_SAMPLE_TOKEN_MAP, resolveTokenValue } from "./tokenEngine.js";

const TOKEN_REGEX = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

/**
 * 🏷️ Replace tokens in FortuneSheet workbook data (Non-destructive)
 * Only text cells without formulas are replaced.
 */
export function replaceTokensInSheetData(sheetData, tokenMap = DEFAULT_SAMPLE_TOKEN_MAP) {
  if (!Array.isArray(sheetData) || sheetData.length === 0) return sheetData;

  // Deep clone to avoid mutating in-memory editor state
  const cloned = JSON.parse(JSON.stringify(sheetData));

  cloned.forEach((sheet) => {
    if (!Array.isArray(sheet.celldata)) return;

    sheet.celldata.forEach((cell) => {
      const vObj = cell.v;
      if (!vObj) return;

      // 🛡️ CRITICAL: Never touch formula cells
      if (vObj.f) return;

      // Check text value
      const rawText = vObj.m !== undefined ? String(vObj.m) : (vObj.v !== undefined ? String(vObj.v) : "");
      if (typeof rawText === "string" && rawText.includes("{{")) {
        // Save original raw value for zero-leakage reversibility
        if (vObj._raw === undefined) {
          vObj._raw = rawText;
        }

        const replaced = rawText.replace(TOKEN_REGEX, (match, key) => {
          const val = resolveTokenValue(key, tokenMap);
          if (val !== undefined && val !== null) {
            return String(val);
          }
          return match;
        });

        vObj.v = replaced;
        vObj.m = replaced;
      }
    });
  });

  return cloned;
}

/**
 * 🛡️ Zero-Leakage Reversion: Revert previewed values back to raw tokens before saving
 */
export function revertTokensInSheetData(sheetData) {
  if (!Array.isArray(sheetData) || sheetData.length === 0) return sheetData;

  const cloned = JSON.parse(JSON.stringify(sheetData));

  cloned.forEach((sheet) => {
    if (!Array.isArray(sheet.celldata)) return;

    sheet.celldata.forEach((cell) => {
      const vObj = cell.v;
      if (!vObj) return;

      if (vObj._raw !== undefined) {
        vObj.v = vObj._raw;
        vObj.m = vObj._raw;
        delete vObj._raw;
      }
    });
  });

  return cloned;
}

/**
 * 🔍 Extract all unique token keys used across the entire workbook
 */
export function extractTokensFromSheetData(sheetData) {
  if (!Array.isArray(sheetData)) return [];
  const found = new Set();

  sheetData.forEach((sheet) => {
    if (!Array.isArray(sheet.celldata)) return;
    sheet.celldata.forEach((cell) => {
      const vObj = cell.v;
      if (!vObj || vObj.f) return;
      const text = vObj._raw || vObj.m || vObj.v || "";
      if (typeof text === "string") {
        const matches = text.matchAll(TOKEN_REGEX);
        for (const match of matches) {
          found.add(match[1]);
        }
      }
    });
  });

  return Array.from(found);
}