import { NextResponse } from "next/server";
import { documentsRepo } from "@/lib/db/repositories";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, performedBy, comment, reason, signatureImg, details } = body;

    let result = null;

    if (action === "submit_approval") {
      result = await documentsRepo.submitForApproval(id, { performedBy, comment });
    } else if (action === "approve") {
      result = await documentsRepo.approveDocument(id, { performedBy, comment, signatureImg });
    } else if (action === "reject") {
      result = await documentsRepo.rejectDocument(id, { performedBy, reason: reason || comment });
    } else if (action === "add_log") {
      result = await documentsRepo.addActivityLog(id, { action: "comment", performedBy, details, comment });
    } else if (action === "export") {
      result = await documentsRepo.recordExportAction(id, { format: body.format || "PDF", performedBy, details });
    } else {
      return NextResponse.json({ error: "ไม่พบการกระทำ (Action) ที่ระบุ" }, { status: 400 });
    }

    if (!result) {
      return NextResponse.json({ error: "ไม่พบเอกสาร" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
