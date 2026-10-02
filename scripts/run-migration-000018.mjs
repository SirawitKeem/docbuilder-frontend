#!/usr/bin/env node
/**
 * Run Migration 000018 - Unified Document Store
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
    console.log('🔧 Running Migration 000018: Unified Document Store (Single Source of Truth)\n');

    console.log('📊 Pre-flight checks...');
    const fpCount = await client.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'field_profiles'");
    console.log(`  field_profiles table exists: ${fpCount.rows[0].count > 0}`);

    const sqlPath = join(__dirname, '..', '..', 'docbuilder-backend', 'migrations', '000018_unified_document_store.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    console.log('\n🚀 Executing migration...');
    await client.query(sql);

    console.log('\n🔍 Post-flight verification...');
    const checkTables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema='public' AND table_name IN ('field_profiles', 'field_profile_values')
    `);
    if (checkTables.rows.length === 0) {
      console.log('  ✅ Redundant tables successfully dropped: field_profiles, field_profile_values');
    } else {
      console.log('  ⚠️ Tables still exist:', checkTables.rows.map(r => r.table_name));
    }

    const checkIndex = await client.query(`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'documents' AND indexname = 'idx_documents_values_gin'
    `);
    if (checkIndex.rows.length > 0) {
      console.log('  ✅ GIN index on documents.values created successfully');
    }

    console.log('\n✅ Migration 000018 COMPLETE');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
