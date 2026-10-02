import pg from 'pg';

const pool = new pg.Pool({ connectionString: 'postgres://wawa:S0lut!0n@192.168.3.164:5432/docbuilder?sslmode=disable' });

async function inspectAuth() {
  const cols = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'document_authorizations';`);
  console.log('=== document_authorizations columns ===');
  console.table(cols.rows);

  const sample = await pool.query(`SELECT * FROM document_authorizations LIMIT 5;`);
  console.log('=== sample rows ===');
  console.table(sample.rows);

  const timeCols = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'document_timelines';`);
  console.log('=== document_timelines columns ===');
  console.table(timeCols.rows);

  await pool.end();
}

inspectAuth().catch(console.error);
