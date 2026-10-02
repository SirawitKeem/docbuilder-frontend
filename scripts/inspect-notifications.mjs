import pg from 'pg';

const pool = new pg.Pool({ connectionString: 'postgres://wawa:S0lut!0n@192.168.3.164:5432/docbuilder?sslmode=disable' });

async function inspect() {
  const cols = await pool.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'notifications' ORDER BY ordinal_position;`);
  console.log('=== NOTIFICATIONS COLUMNS ===');
  console.table(cols.rows);

  const countRes = await pool.query('SELECT COUNT(*) FROM notifications;');
  console.log('Total notifications:', countRes.rows[0].count);

  const sample = await pool.query('SELECT id, user_id, title, message, type, is_read, link_url, created_at FROM notifications ORDER BY created_at DESC LIMIT 10;');
  console.log('=== RECENT 10 NOTIFICATIONS ===');
  console.table(sample.rows);

  const types = await pool.query('SELECT DISTINCT type, COUNT(*) FROM notifications GROUP BY type;');
  console.log('=== TYPES DISTRIBUTION ===');
  console.table(types.rows);

  await pool.end();
}

inspect().catch(console.error);
