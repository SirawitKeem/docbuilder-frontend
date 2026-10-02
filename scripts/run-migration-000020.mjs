#!/usr/bin/env node
/**
 * Run Migration 000020 - Drop counterparties
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
    console.log('🔧 Running Migration 000020: Drop counterparties and consolidate into documents.values\n');

    const sqlPath = join(__dirname, '..', '..', 'docbuilder-backend', 'migrations', '000020_drop_counterparties.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    await client.query(sql);

    console.log('🔍 Verification...');
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema='public' AND table_name IN ('counterparties', 'counterparty_signatories')
    `);
    console.log('  Remaining counterparties tables (should be 0):', tables.rows.length);

    const docCol = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='documents' AND column_name='counterparty_id'
    `);
    console.log('  documents.counterparty_id column exists (should be 0):', docCol.rows.length);

    console.log('\n✅ Migration 000020 COMPLETE');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
