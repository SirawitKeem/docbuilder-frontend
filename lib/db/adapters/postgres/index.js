import { query, withTransaction } from "./pool.js";
import { mapRowToCamel, mapRowsToCamel } from "./helpers.js";
import { getNextAtomicDocumentNo } from "./counters.js";

// =============================================================================
// 1. Documents Repository (Postgres)
// =============================================================================
export const postgresDocumentsRepo = {
  async getAll() {
    const sql = `
      SELECT * FROM documents 
      WHERE deleted_at IS NULL 
      ORDER BY created_at DESC;
    `;
    const res = await query(sql);
    return mapRowsToCamel(res.rows);
  },

  async getById(id) {
    const sql = `SELECT * FROM documents WHERE id = $1 AND deleted_at IS NULL;`;
    const res = await query(sql, [id]);
    if (res.rows.length === 0) return null;
    return mapRowToCamel(res.rows[0]);
  },

  async create(record) {
    const docId = record.id || `doc-${Date.now()}`;
    const orgId = record.orgId || "org-crestzendo";
    const values = record.values || {};
    const activityLogs = record.activityLogs || [];
    const approvalChain = record.approvalChain || [];

    const sql = `
      INSERT INTO documents (
        id, org_id, template_id, template_version_id, counterparty_id, our_signatory_id,
        name, document_number, status, verification_token, watermark, sent_to,
        template_name, created_by, values, activity_logs, approval_chain, version,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, 1,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *;
    `;

    const params = [
      docId,
      orgId,
      record.templateId || null,
      record.templateVersionId || null,
      record.counterpartyId || null,
      record.ourSignatoryId || null,
      record.name || "Untitled Document",
      record.documentNumber || record.documentNo || null,
      record.status || "draft",
      record.verificationToken || `VRF-${Date.now()}`,
      record.watermark || "none",
      record.sentTo || null,
      record.templateName || null,
      record.createdBy || "Admin",
      JSON.stringify(values),
      JSON.stringify(activityLogs),
      JSON.stringify(approvalChain),
    ];

    const res = await query(sql, params);
    return mapRowToCamel(res.rows[0]);
  },

  async update(id, updates) {
    // 1. Fetch current document to check version
    const existing = await this.getById(id);
    if (!existing) {
      const err = new Error(`Document not found: ${id}`);
      err.statusCode = 404;
      throw err;
    }

    // Optimistic locking check: if caller provided a version, verify match
    const currentVersion = existing.version || 1;
    if (updates.version !== undefined && updates.version !== currentVersion) {
      const conflictErr = new Error(`Optimistic lock conflict: document was modified by another process (current version: ${currentVersion})`);
      conflictErr.statusCode = 409;
      conflictErr.code = "VERSION_CONFLICT";
      throw conflictErr;
    }

    const nextVersion = currentVersion + 1;
    const name = updates.name !== undefined ? updates.name : existing.name;
    const status = updates.status !== undefined ? updates.status : existing.status;
    const values = updates.values !== undefined ? updates.values : existing.values;
    const activityLogs = updates.activityLogs !== undefined ? updates.activityLogs : existing.activityLogs;
    const approvalChain = updates.approvalChain !== undefined ? updates.approvalChain : existing.approvalChain;
    const sentTo = updates.sentTo !== undefined ? updates.sentTo : existing.sentTo;
    const lastSentAt = updates.lastSentAt !== undefined ? updates.lastSentAt : existing.lastSentAt;

    const sql = `
      UPDATE documents
      SET 
        name = $1,
        status = $2,
        values = $3,
        activity_logs = $4,
        approval_chain = $5,
        sent_to = $6,
        last_sent_at = $7,
        version = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9 AND version = $10
      RETURNING *;
    `;

    const res = await query(sql, [
      name,
      status,
      JSON.stringify(values),
      JSON.stringify(activityLogs),
      JSON.stringify(approvalChain),
      sentTo,
      lastSentAt,
      nextVersion,
      id,
      currentVersion,
    ]);

    if (res.rowCount === 0) {
      const conflictErr = new Error(`Optimistic lock conflict on update for document ${id}`);
      conflictErr.statusCode = 409;
      conflictErr.code = "VERSION_CONFLICT";
      throw conflictErr;
    }

    return mapRowToCamel(res.rows[0]);
  },

  async addActivityLog(id, logEntry) {
    const doc = await this.getById(id);
    if (!doc) throw new Error(`Document not found: ${id}`);
    const logs = Array.isArray(doc.activityLogs) ? [...doc.activityLogs] : [];
    logs.push({
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      ...logEntry,
    });
    return this.update(id, { activityLogs: logs });
  },

  async submitForApproval(id, payload = {}) {
    const doc = await this.getById(id);
    if (!doc) throw new Error(`Document not found: ${id}`);

    const actor = payload.performedBy || payload.actor || "User";
    const logs = Array.isArray(doc.activityLogs) ? [...doc.activityLogs] : [];
    logs.unshift({
      id: `act-${Date.now()}`,
      action: "submit_approval",
      performedBy: actor,
      actor,
      comment: payload.comment || "Submitted for approval",
      timestamp: new Date().toISOString(),
    });

    return this.update(id, {
      status: "pending_approval",
      activityLogs: logs,
    });
  },

  async approveDocument(id, payload = {}) {
    const doc = await this.getById(id);
    if (!doc) throw new Error(`Document not found: ${id}`);

    const actor = payload.performedBy || payload.actor || "Approver";
    const logs = Array.isArray(doc.activityLogs) ? [...doc.activityLogs] : [];
    logs.unshift({
      id: `act-${Date.now()}`,
      action: "approve",
      performedBy: actor,
      actor,
      comment: payload.comment || "Approved document",
      timestamp: new Date().toISOString(),
    });

    const values = doc.values || {};
    if (payload.signatureImg) {
      values.signatures = values.signatures || {};
      values.signatures.approver = payload.signatureImg;
    }

    const verificationToken = doc.verificationToken || `VRF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const sql = `
      UPDATE documents
      SET 
        status = 'completed',
        approved_at = CURRENT_TIMESTAMP,
        approved_by = $1,
        activity_logs = $2,
        values = $3,
        verification_token = $4,
        version = version + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *;
    `;
    const res = await query(sql, [actor, JSON.stringify(logs), JSON.stringify(values), verificationToken, id]);
    return mapRowToCamel(res.rows[0]);
  },

  async rejectDocument(id, payload = {}) {
    const doc = await this.getById(id);
    if (!doc) throw new Error(`Document not found: ${id}`);

    const actor = payload.performedBy || payload.actor || "Approver";
    const reason = payload.reason || payload.comment || "Rejected";
    const logs = Array.isArray(doc.activityLogs) ? [...doc.activityLogs] : [];
    logs.unshift({
      id: `act-${Date.now()}`,
      action: "reject",
      performedBy: actor,
      actor,
      comment: reason,
      reason,
      timestamp: new Date().toISOString(),
    });

    const sql = `
      UPDATE documents
      SET 
        status = 'rejected',
        rejection_reason = $1,
        activity_logs = $2,
        version = version + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *;
    `;
    const res = await query(sql, [reason, JSON.stringify(logs), id]);
    return mapRowToCamel(res.rows[0]);
  },

  async recordExportAction(id, payload = {}) {
    const doc = await this.getById(id);
    if (!doc) throw new Error(`Document not found: ${id}`);

    const actor = payload.performedBy || payload.actor || "User";
    const format = (payload.format || "PDF").toUpperCase();
    const logs = Array.isArray(doc.activityLogs) ? [...doc.activityLogs] : [];
    logs.unshift({
      id: `act-${Date.now()}`,
      action: "export",
      format,
      performedBy: actor,
      actor,
      details: payload.details || `ส่งออกเอกสารรูปแบบ ${format}`,
      timestamp: new Date().toISOString(),
    });

    const sql = `
      UPDATE documents
      SET 
        activity_logs = $1,
        version = version + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `;
    const res = await query(sql, [JSON.stringify(logs), id]);
    return mapRowToCamel(res.rows[0]);
  },

  async delete(id) {
    if (Array.isArray(id)) {
      if (id.length === 0) return { success: true, count: 0 };
      const sql = `UPDATE documents SET deleted_at = CURRENT_TIMESTAMP WHERE id = ANY($1) RETURNING id;`;
      const res = await query(sql, [id]);
      return { success: res.rowCount > 0, count: res.rowCount };
    }
    const sql = `UPDATE documents SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id;`;
    const res = await query(sql, [id]);
    return { success: res.rowCount > 0, count: res.rowCount };
  },
};

// =============================================================================
// 2. Quotations Repository (Postgres - Wraps Documents with template_id='quotation')
// =============================================================================
export const postgresQuotationsRepo = {
  async getAll() {
    const sql = `
      SELECT * FROM documents 
      WHERE template_id = 'quotation' AND deleted_at IS NULL 
      ORDER BY created_at DESC;
    `;
    const res = await query(sql);
    return res.rows.map((row) => {
      const camel = mapRowToCamel(row);
      return {
        id: camel.id,
        quotationNo: camel.documentNumber || (camel.values && camel.values.quotationNo) || "",
        name: camel.name,
        ...camel.values,
        createdAt: camel.createdAt,
        updatedAt: camel.updatedAt,
        status: camel.status,
      };
    });
  },

  async getById(id) {
    const doc = await postgresDocumentsRepo.getById(id);
    if (!doc) return null;
    return {
      id: doc.id,
      quotationNo: doc.documentNumber || (doc.values && doc.values.quotationNo) || "",
      name: doc.name,
      ...doc.values,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      status: doc.status,
      version: doc.version,
    };
  },

  async create(data) {
    const prefix = data.prefix || "CZ";
    const quotationNo = data.quotationNo || (await getNextAtomicDocumentNo(prefix));
    const docId = data.id || `qt-${Date.now()}`;
    const name = data.name || `ใบเสนอราคา ${quotationNo}`;

    const values = {
      ...data,
      id: docId,
      quotationNo,
      name,
    };

    const docRecord = {
      id: docId,
      templateId: "quotation",
      name,
      documentNumber: quotationNo,
      values,
      status: data.status || "draft",
    };

    await postgresDocumentsRepo.create(docRecord);
    return values;
  },

  async update(id, data) {
    const existing = await postgresDocumentsRepo.getById(id);
    if (!existing) throw new Error(`Quotation not found: ${id}`);

    const updatedValues = {
      ...(existing.values || {}),
      ...data,
    };

    const updatedDoc = await postgresDocumentsRepo.update(id, {
      name: data.name || existing.name,
      status: data.status || existing.status,
      values: updatedValues,
      version: data.version,
    });

    return {
      id: updatedDoc.id,
      quotationNo: updatedDoc.documentNumber || updatedValues.quotationNo,
      name: updatedDoc.name,
      ...updatedValues,
      version: updatedDoc.version,
    };
  },

  async createRevision(id, payload = {}) {
    const original = await this.getById(id);
    if (!original) throw new Error(`Quotation not found: ${id}`);

    const baseNo = (original.quotationNo || "").split("-R")[0];
    // Find highest revision
    const all = await this.getAll();
    const relatedRevs = all.filter((q) => (q.quotationNo || "").startsWith(baseNo));
    const nextRevNum = relatedRevs.length;
    const revQuotationNo = `${baseNo}-R${String(nextRevNum).padStart(2, "0")}`;

    const revData = {
      ...original,
      id: `qt-${Date.now()}`,
      quotationNo: revQuotationNo,
      name: `${original.name} (Rev ${nextRevNum})`,
      status: "draft",
      parentQuotationId: id,
    };

    return this.create(revData);
  },

  async delete(id) {
    return postgresDocumentsRepo.delete(id);
  },
};

// =============================================================================
// 3. Custom Templates Repository (Postgres)
// =============================================================================
export const postgresCustomTemplatesRepo = {
  async getAll() {
    const sql = `
      SELECT * FROM templates 
      WHERE deleted_at IS NULL 
      ORDER BY created_at DESC;
    `;
    const res = await query(sql);
    return mapRowsToCamel(res.rows);
  },

  async getById(id) {
    const sql = `SELECT * FROM templates WHERE id = $1 AND deleted_at IS NULL;`;
    const res = await query(sql, [id]);
    if (res.rows.length === 0) return null;
    return mapRowToCamel(res.rows[0]);
  },

  async create(record) {
    const id = record.id || `tmpl-${Date.now()}`;
    const orgId = record.orgId || "org-crestzendo";

    const sql = `
      INSERT INTO templates (
        id, org_id, category_id, name, description, editor_type, canvas_preset,
        orientation, theme, status, is_custom, is_standard, pages, sheet_data,
        margin, icon, badge, version, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *;
    `;

    const params = [
      id,
      orgId,
      record.categoryId || null,
      record.name || "Untitled Template",
      record.description || "",
      record.editorType || "document",
      record.canvasPreset || "a4-portrait",
      record.orientation || "portrait",
      record.theme || "modern",
      record.status || "published",
      record.isCustom !== undefined ? record.isCustom : true,
      record.isStandard || false,
      JSON.stringify(record.pages || []),
      JSON.stringify(record.sheetData || {}),
      JSON.stringify(record.margin || {}),
      record.icon || null,
      record.badge || null,
    ];

    const res = await query(sql, params);
    return mapRowToCamel(res.rows[0]);
  },

  async update(id, updates) {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Template not found: ${id}`);

    const currentVersion = existing.version || 1;
    if (updates.version !== undefined && updates.version !== currentVersion) {
      const conflictErr = new Error(`Optimistic lock conflict: template modified by another process`);
      conflictErr.statusCode = 409;
      throw conflictErr;
    }

    const nextVersion = currentVersion + 1;
    const name = updates.name !== undefined ? updates.name : existing.name;
    const description = updates.description !== undefined ? updates.description : existing.description;
    const pages = updates.pages !== undefined ? updates.pages : existing.pages;
    const sheetData = updates.sheetData !== undefined ? updates.sheetData : existing.sheetData;
    const margin = updates.margin !== undefined ? updates.margin : existing.margin;
    const icon = updates.icon !== undefined ? updates.icon : existing.icon;
    const badge = updates.badge !== undefined ? updates.badge : existing.badge;

    const sql = `
      UPDATE templates
      SET 
        name = $1,
        description = $2,
        pages = $3,
        sheet_data = $4,
        margin = $5,
        icon = $6,
        badge = $7,
        version = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9 AND version = $10
      RETURNING *;
    `;

    const res = await query(sql, [
      name,
      description,
      JSON.stringify(pages),
      JSON.stringify(sheetData),
      JSON.stringify(margin),
      icon,
      badge,
      nextVersion,
      id,
      currentVersion,
    ]);

    if (res.rowCount === 0) {
      const conflictErr = new Error(`Optimistic lock conflict on template ${id}`);
      conflictErr.statusCode = 409;
      throw conflictErr;
    }

    return mapRowToCamel(res.rows[0]);
  },

  async delete(id) {
    const sql = `UPDATE templates SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *;`;
    const res = await query(sql, [id]);
    return { success: res.rowCount > 0 };
  },
};

// =============================================================================
// 4. Categories Repository (Postgres)
// =============================================================================
export const postgresCategoriesRepo = {
  async getAll() {
    const sql = `SELECT * FROM categories ORDER BY created_at ASC;`;
    const res = await query(sql);
    return mapRowsToCamel(res.rows);
  },

  async getById(id) {
    const sql = `SELECT * FROM categories WHERE id = $1;`;
    const res = await query(sql, [id]);
    if (res.rows.length === 0) return null;
    return mapRowToCamel(res.rows[0]);
  },

  async create(record) {
    const id = record.id || `cat-${Date.now()}`;
    const sql = `
      INSERT INTO categories (id, name, slug, icon, description, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const res = await query(sql, [
      id,
      record.name,
      record.slug || record.name.toLowerCase().replace(/\s+/g, "-"),
      record.icon || "",
      record.description || "",
    ]);
    return mapRowToCamel(res.rows[0]);
  },

  async update(id, updates) {
    const sql = `
      UPDATE categories
      SET name = COALESCE($1, name),
          icon = COALESCE($2, icon),
          description = COALESCE($3, description),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *;
    `;
    const res = await query(sql, [updates.name, updates.icon, updates.description, id]);
    if (res.rows.length === 0) return null;
    return mapRowToCamel(res.rows[0]);
  },

  async delete(id) {
    const sql = `DELETE FROM categories WHERE id = $1;`;
    const res = await query(sql, [id]);
    return { success: res.rowCount > 0 };
  },
};

// =============================================================================
// 5. Settings Repository (Postgres Key-Value Storage)
// =============================================================================
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

export const postgresSettingsRepo = {
  async get() {
    const sql = `SELECT key, value FROM settings;`;
    const res = await query(sql);
    const settingsMap = {};
    res.rows.forEach((r) => {
      let val = r.value;
      if (typeof val === "string") {
        try { val = JSON.parse(val); } catch { /* keep string */ }
      }
      settingsMap[r.key] = val;
    });

    return {
      ...DEFAULT_SETTINGS,
      ...settingsMap,
      account: { ...DEFAULT_SETTINGS.account, ...(settingsMap.account || {}) },
      preferences: { ...DEFAULT_SETTINGS.preferences, ...(settingsMap.preferences || {}) },
      organization: { ...DEFAULT_SETTINGS.organization, ...(settingsMap.organization || {}) },
      sessions: settingsMap.sessions || DEFAULT_SETTINGS.sessions,
    };
  },

  async update(categoryOrPatch, maybeValues) {
    const orgId = "org-crestzendo";

    // Support both update({ account: {...}, preferences: {...} }) and update("organization", {...})
    if (typeof categoryOrPatch === "object" && maybeValues === undefined) {
      const patch = categoryOrPatch;
      for (const [key, val] of Object.entries(patch)) {
        const id = `set-${orgId}-${key}`;
        const sql = `
          INSERT INTO settings (id, org_id, key, value, updated_at)
          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
          ON CONFLICT (org_id, key)
          DO UPDATE SET value = $4, updated_at = CURRENT_TIMESTAMP;
        `;
        await query(sql, [id, orgId, key, JSON.stringify(val)]);
      }
      return this.get();
    }

    const key = String(categoryOrPatch);
    const id = `set-${orgId}-${key}`;
    const sql = `
      INSERT INTO settings (id, org_id, key, value, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (org_id, key)
      DO UPDATE SET value = $4, updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const res = await query(sql, [id, orgId, key, JSON.stringify(maybeValues)]);
    return this.get();
  },
};

// =============================================================================
// 6. Custom Tokens Repository (Postgres)
// =============================================================================
export const postgresCustomTokensRepo = {
  async getAll() {
    const sql = `SELECT * FROM custom_tokens ORDER BY created_at DESC;`;
    const res = await query(sql);
    return mapRowsToCamel(res.rows);
  },

  async create(record) {
    const id = record.id || `tok-${Date.now()}`;
    const orgId = record.orgId || "org-crestzendo";
    const sql = `
      INSERT INTO custom_tokens (
        id, org_id, token_key, label, category, scope, field_type, example_value, description, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const res = await query(sql, [
      id,
      orgId,
      record.tokenKey || record.key,
      record.label,
      record.category || "General",
      record.scope || "global",
      record.fieldType || "text",
      record.exampleValue || "",
      record.description || "",
    ]);
    return mapRowToCamel(res.rows[0]);
  },

  async update(id, updates) {
    const sql = `
      UPDATE custom_tokens
      SET label = COALESCE($1, label),
          example_value = COALESCE($2, example_value),
          description = COALESCE($3, description),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *;
    `;
    const res = await query(sql, [updates.label, updates.exampleValue, updates.description, id]);
    if (res.rows.length === 0) return null;
    return mapRowToCamel(res.rows[0]);
  },

  async delete(id) {
    const sql = `DELETE FROM custom_tokens WHERE id = $1;`;
    const res = await query(sql, [id]);
    return { success: res.rowCount > 0 };
  },
};

// =============================================================================
// 7. Notifications Repository (Postgres)
// =============================================================================
export const postgresNotificationsRepo = {
  async getAll() {
    const sql = `SELECT * FROM notifications ORDER BY created_at DESC;`;
    const res = await query(sql);
    return mapRowsToCamel(res.rows);
  },

  async getUnreadCount() {
    const sql = `SELECT COUNT(*) AS cnt FROM notifications WHERE is_read = false;`;
    const res = await query(sql);
    return parseInt(res.rows[0]?.cnt || "0", 10);
  },

  async create(record) {
    const id = record.id || `notif-${Date.now()}`;
    const userId = record.userId || "usr-admin";
    const sql = `
      INSERT INTO notifications (id, user_id, title, message, type, is_read, link_url, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const res = await query(sql, [
      id,
      userId,
      record.title,
      record.message,
      record.type || "info",
      record.isRead || false,
      record.linkUrl || null,
    ]);
    return mapRowToCamel(res.rows[0]);
  },

  async markAsRead(id) {
    const sql = `UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *;`;
    const res = await query(sql, [id]);
    return mapRowToCamel(res.rows[0]);
  },

  async markAllAsRead() {
    const sql = `UPDATE notifications SET is_read = true;`;
    await query(sql);
    return true;
  },

  async delete(id) {
    const sql = `DELETE FROM notifications WHERE id = $1;`;
    const res = await query(sql, [id]);
    return { success: res.rowCount > 0 };
  },

  async clearAll() {
    const sql = `DELETE FROM notifications;`;
    await query(sql);
    return true;
  },
};

// =============================================================================
// 8. Sent History Repository (Postgres)
// =============================================================================
export const postgresSentHistoryRepo = {
  async getAll() {
    const sql = `SELECT * FROM sent_history ORDER BY sent_at DESC;`;
    const res = await query(sql);
    return mapRowsToCamel(res.rows);
  },

  async create(record) {
    const id = record.id || `sent-${Date.now()}`;
    const sql = `
      INSERT INTO sent_history (
        id, document_id, document_name, recipient_email, subject, message,
        sent_by, status, action_type, format, channel, sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const res = await query(sql, [
      id,
      record.documentId || null,
      record.documentName || "",
      record.recipientEmail || "",
      record.subject || "",
      record.message || "",
      record.sentBy || "Admin",
      record.status || "success",
      record.actionType || "email",
      record.format || "pdf",
      record.channel || "email",
    ]);
    return mapRowToCamel(res.rows[0]);
  },

  async delete(id) {
    const sql = `DELETE FROM sent_history WHERE id = $1;`;
    const res = await query(sql, [id]);
    return res.rowCount > 0;
  },
};

// =============================================================================
// 9. Field Profiles Repository (Postgres)
// =============================================================================
export const postgresFieldProfilesRepo = {
  async getAll() {
    const profilesRes = await query(`SELECT * FROM field_profiles ORDER BY created_at DESC;`);
    const profiles = mapRowsToCamel(profilesRes.rows);

    // Attach values
    for (const p of profiles) {
      const vRes = await query(`SELECT shared_key, field_value FROM field_profile_values WHERE profile_id = $1;`, [p.id]);
      p.values = {};
      vRes.rows.forEach((r) => {
        p.values[r.shared_key] = r.field_value;
      });
    }
    return profiles;
  },

  async getById(id) {
    const res = await query(`SELECT * FROM field_profiles WHERE id = $1;`, [id]);
    if (res.rows.length === 0) return null;
    const profile = mapRowToCamel(res.rows[0]);
    const vRes = await query(`SELECT shared_key, field_value FROM field_profile_values WHERE profile_id = $1;`, [id]);
    profile.values = {};
    vRes.rows.forEach((r) => {
      profile.values[r.shared_key] = r.field_value;
    });
    return profile;
  },

  async create(record) {
    return withTransaction(async (client) => {
      const id = record.id || `fp-${Date.now()}`;
      const orgId = record.orgId || "org-crestzendo";

      const pSql = `
        INSERT INTO field_profiles (id, org_id, name, profile_type, counterparty_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *;
      `;
      const pRes = await client.query(pSql, [
        id,
        orgId,
        record.name || "Untitled Profile",
        record.profileType || "general",
        record.counterpartyId || null,
      ]);

      if (record.values && typeof record.values === "object") {
        for (const [key, val] of Object.entries(record.values)) {
          await client.query(
            `INSERT INTO field_profile_values (id, profile_id, shared_key, field_value) VALUES ($1, $2, $3, $4);`,
            [`fpv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, id, key, String(val)]
          );
        }
      }
      return mapRowToCamel(pRes.rows[0]);
    });
  },

  async update(id, updates) {
    return withTransaction(async (client) => {
      if (updates.name || updates.profileType) {
        await client.query(
          `UPDATE field_profiles SET name = COALESCE($1, name), profile_type = COALESCE($2, profile_type), updated_at = CURRENT_TIMESTAMP WHERE id = $3;`,
          [updates.name, updates.profileType, id]
        );
      }
      if (updates.values && typeof updates.values === "object") {
        for (const [key, val] of Object.entries(updates.values)) {
          await client.query(
            `INSERT INTO field_profile_values (id, profile_id, shared_key, field_value)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (profile_id, shared_key)
             DO UPDATE SET field_value = $4, updated_at = CURRENT_TIMESTAMP;`,
            [`fpv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, id, key, String(val)]
          );
        }
      }
      return this.getById(id);
    });
  },

  async remove(id) {
    const res = await query(`DELETE FROM field_profiles WHERE id = $1;`, [id]);
    return { success: res.rowCount > 0 };
  },

  async delete(id) {
    return this.remove(id);
  },
};

// =============================================================================
// 10. Organizations, Users, Signatories, Counterparties (Supporting Repos)
// =============================================================================
export const postgresOrganizationsRepo = {
  async getAll() {
    const res = await query(`SELECT * FROM organizations;`);
    return mapRowsToCamel(res.rows);
  },
  async getById(id) {
    const res = await query(`SELECT * FROM organizations WHERE id = $1;`, [id]);
    return res.rows[0] ? mapRowToCamel(res.rows[0]) : null;
  },
  async getPrimary() {
    const res = await query(`SELECT * FROM organizations LIMIT 1;`);
    return res.rows[0] ? mapRowToCamel(res.rows[0]) : null;
  },
  async update(id, data) {
    const sql = `
      UPDATE organizations 
      SET name = COALESCE($1, name),
          tax_id = COALESCE($2, tax_id),
          address = COALESCE($3, address),
          phone = COALESCE($4, phone),
          email = COALESCE($5, email),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 RETURNING *;
    `;
    const res = await query(sql, [data.name, data.taxId, data.address, data.phone, data.email, id]);
    return res.rows[0] ? mapRowToCamel(res.rows[0]) : null;
  },
};

export const postgresUsersRepo = {
  async getAll() {
    const res = await query(`SELECT * FROM users;`);
    return mapRowsToCamel(res.rows);
  },
  async getById(id) {
    const res = await query(`SELECT * FROM users WHERE id = $1;`, [id]);
    return res.rows[0] ? mapRowToCamel(res.rows[0]) : null;
  },
  async getPrimary() {
    const res = await query(`SELECT * FROM users ORDER BY created_at ASC LIMIT 1;`);
    return res.rows[0] ? mapRowToCamel(res.rows[0]) : null;
  },
  async update(id, data) {
    const sql = `
      UPDATE users 
      SET full_name = COALESCE($1, full_name),
          email = COALESCE($2, email),
          role = COALESCE($3, role),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 RETURNING *;
    `;
    const res = await query(sql, [data.fullName, data.email, data.role, id]);
    return res.rows[0] ? mapRowToCamel(res.rows[0]) : null;
  },
};

export const postgresOrganizationSignatoriesRepo = {
  async getAll() {
    const res = await query(`SELECT * FROM organization_signatories;`);
    return mapRowsToCamel(res.rows);
  },
  async getPrimary() {
    const res = await query(`SELECT * FROM organization_signatories WHERE is_default = true LIMIT 1;`);
    if (res.rows[0]) return mapRowToCamel(res.rows[0]);
    const fallback = await query(`SELECT * FROM organization_signatories LIMIT 1;`);
    return fallback.rows[0] ? mapRowToCamel(fallback.rows[0]) : null;
  },
  async create(record) {
    const id = record.id || `sign-${Date.now()}`;
    const sql = `
      INSERT INTO organization_signatories (id, org_id, full_name, position, is_default, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const res = await query(sql, [id, record.orgId || "org-crestzendo", record.fullName, record.position || "", record.isDefault || false]);
    return mapRowToCamel(res.rows[0]);
  },
};

export const postgresCounterpartiesRepo = {
  async getAll() {
    const res = await query(`SELECT * FROM counterparties ORDER BY created_at DESC;`);
    return mapRowsToCamel(res.rows);
  },
  async getById(id) {
    const res = await query(`SELECT * FROM counterparties WHERE id = $1;`, [id]);
    return res.rows[0] ? mapRowToCamel(res.rows[0]) : null;
  },
  async create(record) {
    const id = record.id || `cp-${Date.now()}`;
    const sql = `
      INSERT INTO counterparties (id, org_id, name, tax_id, address, phone, email, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const res = await query(sql, [id, record.orgId || "org-crestzendo", record.name, record.taxId || "", record.address || "", record.phone || "", record.email || ""]);
    return mapRowToCamel(res.rows[0]);
  },
  async update(id, updates) {
    const sql = `
      UPDATE counterparties 
      SET name = COALESCE($1, name),
          tax_id = COALESCE($2, tax_id),
          address = COALESCE($3, address),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 RETURNING *;
    `;
    const res = await query(sql, [updates.name, updates.taxId, updates.address, id]);
    return res.rows[0] ? mapRowToCamel(res.rows[0]) : null;
  },
  async delete(id) {
    const res = await query(`DELETE FROM counterparties WHERE id = $1;`, [id]);
    return { success: res.rowCount > 0 };
  },
};

// =============================================================================
// 11. Legacy / Normalized Stubs (For Full Compatibility With Types)
// =============================================================================
export const postgresTemplateVersionsRepo = {
  async getAll() {
    const res = await query(`SELECT * FROM template_versions ORDER BY version DESC;`);
    return mapRowsToCamel(res.rows);
  },
  async getById(id) {
    const res = await query(`SELECT * FROM template_versions WHERE id = $1;`, [id]);
    return res.rows[0] ? mapRowToCamel(res.rows[0]) : null;
  },
  async getByTemplateId(templateId) {
    const res = await query(`SELECT * FROM template_versions WHERE template_id = $1 ORDER BY version DESC;`, [templateId]);
    return mapRowsToCamel(res.rows);
  },
  async getLatest(templateId) {
    const res = await query(`SELECT * FROM template_versions WHERE template_id = $1 ORDER BY version DESC LIMIT 1;`, [templateId]);
    return res.rows[0] ? mapRowToCamel(res.rows[0]) : null;
  },
};

export const postgresTemplateBlocksRepo = {
  async getAll() {
    const res = await query(`SELECT * FROM template_blocks;`);
    return mapRowsToCamel(res.rows);
  },
  async getByTemplateVersionId(versionId) {
    const res = await query(`SELECT * FROM template_blocks WHERE template_version_id = $1 ORDER BY block_order ASC;`, [versionId]);
    return mapRowsToCamel(res.rows);
  },
  async getByTemplateId(templateId) {
    const sql = `
      SELECT b.* FROM template_blocks b
      JOIN template_versions v ON b.template_version_id = v.id
      WHERE v.template_id = $1
      ORDER BY b.block_order ASC;
    `;
    const res = await query(sql, [templateId]);
    return mapRowsToCamel(res.rows);
  },
};

export const postgresDocumentFieldValuesRepo = {
  async getByDocumentId(documentId) {
    const res = await query(`SELECT * FROM document_field_values WHERE document_id = $1;`, [documentId]);
    return mapRowsToCamel(res.rows);
  },
  async upsert(documentId, values = {}) {
    // Phase 2/3 stores values directly in documents.values JSONB
    return values;
  },
};

export const postgresDocumentTablesRepo = {
  async getByDocumentId(documentId) {
    const res = await query(`SELECT * FROM document_tables WHERE document_id = $1;`, [documentId]);
    return mapRowsToCamel(res.rows);
  },
};
