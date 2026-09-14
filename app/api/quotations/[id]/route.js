import { quotationsRepo } from "@/lib/db/repositories";

export async function GET(request, { params }) {
  const { id } = await params;
  const item = await quotationsRepo.getById(id);
  if (!item) return Response.json({ error: "ไม่พบใบเสนอราคานี้" }, { status: 404 });
  return Response.json(item);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const updated = await quotationsRepo.update(id, body);
  if (!updated) return Response.json({ error: "ไม่พบใบเสนอราคาที่จะแก้ไข" }, { status: 404 });
  return Response.json(updated);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const result = await quotationsRepo.delete(id);
  if (!result.success) return Response.json({ error: "ไม่พบใบเสนอราคาที่จะลบ" }, { status: 404 });
  return Response.json(result);
}
