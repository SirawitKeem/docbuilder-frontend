import { NextResponse } from "next/server";
import { customTemplatesRepo } from "@/lib/db/repositories";
import { synthesizeCanvasPagesFromTemplate } from "@/lib/templates/blockToCanvas";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");

    const templates = await customTemplatesRepo.getAll({ categoryId });
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
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "กรุณาระบุชื่อเทมเพลต" }, { status: 400 });
    }

    const validEditorTypes = ["document", "slide", "sheet"];
    const safeEditorType = editorType && validEditorTypes.includes(editorType) ? editorType : "document";
    const safeCanvasPreset = canvasPreset || (safeEditorType === "slide" ? "slide-16-9" : "a4-portrait");

    let effectivePages = Array.isArray(pages) ? pages : [];
    if (effectivePages.length === 0 && safeEditorType !== "sheet") {
      const synthesized = synthesizeCanvasPagesFromTemplate({
        ...body,
        categoryId: categoryId || "forms",
        name: name.trim(),
      });
      if (synthesized && synthesized.length > 0) {
        effectivePages = synthesized;
      }
    }

    const created = await customTemplatesRepo.create({
      name: name.trim(),
      categoryId: categoryId || "forms",
      editorType: safeEditorType,
      canvasPreset: safeCanvasPreset,
      description: description || "",
      icon: icon || (safeEditorType === "sheet" ? "Table" : "FileText"),
      badge: badge || "กำหนดเอง",
      status: status || "published",
      orientation: orientation || "portrait",
      margin: margin || null,
      theme: theme || {
        primaryColor: "#5542F6",
        backgroundColor: "#FFFFFF",
        hasWatermark: false,
      },
      pageCount: pageCount || (effectivePages?.length || 1),
      pages: effectivePages,
      sheetData: Array.isArray(sheetData) ? sheetData : [],
      blocks: Array.isArray(blocks) ? blocks : [],
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("Error creating custom template:", err);
    return NextResponse.json({ error: "Failed to create custom template" }, { status: 500 });
  }
}
