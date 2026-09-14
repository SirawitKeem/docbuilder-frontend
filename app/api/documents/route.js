import { documentsRepo, notificationsRepo } from "@/lib/db/repositories";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    const doc = await documentsRepo.getById(id);
    if (!doc) return Response.json({ error: "ไม่พบเอกสารนี้" }, { status: 404 });
    return Response.json(doc);
  }

  const documents = await documentsRepo.getAll();
  return Response.json(documents);
}

export async function POST(request) {
  const body = await request.json();
  if (body.id) {
    const existing = await documentsRepo.getById(body.id);
    if (existing) {
      const updated = await documentsRepo.update(body.id, body);
      return Response.json(updated);
    }
  }
  const record = await documentsRepo.create(body);
  try {
    await notificationsRepo.create({
      type: "document_created",
      title: "บันทึกเอกสารสำเร็จ",
      description: `บันทึกเอกสาร "${record.name || body.name || "เอกสาร"}" ลงในระบบเรียบร้อยแล้ว`,
      link: "/documents",
      metadata: { documentId: record.id, templateId: record.templateId },
    });
  } catch (err) {
    console.warn("Notification error:", err);
  }
  return Response.json(record);
}

export async function PUT(request) {
  const body = await request.json();
  if (!body.id) return Response.json({ error: "Missing id" }, { status: 400 });
  const updated = await documentsRepo.update(body.id, body);
  return Response.json(updated);
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const idsParam = searchParams.get("ids");

  if (idsParam) {
    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
    await documentsRepo.delete(ids);
    return Response.json({ success: true, count: ids.length });
  }

  try {
    const body = await request.json();
    if (body?.ids && Array.isArray(body.ids)) {
      await documentsRepo.delete(body.ids);
      return Response.json({ success: true, count: body.ids.length });
    }
    if (body?.id) {
      await documentsRepo.delete(body.id);
      return Response.json({ success: true });
    }
  } catch {
    // Body is empty or not JSON, proceed with searchParams
  }

  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });
  await documentsRepo.delete(id);
  return Response.json({ success: true });
}
