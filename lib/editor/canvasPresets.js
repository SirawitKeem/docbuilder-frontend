/**
 * 📐 Canvas Presets Configuration for Multi-Type Template System
 * Supports Docs (A4 Portrait/Landscape) and Slides (16:9 Presentation)
 */
export const CANVAS_PRESETS = {
  "a4-portrait": {
    id: "a4-portrait",
    name: "A4 แนวตั้ง (Portrait)",
    width: 794,
    height: 1123,
    mmWidth: 210,
    mmHeight: 297,
    marginPx: 56, // ~15mm printable margin
    aspectRatio: "1:1.414",
    defaultZoom: 0.85,
  },
  "a4-landscape": {
    id: "a4-landscape",
    name: "A4 แนวนอน (Landscape)",
    width: 1123,
    height: 794,
    mmWidth: 297,
    mmHeight: 210,
    marginPx: 56,
    aspectRatio: "1.414:1",
    defaultZoom: 0.75,
  },
  "slide-16-9": {
    id: "slide-16-9",
    name: "Presentation (16:9 สไลด์)",
    width: 1280,
    height: 720,
    mmWidth: null, // null indicates pixel-based presentation canvas (no metric mm rulers)
    mmHeight: null,
    marginPx: 40,
    aspectRatio: "16:9",
    defaultZoom: 0.65,
  },
  "poster-a3": {
    id: "poster-a3",
    name: "Poster A3 (โปสเตอร์ 297 × 420 mm)",
    width: 1123,
    height: 1587,
    mmWidth: 297,
    mmHeight: 420,
    marginPx: 64,
    aspectRatio: "1:1.414",
    defaultZoom: 0.5,
  },
  "square-1-1": {
    id: "square-1-1",
    name: "Square (จัตุรัส 1080 × 1080 px)",
    width: 1080,
    height: 1080,
    mmWidth: null,
    mmHeight: null,
    marginPx: 40,
    aspectRatio: "1:1",
    defaultZoom: 0.65,
  },
  "story-9-16": {
    id: "story-9-16",
    name: "Story / Vertical (สตอรี่ 1080 × 1920 px)",
    width: 1080,
    height: 1920,
    mmWidth: null,
    mmHeight: null,
    marginPx: 48,
    aspectRatio: "9:16",
    defaultZoom: 0.45,
  },
  "banner-landscape": {
    id: "banner-landscape",
    name: "Banner (แบนเนอร์ 1200 × 630 px)",
    width: 1200,
    height: 630,
    mmWidth: null,
    mmHeight: null,
    marginPx: 32,
    aspectRatio: "1.91:1",
    defaultZoom: 0.7,
  },
};

export const QUICK_CUSTOM_PRESETS = [
  {
    id: "poster-a3",
    label: "Poster A3 (โปสเตอร์)",
    width: 297,
    height: 420,
    unit: "mm",
    desc: "297 × 420 mm • สำหรับป้ายและโปสเตอร์งานพิมพ์",
  },
  {
    id: "poster-a4",
    label: "Poster A4 (แผ่นพับ/ประกาศ)",
    width: 210,
    height: 297,
    unit: "mm",
    desc: "210 × 297 mm • เอกสารและประกาศแนวตั้ง",
  },
  {
    id: "square-1-1",
    label: "Square 1:1 (จัตุรัส / สื่อโซเชียล)",
    width: 1080,
    height: 1080,
    unit: "px",
    desc: "1080 × 1080 px • การ์ดหรือโพสต์ภาพจัตุรัส",
  },
  {
    id: "story-9-16",
    label: "Story / Mobile 9:16 (แนวตั้งมือถือ)",
    width: 1080,
    height: 1920,
    unit: "px",
    desc: "1080 × 1920 px • โปสเตอร์ดิจิทัลและหน้าจอมือถือ",
  },
  {
    id: "banner-landscape",
    label: "Banner / Header (แบนเนอร์)",
    width: 1200,
    height: 630,
    unit: "px",
    desc: "1200 × 630 px • แบนเนอร์เว็บไซต์หรือหน้าปก",
  },
];

export const DEFAULT_PRESET = CANVAS_PRESETS["a4-portrait"];

export const MM_TO_PX = 96 / 25.4;
export const PX_TO_MM = 25.4 / 96;

export function mmToPx(mm) {
  const num = Number(mm);
  if (isNaN(num) || num <= 0) return 0;
  return Math.round(num * MM_TO_PX);
}

export function pxToMm(px) {
  const num = Number(px);
  if (isNaN(num) || num <= 0) return 0;
  return Math.round(num * PX_TO_MM);
}

export function getCanvasPreset(presetId) {
  if (!presetId) return DEFAULT_PRESET;
  if (typeof presetId === "object") {
    if (presetId.id && CANVAS_PRESETS[presetId.id]) {
      return CANVAS_PRESETS[presetId.id];
    }
    if (presetId.width && presetId.height) {
      return presetId;
    }
  }

  // Parse dynamic custom preset string, e.g. "custom_1200_1600_px" or "custom_297_420_mm"
  if (typeof presetId === "string" && presetId.startsWith("custom_")) {
    const parts = presetId.split("_");
    const rawW = parseFloat(parts[1]);
    const rawH = parseFloat(parts[2]);
    const unit = (parts[3] || "px").toLowerCase();

    if (!isNaN(rawW) && !isNaN(rawH) && rawW > 0 && rawH > 0) {
      const isMm = unit === "mm";
      const widthPx = isMm ? mmToPx(rawW) : Math.round(rawW);
      const heightPx = isMm ? mmToPx(rawH) : Math.round(rawH);
      const mmWidth = isMm ? rawW : pxToMm(rawW);
      const mmHeight = isMm ? rawH : pxToMm(rawH);

      const maxDim = Math.max(widthPx, heightPx);
      // Auto compute nice default zoom to fit in ~700-800px viewport
      const defaultZoom = Math.min(0.9, Math.max(0.3, Math.round((720 / maxDim) * 100) / 100));

      return {
        id: presetId,
        name: `กำหนดขนาดเอง (${rawW} × ${rawH} ${unit})`,
        width: widthPx,
        height: heightPx,
        mmWidth: isMm ? mmWidth : null,
        mmHeight: isMm ? mmHeight : null,
        marginPx: Math.min(56, Math.max(16, Math.round(widthPx * 0.04))),
        aspectRatio: `${rawW}:${rawH}`,
        defaultZoom,
      };
    }
  }

  return CANVAS_PRESETS[presetId] || DEFAULT_PRESET;
}