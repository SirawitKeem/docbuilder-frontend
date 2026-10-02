#!/usr/bin/env node
/**
 * Run Migration 000021 - Consolidate custom_tokens into templates
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
    console.log('🔧 Running Migration 000021: Consolidate custom_tokens into templates\n');

    const sqlPath = join(__dirname, '..', '..', 'docbuilder-backend', 'migrations', '000021_consolidate_custom_tokens.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    await client.query(sql);

    console.log('🔍 Verification...');
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema='public' AND table_name = 'custom_tokens'
    `);
    console.log('  Remaining custom_tokens table (should be 0):', tables.rows.length);

    const tmplCol = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name='templates' AND column_name='custom_tokens'
    `);
    console.log('  templates.custom_tokens column exists:', tmplCol.rows);

    const migrated = await client.query(`
      SELECT id, name, custom_tokens FROM templates WHERE id = '01a09e9a-fd1f-75f7-b619-dc9cbecc7ff0'
    `);
    console.log('  Migrated template custom_tokens:', JSON.stringify(migrated.rows[0]?.custom_tokens));

    console.log('\n✅ Migration 000021 COMPLETE');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
