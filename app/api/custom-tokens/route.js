import { NextResponse } from "next/server";
import { customTokensRepo } from "@/lib/db/repositories";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("templateId");
    const tokens = await customTokensRepo.getAll(templateId ? { templateId } : {});
    return NextResponse.json(tokens);
  } catch (err) {
    console.error("Error fetching custom tokens:", err);
    return NextResponse.json({ error: "Failed to fetch custom tokens" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { key, label, example, scope, dataType, category, templateId } = body;
    const created = await customTokensRepo.create({ key, label, example, scope, dataType, category, templateId });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("Error creating custom token:", err);
    return NextResponse.json({ error: err.message || "Failed to create custom token" }, { status: 400 });
  }
}
