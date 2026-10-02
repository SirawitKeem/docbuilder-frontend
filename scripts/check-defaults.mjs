import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgres://wawa:S0lut!0n@192.168.3.164:5432/docbuilder?sslmode=disable' });

async function checkDefaults() {
  const res = await pool.query(`
    SELECT table_name, column_name, column_default 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND column_default IS NOT NULL
      AND (column_name = 'id' OR column_name LIKE '%_id');
  `);
  console.log('Columns with defaults:');
  console.table(res.rows);
  await pool.end();
}

checkDefaults().catch(console.error);
