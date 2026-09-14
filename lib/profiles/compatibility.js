import { templateRegistry } from "@/lib/templates/registry";
import { scanCanvasTokens } from "@/lib/tokens/entityTokenExtractor";
import { fieldRegistry } from "@/lib/profiles/fieldRegistry";

// ─── System Template Helpers ───────────────────────────────────────────────

export function getAllTemplateSchemas() {
  return Object.values(templateRegistry).map((entry) => entry.schema);
}

export function getTemplateRequiredKeys(templateId) {
  const entry = templateRegistry[templateId];
  if (!entry || !entry.schema?.fields) return [];
  return entry.schema.fields.filter((f) => f.required && f.sharedKey).map((f) => f.sharedKey);
}

export function getTemplateAllKeys(templateId) {
  const entry = templateRegistry[templateId];
  if (!entry || !entry.schema?.fields) return [];
  return entry.schema.fields.filter((f) => f.sharedKey).map((f) => f.sharedKey);
}

export function checkCompatibility(profileValues, templateId, customSchema = null) {
  const entry = templateRegistry[templateId];
  const schema = entry?.schema || customSchema;
  if (!schema?.fields) {
    return { templateId, required: [], missing: [], matchedKeys: [], isComplete: false };
  }
  const required = schema.fields.filter((f) => f.required && f.sharedKey).map((f) => f.sharedKey);
  const allKeys = schema.fields.filter((f) => f.sharedKey).map((f) => f.sharedKey);
  const missing = required.filter((k) => !profileValues?.[k]?.trim?.());
  const matchedKeys = allKeys.filter((k) => profileValues?.[k]?.trim?.());

  return {
    templateId,
    required,
    missing,
    matchedKeys,
    isComplete: required.length > 0 ? missing.length === 0 : matchedKeys.length > 0,
  };
}

// คืนเฉพาะเทมเพลตที่ profile นี้เกี่ยวข้องด้วย (มีอย่างน้อย 1 field ตรงกัน หรือสมบูรณ์)
export function getRelevantTemplates(profileValues, allSchemas = null) {
  const schemas = allSchemas && allSchemas.length > 0 ? allSchemas : getAllTemplateSchemas();
  return schemas
    .map((schema) => ({
      schema,
      templateId: schema.id,
      ...checkCompatibility(profileValues, schema.id, schema),
    }))
    .filter((r) => (r.matchedKeys && r.matchedKeys.length > 0) || (r.required && r.required.some((k) => profileValues?.[k]?.trim?.())) || r.isComplete);
}

// ─── Dynamic Template Schemas (System + Custom) ────────────────────────────

/**
 * สร้าง Schema สำหรับ Custom Template โดย Auto-detect entity tokens บน canvas, blocks และ fields
 * @param {Object} customTemplate - from db.customTemplates[] or API
 * @param {Array} customTokens - from /api/custom-tokens
 * @returns {Object} schema compatible with ProfileForm
 */
export function buildCustomTemplateSchema(customTemplate, customTokens = []) {
  const allTokens = scanCanvasTokens(customTemplate);
  const fields = [];
  const seenKeys = new Set();

  allTokens.forEach((key) => {
    if (seenKeys.has(key)) return;
    seenKeys.add(key);

    // 1. Check standard fieldRegistry (company, contact, signatory, etc.)
    if (fieldRegistry[key]) {
      fields.push({
        sharedKey: key,
        label: fieldRegistry[key].label,
        category: fieldRegistry[key].category || "company",
        placeholder: fieldRegistry[key].placeholder || "",
        required: false,
      });
      return;
    }

    // 2. Check custom tokens registry
    const customDef = customTokens.find((t) => t.key === key);
    if (customDef) {
      fields.push({
        sharedKey: key,
        label: customDef.label,
        category: "custom",
        placeholder: customDef.example || "",
        required: false,
      });
      return;
    }

    // 3. Dynamic token in canvas (e.g. project_name, etc.)
    const readableLabel = key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    fields.push({
      sharedKey: key,
      label: readableLabel,
      category: "custom",
      isDynamic: true,
      required: false,
    });
  });

  return {
    id: customTemplate.id,
    name: customTemplate.name || `Custom: ${customTemplate.id}`,
    categoryId: customTemplate.categoryId,
    editorType: customTemplate.editorType || "document",
    badge: customTemplate.badge,
    profileSchemaId: "custom",
    isCustomTemplate: true,
    fields,
  };
}

/**
 * Async: ดึง Custom Templates จาก API แล้วรวมกับ System Templates
 * @param {Array} customTokens - จาก /api/custom-tokens
 * @returns {Array} combined template schemas
 */
export async function getDynamicTemplateSchemas(customTokens = []) {
  const systemSchemas = getAllTemplateSchemas();

  try {
    const res = await fetch("/api/templates", { cache: "no-store" });
    if (!res.ok) return systemSchemas;
    const customTemplates = await res.json();

    const customSchemas = (customTemplates || []).map((t) =>
      buildCustomTemplateSchema(t, customTokens)
    );

    return [...systemSchemas, ...customSchemas];
  } catch {
    return systemSchemas;
  }
}
