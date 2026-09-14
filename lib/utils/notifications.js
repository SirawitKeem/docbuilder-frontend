/**
 * Helper to create a client-triggered notification and notify active UI components.
 */
export async function createClientNotification({
  type = "document_created",
  title,
  description = "",
  link = "/documents",
  metadata = {},
}) {
  try {
    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, description, link, metadata }),
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("docbuilder-notification-update"));
    }

    return await res.json();
  } catch (err) {
    console.warn("createClientNotification error:", err);
    return null;
  }
}
