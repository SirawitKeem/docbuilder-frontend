import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pptxgen = require("pptxgenjs");
import { getCanvasPreset } from "../editor/canvasPresets.js";
import { replaceTokens, DEFAULT_SAMPLE_TOKEN_MAP } from "../tokens/tokenEngine.js";
import { mapFontFamilyToPptx } from "../fonts/fontRegistry.js";

/**
 * 🎨 Convert CSS/Hex/RGB color string to PPTX 6-character Hex string (without '#')
 */
export function cleanColor(colorStr, fallback = "000000") {
  if (!colorStr || colorStr === "transparent") return null;
  const str = String(colorStr).trim();
  if (str.startsWith("#")) {
    const hex = str.slice(1);
    if (hex.length === 3) {
      return hex.split("").map((c) => c + c).join("").toUpperCase();
    }
    return hex.slice(0, 6).toUpperCase();
  }
  if (str.startsWith("rgb")) {
    const parts = str.match(/\d+/g);
    if (parts && parts.length >= 3) {
      const r = parseInt(parts[0], 10).toString(16).padStart(2, "0");
      const g = parseInt(parts[1], 10).toString(16).padStart(2, "0");
      const b = parseInt(parts[2], 10).toString(16).padStart(2, "0");
      return (r + g + b).toUpperCase();
    }
  }
  return fallback;
}

/**
 * 🎨 Extract shape fill color for PPTX
 * Supports solid color strings and fabric.Gradient objects.
 * ⚠️ CHECKPOINT (Gradient Fallback): pptxgenjs v4.0.1 does not support OOXML <a:gradFill>
 * and silently ignores { type: "gradient" }, which produces invisible/transparent shapes.
 * Therefore, we extract the primary color stop from the gradient as a clean solid fill fallback.
 */
export function extractShapeColor(fill, fallback = null) {
  if (!fill || fill === "transparent") return null;

  // 1. If fill is an object (fabric.Gradient instance or serialized gradient object)
  if (typeof fill === "object") {
    if (Array.isArray(fill.colorStops) && fill.colorStops.length > 0) {
      // Use the first color stop
      return cleanColor(fill.colorStops[0].color, fallback);
    }
    return fallback;
  }

  // 2. Solid color string
  return cleanColor(fill, fallback);
}

/**
 * 📏 Coordinate Conversion: 96 CSS pixels = 1.0 inch
 */
export const PX_TO_INCH = 1 / 96;

/**
 * 🔤 Font Point Conversion: 96 CSS pixels = 72 pt (pt = px * 0.75)
 */
export function pxToPt(fontSizePx) {
  return Math.max(8, Math.round((Number(fontSizePx) || 16) * 0.75));
}

/**
 * 🇹🇭 Map Web Font to PowerPoint System Font
 * Defaulting to 'Leelawadee UI' guarantees clean modern Thai glyphs across Windows 10/11
 */
export function mapFontFamily(fontFamily) {
  return mapFontFamilyToPptx(fontFamily);
}

/**
 * 📊 Map native DocTable custom Fabric object to native PowerPoint Table (Option ก)
 */
function mapDocTableToPptx(obj, slide, pptx, tokenMap) {
  const data = obj.docTableData || {};
  const {
    items = [],
    vatRate = 7,
    themeColor = "#2563EB",
    width: tableWidthPx = 682,
  } = data;

  const tableX = (obj.left || 56) * PX_TO_INCH;
  const tableY = (obj.top || 90) * PX_TO_INCH;
  const tableW = tableWidthPx * PX_TO_INCH;

  // 5-Column layout matching DocTable specification (682px total)
  const cols = [
    { title: "ลำดับ", wRatio: 52 / 682, align: "center" },
    { title: "รายการสินค้า / รายละเอียด (Description)", wRatio: 330 / 682, align: "left" },
    { title: "จำนวน", wRatio: 60 / 682, align: "center" },
    { title: "ราคา/หน่วย (บาท)", wRatio: 120 / 682, align: "right" },
    { title: "จำนวนเงิน (บาท)", wRatio: 120 / 682, align: "right" },
  ];

  const colWidths = cols.map((c) => c.wRatio * tableW);
  const headerFill = cleanColor(themeColor, "2563EB");

  const tableRows = [];

  // 1. Header Row
  tableRows.push(
    cols.map((col) => ({
      text: col.title,
      options: {
        bold: true,
        color: "FFFFFF",
        fill: { color: headerFill },
        align: col.align,
        fontSize: 10,
        fontFace: "Leelawadee UI",
        margin: 0.04,
      },
    }))
  );

  // 2. Data Rows with Alternating Zebra Background
  let subtotal = 0;
  const rawItemsList = Array.isArray(items) && items.length > 0 ? items : [
    { no: "1", desc: "บริการพัฒนาระบบคลาวด์", qty: 1, price: 150000 },
  ];

  rawItemsList.forEach((it, idx) => {
    const qty = Number(it.qty) || 1;
    const price = Number(it.price) || 0;
    const amount = qty * price;
    subtotal += amount;

    const rowBg = idx % 2 === 0 ? "FFFFFF" : "F8FAFC";
    const descText = replaceTokens(it.desc || it.title || "", tokenMap);

    tableRows.push([
      {
        text: String(it.no || idx + 1),
        options: { fill: { color: rowBg }, align: "center", fontSize: 9.5, fontFace: "Leelawadee UI", margin: 0.04 },
      },
      {
        text: descText,
        options: { fill: { color: rowBg }, align: "left", fontSize: 9.5, fontFace: "Leelawadee UI", margin: 0.04 },
      },
      {
        text: String(qty),
        options: { fill: { color: rowBg }, align: "center", fontSize: 9.5, fontFace: "Leelawadee UI", margin: 0.04 },
      },
      {
        text: price.toLocaleString("th-TH", { minimumFractionDigits: 2 }),
        options: { fill: { color: rowBg }, align: "right", fontSize: 9.5, fontFace: "Leelawadee UI", margin: 0.04 },
      },
      {
        text: amount.toLocaleString("th-TH", { minimumFractionDigits: 2 }),
        options: { fill: { color: rowBg }, align: "right", bold: true, fontSize: 9.5, fontFace: "Leelawadee UI", margin: 0.04 },
      },
    ]);
  });

  // 3. Summary Rows (Subtotal, VAT, Grand Total)
  const vatAmount = subtotal * (Number(vatRate || 7) / 100);
  const grandTotal = subtotal + vatAmount;

  tableRows.push([
    { text: "", options: { colspan: 3, border: { type: "none" } } },
    { text: "รวมเป็นเงิน (Subtotal):", options: { align: "right", bold: true, fontSize: 9.5, fontFace: "Leelawadee UI", fill: { color: "F1F5F9" }, margin: 0.04 } },
    { text: `${subtotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท`, options: { align: "right", bold: true, fontSize: 9.5, fontFace: "Leelawadee UI", fill: { color: "F1F5F9" }, margin: 0.04 } },
  ]);

  tableRows.push([
    { text: "", options: { colspan: 3, border: { type: "none" } } },
    { text: `ภาษีมูลค่าเพิ่ม (VAT ${vatRate}%):`, options: { align: "right", bold: true, fontSize: 9.5, fontFace: "Leelawadee UI", fill: { color: "F1F5F9" }, margin: 0.04 } },
    { text: `${vatAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท`, options: { align: "right", bold: true, fontSize: 9.5, fontFace: "Leelawadee UI", fill: { color: "F1F5F9" }, margin: 0.04 } },
  ]);

  tableRows.push([
    { text: "", options: { colspan: 3, border: { type: "none" } } },
    { text: "จำนวนเงินรวมทั้งสิ้น (Grand Total):", options: { align: "right", bold: true, fontSize: 10, fontFace: "Leelawadee UI", fill: { color: "E2E8F0" }, color: "1D4ED8", margin: 0.04 } },
    { text: `${grandTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท`, options: { align: "right", bold: true, fontSize: 10, fontFace: "Leelawadee UI", fill: { color: "E2E8F0" }, color: "1D4ED8", margin: 0.04 } },
  ]);

  slide.addTable(tableRows, {
    x: tableX,
    y: tableY,
    w: tableW,
    colW: colWidths,
    border: { pt: 0.5, color: "CBD5E1" },
  });
}

/**
 * 🗺️ Map individual Fabric object to PowerPoint Slide element
 */
export function mapFabricObjectToSlide(obj, slide, pptx, tokenMap = {}, groupOffset = { x: 0, y: 0 }) {
  if (!obj || obj.visible === false) return;

  const scaleX = obj.scaleX || 1;
  const scaleY = obj.scaleY || 1;

  // Calculate Absolute Coordinates (including parent group offsets if inside a group)
  const absLeft = (obj.left + groupOffset.x) * PX_TO_INCH;
  const absTop = (obj.top + groupOffset.y) * PX_TO_INCH;
  const absWidth = (obj.width * scaleX) * PX_TO_INCH;
  const absHeight = (obj.height * scaleY) * PX_TO_INCH;

  // 1. DocTable: Native PowerPoint Table (Option ก)
  if (obj.isDocTable) {
    mapDocTableToPptx(obj, slide, pptx, tokenMap);
    return;
  }

  // 2. Text Objects (textbox, i-text, text)
  if (obj.type === "textbox" || obj.type === "i-text" || obj.type === "text") {
    let rawText = obj.rawTemplateText || obj.text || "";
    const replaced = replaceTokens(rawText, tokenMap);

    slide.addText(replaced, {
      x: absLeft,
      y: absTop,
      w: Math.max(0.2, absWidth),
      h: Math.max(0.2, absHeight),
      fontSize: pxToPt(obj.fontSize),
      fontFace: mapFontFamily(obj.fontFamily),
      // ⚖️ CHECKPOINT (ก): OOXML only supports boolean bold (b="1" / b="0").
      // Weights < 600 snap to normal (bold: false), >= 600 snap to bold (bold: true).
      bold: obj.fontWeight === "bold" || (Number(obj.fontWeight) >= 600),
      italic: obj.fontStyle === "italic",
      color: extractShapeColor(obj.fill, "000000"),
      align: obj.textAlign || "left",
      valign: "top",
      margin: 0, // 🛡️ CRITICAL: margin 0 prevents premature text wrapping
      lineSpacingMultiple: obj.lineHeight || 1.15,
      rotate: obj.angle || 0,
    });
    return;
  }

  // 3. Rectangles & Rounded Cards
  if (obj.type === "rect") {
    const hasRadius = obj.rx && obj.rx > 0;
    const shapeType = hasRadius ? pptx.shapes.ROUNDED_RECTANGLE : pptx.shapes.RECTANGLE;

    const fillColor = extractShapeColor(obj.fill);
    const strokeColor = cleanColor(obj.stroke);

    const shapeOptions = {
      x: absLeft,
      y: absTop,
      w: absWidth,
      h: absHeight,
      rotate: obj.angle || 0,
    };

    if (fillColor) {
      shapeOptions.fill = { color: fillColor };
    } else {
      shapeOptions.fill = { type: "none" };
    }

    if (strokeColor && obj.strokeWidth > 0) {
      shapeOptions.line = {
        color: strokeColor,
        width: Math.max(0.5, (obj.strokeWidth || 1) * 0.75),
        dashType: obj.strokeDashArray ? "dash" : "solid",
      };
    }

    if (hasRadius) {
      shapeOptions.rectRadius = Math.min(0.5, (obj.rx * PX_TO_INCH));
    }

    slide.addShape(shapeType, shapeOptions);
    return;
  }

  // 4. Circles / Ovals
  if (obj.type === "circle") {
    const radius = obj.radius || 20;
    const w = (radius * 2 * scaleX) * PX_TO_INCH;
    const h = (radius * 2 * scaleY) * PX_TO_INCH;
    const fillColor = extractShapeColor(obj.fill);
    const strokeColor = cleanColor(obj.stroke);

    const shapeOptions = {
      x: absLeft,
      y: absTop,
      w,
      h,
      fill: fillColor ? { color: fillColor } : { type: "none" },
      rotate: obj.angle || 0,
    };

    if (strokeColor && obj.strokeWidth > 0) {
      shapeOptions.line = {
        color: strokeColor,
        width: Math.max(0.5, (obj.strokeWidth || 1) * 0.75),
      };
    }

    slide.addShape(pptx.shapes.OVAL, shapeOptions);
    return;
  }

  // 5. Lines
  if (obj.type === "line") {
    const strokeColor = cleanColor(obj.stroke, "94A3B8");
    slide.addShape(pptx.shapes.LINE, {
      x: absLeft,
      y: absTop,
      w: Math.max(0.01, absWidth),
      h: Math.max(0.01, absHeight),
      line: {
        color: strokeColor,
        width: Math.max(0.5, (obj.strokeWidth || 1) * 0.75),
        dashType: obj.strokeDashArray ? "dash" : "solid",
      },
    });
    return;
  }

  // 6. Raster / SVG Images
  if (obj.type === "image") {
    const src = obj.src || (obj._element && obj._element.src);
    if (src && typeof src === "string") {
      slide.addImage({
        data: src,
        x: absLeft,
        y: absTop,
        w: absWidth,
        h: absHeight,
        rotate: obj.angle || 0,
      });
    }
    return;
  }

  // 7. Generic Groups: Calculate Child Coordinates
  if (obj.type === "group" && Array.isArray(obj.objects)) {
    const childOffset = {
      x: (obj.left || 0) + (obj.width ? obj.width / 2 : 0),
      y: (obj.top || 0) + (obj.height ? obj.height / 2 : 0),
    };
    obj.objects.forEach((child) => {
      mapFabricObjectToSlide(child, slide, pptx, tokenMap, childOffset);
    });
    return;
  }

  // 8. Fallback for unmappable complex vector objects
  if (typeof obj.toDataURL === "function") {
    try {
      const dataUrl = obj.toDataURL();
      if (dataUrl) {
        slide.addImage({
          data: dataUrl,
          x: absLeft,
          y: absTop,
          w: absWidth,
          h: absHeight,
          rotate: obj.angle || 0,
        });
      }
    } catch (err) {
      console.warn("Could not rasterize fallback object to PPTX:", err);
    }
  }
}

/**
 * 🚀 Main Export Pipeline: Convert Fabric Template JSON into PowerPoint (.pptx) Presentation
 *
 * @param {Object} template - Template definition containing pages or canvas JSON
 * @param {Object} options - Export options (values, returnType: 'nodebuffer'|'blob'|'base64')
 * @returns {Promise<Buffer|Blob|string>}
 */
export async function exportFabricToPptx(template, options = {}) {
  const { values = {}, returnType = "nodebuffer" } = options;

  const tokenMap = {
    ...DEFAULT_SAMPLE_TOKEN_MAP,
    ...values,
  };

  const pptx = new pptxgen();

  // 1. Resolve Presentation Layout & Dimensions
  const presetId = template?.canvasPreset || (template?.editorType === "slide" ? "slide-16-9" : "a4-portrait");
  const preset = getCanvasPreset(presetId);

  if (preset.id === "slide-16-9") {
    pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 inches (1280x720 px at 96 DPI)
  } else if (preset.id === "a4-landscape") {
    pptx.defineLayout({ name: "A4_LANDSCAPE", width: 11.69, height: 8.27 });
    pptx.layout = "A4_LANDSCAPE";
  } else {
    // Default A4 Portrait
    pptx.defineLayout({ name: "A4_PORTRAIT", width: 8.27, height: 11.69 });
    pptx.layout = "A4_PORTRAIT";
  }

  // Metadata
  pptx.title = template?.name || "Presentation";
  pptx.author = "DocBuilder Studio";

  // 2. Resolve Multi-Slide Pages
  const pages = Array.isArray(template?.pages) && template.pages.length > 0
    ? template.pages
    : [{ id: "page-1", json: template?.canvasJson || template?.json || null }];

  for (let i = 0; i < pages.length; i++) {
    const pageItem = pages[i];
    const pageJson = pageItem.json || pageItem.fabricJson;

    const slide = pptx.addSlide();

    // Background color
    if (template?.theme?.backgroundColor) {
      slide.background = { color: cleanColor(template.theme.backgroundColor, "FFFFFF") };
    }

    if (!pageJson) continue;

    const parsedJson = typeof pageJson === "string" ? JSON.parse(pageJson) : pageJson;

    if (parsedJson.background) {
      const bg = cleanColor(parsedJson.background);
      if (bg) slide.background = { color: bg };
    }

    const objects = parsedJson.objects || [];

    for (const obj of objects) {
      mapFabricObjectToSlide(obj, slide, pptx, tokenMap);
    }
  }

  // 3. Generate Output in Requested Format
  return await pptx.write({ outputType: returnType });
}

export default exportFabricToPptx;
