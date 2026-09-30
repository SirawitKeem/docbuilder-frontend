/**
 * 🔍 DocBuilder Template & Category Resolver Engine
 * Single Source of Truth for resolving authentic template names and category names dynamically.
 * Eliminates all hardcoded strings and cleanly separates Category vs Template.
 */

import { SYSTEM_CATEGORIES, SYSTEM_DEFAULT_TEMPLATES, SYSTEM_SUB_TEMPLATES } from "./catalog.js";

export const LEGACY_TEMPLATE_ID_MAP = {
  quotation: "tmpl-quotation-standard",
  nda: "tmpl-nda-standard",
  partner: "tmpl-partner-standard",
  distributor: "tmpl-distributor-standard",
  notification: "tmpl-notification-standard",
};

/**
 * Resolves template and category information for any document or templateId.
 * @param {Object|string} docOrId - Document object or templateId string
 * @param {Array} customTemplatesList - Optional list of custom templates from DB/API
 * @param {Array} categoriesList - Optional list of categories from DB/API
 * @returns {Object} { templateId, templateName, categoryId, categoryName, categoryFullName, editorType }
 */
export function resolveTemplateAndCategory(docOrId, customTemplatesList = [], categoriesList = []) {
  if (!docOrId) {
    return {
      templateId: "general",
      templateName: "เอกสารทั่วไป",
      categoryId: "general",
      categoryName: "General",
      categoryFullName: "เอกสารทั่วไป",
      editorType: "document",
    };
  }

  const doc = typeof docOrId === "object" ? docOrId : { templateId: docOrId };
  const rawTemplateId = doc.templateId || (typeof docOrId === "string" ? docOrId : "general");
  const canonicalId = LEGACY_TEMPLATE_ID_MAP[rawTemplateId] || rawTemplateId;

  // 1. Check customTemplates list first (dynamic from DB)
  let foundTemplate = (customTemplatesList || []).find(
    (t) => t.id === canonicalId || t.id === rawTemplateId || (t.categoryId === rawTemplateId && t.badge === "มาตรฐาน")
  );

  // 2. Check SYSTEM_DEFAULT_TEMPLATES from catalog
  if (!foundTemplate) {
    foundTemplate = SYSTEM_DEFAULT_TEMPLATES.find(
      (t) => t.id === canonicalId || t.id === rawTemplateId || t.categoryId === rawTemplateId
    );
  }

  // 3. Check SYSTEM_SUB_TEMPLATES
  if (!foundTemplate && SYSTEM_SUB_TEMPLATES[rawTemplateId] && SYSTEM_SUB_TEMPLATES[rawTemplateId].length > 0) {
    foundTemplate = SYSTEM_SUB_TEMPLATES[rawTemplateId][0];
  }

  // 4. Resolve Category
  const categoryId = foundTemplate?.categoryId || doc.categoryId || rawTemplateId || "general";
  const allCategories = (categoriesList && categoriesList.length > 0) ? categoriesList : SYSTEM_CATEGORIES;
  const foundCategory = allCategories.find((c) => c.id === categoryId) || SYSTEM_CATEGORIES.find((c) => c.id === categoryId);

  // 5. Resolve Template Name
  let templateName = "";
  // If doc has a templateName and it's NOT the corrupted legacy string "ใบเสนอราคา (Quotation)"
  if (doc.templateName && doc.templateName !== "ใบเสนอราคา (Quotation)") {
    templateName = doc.templateName;
  } else if (foundTemplate?.name) {
    templateName = foundTemplate.name;
  } else if (rawTemplateId === "quotation" || canonicalId === "tmpl-quotation-standard") {
    templateName = "ใบเสนอราคามาตรฐาน";
  } else if (foundCategory?.fullName) {
    templateName = foundCategory.fullName;
  } else {
    templateName = doc.templateName || "เอกสารทั่วไป";
  }

  return {
    templateId: canonicalId,
    rawTemplateId,
    templateName,
    categoryId: foundCategory?.id || categoryId,
    categoryName: foundCategory?.name || (categoryId ? categoryId.toUpperCase() : "General"),
    categoryFullName: foundCategory?.fullName || foundCategory?.name || "เอกสารทั่วไป",
    editorType: foundTemplate?.editorType || doc.editorType || "document",
    badge: foundTemplate?.badge || "มาตรฐาน",
  };
}

/**
 * Resolves the accurate edit path for any document.
 * Prevents 404s and ensures the document loads with its corresponding editor.
 * @param {Object} doc - Document object with { id, templateId, categoryId }
 * @returns {string} Target edit URL
 */
export function getDocumentEditPath(doc) {
  if (!doc) return "/documents";
  const docId = doc.id;
  const rawTemplateId = doc.templateId || "";
  const canonicalId = LEGACY_TEMPLATE_ID_MAP[rawTemplateId] || rawTemplateId;
  const categoryId = doc.categoryId || "";

  const tmplParam = encodeURIComponent(canonicalId || rawTemplateId || "general");
  const catParam = categoryId ? `&categoryId=${encodeURIComponent(categoryId)}` : "";
  return `/create/custom?templateId=${tmplParam}&id=${docId}${catParam}`;
}
