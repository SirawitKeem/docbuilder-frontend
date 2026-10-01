import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ connectionString: 'postgres://wawa:S0lut!0n@192.168.3.164:5432/docbuilder?sslmode=disable' });

async function check() {
  const tables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  
  console.log('ALL TABLES IN POSTGRESQL:');
  const tableCounts = [];
  for (const row of tables.rows) {
    const tName = row.table_name;
    try {
      const countRes = await pool.query(`SELECT COUNT(*) as cnt FROM "${tName}"`);
      tableCounts.push({ table_name: tName, rows: parseInt(countRes.rows[0].cnt, 10) });
    } catch (e) {
      tableCounts.push({ table_name: tName, rows: 'error: ' + e.message });
    }
  }
  console.table(tableCounts);

  await pool.end();
}
check().catch(console.error);
