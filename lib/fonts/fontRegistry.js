/**
 * 🎨 DocBuilder Unified Font Registry System
 * Centralized registry for Docs, Slides, and Print/Export pipelines.
 */

export const DEFAULT_FONTS = [
  {
    id: "noto-sans-thai",
    name: "Noto Sans Thai",
    family: "Noto Sans Thai",
    cssStack: "'Noto Sans Thai', sans-serif",
    googleFont: "Noto+Sans+Thai:wght@300;400;500;600;700",
    availableWeights: [300, 400, 500, 600, 700],
    category: "sans-serif",
    isDefault: true,
  },
  {
    id: "noto-sans-thai-looped",
    name: "Noto Sans Thai Looped",
    family: "Noto Sans Thai Looped",
    cssStack: "'Noto Sans Thai Looped', sans-serif",
    googleFont: "Noto+Sans+Thai+Looped:wght@300;400;500;600;700;800",
    availableWeights: [300, 400, 500, 600, 700, 800],
    category: "sans-serif",
  },
  {
    id: "sarabun",
    name: "Sarabun",
    family: "Sarabun",
    cssStack: "'Sarabun', sans-serif",
    googleFont: "Sarabun:wght@300;400;500;600;700;800",
    availableWeights: [300, 400, 500, 600, 700, 800],
    category: "sans-serif",
  },
  {
    id: "inter",
    name: "Inter",
    family: "Inter",
    cssStack: "'Inter', sans-serif",
    googleFont: "Inter:wght@300;400;500;600;700;800",
    availableWeights: [300, 400, 500, 600, 700, 800],
    category: "sans-serif",
  },
  {
    id: "monospace",
    name: "Monospace",
    family: "monospace",
    cssStack: "monospace",
    googleFont: null,
    availableWeights: [400, 700],
    category: "monospace",
  },
];

export const CURATED_THAI_FONTS = [
  {
    id: "kanit",
    name: "Kanit",
    family: "Kanit",
    cssStack: "'Kanit', sans-serif",
    googleFont: "Kanit:wght@300;400;500;600;700;800",
    availableWeights: [300, 400, 500, 600, 700, 800],
    category: "display-sans",
    description: "โมเดิร์น ไร้หัว ทันสมัย เหมาะสำหรับหัวข้อและงานพรีเซนเทชัน",
    sampleText: "รายงานสรุปประจำไตรมาส DocBuilder 2026",
  },
  {
    id: "prompt",
    name: "Prompt",
    family: "Prompt",
    cssStack: "'Prompt', sans-serif",
    googleFont: "Prompt:wght@300;400;500;600;700;800",
    availableWeights: [300, 400, 500, 600, 700, 800],
    category: "geometric-sans",
    description: "เรขาคณิต เรียบหรู อ่านง่ายในทุกขนาดหน้าจอ",
    sampleText: "นวัตกรรมระบบจัดการเอกสารอัจฉริยะองค์กร",
  },
  {
    id: "mitr",
    name: "Mitr",
    family: "Mitr",
    cssStack: "'Mitr', sans-serif",
    googleFont: "Mitr:wght@300;400;500;600;700",
    availableWeights: [300, 400, 500, 600, 700],
    category: "rounded-sans",
    description: "เป็นมิตร โปร่งสบาย เข้าถึงง่าย เหมาะกับงานดีไซน์ร่วมสมัย",
    sampleText: "สัมผัสประสบการณ์การทำงานร่วมกันแบบไร้รอยต่อ",
  },
  {
    id: "pridi",
    name: "Pridi",
    family: "Pridi",
    cssStack: "'Pridi', serif",
    googleFont: "Pridi:wght@300;400;500;600;700",
    availableWeights: [300, 400, 500, 600, 700],
    category: "serif",
    description: "มีเชิงแบบคลาสสิก สง่างาม ให้ความรู้สึกพรีเมียมและน่าเชื่อถือ",
    sampleText: "เอกสารสัญญาและบันทึกข้อตกลงความร่วมมือ",
  },
  {
    id: "chonburi",
    name: "Chonburi",
    family: "Chonburi",
    cssStack: "'Chonburi', cursive",
    googleFont: "Chonburi:wght@400",
    availableWeights: [400],
    category: "display-serif",
    description: "คอนทราสต์เส้นหนา-บางสูง โดดเด่นเป็นเอกลักษณ์ เหมาะกับพาดหัวหลัก",
    sampleText: "หนังสือรับรองผลงานอันทรงเกียรติ",
  },
  {
    id: "bai-jamjuree",
    name: "Bai Jamjuree",
    family: "Bai Jamjuree",
    cssStack: "'Bai Jamjuree', sans-serif",
    googleFont: "Bai+Jamjuree:wght@300;400;500;600;700",
    availableWeights: [300, 400, 500, 600, 700],
    category: "geometric-sans",
    description: "เหลี่ยมมุมชัดเจน บุคลิกมั่นคง เหมาะสำหรับข้อมูลเทคโนโลยีและการเงิน",
    sampleText: "การวิเคราะห์โครงสร้างงบประมาณประจำปี",
  },
  {
    id: "k2d",
    name: "K2D",
    family: "K2D",
    cssStack: "'K2D', sans-serif",
    googleFont: "K2D:wght@300;400;500;600;700",
    availableWeights: [300, 400, 500, 600, 700],
    category: "tech-sans",
    description: "คมชัด เส้นสายสะอาดตา สไตล์ดิจิทัลโมเดิร์น",
    sampleText: "สถาปัตยกรรมระบบคลาวด์ความปลอดภัยสูง",
  },
  {
    id: "athiti",
    name: "Athiti",
    family: "Athiti",
    cssStack: "'Athiti', sans-serif",
    googleFont: "Athiti:wght@300;400;500;600;700",
    availableWeights: [300, 400, 500, 600, 700],
    category: "casual-sans",
    description: "อบอุ่น ผ่อนคลาย อ่านง่ายสบายตา เหมาะกับเนื้อความและคำอธิบาย",
    sampleText: "แนวทางการดำเนินงานเพื่อประสิทธิภาพสูงสุด",
  },
  {
    id: "charmonman",
    name: "Charmonman",
    family: "Charmonman",
    cssStack: "'Charmonman', cursive",
    googleFont: "Charmonman:wght@400;700",
    availableWeights: [400, 700],
    category: "script",
    description: "ตัวเขียนลายมืออ่อนช้อย หรูหรา เหมาะสำหรับใบประกาศนียบัตรและการ์ดเชิญ",
    sampleText: "ด้วยความเคารพอย่างสูงและขอแสดงความยินดี",
  },
];

/**
 * 🔗 Construct Google Fonts CSS2 URL for a list of font objects or families
 */
export function buildGoogleFontsUrl(fonts = []) {
  if (!fonts || fonts.length === 0) return null;
  const queries = [];
  const added = new Set();

  for (const font of fonts) {
    const gfParam = typeof font === "string" ? font : font.googleFont;
    if (gfParam && !added.has(gfParam)) {
      queries.push(`family=${gfParam}`);
      added.add(gfParam);
    }
  }

  if (queries.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${queries.join("&")}&display=swap`;
}

/**
 * 🔍 Clean and normalize font family string (strip quotes, trim)
 */
export function cleanFontFamily(rawFamily) {
  if (!rawFamily) return "";
  return rawFamily
    .split(",")[0]
    .replace(/['"]/g, "")
    .trim();
}

/**
 * 🎯 Find font in default or custom font lists
 */
export function findFontByFamily(rawFamily, customFonts = []) {
  const clean = cleanFontFamily(rawFamily).toLowerCase();
  const all = [...DEFAULT_FONTS, ...CURATED_THAI_FONTS, ...customFonts];
  return (
    all.find(
      (f) =>
        f.family.toLowerCase() === clean ||
        f.id.toLowerCase() === clean ||
        cleanFontFamily(f.cssStack).toLowerCase() === clean
    ) || null
  );
}

/**
 * 🇹🇭 Map Web Font to PowerPoint System Font Fallback (Strict OOXML Compliance)
 * OOXML attribute 'typeface' in <a:latin>/<a:cs> requires a SINGLE font name (no commas).
 * Maps web fonts to universal system fonts guaranteed to exist on Windows & Office.
 */
export function mapFontFamilyToPptx(fontFamily) {
  if (!fontFamily) return "Leelawadee UI";
  const clean = cleanFontFamily(fontFamily).toLowerCase();

  // 1. Standard Thai Government & Office Fonts
  if (clean.includes("sarabun")) return "TH Sarabun New";
  if (clean.includes("tahoma")) return "Tahoma";
  if (clean.includes("angsana")) return "Angsana New";
  if (clean.includes("cordia")) return "Cordia New";
  if (clean.includes("monospace")) return "Consolas";
  if (clean.includes("inter") || clean.includes("arial") || clean.includes("helvetica")) return "Arial";

  // 2. Curated or Custom Thai Fonts
  const matched = [...DEFAULT_FONTS, ...CURATED_THAI_FONTS].find(
    (f) => f.family.toLowerCase() === clean || f.id.toLowerCase() === clean
  );

  if (matched) {
    // If the font is serif/formal, map to TH Sarabun New
    if (matched.category && (matched.category.includes("serif") || matched.category.includes("formal"))) {
      return "TH Sarabun New";
    }
    // All modern sans-serif Thai fonts map cleanly to Leelawadee UI
    return "Leelawadee UI";
  }

  // 3. Guaranteed Safe Default
  return "Leelawadee UI";
}

/**
 * 🏷️ Standard Font Weight Labels (300 - 800)
 */
export const FONT_WEIGHT_LABELS = {
  300: "300 - บาง (Light)",
  400: "400 - ปกติ (Regular)",
  500: "500 - ปานกลาง (Medium)",
  600: "600 - กึ่งหนา (SemiBold)",
  700: "700 - หนา (Bold)",
  800: "800 - หนามาก (ExtraBold)",
};

export const ALL_WEIGHT_KEYS = [300, 400, 500, 600, 700, 800];

/**
 * ⚖️ Get available weights for a given font family
 */
export function getAvailableWeights(rawFamily, customFonts = []) {
  const font = findFontByFamily(rawFamily, customFonts);
  if (font && Array.isArray(font.availableWeights) && font.availableWeights.length > 0) {
    return font.availableWeights;
  }
  return [400, 700];
}

