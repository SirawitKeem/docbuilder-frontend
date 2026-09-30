import { NextResponse } from "next/server";
import { customTemplatesRepo } from "@/lib/db/repositories";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const shares = await customTemplatesRepo.getShares(id);
    return NextResponse.json(shares || []);
  } catch (err) {
    console.error("Error fetching template shares:", err);
    return NextResponse.json({ error: "Failed to fetch shares" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { shareType, password, expiresAt, maxUses } = body;

    const created = await customTemplatesRepo.createShare({
      templateId: id,
      shareType: shareType || "view_only",
      passwordHash: password ? password : null, // Store or hash password
      expiresAt: expiresAt || null,
      maxUses: maxUses ? parseInt(maxUses, 10) : null,
      isActive: true,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("Error creating template share link:", err);
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { searchParams } = new URL(req.url);
    const shareId = searchParams.get("shareId");
    if (!shareId) {
      return NextResponse.json({ error: "shareId is required" }, { status: 400 });
    }

    const updates = await req.json();
    const updated = await customTemplatesRepo.updateShare(shareId, updates);
    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error updating template share:", err);
    return NextResponse.json({ error: "Failed to update share" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const shareId = searchParams.get("shareId");
    if (!shareId) {
      return NextResponse.json({ error: "shareId is required" }, { status: 400 });
    }

    const result = await customTemplatesRepo.deleteShare(shareId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error deleting template share:", err);
    return NextResponse.json({ error: "Failed to delete share" }, { status: 500 });
  }
}
