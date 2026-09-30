import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getPool, query } from "../lib/db/adapters/postgres/pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log("=================================================================");
  console.log("🚀 Applying Migration 000005: ID Standardization & 3NF Enhancements");
  console.log("=================================================================\n");

  const migrationPath = path.resolve(__dirname, "../../docbuilder-backend/migrations/000005_id_and_3nf_enhancements.sql");
  console.log(`Reading SQL file: ${migrationPath}`);
  const sql = fs.readFileSync(migrationPath, "utf-8");

  try {
    const pool = getPool();
    console.log("Executing SQL statements...");
    await query(sql);
    console.log("✅ Migration 000005 applied successfully!\n");

    // Verification of new indexes and constraints
    console.log("🔍 Verifying newly created indexes and columns...");
    const indexCheck = await query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE indexname IN (
        'uq_categories_org_name',
        'uq_templates_org_cat_name',
        'idx_documents_org_id',
        'idx_documents_template_id',
        'idx_documents_counterparty_id',
        'idx_documents_created_at',
        'idx_templates_org_id',
        'idx_templates_category_id',
        'idx_documents_values_gin',
        'idx_templates_pages_gin'
      )
      ORDER BY tablename, indexname;
    `);

    console.log("Active Indexes found:");
    indexCheck.rows.forEach(r => console.log(`  - [${r.tablename}] ${r.indexname}`));

    const colCheck = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'org_id';
    `);
    console.log("\nCategories org_id column:", colCheck.rows[0] ? "✅ Present" : "❌ Missing");

    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
}

runMigration();
