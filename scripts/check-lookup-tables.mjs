import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgres://wawa:S0lut!0n@192.168.3.164:5432/docbuilder?sslmode=disable' });

async function checkLookupTables() {
  const tables = ['document_types', 'document_object_types', 'page_presets', 'categories'];
  for (const t of tables) {
    const res = await pool.query(`SELECT * FROM "${t}"`);
    console.log(`\n=== Table: ${t} (${res.rows.length} rows) ===`);
    console.table(res.rows);
  }
  await pool.end();
}

checkLookupTables().catch(console.error);
