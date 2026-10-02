import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgres://wawa:S0lut!0n@192.168.3.164:5432/docbuilder?sslmode=disable' });

const NEW_USER_UUID = '01a0fa5c-e3e4-7013-a331-93a672d1fc20'; // UUIDv7 for สิรวิทย์ เพชรจำรัส (keem@crestzendo.com)
const OLD_USER_ID = 'usr-admin';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('--- STARTING USER UUID MIGRATION ---');

    // 1. Check if user already exists
    const userRes = await client.query('SELECT * FROM users WHERE id = $1', [OLD_USER_ID]);
    if (userRes.rows.length === 0) {
      console.log('User usr-admin not found or already migrated.');
      await client.query('ROLLBACK');
      return;
    }
    const adminUser = userRes.rows[0];
    console.log('Found user:', adminUser.full_name, adminUser.email);

    // 2. Insert new user record with UUIDv7 if not exists
    await client.query(`
      INSERT INTO users (id, org_id, full_name, email, role, avatar, two_factor_enabled, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO NOTHING;
    `, [
      NEW_USER_UUID,
      adminUser.org_id,
      adminUser.full_name,
      adminUser.email + '.temp', // temporary to avoid UNIQUE violation on email while swapping
      adminUser.role,
      adminUser.avatar,
      adminUser.two_factor_enabled,
      adminUser.created_at,
      adminUser.updated_at
    ]);

    // 3. Update referencing tables
    const tablesToUpdate = [
      { table: 'document_masters', col: 'created_by_user_id' },
      { table: 'documents', col: 'created_by_user_id' },
      { table: 'templates', col: 'created_by_user_id' },
      { table: 'categories', col: 'created_by_user_id' },
      { table: 'counterparties', col: 'created_by_user_id' },
      { table: 'field_profiles', col: 'created_by_user_id' },
      { table: 'notifications', col: 'user_id' },
      { table: 'document_approvals', col: 'approver_user_id' }
    ];

    for (const item of tablesToUpdate) {
      try {
        const res = await client.query(`
          UPDATE "${item.table}" 
          SET "${item.col}" = $1 
          WHERE "${item.col}" = $2
        `, [NEW_USER_UUID, OLD_USER_ID]);
        console.log(`Updated ${item.table}.${item.col}: ${res.rowCount} rows`);
      } catch (err) {
        console.log(`Skipping ${item.table}: ${err.message}`);
      }
    }

    // 4. Delete old usr-admin and set real email on new user
    await client.query('DELETE FROM users WHERE id = $1', [OLD_USER_ID]);
    await client.query('UPDATE users SET email = $1 WHERE id = $2', [adminUser.email, NEW_USER_UUID]);
    console.log('Successfully swapped usr-admin to UUID:', NEW_USER_UUID);

    // 5. Create a view for document_masters with user & org details
    await client.query(`
      CREATE OR REPLACE VIEW v_document_masters AS
      SELECT 
        m.id,
        m.doc_type,
        m.format_type,
        m.document_type_id,
        m.parent_template_id,
        m.document_number,
        m.title,
        m.description,
        m.status,
        m.version,
        m.category_id,
        c.name AS category_name,
        m.org_id,
        o.name AS organization_name,
        m.created_by_user_id,
        u.full_name AS created_by_name,
        u.email AS created_by_email,
        u.role AS created_by_role,
        m.verification_token,
        m.created_at,
        m.updated_at,
        m.deleted_at
      FROM document_masters m
      LEFT JOIN users u ON m.created_by_user_id = u.id
      LEFT JOIN organizations o ON m.org_id = o.id
      LEFT JOIN categories c ON m.category_id = c.id;
    `);
    console.log('Created/updated view v_document_masters successfully');

    await client.query('COMMIT');
    console.log('--- TRANSACTION COMMITTED SUCCESSFULLY ---');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed, rolled back:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
