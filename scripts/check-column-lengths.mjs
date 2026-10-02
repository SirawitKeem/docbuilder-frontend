import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgres://wawa:S0lut!0n@192.168.3.164:5432/docbuilder?sslmode=disable' });

async function run() {
  const res = await pool.query(`
    SELECT table_name, column_name, data_type, character_maximum_length
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND (column_name = 'id' OR column_name LIKE '%_id' OR column_name LIKE '%id')
      AND data_type = 'character varying'
    ORDER BY character_maximum_length ASC, table_name, column_name;
  `);
  console.table(res.rows);
  const tooShort = res.rows.filter(r => r.character_maximum_length < 36);
  if (tooShort.length > 0) {
    console.warn('WARNING: Columns shorter than 36 chars found:');
    console.table(tooShort);
  } else {
    console.log('ALL ID columns are >= 36 characters! Safe for UUID string.');
  }
  await pool.end();
}

run().catch(console.error);
