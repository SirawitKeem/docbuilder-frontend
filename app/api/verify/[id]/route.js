import { NextResponse } from "next/server";
import { documentsRepo } from "@/lib/db/repositories";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const doc = await documentsRepo.getById(id);

    if (!doc) {
      return NextResponse.json({
        valid: false,
        error: "ไม่พบเอกสารนี้ หรือรหัสการยืนยันไม่ถูกต้อง",
      }, { status: 404 });
    }

    return NextResponse.json({
      valid: doc.status === "completed",
      status: doc.status,
      documentId: doc.id,
      verificationToken: doc.verificationToken || doc.id,
      name: doc.name,
      templateName: doc.templateName,
      createdAt: doc.createdAt,
      createdBy: doc.createdBy || "ผู้จัดทำเอกสาร",
      approvedAt: doc.approvedAt || doc.updatedAt,
      approvedBy: doc.approvedBy || "นายศรายุทธ โกสิยารักษ์ (กรรมการผู้จัดการ)",
      organization: {
        nameTh: "บริษัท เครสท์ เซนโด จำกัด",
        nameEn: "CREST ZENDO CO., LTD.",
        taxId: "0105564088911",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
