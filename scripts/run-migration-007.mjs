import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgres://wawa:S0lut!0n@192.168.3.164:5432/docbuilder?sslmode=disable' });

async function run() {
  const sqlPath = path.join(process.cwd(), '..', 'docbuilder-backend', 'migrations', '000007_normalize_and_clean_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('🚀 Running Migration 000007...');
  await pool.query(sql);
  console.log('✅ Migration 000007 executed successfully!');

  console.log('\n📊 Updated Categories in PostgreSQL:');
  const cats = await pool.query('SELECT id, name, full_name, badge, is_system FROM categories ORDER BY sort_order ASC, name ASC');
  console.table(cats.rows);

  console.log('\n📊 Updated Templates count in PostgreSQL:');
  const tmpls = await pool.query('SELECT id, name, category_id, badge FROM templates WHERE deleted_at IS NULL');
  console.table(tmpls.rows);

  await pool.end();
}

run().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
