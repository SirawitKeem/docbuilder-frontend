import fs from "fs/promises";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

const LEGACY_TEMPLATE_ID_MAP = {
  quotation: "tmpl-quotation-standard",
  nda: "tmpl-nda-standard",
  partner: "tmpl-partner-standard",
  distributor: "tmpl-distributor-standard",
  notification: "tmpl-notification-standard",
};

import {
  SYSTEM_CATEGORIES as DEFAULT_CATEGORIES,
  SYSTEM_DEFAULT_TEMPLATES as DEFAULT_TEMPLATES,
} from "../../../templates/catalog.js";



const DEFAULT_SETTINGS = {
  account: {
    fullName: "สิรวิทย์ เพชรจำรัส",
    email: "keem@crestzendo.com",
    role: "Owner / Admin",
    avatar: "",
    twoFactorEnabled: true,
  },
  preferences: {
    theme: "light",
    language: "th",
    dateFormat: "buddhist",
    defaultExportFormat: "pdf",
  },
  organization: {
    name: "บริษัท เครสท์ เซนโด จำกัด",
    nameEn: "Crest Zendo Co., Ltd.",
    taxId: "0105558073755",
    branch: "สำนักงานใหญ่",
    address: "8/40 The Connect 37, ซอยช่างอากาศอุทิศ 10 แยก 1-2 แขวงดอนเมือง เขตดอนเมือง กรุงเทพมหานคร 10210",
    phone: "02-123-4567",
    email: "contact@crestzendo.com",
    website: "https://crestzendo.com",
    logo: "",
  },
  sessions: [
    {
      id: "sess-current",
      device: "Chrome บน Windows 11",
      ip: "127.0.0.1",
      location: "Bangkok, Thailand",
      current: true,
      lastActive: "Active now",
    },
    {
      id: "sess-mobile",
      device: "Safari บน iPhone 15 Pro",
      ip: "182.52.41.22",
      location: "Bangkok, Thailand",
      current: false,
      lastActive: "2 ชั่วโมงที่แล้ว",
    },
  ],
  language: "th",
  currency: "THB",
  theme: "light",
};

const DEFAULT_ORGANIZATION = {
  id: "org-crestzendo",
  name: "บริษัท เครสท์ เซนโด จำกัด",
  nameEn: "Crest Zendo Co., Ltd.",
  taxId: "0105558073755",
  branch: "สำนักงานใหญ่",
  address: "8/40 The Connect 37, ซอยช่างอากาศอุทิศ 10 แยก 1-2 แขวงดอนเมือง เขตดอนเมือง กรุงเทพมหานคร 10210",
  phone: "02-123-4567",
  email: "contact@crestzendo.com",
  website: "https://crestzendo.com",
  logo: "",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
};

const DEFAULT_ORGANIZATION_SIGNATORY = {
  id: "sign-crestzendo-ceo",
  orgId: "org-crestzendo",
  fullName: "นายศรายุทธ โกสิยารักษ์",
  position: "กรรมการผู้จัดการ / CEO",
  signatureImageUrl: "",
  sealImageUrl: "",
  isDefault: true,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
};

const DEFAULT_USER = {
  id: "usr-admin",
  orgId: "org-crestzendo",
  fullName: "สิรวิทย์ เพชรจำรัส",
  email: "keem@crestzendo.com",
  role: "owner",
  avatar: "",
  twoFactorEnabled: true,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
};

const defaultData = {
  organizations: [DEFAULT_ORGANIZATION],
  organizationSignatories: [DEFAULT_ORGANIZATION_SIGNATORY],
  users: [DEFAULT_USER],
  counterparties: [],
  counterpartySignatories: [],
  fieldProfiles: [],
  fieldProfileTemplates: [],
  categories: DEFAULT_CATEGORIES,
  customTemplates: DEFAULT_TEMPLATES,
  templateVersions: [],
  templateBlocks: [],
  templateTableColumns: [],
  documents: [],
  documentFieldValues: [],
  documentTables: [],
  documentTableRows: [],
  sentHistory: [],
  customTokens: [],
  notifications: [],
  settings: DEFAULT_SETTINGS,
};

async function readDb() {
  try {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (parseErr) {
      console.error("Warning: db.json parse error, attempting auto-recovery...", parseErr.message);
      let recovered = false;
      // Prefer the backup because parsing a prefix can silently discard records.
      try {
        const bakRaw = await fs.readFile(`${DB_PATH}.bak`, "utf-8");
        parsed = JSON.parse(bakRaw);
        recovered = true;
        console.log("Successfully restored db.json from backup (.bak)");
        await fs.writeFile(DB_PATH, JSON.stringify(parsed, null, 2), "utf-8");
      } catch {}

      // Last resort: recover a complete JSON prefix only when no valid backup exists.
      let candidateIdx = raw.lastIndexOf("}");
      while (!recovered && candidateIdx > 0) {
        try {
          parsed = JSON.parse(raw.slice(0, candidateIdx + 1));
          recovered = true;
          console.warn("Recovered db.json from a JSON prefix; records after the prefix may be lost", candidateIdx);
          await fs.writeFile(DB_PATH, JSON.stringify(parsed, null, 2), "utf-8");
          break;
        } catch {
          candidateIdx = raw.lastIndexOf("}", candidateIdx - 1);
        }
      }
      if (!recovered) {
        throw parseErr;
      }
    }

    // Auto-migrate any legacy quotations into documents (Single Source of Truth)
    const documents = parsed.documents || [];
    const existingDocIds = new Set(documents.map((d) => d.id));
    if (Array.isArray(parsed.quotations)) {
      for (const q of parsed.quotations) {
        if (!existingDocIds.has(q.id)) {
          documents.unshift({
            id: q.id,
            name: q.name,
            templateId: "quotation",
            templateName: "ใบเสนอราคามาตรฐาน",
            createdBy: q.createdBy || "Admin",
            createdAt: q.createdAt || new Date().toISOString(),
            updatedAt: q.updatedAt || new Date().toISOString(),
            status: q.status || "draft",
            sentTo: q.sentTo || null,
            values: q,
          });
          existingDocIds.add(q.id);
        }
      }
    }

    // Ensure all system default templates are present in customTemplates
    const customTemplates = Array.isArray(parsed.customTemplates) && parsed.customTemplates.length > 0
      ? [...parsed.customTemplates]
      : [...DEFAULT_TEMPLATES];
    const existingTmplIds = new Set(customTemplates.map((t) => t.id));
    for (const defTmpl of DEFAULT_TEMPLATES) {
      if (!existingTmplIds.has(defTmpl.id)) {
        customTemplates.push(defTmpl);
        existingTmplIds.add(defTmpl.id);
      }
    }

    // Auto-backfill documentId for sentHistory records if matching document exists
    const sentHistory = parsed.sentHistory || [];
    let historyChanged = false;
    const docMapById = new Map(documents.map((d) => [d.id, d]));
    const docMapByName = new Map(documents.map((d) => [d.name, d]));

    for (const item of sentHistory) {
      if (!item.documentId) {
        const match = (item.values?.id && docMapById.get(item.values.id)) ||
                      docMapByName.get(item.name);
        if (match) {
          item.documentId = match.id;
          historyChanged = true;
        }
      }
    }

    // 1. Ensure organizations exists
    const organizations = Array.isArray(parsed.organizations) && parsed.organizations.length > 0
      ? parsed.organizations
      : [
          {
            ...DEFAULT_ORGANIZATION,
            ...(parsed.settings?.organization || {}),
            id: DEFAULT_ORGANIZATION.id,
          },
        ];

    // 2. Ensure users exists
    const users = Array.isArray(parsed.users) && parsed.users.length > 0
      ? parsed.users
      : [
          {
            ...DEFAULT_USER,
            ...(parsed.settings?.account || {}),
            id: DEFAULT_USER.id,
            orgId: organizations[0].id,
          },
        ];

    // 3. Ensure fieldProfileTemplates junction table exists & migrate from compatibleTemplates
    const fieldProfileTemplates = Array.isArray(parsed.fieldProfileTemplates)
      ? [...parsed.fieldProfileTemplates]
      : [];
    const existingFptKeys = new Set(fieldProfileTemplates.map((t) => `${t.profileId}:${t.templateId}`));
    for (const p of parsed.fieldProfiles || []) {
      if (Array.isArray(p.compatibleTemplates)) {
        for (const tmplId of p.compatibleTemplates) {
          const key = `${p.id}:${tmplId}`;
          if (!existingFptKeys.has(key)) {
            fieldProfileTemplates.push({
              id: `fpt-${p.id}-${tmplId}`,
              profileId: p.id,
              templateId: tmplId,
              createdAt: p.createdAt || new Date().toISOString(),
            });
            existingFptKeys.add(key);
            historyChanged = true;
          }
        }
      }
    }

    // 4. Backfill documents with orgId & createdByUserId if missing
    for (const d of documents) {
      if (!d.orgId) {
        d.orgId = organizations[0].id;
        historyChanged = true;
      }
      if (!d.createdByUserId) {
        d.createdByUserId = users[0].id;
        historyChanged = true;
      }
    }

    // 5. Backfill sentHistory with sentByUserId & channel
    for (const h of sentHistory) {
      if (!h.sentByUserId) {
        h.sentByUserId = users[0].id;
        historyChanged = true;
      }
      if (!h.channel) {
        h.channel = "email";
        historyChanged = true;
      }
    }

    // ── P2: Template Versioning ──
    // Initialize templateVersions collection
    const templateVersions = Array.isArray(parsed.templateVersions)
      ? [...parsed.templateVersions]
      : [];
    const existingVersionByTmplId = new Map();
    for (const v of templateVersions) {
      const existing = existingVersionByTmplId.get(v.templateId);
      if (!existing || v.version > existing.version) {
        existingVersionByTmplId.set(v.templateId, v);
      }
    }
    // Seed initial version for every customTemplate that doesn't have a version yet
    for (const tmpl of customTemplates) {
      if (!existingVersionByTmplId.has(tmpl.id)) {
        const versionId = `tv-${tmpl.id}-v${tmpl.version || 1}`;
        const versionRecord = {
          id: versionId,
          templateId: tmpl.id,
          version: tmpl.version || 1,
          name: tmpl.name,
          description: tmpl.description || "",
          categoryId: tmpl.categoryId || null,
          blocks: Array.isArray(tmpl.blocks) ? tmpl.blocks : [],
          pages: Array.isArray(tmpl.pages) ? tmpl.pages : [],
          createdAt: tmpl.updatedAt || tmpl.createdAt || new Date().toISOString(),
          createdByUserId: tmpl.createdByUserId || users[0]?.id || null,
        };
        templateVersions.push(versionRecord);
        existingVersionByTmplId.set(tmpl.id, versionRecord);
        historyChanged = true;
      }
      // Ensure template has currentVersionId pointing to its latest version
      if (!tmpl.currentVersionId) {
        const latestVersion = existingVersionByTmplId.get(tmpl.id);
        if (latestVersion) {
          tmpl.currentVersionId = latestVersion.id;
          historyChanged = true;
        }
      }
    }
    // Backfill documents with templateVersionId if they have a templateId that matches a custom template
    const latestVersionByTmplId = new Map();
    for (const v of templateVersions) {
      const existing = latestVersionByTmplId.get(v.templateId);
      if (!existing || v.version > existing.version) {
        latestVersionByTmplId.set(v.templateId, v);
      }
    }
    for (const d of documents) {
      if (d.templateId && !d.templateVersionId) {
        const canonicalTemplateId = LEGACY_TEMPLATE_ID_MAP[d.templateId] || d.templateId;
        const latestVer = latestVersionByTmplId.get(canonicalTemplateId);
        if (latestVer) {
          d.templateVersionId = latestVer.id;
          historyChanged = true;
        }
      }
    }

    // ── P2: Custom Token Enhancement ──
    const customTokens = parsed.customTokens || [];
    const validTokenScopes = ["global", "template"];
    const validTokenDataTypes = ["text", "number", "date", "currency", "image"];
    for (const tok of customTokens) {
      if (!validTokenDataTypes.includes(tok.dataType)) {
        tok.dataType = "text";
        historyChanged = true;
      }
      // Normalize scope: old "document"/"entity" → map to "global"
      if (!validTokenScopes.includes(tok.scope)) {
        tok.scope = "global";
        historyChanged = true;
      }
      if (!tok.createdByUserId) {
        tok.createdByUserId = users[0]?.id || null;
        historyChanged = true;
      }
    }

    // ── P2: Audit Fields — customTemplates ──
    for (const tmpl of customTemplates) {
      if (!tmpl.createdByUserId) {
        tmpl.createdByUserId = users[0]?.id || null;
        historyChanged = true;
      }
    }

    // ── P2: Audit Fields — categories ──
    const categories = parsed.categories && parsed.categories.length > 0
      ? parsed.categories
      : DEFAULT_CATEGORIES;
    for (const cat of categories) {
      if (!cat.createdByUserId) {
        cat.createdByUserId = users[0]?.id || null;
        historyChanged = true;
      }
    }

    // ── P3: Golden Standard Normalization Migrations ──
    // 1. organizationSignatories
    const organizationSignatories = Array.isArray(parsed.organizationSignatories) && parsed.organizationSignatories.length > 0
      ? parsed.organizationSignatories
      : [
          {
            ...DEFAULT_ORGANIZATION_SIGNATORY,
            orgId: organizations[0]?.id || "org-crestzendo",
          },
        ];
    if (!parsed.organizationSignatories) historyChanged = true;

    // 2. counterparties & counterpartySignatories (migrated from fieldProfiles)
    const counterparties = Array.isArray(parsed.counterparties) ? [...parsed.counterparties] : [];
    const counterpartySignatories = Array.isArray(parsed.counterpartySignatories) ? [...parsed.counterpartySignatories] : [];
    const existingCtpIds = new Set(counterparties.map((c) => c.id));
    const existingCtpSignIds = new Set(counterpartySignatories.map((s) => s.id));

    for (const profile of parsed.fieldProfiles || []) {
      const ctpId = profile.id;
      const vals = profile.values || {};
      if (!existingCtpIds.has(ctpId)) {
        const partyType = profile.profileType === "quotation" ? "customer" : "client";
        const companyNameTh = vals.counterparty_name || vals.bill_to_company || profile.name || "บริษัทคู่สัญญา";
        const companyNameEn = vals.company_name_en || (profile.profileType === "quotation" ? vals.bill_to_company : "") || null;
        const regNumber = vals.counterparty_registration_number || vals.tax_id || null;
        const addressTh = vals.counterparty_address || vals.bill_to_address || "กรุงเทพมหานคร";

        counterparties.push({
          id: ctpId,
          orgId: organizations[0]?.id || "org-crestzendo",
          linkedOrgId: null,
          partyType,
          companyNameTh,
          companyNameEn,
          registrationNumber: regNumber,
          branch: vals.branch || "สำนักงานใหญ่",
          addressTh,
          addressEn: vals.counterparty_address_en || null,
          phone: vals.phone || vals.am_phone || null,
          email: vals.email || null,
          createdByUserId: users[0]?.id || null,
          createdAt: profile.createdAt || new Date().toISOString(),
          updatedAt: profile.updatedAt || new Date().toISOString(),
          deletedAt: null,
        });
        existingCtpIds.add(ctpId);
        historyChanged = true;
      }

      // Add signatory if present in values
      if (vals.counterparty_signatory_name) {
        const signId = `sign-${ctpId}`;
        if (!existingCtpSignIds.has(signId)) {
          counterpartySignatories.push({
            id: signId,
            counterpartyId: ctpId,
            fullName: vals.counterparty_signatory_name,
            position: vals.counterparty_signatory_position || "กรรมการผู้มีอำนาจลงนาม",
            signatureText: vals.counterparty_signature_text || vals.counterparty_signatory_name,
            isPrimary: true,
            createdAt: profile.createdAt || new Date().toISOString(),
          });
          existingCtpSignIds.add(signId);
          historyChanged = true;
        }
      }
    }

    // 3. templateBlocks & templateTableColumns (extracted from customTemplates / templateVersions)
    const templateBlocks = Array.isArray(parsed.templateBlocks) ? [...parsed.templateBlocks] : [];
    const templateTableColumns = Array.isArray(parsed.templateTableColumns) ? [...parsed.templateTableColumns] : [];
    const existingBlockIds = new Set(templateBlocks.map((b) => b.id));
    const existingColumnIds = new Set(templateTableColumns.map((c) => c.id));

    for (const tmplVer of templateVersions) {
      if (Array.isArray(tmplVer.blocks)) {
        tmplVer.blocks.forEach((blk, idx) => {
          const blockId = blk.id || `blk-${tmplVer.id}-${idx}`;
          if (!existingBlockIds.has(blockId)) {
            templateBlocks.push({
              id: blockId,
              templateVersionId: tmplVer.id,
              blockType: blk.type || "section",
              title: blk.title || "",
              rawContent: blk.settings?.content || "",
              styleConfig: blk.settings || {},
              sortOrder: idx,
            });
            existingBlockIds.add(blockId);
            historyChanged = true;
          }

          // If block is a quotation table or has items, define default template table columns
          if (blk.type === "quotation_table") {
            const defaultCols = [
              { key: "item_no", label: "ลำดับ", type: "number", widthPercentage: 8 },
              { key: "description", label: "รายการสินค้า / บริการ", type: "text", widthPercentage: 45 },
              { key: "quantity", label: "จำนวน", type: "number", widthPercentage: 12 },
              { key: "unit", label: "หน่วย", type: "text", widthPercentage: 10 },
              { key: "unit_price", label: "ราคา/หน่วย", type: "currency", widthPercentage: 12 },
              { key: "total_price", label: "จำนวนเงิน", type: "currency", widthPercentage: 13, isCalculated: true },
            ];
            defaultCols.forEach((col, cIdx) => {
              const colId = `col-${blockId}-${col.key}`;
              if (!existingColumnIds.has(colId)) {
                templateTableColumns.push({
                  id: colId,
                  blockId,
                  columnKey: col.key,
                  columnLabel: col.label,
                  columnType: col.type,
                  widthPercentage: col.widthPercentage,
                  isCalculated: col.isCalculated || false,
                  formula: col.isCalculated ? "quantity * unit_price" : null,
                  sortOrder: cIdx,
                });
                existingColumnIds.add(colId);
                historyChanged = true;
              }
            });
          }
        });
      }
    }

    // 4. documentFieldValues & documentTables & documentTableRows (normalized from documents)
    const documentFieldValues = Array.isArray(parsed.documentFieldValues) ? [...parsed.documentFieldValues] : [];
    const documentTables = Array.isArray(parsed.documentTables) ? [...parsed.documentTables] : [];
    const documentTableRows = Array.isArray(parsed.documentTableRows) ? [...parsed.documentTableRows] : [];
    const existingFieldValKeys = new Set(documentFieldValues.map((fv) => `${fv.documentId}:${fv.fieldKey}`));
    const existingDocTableIds = new Set(documentTables.map((dt) => dt.id));
    const existingDocTableRowIds = new Set(documentTableRows.map((dtr) => dtr.id));

    for (const doc of documents) {
      // Sync counterpartyId from profileId if not set
      if (!doc.counterpartyId && doc.profileId) {
        doc.counterpartyId = doc.profileId;
        historyChanged = true;
      }
      if (!doc.ourSignatoryId) {
        doc.ourSignatoryId = organizationSignatories[0]?.id || null;
        historyChanged = true;
      }

      // Normalize values into documentFieldValues
      const vals = doc.values || {};
      for (const [k, v] of Object.entries(vals)) {
        if (k === "lineItems" || k === "items" || typeof v === "object" && v !== null && !Array.isArray(v)) continue;
        const key = `${doc.id}:${k}`;
        if (!existingFieldValKeys.has(key)) {
          let textVal = null;
          let numVal = null;
          let boolVal = null;
          let dateVal = null;
          if (typeof v === "number") numVal = v;
          else if (typeof v === "boolean") boolVal = v;
          else if (typeof v === "string" && !isNaN(Date.parse(v)) && v.length >= 10 && (v.includes("-") || v.includes("/"))) {
            dateVal = v;
            textVal = String(v);
          } else {
            textVal = v !== undefined && v !== null ? String(v) : null;
          }

          documentFieldValues.push({
            id: `dfv-${doc.id}-${k}`,
            documentId: doc.id,
            templateFieldId: `tf-${k}`,
            fieldKey: k,
            textValue: textVal,
            numberValue: numVal,
            dateValue: dateVal,
            booleanValue: boolVal,
            jsonValue: null,
            updatedAt: doc.updatedAt || doc.createdAt || new Date().toISOString(),
          });
          existingFieldValKeys.add(key);
          historyChanged = true;
        }
      }

      // Normalize quotation tables if document has line items
      const lineItems = Array.isArray(vals.lineItems) ? vals.lineItems : (Array.isArray(vals.items) ? vals.items : null);
      if (lineItems) {
        const tableId = `tbl-${doc.id}`;
        if (!existingDocTableIds.has(tableId)) {
          documentTables.push({
            id: tableId,
            documentId: doc.id,
            templateBlockId: "b_table",
            tableKey: "items",
            title: "ตารางรายการสินค้า/บริการ",
            columnDefinitions: null,
            subtotal: typeof vals.subtotal === "number" ? vals.subtotal : 0,
            discountAmount: typeof vals.specialDiscount === "number" ? vals.specialDiscount : 0,
            vatRate: typeof vals.vatRate === "number" ? vals.vatRate : 7.0,
            vatAmount: typeof vals.vatAmount === "number" ? vals.vatAmount : 0,
            grandTotal: typeof vals.grandTotal === "number" ? vals.grandTotal : 0,
          });
          existingDocTableIds.add(tableId);
          historyChanged = true;
        }

        lineItems.forEach((item, rIdx) => {
          const rowId = `row-${tableId}-${rIdx}`;
          if (!existingDocTableRowIds.has(rowId)) {
            documentTableRows.push({
              id: rowId,
              tableId,
              rowType: item.type || "item",
              rowData: item,
              sortOrder: rIdx,
            });
            existingDocTableRowIds.add(rowId);
            historyChanged = true;
          }
        });
      }
    }

    const db = {
      organizations,
      organizationSignatories,
      users,
      counterparties,
      counterpartySignatories,
      fieldProfiles: parsed.fieldProfiles || [],
      fieldProfileTemplates,
      categories,
      customTemplates,
      templateVersions,
      templateBlocks,
      templateTableColumns,
      documents,
      documentFieldValues,
      documentTables,
      documentTableRows,
      sentHistory,
      customTokens,
      notifications: parsed.notifications || [],
      settings: {
        ...DEFAULT_SETTINGS,
        ...(parsed.settings || {}),
        account: { ...DEFAULT_SETTINGS.account, ...((parsed.settings || {}).account || {}) },
        preferences: { ...DEFAULT_SETTINGS.preferences, ...((parsed.settings || {}).preferences || {}) },
        organization: { ...DEFAULT_SETTINGS.organization, ...((parsed.settings || {}).organization || {}) },
        sessions: (parsed.settings || {}).sessions || DEFAULT_SETTINGS.sessions,
      },
    };
    if (!parsed.organizations || !parsed.organizationSignatories || !parsed.users || !parsed.counterparties || !parsed.fieldProfileTemplates || !parsed.customTemplates || !parsed.settings || !parsed.settings.account || !parsed.notifications || !parsed.templateVersions || !parsed.templateBlocks || !parsed.documentFieldValues || parsed.quotations || historyChanged) {
      await writeDb(db);
    }
    return db;
  } catch (err) {
    if (err.code === "ENOENT") {
      await writeDb(defaultData);
      return defaultData;
    }
    throw err;
  }
}

// ── Concurrency Mutex & Queue ──
let dbMutationQueue = Promise.resolve();

export function enqueueDbOperation(op) {
  const next = dbMutationQueue.then(async () => {
    return await op();
  });
  dbMutationQueue = next.catch((err) => {
    console.error("Database queue operation error:", err);
  });
  return next;
}

export async function mutateDb(mutatorFn) {
  return enqueueDbOperation(async () => {
    const db = await readDb();
    const result = await mutatorFn(db);
    await writeDb(db);
    return result;
  });
}

// ── Safe Atomic Write with Backup ──
async function writeDb(data) {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  // Strip out redundant quotations array to enforce single persistence
  const cleanData = { ...data };
  delete cleanData.quotations;
  const content = JSON.stringify(cleanData, null, 2);
  const tempPath = `${DB_PATH}.tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // 1. Write to temporary file first
  await fs.writeFile(tempPath, content, "utf-8");

  // 2. Backup current DB to .bak if DB exists
  try {
    await fs.copyFile(DB_PATH, `${DB_PATH}.bak`);
  } catch {}

  // 3. Atomically replace main DB file
  try {
    await fs.rename(tempPath, DB_PATH);
  } catch {
    // Windows file locking fallback
    await fs.copyFile(tempPath, DB_PATH);
    await fs.unlink(tempPath).catch(() => {});
  }
}

function generateQuotationNo(quotations) {
  const now = new Date();
  const year2Digits = String(now.getFullYear()).slice(-2); // e.g., "26" for 2026
  const month2Digits = String(now.getMonth() + 1).padStart(2, "0"); // e.g., "08" for August
  const prefix = `CZ${year2Digits}${month2Digits}`; // e.g., "CZ2608"

  const sameMonthItems = (quotations || []).filter(
    (q) => q.quotationNo && q.quotationNo.startsWith(prefix)
  );
  const nextNum = sameMonthItems.length + 1;
  return `${prefix}${String(nextNum).padStart(4, "0")}`; // e.g., "CZ26080001"
}

/**
 * 🔄 Real-time Dual-Write: Sync Profile -> Counterparty & Signatory
 */
function syncProfileToCounterparty(db, profileId, name, values, profileType, orgId = "org-crestzendo", createdByUserId = "usr-admin") {
  const vals = values || {};
  db.counterparties = db.counterparties || [];
  db.counterpartySignatories = db.counterpartySignatories || [];

  const now = new Date().toISOString();
  const cIdx = db.counterparties.findIndex((c) => c.id === profileId);

  const companyNameTh = vals.counterparty_name || vals.company_name || vals.companyNameTh || vals.bill_to_company || name || "ไม่ระบุชื่อบริษัท";
  const companyNameEn = vals.counterparty_name_en || vals.company_name_en || vals.companyNameEn || null;
  const registrationNumber = vals.counterparty_registration_number || vals.tax_id || vals.registrationNumber || null;
  const addressTh = vals.counterparty_address || vals.address || vals.addressTh || null;
  const addressEn = vals.counterparty_address_en || vals.address_en || vals.addressEn || null;
  const phone = vals.counterparty_phone || vals.phone || null;
  const email = vals.counterparty_email || vals.email || null;

  const counterpartyRecord = {
    id: profileId,
    orgId: orgId || "org-crestzendo",
    linkedOrgId: null,
    partyType: profileType || "client",
    companyNameTh,
    companyNameEn,
    registrationNumber,
    branch: vals.branch || "สำนักงานใหญ่",
    addressTh,
    addressEn,
    phone,
    email,
    createdByUserId: createdByUserId || "usr-admin",
    createdAt: cIdx >= 0 ? db.counterparties[cIdx].createdAt : now,
    updatedAt: now,
    deletedAt: null,
  };

  if (cIdx >= 0) {
    db.counterparties[cIdx] = counterpartyRecord;
  } else {
    db.counterparties.push(counterpartyRecord);
  }

  // Signatory
  const signatoryName = vals.counterparty_signatory_name || vals.signatory_name || vals.contact_name;
  if (signatoryName) {
    const sIdx = db.counterpartySignatories.findIndex((s) => s.counterpartyId === profileId);
    const signRecord = {
      id: sIdx >= 0 ? db.counterpartySignatories[sIdx].id : `sign-${profileId}`,
      counterpartyId: profileId,
      fullName: signatoryName,
      position: vals.counterparty_signatory_position || vals.signatory_position || "ผู้มีอำนาจลงนาม",
      signatureText: vals.counterparty_signature_text || signatoryName,
      isPrimary: true,
      createdAt: sIdx >= 0 ? db.counterpartySignatories[sIdx].createdAt : now,
    };
    if (sIdx >= 0) {
      db.counterpartySignatories[sIdx] = signRecord;
    } else {
      db.counterpartySignatories.push(signRecord);
    }
  }
}

/**
 * 🔄 Real-time Dual-Write: Sync Document Values -> documentFieldValues & documentTables
 */
function syncDocumentToNormalized(db, docId, values, templateId) {
  if (!values || typeof values !== "object") return;
  const now = new Date().toISOString();
  db.documentFieldValues = db.documentFieldValues || [];
  db.documentTables = db.documentTables || [];
  db.documentTableRows = db.documentTableRows || [];

  // 1. Sync Field Values (EAV)
  const ignoredKeys = new Set(["lineItems", "signatures", "activityLogs", "approvalChain", "table_items"]);
  for (const [key, val] of Object.entries(values)) {
    if (ignoredKeys.has(key) || val === undefined) continue;

    let textValue = null;
    let numberValue = null;
    let dateValue = null;
    let booleanValue = null;
    let jsonValue = null;

    if (typeof val === "string") {
      textValue = val;
      if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
        dateValue = val;
      }
    } else if (typeof val === "number") {
      numberValue = val;
    } else if (typeof val === "boolean") {
      booleanValue = val;
    } else if (typeof val === "object" && val !== null) {
      jsonValue = val;
    }

    const existingIdx = db.documentFieldValues.findIndex(
      (fv) => fv.documentId === docId && fv.fieldKey === key
    );

    const fvRecord = {
      id: existingIdx >= 0 ? db.documentFieldValues[existingIdx].id : `dfv-${docId}-${key}`,
      documentId: docId,
      templateFieldId: null,
      fieldKey: key,
      textValue,
      numberValue,
      dateValue,
      booleanValue,
      jsonValue,
      updatedAt: now,
    };

    if (existingIdx >= 0) {
      db.documentFieldValues[existingIdx] = fvRecord;
    } else {
      db.documentFieldValues.push(fvRecord);
    }
  }

  // 2. Sync Document Tables & Rows (for Quotation / Line Items)
  const lineItems = Array.isArray(values.lineItems)
    ? values.lineItems
    : (Array.isArray(values.table_items) ? values.table_items : null);

  if (templateId === "quotation" || lineItems) {
    const tableId = `dtbl-${docId}`;
    const vatRate = Number(values.vatRate ?? values.table_vatRate ?? 7);
    let subtotal = Number(values.subtotal ?? 0);
    const discountAmount = Number(values.discount ?? values.specialDiscount ?? 0);

    if (subtotal === 0 && Array.isArray(lineItems)) {
      subtotal = lineItems.reduce((acc, item) => {
        const qty = Number(item.qty || item.quantity || 1);
        const price = Number(item.price !== undefined ? item.price : (item.unitPrice || 0));
        return acc + (qty * price);
      }, 0);
    }

    const totalAfterDiscount = Math.max(0, subtotal - discountAmount);
    let vatAmount = Number(values.vatAmount ?? values.vat ?? 0);
    if (vatAmount === 0 && vatRate > 0) {
      vatAmount = Number(((totalAfterDiscount * vatRate) / 100).toFixed(2));
    }
    let grandTotal = Number(values.grandTotal ?? 0);
    if (grandTotal === 0) {
      grandTotal = totalAfterDiscount + vatAmount;
    }

    const tblIdx = db.documentTables.findIndex((t) => t.id === tableId || t.documentId === docId);
    const tblRecord = {
      id: tableId,
      documentId: docId,
      templateBlockId: "tblk-quotation-table",
      tableName: "รายการสินค้า/บริการ (Quotation Items)",
      currency: "THB",
      vatRate,
      subtotal,
      discountAmount,
      vatAmount,
      grandTotal,
      createdAt: tblIdx >= 0 ? db.documentTables[tblIdx].createdAt : now,
      updatedAt: now,
    };

    if (tblIdx >= 0) {
      db.documentTables[tblIdx] = tblRecord;
    } else {
      db.documentTables.push(tblRecord);
    }

    // Clean existing rows for this table
    db.documentTableRows = db.documentTableRows.filter((r) => r.tableId !== tableId);

    // Insert new rows
    if (Array.isArray(lineItems)) {
      lineItems.forEach((item, idx) => {
        const qty = Number(item.qty || item.quantity || 1);
        const unitPrice = Number(item.price !== undefined ? item.price : (item.unitPrice || 0));
        const lineTotal = Number(item.total !== undefined ? item.total : (qty * unitPrice));
        const discount = Number(item.discount || 0);

        db.documentTableRows.push({
          id: `dtr-${docId}-${idx + 1}`,
          tableId,
          rowType: "item",
          sortOrder: idx + 1,
          itemDescription: item.desc || item.title || item.name || `รายการที่ ${idx + 1}`,
          itemDetails: item.details || null,
          quantity: qty,
          unitName: item.unit || "รายการ",
          unitPrice,
          discountAmount: discount,
          lineTotal,
          createdAt: now,
        });
      });
    }
  }
}

export const jsonFieldProfilesRepo = {
  async getAll() {
    const db = await readDb();
    const profiles = db.fieldProfiles || [];
    const fptList = db.fieldProfileTemplates || [];
    const documents = db.documents || [];

    return profiles.map((p) => {
      const linkedTemplates = fptList
        .filter((fpt) => fpt.profileId === p.id)
        .map((fpt) => fpt.templateId);
      const compatibleTemplates = linkedTemplates.length > 0
        ? linkedTemplates
        : (p.compatibleTemplates || []);
      const usedInDocsCount = documents.filter((d) => d.profileId === p.id).length;

      return {
        ...p,
        compatibleTemplates,
        usedInDocsCount,
      };
    });
  },
  async getById(id) {
    const db = await readDb();
    const profile = (db.fieldProfiles || []).find((p) => p.id === id);
    if (!profile) return null;

    const fptList = db.fieldProfileTemplates || [];
    const documents = db.documents || [];
    const linkedTemplates = fptList
      .filter((fpt) => fpt.profileId === profile.id)
      .map((fpt) => fpt.templateId);
    const compatibleTemplates = linkedTemplates.length > 0
      ? linkedTemplates
      : (profile.compatibleTemplates || []);
    const usedInDocsCount = documents.filter((d) => d.profileId === profile.id).length;

    return {
      ...profile,
      compatibleTemplates,
      usedInDocsCount,
    };
  },
  async create({ name, values, profileType = "client", compatibleTemplates = [], orgId = "org-crestzendo", createdByUserId = "usr-admin" }) {
    return mutateDb(async (db) => {
      const now = new Date().toISOString();
      const profileId = `profile-${Date.now()}`;
      const profile = {
        id: profileId,
        orgId,
        createdByUserId,
        profileType,
        name: name || "ข้อมูลไม่มีชื่อ",
        values: values || {},
        compatibleTemplates: compatibleTemplates || [],
        createdAt: now,
        updatedAt: now,
      };
      db.fieldProfiles = db.fieldProfiles || [];
      db.fieldProfiles.push(profile);

      // Save to junction table
      db.fieldProfileTemplates = db.fieldProfileTemplates || [];
      if (Array.isArray(compatibleTemplates) && compatibleTemplates.length > 0) {
        for (const tmplId of compatibleTemplates) {
          db.fieldProfileTemplates.push({
            id: `fpt-${profileId}-${tmplId}`,
            profileId,
            templateId: tmplId,
            createdAt: now,
          });
        }
      }

      // Real-time Dual-write to counterparties & counterpartySignatories
      syncProfileToCounterparty(db, profileId, profile.name, profile.values, profileType, orgId, createdByUserId);

      return profile;
    });
  },
  async update(id, { name, values, profileType, compatibleTemplates }) {
    return mutateDb(async (db) => {
      db.fieldProfiles = db.fieldProfiles || [];
      const idx = db.fieldProfiles.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error("ไม่พบข้อมูลนี้");

      const now = new Date().toISOString();
      db.fieldProfiles[idx] = {
        ...db.fieldProfiles[idx],
        ...(name !== undefined ? { name } : {}),
        ...(values !== undefined ? { values } : {}),
        ...(profileType !== undefined ? { profileType } : {}),
        ...(compatibleTemplates !== undefined ? { compatibleTemplates } : {}),
        updatedAt: now,
      };

      // Sync junction table if compatibleTemplates is provided
      if (compatibleTemplates !== undefined && Array.isArray(compatibleTemplates)) {
        db.fieldProfileTemplates = (db.fieldProfileTemplates || []).filter((fpt) => fpt.profileId !== id);
        for (const tmplId of compatibleTemplates) {
          db.fieldProfileTemplates.push({
            id: `fpt-${id}-${tmplId}`,
            profileId: id,
            templateId: tmplId,
            createdAt: now,
          });
        }
      }

      // Real-time Dual-write to counterparties & counterpartySignatories
      const current = db.fieldProfiles[idx];
      syncProfileToCounterparty(db, id, current.name, current.values, current.profileType, current.orgId, current.createdByUserId);

      return db.fieldProfiles[idx];
    });
  },
  async remove(id) {
    return mutateDb(async (db) => {
      db.fieldProfiles = (db.fieldProfiles || []).filter((p) => p.id !== id);
      db.fieldProfileTemplates = (db.fieldProfileTemplates || []).filter((fpt) => fpt.profileId !== id);
      db.counterparties = (db.counterparties || []).filter((c) => c.id !== id);
      db.counterpartySignatories = (db.counterpartySignatories || []).filter((s) => s.counterpartyId !== id);
      return { success: true };
    });
  },
};

export const jsonQuotationsRepo = {
  async getAll() {
    const db = await readDb();
    const docs = (db.documents || []).filter((d) => d.templateId === "quotation");
    return docs.map((d) => {
      const vals = d.values || {};
      return {
        ...vals,
        id: d.id,
        name: d.name,
        templateId: "quotation",
        templateName: (d.templateName && d.templateName !== "ใบเสนอราคา (Quotation)") ? d.templateName : "ใบเสนอราคามาตรฐาน",
        status: d.status,
        sentTo: d.sentTo,
        createdBy: d.createdBy,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      };
    });
  },
  async getById(id) {
    const db = await readDb();
    const doc = (db.documents || []).find((d) => d.id === id);
    if (!doc) return null;
    const vals = doc.values || {};
    return {
      ...vals,
      id: doc.id,
      name: doc.name,
      templateId: "quotation",
      templateName: (doc.templateName && doc.templateName !== "ใบเสนอราคา (Quotation)") ? doc.templateName : "ใบเสนอราคามาตรฐาน",
      status: doc.status,
      sentTo: doc.sentTo,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  },
  async create(data) {
    return mutateDb(async (db) => {
      db.documents = db.documents || [];
      const existingQuotations = db.documents
        .filter((d) => d.templateId === "quotation")
        .map((d) => d.values || d);

    const quotationNo = data.quotationNo || generateQuotationNo(existingQuotations);
    const revision = data.revision || "01";
    const todayStr = new Date().toLocaleDateString("th-TH");
    const now = new Date().toISOString();
    const docId = data.id || `qt-${Date.now()}`;

    const quotationRecord = {
      id: docId,
      quotationNo,
      revision,
      name: data.name || `ใบเสนอราคา ${quotationNo} Rev.${revision}`,
      templateId: "quotation",
      templateName: "ใบเสนอราคามาตรฐาน",
      quotationDate: data.quotationDate || todayStr,
      priceValidity: data.priceValidity || "30 Days",
      deliveryTerm: data.deliveryTerm || "Within 15-30 Days",
      creditTerm: data.creditTerm || "30 Days",
      billTo: data.billTo || {
        companyName: "",
        attn: "",
        endUser: "",
        subject: "",
        am: "",
      },
      lineItems: data.lineItems || [],
      vatRate: data.vatRate !== undefined ? data.vatRate : 7,
      subtotal: data.subtotal !== undefined ? data.subtotal : (data.lineItems || []).reduce((acc, it) => acc + (Number(it.qty || 1) * Number(it.price || 0)), 0),
      discount: data.discount !== undefined ? data.discount : 0,
      vatAmount: data.vatAmount !== undefined ? data.vatAmount : 0,
      grandTotal: data.grandTotal !== undefined ? data.grandTotal : 0,
      remarks: data.remarks || "",
      senderName: data.senderName || "",
      senderPhone: data.senderPhone || "",
      createdBy: data.createdBy || "Admin",
      createdAt: now,
      updatedAt: now,
      status: data.sentTo ? "sent" : (data.status || "draft"),
      sentTo: data.sentTo || null,
    };

    const docEntry = {
      id: quotationRecord.id,
      verificationToken: `VRF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      name: quotationRecord.name,
      templateId: "quotation",
      templateName: "ใบเสนอราคามาตรฐาน",
      createdBy: quotationRecord.createdBy,
      createdAt: quotationRecord.createdAt,
      updatedAt: quotationRecord.updatedAt,
      status: quotationRecord.status,
      sentTo: quotationRecord.sentTo,
      values: quotationRecord,
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          action: "create",
          performedBy: quotationRecord.createdBy || "ผู้จัดทำ (Admin)",
          timestamp: quotationRecord.createdAt,
          details: "สร้างใบเสนอราคา",
        },
      ],
      exportHistory: [],
    };

    const docIdx = db.documents.findIndex((d) => d.id === quotationRecord.id);
    if (docIdx >= 0) {
      db.documents[docIdx] = docEntry;
    } else {
      db.documents.unshift(docEntry);
    }

    // Real-time Dual-write to normalized tables
    syncDocumentToNormalized(db, quotationRecord.id, quotationRecord, "quotation");

      return quotationRecord;
    });
  },
  async update(id, data) {
    return mutateDb(async (db) => {
      db.documents = db.documents || [];
      const idx = db.documents.findIndex((d) => d.id === id);
      if (idx === -1) return null;

    const currentDoc = db.documents[idx];
    const currentValues = currentDoc.values || {};
    const now = new Date().toISOString();
    const updatedValues = {
      ...currentValues,
      ...data,
      updatedAt: now,
    };

    const currentLogs = currentDoc.activityLogs || [];
    const updatedLogs = [
      {
        id: `act-${Date.now()}`,
        action: "edit",
        performedBy: "ผู้จัดทำ (Admin)",
        timestamp: now,
        details: "บันทึกและแก้ไขข้อมูลใบเสนอราคา",
      },
      ...currentLogs,
    ];

    db.documents[idx] = {
      ...currentDoc,
      name: updatedValues.name || currentDoc.name,
      status: updatedValues.status || currentDoc.status,
      sentTo: updatedValues.sentTo !== undefined ? updatedValues.sentTo : currentDoc.sentTo,
      updatedAt: now,
      values: updatedValues,
      activityLogs: updatedLogs,
    };

    // Real-time Dual-write to normalized tables
    syncDocumentToNormalized(db, id, updatedValues, "quotation");

      return updatedValues;
    });
  },
  async createRevision(id) {
    return mutateDb(async (db) => {
      db.documents = db.documents || [];
      const source = db.documents.find((d) => d.id === id);
      if (!source) throw new Error("ไม่พบใบเสนอราคาต้นฉบับ");

    const sourceData = source.values || source;
    const currentRevNum = parseInt(sourceData.revision || "1", 10);
    const nextRevNum = isNaN(currentRevNum) ? 2 : currentRevNum + 1;
    const nextRevision = String(nextRevNum).padStart(2, "0");

    const todayStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const newId = `qt-${Date.now()}`;
    const quotationNo = sourceData.quotationNo || generateQuotationNo(
      db.documents.filter((d) => d.templateId === "quotation").map((d) => d.values || d)
    );
    const now = new Date().toISOString();

    const revisionRecord = {
      ...sourceData,
      id: newId,
      quotationNo,
      revision: nextRevision,
      name: `ใบเสนอราคา ${quotationNo} Rev.${nextRevision}`,
      quotationDate: todayStr,
      status: "draft",
      parentId: sourceData.id,
      createdAt: now,
      updatedAt: now,
    };

    db.documents.unshift({
      id: revisionRecord.id,
      name: revisionRecord.name,
      templateId: "quotation",
      templateName: "ใบเสนอราคามาตรฐาน",
      createdBy: revisionRecord.createdBy || "Admin",
      createdAt: revisionRecord.createdAt,
      updatedAt: revisionRecord.updatedAt,
      status: "draft",
      sentTo: null,
      values: revisionRecord,
    });

    // Real-time Dual-write to normalized tables
    syncDocumentToNormalized(db, revisionRecord.id, revisionRecord, "quotation");

      return revisionRecord;
    });
  },
  async delete(id) {
    const ids = Array.isArray(id) ? id : [id];
    return mutateDb(async (db) => {
      const before = (db.documents || []).length;
      db.documents = (db.documents || []).filter((d) => !ids.includes(d.id));

      // Cascade delete in normalized collections
      if (db.documentFieldValues) {
        db.documentFieldValues = db.documentFieldValues.filter((fv) => !ids.includes(fv.documentId));
      }
      if (db.documentTables) {
        const deletedTableIds = db.documentTables
          .filter((t) => ids.includes(t.documentId))
          .map((t) => t.id);
        db.documentTables = db.documentTables.filter((t) => !ids.includes(t.documentId));
        if (db.documentTableRows) {
          db.documentTableRows = db.documentTableRows.filter((r) => !deletedTableIds.includes(r.tableId));
        }
      }

      return { success: db.documents.length < before };
    });
  },
};

export const jsonDocumentsRepo = {
  async getAll() {
    const db = await readDb();
    return db.documents || [];
  },
  async getById(id) {
    const db = await readDb();
    return (db.documents || []).find((doc) => doc.id === id || doc.verificationToken === id) || null;
  },
  async create({ name, templateId, templateName, sentTo, values, id, status = "draft", createdBy = "นายสมชาย ใจดี (ผู้จัดทำ)", profileId = null, templateVersionId = null }) {
    return mutateDb(async (db) => {
      const now = new Date().toISOString();
      const docId = id || `doc-${Date.now()}`;
      const verificationToken = `VRF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      // Resolve templateName from database customTemplates if not explicitly provided
      let resolvedTemplateName = templateName;
      if (!resolvedTemplateName && templateId) {
        if (db.customTemplates && db.customTemplates[templateId]?.name) {
          resolvedTemplateName = db.customTemplates[templateId].name;
        } else if (db.customTemplates) {
          const found = Array.isArray(db.customTemplates)
            ? db.customTemplates.find((t) => t.id === templateId)
            : Object.values(db.customTemplates).find((t) => t.id === templateId);
          if (found?.name) resolvedTemplateName = found.name;
        }
      }

      // Auto-resolve templateVersionId from latest version if not provided
      let resolvedVersionId = templateVersionId;
      if (!resolvedVersionId && templateId) {
        const canonicalTemplateId = LEGACY_TEMPLATE_ID_MAP[templateId] || templateId;
        const versions = (db.templateVersions || [])
          .filter((v) => v.templateId === canonicalTemplateId)
          .sort((a, b) => b.version - a.version);
        if (versions.length > 0) {
          resolvedVersionId = versions[0].id;
        }
      }

      const record = {
        id: docId,
        verificationToken,
        profileId: profileId || null,
        name,
        templateId,
        ...(resolvedVersionId ? { templateVersionId: resolvedVersionId } : {}),
        templateName: resolvedTemplateName || templateName || null,
        createdBy,
        createdAt: now,
        updatedAt: now,
        status: sentTo ? "sent" : status,
        sentTo: sentTo || null,
        values: values || {},
        activityLogs: [
          {
            id: `act-${Date.now()}`,
            action: "create",
            performedBy: createdBy,
            timestamp: now,
            details: "สร้างเอกสารฉบับร่าง",
          },
        ],
        approvalChain: [
          {
            id: "step-1",
            stepName: "ผู้จัดทำ / ผู้ยื่นเอกสาร",
            assignedRole: "ผู้จัดทำ",
            assignedUser: createdBy,
            status: "approved",
            signedAt: now,
          },
          {
            id: "step-2",
            stepName: "ผู้มีอำนาจอนุมัติ / กรรมการ",
            assignedRole: "กรรมการผู้จัดการ",
            assignedUser: "นายศรายุทธ โกสิยารักษ์",
            status: "pending",
            signedAt: null,
          },
        ],
      };
      db.documents = db.documents || [];
      db.documents.unshift(record);

      // Real-time Dual-write to normalized tables
      syncDocumentToNormalized(db, record.id, record.values, record.templateId);

      return record;
    });
  },
  async update(id, { name, templateId, templateVersionId, templateName, sentTo, values, status, activityLogs, approvalChain, rejectionReason, profileId, lastSentAt }) {
    return mutateDb(async (db) => {
      db.documents = db.documents || [];
      const idx = db.documents.findIndex((doc) => doc.id === id);
      if (idx === -1) {
        return null;
      }

      const current = db.documents[idx];
      const now = new Date().toISOString();

      let resolvedVersionId = templateVersionId;
      if (!resolvedVersionId && templateId !== undefined && templateId !== current.templateId) {
        const canonicalTemplateId = LEGACY_TEMPLATE_ID_MAP[templateId] || templateId;
        const versions = (db.templateVersions || [])
          .filter((v) => v.templateId === canonicalTemplateId)
          .sort((a, b) => b.version - a.version);
        resolvedVersionId = versions[0]?.id || null;
      }

      let resolvedTemplateName = templateName;
      if (resolvedTemplateName === undefined && templateId && (!current.templateName || templateId !== current.templateId)) {
        if (db.customTemplates && db.customTemplates[templateId]?.name) {
          resolvedTemplateName = db.customTemplates[templateId].name;
        } else if (db.customTemplates) {
          const found = Object.values(db.customTemplates).find((t) => t.id === templateId);
          if (found?.name) resolvedTemplateName = found.name;
        }
      }

      let resolvedActivityLogs = activityLogs;
      if (resolvedActivityLogs === undefined) {
        const currentLogs = current.activityLogs || [];
        const isContentEdit = values !== undefined || (name !== undefined && name !== current.name);
        if (isContentEdit) {
          resolvedActivityLogs = [
            {
              id: `act-${Date.now()}`,
              action: "edit",
              performedBy: "ผู้จัดทำ (Admin)",
              timestamp: now,
              details: name && name !== current.name ? `เปลี่ยนชื่อเป็น "${name}" และบันทึกข้อมูล` : "บันทึกและแก้ไขข้อมูลเอกสาร",
            },
            ...currentLogs,
          ];
        }
      }

      db.documents[idx] = {
        ...current,
        ...(name !== undefined ? { name } : {}),
        ...(templateId !== undefined ? { templateId } : {}),
        ...(resolvedVersionId ? { templateVersionId: resolvedVersionId } : {}),
        ...(resolvedTemplateName !== undefined ? { templateName: resolvedTemplateName } : {}),
        ...(sentTo !== undefined ? { sentTo } : {}),
        ...(values !== undefined ? { values } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(resolvedActivityLogs !== undefined ? { activityLogs: resolvedActivityLogs } : {}),
        ...(approvalChain !== undefined ? { approvalChain } : {}),
        ...(rejectionReason !== undefined ? { rejectionReason } : {}),
        ...(profileId !== undefined ? { profileId } : {}),
        ...(lastSentAt !== undefined ? { lastSentAt } : {}),
        updatedAt: now,
      };

      // Real-time Dual-write to normalized tables
      if (values !== undefined) {
        syncDocumentToNormalized(db, id, values, current.templateId);
      }

      return db.documents[idx];
    });
  },
  async addActivityLog(id, { action, performedBy, details, comment }) {
    return mutateDb(async (db) => {
      db.documents = db.documents || [];
      const idx = db.documents.findIndex((doc) => doc.id === id);
      if (idx === -1) return null;

      const doc = db.documents[idx];
      doc.activityLogs = doc.activityLogs || [];
      doc.activityLogs.unshift({
        id: `act-${Date.now()}`,
        action,
        performedBy: performedBy || "ผู้ดูแลระบบ (Admin)",
        timestamp: new Date().toISOString(),
        details: details || "",
        comment: comment || "",
      });
      doc.updatedAt = new Date().toISOString();
      return doc;
    });
  },
  async submitForApproval(id, { performedBy = "นายสมชาย ใจดี", comment = "" } = {}) {
    return mutateDb(async (db) => {
      db.documents = db.documents || [];
      const idx = db.documents.findIndex((doc) => doc.id === id);
      if (idx === -1) return null;

      const doc = db.documents[idx];
      const now = new Date().toISOString();
      doc.status = "pending_approval";
      doc.updatedAt = now;
      doc.activityLogs = doc.activityLogs || [];
      doc.activityLogs.unshift({
        id: `act-${Date.now()}`,
        action: "submit_approval",
        performedBy,
        timestamp: now,
        details: "ส่งเอกสารเข้าสายอนุมัติ",
        comment,
      });
      return doc;
    });
  },
  async approveDocument(id, { performedBy = "นายศรายุทธ โกสิยารักษ์ (กรรมการผู้จัดการ)", comment = "", signatureImg = null } = {}) {
    return mutateDb(async (db) => {
      db.documents = db.documents || [];
      const idx = db.documents.findIndex((doc) => doc.id === id);
      if (idx === -1) return null;

      const doc = db.documents[idx];
      const now = new Date().toISOString();
      doc.status = "completed";
      doc.approvedAt = now;
      doc.approvedBy = performedBy;
      doc.updatedAt = now;

      if (!doc.verificationToken) {
        doc.verificationToken = `VRF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      }

      if (signatureImg && doc.values) {
        doc.values.signatures = doc.values.signatures || {};
        doc.values.signatures.approver = signatureImg;
      }

      doc.activityLogs = doc.activityLogs || [];
      doc.activityLogs.unshift({
        id: `act-${Date.now()}`,
        action: "approve",
        performedBy,
        timestamp: now,
        details: "อนุมัติและลงนามเอกสารเสร็จสมบูรณ์",
        comment,
      });

      // Update approval chain
      if (doc.approvalChain && doc.approvalChain[1]) {
        doc.approvalChain[1].status = "approved";
        doc.approvalChain[1].signedAt = now;
        doc.approvalChain[1].comment = comment;
      }
      return doc;
    });
  },
  async rejectDocument(id, { performedBy = "นายศรายุทธ โกสิยารักษ์", reason = "" } = {}) {
    return mutateDb(async (db) => {
      db.documents = db.documents || [];
      const idx = db.documents.findIndex((doc) => doc.id === id);
      if (idx === -1) return null;

      const doc = db.documents[idx];
      const now = new Date().toISOString();
      doc.status = "rejected";
      doc.rejectionReason = reason;
      doc.updatedAt = now;

      doc.activityLogs = doc.activityLogs || [];
      doc.activityLogs.unshift({
        id: `act-${Date.now()}`,
        action: "reject",
        performedBy,
        timestamp: now,
        details: "ตีกลับเอกสารเพื่อแก้ไข",
        comment: reason,
      });

      if (doc.approvalChain && doc.approvalChain[1]) {
        doc.approvalChain[1].status = "rejected";
        doc.approvalChain[1].comment = reason;
      }
      return doc;
    });
  },
  async recordExportAction(id, { format = "PDF", performedBy = "ผู้จัดทำ (Admin)", details = "" } = {}) {
    return mutateDb(async (db) => {
      db.documents = db.documents || [];
      const idx = db.documents.findIndex((doc) => doc.id === id);
      if (idx === -1) return null;

      const doc = db.documents[idx];
      const now = new Date().toISOString();
      const upperFormat = format.toUpperCase();

      // 1. Append to exportHistory array
      doc.exportHistory = doc.exportHistory || [];
      const exportEntry = {
        id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        format: upperFormat,
        exportedAt: now,
        performedBy: performedBy || "Admin",
        details: details || `ส่งออกเอกสารรูปแบบ ${upperFormat}`,
      };
      doc.exportHistory.unshift(exportEntry);
      doc.lastSentAt = now;
      doc.updatedAt = now;

      // 2. Append to activityLogs array
      doc.activityLogs = doc.activityLogs || [];
      doc.activityLogs.unshift({
        id: `act-${Date.now()}`,
        action: "export",
        performedBy: performedBy || "Admin",
        timestamp: now,
        details: `ส่งออกไฟล์ ${upperFormat}`,
        comment: details || "",
      });

      // 3. Mirror to sentHistory for unified tracking
      db.sentHistory = db.sentHistory || [];
      db.sentHistory.unshift({
        id: `history-${Date.now()}`,
        documentId: doc.id,
        name: doc.name || "Document",
        templateId: doc.templateId || "document",
        templateName: doc.templateName || "เอกสาร",
        actionType: "export",
        format: upperFormat,
        sentTo: `ดาวน์โหลด ${upperFormat}`,
        recipientEmail: "-",
        sentBy: performedBy || "Admin",
        sentAt: now,
        status: "exported",
        channel: upperFormat === "PRINT" ? "print" : "download",
        values: doc.values || {},
      });

      return doc;
    });
  },
  async delete(id) {
    return mutateDb(async (db) => {
      const ids = Array.isArray(id) ? id : [id];
      const before = (db.documents || []).length;
      db.documents = (db.documents || []).filter((doc) => !ids.includes(doc.id));

      // Cascade delete in normalized collections
      if (db.documentFieldValues) {
        db.documentFieldValues = db.documentFieldValues.filter((fv) => !ids.includes(fv.documentId));
      }
      if (db.documentTables) {
        const deletedTableIds = db.documentTables
          .filter((t) => ids.includes(t.documentId))
          .map((t) => t.id);
        db.documentTables = db.documentTables.filter((t) => !ids.includes(t.documentId));
        if (db.documentTableRows) {
          db.documentTableRows = db.documentTableRows.filter((r) => !deletedTableIds.includes(r.tableId));
        }
      }

      return { success: db.documents.length < before };
    });
  },
};

export const jsonSentHistoryRepo = {
  async getAll() {
    const db = await readDb();
    const history = db.sentHistory || [];
    const docMap = new Map((db.documents || []).map((d) => [d.id, d]));
    return history.map((item) => {
      const doc = item.documentId ? docMap.get(item.documentId) : null;
      return {
        ...item,
        name: doc?.name || item.name,
        templateId: doc?.templateId || item.templateId,
        templateName: doc?.templateName || item.templateName,
        sentTo: item.sentTo || doc?.sentTo || null,
        values: (doc && doc.values && Object.keys(doc.values).length > 0)
          ? doc.values
          : (item.values || {}),
      };
    });
  },
  async create({ documentId, name, templateId, templateName, sentTo, subject, status = "sent", values, channel = "email" }) {
    return mutateDb(async (db) => {
      const now = new Date().toISOString();
      const linkedDoc = documentId ? (db.documents || []).find((d) => d.id === documentId) : null;
      const record = {
        id: `history-${Date.now()}`,
        documentId: documentId || null,
        name: name || linkedDoc?.name || "Document",
        templateId: templateId || linkedDoc?.templateId || "document",
        templateName: templateName || linkedDoc?.templateName || "เอกสาร",
        subject: subject || name || linkedDoc?.name || "Document",
        createdBy: "Admin",
        createdAt: now,
        sentAt: now,
        status: status || "sent",
        sentTo: sentTo || linkedDoc?.sentTo || null,
        channel: channel || "email",
        // Store values only if no linked documentId exists to eliminate redundancy
        ...(documentId ? {} : { values: values || {} }),
      };
      db.sentHistory = db.sentHistory || [];
      db.sentHistory.unshift(record);
      return record;
    });
  },
  async delete(id) {
    return mutateDb(async (db) => {
      db.sentHistory = (db.sentHistory || []).filter((h) => h.id !== id);
      return { success: true };
    });
  },
};

export const jsonCategoriesRepo = {
  async getAll() {
    const db = await readDb();
    const categories = db.categories || [];
    const templates = db.customTemplates || [];
    return categories.map((cat) => ({
      ...cat,
      templateCount: templates.filter((t) => t.categoryId === cat.id).length,
    }));
  },
  async getById(id) {
    const db = await readDb();
    const cat = (db.categories || []).find((c) => c.id === id);
    if (!cat) return null;
    const templates = db.customTemplates || [];
    return {
      ...cat,
      templateCount: templates.filter((t) => t.categoryId === cat.id).length,
    };
  },
  async create({ name, fullName, description, icon, color, badge, order, createdByUserId = null }) {
    return mutateDb(async (db) => {
      const slug = (name || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const isTaken = (db.categories || []).some((c) => c.id === slug);
      const id = slug && !isTaken ? slug : `cat-${Date.now()}`;

    const newCategory = {
      id,
      name: name || "หมวดหมู่ใหม่",
      fullName: fullName || name || "หมวดหมู่ใหม่",
      description: description || "",
      icon: icon || "FileText",
      color: color || "purple",
      badge: badge || "หมวดใหม่",
      order: Number(order) || (db.categories || []).length + 1,
      available: true,
      href: `/create/custom?categoryId=${id}`,
      createdByUserId: createdByUserId || db.users?.[0]?.id || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.categories = db.categories || [];
    db.categories.push(newCategory);
      return newCategory;
    });
  },
  async update(id, { name, fullName, description, icon, color, badge, order }) {
    return mutateDb(async (db) => {
      db.categories = db.categories || [];
      const idx = db.categories.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error("ไม่พบหมวดหมู่นี้");

    db.categories[idx] = {
      ...db.categories[idx],
      ...(name !== undefined ? { name } : {}),
      ...(fullName !== undefined ? { fullName } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(icon !== undefined ? { icon } : {}),
      ...(color !== undefined ? { color } : {}),
      ...(badge !== undefined ? { badge } : {}),
      ...(order !== undefined ? { order: Number(order) } : {}),
      updatedAt: new Date().toISOString(),
    };
      return db.categories[idx];
    });
  },
  async delete(id) {
    return mutateDb(async (db) => {
      const before = (db.categories || []).length;
      db.categories = (db.categories || []).filter((c) => c.id !== id);
      return { success: db.categories.length < before };
    });
  },
};

export const jsonCustomTemplatesRepo = {
  async getAll({ categoryId } = {}) {
    const db = await readDb();
    let list = db.customTemplates || [];
    if (categoryId && categoryId !== "all") {
      list = list.filter((t) => t.categoryId === categoryId);
    }
    return list.map((t) => {
      const editorType = t.editorType || "document";
      const isSheet = editorType === "sheet";
      return {
        ...t,
        editorType,
        canvasPreset: isSheet ? null : t.canvasPreset || (editorType === "slide" ? "slide-16-9" : "a4-portrait"),
        sheetData: Array.isArray(t.sheetData) ? t.sheetData : [],
      };
    });
  },
  async getById(id) {
    const db = await readDb();
    const item = (db.customTemplates || []).find((t) => t.id === id);
    if (!item) return null;
    const editorType = item.editorType || "document";
    const isSheet = editorType === "sheet";
    return {
      ...item,
      editorType,
      canvasPreset: isSheet ? null : item.canvasPreset || (editorType === "slide" ? "slide-16-9" : "a4-portrait"),
      sheetData: Array.isArray(item.sheetData) ? item.sheetData : [],
    };
  },
  async create({
    name,
    categoryId,
    description,
    icon,
    badge,
    status = "published",
    orientation = "portrait",
    theme = { primaryColor: "#5542F6", backgroundColor: "#FFFFFF", hasWatermark: false },
    blocks = [],
    pageCount = 1,
    pages = [],
    editorType = "document",
    canvasPreset = "a4-portrait",
    sheetData = [],
    margin = null,
    createdByUserId = null,
  }) {
    return mutateDb(async (db) => {
      const id = `tmpl-${Date.now()}`;
      const validEditorTypes = ["document", "slide", "sheet"];
      const safeEditorType = validEditorTypes.includes(editorType) ? editorType : "document";
      const isSheet = safeEditorType === "sheet";
      const safeCanvasPreset = isSheet ? null : canvasPreset || (safeEditorType === "slide" ? "slide-16-9" : "a4-portrait");
      const now = new Date().toISOString();
      const primaryUserId = createdByUserId || db.users?.[0]?.id || null;

      // Create initial version snapshot
      const versionId = `tv-${id}-v1`;
      const versionRecord = {
        id: versionId,
        templateId: id,
        version: 1,
        name: name || (isSheet ? "เทมเพลตตารางคำนวณใหม่ (Sheets)" : "เทมเพลตใหม่"),
        description: description || "",
        categoryId: categoryId || "forms",
        blocks: Array.isArray(blocks) ? blocks : [],
        pages: isSheet ? [] : Array.isArray(pages) ? pages : [],
        createdAt: now,
        createdByUserId: primaryUserId,
      };

      const newTemplate = {
        id,
        name: name || (isSheet ? "เทมเพลตตารางคำนวณใหม่ (Sheets)" : "เทมเพลตใหม่"),
        categoryId: categoryId || "forms",
        editorType: safeEditorType,
        canvasPreset: safeCanvasPreset,
        version: 1,
        currentVersionId: versionId,
        description: description || "",
        icon: icon || (isSheet ? "Table" : "FileText"),
        badge: badge || "กำหนดเอง",
        status: status || "published",
        orientation: isSheet ? "landscape" : orientation,
        theme,
        margin: margin || (theme?.marginMm !== undefined ? { mm: theme.marginMm, px: theme.marginPx } : null),
        pageCount: isSheet ? 0 : pageCount || (pages.length > 0 ? pages.length : 1),
        pages: isSheet ? [] : Array.isArray(pages) ? pages : [],
        sheetData: isSheet ? (Array.isArray(sheetData) ? sheetData : []) : [],
        blocks: Array.isArray(blocks) ? blocks : [],
        createdByUserId: primaryUserId,
        createdAt: now,
        updatedAt: now,
      };

      db.customTemplates = db.customTemplates || [];
      db.customTemplates.unshift(newTemplate);
      db.templateVersions = db.templateVersions || [];
      db.templateVersions.push(versionRecord);

      return newTemplate;
    });
  },
  async update(id, data) {
    return mutateDb(async (db) => {
      db.customTemplates = db.customTemplates || [];
      const idx = db.customTemplates.findIndex((t) => t.id === id);
      if (idx === -1) throw new Error("ไม่พบเทมเพลตนี้");

      const current = db.customTemplates[idx];
      const validEditorTypes = ["document", "slide", "sheet"];
      const safeEditorType = data.editorType && validEditorTypes.includes(data.editorType)
        ? data.editorType
        : current.editorType || "document";
      const isSheet = safeEditorType === "sheet";
      const now = new Date().toISOString();
      const newVersion = (current.version || 1) + 1;

      // Determine if content has changed (blocks/pages) — only snapshot if content changed
      const hasContentChange = data.publishSnapshot === true && (
        data.blocks !== undefined || data.pages !== undefined || data.sheetData !== undefined
      );
      let newCurrentVersionId = current.currentVersionId;

      if (hasContentChange) {
        const versionId = `tv-${id}-v${newVersion}`;
        const versionRecord = {
          id: versionId,
          templateId: id,
          version: newVersion,
          name: data.name !== undefined ? data.name : current.name,
          description: data.description !== undefined ? data.description : (current.description || ""),
          categoryId: data.categoryId !== undefined ? data.categoryId : (current.categoryId || null),
          blocks: Array.isArray(data.blocks) ? data.blocks : (Array.isArray(current.blocks) ? current.blocks : []),
          pages: isSheet ? [] : (Array.isArray(data.pages) ? data.pages : (Array.isArray(current.pages) ? current.pages : [])),
          createdAt: now,
          createdByUserId: data.createdByUserId || current.createdByUserId || db.users?.[0]?.id || null,
        };
        db.templateVersions = db.templateVersions || [];
        db.templateVersions.push(versionRecord);
        newCurrentVersionId = versionId;
      }

      db.customTemplates[idx] = {
        ...current,
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
        ...(data.editorType !== undefined ? { editorType: safeEditorType } : {}),
        ...(data.canvasPreset !== undefined ? { canvasPreset: isSheet ? null : data.canvasPreset } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.icon !== undefined ? { icon: data.icon } : {}),
        ...(data.badge !== undefined ? { badge: data.badge } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.orientation !== undefined ? { orientation: data.orientation } : {}),
        ...(data.theme !== undefined ? { theme: data.theme } : {}),
        ...(data.margin !== undefined ? { margin: data.margin } : {}),
        ...(data.blocks !== undefined ? { blocks: data.blocks } : {}),
        ...(data.pageCount !== undefined ? { pageCount: isSheet ? 0 : data.pageCount } : {}),
        ...(data.pages !== undefined ? { pages: isSheet ? [] : data.pages } : {}),
        ...(data.sheetData !== undefined ? { sheetData: Array.isArray(data.sheetData) ? data.sheetData : [] } : {}),
        version: hasContentChange ? newVersion : current.version,
        currentVersionId: newCurrentVersionId,
        updatedAt: now,
      };

      return db.customTemplates[idx];
    });
  },
  async delete(id) {
    return mutateDb(async (db) => {
      const before = (db.customTemplates || []).length;
      db.customTemplates = (db.customTemplates || []).filter((t) => t.id !== id);
      // Also remove all version records for this template
      db.templateVersions = (db.templateVersions || []).filter((v) => v.templateId !== id);
      return { success: db.customTemplates.length < before };
    });
  },
};



export const jsonSettingsRepo = {
  async get() {
    const db = await readDb();
    const current = db.settings || {};
    return {
      ...DEFAULT_SETTINGS,
      ...current,
      account: { ...DEFAULT_SETTINGS.account, ...(current.account || {}) },
      preferences: { ...DEFAULT_SETTINGS.preferences, ...(current.preferences || {}) },
      organization: { ...DEFAULT_SETTINGS.organization, ...(current.organization || {}) },
      sessions: current.sessions || DEFAULT_SETTINGS.sessions,
    };
  },
  async update(patch) {
    return mutateDb(async (db) => {
      const current = {
        ...DEFAULT_SETTINGS,
        ...(db.settings || {}),
        account: { ...DEFAULT_SETTINGS.account, ...(db.settings?.account || {}) },
        preferences: { ...DEFAULT_SETTINGS.preferences, ...(db.settings?.preferences || {}) },
        organization: { ...DEFAULT_SETTINGS.organization, ...(db.settings?.organization || {}) },
        sessions: db.settings?.sessions || DEFAULT_SETTINGS.sessions,
      };

    const updated = {
      ...current,
      ...patch,
      account: patch.account ? { ...current.account, ...patch.account } : current.account,
      preferences: patch.preferences ? { ...current.preferences, ...patch.preferences } : current.preferences,
      organization: patch.organization ? { ...current.organization, ...patch.organization } : current.organization,
      sessions: patch.sessions !== undefined ? patch.sessions : current.sessions,
    };

    // Keep legacy top-level in sync if preferences or language/theme were updated
    if (patch.language) {
      updated.language = patch.language;
      updated.preferences.language = patch.language;
    }
    if (patch.theme) {
      updated.theme = patch.theme;
      updated.preferences.theme = patch.theme;
    }
    if (patch.preferences?.language) {
      updated.language = patch.preferences.language;
    }
    if (patch.preferences?.theme) {
      updated.theme = patch.preferences.theme;
    }

    db.settings = updated;
      return updated;
    });
  }
};

export const jsonCustomTokensRepo = {
  async getAll({ templateId } = {}) {
    const db = await readDb();
    let list = db.customTokens || [];
    if (templateId) {
      // Return global tokens + tokens scoped to this specific template
      list = list.filter((t) => t.scope === "global" || t.templateId === templateId);
    }
    return list;
  },
  async create({ key, label, example = "", scope = "global", dataType = "text", category = "custom", templateId = null, createdByUserId = null }) {
    return mutateDb(async (db) => {
      db.customTokens = db.customTokens || [];

      // Validate key format (lowercase letters, digits, underscores only)
      const cleanKey = (key || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
      if (!cleanKey) throw new Error("กรุณาระบุรหัสตัวแปร (key)");
      if (!label?.trim()) throw new Error("กรุณาระบุชื่อตัวแปร (label)");

      // Prevent duplicate keys
      const existing = db.customTokens.find((t) => t.key === cleanKey);
      if (existing) throw new Error(`ตัวแปร {{${cleanKey}}} มีอยู่แล้วในระบบ`);

      const validScopes = ["global", "template"];
      const safeScope = validScopes.includes(scope) ? scope : "global";

      const validDataTypes = ["text", "number", "date", "currency", "image"];
      const safeDataType = validDataTypes.includes(dataType) ? dataType : "text";

      // If scope is "template", templateId is required
      const safeTemplateId = safeScope === "template" ? (templateId || null) : null;

      if (safeScope === "template" && !safeTemplateId) {
        throw new Error("กรุณาระบุ templateId สำหรับตัวแปรที่ใช้เฉพาะเทมเพลต");
      }

      const primaryUserId = createdByUserId || db.users?.[0]?.id || null;

      const newToken = {
        id: `ctok-${Date.now()}`,
        key: cleanKey,
        label: label.trim(),
        example: example?.trim() || "",
        scope: safeScope,
        dataType: safeDataType,
        ...(safeTemplateId ? { templateId: safeTemplateId } : {}),
        category,
        createdByUserId: primaryUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.customTokens.push(newToken);
      return newToken;
    });
  },
  async update(id, data) {
    return mutateDb(async (db) => {
      db.customTokens = db.customTokens || [];
      const idx = db.customTokens.findIndex((t) => t.id === id);
      if (idx === -1) throw new Error("ไม่พบตัวแปรนี้");

      const current = db.customTokens[idx];
      const validScopes = ["global", "template"];
      const validDataTypes = ["text", "number", "date", "currency", "image"];

      const safeScope = data.scope !== undefined
        ? (validScopes.includes(data.scope) ? data.scope : current.scope)
        : current.scope;
      const safeDataType = data.dataType !== undefined
        ? (validDataTypes.includes(data.dataType) ? data.dataType : current.dataType)
        : current.dataType;
      // If scope changes away from "template", clear templateId
      const safeTemplateId = safeScope === "template"
        ? (data.templateId !== undefined ? data.templateId : current.templateId)
        : null;

      if (safeScope === "template" && !safeTemplateId) {
        throw new Error("กรุณาระบุ templateId สำหรับตัวแปรที่ใช้เฉพาะเทมเพลต");
      }

      db.customTokens[idx] = {
        ...current,
        ...(data.label !== undefined ? { label: data.label.trim() } : {}),
        ...(data.example !== undefined ? { example: data.example?.trim() || "" } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        scope: safeScope,
        dataType: safeDataType,
        ...(safeTemplateId ? { templateId: safeTemplateId } : { templateId: null }),
        updatedAt: new Date().toISOString(),
      };
      return db.customTokens[idx];
    });
  },
  async delete(id) {
    return mutateDb(async (db) => {
      const before = (db.customTokens || []).length;
      db.customTokens = (db.customTokens || []).filter((t) => t.id !== id);
      return { success: db.customTokens.length < before };
    });
  },
};


export const jsonNotificationsRepo = {
  async getAll() {
    const db = await readDb();
    const list = db.notifications || [];
    return [...list].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
  async getUnreadCount() {
    const db = await readDb();
    const list = db.notifications || [];
    return list.filter((n) => n.unread).length;
  },
  async create({ type = "document_created", title, description = "", link = "/documents", metadata = {} }) {
    return mutateDb(async (db) => {
      db.notifications = db.notifications || [];
      const newNotif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        type,
        title: title || "การแจ้งเตือนใหม่",
        description: description || "",
        timestamp: new Date().toISOString(),
        unread: true,
        link: link || "/documents",
        metadata: metadata || {},
      };
      db.notifications.unshift(newNotif);
      if (db.notifications.length > 50) {
        db.notifications = db.notifications.slice(0, 50);
      }
      return newNotif;
    });
  },
  async markAsRead(id) {
    return mutateDb(async (db) => {
      const found = (db.notifications || []).some((n) => n.id === id);
      db.notifications = (db.notifications || []).map((n) =>
        n.id === id ? { ...n, unread: false } : n
      );
      return { success: found };
    });
  },
  async markAllAsRead() {
    return mutateDb(async (db) => {
      db.notifications = (db.notifications || []).map((n) => ({ ...n, unread: false }));
      return { success: true };
    });
  },
  async delete(id) {
    return mutateDb(async (db) => {
      const before = (db.notifications || []).length;
      db.notifications = (db.notifications || []).filter((n) => n.id !== id);
      return { success: db.notifications.length < before };
    });
  },
  async clearAll() {
    return mutateDb(async (db) => {
      db.notifications = [];
      return { success: true };
    });
  },
};

export const jsonOrganizationsRepo = {
  async getAll() {
    const db = await readDb();
    return db.organizations || [];
  },
  async getById(id) {
    const db = await readDb();
    return (db.organizations || []).find((o) => o.id === id) || null;
  },
  async getPrimary() {
    const db = await readDb();
    return (db.organizations || [])[0] || null;
  },
  async update(id, data) {
    return mutateDb(async (db) => {
      db.organizations = db.organizations || [];
      const idx = db.organizations.findIndex((o) => o.id === id);
      if (idx === -1) throw new Error("Organization not found");
      db.organizations[idx] = {
        ...db.organizations[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      // Keep settings.organization synchronized for full backward compatibility
      if (idx === 0 && db.settings) {
        db.settings.organization = {
          ...db.settings.organization,
          ...data,
        };
      }
      return db.organizations[idx];
    });
  },
};

export const jsonUsersRepo = {
  async getAll() {
    const db = await readDb();
    return db.users || [];
  },
  async getById(id) {
    const db = await readDb();
    return (db.users || []).find((u) => u.id === id) || null;
  },
  async getPrimary() {
    const db = await readDb();
    return (db.users || [])[0] || null;
  },
  async update(id, data) {
    return mutateDb(async (db) => {
      db.users = db.users || [];
      const idx = db.users.findIndex((u) => u.id === id);
      if (idx === -1) throw new Error("User not found");
      db.users[idx] = {
        ...db.users[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      // Keep settings.account synchronized for full backward compatibility
      if (idx === 0 && db.settings) {
        db.settings.account = {
          ...db.settings.account,
          ...data,
        };
      }
      return db.users[idx];
    });
  },
};

export const jsonTemplateVersionsRepo = {
  async getAll({ templateId } = {}) {
    const db = await readDb();
    let list = db.templateVersions || [];
    if (templateId) {
      list = list.filter((v) => v.templateId === templateId);
    }
    return [...list].sort((a, b) => b.version - a.version);
  },
  async getById(id) {
    const db = await readDb();
    return (db.templateVersions || []).find((v) => v.id === id) || null;
  },
  async getByTemplateId(templateId) {
    const db = await readDb();
    return (db.templateVersions || [])
      .filter((v) => v.templateId === templateId)
      .sort((a, b) => b.version - a.version);
  },
  async getLatest(templateId) {
    const db = await readDb();
    const versions = (db.templateVersions || [])
      .filter((v) => v.templateId === templateId)
      .sort((a, b) => b.version - a.version);
    return versions[0] || null;
  },
};

export const jsonOrganizationSignatoriesRepo = {
  async getAll({ orgId } = {}) {
    const db = await readDb();
    let list = db.organizationSignatories || [];
    if (orgId) list = list.filter((s) => s.orgId === orgId);
    return list;
  },
  async getPrimary({ orgId } = {}) {
    const list = await this.getAll({ orgId });
    return list.find((s) => s.isDefault) || list[0] || null;
  },
  async create(data) {
    return mutateDb(async (db) => {
      db.organizationSignatories = db.organizationSignatories || [];
      const id = data.id || `sign-org-${Date.now()}`;
      const newSignatory = {
        id,
        orgId: data.orgId || db.organizations?.[0]?.id || "org-crestzendo",
        fullName: data.fullName || "",
        position: data.position || "",
        signatureImageUrl: data.signatureImageUrl || "",
        sealImageUrl: data.sealImageUrl || "",
        isDefault: Boolean(data.isDefault),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (newSignatory.isDefault) {
        db.organizationSignatories.forEach((s) => {
          if (s.orgId === newSignatory.orgId) s.isDefault = false;
        });
      }
      db.organizationSignatories.push(newSignatory);
      return newSignatory;
    });
  },
};

export const jsonCounterpartiesRepo = {
  async getAll({ orgId } = {}) {
    const db = await readDb();
    let list = db.counterparties || [];
    if (orgId) list = list.filter((c) => c.orgId === orgId && !c.deletedAt);
    else list = list.filter((c) => !c.deletedAt);
    return list;
  },
  async getById(id) {
    const db = await readDb();
    return (db.counterparties || []).find((c) => c.id === id && !c.deletedAt) || null;
  },
  async create(data) {
    return mutateDb(async (db) => {
      db.counterparties = db.counterparties || [];
      const id = data.id || `ctp-${Date.now()}`;
      const now = new Date().toISOString();
      const newCtp = {
        id,
        orgId: data.orgId || db.organizations?.[0]?.id || "org-crestzendo",
        linkedOrgId: data.linkedOrgId || null,
        partyType: data.partyType || "customer",
        companyNameTh: data.companyNameTh || "",
        companyNameEn: data.companyNameEn || null,
        registrationNumber: data.registrationNumber || null,
        branch: data.branch || "สำนักงานใหญ่",
        addressTh: data.addressTh || "",
        addressEn: data.addressEn || null,
        phone: data.phone || null,
        email: data.email || null,
        createdByUserId: data.createdByUserId || db.users?.[0]?.id || null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      db.counterparties.unshift(newCtp);
      return newCtp;
    });
  },
  async update(id, data) {
    return mutateDb(async (db) => {
      db.counterparties = db.counterparties || [];
      const idx = db.counterparties.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error("Counterparty not found");
      db.counterparties[idx] = {
        ...db.counterparties[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      return db.counterparties[idx];
    });
  },
  async delete(id) {
    return mutateDb(async (db) => {
      db.counterparties = db.counterparties || [];
      const idx = db.counterparties.findIndex((c) => c.id === id);
      if (idx === -1) return { success: false };
      db.counterparties[idx].deletedAt = new Date().toISOString();
      return { success: true };
    });
  },
};

export const jsonTemplateBlocksRepo = {
  async getAll() {
    const db = await readDb();
    return db.templateBlocks || [];
  },
  async getByTemplateVersionId(templateVersionId) {
    const db = await readDb();
    return (db.templateBlocks || [])
      .filter((b) => b.templateVersionId === templateVersionId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  },
  async getByTemplateId(templateId) {
    const db = await readDb();
    const versionPrefix = templateId + "-v";
    return (db.templateBlocks || [])
      .filter((b) => b.templateVersionId === templateId || b.templateVersionId?.startsWith(versionPrefix))
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  },
};

export const jsonDocumentFieldValuesRepo = {
  async getByDocumentId(documentId) {
    const db = await readDb();
    return (db.documentFieldValues || []).filter((fv) => fv.documentId === documentId);
  },
  async upsert(documentId, templateFieldId, fieldKey, valueObj) {
    return mutateDb(async (db) => {
      db.documentFieldValues = db.documentFieldValues || [];
      const idx = db.documentFieldValues.findIndex(
        (fv) => fv.documentId === documentId && (fv.templateFieldId === templateFieldId || fv.fieldKey === fieldKey)
      );
      const now = new Date().toISOString();
      const record = {
        id: idx !== -1 ? db.documentFieldValues[idx].id : `dfv-${documentId}-${fieldKey}`,
        documentId,
        templateFieldId,
        fieldKey,
        textValue: valueObj.textValue ?? null,
        numberValue: valueObj.numberValue ?? null,
        dateValue: valueObj.dateValue ?? null,
        booleanValue: valueObj.booleanValue ?? null,
        jsonValue: valueObj.jsonValue ?? null,
        updatedAt: now,
      };
      if (idx !== -1) {
        db.documentFieldValues[idx] = record;
      } else {
        db.documentFieldValues.push(record);
      }
      return record;
    });
  },
};

export const jsonDocumentTablesRepo = {
  async getByDocumentId(documentId) {
    const db = await readDb();
    const tables = (db.documentTables || []).filter((t) => t.documentId === documentId);
    const rows = db.documentTableRows || [];
    return tables.map((t) => ({
      ...t,
      rows: rows
        .filter((r) => r.tableId === t.id)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    }));
  },
};
