import { notificationsRepo } from "@/lib/db/repositories";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const notifications = await notificationsRepo.getAll();
    const unreadCount = await notificationsRepo.getUnreadCount();
    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error("GET /api/notifications error:", err);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, title, description, link, metadata } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const created = await notificationsRepo.create({
      type: type || "document_created",
      title,
      description: description || "",
      link: link || "/documents",
      metadata: metadata || {},
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/notifications error:", err);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();

    if (body.markAll) {
      await notificationsRepo.markAllAsRead();
      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (body.id) {
      await notificationsRepo.markAsRead(body.id);
      return NextResponse.json({ success: true, message: "Notification marked as read" });
    }

    return NextResponse.json({ error: "Missing id or markAll flag" }, { status: 400 });
  } catch (err) {
    console.error("PATCH /api/notifications error:", err);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const all = searchParams.get("all");

    if (all === "true") {
      await notificationsRepo.clearAll();
      return NextResponse.json({ success: true, message: "All notifications cleared" });
    }

    if (id) {
      await notificationsRepo.delete(id);
      return NextResponse.json({ success: true, message: "Notification deleted" });
    }

    return NextResponse.json({ error: "Missing id or all parameter" }, { status: 400 });
  } catch (err) {
    console.error("DELETE /api/notifications error:", err);
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
  }
}
