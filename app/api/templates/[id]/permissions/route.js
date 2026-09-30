import { NextResponse } from "next/server";
import { customTemplatesRepo } from "@/lib/db/repositories";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const permissions = await customTemplatesRepo.getPermissions(id);
    return NextResponse.json(permissions || []);
  } catch (err) {
    console.error("Error fetching template permissions:", err);
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { granteeType, granteeId, granteeName, permissionLevel } = body;

    if (!granteeType) {
      return NextResponse.json({ error: "granteeType is required" }, { status: 400 });
    }

    const created = await customTemplatesRepo.addPermission({
      templateId: id,
      granteeType,
      granteeId: granteeId || null,
      granteeName: granteeName || "",
      permissionLevel: permissionLevel || "creator",
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("Error creating template permission:", err);
    return NextResponse.json({ error: "Failed to create permission" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const permissionId = searchParams.get("permissionId");

    if (!permissionId) {
      return NextResponse.json({ error: "permissionId is required" }, { status: 400 });
    }

    const result = await customTemplatesRepo.deletePermission(permissionId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error deleting template permission:", err);
    return NextResponse.json({ error: "Failed to delete permission" }, { status: 500 });
  }
}
