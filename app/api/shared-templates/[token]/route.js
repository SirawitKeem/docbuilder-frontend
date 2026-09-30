import { NextResponse } from "next/server";
import { customTemplatesRepo } from "@/lib/db/repositories";

export async function GET(req, { params }) {
  try {
    const { token } = await params;
    const shareData = await customTemplatesRepo.getShareByToken(token);

    if (!shareData) {
      return NextResponse.json(
        { error: "ลิงก์แชร์นี้ไม่ถูกต้อง หรือถูกยกเลิกแล้ว" },
        { status: 404 }
      );
    }

    // Check expiration
    if (shareData.expiresAt && new Date(shareData.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "ลิงก์แชร์นี้หมดอายุการใช้งานแล้ว" },
        { status: 410 }
      );
    }

    // Check max uses
    if (shareData.maxUses && shareData.viewCount > shareData.maxUses) {
      return NextResponse.json(
        { error: "ลิงก์แชร์นี้เกินจำนวนครั้งที่อนุญาตให้เปิดแล้ว" },
        { status: 403 }
      );
    }

    // Check password protection
    const passwordRequired = Boolean(shareData.passwordHash);
    const providedPassword = req.headers.get("x-share-password");

    if (passwordRequired && providedPassword !== shareData.passwordHash) {
      return NextResponse.json(
        {
          passwordRequired: true,
          templateName: shareData.templateName,
          error: providedPassword ? "รหัสผ่านไม่ถูกต้อง" : "กรุณากรอกรหัสผ่านเพื่อเข้าดูเอกสาร",
        },
        { status: 401 }
      );
    }

    // Parse pages safely
    let pages = shareData.pages;
    if (typeof pages === "string") {
      try {
        pages = JSON.parse(pages);
      } catch {
        pages = [];
      }
    }

    return NextResponse.json({
      id: shareData.id,
      templateId: shareData.templateId,
      templateName: shareData.templateName,
      categoryId: shareData.categoryId,
      editorType: shareData.editorType,
      canvasPreset: shareData.canvasPreset,
      pages: pages || [],
      theme: shareData.theme || {},
      governancePolicy: shareData.governancePolicy || {},
      shareType: shareData.shareType,
      viewCount: shareData.viewCount,
    });
  } catch (err) {
    console.error("Error fetching shared template:", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการโหลดเทมเพลต" },
      { status: 500 }
    );
  }
}
