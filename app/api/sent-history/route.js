import { sentHistoryRepo } from "@/lib/db/repositories";

export async function GET() {
  try {
    const list = await sentHistoryRepo.getAll();
    return Response.json(list);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return Response.json({ error: "ไม่พบรหัสประวัติการส่ง" }, { status: 400 });
    }
    await sentHistoryRepo.delete(id);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
