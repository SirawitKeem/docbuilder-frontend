import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  DEFAULT_FONTS,
  CURATED_THAI_FONTS,
  cleanFontFamily,
} from "@/lib/fonts/fontRegistry";

const CUSTOM_FONTS_PATH = path.join(process.cwd(), "data", "customFonts.json");

function readCustomFonts() {
  try {
    if (!fs.existsSync(CUSTOM_FONTS_PATH)) {
      return [];
    }
    const raw = fs.readFileSync(CUSTOM_FONTS_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.fonts) ? parsed.fonts : [];
  } catch (err) {
    console.error("Error reading customFonts.json:", err);
    return [];
  }
}

function writeCustomFonts(fonts) {
  try {
    const data = JSON.stringify({ fonts }, null, 2);
    fs.writeFileSync(CUSTOM_FONTS_PATH, data, "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing customFonts.json:", err);
    return false;
  }
}

export async function GET() {
  try {
    const customFonts = readCustomFonts();
    const allFonts = [...DEFAULT_FONTS, ...customFonts];

    return NextResponse.json({
      success: true,
      defaultFonts: DEFAULT_FONTS,
      customFonts,
      allFonts,
      curatedFonts: CURATED_THAI_FONTS,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { fontId, family, name, cssStack, googleFont, category, description } = body;

    const customFonts = readCustomFonts();

    // Check if font is from CURATED_THAI_FONTS by ID
    let fontToAdd = null;
    if (fontId) {
      const foundInCurated = CURATED_THAI_FONTS.find(
        (f) => f.id.toLowerCase() === fontId.toLowerCase()
      );
      if (foundInCurated) {
        fontToAdd = { ...foundInCurated };
      }
    }

    if (!fontToAdd) {
      if (!family || !cssStack || !googleFont) {
        return NextResponse.json(
          { success: false, error: "Missing required font fields (family, cssStack, googleFont)" },
          { status: 400 }
        );
      }
      fontToAdd = {
        id: fontId || cleanFontFamily(family).toLowerCase().replace(/\s+/g, "-"),
        name: name || family,
        family: cleanFontFamily(family),
        cssStack: cssStack || `'${cleanFontFamily(family)}', sans-serif`,
        googleFont,
        category: category || "sans-serif",
        description: description || "",
      };
    }

    // Check if font is already in DEFAULT_FONTS
    const isDefault = DEFAULT_FONTS.some(
      (f) => f.id.toLowerCase() === fontToAdd.id.toLowerCase() ||
             f.family.toLowerCase() === fontToAdd.family.toLowerCase()
    );
    if (isDefault) {
      return NextResponse.json({
        success: true,
        message: "Font is already part of default fonts",
        font: fontToAdd,
        allFonts: [...DEFAULT_FONTS, ...customFonts],
      });
    }

    // Check if already in customFonts
    const existingIndex = customFonts.findIndex(
      (f) => f.id.toLowerCase() === fontToAdd.id.toLowerCase() ||
             f.family.toLowerCase() === fontToAdd.family.toLowerCase()
    );

    if (existingIndex >= 0) {
      return NextResponse.json({
        success: true,
        message: "Font is already installed",
        font: customFonts[existingIndex],
        allFonts: [...DEFAULT_FONTS, ...customFonts],
      });
    }

    // Append and save
    const updatedCustomFonts = [...customFonts, fontToAdd];
    const saved = writeCustomFonts(updatedCustomFonts);

    if (!saved) {
      return NextResponse.json(
        { success: false, error: "Failed to persist custom font to disk" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Font added successfully",
      font: fontToAdd,
      allFonts: [...DEFAULT_FONTS, ...updatedCustomFonts],
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
