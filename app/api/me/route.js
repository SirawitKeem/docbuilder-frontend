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
        role: user.roleName || user.role || "owner",
        roleId: user.roleId,
        roleDisplayNameTh: user.roleDisplayNameTh || "เจ้าของระบบ",
        roleDisplayNameEn: user.roleDisplayNameEn || "Workspace Owner",
        permissions: user.rolePermissions || {},
      });
    }

    // Fallback: pull display name from settings.account
    const settings = await settingsRepo.get();
    const account = settings?.account || {};
    return NextResponse.json({
      id: null,
      name: account.name || account.fullName || "Admin",
      email: account.email || "",
      role: account.role || "owner",
      roleId: account.roleId || "01a0fa9c-0db9-74e5-9879-45ab12c71056",
      roleDisplayNameTh: account.roleDisplayNameTh || "เจ้าของระบบ",
      roleDisplayNameEn: account.roleDisplayNameEn || "Workspace Owner",
      permissions: { all: true },
    });
  } catch (err) {
    console.error("[/api/me]", err);
    return NextResponse.json({
      id: null,
      name: "Admin",
      email: "",
      role: "owner",
      roleDisplayNameTh: "เจ้าของระบบ",
      roleDisplayNameEn: "Workspace Owner",
      permissions: { all: true }
    });
  }
}
