import { quotationsRepo, notificationsRepo } from "@/lib/db/repositories";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const newRevision = await quotationsRepo.createRevision(id);
    try {
      await notificationsRepo.create({
        type: "revision_created",
        title: "สร้างฉบับปรับปรุงใหม่สำเร็จ",
        description: `สร้างใบเสนอราคาฉบับปรับปรุง ${newRevision.name || newRevision.quotationNo || ""} (Rev. ${newRevision.revision || ""}) เรียบร้อยแล้ว`,
        link: "/documents",
        metadata: { quotationId: newRevision.id, revision: newRevision.revision },
      });
    } catch (err) {
      console.warn("Notification error:", err);
    }
    return Response.json(newRevision);
  } catch (error) {
    console.error("Create quotation revision error:", error);
    return Response.json({ error: error.message || "สร้างฉบับปรับปรุงไม่สำเร็จ" }, { status: 500 });
  }
}
