import pg from 'pg';
import crypto from 'crypto';

const pool = new pg.Pool({ connectionString: 'postgres://wawa:S0lut!0n@192.168.3.164:5432/docbuilder?sslmode=disable' });

// Function to generate RFC 9562 compliant UUIDv7 with given or current timestamp
function generateUUIDv7(date = new Date()) {
  const timestampMs = date instanceof Date ? date.getTime() : (typeof date === 'number' ? date : Date.now());
  const bytes = crypto.randomBytes(16);

  // 48-bit timestamp in milliseconds
  bytes.writeUIntBE(Math.floor(timestampMs / 0x100000000), 0, 2);
  bytes.writeUIntBE(timestampMs % 0x100000000, 2, 4);

  // version 7 (0111 in high 4 bits of byte 6)
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  // variant RFC 4122 / 9562 (10xx in high 2 bits of byte 8)
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  return [
    bytes.toString('hex', 0, 4),
    bytes.toString('hex', 4, 6),
    bytes.toString('hex', 6, 8),
    bytes.toString('hex', 8, 10),
    bytes.toString('hex', 10, 16)
  ].join('-');
}

// Extract timestamp from IDs like 'doc-1789612983098' or fallback to createdAt
function extractTimestamp(id, createdAt) {
  const match = (id || '').match(/\b(\d{13})\b/);
  if (match) {
    const ts = parseInt(match[1], 10);
    if (!isNaN(ts) && ts > 1600000000000 && ts < 2500000000000) {
      return ts;
    }
  }
  if (createdAt) {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) return d.getTime();
  }
  return Date.now();
}

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('=== STEP 1: INITIALIZING UUIDv7 MAPPING TABLE ===');

    await client.query(`
      CREATE TABLE IF NOT EXISTS _id_uuid_map (
        table_name VARCHAR(64) NOT NULL,
        old_id VARCHAR(128) NOT NULL,
        new_uuid UUID NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        PRIMARY KEY (table_name, old_id)
      );
    `);

    // Helper to insert or get mapping
    const idMap = new Map(); // key: `${table}:${oldId}` -> newUuid
    async function getOrCreateUUID(tableName, oldId, createdAt = null) {
      if (!oldId) return null;
      const key = `${tableName}:${oldId}`;
      if (idMap.has(key)) return idMap.get(key);

      // Check if oldId is ALREADY a valid UUID
      const isAlreadyUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(oldId);
      let newUuid;
      if (isAlreadyUUID) {
        newUuid = oldId.toLowerCase();
      } else {
        const ts = extractTimestamp(oldId, createdAt);
        newUuid = generateUUIDv7(ts);
      }

      await client.query(`
        INSERT INTO _id_uuid_map (table_name, old_id, new_uuid)
        VALUES ($1, $2, $3)
        ON CONFLICT (table_name, old_id) DO NOTHING;
      `, [tableName, oldId, newUuid]);

      // Read back in case it already existed
      const res = await client.query(`SELECT new_uuid FROM _id_uuid_map WHERE table_name = $1 AND old_id = $2`, [tableName, oldId]);
      const finalUuid = res.rows[0].new_uuid;
      idMap.set(key, finalUuid);
      return finalUuid;
    }

    console.log('=== STEP 2: GENERATING UUIDv7 FOR ALL ENTITIES ===');

    // 1. Organizations
    const orgs = await client.query('SELECT id, created_at FROM organizations');
    for (const r of orgs.rows) {
      await getOrCreateUUID('organizations', r.id, r.created_at);
    }
    console.log(`Mapped ${orgs.rows.length} organizations`);

    // 2. Users
    const users = await client.query('SELECT id, created_at FROM users');
    for (const r of users.rows) {
      await getOrCreateUUID('users', r.id, r.created_at);
    }
    console.log(`Mapped ${users.rows.length} users`);

    // 3. Categories
    const categories = await client.query('SELECT id, created_at FROM categories');
    for (const r of categories.rows) {
      await getOrCreateUUID('categories', r.id, r.created_at);
    }
    console.log(`Mapped ${categories.rows.length} categories`);

    // 4. Counterparties & Signatories
    const counterparties = await client.query('SELECT id, created_at FROM counterparties');
    for (const r of counterparties.rows) {
      await getOrCreateUUID('counterparties', r.id, r.created_at);
    }
    const cpSignatories = await client.query('SELECT id, created_at FROM counterparty_signatories');
    for (const r of cpSignatories.rows) {
      await getOrCreateUUID('counterparty_signatories', r.id, r.created_at);
    }
    const orgSignatories = await client.query('SELECT id, created_at FROM organization_signatories');
    for (const r of orgSignatories.rows) {
      await getOrCreateUUID('organization_signatories', r.id, r.created_at);
    }

    // 5. Templates
    const templates = await client.query('SELECT id, created_at FROM templates');
    for (const r of templates.rows) {
      const uuid = await getOrCreateUUID('templates', r.id, r.created_at);
      // document_masters also uses this UUID for templates
      idMap.set(`document_masters:${r.id}`, uuid);
      await client.query(`
        INSERT INTO _id_uuid_map (table_name, old_id, new_uuid)
        VALUES ('document_masters', $1, $2)
        ON CONFLICT DO NOTHING;
      `, [r.id, uuid]);
    }
    console.log(`Mapped ${templates.rows.length} templates`);

    // 6. Documents
    const docs = await client.query('SELECT id, created_at FROM documents');
    for (const r of docs.rows) {
      const uuid = await getOrCreateUUID('documents', r.id, r.created_at);
      // document_masters also uses this UUID for documents
      idMap.set(`document_masters:${r.id}`, uuid);
      await client.query(`
        INSERT INTO _id_uuid_map (table_name, old_id, new_uuid)
        VALUES ('document_masters', $1, $2)
        ON CONFLICT DO NOTHING;
      `, [r.id, uuid]);
    }
    console.log(`Mapped ${docs.rows.length} documents`);

    // 7. Document Sub-tables (styles, values, auths, timelines, approvals)
    const subTables = [
      'document_object_styles',
      'document_object_values',
      'document_authorizations',
      'document_timelines',
      'document_approvals',
      'field_profiles',
      'field_profile_values',
      'notifications',
      'sent_history',
      'settings',
      'assets',
      'custom_tokens'
    ];

    for (const t of subTables) {
      const rows = await client.query(`SELECT id FROM "${t}"`);
      for (const r of rows.rows) {
        await getOrCreateUUID(t, r.id);
      }
      console.log(`Mapped ${rows.rows.length} rows for ${t}`);
    }

    console.log('=== STEP 3: PREPARING COLUMNS FOR TYPE MIGRATION ===');
    // Drop view that depends on columns
    await client.query('DROP VIEW IF EXISTS v_document_masters CASCADE');

    // List of foreign keys to drop and re-add
    const fkDefinitions = [
      { table: 'document_masters', col: 'category_id', ftable: 'categories', fcol: 'id', name: 'document_masters_category_id_fkey' },
      { table: 'templates', col: 'category_id', ftable: 'categories', fcol: 'id', name: 'templates_category_id_fkey' },
      { table: 'counterparty_signatories', col: 'counterparty_id', ftable: 'counterparties', fcol: 'id', name: 'counterparty_signatories_counterparty_id_fkey' },
      { table: 'documents', col: 'counterparty_id', ftable: 'counterparties', fcol: 'id', name: 'documents_counterparty_id_fkey' },
      { table: 'field_profiles', col: 'counterparty_id', ftable: 'counterparties', fcol: 'id', name: 'field_profiles_counterparty_id_fkey' },
      { table: 'document_approvals', col: 'document_id', ftable: 'documents', fcol: 'id', name: 'document_approvals_document_id_fkey' },
      { table: 'sent_history', col: 'document_id', ftable: 'documents', fcol: 'id', name: 'sent_history_document_id_fkey' },
      { table: 'field_profile_values', col: 'profile_id', ftable: 'field_profiles', fcol: 'id', name: 'field_profile_values_profile_id_fkey' },
      { table: 'documents', col: 'our_signatory_id', ftable: 'organization_signatories', fcol: 'id', name: 'documents_our_signatory_id_fkey' },
      { table: 'assets', col: 'org_id', ftable: 'organizations', fcol: 'id', name: 'assets_org_id_fkey' },
      { table: 'categories', col: 'org_id', ftable: 'organizations', fcol: 'id', name: 'categories_org_id_fkey' },
      { table: 'counterparties', col: 'org_id', ftable: 'organizations', fcol: 'id', name: 'counterparties_org_id_fkey' },
      { table: 'counterparties', col: 'linked_org_id', ftable: 'organizations', fcol: 'id', name: 'counterparties_linked_org_id_fkey' },
      { table: 'custom_tokens', col: 'org_id', ftable: 'organizations', fcol: 'id', name: 'custom_tokens_org_id_fkey' },
      { table: 'document_masters', col: 'org_id', ftable: 'organizations', fcol: 'id', name: 'document_masters_org_id_fkey' },
      { table: 'documents', col: 'org_id', ftable: 'organizations', fcol: 'id', name: 'documents_org_id_fkey' },
      { table: 'field_profiles', col: 'org_id', ftable: 'organizations', fcol: 'id', name: 'field_profiles_org_id_fkey' },
      { table: 'organization_signatories', col: 'org_id', ftable: 'organizations', fcol: 'id', name: 'organization_signatories_org_id_fkey' },
      { table: 'settings', col: 'org_id', ftable: 'organizations', fcol: 'id', name: 'settings_org_id_fkey' },
      { table: 'templates', col: 'org_id', ftable: 'organizations', fcol: 'id', name: 'templates_org_id_fkey' },
      { table: 'users', col: 'org_id', ftable: 'organizations', fcol: 'id', name: 'users_org_id_fkey' },
      { table: 'document_masters', col: 'parent_template_id', ftable: 'templates', fcol: 'id', name: 'document_masters_parent_template_id_fkey' },
      { table: 'documents', col: 'template_id', ftable: 'templates', fcol: 'id', name: 'documents_template_id_fkey' },
      { table: 'categories', col: 'created_by_user_id', ftable: 'users', fcol: 'id', name: 'categories_created_by_user_id_fkey' },
      { table: 'counterparties', col: 'created_by_user_id', ftable: 'users', fcol: 'id', name: 'counterparties_created_by_user_id_fkey' },
      { table: 'document_approvals', col: 'approver_user_id', ftable: 'users', fcol: 'id', name: 'document_approvals_approver_user_id_fkey' },
      { table: 'document_masters', col: 'created_by_user_id', ftable: 'users', fcol: 'id', name: 'document_masters_created_by_user_id_fkey' },
      { table: 'documents', col: 'created_by_user_id', ftable: 'users', fcol: 'id', name: 'documents_created_by_user_id_fkey' },
      { table: 'field_profiles', col: 'created_by_user_id', ftable: 'users', fcol: 'id', name: 'field_profiles_created_by_user_id_fkey' },
      { table: 'notifications', col: 'user_id', ftable: 'users', fcol: 'id', name: 'notifications_user_id_fkey' },
      { table: 'templates', col: 'created_by_user_id', ftable: 'users', fcol: 'id', name: 'templates_created_by_user_id_fkey' },
      // Document parent references
      { table: 'document_object_styles', col: 'document_id', ftable: 'document_masters', fcol: 'id', name: 'document_object_styles_document_id_fkey' },
      { table: 'document_object_values', col: 'document_id', ftable: 'document_masters', fcol: 'id', name: 'document_object_values_document_id_fkey' },
      { table: 'document_authorizations', col: 'document_id', ftable: 'document_masters', fcol: 'id', name: 'document_authorizations_document_id_fkey' },
      { table: 'document_timelines', col: 'document_id', ftable: 'document_masters', fcol: 'id', name: 'document_timelines_document_id_fkey' }
    ];

    console.log('Dropping foreign key constraints temporarily...');
    for (const fk of fkDefinitions) {
      await client.query(`ALTER TABLE "${fk.table}" DROP CONSTRAINT IF EXISTS "${fk.name}" CASCADE;`);
    }

    console.log('=== STEP 4: UPDATING PK AND FK VALUES TO UUIDv7 ===');

    // Function to update column values from map
    async function updateColFromMap(targetTable, targetCol, sourceMapTable) {
      await client.query(`
        UPDATE "${targetTable}" t
        SET "${targetCol}" = m.new_uuid::text
        FROM _id_uuid_map m
        WHERE m.table_name = '${sourceMapTable}' AND t."${targetCol}" = m.old_id;
      `);
    }

    // 1. Update Primary Keys
    const entityTables = [
      'organizations', 'users', 'categories', 'counterparties', 'counterparty_signatories',
      'organization_signatories', 'templates', 'documents', 'document_masters',
      'document_object_styles', 'document_object_values', 'document_authorizations',
      'document_timelines', 'document_approvals', 'field_profiles', 'field_profile_values',
      'notifications', 'sent_history', 'settings', 'assets', 'custom_tokens'
    ];

    for (const t of entityTables) {
      await updateColFromMap(t, 'id', t);
    }

    // 2. Update Foreign Keys
    await updateColFromMap('users', 'org_id', 'organizations');
    await updateColFromMap('categories', 'org_id', 'organizations');
    await updateColFromMap('counterparties', 'org_id', 'organizations');
    await updateColFromMap('counterparties', 'linked_org_id', 'organizations');
    await updateColFromMap('counterparties', 'created_by_user_id', 'users');
    await updateColFromMap('counterparty_signatories', 'counterparty_id', 'counterparties');
    await updateColFromMap('organization_signatories', 'org_id', 'organizations');
    await updateColFromMap('templates', 'org_id', 'organizations');
    await updateColFromMap('templates', 'category_id', 'categories');
    await updateColFromMap('templates', 'created_by_user_id', 'users');
    await updateColFromMap('documents', 'org_id', 'organizations');
    await updateColFromMap('documents', 'template_id', 'templates');
    await updateColFromMap('documents', 'counterparty_id', 'counterparties');
    await updateColFromMap('documents', 'our_signatory_id', 'organization_signatories');
    await updateColFromMap('documents', 'created_by_user_id', 'users');
    await updateColFromMap('document_masters', 'org_id', 'organizations');
    await updateColFromMap('document_masters', 'parent_template_id', 'templates');
    await updateColFromMap('document_masters', 'category_id', 'categories');
    await updateColFromMap('document_masters', 'created_by_user_id', 'users');
    await updateColFromMap('document_object_styles', 'document_id', 'document_masters');
    await updateColFromMap('document_object_values', 'document_id', 'document_masters');
    await updateColFromMap('document_authorizations', 'document_id', 'document_masters');
    await updateColFromMap('document_timelines', 'document_id', 'document_masters');
    await updateColFromMap('document_approvals', 'document_id', 'documents');
    await updateColFromMap('document_approvals', 'approver_user_id', 'users');
    await updateColFromMap('sent_history', 'document_id', 'documents');
    await updateColFromMap('notifications', 'user_id', 'users');
    await updateColFromMap('field_profiles', 'org_id', 'organizations');
    await updateColFromMap('field_profiles', 'counterparty_id', 'counterparties');
    await updateColFromMap('field_profiles', 'created_by_user_id', 'users');
    await updateColFromMap('field_profile_values', 'profile_id', 'field_profiles');
    await updateColFromMap('settings', 'org_id', 'organizations');
    await updateColFromMap('assets', 'org_id', 'organizations');
    await updateColFromMap('custom_tokens', 'org_id', 'organizations');

    console.log('=== STEP 5: ALTERING COLUMN DATA TYPES TO NATIVE UUID ===');

    // Alter PK columns
    for (const t of entityTables) {
      console.log(`Altering PK ${t}.id to UUID...`);
      await client.query(`ALTER TABLE "${t}" ALTER COLUMN id TYPE UUID USING id::uuid;`);
    }

    // Alter FK columns to UUID
    const fkColumnsToAlter = [
      { table: 'users', col: 'org_id' },
      { table: 'categories', col: 'org_id' },
      { table: 'categories', col: 'created_by_user_id' },
      { table: 'counterparties', col: 'org_id' },
      { table: 'counterparties', col: 'linked_org_id' },
      { table: 'counterparties', col: 'created_by_user_id' },
      { table: 'counterparty_signatories', col: 'counterparty_id' },
      { table: 'organization_signatories', col: 'org_id' },
      { table: 'templates', col: 'org_id' },
      { table: 'templates', col: 'category_id' },
      { table: 'templates', col: 'created_by_user_id' },
      { table: 'documents', col: 'org_id' },
      { table: 'documents', col: 'template_id' },
      { table: 'documents', col: 'counterparty_id' },
      { table: 'documents', col: 'our_signatory_id' },
      { table: 'documents', col: 'created_by_user_id' },
      { table: 'document_masters', col: 'org_id' },
      { table: 'document_masters', col: 'parent_template_id' },
      { table: 'document_masters', col: 'category_id' },
      { table: 'document_masters', col: 'created_by_user_id' },
      { table: 'document_object_styles', col: 'document_id' },
      { table: 'document_object_values', col: 'document_id' },
      { table: 'document_authorizations', col: 'document_id' },
      { table: 'document_timelines', col: 'document_id' },
      { table: 'document_approvals', col: 'document_id' },
      { table: 'document_approvals', col: 'approver_user_id' },
      { table: 'sent_history', col: 'document_id' },
      { table: 'notifications', col: 'user_id' },
      { table: 'field_profiles', col: 'org_id' },
      { table: 'field_profiles', col: 'counterparty_id' },
      { table: 'field_profiles', col: 'created_by_user_id' },
      { table: 'field_profile_values', col: 'profile_id' },
      { table: 'settings', col: 'org_id' },
      { table: 'assets', col: 'org_id' },
      { table: 'custom_tokens', col: 'org_id' }
    ];

    for (const item of fkColumnsToAlter) {
      console.log(`Altering FK ${item.table}.${item.col} to UUID...`);
      try {
        await client.query(`ALTER TABLE "${item.table}" ALTER COLUMN "${item.col}" DROP DEFAULT;`);
      } catch (e) {}
      await client.query(`ALTER TABLE "${item.table}" ALTER COLUMN "${item.col}" TYPE UUID USING "${item.col}"::uuid;`);
    }

    console.log('=== STEP 6: RE-CREATING FOREIGN KEY CONSTRAINTS WITH UUID ===');
    for (const fk of fkDefinitions) {
      await client.query(`
        ALTER TABLE "${fk.table}" 
        ADD CONSTRAINT "${fk.name}" 
        FOREIGN KEY ("${fk.col}") 
        REFERENCES "${fk.ftable}" ("${fk.fcol}") 
        ON DELETE SET NULL;
      `);
    }

    console.log('=== STEP 7: RE-CREATING CANONICAL VIEW v_document_masters ===');
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

    await client.query('COMMIT');
    console.log('🎉 ALL PRIMARY KEYS AND FOREIGN KEYS CONVERTED TO UUIDv7 NATIVELY!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ MIGRATION FAILED, ROLLED BACK:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
