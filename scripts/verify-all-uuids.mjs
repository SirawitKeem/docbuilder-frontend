import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgres://wawa:S0lut!0n@192.168.3.164:5432/docbuilder?sslmode=disable' });

async function verifyAllUUIDs() {
  const pks = await pool.query(`
    SELECT 
      table_name, 
      column_name,
      data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND (column_name = 'id' OR column_name LIKE '%_id' OR column_name = 'new_uuid')
    ORDER BY data_type, table_name, column_name;
  `);

  console.log('--- ALL ID & FK COLUMNS AND THEIR DATA TYPES ---');
  console.table(pks.rows);

  // Check sample documents
  const docs = await pool.query(`SELECT id, name, org_id, created_by_user_id, pg_typeof(id) as id_type FROM documents LIMIT 3;`);
  console.log('--- SAMPLE DOCUMENTS ---');
  console.table(docs.rows);

  // Check sample templates
  const tmpls = await pool.query(`SELECT id, name, org_id, pg_typeof(id) as id_type FROM templates LIMIT 3;`);
  console.log('--- SAMPLE TEMPLATES ---');
  console.table(tmpls.rows);

  // Check sample document_masters
  const masters = await pool.query(`SELECT id, title, org_id, pg_typeof(id) as id_type FROM document_masters LIMIT 3;`);
  console.log('--- SAMPLE DOCUMENT_MASTERS ---');
  console.table(masters.rows);

  // Check v_document_masters view
  const viewRes = await pool.query(`SELECT id, title, created_by_name, created_by_email, organization_name FROM v_document_masters LIMIT 3;`);
  console.log('--- VIEW v_document_masters ---');
  console.table(viewRes.rows);

  await pool.end();
}

verifyAllUUIDs().catch(console.error);
