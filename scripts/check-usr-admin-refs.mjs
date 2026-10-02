import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgres://wawa:S0lut!0n@192.168.3.164:5432/docbuilder?sslmode=disable' });

async function check() {
  const fkCols = await pool.query(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND (column_name LIKE '%user%' OR column_name LIKE '%org%')
    ORDER BY table_name, column_name;
  `);

  console.log('Columns referencing user or org:');
  for (const row of fkCols.rows) {
    try {
      const qAdmin = await pool.query(`SELECT COUNT(*) as c FROM "${row.table_name}" WHERE "${row.column_name}" = 'usr-admin'`);
      if (parseInt(qAdmin.rows[0].c, 10) > 0) {
        console.log(`  ${row.table_name}.${row.column_name} = 'usr-admin' -> ${qAdmin.rows[0].c} rows`);
      }
    } catch (e) {}

    try {
      const qOrg = await pool.query(`SELECT COUNT(*) as c FROM "${row.table_name}" WHERE "${row.column_name}" = 'org-crestzendo'`);
      if (parseInt(qOrg.rows[0].c, 10) > 0) {
        console.log(`  ${row.table_name}.${row.column_name} = 'org-crestzendo' -> ${qOrg.rows[0].c} rows`);
      }
    } catch (e) {}
  }

  await pool.end();
}

check().catch(console.error);
