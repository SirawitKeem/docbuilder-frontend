import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgres://wawa:S0lut!0n@192.168.3.164:5432/docbuilder?sslmode=disable' });

const ROLES = [
  {
    id: '01a0fa9c-0db9-74e5-9879-45ab12c71056',
    name: 'owner',
    display_name_th: 'เจ้าของระบบ',
    display_name_en: 'Workspace Owner',
    description: 'สิทธิ์สูงสุดทุกอย่างในระบบ จัดการตั้งค่าองค์กร การเงิน และสมาชิกทั้งหมด',
    hierarchy_level: 1,
    permissions: JSON.stringify({
      all: true,
      manage_organization: true,
      manage_billing: true,
      manage_users: true,
      manage_roles: true,
      manage_templates: true,
      manage_documents: true,
      approve_documents: true,
      view_documents: true
    })
  },
  {
    id: '01a0fa9c-0dbe-7465-a961-de730dd597a2',
    name: 'admin',
    display_name_th: 'ผู้ดูแลระบบ',
    display_name_en: 'Administrator',
    description: 'จัดการผู้ใช้ เทมเพลต และตรวจสอบเอกสารทั้งหมดในองค์กร',
    hierarchy_level: 2,
    permissions: JSON.stringify({
      manage_organization: false,
      manage_billing: false,
      manage_users: true,
      manage_roles: false,
      manage_templates: true,
      manage_documents: true,
      approve_documents: true,
      view_documents: true
    })
  },
  {
    id: '01a0fa9c-0dbe-74b3-8a9e-2227e232583d',
    name: 'template_manager',
    display_name_th: 'ผู้จัดการแม่แบบ',
    display_name_en: 'Template Manager',
    description: 'สร้าง แก้ไข และเผยแพร่แม่แบบเอกสาร (Master Templates)',
    hierarchy_level: 3,
    permissions: JSON.stringify({
      manage_templates: true,
      create_documents: true,
      view_documents: true
    })
  },
  {
    id: '01a0fa9c-0dbe-7401-8a9e-4063d441e85d',
    name: 'creator',
    display_name_th: 'ผู้จัดทำเอกสาร',
    display_name_en: 'Document Creator',
    description: 'นำแม่แบบไปสร้างเอกสาร จัดการเอกสารของตนเอง และส่งขออนุมัติ',
    hierarchy_level: 4,
    permissions: JSON.stringify({
      manage_templates: false,
      create_documents: true,
      edit_own_documents: true,
      view_documents: true
    })
  },
  {
    id: '01a0fa9c-0dbe-7419-b85b-56780899081c',
    name: 'approver',
    display_name_th: 'ผู้อนุมัติเอกสาร',
    display_name_en: 'Document Approver',
    description: 'ตรวจสอบเอกสาร ลงนามอนุมัติ (Sign & Approve) หรือส่งกลับแก้ไข',
    hierarchy_level: 5,
    permissions: JSON.stringify({
      approve_documents: true,
      sign_documents: true,
      view_documents: true
    })
  },
  {
    id: '01a0fa9c-0dbe-747c-9a35-d2c42d8eeec3',
    name: 'viewer',
    display_name_th: 'ผู้ดูเอกสาร',
    display_name_en: 'Document Viewer',
    description: 'ดูและดาวน์โหลดเอกสารได้อย่างเดียว (Read-Only)',
    hierarchy_level: 6,
    permissions: JSON.stringify({
      view_documents: true,
      download_documents: true
    })
  }
];

async function migrateRoles() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('1. Creating roles table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        display_name_th VARCHAR(100) NOT NULL,
        display_name_en VARCHAR(100) NOT NULL,
        description TEXT,
        hierarchy_level INT NOT NULL,
        permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
        is_system BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    console.log('2. Seeding 6 standard roles...');
    for (const r of ROLES) {
      await client.query(`
        INSERT INTO roles (id, name, display_name_th, display_name_en, description, hierarchy_level, permissions, is_system)
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, true)
        ON CONFLICT (name) DO UPDATE SET
          display_name_th = EXCLUDED.display_name_th,
          display_name_en = EXCLUDED.display_name_en,
          description = EXCLUDED.description,
          hierarchy_level = EXCLUDED.hierarchy_level,
          permissions = EXCLUDED.permissions,
          updated_at = now();
      `, [r.id, r.name, r.display_name_th, r.display_name_en, r.description, r.hierarchy_level, r.permissions]);
    }

    console.log('3. Adding role_id column to users table...');
    const colRes = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'role_id';
    `);

    if (colRes.rows.length === 0) {
      await client.query(`
        ALTER TABLE users ADD COLUMN role_id UUID REFERENCES roles(id);
      `);
    }

    console.log('4. Linking existing users to owner role...');
    // Link keem@crestzendo.com or any user with Owner/Admin to 'owner'
    const ownerRoleRes = await client.query(`SELECT id FROM roles WHERE name = 'owner' LIMIT 1;`);
    const ownerRoleId = ownerRoleRes.rows[0].id;

    await client.query(`
      UPDATE users 
      SET role_id = $1, role = 'owner', updated_at = now()
      WHERE role_id IS NULL;
    `, [ownerRoleId]);

    // Enforce NOT NULL constraint on role_id
    await client.query(`
      ALTER TABLE users ALTER COLUMN role_id SET NOT NULL;
    `);

    await client.query('COMMIT');
    console.log('--- Phase 1 Migration Successful! ---');

    // Verification
    const rolesRes = await client.query('SELECT id, name, display_name_th, hierarchy_level, pg_typeof(id) as id_type FROM roles ORDER BY hierarchy_level ASC;');
    console.table(rolesRes.rows);

    const usersRes = await client.query(`
      SELECT u.id, u.full_name, u.email, r.name as role_name, r.display_name_th as role_th, u.role_id, pg_typeof(u.role_id) as role_id_type
      FROM users u
      JOIN roles r ON u.role_id = r.id;
    `);
    console.table(usersRes.rows);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateRoles().catch(console.error);
