import pg from "pg";
import fs from "fs";
import path from "path";

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://wawa:wawa1234@192.168.3.164:5432/docbuilder";

const pool = new Pool({ connectionString });

async function run() {
  console.log("Connecting to PostgreSQL...");
  const client = await pool.connect();
  try {
    const sqlPath = path.resolve(
      "../docbuilder-backend/migrations/000006_template_sharing_and_governance.sql"
    );
    const sql = fs.readFileSync(sqlPath, "utf-8");

    console.log("Applying Migration 000006...");
    await client.query(sql);
    console.log("Migration 000006 applied successfully!");

    // Verify columns and tables
    const resTables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name IN ('template_permissions', 'template_shares')
    `);
    console.log("Verified tables:", resTables.rows.map((r) => r.table_name));

    const resCols = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'templates' AND column_name IN ('governance_policy', 'sharing_summary')
    `);
    console.log("Verified template columns:", resCols.rows.map((r) => r.column_name));
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
