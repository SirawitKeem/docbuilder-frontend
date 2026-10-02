#!/usr/bin/env node
/**
 * Run Migration 000019 - Fix created_by_user_id
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
    console.log('🔧 Running Migration 000019: Fix created_by_user_id\n');

    const sqlPath = join(__dirname, '..', '..', 'docbuilder-backend', 'migrations', '000019_fix_created_by_user_id.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    await client.query(sql);

    console.log('🔍 Verification...');
    const catNull = await client.query('SELECT count(1) FROM categories WHERE created_by_user_id IS NULL');
    console.log('  categories NULL count:', catNull.rows[0].count);

    const cpNull = await client.query('SELECT count(1) FROM counterparties WHERE created_by_user_id IS NULL');
    console.log('  counterparties NULL count:', cpNull.rows[0].count);

    console.log('\n✅ Migration 000019 COMPLETE');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
