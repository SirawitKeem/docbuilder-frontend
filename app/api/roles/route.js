import { rolesRepo } from "@/lib/db/repositories";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const roles = await rolesRepo.getAll();
    return NextResponse.json(roles);
  } catch (err) {
    console.error("[/api/roles GET]", err);
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}
