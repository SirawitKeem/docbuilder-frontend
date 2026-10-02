import { counterpartiesRepo } from "@/lib/db/repositories";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    const item = await counterpartiesRepo.getById(resolvedParams.id);
    if (!item) {
      return NextResponse.json({ error: "Counterparty not found" }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (err) {
    console.error("[/api/counterparties/[id] GET]", err);
    return NextResponse.json({ error: "Failed to fetch counterparty" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    const updated = await counterpartiesRepo.update(resolvedParams.id, body);
    if (!updated) {
      return NextResponse.json({ error: "Counterparty not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[/api/counterparties/[id] PUT]", err);
    return NextResponse.json({ error: "Failed to update counterparty" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const resolvedParams = await params;
    await counterpartiesRepo.delete(resolvedParams.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/counterparties/[id] DELETE]", err);
    return NextResponse.json({ error: "Failed to delete counterparty" }, { status: 500 });
  }
}
