import { usersRepo, settingsRepo } from "@/lib/db/repositories";
import { NextResponse } from "next/server";

/**
 * GET /api/me
 * Returns the primary user for the organisation.
 * Falls back to settings.account if no users row is found.
 */
export async function GET() {
  try {
    const user = await usersRepo.getPrimary();
    if (user) {
      return NextResponse.json({
        id: user.id,
        name: user.fullName || user.name || "Admin",
        email: user.email || "",
        role: user.role || "admin",
      });
    }

    // Fallback: pull display name from settings.account
    const settings = await settingsRepo.get();
    const account = settings?.account || {};
    return NextResponse.json({
      id: null,
      name: account.name || account.fullName || "Admin",
      email: account.email || "",
      role: account.role || "admin",
    });
  } catch (err) {
    console.error("[/api/me]", err);
    return NextResponse.json({ id: null, name: "Admin", email: "", role: "admin" });
  }
}
