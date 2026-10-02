import pg from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new pg.Pool({ connectionString: 'postgres://wawa:S0lut!0n@192.168.3.164:5432/docbuilder?sslmode=disable' });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Executing migration 000016...');
    const sqlPath = path.resolve('../docbuilder-backend/migrations/000016_enhance_authorizations_and_sharing.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✓ Migration 000016 completed successfully.');

    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'document_authorizations';
    `);
    console.table(res.rows);

    const sample = await client.query(`SELECT id, document_id, entity_type, user_name, user_email, permission_level FROM document_authorizations LIMIT 5;`);
    console.table(sample.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
