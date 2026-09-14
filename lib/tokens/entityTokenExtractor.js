/**
 * entityTokenExtractor.js
 * Helper สำหรับสแกนตัวแปร {{...}} จาก Custom Template canvas
 * และกรองเฉพาะตัวแปรที่มี scope = "entity" ใน customTokens
 */

/**
 * สแกน Fabric canvas pages, blocks, และ template definition หาตัวแปร {{token}} ทั้งหมด
 * @param {Object|Array} input - array of pages หรือ template object
 * @returns {Set<string>} set of token keys (ไม่มี {{ }})
 */
export function scanCanvasTokens(input = []) {
  const tokenSet = new Set();
  const pattern = /\{\{([a-zA-Z0-9_]+)\}\}/g;

  // If input is an Array of pages
  const pages = Array.isArray(input) ? input : (input?.pages || []);
  for (const page of pages) {
    const json = typeof page?.json === "string" ? page.json : JSON.stringify(page?.json || "");
    let match;
    while ((match = pattern.exec(json)) !== null) {
      tokenSet.add(match[1]);
    }
  }

  // If input is template with blocks
  if (input && !Array.isArray(input)) {
    const blocks = Array.isArray(input.blocks) ? input.blocks : [];
    for (const block of blocks) {
      const str = JSON.stringify(block || "");
      let match;
      while ((match = pattern.exec(str)) !== null) {
        tokenSet.add(match[1]);
      }
    }

    if (Array.isArray(input.tokens)) {
      input.tokens.forEach((t) => {
        const k = typeof t === "string" ? t : t.key;
        if (k) tokenSet.add(k.replace(/^\{\{|\}\}$/g, ""));
      });
    }
  }

  return tokenSet;
}

/**
 * กรองตัวแปรเฉพาะ scope="entity" จาก custom tokens list
 * @param {Array} customTokens - from GET /api/custom-tokens
 * @returns {Object} map of key -> token definition
 */
export function buildEntityTokenMap(customTokens = []) {
  const map = {};
  customTokens.forEach((t) => {
    if (t.scope === "entity") map[t.key] = t;
  });
  return map;
}

/**
 * ส่งคืน field definitions สำหรับ Custom Template ที่เป็น entity tokens
 * ใช้ใน ProfileForm เพื่อสร้าง form fields dynamically
 * @param {Array} pages - customTemplate.pages
 * @param {Array} customTokens - from /api/custom-tokens
 * @returns {Array} array of { key, label, example, scope }
 */
export function extractEntityTokensFromTemplate(pages = [], customTokens = []) {
  const canvasTokens = scanCanvasTokens(pages);
  const entityMap = buildEntityTokenMap(customTokens);

  const result = [];
  canvasTokens.forEach((key) => {
    if (entityMap[key]) {
      result.push({
        key,
        label: entityMap[key].label,
        example: entityMap[key].example || "",
        scope: "entity",
      });
    }
  });
  return result;
}

/**
 * ตรวจสอบว่า Custom Template มีตัวแปร entity ใดบ้าง
 * ใช้เพื่อตัดสินใจว่า template นั้นควรปรากฏใน Compatible Templates ของ Profile หรือไม่
 * @param {Array} pages
 * @param {Array} customTokens
 * @returns {boolean}
 */
export function templateHasEntityTokens(pages = [], customTokens = []) {
  return extractEntityTokensFromTemplate(pages, customTokens).length > 0;
}