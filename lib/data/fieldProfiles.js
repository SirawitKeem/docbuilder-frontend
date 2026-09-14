export async function listFieldProfiles() {
  const res = await fetch("/api/field-profiles");
  return res.ok ? res.json() : [];
}

export async function getFieldProfile(id) {
  if (!id) return null;
  const res = await fetch(`/api/field-profiles/${id}`);
  return res.ok ? res.json() : null;
}

export async function createFieldProfile(data) {
  const res = await fetch("/api/field-profiles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("สร้างข้อมูลไม่สำเร็จ");
  return res.json();
}

export async function updateFieldProfile(id, data) {
  const res = await fetch(`/api/field-profiles/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("บันทึกข้อมูลไม่สำเร็จ");
  return res.json();
}

export async function deleteFieldProfile(id) {
  const res = await fetch(`/api/field-profiles/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("ลบข้อมูลไม่สำเร็จ");
}
