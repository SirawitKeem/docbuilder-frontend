import { fieldProfilesRepo } from "@/lib/db/repositories";

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const profile = await fieldProfilesRepo.getById(resolvedParams.id);
  if (!profile) return Response.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
  return Response.json(profile);
}

export async function PUT(request, { params }) {
  const resolvedParams = await params;
  const body = await request.json();
  const profile = await fieldProfilesRepo.update(resolvedParams.id, body);
  return Response.json(profile);
}

export async function DELETE(request, { params }) {
  const resolvedParams = await params;
  await fieldProfilesRepo.remove(resolvedParams.id);
  return Response.json({ success: true });
}
