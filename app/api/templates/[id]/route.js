import { NextResponse } from "next/server";
import { customTemplatesRepo } from "@/lib/db/repositories";
import { synthesizeCanvasPagesFromTemplate } from "@/lib/templates/blockToCanvas";

export async function GET(req, { params }) {
  try {
    const { id: rawId } = await params;
    const effectiveId = rawId === "tmpl-notification-relocation" || rawId === "notification"
      ? "tmpl-notification-standard"
      : rawId;
    let template = await customTemplatesRepo.getById(effectiveId);

    if (!template) {
      return NextResponse.json({ error: "ไม่พบเทมเพลตนี้" }, { status: 404 });
    }

    // Check if template has rich valid canvas objects
    const hasValidCanvasObjects =
      Array.isArray(template.pages) &&
      template.pages.length > 0 &&
      template.pages.some((p) => {
        try {
          const parsed = typeof p.json === "string" ? JSON.parse(p.json) : p.json;
          return Array.isArray(parsed?.objects) && parsed.objects.length > 0;
        } catch {
          return false;
        }
      });

    // Auto-synthesize canvas pages if missing, empty, or incomplete
    if (!hasValidCanvasObjects) {
      const synthesized = synthesizeCanvasPagesFromTemplate(template);
      if (synthesized && synthesized.length > 0) {
        template.pages = synthesized;
        template.pageCount = synthesized.length;
      }
    }

    return NextResponse.json(template);
  } catch (err) {
    console.error("Error fetching template by id:", err);
    return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updateData = {
      ...body,
      publishSnapshot: body.publishSnapshot === true || (
        body.publishSnapshot === undefined && body.status === "published"
      ),
    };

    const updated = await customTemplatesRepo.update(id, updateData);
    if (!updated) {
      return NextResponse.json({ error: "ไม่พบเทมเพลตนี้" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error updating template:", err);
    return NextResponse.json({ error: err.message || "Failed to update template" }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const result = await customTemplatesRepo.delete(id);
    if (!result.success) {
      return NextResponse.json({ error: "ไม่พบเทมเพลตที่จะลบ" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error deleting template:", err);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
