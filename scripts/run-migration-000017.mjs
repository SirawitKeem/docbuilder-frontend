#!/usr/bin/env node
/**
 * Run Migration 000017 - Database Cleanup & Normalization
 */
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgres://wawa:S0lut!0n@192.168.3.164:5432/docbuilder?sslmode=disable',
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('🔧 Running Migration 000017: Database Cleanup & Normalization\n');

    // Pre-flight checks
    console.log('📊 Pre-flight checks...');
    
    const templatesWithWrongType = await client.query(
      "SELECT COUNT(*) FROM templates WHERE description LIKE 'Art Work%' AND editor_type = 'document'"
    );
    console.log(`  Templates to fix editor_type: ${templatesWithWrongType.rows[0].count}`);

    const nullCreator = await client.query(
      "SELECT COUNT(*) FROM templates WHERE created_by_user_id IS NULL"
    );
    console.log(`  Templates with NULL created_by_user_id: ${nullCreator.rows[0].count}`);

    const activityLogsRows = await client.query(
      "SELECT COUNT(*) FROM documents WHERE activity_logs IS NOT NULL AND jsonb_array_length(activity_logs) > 0"
    );
    console.log(`  Documents with activity_logs to migrate: ${activityLogsRows.rows[0].count}`);

    const mastersCount = await client.query('SELECT COUNT(*) FROM document_masters');
    console.log(`  document_masters rows to drop: ${mastersCount.rows[0].count}`);

    const objValuesCount = await client.query('SELECT COUNT(*) FROM document_object_values');
    console.log(`  document_object_values rows to drop: ${objValuesCount.rows[0].count}`);

    const objStylesCount = await client.query('SELECT COUNT(*) FROM document_object_styles');
    console.log(`  document_object_styles rows to drop: ${objStylesCount.rows[0].count}`);

    console.log('\n🚀 Executing migration...\n');

    // Read and execute migration SQL
    const sqlPath = join(__dirname, '..', '..', 'docbuilder-backend', 'migrations', '000017_cleanup_and_normalize.sql');
    const sql = readFileSync(sqlPath, 'utf8');
    
    await client.query(sql);

    console.log('✅ Migration executed successfully!\n');

    // Post-flight verification
    console.log('🔍 Post-flight verification...');

    const artworkFixed = await client.query(
      "SELECT COUNT(*) FROM templates WHERE editor_type = 'artwork'"
    );
    console.log(`  Templates with editor_type='artwork': ${artworkFixed.rows[0].count}`);

    const docCount = await client.query('SELECT COUNT(*) FROM documents');
    console.log(`  Documents table intact: ${docCount.rows[0].count} rows`);

    const authCount = await client.query('SELECT COUNT(*) FROM document_authorizations');
    console.log(`  document_authorizations intact: ${authCount.rows[0].count} rows`);

    const timelinesCount = await client.query('SELECT COUNT(*) FROM document_timelines');
    console.log(`  document_timelines after migration: ${timelinesCount.rows[0].count} rows`);

    // Check if dropped columns are gone
    const activityColCheck = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema='public' AND table_name='documents'
      AND column_name IN ('activity_logs', 'approval_chain', 'template_version_id')
    `);
    if (activityColCheck.rows.length > 0) {
      console.log(`  ⚠️  Columns still present (should be 0): ${activityColCheck.rows.map(r => r.column_name).join(', ')}`);
    } else {
      console.log(`  ✅ Old columns dropped successfully`);
    }

    // Check new column names
    const newColCheck = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema='public' AND table_name IN ('templates','documents')
      AND column_name IN ('version_label', 'template_version_label')
    `);
    console.log(`  ✅ New columns: ${newColCheck.rows.map(r => r.column_name).join(', ')}`);

    // Check dead tables are gone
    const deadTables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema='public'
      AND table_name IN ('document_masters', 'document_object_values', 'document_object_styles')
    `);
    if (deadTables.rows.length > 0) {
      console.log(`  ⚠️  Tables still exist: ${deadTables.rows.map(r => r.table_name).join(', ')}`);
    } else {
      console.log(`  ✅ Dead tables dropped: document_masters, document_object_values, document_object_styles`);
    }

    console.log('\n✅ Migration 000017 COMPLETE');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
