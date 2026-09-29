/**
 * 🎨 Dynamic Block-to-Canvas Synthesizer
 * Bridges block-based templates (e.g. system quotation, nda, contracts) to Fabric.js Canvas pages.
 * Ensures that any duplicated or block-based template renders rich, interactive canvas objects in Template Studio.
 */

import nda from "./nda/content.js";
import partner from "./partner/content.js";
import dist from "./distributor/content.js";
import notifContent from "./notification/content.js";

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

  // 0. COMPANY ANNOUNCEMENT TEMPLATE (1200 × 1200 px Square)
  if (
    categoryId === "company-announcement" ||
    templateId === "tmpl-1789367352607" ||
    templateId.includes("announcement") ||
    name.includes("ประกาศ") ||
    name.includes("ข้อกำหนดด้านประสิทธิภาพ")
  ) {
    return [
      {
        id: "page-1",
        json: JSON.stringify({
          version: "6.9.1",
          objects: [
            // 1. Background (Diagonal Stripes & Corner Facets)
            {
              type: "image",
              src: "/assets/announcements/bg_announcement.svg",
              left: 0,
              top: 0,
              width: 1200,
              height: 1200,
              selectable: false,
              evented: false,
            },

            // 1.1 Top-Left Corner Facet 1 (Red)
            {
              type: "polygon",
              points: [
                { x: 0, y: 0 },
                { x: 220, y: 0 },
                { x: 0, y: 320 },
              ],
              left: 0,
              top: 0,
              fill: "#DC2626",
              selectable: true,
              evented: true,
            },
            // 1.2 Top-Left Corner Facet 2 (Dark Red)
            {
              type: "polygon",
              points: [
                { x: 0, y: 180 },
                { x: 140, y: 0 },
                { x: 0, y: 380 },
              ],
              left: 0,
              top: 0,
              fill: "#7F1D1D",
              opacity: 0.4,
              selectable: true,
              evented: true,
            },
            // 1.3 Top-Left Corner Facet 3 (Light Red Accent)
            {
              type: "polygon",
              points: [
                { x: 0, y: 290 },
                { x: 80, y: 0 },
                { x: 0, y: 440 },
              ],
              left: 0,
              top: 0,
              fill: "#DC2626",
              opacity: 0.25,
              selectable: true,
              evented: true,
            },
            // 1.4 Bottom-Left Corner Accent
            {
              type: "polygon",
              points: [
                { x: 0, y: 1020 },
                { x: 180, y: 1200 },
                { x: 0, y: 1200 },
              ],
              left: 0,
              top: 1020,
              fill: "#DC2626",
              opacity: 0.75,
              selectable: true,
              evented: true,
            },
            // 1.5 Bottom-Right Corner Accent
            {
              type: "polygon",
              points: [
                { x: 1200, y: 1020 },
                { x: 1020, y: 1200 },
                { x: 1200, y: 1200 },
              ],
              left: 1020,
              top: 1020,
              fill: "#DC2626",
              opacity: 0.75,
              selectable: true,
              evented: true,
            },

            // 2. Announcement Header Banner (Tilted Red Rounded Banner with 3D Depth)
            {
              type: "rect",
              left: 100,
              top: 55,
              width: 470,
              height: 84,
              angle: -3.8,
              rx: 16,
              ry: 16,
              fill: "#DC2626",
              shadow: {
                color: "#7F1D1D",
                blur: 0,
                offsetX: 0,
                offsetY: 6,
              },
              selectable: true,
            },
            // Left Decorative Burst Rays
            {
              type: "rect",
              left: 62,
              top: 48,
              width: 22,
              height: 5,
              rx: 2.5,
              ry: 2.5,
              fill: "#DC2626",
              angle: -35,
              selectable: true,
            },
            {
              type: "rect",
              left: 52,
              top: 72,
              width: 26,
              height: 5,
              rx: 2.5,
              ry: 2.5,
              fill: "#DC2626",
              angle: -5,
              selectable: true,
            },
            {
              type: "rect",
              left: 65,
              top: 96,
              width: 20,
              height: 5,
              rx: 2.5,
              ry: 2.5,
              fill: "#DC2626",
              angle: 25,
              selectable: true,
            },
            // Right Decorative Burst Rays
            {
              type: "rect",
              left: 580,
              top: 22,
              width: 22,
              height: 5,
              rx: 2.5,
              ry: 2.5,
              fill: "#DC2626",
              angle: 25,
              selectable: true,
            },
            {
              type: "rect",
              left: 592,
              top: 46,
              width: 26,
              height: 5,
              rx: 2.5,
              ry: 2.5,
              fill: "#DC2626",
              angle: -5,
              selectable: true,
            },
            {
              type: "rect",
              left: 585,
              top: 70,
              width: 20,
              height: 5,
              rx: 2.5,
              ry: 2.5,
              fill: "#DC2626",
              angle: -35,
              selectable: true,
            },
            // Announcement Header Text
            {
              type: "textbox",
              left: 105,
              top: 66,
              width: 460,
              text: "{{header_badge}}",
              fontSize: 54,
              fontWeight: "900",
              fontFamily: FONT_FAMILY,
              fill: "#FFFFFF",
              textAlign: "center",
              angle: -3.8,
              stroke: "#991B1B",
              strokeWidth: 2,
              paintFirst: "stroke",
              shadow: {
                color: "rgba(127, 29, 29, 0.7)",
                blur: 4,
                offsetX: 0,
                offsetY: 3,
              },
              splitByGrapheme: true,
              objectCaching: false,
              selectable: true,
            },

            // 3. 3D Megaphone
            {
              type: "image",
              src: "/assets/announcements/megaphone_3d.png",
              left: 770,
              top: 45,
              width: 310,
              height: 260,
              selectable: true,
            },

            // Company Header Logo Badge Container (Top-Right)
            {
              type: "rect",
              left: 1045,
              top: 25,
              width: 112,
              height: 108,
              rx: 22,
              ry: 22,
              fill: "#FFFFFF",
              stroke: "#F1F5F9",
              strokeWidth: 1.5,
              shadow: {
                color: "rgba(0, 0, 0, 0.12)",
                blur: 16,
                offsetX: 0,
                offsetY: 6,
              },
              selectable: true,
            },
            {
              type: "image",
              src: "/header_logo.png",
              left: 1056,
              top: 34,
              width: 90,
              height: 90,
              selectable: true,
            },

            // 4. Document Titles (Exact target typography & proportions - No line wrapping)
            {
              type: "textbox",
              left: 80,
              top: 166,
              width: 950,
              text: "{{doc_title_1}}",
              fontSize: 52,
              fontWeight: "900",
              fontFamily: FONT_FAMILY,
              fill: "#0F172A",
              angle: -2.5,
              lineHeight: 1.15,
              splitByGrapheme: false,
              objectCaching: false,
              selectable: true,
            },
            {
              type: "textbox",
              left: 72,
              top: 230,
              width: 980,
              text: "{{doc_title_2}}",
              fontSize: 52,
              fontWeight: "900",
              fontFamily: FONT_FAMILY,
              fill: "#DC2626",
              angle: -2.5,
              lineHeight: 1.15,
              splitByGrapheme: false,
              objectCaching: false,
              selectable: true,
            },

            // 5. Section 1 Pill Header (Bold & Prominent)
            {
              type: "rect",
              left: 100,
              top: 310,
              width: 1000,
              height: 76,
              fill: "#DC2626",
              rx: 38,
              ry: 38,
              shadow: {
                color: "rgba(185, 28, 28, 0.35)",
                blur: 10,
                offsetX: 0,
                offsetY: 4,
              },
              selectable: true,
            },
            // Section 1 Icon: Circle Badge + Vector Target Path
            {
              type: "circle",
              left: 130,
              top: 322,
              radius: 26,
              fill: "rgba(255, 255, 255, 0.22)",
              selectable: true,
            },
            {
              type: "path",
              left: 143,
              top: 335,
              path: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm0-14a6 6 0 1 0 6 6 6 6 0 0 0-6-6zm0 10a4 4 0 1 1 4-4 4 4 0 0 1-4 4zm0-6a2 2 0 1 0 2 2 2 2 0 0 0-2-2z",
              scaleX: 1.15,
              scaleY: 1.15,
              fill: "#FFFFFF",
              selectable: true,
              isIcon: true,
              iconId: "target",
            },
            {
              type: "line",
              left: 200,
              top: 323,
              x1: 0,
              y1: 0,
              x2: 0,
              y2: 50,
              stroke: "rgba(255, 255, 255, 0.45)",
              strokeWidth: 2,
              selectable: true,
            },
            {
              type: "textbox",
              left: 224,
              top: 325,
              width: 860,
              text: "{{section_title}}",
              fontSize: 34,
              fontWeight: "900",
              fontFamily: FONT_FAMILY,
              fill: "#FFFFFF",
              splitByGrapheme: true,
              objectCaching: false,
              selectable: true,
            },

            // 6. Row 1: Cards 1.1, 1.2, 1.3 (Unified H=255px, 23px Text, 42px Slanted Tab)
            // Card 1.1 Base
            {
              type: "rect",
              left: 60,
              top: 415,
              width: 340,
              height: 255,
              fill: "#FFFFFF",
              stroke: "#E2E8F0",
              strokeWidth: 1.5,
              rx: 20,
              ry: 20,
              shadow: {
                color: "rgba(0, 0, 0, 0.08)",
                blur: 16,
                offsetX: 0,
                offsetY: 6,
              },
              selectable: true,
            },
            // Card 1.1 Left Red Accent Strip
            {
              type: "rect",
              left: 60,
              top: 457,
              width: 5,
              height: 175,
              fill: "#DC2626",
              rx: 2.5,
              ry: 2.5,
              selectable: true,
            },
            // Card 1.1 Slanted Badge Tab (Reduced height 42px)
            {
              type: "polygon",
              left: 60,
              top: 415,
              points: [
                { x: 0, y: 0 },
                { x: 105, y: 0 },
                { x: 85, y: 42 },
                { x: 0, y: 42 },
              ],
              fill: "#DC2626",
              selectable: true,
            },
            {
              type: "text",
              left: 78,
              top: 423,
              text: "{{rule_1_no}}",
              fontSize: 24,
              fontWeight: "900",
              fontFamily: FONT_FAMILY,
              fill: "#FFFFFF",
              objectCaching: false,
              selectable: true,
            },
            // Card 1.1 Vector Calendar Icon
            {
              type: "circle",
              left: 334,
              top: 424,
              radius: 22,
              fill: "#FEE2E2",
              selectable: true,
            },
            {
              type: "path",
              left: 344,
              top: 434,
              path: "M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zm-8 4h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z",
              scaleX: 1.15,
              scaleY: 1.15,
              fill: "#DC2626",
              selectable: true,
              isIcon: true,
              iconId: "calendar",
            },
            // Card 1.1 Text (Enlarged 23px Body Font)
            {
              type: "textbox",
              left: 78,
              top: 476,
              width: 305,
              text: "{{rule_1_text}}",
              fontSize: 23,
              lineHeight: 1.42,
              fontWeight: "600",
              fontFamily: FONT_FAMILY,
              fill: "#1E293B",
              splitByGrapheme: true,
              objectCaching: false,
              selectable: true,
            },

            // Card 1.2 Base
            {
              type: "rect",
              left: 430,
              top: 415,
              width: 340,
              height: 255,
              fill: "#FFFFFF",
              stroke: "#E2E8F0",
              strokeWidth: 1.5,
              rx: 20,
              ry: 20,
              shadow: {
                color: "rgba(0, 0, 0, 0.08)",
                blur: 16,
                offsetX: 0,
                offsetY: 6,
              },
              selectable: true,
            },
            // Card 1.2 Left Red Accent Strip
            {
              type: "rect",
              left: 430,
              top: 457,
              width: 5,
              height: 175,
              fill: "#DC2626",
              rx: 2.5,
              ry: 2.5,
              selectable: true,
            },
            // Card 1.2 Slanted Badge Tab
            {
              type: "polygon",
              left: 430,
              top: 415,
              points: [
                { x: 0, y: 0 },
                { x: 105, y: 0 },
                { x: 85, y: 42 },
                { x: 0, y: 42 },
              ],
              fill: "#DC2626",
              selectable: true,
            },
            {
              type: "text",
              left: 448,
              top: 423,
              text: "{{rule_2_no}}",
              fontSize: 24,
              fontWeight: "900",
              fontFamily: FONT_FAMILY,
              fill: "#FFFFFF",
              objectCaching: false,
              selectable: true,
            },
            // Card 1.2 Vector Clipboard Icon
            {
              type: "circle",
              left: 704,
              top: 424,
              radius: 22,
              fill: "#FEE2E2",
              selectable: true,
            },
            {
              type: "path",
              left: 714,
              top: 434,
              path: "M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z",
              scaleX: 1.15,
              scaleY: 1.15,
              fill: "#DC2626",
              selectable: true,
              isIcon: true,
              iconId: "clipboard",
            },
            // Card 1.2 Text
            {
              type: "textbox",
              left: 448,
              top: 476,
              width: 305,
              text: "{{rule_2_text}}",
              fontSize: 23,
              lineHeight: 1.42,
              fontWeight: "600",
              fontFamily: FONT_FAMILY,
              fill: "#1E293B",
              splitByGrapheme: true,
              objectCaching: false,
              selectable: true,
            },

            // Card 1.3 Base
            {
              type: "rect",
              left: 800,
              top: 415,
              width: 340,
              height: 255,
              fill: "#FFFFFF",
              stroke: "#E2E8F0",
              strokeWidth: 1.5,
              rx: 20,
              ry: 20,
              shadow: {
                color: "rgba(0, 0, 0, 0.08)",
                blur: 16,
                offsetX: 0,
                offsetY: 6,
              },
              selectable: true,
            },
            // Card 1.3 Left Red Accent Strip
            {
              type: "rect",
              left: 800,
              top: 457,
              width: 5,
              height: 175,
              fill: "#DC2626",
              rx: 2.5,
              ry: 2.5,
              selectable: true,
            },
            // Card 1.3 Slanted Badge Tab
            {
              type: "polygon",
              left: 800,
              top: 415,
              points: [
                { x: 0, y: 0 },
                { x: 105, y: 0 },
                { x: 85, y: 42 },
                { x: 0, y: 42 },
              ],
              fill: "#DC2626",
              selectable: true,
            },
            {
              type: "text",
              left: 818,
              top: 423,
              text: "{{rule_3_no}}",
              fontSize: 24,
              fontWeight: "900",
              fontFamily: FONT_FAMILY,
              fill: "#FFFFFF",
              objectCaching: false,
              selectable: true,
            },
            // Card 1.3 Vector Trending Icon
            {
              type: "circle",
              left: 1074,
              top: 424,
              radius: 22,
              fill: "#FEE2E2",
              selectable: true,
            },
            {
              type: "path",
              left: 1084,
              top: 434,
              path: "M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z M4 19h16v2H4z",
              scaleX: 1.15,
              scaleY: 1.15,
              fill: "#DC2626",
              selectable: true,
              isIcon: true,
              iconId: "trending",
            },
            // Card 1.3 Text
            {
              type: "textbox",
              left: 818,
              top: 476,
              width: 305,
              text: "{{rule_3_text}}",
              fontSize: 23,
              lineHeight: 1.42,
              fontWeight: "600",
              fontFamily: FONT_FAMILY,
              fill: "#1E293B",
              splitByGrapheme: true,
              objectCaching: false,
              selectable: true,
            },

            // 7. Row 2: Cards 1.4, 1.5 (Unified H=255px Matching Row 1)
            // Card 1.4 Base
            {
              type: "rect",
              left: 60,
              top: 695,
              width: 520,
              height: 255,
              fill: "#FFFFFF",
              stroke: "#E2E8F0",
              strokeWidth: 1.5,
              rx: 20,
              ry: 20,
              shadow: {
                color: "rgba(0, 0, 0, 0.08)",
                blur: 16,
                offsetX: 0,
                offsetY: 6,
              },
              selectable: true,
            },
            // Card 1.4 Left Red Accent Strip
            {
              type: "rect",
              left: 60,
              top: 737,
              width: 5,
              height: 175,
              fill: "#DC2626",
              rx: 2.5,
              ry: 2.5,
              selectable: true,
            },
            // Card 1.4 Slanted Badge Tab
            {
              type: "polygon",
              left: 60,
              top: 695,
              points: [
                { x: 0, y: 0 },
                { x: 105, y: 0 },
                { x: 85, y: 42 },
                { x: 0, y: 42 },
              ],
              fill: "#DC2626",
              selectable: true,
            },
            {
              type: "text",
              left: 78,
              top: 703,
              text: "{{rule_4_no}}",
              fontSize: 24,
              fontWeight: "900",
              fontFamily: FONT_FAMILY,
              fill: "#FFFFFF",
              objectCaching: false,
              selectable: true,
            },
            // Card 1.4 Vector ShieldCheck Icon
            {
              type: "circle",
              left: 514,
              top: 704,
              radius: 22,
              fill: "#FEE2E2",
              selectable: true,
            },
            {
              type: "path",
              left: 524,
              top: 714,
              path: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z",
              scaleX: 1.15,
              scaleY: 1.15,
              fill: "#DC2626",
              selectable: true,
              isIcon: true,
              iconId: "shield_check",
            },
            // Card 1.4 Red Vertical Accent Bar (From reference image)
            {
              type: "rect",
              left: 85,
              top: 760,
              width: 5,
              height: 75,
              fill: "#DC2626",
              rx: 2.5,
              ry: 2.5,
              selectable: true,
            },
            // Card 1.4 Text
            {
              type: "textbox",
              left: 105,
              top: 758,
              width: 440,
              text: "{{rule_4_text}}",
              fontSize: 23,
              lineHeight: 1.42,
              fontWeight: "600",
              fontFamily: FONT_FAMILY,
              fill: "#1E293B",
              splitByGrapheme: true,
              objectCaching: false,
              selectable: true,
            },

            // Card 1.5 Base
            {
              type: "rect",
              left: 620,
              top: 695,
              width: 520,
              height: 255,
              fill: "#FFFFFF",
              stroke: "#E2E8F0",
              strokeWidth: 1.5,
              rx: 20,
              ry: 20,
              shadow: {
                color: "rgba(0, 0, 0, 0.08)",
                blur: 16,
                offsetX: 0,
                offsetY: 6,
              },
              selectable: true,
            },
            // Card 1.5 Left Red Accent Strip
            {
              type: "rect",
              left: 620,
              top: 737,
              width: 5,
              height: 175,
              fill: "#DC2626",
              rx: 2.5,
              ry: 2.5,
              selectable: true,
            },
            // Card 1.5 Slanted Badge Tab
            {
              type: "polygon",
              left: 620,
              top: 695,
              points: [
                { x: 0, y: 0 },
                { x: 105, y: 0 },
                { x: 85, y: 42 },
                { x: 0, y: 42 },
              ],
              fill: "#DC2626",
              selectable: true,
            },
            {
              type: "text",
              left: 638,
              top: 703,
              text: "{{rule_5_no}}",
              fontSize: 24,
              fontWeight: "900",
              fontFamily: FONT_FAMILY,
              fill: "#FFFFFF",
              objectCaching: false,
              selectable: true,
            },
            // Card 1.5 Vector AlertTriangle Icon
            {
              type: "circle",
              left: 1074,
              top: 704,
              radius: 22,
              fill: "#FEE2E2",
              selectable: true,
            },
            {
              type: "path",
              left: 1084,
              top: 714,
              path: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z",
              scaleX: 1.15,
              scaleY: 1.15,
              fill: "#DC2626",
              selectable: true,
              isIcon: true,
              iconId: "alert_triangle",
            },
            // Card 1.5 Red Vertical Accent Bar (From reference image)
            {
              type: "rect",
              left: 645,
              top: 760,
              width: 5,
              height: 75,
              fill: "#DC2626",
              rx: 2.5,
              ry: 2.5,
              selectable: true,
            },
            // Card 1.5 Text
            {
              type: "textbox",
              left: 665,
              top: 758,
              width: 440,
              text: "{{rule_5_text}}",
              fontSize: 23,
              lineHeight: 1.42,
              fontWeight: "600",
              fontFamily: FONT_FAMILY,
              fill: "#1E293B",
              splitByGrapheme: true,
              objectCaching: false,
              selectable: true,
            },

            // 8. Footer: Premium Curved Red Wave Swoosh (From Reference Image)
            // Deep 3D Shadow Wave
            {
              type: "path",
              path: "M 0 1120 Q 550 990 1200 1090 L 1200 1200 L 0 1200 Z",
              fill: "#7F1D1D",
              selectable: true,
              evented: true,
            },
            // Primary Vibrant Red Wave
            {
              type: "path",
              path: "M 0 1135 Q 560 1010 1200 1105 L 1200 1200 L 0 1200 Z",
              fill: "#DC2626",
              selectable: true,
              evented: true,
            },
            // Soft Curved Coral Accent
            {
              type: "path",
              path: "M 0 1150 Q 580 1035 1200 1125 L 1200 1200 L 0 1200 Z",
              fill: "#EF4444",
              opacity: 0.85,
              selectable: true,
              evented: true,
            },
          ],
        }),
      },
    ];
  }

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
              text: "",
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
              text: "",
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
              text: "",
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
              text: "",
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
      text: companyName || "",
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
      text: companyNameEn || "",
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
      text: taxId ? `เลขประจำตัวผู้เสียภาษี: ${taxId}` : "",
      fontSize: 9.5,
      fill: "#6B7280",
      fontFamily: FONT_FAMILY,
    },
    {
      type: "textbox",
      left: 490,
      top: 36,
      width: 248,
      text: [address, [phone ? `โทร: ${phone}` : "", email].filter(Boolean).join(" | ")].filter(Boolean).join("\n"),
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
    const bHeader = template.blocks?.find((b) => b.type === "header")?.settings || {};
    const bTitle = template.blocks?.find((b) => b.type === "doc_title")?.settings || {};

    const companyNameTh = bHeader.companyName || notifContent?.header?.companyNameTh || "บริษัท เดอะ รีโคฟเวอรี่ แอดไวเซอร์ จำกัด";
    const companyAddressTh = bHeader.address || notifContent?.header?.companyAddressTh || "45 ซอยโกสุมรวมใจ 37 แขวงดอนเมือง เขตดอนเมือง กรุงเทพมหานคร 10210";
    const taxId = bHeader.taxId || notifContent?.header?.taxId || "0105554007189";
    const branch = bHeader.branch || notifContent?.header?.branch || "สำนักงานใหญ่";
    const phone = bHeader.phone || notifContent?.header?.phone || "02-1019884";
    const logoUrl = bHeader.logoUrl || notifContent?.header?.logoUrl || "/header_logo.png";

    const titleTh = bTitle.titleText || notifContent?.title?.titleTh || "หนังสือแจ้งเปลี่ยนแปลงที่ตั้งสำนักงานใหญ่";
    const titleEn = bTitle.subtitleText || notifContent?.title?.titleEn || "Notice of Head Office Relocation";

    return [
      {
        id: "page-1",
        json: JSON.stringify({
          version: "6.9.1",
          objects: [
            // ── 1. Top Decorative Red Ribbon Graphic ──
            {
              type: "image",
              src: "/notification_ribbon_top.svg",
              left: 0,
              top: 0,
              width: 1000,
              height: 48,
              scaleX: 794 / 1000,
              scaleY: 36 / 48,
              originX: "left",
              originY: "top",
              selectable: false,
              evented: false,
            },

            // ── 2. Company Logo ──
            {
              type: "image",
              src: logoUrl,
              left: 48,
              top: 42,
              width: 298,
              height: 286,
              scaleX: 62 / 298,
              scaleY: 62 / 286,
              originX: "left",
              originY: "top",
              selectable: true,
            },

            // ── 3. Company Header Texts ──
            {
              type: "textbox",
              left: 124,
              top: 40,
              width: 622,
              text: companyNameTh,
              fontSize: 15.5,
              fontWeight: "bold",
              fill: "#111827",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 124,
              top: 63,
              width: 622,
              text: companyAddressTh,
              fontSize: 12,
              fill: "#374151",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 124,
              top: 82,
              width: 622,
              text: `เลขประจำตัวผู้เสียภาษีอากร ${taxId} (${branch})   |   โทร: ${phone}`,
              fontSize: 11.5,
              fill: "#4B5563",
              fontFamily: FONT_FAMILY,
            },

            // ── 4. Document Title ──
            {
              type: "textbox",
              left: 48,
              top: 116,
              width: 698,
              text: titleTh,
              fontSize: 18,
              fontWeight: "bold",
              textAlign: "center",
              fill: "#111827",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 48,
              top: 144,
              width: 698,
              text: titleEn,
              fontSize: 14,
              fontWeight: "600",
              textAlign: "center",
              fill: "#111827",
              fontFamily: FONT_FAMILY,
            },

            // ── 5. Date (Right-aligned) ──
            {
              type: "textbox",
              left: 450,
              top: 178,
              width: 296,
              text: "วันที่ / Date: {{doc_date}}",
              fontSize: 14,
              textAlign: "right",
              fill: "#111827",
              fontFamily: FONT_FAMILY,
            },

            // ── 6. To & Subject ──
            {
              type: "textbox",
              left: 48,
              top: 208,
              width: 698,
              text: "เรียน / To:   {{recipient}}",
              fontSize: 14,
              fill: "#111827",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 48,
              top: 232,
              width: 698,
              text: "เรื่อง / Subject:   {{subject}}",
              fontSize: 14,
              fill: "#111827",
              fontFamily: FONT_FAMILY,
            },

            // ── 7. Formal Letter Body Paragraphs ──
            {
              type: "textbox",
              left: 48,
              top: 266,
              width: 698,
              text: "        " + (notifContent?.body?.paragraphThPre || "บริษัทฯ ขอเรียนให้ท่านทราบว่า บริษัทฯ ได้ทำการย้ายและเปลี่ยนแปลงที่ตั้งสำนักงานใหญ่ โดยมีผลบังคับใช้ตั้งแต่วันที่") + " {{effective_date}} " + (notifContent?.body?.paragraphThPost || "เป็นต้นไป ขอความกรุณาท่านโปรดใช้ที่อยู่ใหม่ในการติดต่อ ออกใบกำกับภาษี ใบเสร็จรับเงิน นิติกรรมสัญญา และการจัดส่งเอกสารต่างๆ โดยมีรายละเอียดที่อยู่ดังต่อไปนี้"),
              fontSize: 13.5,
              lineHeight: 1.6,
              fill: "#111827",
              textAlign: "justify",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 48,
              top: 338,
              width: 698,
              text: "        " + (notifContent?.body?.paragraphEnPre || "Please be informed that our company will officially relocate its Head Office. This change will be effective from") + " {{effective_date_en}} " + (notifContent?.body?.paragraphEnPost || "onwards. We kindly request that you update your records and use the new address for all future correspondence, tax invoices, receipts, and legal contracts. The details of our addresses are as follows:"),
              fontSize: 13,
              lineHeight: 1.55,
              fill: "#111827",
              textAlign: "justify",
              fontFamily: FONT_FAMILY,
            },

            // ── 8. Previous Address Card ──
            {
              type: "rect",
              left: 48,
              top: 422,
              width: 698,
              height: 84,
              fill: "#F1F3F5",
              rx: 3,
              ry: 3,
            },
            {
              type: "rect",
              left: 48,
              top: 422,
              width: 5,
              height: 84,
              fill: "#6B7280",
              rx: 2,
              ry: 2,
            },
            {
              type: "textbox",
              left: 66,
              top: 432,
              width: 664,
              text: notifContent?.labels?.previousAddressLabel || "ที่อยู่เดิม / Previous Address:",
              fontSize: 14,
              fontWeight: "bold",
              fill: "#111827",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 66,
              top: 456,
              width: 664,
              text: "{{old_address_th}}\n{{old_address_en}}",
              fontSize: 13,
              lineHeight: 1.45,
              fill: "#111827",
              fontFamily: FONT_FAMILY,
            },

            // ── 9. New Address Card ──
            {
              type: "rect",
              left: 48,
              top: 520,
              width: 698,
              height: 94,
              fill: "#E2EEFB",
              rx: 3,
              ry: 3,
            },
            {
              type: "rect",
              left: 48,
              top: 520,
              width: 5,
              height: 94,
              fill: "#1D4ED8",
              rx: 2,
              ry: 2,
            },
            {
              type: "textbox",
              left: 66,
              top: 530,
              width: 664,
              text: (notifContent?.labels?.newAddressLabel || "ที่อยู่ใหม่ / New Address") + " (มีผล {{effective_date}} / Effective {{effective_date_en}}):",
              fontSize: 14,
              fontWeight: "bold",
              fill: "#030712",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 66,
              top: 554,
              width: 664,
              text: "{{new_address_th}}\n{{new_address_en}}",
              fontSize: 13,
              lineHeight: 1.45,
              fill: "#030712",
              fontFamily: FONT_FAMILY,
            },

            // ── 10. Signatory Section ──
            {
              type: "textbox",
              left: 420,
              top: 660,
              width: 326,
              text: notifContent?.labels?.sincerelyLabel || "ขอแสดงความนับถือ / Sincerely yours,",
              fontSize: 14,
              textAlign: "center",
              fill: "#111827",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 420,
              top: 726,
              width: 326,
              text: "( .................................................... )",
              fontSize: 13,
              textAlign: "center",
              fill: "#9CA3AF",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 420,
              top: 752,
              width: 326,
              text: "{{signatory_name}}",
              fontSize: 14,
              fontWeight: "bold",
              textAlign: "center",
              fill: "#111827",
              fontFamily: FONT_FAMILY,
            },
            {
              type: "textbox",
              left: 420,
              top: 774,
              width: 326,
              text: "{{signatory_position}}",
              fontSize: 13,
              textAlign: "center",
              fill: "#4B5563",
              fontFamily: FONT_FAMILY,
            },

            // ── 11. Bottom Decorative Red Ribbon Graphic ──
            {
              type: "image",
              src: "/notification_ribbon_bottom.svg",
              left: 0,
              top: 1087,
              width: 1000,
              height: 48,
              scaleX: 794 / 1000,
              scaleY: 36 / 48,
              originX: "left",
              originY: "top",
              selectable: false,
              evented: false,
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
