/**
 * 🎨 Dynamic Block-to-Canvas Synthesizer
 * Bridges block-based templates (e.g. system quotation, nda, contracts) to Fabric.js Canvas pages.
 * Ensures that any duplicated or block-based template renders rich, interactive canvas objects in Template Studio.
 */

import nda from "./nda/content.js";
import partner from "./partner/content.js";
import dist from "./distributor/content.js";

const FONT_FAMILY = "'Noto Sans Thai', 'Noto Sans', sans-serif";

/**
 * Synthesizes Fabric canvas pages from a template's blocks or metadata.
 * @param {Object} template
 * @returns {Array<{ id: string, json: string }>}
 */
export function synthesizeCanvasPagesFromTemplate(template) {
  if (!template) return [];

  // If template already has valid pages with canvas objects, keep them
  if (Array.isArray(template.pages) && template.pages.length > 0) {
    const firstPage = template.pages[0];
    if (firstPage?.json) {
      try {
        const parsed = typeof firstPage.json === "string" ? JSON.parse(firstPage.json) : firstPage.json;
        if (Array.isArray(parsed?.objects) && parsed.objects.length > 0) {
          return template.pages;
        }
      } catch (e) {
        // Continue to synthesize if invalid json
      }
    }
  }

  const categoryId = (template.categoryId || "").toLowerCase();
  const templateId = (template.id || "").toLowerCase();
  const name = (template.name || "").toLowerCase();

  // 1. QUOTATION TEMPLATE
  if (categoryId === "quotation" || templateId.includes("quotation") || name.includes("เสนอราคา") || name.includes("quotation")) {
    return [
      {
        id: "page-1",
        json: JSON.stringify({
          version: "6.9.1",
          objects: [
            // ── 1. Top Decorative Green Wave Background (bg1.png) ──
            {
              type: "image",
              src: "/bg1.png",
              left: 0,
              top: 0,
              width: 1774,
              height: 887,
              scaleX: 794 / 1774,
              scaleY: 115 / 887,
              originX: "left",
              originY: "top",
              selectable: false,
              evented: false,
            },

            // ── 2. Crest Zendo Logo (quotation.png) ──
            {
              type: "image",
              src: "/quotation.png",
              left: 56,
              top: 22,
              width: 138,
              height: 90,
              scaleX: 62 / 90,
              scaleY: 62 / 90,
              originX: "left",
              originY: "top",
              selectable: true,
            },

            // ── 3. Company Header (4 Uniform Rows) ──
            {
              type: "textbox",
              left: 165,
              top: 24,
              width: 310,
              text: "CREST ZENDO CO., LTD.",
              fontSize: 12,
              fontWeight: "bold",
              fill: "#111827",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 165,
              top: 40,
              width: 310,
              text: "บริษัท เครสท์ เซนโด จำกัด",
              fontSize: 12,
              fontWeight: "bold",
              fill: "#111827",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 165,
              top: 57,
              width: 310,
              text: "The Connect 37, 8/40 Soi Chang Akat Uthit 10 Yaek 1-2, Donmueang, Bangkok 10210",
              fontSize: 8.5,
              fill: "#4B5563",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 165,
              top: 72,
              width: 140,
              text: "เลขประจำตัวผู้เสียภาษีอากร:",
              fontSize: 9.5,
              fill: "#4B5563",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "rect",
              left: 308,
              top: 72,
              width: 84,
              height: 16,
              rx: 8,
              ry: 8,
              fill: "#0F4C35",
            },
            {
              type: "textbox",
              left: 308,
              top: 73,
              width: 84,
              text: "0105558073755",
              fontSize: 9,
              fontWeight: "bold",
              fill: "#FFFFFF",
              textAlign: "center",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 396,
              top: 72,
              width: 80,
              text: "(สำนักงานใหญ่)",
              fontSize: 9.5,
              fill: "#4B5563",
              fontFamily: FONT_FAMILY,
            },

            // ── 4. Document Title: QUOTATION (Right Aligned) ──
            {
              type: "textbox",
              left: 480,
              top: 30,
              width: 258,
              text: "QUOTATION",
              textAlign: "right",
              fontSize: 32,
              fontWeight: "900",
              fill: "#0F4C35",
              fontFamily: FONT_FAMILY,
            },

            // ── 5. Two-Column Metadata Grid (5 Symmetric Rows) ──
            // Left Column (Bill To)
            {
              type: "textbox",
              left: 56,
              top: 104,
              width: 62,
              text: "To",
              fontSize: 11,
              fontWeight: "bold",
              fill: "#0F4C35",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 120,
              top: 104,
              width: 260,
              text: "{{customer_name}}",
              fontSize: 11,
              fill: "#1F2937",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 56,
              top: 125,
              width: 62,
              text: "Attn.",
              fontSize: 11,
              fontWeight: "bold",
              fill: "#0F4C35",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 120,
              top: 125,
              width: 260,
              text: "{{contact_person}}",
              fontSize: 11,
              fill: "#1F2937",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 56,
              top: 146,
              width: 62,
              text: "End User",
              fontSize: 11,
              fontWeight: "bold",
              fill: "#0F4C35",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 120,
              top: 146,
              width: 260,
              text: "{{end_user}}",
              fontSize: 11,
              fill: "#1F2937",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 56,
              top: 167,
              width: 62,
              text: "Subject",
              fontSize: 11,
              fontWeight: "bold",
              fill: "#0F4C35",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 120,
              top: 167,
              width: 260,
              text: "{{subject}}",
              fontSize: 11,
              fill: "#1F2937",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 56,
              top: 188,
              width: 62,
              text: "AM",
              fontSize: 11,
              fontWeight: "bold",
              fill: "#0F4C35",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 120,
              top: 188,
              width: 260,
              text: "{{am_name}}",
              fontSize: 11,
              fill: "#1F2937",
              fontFamily: FONT_FAMILY,
            },

            // Right Column (Metadata)
            {
              type: "textbox",
              left: 450,
              top: 104,
              width: 110,
              text: "Quotation No.",
              fontSize: 11,
              fontWeight: "bold",
              fill: "#0F4C35",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "rect",
              left: 588,
              top: 102,
              width: 114,
              height: 20,
              rx: 4,
              ry: 4,
              fill: "#0F4C35",
            },
            {
              type: "textbox",
              left: 588,
              top: 104,
              width: 114,
              text: "{{quotation_no}}",
              fontSize: 11,
              fontWeight: "bold",
              fill: "#FFFFFF",
              textAlign: "center",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "rect",
              left: 708,
              top: 102,
              width: 30,
              height: 20,
              rx: 4,
              ry: 4,
              fill: "#0F4C35",
            },
            {
              type: "textbox",
              left: 708,
              top: 104,
              width: 30,
              text: "01",
              fontSize: 11,
              fontWeight: "bold",
              fill: "#FFFFFF",
              textAlign: "center",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 450,
              top: 125,
              width: 110,
              text: "Quotation Date",
              fontSize: 11,
              fontWeight: "bold",
              fill: "#0F4C35",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 570,
              top: 125,
              width: 168,
              text: "{{date}}",
              fontSize: 11,
              fill: "#1F2937",
              textAlign: "right",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 450,
              top: 146,
              width: 110,
              text: "Price Validity",
              fontSize: 11,
              fontWeight: "bold",
              fill: "#0F4C35",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 570,
              top: 146,
              width: 168,
              text: "30 days",
              fontSize: 11,
              fill: "#1F2937",
              textAlign: "right",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 450,
              top: 167,
              width: 110,
              text: "Delivery Term",
              fontSize: 11,
              fontWeight: "bold",
              fill: "#0F4C35",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 570,
              top: 167,
              width: 168,
              text: "7 days",
              fontSize: 11,
              fill: "#1F2937",
              textAlign: "right",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 450,
              top: 188,
              width: 110,
              text: "Credit Term",
              fontSize: 11,
              fontWeight: "bold",
              fill: "#0F4C35",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 570,
              top: 188,
              width: 168,
              text: "30 days",
              fontSize: 11,
              fill: "#1F2937",
              textAlign: "right",
              fontFamily: FONT_FAMILY,
            },

            // ── 6. Authentic 5-Column Pricing Table (DocTable) ──
            {
              type: "DocTable",
              isDocTable: true,
              left: 56,
              top: 220,
              originX: "left",
              originY: "top",
              scaleX: 1,
              scaleY: 1,
              angle: 0,
              docTableData: {
                width: 682,
                themeColor: "#0F4C35",
                vatRate: 7,
                cols: [
                  { title: "PRODUCT CODE", width: 105, align: "left" },
                  { title: "DESCRIPTION", width: 330, align: "left" },
                  { title: "QTY", width: 40, align: "center" },
                  { title: "PRICE", width: 105, align: "right" },
                  { title: "AMOUNT", width: 102, align: "right" },
                ],
                items: [
                  {
                    no: "CZ-001",
                    desc: "บริการจัดทำและพัฒนาระบบเอกสารดิจิทัล Enterprise",
                    qty: 1,
                    price: 45000,
                  },
                  {
                    no: "CZ-002",
                    desc: "แพ็กเกจพื้นที่จัดเก็บข้อมูลบนคลาวด์และระบบรักษาความปลอดภัย",
                    qty: 1,
                    price: 15000,
                  },
                  {
                    no: "CZ-003",
                    desc: "บริการฝึกอบรมการใช้งานและสนับสนุนทางเทคนิครายปี (SLA 99.9%)",
                    qty: 1,
                    price: 12000,
                  },
                ],
              },
            },

            // ── 7. Remarks Section ──
            {
              type: "textbox",
              left: 56,
              top: 435,
              width: 120,
              text: "Remarks :",
              fontSize: 10.5,
              fontWeight: "bold",
              fill: "#1F2937",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 66,
              top: 454,
              width: 672,
              text: "• Payment: Annually\n• กำหนดยืนราคา 30 วันนับจากวันที่ออกใบเสนอราคา\n• ราคานี้ยังไม่รวมภาษีมูลค่าเพิ่ม 7% (VAT Excluded)",
              fontSize: 10,
              lineHeight: 1.45,
              fill: "#DC2626",
              fontFamily: FONT_FAMILY,
            },

            // ── 8. Bottom 3-Column Summary & Signatures Block ──
            // Box 1: Best regards, (Issuer Info)
            {
              type: "rect",
              left: 56,
              top: 860,
              width: 216,
              height: 180,
              fill: "#FFFFFF",
              stroke: "#E5E7EB",
              strokeWidth: 1,
              rx: 6,
              ry: 6,
            },
            {
              type: "textbox",
              left: 68,
              top: 870,
              width: 192,
              text: "Best regards,",
              fontSize: 11,
              fontWeight: "bold",
              fill: "#0F4C35",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 192,
              y2: 0,
              left: 68,
              top: 890,
              stroke: "#F3F4F6",
              strokeWidth: 1,
            },
            {
              type: "textbox",
              left: 68,
              top: 900,
              width: 192,
              text: "Narin Rattanavajij (PoP)\nManaging Director\ncontact@crestzendo.com\n+6682-44-686-95",
              fontSize: 10,
              lineHeight: 1.5,
              fill: "#374151",
              fontFamily: FONT_FAMILY,
            },

            // Box 2: Customer Approval
            {
              type: "rect",
              left: 286,
              top: 860,
              width: 216,
              height: 180,
              fill: "#FFFFFF",
              stroke: "#E5E7EB",
              strokeWidth: 1,
              rx: 6,
              ry: 6,
            },
            {
              type: "textbox",
              left: 298,
              top: 870,
              width: 192,
              text: "Customer Approval",
              fontSize: 11,
              fontWeight: "bold",
              fill: "#0F4C35",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 192,
              y2: 0,
              left: 298,
              top: 890,
              stroke: "#F3F4F6",
              strokeWidth: 1,
            },
            {
              type: "textbox",
              left: 298,
              top: 920,
              width: 192,
              text: "ลงชื่อ ................................................\n( {{customer_signatory_name}} )\nวันที่: ...... / ...... / ......",
              fontSize: 10,
              textAlign: "center",
              lineHeight: 1.7,
              fill: "#4B5563",
              fontFamily: FONT_FAMILY,
            },

            // Box 3: PRICE SUMMARY
            {
              type: "rect",
              left: 516,
              top: 860,
              width: 222,
              height: 180,
              fill: "#F9FAFB",
              stroke: "#E5E7EB",
              strokeWidth: 1,
              rx: 6,
              ry: 6,
            },
            {
              type: "rect",
              left: 516,
              top: 860,
              width: 222,
              height: 26,
              fill: "#0F4C35",
              rx: 6,
              ry: 6,
            },
            {
              type: "textbox",
              left: 516,
              top: 866,
              width: 222,
              text: "PRICE SUMMARY",
              fontSize: 10.5,
              fontWeight: "bold",
              fill: "#FFFFFF",
              textAlign: "center",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 526,
              top: 896,
              width: 202,
              text: "SUBTOTAL:                    72,000.00 THB\nSpecial Discount:                   0.00 THB\nTOTAL (After Disc.):     72,000.00 THB\nVAT (7%):                        5,040.00 THB\nGRAND TOTAL:            77,040.00 THB",
              fontSize: 10,
              lineHeight: 1.6,
              fill: "#1F2937",
              fontFamily: FONT_FAMILY,
            },
          ],
        }),
      },
    ];
  }

  // Helper: Header objects
  const createHeaderObjects = (companyName, companyNameEn, taxId, address, phone, email) => [
    {
      type: "image",
      src: "/quotation.png",
      left: 56,
      top: 36,
      width: 138,
      height: 90,
      scaleX: 52 / 90,
      scaleY: 52 / 90,
      originX: "left",
      originY: "top",
      selectable: true,
    },
    {
      type: "textbox",
      left: 125,
      top: 36,
      width: 350,
      text: companyName || "บริษัท เครสท์ เซนโด จำกัด",
      fontSize: 12.5,
      fontWeight: "bold",
      fill: "#111827",
      fontFamily: FONT_FAMILY,
    },
    {
      type: "textbox",
      left: 125,
      top: 54,
      width: 350,
      text: companyNameEn || "CREST ZENDO CO., LTD.",
      fontSize: 10,
      fontWeight: "bold",
      fill: "#4B5563",
      fontFamily: FONT_FAMILY,
    },
    {
      type: "textbox",
      left: 125,
      top: 70,
      width: 350,
      text: `เลขประจำตัวผู้เสียภาษี: ${taxId || "0105558073755"}`,
      fontSize: 9.5,
      fill: "#6B7280",
      fontFamily: FONT_FAMILY,
    },
    {
      type: "textbox",
      left: 490,
      top: 36,
      width: 248,
      text: `${address || "8/40 The Connect 37 แขวงดอนเมือง เขตดอนเมือง กทม. 10210"}\nโทร: ${phone || "02-123-4567"} | ${email || "contact@crestzendo.com"}`,
      fontSize: 9,
      textAlign: "right",
      lineHeight: 1.4,
      fill: "#6B7280",
      fontFamily: FONT_FAMILY,
    },
    {
      type: "line",
      left: 56,
      top: 96,
      width: 682,
      stroke: "#E2E8F0",
      strokeWidth: 1.5,
    },
  ];

  // Helper: Section Formatter
  const formatSectionObjects = (sec, startTop) => {
    const objs = [];
    let top = startTop;

    if (sec.title) {
      objs.push({
        type: "textbox",
        left: 56,
        top: top,
        width: 682,
        text: sec.title,
        fontSize: 12.5,
        fontWeight: "bold",
        fill: "#1E293B",
        fontFamily: FONT_FAMILY,
      });
      top += 24;
    }

    if (sec.intro) {
      objs.push({
        type: "textbox",
        left: 56,
        top: top,
        width: 682,
        text: sec.intro,
        fontSize: 10,
        lineHeight: 1.5,
        fill: "#334155",
        fontFamily: FONT_FAMILY,
      });
      top += 22;
    }

    if (Array.isArray(sec.subClauses) && sec.subClauses.length > 0) {
      const text = sec.subClauses.join("\n\n");
      objs.push({
        type: "textbox",
        left: 56,
        top: top,
        width: 682,
        text: text,
        fontSize: 10,
        lineHeight: 1.5,
        fill: "#334155",
        fontFamily: FONT_FAMILY,
      });
      top += sec.subClauses.length * 32;
    }

    if (Array.isArray(sec.distributorObligations) && sec.distributorObligations.length > 0) {
      objs.push({
        type: "textbox",
        left: 56,
        top: top,
        width: 682,
        text: "หน้าที่และความรับผิดชอบของผู้จัดจำหน่ายหลัก:\n" + sec.distributorObligations.map((o) => `• ${o}`).join("\n"),
        fontSize: 9.5,
        lineHeight: 1.45,
        fill: "#334155",
        fontFamily: FONT_FAMILY,
      });
      top += sec.distributorObligations.length * 24 + 18;
    }

    if (Array.isArray(sec.resellerObligations) && sec.resellerObligations.length > 0) {
      objs.push({
        type: "textbox",
        left: 56,
        top: top,
        width: 682,
        text: "หน้าที่และความรับผิดชอบของตัวแทนจำหน่าย:\n" + sec.resellerObligations.map((o) => `• ${o}`).join("\n"),
        fontSize: 9.5,
        lineHeight: 1.45,
        fill: "#334155",
        fontFamily: FONT_FAMILY,
      });
      top += sec.resellerObligations.length * 24 + 18;
    }

    if (Array.isArray(sec.bullets) && sec.bullets.length > 0) {
      objs.push({
        type: "textbox",
        left: 70,
        top: top,
        width: 668,
        text: sec.bullets.map((b) => `• ${b}`).join("\n"),
        fontSize: 10,
        lineHeight: 1.45,
        fill: "#334155",
        fontFamily: FONT_FAMILY,
      });
      top += sec.bullets.length * 22;
    }

    if (sec.content) {
      objs.push({
        type: "textbox",
        left: 56,
        top: top,
        width: 682,
        text: sec.content,
        fontSize: 10,
        lineHeight: 1.5,
        fill: "#334155",
        fontFamily: FONT_FAMILY,
      });
      top += 30;
    }

    return { objs, nextTop: top + 14 };
  };

  // Helper: Signatures Box
  const createSignaturesObjects = (p1Name, p1Role, p2Name, p2Role, top = 880) => [
    {
      type: "line",
      left: 56,
      top: top,
      width: 682,
      stroke: "#E2E8F0",
      strokeWidth: 1,
    },
    {
      type: "textbox",
      left: 56,
      top: top + 18,
      width: 310,
      text: `ลงนาม${p1Role || "ฝ่ายที่หนึ่ง"}:\n\n\n........................................................\n( ${p1Name || "{{our_signatory_name}}"} )\nตำแหน่ง: {{our_signatory_position}}`,
      fontSize: 10.5,
      lineHeight: 1.55,
      fill: "#475569",
      fontFamily: FONT_FAMILY,
    },
    {
      type: "textbox",
      left: 428,
      top: top + 18,
      width: 310,
      text: `ลงนาม${p2Role || "ฝ่ายที่สอง"}:\n\n\n........................................................\n( ${p2Name || "{{counterparty_signatory_name}}"} )\nตำแหน่ง: {{counterparty_signatory_position}}`,
      fontSize: 10.5,
      lineHeight: 1.55,
      fill: "#475569",
      fontFamily: FONT_FAMILY,
    },
  ];

  // 2. NDA / CONTRACT TEMPLATE (4 Pages Full)
  const isNdaTemplate = categoryId === "nda"
    || templateId === "nda"
    || templateId.includes("-nda-")
    || templateId.startsWith("nda-")
    || name.includes("ไม่เปิดเผยข้อมูล")
    || name.includes("nda");
  if (isNdaTemplate) {
    // Page 1: Header + Title + Preamble + Sec 1 & 2
    const p1Objs = [
      ...createHeaderObjects(),
      {
        type: "textbox",
        left: 56,
        top: 112,
        width: 682,
        text: `${nda.title?.titleTh || "หนังสือสัญญาไม่เปิดเผยข้อมูล"}\n${nda.title?.titleEn || "(NON-DISCLOSURE AGREEMENT - NDA)"}`,
        fontSize: 16,
        fontWeight: "bold",
        fill: "#1E293B",
        textAlign: "center",
        lineHeight: 1.35,
        fontFamily: FONT_FAMILY,
      },
      {
        type: "textbox",
        left: 56,
        top: 168,
        width: 682,
        text: `สัญญานี้ทำขึ้น ณ {{contract_location}} เมื่อวันที่ {{contract_date_day}} {{contract_date_month}} {{contract_date_year}}\nระหว่าง {{our_company_name}} ("ผู้เปิดเผยข้อมูล") ฝ่ายหนึ่ง\nกับ {{counterparty_name}} สำนักงานตั้งอยู่เลขที่ {{counterparty_address}} ("ผู้รับข้อมูล") อีกฝ่ายหนึ่ง\n\n${nda.preamble?.recital || ""}`,
        fontSize: 10,
        lineHeight: 1.55,
        fill: "#334155",
        fontFamily: FONT_FAMILY,
      },
    ];
    let curTop = 330;
    const s1 = formatSectionObjects(nda.sections[0] || {}, curTop);
    p1Objs.push(...s1.objs);
    const s2 = formatSectionObjects(nda.sections[1] || {}, s1.nextTop);
    p1Objs.push(...s2.objs);

    // Page 2: Sec 3, 4, 5, 6
    const p2Objs = [];
    curTop = 56;
    [2, 3, 4, 5].forEach((idx) => {
      if (nda.sections[idx]) {
        const s = formatSectionObjects(nda.sections[idx], curTop);
        p2Objs.push(...s.objs);
        curTop = s.nextTop;
      }
    });

    // Page 3: Sec 7, 8, 9, 10, 11, 12
    const p3Objs = [];
    curTop = 56;
    [6, 7, 8, 9, 10, 11].forEach((idx) => {
      if (nda.sections[idx]) {
        const s = formatSectionObjects(nda.sections[idx], curTop);
        p3Objs.push(...s.objs);
        curTop = s.nextTop;
      }
    });

    // Page 4: Sec 13 + Witness + Dual Signatures
    const p4Objs = [];
    curTop = 56;
    if (nda.sections[12]) {
      const s = formatSectionObjects(nda.sections[12], curTop);
      p4Objs.push(...s.objs);
      curTop = s.nextTop;
    }
    p4Objs.push({
      type: "textbox",
      left: 56,
      top: curTop + 10,
      width: 682,
      text: nda.witnessStatement || "สัญญานี้ทำขึ้นเป็นสองฉบับมีข้อความถูกต้องตรงกัน คู่สัญญาทั้งสองฝ่ายได้อ่านและเข้าใจข้อความโดยละเอียดตลอดแล้ว จึงได้ลงลายมือชื่อไว้เป็นหลักฐานต่อหน้าพยาน",
      fontSize: 10,
      lineHeight: 1.55,
      fill: "#334155",
      fontFamily: FONT_FAMILY,
    });
    p4Objs.push(...createSignaturesObjects("{{our_signatory_name}}", "ผู้เปิดเผยข้อมูล", "{{counterparty_signatory_name}}", "ผู้รับข้อมูล", 680));

    return [p1Objs, p2Objs, p3Objs, p4Objs].map((objs, idx) => ({
      id: `page-${idx + 1}`,
      json: JSON.stringify({ version: "6.9.1", objects: objs }),
    }));
  }

  // 3. PARTNER AGREEMENT TEMPLATE (5 Pages Full)
  const isPartnerTemplate = categoryId === "partner"
    || templateId === "partner"
    || templateId.includes("-partner-")
    || templateId.startsWith("partner-")
    || name.includes("พันธมิตร")
    || name.includes("partner");
  if (isPartnerTemplate) {
    // Page 1: Header + Title + Preamble + Sec 1 (Definitions)
    const p1Objs = [
      ...createHeaderObjects(),
      {
        type: "textbox",
        left: 56,
        top: 112,
        width: 682,
        text: `${partner.title?.titleTh || "สัญญาแต่งตั้งพันธมิตรตัวแทนจำหน่าย"}\n${partner.title?.titleEn || "(Partner Agreement)"}`,
        fontSize: 16,
        fontWeight: "bold",
        fill: "#1E293B",
        textAlign: "center",
        lineHeight: 1.35,
        fontFamily: FONT_FAMILY,
      },
      {
        type: "textbox",
        left: 56,
        top: 168,
        width: 682,
        text: `สัญญาฉบับนี้ทำขึ้น ณ วันที่ {{contract_date_day}} เดือน {{contract_date_month}} พ.ศ. {{contract_date_year}}\nระหว่าง บริษัท เครสท์ เซนโด จำกัด ("ผู้จัดจำหน่ายหลัก / Distributor") ฝ่ายหนึ่ง\nกับ {{counterparty_name}} ("ตัวแทนจำหน่าย / Reseller") อีกฝ่ายหนึ่ง\n\n${partner.preamble?.recital || ""}`,
        fontSize: 10,
        lineHeight: 1.55,
        fill: "#334155",
        fontFamily: FONT_FAMILY,
      },
    ];
    if (partner.sections[0]) {
      const s1 = formatSectionObjects(partner.sections[0], 310);
      p1Objs.push(...s1.objs);
    }

    // Page 2: Sec 2 (Scope & Territory) + Sec 3 (Obligations)
    const p2Objs = [];
    let curTop = 56;
    [1, 2].forEach((idx) => {
      if (partner.sections[idx]) {
        const s = formatSectionObjects(partner.sections[idx], curTop);
        p2Objs.push(...s.objs);
        curTop = s.nextTop;
      }
    });

    // Page 3: Sec 4 (Licensing) + Sec 5 (Pricing) + Sec 6 (Deal Reg) + Sec 7 (Term)
    const p3Objs = [];
    curTop = 56;
    [3, 4, 5, 6].forEach((idx) => {
      if (partner.sections[idx]) {
        const s = formatSectionObjects(partner.sections[idx], curTop);
        p3Objs.push(...s.objs);
        curTop = s.nextTop;
      }
    });

    // Page 4: Sec 8 (Confidentiality) + Sec 9 (Indemnification) + Sec 10 (Force Majeure) + Sec 11 (Law)
    const p4Objs = [];
    curTop = 56;
    [7, 8, 9, 10].forEach((idx) => {
      if (partner.sections[idx]) {
        const s = formatSectionObjects(partner.sections[idx], curTop);
        p4Objs.push(...s.objs);
        curTop = s.nextTop;
      }
    });

    // Page 5: Sec 12 (Misc) + Witness + Dual Signatures
    const p5Objs = [];
    curTop = 56;
    if (partner.sections[11]) {
      const s = formatSectionObjects(partner.sections[11], curTop);
      p5Objs.push(...s.objs);
      curTop = s.nextTop;
    }
    p5Objs.push({
      type: "textbox",
      left: 56,
      top: curTop + 10,
      width: 682,
      text: partner.witnessStatement || "สัญญานี้ทำขึ้นเป็นสองฉบับมีข้อความถูกต้องตรงกัน คู่สัญญาทั้งสองฝ่ายได้อ่านและเข้าใจข้อความโดยละเอียดตลอดแล้ว จึงได้ลงลายมือชื่อไว้เป็นหลักฐานต่อหน้าพยาน",
      fontSize: 10,
      lineHeight: 1.55,
      fill: "#334155",
      fontFamily: FONT_FAMILY,
    });
    p5Objs.push(...createSignaturesObjects("{{our_signatory_name}}", "ผู้จัดจำหน่ายหลัก (Distributor)", "{{counterparty_signatory_name}}", "ตัวแทนจำหน่าย (Reseller)", 680));

    return [p1Objs, p2Objs, p3Objs, p4Objs, p5Objs].map((objs, idx) => ({
      id: `page-${idx + 1}`,
      json: JSON.stringify({ version: "6.9.1", objects: objs }),
    }));
  }

  // 4. DISTRIBUTOR AGREEMENT TEMPLATE (5 Pages Full)
  const isDistributorTemplate = categoryId === "distributor"
    || templateId === "distributor"
    || templateId.includes("-distributor-")
    || templateId.startsWith("distributor-")
    || name.includes("จัดจำหน่าย")
    || name.includes("distributor");
  if (isDistributorTemplate) {
    // Page 1: Header + Title + Preamble + Sec 1
    const p1Objs = [
      ...createHeaderObjects(),
      {
        type: "textbox",
        left: 56,
        top: 112,
        width: 682,
        text: `${dist.title?.titleTh || "สัญญาแต่งตั้งและจัดจำหน่ายซอฟต์แวร์"}\n${dist.title?.titleEn || "(Distributor Agreement)"}`,
        fontSize: 16,
        fontWeight: "bold",
        fill: "#1E293B",
        textAlign: "center",
        lineHeight: 1.35,
        fontFamily: FONT_FAMILY,
      },
      {
        type: "textbox",
        left: 56,
        top: 168,
        width: 682,
        text: `สัญญาฉบับนี้ทำขึ้น ณ วันที่ {{contract_date_day}} เดือน {{contract_date_month}} พ.ศ. {{contract_date_year}}\nระหว่าง {{counterparty_name}} ("เจ้าของผลิตภัณฑ์ / Vendor") ฝ่ายหนึ่ง\nกับ บริษัท เครสท์ เซนโด จำกัด ("ผู้จัดจำหน่ายหลัก / Distributor") อีกฝ่ายหนึ่ง\n\n${dist.preamble?.recital || ""}`,
        fontSize: 10,
        lineHeight: 1.55,
        fill: "#334155",
        fontFamily: FONT_FAMILY,
      },
    ];
    if (dist.sections[0]) {
      const s1 = formatSectionObjects(dist.sections[0], 310);
      p1Objs.push(...s1.objs);
    }

    // Page 2: Sec 2 (Orders & Payment) + Sec 3 (Marketing & Support)
    const p2Objs = [];
    let curTop = 56;
    [1, 2].forEach((idx) => {
      if (dist.sections[idx]) {
        const s = formatSectionObjects(dist.sections[idx], curTop);
        p2Objs.push(...s.objs);
        curTop = s.nextTop;
      }
    });

    // Page 3: Sec 4 (IP) + Sec 5 (Confidentiality)
    const p3Objs = [];
    curTop = 56;
    [3, 4].forEach((idx) => {
      if (dist.sections[idx]) {
        const s = formatSectionObjects(dist.sections[idx], curTop);
        p3Objs.push(...s.objs);
        curTop = s.nextTop;
      }
    });

    // Page 4: Sec 6 (Term & Termination) + Sec 7 (Warranties)
    const p4Objs = [];
    curTop = 56;
    [5, 6].forEach((idx) => {
      if (dist.sections[idx]) {
        const s = formatSectionObjects(dist.sections[idx], curTop);
        p4Objs.push(...s.objs);
        curTop = s.nextTop;
      }
    });

    // Page 5: Sec 8 (Governing Law) + Witness + Dual Signatures
    const p5Objs = [];
    curTop = 56;
    if (dist.sections[7]) {
      const s = formatSectionObjects(dist.sections[7], curTop);
      p5Objs.push(...s.objs);
      curTop = s.nextTop;
    }
    p5Objs.push({
      type: "textbox",
      left: 56,
      top: curTop + 10,
      width: 682,
      text: dist.witnessStatement || "สัญญานี้ทำขึ้นเป็นสองฉบับมีข้อความถูกต้องตรงกัน คู่สัญญาทั้งสองฝ่ายได้อ่านและเข้าใจข้อความโดยละเอียดตลอดแล้ว จึงได้ลงลายมือชื่อไว้เป็นหลักฐานต่อหน้าพยาน",
      fontSize: 10,
      lineHeight: 1.55,
      fill: "#334155",
      fontFamily: FONT_FAMILY,
    });
    p5Objs.push(...createSignaturesObjects("{{our_signatory_name}}", "ผู้จัดจำหน่าย (Distributor)", "{{counterparty_signatory_name}}", "เจ้าของผลิตภัณฑ์ (Vendor)", 680));

    return [p1Objs, p2Objs, p3Objs, p4Objs, p5Objs].map((objs, idx) => ({
      id: `page-${idx + 1}`,
      json: JSON.stringify({ version: "6.9.1", objects: objs }),
    }));
  }

  // 5. NOTIFICATION LETTER TEMPLATE
  if (categoryId === "notification" || templateId.includes("notification") || name.includes("หนังสือแจ้ง")) {
    return [
      {
        id: "page-1",
        json: JSON.stringify({
          version: "6.9.1",
          objects: [
            {
              type: "textbox",
              left: 56,
              top: 56,
              width: 682,
              text: "บริษัท เครสท์ เซนโด จำกัด\nCREST ZENDO CO., LTD.",
              fontSize: 16,
              fontWeight: "bold",
              fill: "#1E293B",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "line",
              left: 56,
              top: 115,
              width: 682,
              stroke: "#E2E8F0",
              strokeWidth: 1.5,
            },
            {
              type: "textbox",
              left: 56,
              top: 135,
              width: 682,
              text: "หนังสือแจ้งเปลี่ยนแปลงที่ตั้งสำนักงานใหญ่\nNOTICE OF HEAD OFFICE RELOCATION",
              fontSize: 16,
              fontWeight: "bold",
              textAlign: "center",
              fill: "#1E40AF",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 56,
              top: 200,
              width: 682,
              text: "เรียน: ท่านคู่ค้า ลูกค้า และพันธมิตรทางธุรกิจทุกท่าน\nเรื่อง: ขอแจ้งเปลี่ยนแปลงสถานที่ตั้งสำนักงานใหญ่แห่งใหม่",
              fontSize: 12,
              lineHeight: 1.6,
              fill: "#334155",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "rect",
              left: 56,
              top: 280,
              width: 682,
              height: 120,
              fill: "#F8FAFC",
              stroke: "#CBD5E1",
              strokeWidth: 1,
              rx: 8,
              ry: 8,
            },
            {
              type: "textbox",
              left: 76,
              top: 295,
              width: 642,
              text: "ที่อยู่สำนักงานใหญ่เดิม:\n{{prev_address_th}}\n\nที่อยู่สำนักงานใหญ่แห่งใหม่ (มีผลตั้งแต่วันที่ {{effective_date_th}}):\n{{new_address_th}}",
              fontSize: 11.5,
              lineHeight: 1.5,
              fill: "#1E293B",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 400,
              top: 550,
              width: 338,
              text: "ขอแสดงความนับถืออย่างสูง\n\n\n........................................................\n( {{signatory_name}} )\n{{signatory_title}}\nบริษัท เครสท์ เซนโด จำกัด",
              fontSize: 11,
              textAlign: "center",
              lineHeight: 1.5,
              fill: "#475569",
              fontFamily: FONT_FAMILY,
            },
          ],
        }),
      },
    ];
  }

  // 6. DYNAMIC BLOCKS SYNTHESIZER (For any template with template.blocks)
  if (Array.isArray(template.blocks) && template.blocks.length > 0) {
    const pagesList = [];
    let currentPageObjs = [];
    let currentTop = 56;
    const MAX_PAGE_HEIGHT = 920;

    const finalizeCurrentPage = () => {
      if (currentPageObjs.length > 0) {
        pagesList.push({
          id: `page-${pagesList.length + 1}`,
          json: JSON.stringify({ version: "6.9.1", objects: currentPageObjs }),
        });
        currentPageObjs = [];
        currentTop = 56;
      }
    };

    template.blocks.forEach((block) => {
      const s = block.settings || {};

      if (block.type === "header") {
        if (currentTop + 90 > MAX_PAGE_HEIGHT) finalizeCurrentPage();
        currentPageObjs.push(...createHeaderObjects(s.companyName, s.companyNameEn, s.taxId, s.address, s.phone, s.email, s.logoUrl));
        currentTop += 105;
      } else if (block.type === "doc_title") {
        if (currentTop + 60 > MAX_PAGE_HEIGHT) finalizeCurrentPage();
        currentPageObjs.push({
          type: "textbox",
          left: 56,
          top: currentTop,
          width: 682,
          text: `${s.titleText || template.name || "เอกสาร"}\n${s.subtitleText || ""}`.trim(),
          fontSize: 16,
          fontWeight: "bold",
          fill: "#1E293B",
          textAlign: "center",
          fontFamily: FONT_FAMILY,
        });
        currentTop += 65;
      } else if (block.type === "contract_preamble") {
        if (currentTop + 140 > MAX_PAGE_HEIGHT) finalizeCurrentPage();
        const preambleText = `${s.locationPrefix || "สัญญาฉบับนี้ทำขึ้น ณ"} ${s.locationText || "{{contract_location}}"} ${s.datePrefix || "เมื่อวันที่"} ${s.dateText || "{{contract_date}}"}\n${s.betweenLabel || "ระหว่าง:"} ${s.party1Text || "{{company_name}}"}\n${s.andLabel || "และ"} ${s.party2Text || "{{counterparty_name}}"}\n\n${s.recital || ""}`.trim();
        currentPageObjs.push({
          type: "textbox",
          left: 56,
          top: currentTop,
          width: 682,
          text: preambleText,
          fontSize: 10.5,
          lineHeight: 1.55,
          fill: "#334155",
          fontFamily: FONT_FAMILY,
        });
        currentTop += 130;
      } else if (block.type === "contract_section") {
        if (currentTop + 100 > MAX_PAGE_HEIGHT) finalizeCurrentPage();
        const secRes = formatSectionObjects({
          title: s.title || block.title,
          intro: s.intro,
          subClauses: s.subClauses,
          distributorObligations: s.distributorObligations,
          resellerObligations: s.resellerObligations,
          bullets: s.bullets,
          content: s.content,
        }, currentTop);
        currentPageObjs.push(...secRes.objs);
        currentTop = secRes.nextTop;
      } else if (block.type === "text_block") {
        if (currentTop + 50 > MAX_PAGE_HEIGHT) finalizeCurrentPage();
        currentPageObjs.push({
          type: "textbox",
          left: 56,
          top: currentTop,
          width: 682,
          text: s.content || block.title || "",
          fontSize: 10.5,
          lineHeight: 1.55,
          fill: "#334155",
          fontFamily: FONT_FAMILY,
        });
        currentTop += 50;
      } else if (block.type === "signatures") {
        if (currentTop + 140 > MAX_PAGE_HEIGHT) finalizeCurrentPage();
        const slots = s.slots || [];
        const p1 = slots[0] || {};
        const p2 = slots[1] || {};
        currentPageObjs.push(...createSignaturesObjects(p1.name, p1.role, p2.name, p2.role, currentTop));
        currentTop += 140;
      }
    });

    finalizeCurrentPage();

    if (pagesList.length > 0) {
      return pagesList;
    }
  }

  // 7. GENERIC CONTRACT / AGREEMENT TEMPLATE (Default Fallback)
  return [
    {
      id: "page-1",
      json: JSON.stringify({
        version: "6.9.1",
        objects: [
          {
            type: "textbox",
            left: 56,
            top: 56,
            width: 682,
            text: template.name || "สัญญาและข้อตกลง (Agreement)",
            fontSize: 18,
            fontWeight: "bold",
            fill: "#1E293B",
            textAlign: "center",
            fontFamily: FONT_FAMILY,
          },
          {
            type: "line",
            left: 56,
            top: 105,
            width: 682,
            stroke: "#E2E8F0",
            strokeWidth: 1.5,
          },
          {
            type: "textbox",
            left: 56,
            top: 130,
            width: 682,
            text: "สัญญานี้ทำขึ้นเมื่อวันที่ {{contract_date_day}} {{contract_date_month}} {{contract_date_year}}\nระหว่าง {{our_company_name}} กับ {{counterparty_name}}",
            fontSize: 12,
            lineHeight: 1.6,
            fill: "#334155",
            fontFamily: FONT_FAMILY,
          },
          {
            type: "textbox",
            left: 56,
            top: 650,
            width: 300,
            text: "ลงนามฝ่ายที่หนึ่ง:\n\n\n........................................................\n( {{our_signatory_name}} )",
            fontSize: 11,
            fill: "#475569",
            lineHeight: 1.5,
            fontFamily: FONT_FAMILY,
          },
          {
            type: "textbox",
            left: 438,
            top: 650,
            width: 300,
            text: "ลงนามฝ่ายที่สอง:\n\n\n........................................................\n( {{counterparty_signatory_name}} )",
            fontSize: 11,
            fill: "#475569",
            lineHeight: 1.5,
            fontFamily: FONT_FAMILY,
          },
        ],
      }),
    },
  ];
}
