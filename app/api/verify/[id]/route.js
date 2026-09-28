import { NextResponse } from "next/server";
import { documentsRepo, settingsRepo } from "@/lib/db/repositories";

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

    const settings = await settingsRepo.get();
    const org = settings?.organization || {};
    const defaultSignatory =
      settings?.organizationSignatories?.find((s) => s.isDefault)?.name ||
      org?.signatoryName ||
      "ผู้มีอำนาจลงนาม";

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
      approvedBy: doc.approvedBy || doc.approvalChain?.[0]?.signatoryName || defaultSignatory,
      organization: {
        nameTh: org.name || "บริษัทของคุณ",
        nameEn: org.nameEn || "",
        taxId: org.taxId || "",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
