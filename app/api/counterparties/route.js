import { counterpartiesRepo } from "@/lib/db/repositories";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const list = await counterpartiesRepo.getAll();
    return NextResponse.json(list);
  } catch (err) {
    console.error("[/api/counterparties GET]", err);
    return NextResponse.json({ error: "Failed to fetch counterparties" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const created = await counterpartiesRepo.create(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[/api/counterparties POST]", err);
    return NextResponse.json({ error: "Failed to create counterparty" }, { status: 500 });
  }
}
