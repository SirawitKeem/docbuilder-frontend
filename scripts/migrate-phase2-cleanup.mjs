import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgres://wawa:S0lut!0n@192.168.3.164:5432/docbuilder?sslmode=disable' });

async function migratePhase2() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('1. Updating default signatory in settings.organization...');
    const orgSettings = await client.query(`SELECT id, value FROM settings WHERE key = 'organization' LIMIT 1;`);
    if (orgSettings.rows.length > 0) {
      const currentVal = orgSettings.rows[0].value || {};
      const updatedVal = {
        ...currentVal,
        signatoryName: currentVal.signatoryName || 'นายศรายุทธ โกสิยารักษ์',
        signatoryPosition: currentVal.signatoryPosition || 'กรรมการผู้จัดการ / CEO'
      };
      await client.query(`
        UPDATE settings 
        SET value = $1::jsonb, updated_at = now()
        WHERE id = $2;
      `, [JSON.stringify(updatedVal), orgSettings.rows[0].id]);
    }

    console.log('2. Enhancing counterparties table with contact_name, contact_position, metadata...');
    await client.query(`
      ALTER TABLE counterparties 
      ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS contact_position VARCHAR(255),
      ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
    `);

    console.log('3. Backfilling contact details into counterparties...');
    // NextGen
    await client.query(`
      UPDATE counterparties
      SET contact_name = 'นายวิทวัส อัครเดชากุล',
          contact_position = 'กรรมการผู้มีอำนาจลงนามผูกพันบริษัท',
          updated_at = now()
      WHERE company_name_th ILIKE '%เน็กซ์เจน%';
    `);

    // Recovery Advisor
    await client.query(`
      UPDATE counterparties
      SET contact_name = 'นายศรายุทธ โกสิยารักษ์',
          contact_position = 'CEO/Founder',
          updated_at = now()
      WHERE company_name_th ILIKE '%รีโคฟเวอรี่%';
    `);

    // Test Cloud
    await client.query(`
      UPDATE counterparties
      SET contact_name = 'นายทดสอบ ระบบดี',
          contact_position = 'กรรมการผู้จัดการ',
          updated_at = now()
      WHERE company_name_th ILIKE '%เทสท์ คลาวด์%';
    `);

    // CS LoxInfo
    await client.query(`
      UPDATE counterparties
      SET contact_name = 'Sarun Phongpodchanan',
          contact_position = 'Client Representative',
          metadata = '{"attn_name": "Sarun Phongpodchanan", "end_user": "P.R. Foodland Co., Ltd.", "am_name": "Narin Rattanavijai / Channel Manager", "am_phone": "+6682-44-666-95"}'::jsonb,
          updated_at = now()
      WHERE company_name_th ILIKE '%CS LoxInfo%';
    `);

    console.log('4. Dropping FK constraint on documents.our_signatory_id...');
    await client.query(`
      ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_our_signatory_id_fkey;
    `);

    await client.query('COMMIT');
    console.log('--- Phase 2 Migration Successful! ---');

    // Verification
    const cpRes = await client.query(`
      SELECT id, company_name_th, contact_name, contact_position, metadata 
      FROM counterparties;
    `);
    console.table(cpRes.rows);

    const sRes = await client.query(`SELECT key, value FROM settings WHERE key = 'organization';`);
    console.log('Updated settings.organization:', sRes.rows[0].value);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Phase 2 Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migratePhase2().catch(console.error);
