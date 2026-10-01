import { NextResponse } from "next/server";
import { categoriesRepo, customTemplatesRepo } from "@/lib/db/repositories";

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, fullName, description, icon, color, badge, order } = body;

    const updated = await categoriesRepo.update(id, {
      name,
      fullName,
      description,
      icon,
      color,
      badge,
      order,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error updating category:", err);
    return NextResponse.json({ error: err.message || "Failed to update category" }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const cascade = url.searchParams.get("cascade") === "true";
    const reassignTo = url.searchParams.get("reassignTo");

    // Check if any templates are linked to this category
    const templates = await customTemplatesRepo.getAll({ categoryId: id });
    if (templates.length > 0) {
      if (reassignTo) {
        // Reassign templates to target category
        for (const tmpl of templates) {
          await customTemplatesRepo.update(tmpl.id, { categoryId: reassignTo });
        }
      } else if (cascade) {
        // Soft delete all templates in this category
        for (const tmpl of templates) {
          await customTemplatesRepo.delete(tmpl.id);
        }
      } else {
        return NextResponse.json(
          { error: `ยังมีเทมเพลตอยู่ในหมวดหมู่นี้ ${templates.length} รายการ กรุณาย้ายหรือลบเทมเพลตก่อน` },
          { status: 400 }
        );
      }
    }

    const result = await categoriesRepo.delete(id);
    if (!result.success) {
      return NextResponse.json({ error: "ไม่พบหมวดหมู่ที่จะลบ" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error deleting category:", err);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
