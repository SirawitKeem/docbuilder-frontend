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

    // Check if category is built-in protected
    if (["quotation", "nda", "partner", "distributor", "notification", "contracts", "partnerships", "finance"].includes(id.toLowerCase())) {
      return NextResponse.json(
        { error: "ไม่สามารถลบหมวดหมู่พื้นฐานของระบบได้" },
        { status: 400 }
      );
    }

    // Check if any custom templates are linked
    const templates = await customTemplatesRepo.getAll({ categoryId: id });
    if (templates.length > 0) {
      return NextResponse.json(
        { error: `ยังมีเทมเพลตอยู่ในหมวดหมู่นี้ ${templates.length} รายการ กรุณาย้ายหรือลบเทมเพลตก่อน` },
        { status: 400 }
      );
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
