import crypto from "crypto";
import { query, withTransaction } from "./pool.js";
import { mapRowToCamel, mapRowsToCamel } from "./helpers.js";
import { getNextAtomicDocumentNo } from "./counters.js";
import { generateEntityId } from "../../idGenerator.js";

const DEFAULT_ADMIN_USER_ID = "01a0fa5c-e3e4-7013-a331-93a672d1fc20"; // สิรวิทย์ เพชรจำรัส (keem@crestzendo.com)
const DEFAULT_ADMIN_EMAIL   = "keem@crestzendo.com";
const DEFAULT_ADMIN_NAME    = "สิรวิทย์ เพชรจำรัส";
const DEFAULT_ORG_ID = "01a08f90-59be-7c58-8b63-54c85d0ca49c"; // บริษัท เครสท์ เซนโด จำกัด

// =============================================================================
// 1. Documents Repository (Postgres)
// =============================================================================
export const postgresDocumentsRepo = {
  async getAll() {
    const sql = `
      SELECT d.*, COALESCE(t.name, d.template_name) as template_name
      FROM documents d
      LEFT JOIN templates t ON d.template_id = t.id
      WHERE d.deleted_at IS NULL 
      ORDER BY d.created_at DESC;
    `;
    const res = await query(sql);
    return mapRowsToCamel(res.rows);
  },

  async getById(id) {
    const sql = `
      SELECT d.*, COALESCE(t.name, d.template_name) as template_name
      FROM documents d
      LEFT JOIN templates t ON d.template_id = t.id
      WHERE d.id = $1 AND d.deleted_at IS NULL;
    `;
    const res = await query(sql, [id]);
    if (res.rows.length === 0) return null;
    return mapRowToCamel(res.rows[0]);
  },

  async create(record) {
    const docId = record.id || generateEntityId("document");
    const orgId = record.orgId || DEFAULT_ORG_ID;
    const values = record.values || {};
    const activityLogs = record.activityLogs || [];
    const approvalChain = record.approvalChain || [];

    const sql = `
      INSERT INTO documents (
        id, org_id, template_id, template_version_label, our_signatory_id,
        name, document_number, status, verification_token, watermark, sent_to,
        template_name, created_by, created_by_user_id, values, version,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, 1,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *;
    `;

    const params = [
      docId,
      orgId,
      record.templateId || null,
      record.templateVersionId || record.templateVersionLabel || null,
      record.ourSignatoryId || null,
      record.name || "Untitled Document",
      record.documentNumber || record.documentNo || null,
      record.status || "draft",
      record.verificationToken || generateEntityId("verification"),
      record.watermark || "none",
      record.sentTo || null,
      record.templateName || null,
      record.createdBy || DEFAULT_ADMIN_NAME,
      record.createdByUserId || DEFAULT_ADMIN_USER_ID,
      JSON.stringify(values),
    ];

    const res = await query(sql, params);
    const createdRow = mapRowToCamel(res.rows[0]);

    // Grant owner permission and write creation event to timeline
    const ownerEmail = record.createdByEmail || record.userEmail || DEFAULT_ADMIN_EMAIL;
    const ownerName  = record.createdBy || DEFAULT_ADMIN_NAME;
    try {
      await query(`
        INSERT INTO document_authorizations (
          id, document_id, user_email, permission_level, granted_by_email, is_active, entity_type
        ) VALUES ($1, $2, $3, 'owner', $3, TRUE, 'document')
        ON CONFLICT (id) DO NOTHING;
      `, [`auth_${docId}`, docId, ownerEmail]);

      await query(`
        INSERT INTO document_timelines (
          id, document_id, event_type, actor_name, actor_email, channel, details
        ) VALUES (gen_random_uuid(), $1, 'created', $2, $3, 'web_app', $4);
      `, [
        docId,
        ownerName,
        ownerEmail,
        JSON.stringify({ name: record.name || "Untitled Document" }),
      ]);
    } catch (syncErr) {
      console.warn("Timeline/auth sync error (non-fatal):", syncErr);
    }

    return createdRow;
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
    const sentTo = updates.sentTo !== undefined ? updates.sentTo : existing.sentTo;
    const lastSentAt = updates.lastSentAt !== undefined ? updates.lastSentAt : existing.lastSentAt;

    const sql = `
      UPDATE documents
      SET 
        name = $1,
        status = $2,
        values = $3,
        sent_to = $4,
        last_sent_at = $5,
        version = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND version = $8
      RETURNING *;
    `;

    const res = await query(sql, [
      name,
      status,
      JSON.stringify(values),
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

  // Helper: write event to document_timelines
  async _writeTimeline(documentId, eventType, actorName, actorEmail, details = {}) {
    try {
      await query(`
        INSERT INTO document_timelines (id, document_id, event_type, actor_name, actor_email, channel, details, created_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, 'web_app', $5, CURRENT_TIMESTAMP);
      `, [
        documentId,
        eventType,
        actorName || DEFAULT_ADMIN_NAME,
        actorEmail || DEFAULT_ADMIN_EMAIL,
        JSON.stringify(details),
      ]);
    } catch (e) {
      console.warn("Timeline write error (non-fatal):", e);
    }
  },

  async addActivityLog(id, logEntry) {
    const doc = await this.getById(id);
    if (!doc) throw new Error(`Document not found: ${id}`);
    // Write to document_timelines instead of activity_logs JSONB
    await this._writeTimeline(id, logEntry.action || 'activity', logEntry.actor || logEntry.performedBy, null, logEntry);
    return doc;
  },

  async submitForApproval(id, payload = {}) {
    const doc = await this.getById(id);
    if (!doc) throw new Error(`Document not found: ${id}`);
    const actor = payload.performedBy || payload.actor || DEFAULT_ADMIN_NAME;

    const updated = await this.update(id, { status: "pending_approval" });
    await this._writeTimeline(id, 'submitted_for_approval', actor, payload.actorEmail, {
      comment: payload.comment || "Submitted for approval",
    });
    return updated;
  },

  async approveDocument(id, payload = {}) {
    const doc = await this.getById(id);
    if (!doc) throw new Error(`Document not found: ${id}`);

    const actor = payload.performedBy || payload.actor || DEFAULT_ADMIN_NAME;
    const values = doc.values || {};
    if (payload.signatureImg) {
      values.signatures = values.signatures || {};
      values.signatures.approver = payload.signatureImg;
    }
    const verificationToken = doc.verificationToken || generateEntityId("document").replace("doc_", "VRF-").toUpperCase();

    const sql = `
      UPDATE documents
      SET 
        status = 'completed',
        approved_at = CURRENT_TIMESTAMP,
        approved_by = $1,
        values = $2,
        verification_token = $3,
        version = version + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *;
    `;
    const res = await query(sql, [actor, JSON.stringify(values), verificationToken, id]);
    await this._writeTimeline(id, 'approved', actor, payload.actorEmail, {
      comment: payload.comment || "Approved document",
    });
    return mapRowToCamel(res.rows[0]);
  },

  async rejectDocument(id, payload = {}) {
    const doc = await this.getById(id);
    if (!doc) throw new Error(`Document not found: ${id}`);

    const actor = payload.performedBy || payload.actor || DEFAULT_ADMIN_NAME;
    const reason = payload.reason || payload.comment || "Rejected";

    const sql = `
      UPDATE documents
      SET 
        status = 'rejected',
        rejection_reason = $1,
        version = version + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `;
    const res = await query(sql, [reason, id]);
    await this._writeTimeline(id, 'rejected', actor, payload.actorEmail, {
      reason,
      comment: reason,
    });
    return mapRowToCamel(res.rows[0]);
  },

  async recordExportAction(id, payload = {}) {
    const doc = await this.getById(id);
    if (!doc) throw new Error(`Document not found: ${id}`);

    const actor = payload.performedBy || payload.actor || DEFAULT_ADMIN_NAME;
    const format = (payload.format || "PDF").toUpperCase();

    const sql = `
      UPDATE documents
      SET 
        version = version + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    const res = await query(sql, [id]);

    await query(`
      INSERT INTO document_timelines (id, document_id, event_type, actor_name, actor_email, channel, export_format, details, created_at)
      VALUES (gen_random_uuid(), $1, 'exported', $2, $3, 'web_app', $4, $5, CURRENT_TIMESTAMP);
    `, [
      id,
      actor,
      payload.actorEmail || DEFAULT_ADMIN_EMAIL,
      format,
      JSON.stringify({ details: payload.details || `ส่งออกเอกสารรูปแบบ ${format}` }),
    ]);

    return mapRowToCamel(res.rows[0]);
  },

  async delete(id) {
    if (Array.isArray(id)) {
      if (id.length === 0) return { success: true, count: 0 };
      const sql = `DELETE FROM documents WHERE id = ANY($1) RETURNING id;`;
      const res = await query(sql, [id]);
      return { success: res.rowCount > 0, count: res.rowCount };
    }
    const sql = `DELETE FROM documents WHERE id = $1 RETURNING id;`;
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
      WHERE (template_id = 'quotation' OR template_id = 'tmpl-quotation-standard') AND deleted_at IS NULL 
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
    const docId = data.id || generateEntityId("quotation");
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
      id: generateEntityId("quotation"),
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
  async getAll(filter = {}) {
    let sql = `SELECT * FROM templates WHERE deleted_at IS NULL`;
    const params = [];

    if (filter?.categoryId && filter.categoryId !== "all") {
      params.push(String(filter.categoryId).toLowerCase());
      sql += ` AND LOWER(category_id::text) = $${params.length}`;
    }

    if (filter?.orgId) {
      params.push(filter.orgId);
      sql += ` AND org_id = $${params.length}`;
    }

    sql += ` ORDER BY created_at DESC;`;
    const res = await query(sql, params);
    return mapRowsToCamel(res.rows);
  },

  async getById(id) {
    const sql = `SELECT * FROM templates WHERE id = $1 AND deleted_at IS NULL;`;
    const res = await query(sql, [id]);
    if (res.rows.length === 0) return null;
    return mapRowToCamel(res.rows[0]);
  },

  async create(record) {
    const isUuid = (str) => typeof str === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const id = (record.id && isUuid(record.id)) ? record.id : crypto.randomUUID();
    const orgId = record.orgId || DEFAULT_ORG_ID;
    const categoryId = isUuid(record.categoryId) ? record.categoryId : null;

    const sql = `
      INSERT INTO templates (
        id, org_id, category_id, name, description, editor_type, canvas_preset,
        orientation, theme, status, is_custom, is_standard, pages, sheet_data,
        margin, icon, badge, created_by_user_id, custom_tokens, version, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *;
    `;

    const params = [
      id,
      orgId,
      categoryId,
      record.name || "Untitled Template",
      record.description || "",
      record.editorType || "document",
      record.canvasPreset || (record.editorType === "sheet" ? null : "a4-portrait"),
      record.orientation || "portrait",
      typeof record.theme === "string" ? record.theme.slice(0, 50) : (record.theme?.name || "modern"),
      record.status || "published",
      record.isCustom !== undefined ? record.isCustom : true,
      record.isStandard || false,
      JSON.stringify(record.pages || []),
      JSON.stringify(record.sheetData || []),
      JSON.stringify(record.margin || {}),
      record.icon || (record.editorType === "sheet" ? "Table" : "FileText"),
      record.badge || (record.editorType === "sheet" ? "สเปรดชีต" : "กำหนดเอง"),
      record.createdByUserId || DEFAULT_ADMIN_USER_ID,
      JSON.stringify(record.customTokens || []),
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
    const customTokens = updates.customTokens !== undefined ? updates.customTokens : (existing.customTokens || []);
    const isUuid = (str) => typeof str === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const categoryId = updates.categoryId !== undefined
      ? (isUuid(updates.categoryId) ? updates.categoryId : existing.categoryId)
      : existing.categoryId;

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
        category_id = $8,
        custom_tokens = $9,
        version = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11 AND version = $12
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
      categoryId,
      JSON.stringify(customTokens),
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

  async getPermissions(templateId) {
    const sql = `SELECT * FROM template_permissions WHERE template_id = $1 ORDER BY created_at ASC;`;
    const res = await query(sql, [templateId]);
    return mapRowsToCamel(res.rows);
  },

  async addPermission(record) {
    const id = record.id || generateEntityId("perm");
    const sql = `
      INSERT INTO template_permissions (id, template_id, grantee_type, grantee_id, grantee_name, permission_level, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const res = await query(sql, [
      id,
      record.templateId,
      record.granteeType || "user",
      record.granteeId || null,
      record.granteeName || "",
      record.permissionLevel || "creator",
      record.createdBy || "สิรวิทย์ เพชรจำรัส",
    ]);
    return mapRowToCamel(res.rows[0]);
  },

  async deletePermission(id) {
    const sql = `DELETE FROM template_permissions WHERE id = $1 RETURNING *;`;
    const res = await query(sql, [id]);
    return { success: res.rowCount > 0 };
  },

  async getShares(templateId) {
    const sql = `SELECT * FROM template_shares WHERE template_id = $1 ORDER BY created_at DESC;`;
    const res = await query(sql, [templateId]);
    return mapRowsToCamel(res.rows);
  },

  async createShare(record) {
    const id = record.id || generateEntityId("share");
    const token = record.shareToken || `tsh_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const sql = `
      INSERT INTO template_shares (id, template_id, share_token, share_type, password_hash, expires_at, max_uses, is_active, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const res = await query(sql, [
      id,
      record.templateId,
      token,
      record.shareType || "view_only",
      record.passwordHash || null,
      record.expiresAt || null,
      record.maxUses || null,
      record.isActive !== undefined ? record.isActive : true,
      record.createdBy || "สิรวิทย์ เพชรจำรัส",
    ]);
    return mapRowToCamel(res.rows[0]);
  },

  async updateShare(id, updates) {
    const sql = `
      UPDATE template_shares
      SET 
        is_active = COALESCE($1, is_active),
        expires_at = COALESCE($2, expires_at),
        max_uses = COALESCE($3, max_uses),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *;
    `;
    const res = await query(sql, [
      updates.isActive !== undefined ? updates.isActive : null,
      updates.expiresAt !== undefined ? updates.expiresAt : null,
      updates.maxUses !== undefined ? updates.maxUses : null,
      id,
    ]);
    return res.rows[0] ? mapRowToCamel(res.rows[0]) : null;
  },

  async deleteShare(id) {
    const sql = `DELETE FROM template_shares WHERE id = $1 RETURNING *;`;
    const res = await query(sql, [id]);
    return { success: res.rowCount > 0 };
  },

  async getShareByToken(token) {
    const sql = `
      SELECT ts.*, t.name as template_name, t.category_id, t.editor_type, t.canvas_preset, t.pages, t.theme, t.governance_policy
      FROM template_shares ts
      JOIN templates t ON ts.template_id = t.id
      WHERE ts.share_token = $1 AND ts.is_active = TRUE AND t.deleted_at IS NULL;
    `;
    const res = await query(sql, [token]);
    if (res.rows.length === 0) return null;
    await query(`UPDATE template_shares SET view_count = view_count + 1 WHERE share_token = $1;`, [token]);
    return mapRowToCamel(res.rows[0]);
  },

  async updateGovernance(templateId, governancePolicy) {
    const sql = `
      UPDATE templates 
      SET governance_policy = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *;
    `;
    const res = await query(sql, [JSON.stringify(governancePolicy), templateId]);
    return res.rows[0] ? mapRowToCamel(res.rows[0]) : null;
  },
};

// =============================================================================
// 4. Categories Repository (Postgres)
// =============================================================================
export const postgresCategoriesRepo = {
  async getAll() {
    const sql = `SELECT * FROM categories ORDER BY sort_order ASC, created_at ASC;`;
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
    const id = record.id || generateEntityId("category");
    const orgId = record.orgId || DEFAULT_ORG_ID;
    const sql = `
      INSERT INTO categories (
        id, org_id, name, full_name, description, icon, color, badge, sort_order, created_by_user_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const res = await query(sql, [
      id,
      orgId,
      record.name,
      record.fullName || record.name,
      record.description || "",
      record.icon || "FileText",
      record.color || "purple",
      record.badge || "ทั่วไป",
      record.sortOrder || record.order || 0,
      record.createdByUserId || DEFAULT_ADMIN_USER_ID,
    ]);
    return mapRowToCamel(res.rows[0]);
  },

  async update(id, updates) {
    const sql = `
      UPDATE categories
      SET name = COALESCE($1, name),
          full_name = COALESCE($2, full_name),
          icon = COALESCE($3, icon),
          description = COALESCE($4, description),
          color = COALESCE($5, color),
          badge = COALESCE($6, badge),
          sort_order = COALESCE($7, sort_order),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *;
    `;
    const res = await query(sql, [
      updates.name,
      updates.fullName,
      updates.icon,
      updates.description,
      updates.color,
      updates.badge,
      updates.sortOrder || updates.order,
      id,
    ]);
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
    role: "owner",
    roleId: "01a0fa9c-0db9-74e5-9879-45ab12c71056",
    roleDisplayNameTh: "เจ้าของระบบ",
    roleDisplayNameEn: "Workspace Owner",
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
    signatoryName: "นายศรายุทธ โกสิยารักษ์",
    signatoryPosition: "กรรมการผู้จัดการ / CEO",
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
    const orgId = DEFAULT_ORG_ID;

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
// 6. Custom Tokens Repository (Template-Scoped via templates.custom_tokens)
// =============================================================================
export const postgresCustomTokensRepo = {
  async getAll(filter = {}) {
    const templateId = filter?.templateId;
    if (templateId) {
      const tmpl = await postgresCustomTemplatesRepo.getById(templateId);
      const tokens = tmpl?.customTokens || [];
      return Array.isArray(tokens) ? tokens : [];
    }
    // Aggregate tokens across all templates
    const templates = await postgresCustomTemplatesRepo.getAll();
    const all = [];
    templates.forEach((t) => {
      if (Array.isArray(t.customTokens)) {
        t.customTokens.forEach((tok) => {
          all.push({ ...tok, templateId: t.id });
        });
      }
    });
    return all;
  },

  async create(record) {
    const templateId = record.templateId;
    const newToken = {
      id: record.id || generateEntityId("token"),
      key: record.tokenKey || record.key,
      label: record.label,
      category: record.category || "custom",
      scope: "template",
      fieldType: record.fieldType || record.dataType || "text",
      dataType: record.fieldType || record.dataType || "text",
      example: record.exampleValue || record.example || "",
      exampleValue: record.exampleValue || record.example || "",
      description: record.description || "",
      templateId: templateId || null,
      createdAt: new Date().toISOString(),
    };

    if (templateId) {
      const tmpl = await postgresCustomTemplatesRepo.getById(templateId);
      if (tmpl) {
        const existingTokens = Array.isArray(tmpl.customTokens) ? [...tmpl.customTokens] : [];
        existingTokens.push(newToken);
        await postgresCustomTemplatesRepo.update(templateId, { customTokens: existingTokens });
      }
    }
    return newToken;
  },

  async update(id, updates) {
    const templates = await postgresCustomTemplatesRepo.getAll();
    for (const tmpl of templates) {
      if (Array.isArray(tmpl.customTokens)) {
        const idx = tmpl.customTokens.findIndex((t) => t.id === id);
        if (idx !== -1) {
          const updatedToken = {
            ...tmpl.customTokens[idx],
            ...updates,
            label: updates.label !== undefined ? updates.label : tmpl.customTokens[idx].label,
            example: updates.exampleValue !== undefined ? updates.exampleValue : (updates.example !== undefined ? updates.example : tmpl.customTokens[idx].example),
            description: updates.description !== undefined ? updates.description : tmpl.customTokens[idx].description,
            updatedAt: new Date().toISOString(),
          };
          tmpl.customTokens[idx] = updatedToken;
          await postgresCustomTemplatesRepo.update(tmpl.id, { customTokens: tmpl.customTokens });
          return updatedToken;
        }
      }
    }
    return null;
  },

  async delete(id) {
    const templates = await postgresCustomTemplatesRepo.getAll();
    for (const tmpl of templates) {
      if (Array.isArray(tmpl.customTokens)) {
        const filtered = tmpl.customTokens.filter((t) => t.id !== id);
        if (filtered.length !== tmpl.customTokens.length) {
          await postgresCustomTemplatesRepo.update(tmpl.id, { customTokens: filtered });
          return { success: true };
        }
      }
    }
    return { success: false };
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
    const id = record.id || generateEntityId("notification");
    const userId = record.userId || DEFAULT_ADMIN_USER_ID;
    const sql = `
      INSERT INTO notifications (id, user_id, title, message, type, is_read, link_url, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const res = await query(sql, [
      id,
      userId,
      record.title,
      record.message || record.description || record.title || "",
      record.type || "info",
      record.isRead || false,
      record.linkUrl || record.link || null,
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
    const id = record.id || generateEntityId("sent");
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

// 9. Field Profiles Repository (Retired in Migration 000018 - Unified Document Store)
// Kept as safe stubs returning empty collections so legacy UI components don't crash
export const postgresFieldProfilesRepo = {
  async getAll() {
    return [];
  },

  async getById(id) {
    return null;
  },

  async create(record) {
    return { id: record.id || generateEntityId("fieldProfile"), ...record, values: record.values || {} };
  },

  async update(id, updates) {
    return { id, ...updates };
  },

  async remove(id) {
    return { success: true };
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

export const postgresRolesRepo = {
  async getAll() {
    const res = await query(`SELECT * FROM roles ORDER BY hierarchy_level ASC;`);
    return mapRowsToCamel(res.rows);
  },
  async getById(id) {
    const res = await query(`SELECT * FROM roles WHERE id = $1;`, [id]);
    return res.rows[0] ? mapRowToCamel(res.rows[0]) : null;
  },
  async getByName(name) {
    const res = await query(`SELECT * FROM roles WHERE name = $1;`, [name]);
    return res.rows[0] ? mapRowToCamel(res.rows[0]) : null;
  },
};

export const postgresUsersRepo = {
  async getAll() {
    const sql = `
      SELECT u.*, 
             r.name as role_name, 
             r.display_name_th as role_display_name_th, 
             r.display_name_en as role_display_name_en,
             r.permissions as role_permissions,
             r.hierarchy_level as role_hierarchy_level
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at ASC;
    `;
    const res = await query(sql);
    return mapRowsToCamel(res.rows);
  },
  async getById(id) {
    const sql = `
      SELECT u.*, 
             r.name as role_name, 
             r.display_name_th as role_display_name_th, 
             r.display_name_en as role_display_name_en,
             r.permissions as role_permissions,
             r.hierarchy_level as role_hierarchy_level
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1;
    `;
    const res = await query(sql, [id]);
    return res.rows[0] ? mapRowToCamel(res.rows[0]) : null;
  },
  async getPrimary() {
    const sql = `
      SELECT u.*, 
             r.name as role_name, 
             r.display_name_th as role_display_name_th, 
             r.display_name_en as role_display_name_en,
             r.permissions as role_permissions,
             r.hierarchy_level as role_hierarchy_level
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at ASC LIMIT 1;
    `;
    const res = await query(sql);
    return res.rows[0] ? mapRowToCamel(res.rows[0]) : null;
  },
  async update(id, data) {
    const sql = `
      UPDATE users 
      SET full_name = COALESCE($1, full_name),
          email = COALESCE($2, email),
          role_id = COALESCE($3, role_id),
          role = COALESCE($4, role),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 RETURNING *;
    `;
    const res = await query(sql, [data.fullName, data.email, data.roleId, data.role, id]);
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
    const id = record.id || generateEntityId("signatory");
    const sql = `
      INSERT INTO organization_signatories (id, org_id, full_name, position, is_default, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const res = await query(sql, [id, record.orgId || DEFAULT_ORG_ID, record.fullName, record.position || "", record.isDefault || false]);
    return mapRowToCamel(res.rows[0]);
  },
};

// 10. Counterparties Repository (Retired in Migration 000020 - Unified Document Store)
// Consolidated into documents.values. Kept as safe stubs for backward-compatible API responses.
export const postgresCounterpartiesRepo = {
  async getAll() {
    return [];
  },
  async getById(id) {
    return null;
  },
  async create(record) {
    return { id: record.id || generateEntityId("counterparty"), ...record };
  },
  async update(id, updates) {
    return { id, ...updates };
  },
  async delete(id) {
    return { success: true };
  },
};

// =============================================================================
// 11. Legacy / Normalized Stubs (Safely pointing to 3NF architecture)
// =============================================================================
export const postgresTemplateVersionsRepo = {
  async getAll() {
    return [];
  },
  async getById(id) {
    return null;
  },
  async getByTemplateId(templateId) {
    return [];
  },
  async getLatest(templateId) {
    return null;
  },
};

export const postgresTemplateBlocksRepo = {
  async getAll() {
    return [];
  },
  async getByTemplateVersionId(versionId) {
    return [];
  },
  async getByTemplateId(templateId) {
    return [];
  },
};

export const postgresDocumentFieldValuesRepo = {
  async getByDocumentId(documentId) {
    const doc = await postgresDocumentsRepo.getById(documentId);
    if (!doc || !doc.values) return [];
    return Object.entries(doc.values).map(([key, val], idx) => ({
      id: `val_${documentId}_${idx}`,
      documentId,
      objectKey: key,
      textValue: typeof val === "string" ? val : JSON.stringify(val),
      sortOrder: idx,
    }));
  },
  async upsert(documentId, values = {}) {
    return values;
  },
};

export const postgresDocumentTablesRepo = {
  async getByDocumentId(documentId) {
    const doc = await postgresDocumentsRepo.getById(documentId);
    if (!doc || !doc.values) return [];
    const tables = doc.values.tables || doc.values.sheetData || [];
    return Array.isArray(tables) ? tables : [];
  },
};

export const postgresDocumentTypesRepo = {
  async getAll() {
    const res = await query(`SELECT * FROM document_types WHERE is_active = TRUE ORDER BY code ASC;`);
    return mapRowsToCamel(res.rows);
  },
  async getByCode(code) {
    const res = await query(`SELECT * FROM document_types WHERE code = $1;`, [code]);
    return res.rows[0] ? mapRowToCamel(res.rows[0]) : null;
  },
  async getById(id) {
    const res = await query(`SELECT * FROM document_types WHERE id = $1;`, [id]);
    return res.rows[0] ? mapRowToCamel(res.rows[0]) : null;
  },
};

export const postgresTemplatePagesRepo = {
  async getByTemplateId(templateId) {
    const res = await query(
      `SELECT * FROM template_pages WHERE template_id = $1 ORDER BY page_number ASC;`,
      [templateId]
    );
    return mapRowsToCamel(res.rows);
  },
  async upsertPage(templateId, pageNumber, data = {}) {
    const id = data.id || generateEntityId("tpage");
    const sql = `
      INSERT INTO template_pages (id, template_id, page_number, page_name, styles, values, content_html, canvas_json, sort_order, updated_at)
      VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8::jsonb, $9, CURRENT_TIMESTAMP)
      ON CONFLICT (template_id, page_number) DO UPDATE SET
        page_name = EXCLUDED.page_name,
        styles = EXCLUDED.styles,
        values = EXCLUDED.values,
        content_html = EXCLUDED.content_html,
        canvas_json = EXCLUDED.canvas_json,
        sort_order = EXCLUDED.sort_order,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const res = await query(sql, [
      id,
      templateId,
      pageNumber,
      data.pageName || `หน้า ${pageNumber}`,
      JSON.stringify(data.styles || {}),
      JSON.stringify(data.values || {}),
      data.contentHtml || null,
      JSON.stringify(data.canvasJson || {}),
      data.sortOrder || pageNumber - 1,
    ]);
    return mapRowToCamel(res.rows[0]);
  },
};

export const postgresDocumentPagesRepo = {
  async getByDocumentId(documentId) {
    const res = await query(
      `SELECT * FROM document_pages WHERE document_id = $1 ORDER BY page_number ASC;`,
      [documentId]
    );
    return mapRowsToCamel(res.rows);
  },
  async upsertPage(documentId, pageNumber, data = {}) {
    const id = data.id || generateEntityId("dpage");
    const sql = `
      INSERT INTO document_pages (id, document_id, page_number, page_name, styles, values, content_html, canvas_json, sort_order, updated_at)
      VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8::jsonb, $9, CURRENT_TIMESTAMP)
      ON CONFLICT (document_id, page_number) DO UPDATE SET
        page_name = EXCLUDED.page_name,
        styles = EXCLUDED.styles,
        values = EXCLUDED.values,
        content_html = EXCLUDED.content_html,
        canvas_json = EXCLUDED.canvas_json,
        sort_order = EXCLUDED.sort_order,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const res = await query(sql, [
      id,
      documentId,
      pageNumber,
      data.pageName || `หน้า ${pageNumber}`,
      JSON.stringify(data.styles || {}),
      JSON.stringify(data.values || {}),
      data.contentHtml || null,
      JSON.stringify(data.canvasJson || {}),
      data.sortOrder || pageNumber - 1,
    ]);
    return mapRowToCamel(res.rows[0]);
  },
};

export const postgresDocumentAuthorizationsRepo = {
  async getByEntity(entityId, entityType = "document") {
    const sql = `
      SELECT * FROM document_authorizations 
      WHERE document_id = $1 AND entity_type = $2 AND is_active = true 
      ORDER BY created_at ASC;
    `;
    const res = await query(sql, [entityId, entityType]);
    return mapRowsToCamel(res.rows);
  },
  async grant(record) {
    const id = record.id || generateEntityId("auth");
    const sql = `
      INSERT INTO document_authorizations (
        id, document_id, entity_type, user_name, user_email, role_title, permission_level, granted_by_email, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const res = await query(sql, [
      id,
      record.documentId || record.entityId,
      record.entityType || "document",
      record.userName || record.name || null,
      record.userEmail || record.email,
      record.roleTitle || null,
      record.permissionLevel || record.role || "viewer",
      record.grantedByEmail || "keem@crestzendo.com",
    ]);
    return mapRowToCamel(res.rows[0]);
  },
  async updatePermission(id, permissionLevel) {
    const sql = `
      UPDATE document_authorizations 
      SET permission_level = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *;
    `;
    const res = await query(sql, [permissionLevel, id]);
    return res.rows[0] ? mapRowToCamel(res.rows[0]) : null;
  },
  async revoke(id) {
    const sql = `DELETE FROM document_authorizations WHERE id = $1;`;
    const res = await query(sql, [id]);
    return { success: res.rowCount > 0 };
  },
};


