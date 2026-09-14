import { NextResponse } from "next/server";
import { customTokensRepo } from "@/lib/db/repositories";

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const result = await customTokensRepo.delete(id);
    if (!result.success) {
      return NextResponse.json({ error: "ไม่พบตัวแปรที่จะลบ" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error deleting custom token:", err);
    return NextResponse.json({ error: "Failed to delete custom token" }, { status: 500 });
  }
}