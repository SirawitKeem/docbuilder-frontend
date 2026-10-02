import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgres://wawa:S0lut!0n@192.168.3.164:5432/docbuilder?sslmode=disable' });

async function check() {
  const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'document_object_values'");
  console.log('Columns:');
  console.table(cols.rows);
  const sample = await pool.query('SELECT * FROM document_object_values LIMIT 3');
  console.log('Sample rows:');
  console.table(sample.rows);
  await pool.end();
}

check().catch(console.error);
