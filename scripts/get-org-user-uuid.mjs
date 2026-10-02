import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgres://wawa:S0lut!0n@192.168.3.164:5432/docbuilder?sslmode=disable' });

async function getOrg() {
  const res = await pool.query('SELECT id, name FROM organizations');
  console.log('ORGANIZATION UUID:', res.rows[0]);
  const user = await pool.query('SELECT id, full_name, email FROM users');
  console.log('USER UUID:', user.rows[0]);
  await pool.end();
}

getOrg().catch(console.error);
