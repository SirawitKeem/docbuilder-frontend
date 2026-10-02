import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgres://wawa:S0lut!0n@192.168.3.164:5432/docbuilder?sslmode=disable' });

async function inspect() {
  const orgSig = await pool.query('SELECT * FROM organization_signatories;');
  console.log(`--- organization_signatories (${orgSig.rows.length}) ---`);
  console.table(orgSig.rows);

  const cpSig = await pool.query('SELECT * FROM counterparty_signatories;');
  console.log(`--- counterparty_signatories (${cpSig.rows.length}) ---`);
  console.table(cpSig.rows);

  const fp = await pool.query('SELECT * FROM field_profiles;');
  console.log(`--- field_profiles (${fp.rows.length}) ---`);
  console.table(fp.rows);

  const fpv = await pool.query('SELECT * FROM field_profile_values;');
  console.log(`--- field_profile_values (${fpv.rows.length}) ---`);
  console.table(fpv.rows);

  const fks = await pool.query(`
    SELECT
      tc.table_name, kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name 
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name IN ('organization_signatories', 'counterparty_signatories', 'field_profiles', 'field_profile_values');
  `);
  console.log('--- FKs referencing these tables ---');
  console.table(fks.rows);

  await pool.end();
}

inspect().catch(console.error);
