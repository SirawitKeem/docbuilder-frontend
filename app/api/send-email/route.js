import nodemailer from "nodemailer";
import { documentsRepo, sentHistoryRepo, notificationsRepo } from "@/lib/db/repositories";

async function getAccessToken() {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
  });

  const response = await fetch(
    `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || JSON.stringify(data));
  }
  return data.access_token;
}

function resolveContentType(fileName, defaultType = "application/pdf") {
  if (!fileName) return defaultType;
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/pdf";
}

async function sendGraphMail({ to, subject, message, attachmentBase64, attachmentName, contentType }) {
  const token = await getAccessToken();
  const resolvedType = contentType || resolveContentType(attachmentName);

  const attachments = attachmentBase64
    ? [
        {
          "@odata.type": "#microsoft.graph.fileAttachment",
          name: attachmentName || "document.pdf",
          contentType: resolvedType,
          contentBytes: attachmentBase64,
        },
      ]
    : [];

  const payload = {
    message: {
      subject,
      body: { contentType: "Text", content: message },
      toRecipients: [{ emailAddress: { address: to } }],
      attachments,
    },
    saveToSentItems: true,
  };

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${process.env.EMAIL_FROM}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.error?.message || JSON.stringify(errorData));
  }
}

export async function POST(request) {
  try {
    const { documentId, to, subject, message, attachmentBase64, attachmentName, contentType, templateId, templateName, values } =
      await request.json();

    if (!to || !subject) {
      return Response.json(
        { error: "กรุณาระบุผู้รับและหัวข้อ" },
        { status: 400 }
      );
    }

    const resolvedType = contentType || resolveContentType(attachmentName);

    const historyPayload = {
      documentId: documentId || null,
      name: attachmentName || "Document.pdf",
      templateId: templateId || "nda",
      templateName: templateName || "เอกสาร",
      sentTo: to,
      subject: subject || "เอกสาร",
      values: values || {},
      status: "delivered",
      sentAt: new Date().toISOString(),
    };

    const recordTransmission = async () => {
      // 1. Record Audit Log in Sent History
      await sentHistoryRepo.create(historyPayload);

      // 2. If a documentId is passed, update lastSentAt on the document without creating a duplicate
      if (documentId) {
        try {
          const existing = await documentsRepo.getById(documentId);
          if (existing) {
            await documentsRepo.update(documentId, {
              ...existing,
              sentTo: to,
              lastSentAt: new Date().toISOString(),
            });
            await documentsRepo.addActivityLog(documentId, {
              action: "email",
              performedBy: "ผู้ส่ง (Admin)",
              details: `ส่งอีเมลไปยัง ${to}`,
              comment: subject || "",
            });
          }
        } catch (e) {
          console.warn("Update document lastSentAt error:", e);
        }
      }

      // 3. Create real-time notification
      try {
        await notificationsRepo.create({
          type: "email_sent",
          title: "ส่งเอกสารทางอีเมลสำเร็จ",
          description: `ส่ง ${templateName || attachmentName || "เอกสาร"} ไปยัง ${to} เรียบร้อยแล้ว`,
          link: "/history",
          metadata: { documentId, to, subject },
        });
      } catch (notifErr) {
        console.warn("Notification error:", notifErr);
      }
    };

    // If Microsoft Graph API credentials are set, use Microsoft Graph
    if (process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.TENANT_ID) {
      await sendGraphMail({ to, subject, message, attachmentBase64, attachmentName, contentType: resolvedType });
      await recordTransmission();
      return Response.json({ success: true, provider: "Microsoft Graph" });
    }

    // Fallback: Gmail via Nodemailer
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      const attachments = attachmentBase64
        ? [
            {
              filename: attachmentName || "document.pdf",
              content: Buffer.from(attachmentBase64, "base64"),
              contentType: resolvedType,
            },
          ]
        : [];

      await transporter.sendMail({
        from: `"Document Generator" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        text: message,
        attachments,
      });

      await recordTransmission();

      return Response.json({ success: true, provider: "Nodemailer (Gmail)" });
    }

    return Response.json(
      { error: "ไม่พบการตั้งค่าอีเมลในระบบ (.env)" },
      { status: 500 }
    );
  } catch (error) {
    console.error("send-email error:", error);
    return Response.json(
      { error: error.message || "ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
