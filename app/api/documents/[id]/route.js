import { NextResponse } from "next/server";
import { documentsRepo } from "@/lib/db/repositories";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const doc = await documentsRepo.getById(id);
    if (!doc) {
      return NextResponse.json({ error: "ไม่พบเอกสารนี้ในระบบ" }, { status: 404 });
    }
    return NextResponse.json(doc);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await documentsRepo.update(id, body);
    if (!updated) {
      return NextResponse.json({ error: "ไม่พบเอกสารที่จะแก้ไข" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const result = await documentsRepo.delete(id);
    if (!result.success) {
      return NextResponse.json({ error: "ไม่พบเอกสารที่จะลบ" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
