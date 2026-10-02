import { usersRepo, documentsRepo } from "@/lib/db/repositories";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim().toLowerCase();

    // 1. Fetch team members (users)
    const users = await usersRepo.getAll();
    const teamSuggestions = users
      .filter((u) => u.email)
      .map((u) => ({
        id: u.id,
        name: u.fullName || u.email.split("@")[0],
        email: u.email,
        role: u.roleDisplayNameTh || u.roleName || "สมาชิกในทีม",
        type: "team",
        avatar: u.avatar || null,
      }));

    // 2. Derive recent recipients from documents.values (Unified Document Store)
    const recentDocs = await documentsRepo.getAll();
    const docSuggestions = [];
    for (const doc of recentDocs) {
      const v = doc.values || {};
      const email = v.customer_email || v.recipient_email || v.email;
      const name = v.customer_name || v.customer_company || v.recipient || v.contact_name;
      if (email || name) {
        docSuggestions.push({
          id: `doc-${doc.id}`,
          name: name || (email ? email.split("@")[0] : "ผู้รับ"),
          email: email || "",
          role: v.customer_company || "คู่ค้า / บุคคลภายนอก",
          type: "counterparty",
          avatar: null,
        });
      }
    }

    // Combine and deduplicate by email/name
    const all = [...teamSuggestions, ...docSuggestions];
    const seen = new Set();
    const unique = [];

    for (const item of all) {
      const key = (item.email || item.name).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    }

    // Filter by query if provided
    const filtered = query
      ? unique.filter(
          (u) =>
            u.name.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            u.role.toLowerCase().includes(query)
        )
      : unique;

    return NextResponse.json(filtered);
  } catch (err) {
    console.error("[/api/recipients/suggest GET]", err);
    return NextResponse.json({ error: "Failed to suggest recipients" }, { status: 500 });
  }
}
