export async function listQuotations() {
  const res = await fetch("/api/quotations");
  return res.ok ? res.json() : [];
}

export async function getQuotation(id) {
  if (!id) return null;
  const res = await fetch(`/api/quotations/${id}`);
  return res.ok ? res.json() : null;
}

export async function createQuotation(data) {
  const res = await fetch("/api/quotations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("สร้างใบเสนอราคาไม่สำเร็จ");
  return res.json();
}

export async function updateQuotation(id, data) {
  const res = await fetch(`/api/quotations/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("บันทึกใบเสนอราคาไม่สำเร็จ");
  return res.json();
}

export async function deleteQuotation(id) {
  const res = await fetch(`/api/quotations/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("ลบใบเสนอราคาไม่สำเร็จ");
}

export async function createQuotationRevision(id) {
  const res = await fetch(`/api/quotations/${id}/revision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("สร้างฉบับปรับปรุงไม่สำเร็จ");
  return res.json();
}
