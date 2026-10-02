import pg from 'pg';
import crypto from 'crypto';

const pool = new pg.Pool({ connectionString: 'postgres://wawa:S0lut!0n@192.168.3.164:5432/docbuilder?sslmode=disable' });

function generateUUIDv7() {
  const timestampMs = Date.now();
  const bytes = crypto.randomBytes(16);
  bytes.writeUIntBE(Math.floor(timestampMs / 0x100000000), 0, 2);
  bytes.writeUIntBE(timestampMs % 0x100000000, 2, 4);
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return [
    bytes.toString('hex', 0, 4),
    bytes.toString('hex', 4, 6),
    bytes.toString('hex', 6, 8),
    bytes.toString('hex', 8, 10),
    bytes.toString('hex', 10, 16)
  ].join('-');
}

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('=== STEP 1: MIGRATING LOOKUP TABLES (document_types, page_presets, document_object_types) TO UUIDv7 ===');

    // 1. Drop view and existing FKs pointing to page_presets, document_types, document_object_types
    console.log('Dropping view and FK constraints...');
    await client.query('DROP VIEW IF EXISTS v_document_masters CASCADE;');
    await client.query('ALTER TABLE document_masters DROP CONSTRAINT IF EXISTS document_masters_document_type_id_fkey CASCADE;');
    await client.query('ALTER TABLE document_types DROP CONSTRAINT IF EXISTS document_types_default_preset_id_fkey CASCADE;');
    await client.query('ALTER TABLE document_object_styles DROP CONSTRAINT IF EXISTS document_object_styles_preset_id_fkey CASCADE;');
    await client.query('ALTER TABLE document_object_values DROP CONSTRAINT IF EXISTS document_object_values_object_type_id_fkey CASCADE;');

    // 2. Migrate page_presets
    console.log('Migrating page_presets...');
    await client.query(`ALTER TABLE page_presets ADD COLUMN IF NOT EXISTS code VARCHAR(50);`);
    await client.query(`UPDATE page_presets SET code = id WHERE code IS NULL;`);
    await client.query(`ALTER TABLE page_presets ADD CONSTRAINT uq_page_presets_code UNIQUE (code);`);

    const presets = await client.query('SELECT id, code FROM page_presets');
    const presetMap = new Map();
    for (const r of presets.rows) {
      const newUuid = generateUUIDv7();
      presetMap.set(r.id, newUuid);
      await client.query(`
        INSERT INTO _id_uuid_map (table_name, old_id, new_uuid)
        VALUES ('page_presets', $1, $2)
        ON CONFLICT (table_name, old_id) DO UPDATE SET new_uuid = EXCLUDED.new_uuid;
      `, [r.id, newUuid]);
    }

    // Update page_presets.id
    for (const [oldId, newUuid] of presetMap.entries()) {
      await client.query(`UPDATE page_presets SET id = $1 WHERE code = $2;`, [newUuid, oldId]);
      await client.query(`UPDATE document_types SET default_preset_id = $1 WHERE default_preset_id = $2;`, [newUuid, oldId]);
      await client.query(`UPDATE document_object_styles SET preset_id = $1 WHERE preset_id = $2;`, [newUuid, oldId]);
    }
    await client.query(`ALTER TABLE page_presets ALTER COLUMN id TYPE UUID USING id::uuid;`);
    await client.query(`ALTER TABLE document_types ALTER COLUMN default_preset_id TYPE UUID USING default_preset_id::uuid;`);
    await client.query(`ALTER TABLE document_object_styles ALTER COLUMN preset_id TYPE UUID USING preset_id::uuid;`);
    console.log(`page_presets migrated to UUID.`);

    // 3. Migrate document_types
    console.log('Migrating document_types...');
    await client.query(`ALTER TABLE document_types ADD COLUMN IF NOT EXISTS code VARCHAR(50);`);
    await client.query(`UPDATE document_types SET code = id WHERE code IS NULL;`);
    await client.query(`ALTER TABLE document_types ADD CONSTRAINT uq_document_types_code UNIQUE (code);`);

    const docTypes = await client.query('SELECT id, code FROM document_types');
    const docTypeMap = new Map();
    for (const r of docTypes.rows) {
      const newUuid = generateUUIDv7();
      docTypeMap.set(r.id, newUuid);
      await client.query(`
        INSERT INTO _id_uuid_map (table_name, old_id, new_uuid)
        VALUES ('document_types', $1, $2)
        ON CONFLICT (table_name, old_id) DO UPDATE SET new_uuid = EXCLUDED.new_uuid;
      `, [r.id, newUuid]);
    }

    for (const [oldId, newUuid] of docTypeMap.entries()) {
      await client.query(`UPDATE document_types SET id = $1 WHERE code = $2;`, [newUuid, oldId]);
      await client.query(`UPDATE document_masters SET document_type_id = $1 WHERE document_type_id = $2;`, [newUuid, oldId]);
    }
    await client.query(`ALTER TABLE document_types ALTER COLUMN id TYPE UUID USING id::uuid;`);
    await client.query(`ALTER TABLE document_masters ALTER COLUMN document_type_id TYPE UUID USING document_type_id::uuid;`);
    console.log(`document_types migrated to UUID.`);

    // 4. Migrate document_object_types
    console.log('Migrating document_object_types...');
    await client.query(`ALTER TABLE document_object_types ADD COLUMN IF NOT EXISTS code VARCHAR(50);`);
    await client.query(`UPDATE document_object_types SET code = id WHERE code IS NULL;`);
    await client.query(`ALTER TABLE document_object_types ADD CONSTRAINT uq_document_object_types_code UNIQUE (code);`);

    const objTypes = await client.query('SELECT id, code FROM document_object_types');
    const objTypeMap = new Map();
    for (const r of objTypes.rows) {
      const newUuid = generateUUIDv7();
      objTypeMap.set(r.id, newUuid);
      await client.query(`
        INSERT INTO _id_uuid_map (table_name, old_id, new_uuid)
        VALUES ('document_object_types', $1, $2)
        ON CONFLICT (table_name, old_id) DO UPDATE SET new_uuid = EXCLUDED.new_uuid;
      `, [r.id, newUuid]);
    }

    for (const [oldId, newUuid] of objTypeMap.entries()) {
      await client.query(`UPDATE document_object_types SET id = $1 WHERE code = $2;`, [newUuid, oldId]);
      await client.query(`UPDATE document_object_values SET object_type_id = $1 WHERE object_type_id = $2;`, [newUuid, oldId]);
    }
    await client.query(`ALTER TABLE document_object_types ALTER COLUMN id TYPE UUID USING id::uuid;`);
    await client.query(`ALTER TABLE document_object_values ALTER COLUMN object_type_id TYPE UUID USING object_type_id::uuid;`);
    console.log(`document_object_types migrated to UUID.`);

    // 5. Re-create Foreign Keys with UUID
    console.log('Re-creating FK constraints...');
    await client.query(`
      ALTER TABLE document_masters 
      ADD CONSTRAINT document_masters_document_type_id_fkey 
      FOREIGN KEY (document_type_id) REFERENCES document_types(id) ON DELETE SET NULL;
    `);

    await client.query(`
      ALTER TABLE document_types 
      ADD CONSTRAINT document_types_default_preset_id_fkey 
      FOREIGN KEY (default_preset_id) REFERENCES page_presets(id) ON DELETE SET NULL;
    `);

    await client.query(`
      ALTER TABLE document_object_styles 
      ADD CONSTRAINT document_object_styles_preset_id_fkey 
      FOREIGN KEY (preset_id) REFERENCES page_presets(id) ON DELETE SET NULL;
    `);

    await client.query(`
      ALTER TABLE document_object_values 
      ADD CONSTRAINT document_object_values_object_type_id_fkey 
      FOREIGN KEY (object_type_id) REFERENCES document_object_types(id) ON DELETE SET NULL;
    `);

    // 6. Update view v_document_masters
    await client.query(`
      CREATE OR REPLACE VIEW v_document_masters AS
      SELECT 
        m.id,
        m.doc_type,
        m.format_type,
        m.document_type_id,
        dt.code AS document_type_code,
        dt.name AS document_type_name,
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
      LEFT JOIN document_types dt ON m.document_type_id = dt.id
      LEFT JOIN users u ON m.created_by_user_id = u.id
      LEFT JOIN organizations o ON m.org_id = o.id
      LEFT JOIN categories c ON m.category_id = c.id;
    `);

    await client.query('COMMIT');
    console.log('🎉 ALL LOOKUP TABLES (document_types, page_presets, document_object_types) SUCCESSFULLY CONVERTED TO UUIDv7 PKs!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ MIGRATION FAILED:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
