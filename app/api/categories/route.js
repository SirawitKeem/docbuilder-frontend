import { NextResponse } from "next/server";
import { categoriesRepo, customTemplatesRepo } from "@/lib/db/repositories";

export async function GET() {
  try {
    const [categories, customTemplates] = await Promise.all([
      categoriesRepo.getAll(),
      customTemplatesRepo.getAll(),
    ]);

    // Map template count per category dynamically
    const categoriesWithCount = categories.map((cat) => {
      const count = (customTemplates || []).filter((t) => t.categoryId === cat.id).length;
      return {
        ...cat,
        templateCount: count,
      };
    });

    return NextResponse.json(categoriesWithCount);
  } catch (err) {
    console.error("Error fetching categories:", err);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, fullName, description, icon, color, badge, order } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "กรุณาระบุชื่อหมวดหมู่" }, { status: 400 });
    }

    const created = await categoriesRepo.create({
      name: name.trim(),
      fullName: fullName?.trim() || name.trim(),
      description: description || "",
      icon: icon || "FileText",
      color: color || "purple",
      badge: badge || "หมวดใหม่",
      order: order || 1,
      createdByUserId: body.createdByUserId,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("Error creating category:", err);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
