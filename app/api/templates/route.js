import { NextResponse } from "next/server";
import { customTemplatesRepo, categoriesRepo } from "@/lib/db/repositories";
import { synthesizeCanvasPagesFromTemplate } from "@/lib/templates/blockToCanvas";

function isUuid(str) {
  return typeof str === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

async function resolveCategoryId(raw) {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (isUuid(trimmed)) return trimmed;

  try {
    const categories = await categoriesRepo.getAll();
    const lower = trimmed.toLowerCase();
    const match = categories.find(
      (c) =>
        c.id === trimmed ||
        c.name?.toLowerCase() === lower ||
        c.fullName?.toLowerCase() === lower ||
        (lower === "nda" && c.name?.toLowerCase().includes("nda")) ||
        (lower === "quotation" && c.name?.toLowerCase().includes("quotation")) ||
        (lower === "notification" && c.name?.toLowerCase().includes("notification")) ||
        (lower === "partner" && c.name?.toLowerCase().includes("partner")) ||
        (lower === "distributor" && c.name?.toLowerCase().includes("distributor"))
    );
    if (match) return match.id;
    return categories[0]?.id || null;
  } catch {
    return null;
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const rawCategoryId = searchParams.get("categoryId");
    const categoryId = rawCategoryId && rawCategoryId !== "all"
      ? (await resolveCategoryId(rawCategoryId)) || rawCategoryId
      : null;

    const templates = await customTemplatesRepo.getAll(categoryId ? { categoryId } : {});
    return NextResponse.json(templates);
  } catch (err) {
    console.error("Error fetching custom templates:", err);
    return NextResponse.json({ error: "Failed to fetch custom templates" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      name,
      categoryId,
      description,
      icon,
      badge,
      status,
      orientation,
      theme,
      blocks,
      pageCount,
      pages,
      editorType,
      canvasPreset,
      sheetData,
      margin,
      customTokens,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "กรุณาระบุชื่อเทมเพลต" }, { status: 400 });
    }

    const resolvedCategoryId = await resolveCategoryId(categoryId);

    const validEditorTypes = ["document", "slide", "sheet", "artwork"];
    const safeEditorType = editorType && validEditorTypes.includes(editorType) ? editorType : "document";
    const safeCanvasPreset = canvasPreset || (safeEditorType === "slide" ? "slide-16-9" : (safeEditorType === "sheet" ? null : "a4-portrait"));

    let effectivePages = Array.isArray(pages) ? pages : [];
    if (effectivePages.length === 0 && safeEditorType !== "sheet") {
      const synthesized = synthesizeCanvasPagesFromTemplate({
        ...body,
        categoryId: resolvedCategoryId || categoryId,
        name: name.trim(),
      });
      if (synthesized && synthesized.length > 0) {
        effectivePages = synthesized;
      }
    }

    const created = await customTemplatesRepo.create({
      name: name.trim(),
      categoryId: resolvedCategoryId,
      editorType: safeEditorType,
      canvasPreset: safeCanvasPreset,
      description: description || "",
      icon: icon || (safeEditorType === "sheet" ? "Table" : "FileText"),
      badge: badge || (safeEditorType === "sheet" ? "สเปรดชีต" : "กำหนดเอง"),
      status: status || "published",
      orientation: orientation || "portrait",
      margin: margin || null,
      theme: theme || {
        primaryColor: safeEditorType === "sheet" ? "#059669" : "#5542F6",
        backgroundColor: "#FFFFFF",
        hasWatermark: false,
      },
      pageCount: pageCount || (effectivePages?.length || 1),
      pages: effectivePages,
      sheetData: Array.isArray(sheetData) ? sheetData : [],
      blocks: Array.isArray(blocks) ? blocks : [],
      customTokens: Array.isArray(customTokens) ? customTokens : [],
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("Error creating custom template:", err);
    return NextResponse.json({ error: err.message || "Failed to create custom template" }, { status: 500 });
  }
}
