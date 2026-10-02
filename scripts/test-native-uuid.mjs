import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgres://wawa:S0lut!0n@192.168.3.164:5432/docbuilder?sslmode=disable' });

async function test() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _test_uuid (
      id uuid PRIMARY KEY,
      created_at timestamptz DEFAULT now()
    );
  `);
  await pool.query(`INSERT INTO _test_uuid (id) VALUES ('01a0fa5c-e3e4-7013-a331-93a672d1fc20') ON CONFLICT DO NOTHING;`);
  const res = await pool.query('SELECT id, pg_typeof(id) as type FROM _test_uuid');
  console.log('Native UUID test result:', res.rows);
  await pool.query('DROP TABLE IF EXISTS _test_uuid');
  await pool.end();
}

test().catch(console.error);
