import {
  documentAuthorizationsRepo,
  documentsRepo,
  templatesRepo,
  usersRepo,
  notificationsRepo,
} from "@/lib/db/repositories";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const entityId = searchParams.get("entityId");
    const entityType = searchParams.get("entityType") || "document";

    if (!entityId) {
      return NextResponse.json({ error: "entityId is required" }, { status: 400 });
    }

    const authorizations = await documentAuthorizationsRepo.getByEntity(entityId, entityType);
    return NextResponse.json(authorizations);
  } catch (err) {
    console.error("[/api/authorizations GET]", err);
    return NextResponse.json({ error: "Failed to fetch authorizations" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      entityId,
      entityType = "document",
      userEmail,
      userName,
      roleTitle,
      permissionLevel = "viewer",
      grantedByEmail = "keem@crestzendo.com",
    } = body;

    if (!entityId || !userEmail) {
      return NextResponse.json(
        { error: "entityId and userEmail are required" },
        { status: 400 }
      );
    }

    // 1. Grant authorization
    const auth = await documentAuthorizationsRepo.grant({
      entityId,
      entityType,
      userEmail: userEmail.trim().toLowerCase(),
      userName: userName?.trim() || userEmail.split("@")[0],
      roleTitle: roleTitle?.trim() || null,
      permissionLevel,
      grantedByEmail,
    });

    // 2. Fetch document or template title for audit and notification
    let entityTitle = "เอกสาร";
    try {
      if (entityType === "document") {
        const doc = await documentsRepo.getById(entityId);
        if (doc) entityTitle = doc.name || doc.documentNumber || "เอกสาร";
      } else {
        const tmpl = await templatesRepo.getById(entityId);
        if (tmpl) entityTitle = tmpl.name || "แม่แบบ";
      }
    } catch (e) {
      console.warn("Could not fetch entity title:", e);
    }

    // 3. Create Notification if recipient exists in users table
    try {
      const allUsers = await usersRepo.getAll();
      const matchedUser = allUsers.find(
        (u) => u.email?.toLowerCase() === userEmail.trim().toLowerCase()
      );

      const roleLabels = {
        owner: "เจ้าของ",
        editor: "ผู้ร่วมแก้ไข (Can edit)",
        signer: "ผู้ลงนาม (Signer)",
        approver: "ผู้อนุมัติ (Approver)",
        viewer: "ผู้ดู (Viewer)",
      };

      await notificationsRepo.create({
        userId: matchedUser ? matchedUser.id : null,
        type: entityType === "template" ? "template_shared" : "document_shared",
        title: `คุณได้รับสิทธิ์เข้าถึง${entityType === "template" ? "แม่แบบ" : "เอกสาร"}`,
        message: `คุณได้รับสิทธิ์ "${roleLabels[permissionLevel] || permissionLevel}" ใน${entityType === "template" ? "แม่แบบ" : "เอกสาร"} "${entityTitle}" จาก ${grantedByEmail}`,
        linkUrl: entityType === "template" ? `/templates` : `/documents`,
        metadata: { entityId, entityType, permissionLevel },
      });

      // 4. Asynchronously send real email invitation
      sendShareEmailInvitation({
        to: userEmail.trim(),
        userName,
        entityTitle,
        entityType,
        permissionLevel,
        grantedByEmail,
        linkUrl: entityType === "template" ? `/templates` : `/documents`,
      }).catch((emailErr) => {
        console.warn("Share email dispatch warning:", emailErr);
      });
    } catch (notifErr) {
      console.warn("Failed to create share notification:", notifErr);
    }

    return NextResponse.json(auth, { status: 201 });
  } catch (err) {
    console.error("[/api/authorizations POST]", err);
    return NextResponse.json({ error: "Failed to grant authorization" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id, permissionLevel } = body;

    if (!id || !permissionLevel) {
      return NextResponse.json({ error: "id and permissionLevel are required" }, { status: 400 });
    }

    const updated = await documentAuthorizationsRepo.updatePermission(id, permissionLevel);
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[/api/authorizations PATCH]", err);
    return NextResponse.json({ error: "Failed to update authorization" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const res = await documentAuthorizationsRepo.revoke(id);
    return NextResponse.json(res);
  } catch (err) {
    console.error("[/api/authorizations DELETE]", err);
    return NextResponse.json({ error: "Failed to revoke authorization" }, { status: 500 });
  }
}

async function sendShareEmailInvitation({
  to,
  userName,
  entityTitle,
  entityType,
  permissionLevel,
  grantedByEmail,
  linkUrl,
}) {
  const roleLabels = {
    owner: "เจ้าของเอกสาร",
    editor: "ผู้ร่วมแก้ไข (Can edit)",
    signer: "ผู้ลงนาม (Signer)",
    approver: "ผู้อนุมัติ (Approver)",
    viewer: "ผู้ดู (Viewer)",
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const fullLink = `${appUrl}${linkUrl}`;
  const subject = `[DocBuilder] คุณได้รับสิทธิ์เข้าถึง${entityType === "template" ? "แม่แบบ" : "เอกสาร"}: ${entityTitle}`;

  const htmlMessage = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background-color: #FFFFFF;">
      <div style="border-bottom: 2px solid #4F46E5; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="color: #1E293B; margin: 0; font-size: 20px;">DocBuilder Document Notification</h2>
      </div>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        เรียน <strong>${userName || to}</strong>,
      </p>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        <strong>${grantedByEmail}</strong> ได้แชร์${entityType === "template" ? "แม่แบบเอกสาร" : "เอกสาร"}กับคุณในระบบ DocBuilder โดยกำหนดระดับสิทธิ์:
      </p>
      <div style="background-color: #F8FAFC; border-left: 4px solid #4F46E5; padding: 14px 18px; margin: 18px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0 0 6px 0; font-size: 14px; color: #64748B;">ชื่อ${entityType === "template" ? "แม่แบบ" : "เอกสาร"}:</p>
        <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #0F172A;">${entityTitle}</p>
        <p style="margin: 0 0 4px 0; font-size: 14px; color: #64748B;">สิทธิ์ของคุณ:</p>
        <p style="margin: 0; font-size: 15px; font-weight: 600; color: #4F46E5;">${roleLabels[permissionLevel] || permissionLevel}</p>
      </div>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${fullLink}" style="display: inline-block; background-color: #4F46E5; color: #FFFFFF; text-decoration: none; padding: 12px 28px; font-size: 14px; font-weight: bold; border-radius: 8px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);">
          เปิดดู${entityType === "template" ? "แม่แบบ" : "เอกสาร"}
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94A3B8; text-align: center; margin: 0;">
        อีเมลฉบับนี้ส่งโดยระบบอัตโนมัติจาก DocBuilder (Crest Zendo Co., Ltd.)
      </p>
    </div>
  `;

  // 1. Try Microsoft Graph
  if (process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.TENANT_ID && process.env.EMAIL_FROM) {
    try {
      const body = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        scope: "https://graph.microsoft.com/.default",
      });

      const tokenRes = await fetch(
        `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        }
      );
      if (tokenRes.ok) {
        const { access_token } = await tokenRes.json();
        await fetch(
          `https://graph.microsoft.com/v1.0/users/${process.env.EMAIL_FROM}/sendMail`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: {
                subject,
                body: { contentType: "HTML", content: htmlMessage },
                toRecipients: [{ emailAddress: { address: to } }],
              },
              saveToSentItems: false,
            }),
          }
        );
        return;
      }
    } catch (e) {
      console.warn("Microsoft Graph share email failed:", e);
    }
  }

  // 2. Try Nodemailer Gmail fallback
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      const nodemailer = (await import("nodemailer")).default;
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });
      await transporter.sendMail({
        from: `"DocBuilder" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html: htmlMessage,
      });
    } catch (e) {
      console.warn("Gmail share email failed:", e);
    }
  }
}
