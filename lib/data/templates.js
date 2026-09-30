import { SYSTEM_CATEGORIES, SYSTEM_SUB_TEMPLATES } from "../templates/catalog.js";

export const CATEGORIES = SYSTEM_CATEGORIES;
export const SUB_TEMPLATES = SYSTEM_SUB_TEMPLATES;

export async function getTemplates() {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      console.warn("Failed to fetch /api/categories, falling back:", e);
    }
  }
  return CATEGORIES;
}

export async function getTemplatesByCategory(categoryId) {
  if (!categoryId) return [];
  const normalized = categoryId.toLowerCase();
  const systemItems = (SUB_TEMPLATES[normalized] || []).map((s) => ({
    ...s,
    isSystem: true,
  }));

  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/templates?categoryId=${encodeURIComponent(normalized)}`);
      if (res.ok) {
        const dbItems = await res.json();
        if (Array.isArray(dbItems) && dbItems.length > 0) {
          // Templates from PostgreSQL are canonical Single Source of Truth
          const dbIds = new Set(dbItems.map((d) => d.id));
          const dbNames = new Set(dbItems.map((d) => (d.name || "").trim().toLowerCase()));

          // Include system catalog items only if not already represented in PostgreSQL
          const remainingSystem = systemItems.filter((s) => {
            if (dbIds.has(s.id)) return false;
            if (dbNames.has((s.name || "").trim().toLowerCase())) return false;
            return true;
          });

          const formattedDbItems = dbItems.map((item) => ({
            ...item,
            isCustom: item.isCustom ?? !item.isStandard,
            badge: item.badge || (item.isStandard ? "มาตรฐาน" : "กำหนดเอง"),
          }));

          return [...formattedDbItems, ...remainingSystem];
        }
      }
    } catch (e) {
      console.warn("Failed to fetch /api/templates by category:", e);
    }
  }
  return systemItems;
}

export function getSubTemplateById(subTemplateId) {
  if (!subTemplateId) return null;
  for (const list of Object.values(SUB_TEMPLATES)) {
    const found = list.find((t) => t.id === subTemplateId);
    if (found) return found;
  }
  return null;
}