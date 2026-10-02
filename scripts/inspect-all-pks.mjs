import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgres://wawa:S0lut!0n@192.168.3.164:5432/docbuilder?sslmode=disable' });

async function check() {
  // 1. Get all tables and their PKs
  const pks = await pool.query(`
    SELECT 
      tc.table_name, 
      kcu.column_name as pk_column,
      c.data_type,
      c.character_maximum_length
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name 
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.columns c
      ON c.table_name = tc.table_name 
      AND c.column_name = kcu.column_name
      AND c.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY' 
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name;
  `);

  console.log('--- ALL TABLES AND PRIMARY KEYS ---');
  console.table(pks.rows);

  // 2. Count rows in each table
  console.log('--- ROW COUNTS ---');
  for (const r of pks.rows) {
    try {
      const cnt = await pool.query(`SELECT COUNT(*) FROM "${r.table_name}"`);
      console.log(`${r.table_name} (${r.pk_column}): ${cnt.rows[0].count} rows`);
    } catch (e) {
      console.log(`${r.table_name}: error ${e.message}`);
    }
  }

  await pool.end();
}

check().catch(console.error);
