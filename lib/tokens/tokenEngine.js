/**
 * Dynamic Token Engine for Document Builder
 * Supports standard dynamic variables {{variable_name}} across Textboxes and DocTable line items.
 */

export const AVAILABLE_TOKEN_CATEGORIES = [
  {
    category: "ข้อมูลบริษัทผู้จัดทำ (Our Company)",
    tokens: [
      { key: "{{company_name}}", label: "ชื่อบริษัท (ไทย)", example: "บริษัท เครสท์ เซนโด จำกัด" },
      { key: "{{company_name_en}}", label: "ชื่อบริษัท (Eng)", example: "Crest Zendo Co., Ltd." },
      { key: "{{company_tax_id}}", label: "เลขประจำตัวผู้เสียภาษี", example: "0105558073755" },
      { key: "{{company_address}}", label: "ที่อยู่สำนักงานใหญ่", example: "8/40 The Connect 37, ซอยช่างอากาศอุทิศ 10 แยก 1-2 แขวงดอนเมือง เขตดอนเมือง กรุงเทพมหานคร 10210" },
      { key: "{{company_phone}}", label: "เบอร์โทรศัพท์บริษัท", example: "02-123-4567" },
      { key: "{{company_email}}", label: "อีเมลติดต่อบริษัท", example: "contact@crestzendo.com" },
    ],
  },
  {
    category: "ข้อมูลคู่สัญญา / ลูกค้า (Client / Customer)",
    tokens: [
      { key: "{{customer_name}}", label: "ชื่อผู้ติดต่อ / ลูกค้า", example: "คุณสมชาย มั่งคั่งทรัพย์" },
      { key: "{{customer_company}}", label: "ชื่อบริษัทคู่สัญญา", example: "บริษัท สยาม ซีนเนอร์ยี่ กรุ๊ป จำกัด (มหาชน)" },
      { key: "{{customer_address}}", label: "ที่อยู่คู่สัญญา", example: "99/1 อาคารแคปิตอล ทาวเวอร์ ชั้น 14 ถนนสาทรเหนือ แขวงสีลม เขตบางรัก กรุงเทพฯ 10500" },
      { key: "{{customer_tax_id}}", label: "เลขภาษีคู่สัญญา", example: "0107558000123" },
      { key: "{{attn_name}}", label: "เรียน (Attn)", example: "คุณสมชาย มั่งคั่งทรัพย์ (กรรมการบริหาร)" },
    ],
  },
  {
    category: "ข้อมูลเอกสาร & การเงิน (Document & Finance)",
    tokens: [
      { key: "{{doc_no}}", label: "เลขที่เอกสาร", example: "DOC-2026-0901" },
      { key: "{{doc_date}}", label: "วันที่ออกเอกสาร", example: "03 กันยายน 2569" },
      { key: "{{subject}}", label: "หัวเรื่องเอกสาร", example: "แจ้งเปลี่ยนแปลงที่อยู่สำนักงานใหญ่และข้อมูลนิติกรรม" },
      { key: "{{grand_total}}", label: "ยอดเงินรวมทั้งสิ้น", example: "239,680.00 บาท" },
      { key: "{{vat_amount}}", label: "ยอดภาษี VAT 7%", example: "15,680.00 บาท" },
    ],
  },
  {
    category: "ผู้มีอำนาจลงนาม (Authorized Signatory)",
    tokens: [
      { key: "{{authorized_signatory_name}}", label: "ชื่อผู้มีอำนาจลงนาม", example: "นายศรายุทธ โกสิยารักษ์" },
      { key: "{{authorized_signatory_position}}", label: "ตำแหน่งผู้ลงนาม", example: "กรรมการผู้จัดการ / CEO" },
    ],
  },
  {
    category: "ประกาศและข้อกำหนดบริษัท (Company Announcement)",
    tokens: [
      { key: "{{header_badge}}", label: "ป้ายหัวข้อประกาศ", example: "ประกาศบริษัท" },
      { key: "{{doc_title_1}}", label: "ชื่อประกาศ (บรรทัดที่ 1)", example: "ข้อกำหนดด้านประสิทธิภาพ" },
      { key: "{{doc_title_2}}", label: "ชื่อประกาศ (บรรทัดที่ 2)", example: "และความรับผิดชอบในการปฏิบัติงาน" },
      { key: "{{section_title}}", label: "หมวดหมู่ข้อกำหนด", example: "1. การบริหารจัดการและติดตามงาน" },
      { key: "{{rule_1_no}}", label: "ข้อ 1.1 (หมายเลข)", example: "1.1" },
      { key: "{{rule_1_text}}", label: "ข้อ 1.1 (เนื้อหา)", example: "ต้องบริหารจัดการงานที่ได้รับมอบหมายให้มีความต่อเนื่อง มีความคืบหน้า และดำเนินการให้แล้วเสร็จภายในระยะเวลาที่กำหนด" },
      { key: "{{rule_2_no}}", label: "ข้อ 1.2 (หมายเลข)", example: "1.2" },
      { key: "{{rule_2_text}}", label: "ข้อ 1.2 (เนื้อหา)", example: "ต้องวางแผนงาน จัดลำดับความสำคัญ และพิจารณาขั้นตอนที่เกี่ยวข้อง รวมถึงผลกระทบที่อาจเกิดขึ้น ก่อนทีจะดำเนินการ" },
      { key: "{{rule_3_no}}", label: "ข้อ 1.3 (หมายเลข)", example: "1.3" },
      { key: "{{rule_3_text}}", label: "ข้อ 1.3 (เนื้อหา)", example: "ต้องติดตามและผลักดันงานที่อยู่ในความรับผิดชอบด้วยตนเองอย่างต่อเนื่อง โดยไม่ต้องรอให้หัวหน้างานหรือบุคคลอื่นติดตามหรือแจ้งเตือน" },
      { key: "{{rule_4_no}}", label: "ข้อ 1.4 (หมายเลข)", example: "1.4" },
      { key: "{{rule_4_text}}", label: "ข้อ 1.4 (เนื้อหา)", example: "ต้องดำเนินงานให้ครบถ้วนและมีคุณภาพ โดยต้องตรวจสอบความถูกต้องและรายละเอียดที่เกี่ยวข้องก่อนส่งมอบทุกครั้ง" },
      { key: "{{rule_5_no}}", label: "ข้อ 1.5 (หมายเลข)", example: "1.5" },
      { key: "{{rule_5_text}}", label: "ข้อ 1.5 (เนื้อหา)", example: "ห้ามปล่อยให้งานที่ได้รับมอบหมายค้าง หยุดชะงัก หรือขาดความคืบหน้าโดยไม่มีการดำเนินการหรือแจ้งเหตุผลให้ผู้บังคับบัญชาทราบ" },
    ],
  },
];

// Default Sample Token Map
export const DEFAULT_SAMPLE_TOKEN_MAP = {
  company_name: "บริษัท เครสท์ เซนโด จำกัด",
  company_name_en: "Crest Zendo Co., Ltd.",
  company_tax_id: "0105558073755",
  company_address: "8/40 The Connect 37, ซอยช่างอากาศอุทิศ 10 แยก 1-2 แขวงดอนเมือง เขตดอนเมือง กรุงเทพมหานคร 10210",
  company_phone: "02-123-4567",
  company_email: "contact@crestzendo.com",
  customer_name: "คุณสมชาย มั่งคั่งทรัพย์",
  customer_company: "บริษัท สยาม ซีนเนอร์ยี่ กรุ๊ป จำกัด (มหาชน)",
  customer_address: "99/1 อาคารแคปิตอล ทาวเวอร์ ชั้น 14 ถนนสาทรเหนือ แขวงสีลม เขตบางรัก กรุงเทพฯ 10500",
  customer_tax_id: "0107558000123",
  attn_name: "คุณสมชาย มั่งคั่งทรัพย์ (กรรมการบริหาร)",
  doc_no: "DOC-2026-0901",
  doc_date: "03 กันยายน 2569",
  subject: "แจ้งเปลี่ยนแปลงที่อยู่สำนักงานใหญ่และข้อมูลนิติกรรม",
  grand_total: "239,680.00 บาท",
  vat_amount: "15,680.00 บาท",
  authorized_signatory_name: "นายศรายุทธ โกสิยารักษ์",
  authorized_signatory_position: "กรรมการผู้จัดการ / CEO",
  header_badge: "ประกาศบริษัท",
  doc_title_1: "ข้อกำหนดด้านประสิทธิภาพ",
  doc_title_2: "และความรับผิดชอบในการปฏิบัติงาน",
  section_title: "1. การบริหารจัดการและติดตามงาน",
  rule_1_no: "1.1",
  rule_1_text: "ต้องบริหารจัดการงานที่ได้รับมอบหมายให้มีความต่อเนื่อง มีความคืบหน้า และดำเนินการให้แล้วเสร็จภายในระยะเวลาที่กำหนด",
  rule_2_no: "1.2",
  rule_2_text: "ต้องวางแผนงาน จัดลำดับความสำคัญ และพิจารณาขั้นตอนที่เกี่ยวข้อง รวมถึงผลกระทบที่อาจเกิดขึ้น ก่อนทีจะดำเนินการ",
  rule_3_no: "1.3",
  rule_3_text: "ต้องติดตามและผลักดันงานที่อยู่ในความรับผิดชอบด้วยตนเองอย่างต่อเนื่อง โดยไม่ต้องรอให้หัวหน้างานหรือบุคคลอื่นติดตามหรือแจ้งเตือน",
  rule_4_no: "1.4",
  rule_4_text: "ต้องดำเนินงานให้ครบถ้วนและมีคุณภาพ โดยต้องตรวจสอบความถูกต้องและรายละเอียดที่เกี่ยวข้องก่อนส่งมอบทุกครั้ง",
  rule_5_no: "1.5",
  rule_5_text: "ห้ามปล่อยให้งานที่ได้รับมอบหมายค้าง หยุดชะงัก หรือขาดความคืบหน้าโดยไม่มีการดำเนินการหรือแจ้งเหตุผลให้ผู้บังคับบัญชาทราบ",
};

/**
 * 📦 Fetch all user-created custom tokens from /api/custom-tokens.
 * Returns [] if request fails (client-safe).
 */
export async function fetchCustomTokens() {
  try {
    const res = await fetch("/api/custom-tokens", { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * 🔀 Merge built-in AVAILABLE_TOKEN_CATEGORIES with user-created custom tokens.
 * Custom tokens are grouped into "ตัวแปรที่กำหนดเอง (Custom Variables)" category.
 * @param {Array} customTokens — from fetchCustomTokens() or passed directly
 * @returns {Array} merged categories array
 */
export function mergeWithCustomTokens(customTokens = []) {
  if (!customTokens.length) return AVAILABLE_TOKEN_CATEGORIES;

  const customCategory = {
    category: "ตัวแปรที่กำหนดเอง (Custom Variables)",
    tokens: customTokens.map((t) => ({
      key: `{{${t.key}}}`,
      label: t.label,
      example: t.example || `[${t.label}]`,
      scope: t.scope,
      id: t.id,
      isCustom: true,
    })),
  };

  return [...AVAILABLE_TOKEN_CATEGORIES, customCategory];
}

/**
 * 🗺️ Build a merged sample token map including custom token examples.
 * Used by applyTokensToCanvas for Live Preview.
 */
export function buildSampleTokenMap(customTokens = []) {
  const extra = {};
  customTokens.forEach((t) => {
    if (t.example) extra[t.key] = t.example;
  });
  return { ...DEFAULT_SAMPLE_TOKEN_MAP, ...extra };
}

/**
 * 🔗 Token Synonyms & Profile Field Aliases
 * Bridges the gap between Profile Registry, Template Schemas, and Token Engine.
 */
export const TOKEN_ALIASES = {
  // Company (Our Company)
  company_name: ["our_company_name", "companyName", "our_company"],
  our_company_name: ["company_name", "companyName"],
  company_name_en: ["our_company_name_en", "companyNameEn"],
  company_tax_id: ["our_company_tax_id", "taxId"],
  company_address: ["our_company_address", "address"],
  company_phone: ["our_company_phone", "phone"],
  company_email: ["our_company_email", "email"],

  // Customer / Counterparty (Partner / Client)
  customer_company: ["counterparty_name", "bill_to_company", "receiving_party_name", "reseller_name"],
  counterparty_name: ["customer_company", "bill_to_company", "receiving_party_name", "reseller_name"],
  bill_to_company: ["customer_company", "counterparty_name", "receiving_party_name", "reseller_name"],
  receiving_party_name: ["counterparty_name", "customer_company", "bill_to_company"],
  reseller_name: ["counterparty_name", "customer_company", "bill_to_company"],

  customer_name: ["counterparty_signatory_name", "receiving_signatory_name", "reseller_signatory_name", "attn_name"],
  counterparty_signatory_name: ["customer_name", "receiving_signatory_name", "reseller_signatory_name"],
  receiving_signatory_name: ["counterparty_signatory_name", "customer_name"],
  reseller_signatory_name: ["counterparty_signatory_name", "customer_name"],

  customer_address: ["counterparty_address", "receiving_party_address", "reseller_address"],
  counterparty_address: ["customer_address", "receiving_party_address", "reseller_address"],
  receiving_party_address: ["counterparty_address", "customer_address"],
  reseller_address: ["counterparty_address", "customer_address"],

  customer_tax_id: ["counterparty_registration_number", "taxId"],
  counterparty_registration_number: ["customer_tax_id"],

  // Signatories
  authorized_signatory_name: ["our_signatory_name", "disclosing_signatory_name"],
  our_signatory_name: ["authorized_signatory_name", "disclosing_signatory_name"],
  disclosing_signatory_name: ["our_signatory_name", "authorized_signatory_name"],

  authorized_signatory_position: ["our_signatory_position", "disclosing_signatory_position"],
  our_signatory_position: ["authorized_signatory_position", "disclosing_signatory_position"],
  disclosing_signatory_position: ["our_signatory_position", "authorized_signatory_position"],

  counterparty_signatory_position: ["receiving_signatory_position", "reseller_signatory_position"],
  receiving_signatory_position: ["counterparty_signatory_position"],
  reseller_signatory_position: ["counterparty_signatory_position"],

  // Contact / AM
  attn_name: ["customer_name", "attn"],
  am_name: ["senderName", "am"],
  am_phone: ["senderPhone"],

  // Document details
  doc_no: ["quotationNo", "documentNo"],
  doc_date: ["quotationDate", "contract_date"],
};

/**
 * Resolves a token value by checking direct matches, synonyms/aliases, and nested objects.
 */
export function resolveTokenValue(key, tokenMap = DEFAULT_SAMPLE_TOKEN_MAP) {
  if (!tokenMap) return undefined;

  // 1. Direct match
  if (tokenMap[key] !== undefined && tokenMap[key] !== null) return tokenMap[key];
  if (tokenMap[`{{${key}}}`] !== undefined && tokenMap[`{{${key}}}`] !== null) return tokenMap[`{{${key}}}`];

  // 2. Synonyms / Aliases match
  const aliases = TOKEN_ALIASES[key] || [];
  for (const alias of aliases) {
    if (tokenMap[alias] !== undefined && tokenMap[alias] !== null) return tokenMap[alias];
    if (tokenMap[`{{${alias}}}`] !== undefined && tokenMap[`{{${alias}}}`] !== null) return tokenMap[`{{${alias}}}`];
  }

  // 3. Nested billTo / sender structure
  if (key === "customer_company" && tokenMap.billTo?.companyName) return tokenMap.billTo.companyName;
  if (key === "attn_name" && tokenMap.billTo?.attn) return tokenMap.billTo.attn;
  if (key === "subject" && tokenMap.billTo?.subject) return tokenMap.billTo.subject;
  if (key === "am_name" && (tokenMap.billTo?.am || tokenMap.senderName)) return tokenMap.billTo?.am || tokenMap.senderName;
  if (key === "am_phone" && tokenMap.senderPhone) return tokenMap.senderPhone;

  return undefined;
}

/**
 * Replaces token strings {{token_name}} with values from tokenMap (supports synonyms & profile fields)
 */
export function replaceTokens(text, tokenMap = DEFAULT_SAMPLE_TOKEN_MAP) {
  if (typeof text !== "string") return text;
  return text.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
    const val = resolveTokenValue(key, tokenMap);
    return val !== undefined && val !== null ? String(val) : match;
  });
}

/**
 * Applies token substitution to an entire Fabric Canvas (including DocTable items)
 */
export function applyTokensToCanvas(canvas, isPreview = true, tokenMap = DEFAULT_SAMPLE_TOKEN_MAP) {
  if (!canvas) return;

  const objects = canvas.getObjects();

  objects.forEach((obj) => {
    // 1. Textbox / I-Text
    if (obj.type === "textbox" || obj.type === "i-text" || obj.type === "text") {
      if (isPreview) {
        if (!obj.rawTemplateText) {
          obj.rawTemplateText = obj.text;
        }
        obj.set("text", replaceTokens(obj.rawTemplateText, tokenMap));
      } else {
        if (obj.rawTemplateText) {
          obj.set("text", obj.rawTemplateText);
        }
      }
    }

    // 2. DocTable Custom Object
    if (obj.isDocTable && obj.docTableData && obj.updateTableData) {
      if (isPreview) {
        if (!obj.rawItems) {
          obj.rawItems = JSON.parse(JSON.stringify(obj.docTableData.items || []));
        }
        const replacedItems = obj.rawItems.map((item) => ({
          ...item,
          desc: replaceTokens(item.desc, tokenMap),
        }));
        obj.updateTableData({ items: replacedItems });
      } else {
        if (obj.rawItems) {
          obj.updateTableData({ items: JSON.parse(JSON.stringify(obj.rawItems)) });
        }
      }
    }
  });

  canvas.renderAll();
}

/**
 * 🛡️ Direct JSON Tree Revert: Strips mock preview values and forces raw tokens in any Canvas JSON tree
 * Can be executed on ANY page snapshot JSON without needing an active canvas instance.
 */
export function revertTokensInPageJson(pageJson) {
  if (!pageJson || typeof pageJson !== "object") return pageJson;

  // Deep clone to avoid in-memory side effects
  const cloned = JSON.parse(JSON.stringify(pageJson));

  function cleanObject(obj) {
    if (!obj || typeof obj !== "object") return;

    // 1. If text element with rawTemplateText -> force revert text to rawTemplateText
    if (obj.rawTemplateText !== undefined && obj.rawTemplateText !== null) {
      obj.text = obj.rawTemplateText;
    }

    // 2. If DocTable with rawItems -> force revert items to rawItems
    if (obj.isDocTable && obj.rawItems && Array.isArray(obj.rawItems)) {
      if (obj.docTableData) {
        obj.docTableData.items = JSON.parse(JSON.stringify(obj.rawItems));
      }
    }

    // 3. Recurse nested children/group objects if present
    if (Array.isArray(obj.objects)) {
      obj.objects.forEach(cleanObject);
    }
  }

  if (Array.isArray(cloned.objects)) {
    cloned.objects.forEach(cleanObject);
  }

  return cloned;
}

/**
 * 🔍 Scans a template (both Fabric pages and block definitions) and extracts all dynamic token keys.
 * Returns an array of token descriptor objects: { key, rawKey, label, example, category }
 */
export function extractTokensFromTemplate(template) {
  const tokenSet = new Set();
  if (!template) return [];

  function scanText(str) {
    if (typeof str !== "string") return;
    const matches = str.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g);
    for (const m of matches) {
      tokenSet.add(m[1]);
    }
  }

  // 1. Scan pages Fabric JSON
  if (Array.isArray(template.pages)) {
    template.pages.forEach((page) => {
      if (!page) return;
      const json = typeof page.json === "string" ? JSON.parse(page.json) : page.json;
      if (json && Array.isArray(json.objects)) {
        json.objects.forEach(function scanObj(obj) {
          if (!obj) return;
          if (obj.tokenKey) {
            const cleanKey = String(obj.tokenKey).replace(/^\{\{|\}\}$/g, "");
            tokenSet.add(cleanKey);
          }
          scanText(obj.rawTemplateText);
          scanText(obj.text);
          if (obj.isDocTable && obj.docTableData && Array.isArray(obj.docTableData.items)) {
            obj.docTableData.items.forEach((item) => {
              scanText(item.desc);
              scanText(item.title);
            });
          }
          if (Array.isArray(obj.objects)) {
            obj.objects.forEach(scanObj);
          }
        });
      }
    });
  }

  // 2. Scan blocks if present
  if (Array.isArray(template.blocks)) {
    template.blocks.forEach((b) => {
      if (!b || !b.settings) return;
      Object.values(b.settings).forEach((val) => {
        if (typeof val === "string") scanText(val);
      });
    });
  }

  // Build dictionary of known token metadata
  const allKnownTokens = [];
  AVAILABLE_TOKEN_CATEGORIES.forEach((c) => {
    c.tokens.forEach((t) => {
      const cleanKey = t.key.replace(/^\{\{|\}\}$/g, "");
      allKnownTokens.push({
        key: cleanKey,
        rawKey: t.key,
        label: t.label,
        example: t.example,
        category: c.category,
      });
    });
  });

  return Array.from(tokenSet).map((key) => {
    const known = allKnownTokens.find((t) => t.key === key);
    return (
      known || {
        key,
        rawKey: `{{${key}}}`,
        label: key.replace(/_/g, " "),
        example: "",
        category: "ข้อมูลทั่วไป (General)",
      }
    );
  });
}