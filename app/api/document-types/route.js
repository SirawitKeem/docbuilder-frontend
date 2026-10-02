import { documentTypesRepo } from "@/lib/db/repositories";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const list = await documentTypesRepo.getAll();
    return NextResponse.json(list);
  } catch (err) {
    console.error("[/api/document-types GET]", err);
    return NextResponse.json({ error: "Failed to fetch document types" }, { status: 500 });
  }
}
