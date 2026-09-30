import { NextResponse } from "next/server";
import { customTemplatesRepo } from "@/lib/db/repositories";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const template = await customTemplatesRepo.getById(id);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    return NextResponse.json(template.governancePolicy || {});
  } catch (err) {
    console.error("Error fetching governance policy:", err);
    return NextResponse.json({ error: "Failed to fetch governance policy" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await customTemplatesRepo.updateGovernance(id, body);
    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error updating governance policy:", err);
    return NextResponse.json({ error: "Failed to update governance policy" }, { status: 500 });
  }
}
