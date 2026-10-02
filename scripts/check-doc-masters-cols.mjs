import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgres://wawa:S0lut!0n@192.168.3.164:5432/docbuilder?sslmode=disable' });

async function check() {
  const cols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'document_masters' 
    ORDER BY ordinal_position;
  `);
  console.table(cols.rows);
  await pool.end();
}

check().catch(console.error);
