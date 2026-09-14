export async function GET() {
  const isGraphConfigured = Boolean(
    process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.TENANT_ID
  );
  const isGmailConfigured = Boolean(
    process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
  );

  const configured = isGraphConfigured || isGmailConfigured;
  const email = isGraphConfigured
    ? process.env.EMAIL_FROM
    : isGmailConfigured
    ? process.env.GMAIL_USER
    : null;

  const provider = isGraphConfigured
    ? "Microsoft 365 (Graph API)"
    : isGmailConfigured
    ? "Gmail (SMTP)"
    : null;

  return Response.json({
    configured,
    email,
    provider,
  });
}
