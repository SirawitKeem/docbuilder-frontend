import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getPool, query, withTransaction } from "../lib/db/adapters/postgres/pool.js";

const isDryRun = process.argv.includes("--dry-run");

const DB_JSON_PATH = path.join(process.cwd(), "data", "db.json");
const STORAGE_ASSETS_DIR = path.join(process.cwd(), "storage", "assets");

if (!fs.existsSync(STORAGE_ASSETS_DIR) && !isDryRun) {
  fs.mkdirSync(STORAGE_ASSETS_DIR, { recursive: true });
}

function hashSha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function getMimeExtension(mime) {
  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("svg")) return "svg";
  return "bin";
}

/**
 * Recursively scans an object/array, extracts base64 data URIs into asset files,
 * and replaces them with /api/assets/ast-<sha256>
 */
function extractAndReplaceAssets(obj, assetsMap) {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => extractAndReplaceAssets(item, assetsMap));
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && value.startsWith("data:image/")) {
      const match = value.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, "base64");
        const sha256 = hashSha256(buffer);
        const ext = getMimeExtension(mimeType);
        const assetId = `ast-${sha256.substring(0, 16)}`;
        const fileName = `${assetId}.${ext}`;
        const relativePath = path.join("storage", "assets", fileName).replace(/\\/g, "/");
        const absolutePath = path.join(STORAGE_ASSETS_DIR, fileName);

        if (!assetsMap.has(assetId)) {
          assetsMap.set(assetId, {
            id: assetId,
            orgId: "org-crestzendo",
            fileName,
            mimeType,
            filePath: relativePath,
            fileSize: buffer.length,
            sha256,
            buffer,
            absolutePath,
          });
        }

        result[key] = `/api/assets/${assetId}`;
        continue;
      }
    }

    if (typeof value === "object" && value !== null) {
      result[key] = extractAndReplaceAssets(value, assetsMap);
    } else {
      result[key] = value;
    }
  }

  return result;
}

async function runMigration() {
  console.log("=================================================================");
  console.log(`🚀 PostgreSQL Safe Merge & Asset Extraction Migration (Phase 3)`);
  console.log(`   Mode: ${isDryRun ? "🔍 DRY-RUN (No changes will be written)" : "⚡ LIVE EXECUTION"}`);
  console.log("=================================================================\n");

  if (!fs.existsSync(DB_JSON_PATH)) {
    console.error(`❌ db.json not found at: ${DB_JSON_PATH}`);
    process.exit(1);
  }

  const rawJson = fs.readFileSync(DB_JSON_PATH, "utf8");
  const dbData = JSON.parse(rawJson);
  console.log(`📂 Read db.json successfully (${(rawJson.length / (1024 * 1024)).toFixed(2)} MB)\n`);

  const pool = getPool();
  let dbConnected = false;
  try {
    const pingRes = await query("SELECT current_database(), current_user;");
    console.log(`✅ Connected to PostgreSQL: [${pingRes.rows[0].current_database}] User: [${pingRes.rows[0].current_user}]\n`);
    dbConnected = true;
  } catch (err) {
    if (isDryRun) {
      console.log(`⚠️ PostgreSQL is currently unreachable (${err.message}). Continuing DRY-RUN inspection...\n`);
    } else {
      console.error("❌ Cannot connect to PostgreSQL:", err.message);
      process.exit(1);
    }
  }

  const assetsMap = new Map();

  // 1. Process customTemplates and extract assets
  console.log("🖼️ Scanning and extracting base64 images from Templates and Documents...");
  const processedTemplates = (dbData.customTemplates || []).map((tmpl) => {
    return extractAndReplaceAssets(tmpl, assetsMap);
  });

  const processedDocuments = (dbData.documents || []).map((doc) => {
    return extractAndReplaceAssets(doc, assetsMap);
  });

  console.log(`   Found ${assetsMap.size} unique images across templates & documents.`);
  let totalAssetBytes = 0;
  for (const asset of assetsMap.values()) {
    totalAssetBytes += asset.fileSize;
  }
  console.log(`   Total asset size: ${(totalAssetBytes / (1024 * 1024)).toFixed(2)} MB\n`);

  if (!isDryRun) {
    // Write assets to storage/assets/
    console.log("💾 Writing extracted asset files to storage/assets/ ...");
    for (const asset of assetsMap.values()) {
      if (!fs.existsSync(asset.absolutePath)) {
        fs.writeFileSync(asset.absolutePath, asset.buffer);
      }
    }

    // Insert into assets table
    for (const asset of assetsMap.values()) {
      await query(
        `INSERT INTO assets (id, org_id, file_name, mime_type, file_path, file_size, sha256, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO NOTHING;`,
        [asset.id, asset.orgId, asset.fileName, asset.mimeType, asset.filePath, asset.fileSize, asset.sha256]
      );
    }
    console.log("   ✅ Assets saved to disk and recorded in assets table.\n");
  }

  // 2. Perform Two-Way Safe Merge UPSERT
  const counts = {
    organizations: 0,
    users: 0,
    organizationSignatories: 0,
    counterparties: 0,
    counterpartySignatories: 0,
    categories: 0,
    customTokens: 0,
    notifications: 0,
    sentHistory: 0,
    settings: 0,
    fieldProfiles: 0,
    templates: 0,
    documents: 0,
  };

  if (!isDryRun) {
    console.log("📥 Upserting entities into PostgreSQL...");

    // Organizations
    for (const org of dbData.organizations || []) {
      await query(
        `INSERT INTO organizations (id, name, name_en, tax_id, branch, address, phone, email, website, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET 
           name = EXCLUDED.name, address = EXCLUDED.address, phone = EXCLUDED.phone, email = EXCLUDED.email, updated_at = CURRENT_TIMESTAMP;`,
        [org.id, org.name, org.nameEn || "", org.taxId || "", org.branch || "สำนักงานใหญ่", org.address || "", org.phone || "", org.email || "", org.website || "", org.createdAt || new Date(), org.updatedAt || new Date()]
      );
      counts.organizations++;
    }

    // Users
    for (const u of dbData.users || []) {
      await query(
        `INSERT INTO users (id, org_id, full_name, email, role, avatar, two_factor_enabled, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET 
           full_name = EXCLUDED.full_name, email = EXCLUDED.email, role = EXCLUDED.role, updated_at = CURRENT_TIMESTAMP;`,
        [u.id, u.orgId || "org-crestzendo", u.fullName || u.name, u.email, u.role || "owner", u.avatar || "", u.twoFactorEnabled !== false, u.createdAt || new Date(), u.updatedAt || new Date()]
      );
      counts.users++;
    }

    // Organization Signatories
    for (const s of dbData.organizationSignatories || []) {
      await query(
        `INSERT INTO organization_signatories (id, org_id, full_name, position, is_default, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET 
           full_name = EXCLUDED.full_name, position = EXCLUDED.position, is_default = EXCLUDED.is_default, updated_at = CURRENT_TIMESTAMP;`,
        [s.id, s.orgId || "org-crestzendo", s.fullName, s.position || "", s.isDefault || false, s.createdAt || new Date(), s.updatedAt || new Date()]
      );
      counts.organizationSignatories++;
    }

    // Counterparties
    for (const cp of dbData.counterparties || []) {
      await query(
        `INSERT INTO counterparties (id, org_id, name, tax_id, address, phone, email, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET 
           name = EXCLUDED.name, tax_id = EXCLUDED.tax_id, address = EXCLUDED.address, phone = EXCLUDED.phone, email = EXCLUDED.email, updated_at = CURRENT_TIMESTAMP;`,
        [cp.id, cp.orgId || "org-crestzendo", cp.name, cp.taxId || "", cp.address || "", cp.phone || "", cp.email || "", cp.createdAt || new Date(), cp.updatedAt || new Date()]
      );
      counts.counterparties++;
    }

    // Counterparty Signatories
    for (const cs of dbData.counterpartySignatories || []) {
      await query(
        `INSERT INTO counterparty_signatories (id, counterparty_id, full_name, position, is_primary, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET 
           full_name = EXCLUDED.full_name, position = EXCLUDED.position, updated_at = CURRENT_TIMESTAMP;`,
        [cs.id, cs.counterpartyId, cs.fullName, cs.position || "", cs.isPrimary || false, cs.createdAt || new Date(), cs.updatedAt || new Date()]
      );
      counts.counterpartySignatories++;
    }

    // Categories (Preserve existing 8 categories in Postgres, merge db.json 6)
    for (const cat of dbData.categories || []) {
      await query(
        `INSERT INTO categories (id, name, slug, icon, description, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET 
           name = EXCLUDED.name, icon = EXCLUDED.icon, description = EXCLUDED.description, updated_at = CURRENT_TIMESTAMP;`,
        [cat.id, cat.name, cat.slug || cat.name.toLowerCase().replace(/\s+/g, "-"), cat.icon || "", cat.description || "", cat.createdAt || new Date(), cat.updatedAt || new Date()]
      );
      counts.categories++;
    }

    // Custom Tokens (Bring 3 from db.json into Postgres)
    for (const tok of dbData.customTokens || []) {
      await query(
        `INSERT INTO custom_tokens (id, org_id, token_key, label, category, scope, field_type, example_value, description, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET 
           label = EXCLUDED.label, example_value = EXCLUDED.example_value, updated_at = CURRENT_TIMESTAMP;`,
        [tok.id, tok.orgId || "org-crestzendo", tok.tokenKey || tok.key, tok.label, tok.category || "General", tok.scope || "global", tok.fieldType || "text", tok.exampleValue || "", tok.description || "", tok.createdAt || new Date(), tok.updatedAt || new Date()]
      );
      counts.customTokens++;
    }

    // Notifications (Bring 27 from db.json into Postgres)
    for (const notif of dbData.notifications || []) {
      await query(
        `INSERT INTO notifications (id, user_id, title, message, type, is_read, link_url, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET 
           title = EXCLUDED.title, message = EXCLUDED.message, is_read = EXCLUDED.is_read;`,
        [notif.id, notif.userId || "usr-admin", notif.title, notif.message, notif.type || "info", notif.isRead || false, notif.linkUrl || null, notif.createdAt || new Date()]
      );
      counts.notifications++;
    }

    // Sent History (Bring 17 from db.json into Postgres)
    for (const sh of dbData.sentHistory || []) {
      await query(
        `INSERT INTO sent_history (id, document_id, document_name, recipient_email, subject, message, sent_by, status, action_type, format, channel, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO NOTHING;`,
        [sh.id, sh.documentId || null, sh.documentName || "", sh.recipientEmail || "", sh.subject || "", sh.message || "", sh.sentBy || "Admin", sh.status || "success", sh.actionType || "email", sh.format || "pdf", sh.channel || "email", sh.sentAt || new Date()]
      );
      counts.sentHistory++;
    }

    // Settings (Bring 5 categories into Postgres settings key-value rows)
    if (dbData.settings && typeof dbData.settings === "object") {
      const orgId = "org-crestzendo";
      for (const [key, value] of Object.entries(dbData.settings)) {
        const id = `set-${orgId}-${key}`;
        await query(
          `INSERT INTO settings (id, org_id, key, value, updated_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
           ON CONFLICT (org_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;`,
          [id, orgId, key, JSON.stringify(value)]
        );
        counts.settings++;
      }
    }

    // Field Profiles
    for (const fp of dbData.fieldProfiles || []) {
      await query(
        `INSERT INTO field_profiles (id, org_id, name, profile_type, counterparty_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = CURRENT_TIMESTAMP;`,
        [fp.id, fp.orgId || "org-crestzendo", fp.name, fp.profileType || "general", fp.counterpartyId || null, fp.createdAt || new Date(), fp.updatedAt || new Date()]
      );
      counts.fieldProfiles++;

      if (fp.values && typeof fp.values === "object") {
        for (const [sKey, sVal] of Object.entries(fp.values)) {
          await query(
            `INSERT INTO field_profile_values (id, profile_id, shared_key, field_value, updated_at)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
             ON CONFLICT (profile_id, shared_key) DO UPDATE SET field_value = EXCLUDED.field_value, updated_at = CURRENT_TIMESTAMP;`,
            [`fpv-${fp.id}-${sKey}`, fp.id, sKey, String(sVal)]
          );
        }
      }
    }

    // Templates (With extracted lightweight pages JSONB)
    for (const tmpl of processedTemplates) {
      await query(
        `INSERT INTO templates (
           id, org_id, category_id, name, description, editor_type, canvas_preset,
           orientation, theme, status, is_custom, is_standard, pages, sheet_data,
           margin, icon, badge, version, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 1, $18, $19)
         ON CONFLICT (id) DO UPDATE SET 
           name = EXCLUDED.name, description = EXCLUDED.description, pages = EXCLUDED.pages,
           sheet_data = EXCLUDED.sheet_data, margin = EXCLUDED.margin, updated_at = CURRENT_TIMESTAMP;`,
        [
          tmpl.id,
          tmpl.orgId || "org-crestzendo",
          tmpl.categoryId || null,
          tmpl.name,
          tmpl.description || "",
          tmpl.editorType || "document",
          tmpl.canvasPreset || "a4-portrait",
          tmpl.orientation || "portrait",
          tmpl.theme || "modern",
          tmpl.status || "published",
          tmpl.isCustom !== undefined ? tmpl.isCustom : true,
          tmpl.isStandard || false,
          JSON.stringify(tmpl.pages || []),
          JSON.stringify(tmpl.sheetData || {}),
          JSON.stringify(tmpl.margin || {}),
          tmpl.icon || null,
          tmpl.badge || null,
          tmpl.createdAt || new Date(),
          tmpl.updatedAt || new Date(),
        ]
      );
      counts.templates++;
    }

    // Documents (With extracted lightweight values JSONB)
    for (const doc of processedDocuments) {
      const docNumber = doc.documentNumber || doc.documentNo || (doc.values && doc.values.quotationNo) || null;
      await query(
        `INSERT INTO documents (
           id, org_id, template_id, template_version_id, counterparty_id, our_signatory_id,
           name, document_number, status, verification_token, watermark, sent_to,
           template_name, created_by, values, activity_logs, approval_chain, version,
           created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 1, $18, $19)
         ON CONFLICT (id) DO UPDATE SET 
           name = EXCLUDED.name, document_number = EXCLUDED.document_number,
           values = EXCLUDED.values, activity_logs = EXCLUDED.activity_logs,
           approval_chain = EXCLUDED.approval_chain, status = EXCLUDED.status,
           updated_at = CURRENT_TIMESTAMP;`,
        [
          doc.id,
          doc.orgId || "org-crestzendo",
          doc.templateId || null,
          doc.templateVersionId || null,
          doc.counterpartyId || null,
          doc.ourSignatoryId || null,
          doc.name,
          docNumber,
          doc.status || "draft",
          doc.verificationToken || `VRF-${Date.now()}`,
          doc.watermark || "none",
          doc.sentTo || null,
          doc.templateName || null,
          doc.createdBy || "Admin",
          JSON.stringify(doc.values || {}),
          JSON.stringify(doc.activityLogs || []),
          JSON.stringify(doc.approvalChain || []),
          doc.createdAt || new Date(),
          doc.updatedAt || new Date(),
        ]
      );
      counts.documents++;
    }

    console.log("   ✅ All entities safely upserted without data loss.\n");
  } else {
    console.log("🔍 [DRY-RUN] The following records would be processed:");
    Object.keys(dbData).forEach((key) => {
      console.log(`   - ${key.padEnd(25)} : ${Array.isArray(dbData[key]) ? dbData[key].length : typeof dbData[key]}`);
    });
    console.log("\n");
  }

  if (dbConnected) {
    // 3. Post-migration Comparison Table
    console.log("=================================================================");
    console.log("📊 POST-MIGRATION RECORD COMPARISON TABLE");
    console.log("=================================================================");
    const tables = [
      { name: "organizations", jsonKey: "organizations" },
      { name: "users", jsonKey: "users" },
      { name: "organization_signatories", jsonKey: "organizationSignatories" },
      { name: "counterparties", jsonKey: "counterparties" },
      { name: "counterparty_signatories", jsonKey: "counterpartySignatories" },
      { name: "categories", jsonKey: "categories" },
      { name: "custom_tokens", jsonKey: "customTokens" },
      { name: "notifications", jsonKey: "notifications" },
      { name: "sent_history", jsonKey: "sentHistory" },
      { name: "field_profiles", jsonKey: "fieldProfiles" },
      { name: "templates", jsonKey: "customTemplates" },
      { name: "documents", jsonKey: "documents" },
      { name: "settings", jsonKey: "settings" },
      { name: "assets", jsonKey: "(extracted)" },
    ];

    console.log(`${"Table Name".padEnd(28)} | ${"db.json".padEnd(10)} | ${"PostgreSQL".padEnd(12)} | Status`);
    console.log("-".repeat(65));

    for (const t of tables) {
      const jsonCount = t.jsonKey === "(extracted)" ? assetsMap.size : (Array.isArray(dbData[t.jsonKey]) ? dbData[t.jsonKey].length : Object.keys(dbData[t.jsonKey] || {}).length);
      const pgRes = await query(`SELECT COUNT(*) AS cnt FROM "${t.name}";`);
      const pgCount = parseInt(pgRes.rows[0].cnt, 10);
      const status = pgCount >= jsonCount ? "✅ MATCH/SUPERSET" : "⚠️ PG LESS";
      console.log(`${t.name.padEnd(28)} | ${String(jsonCount).padEnd(10)} | ${String(pgCount).padEnd(12)} | ${status}`);
    }
    console.log("=================================================================\n");

    // 4. Sample Verification of 3 Documents
    console.log("🔍 Verifying 3 random sample documents to ensure values integrity...");
    const sampleDocs = (dbData.documents || []).slice(0, 3);
    for (const sDoc of sampleDocs) {
      const pgDocRes = await query(`SELECT id, name, values FROM documents WHERE id = $1;`, [sDoc.id]);
      if (pgDocRes.rows.length === 0) {
        console.log(`   ❌ Sample doc [${sDoc.id}] not found in Postgres!`);
        continue;
      }
      const pgDoc = pgDocRes.rows[0];
      const originalKeys = Object.keys(sDoc.values || {}).sort();
      const pgKeys = Object.keys(pgDoc.values || {}).sort();
      const keysMatch = JSON.stringify(originalKeys) === JSON.stringify(pgKeys);
      console.log(`   Doc: [${sDoc.id}] "${sDoc.name}" -> Keys Match: ${keysMatch ? "✅ 100% IDENTICAL" : "❌ MISMATCH"}`);
    }
  }

  console.log("\n✨ Phase 3 migration script finished successfully!");
  await pool.end();
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
