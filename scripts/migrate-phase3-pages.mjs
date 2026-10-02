import pg from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new pg.Pool({ connectionString: 'postgres://wawa:S0lut!0n@192.168.3.164:5432/docbuilder?sslmode=disable' });

function generateUUIDv7() {
  const now = Date.now();
  const timeHex = now.toString(16).padStart(12, '0');
  const rand1 = Math.floor(Math.random() * 0x1000).toString(16).padStart(3, '0');
  const rand2 = Math.floor(Math.random() * 0x4000 + 0x8000).toString(16).padStart(4, '0');
  const rand3 = Math.floor(Math.random() * 0x1000000000000).toString(16).padStart(12, '0');
  return `${timeHex.slice(0, 8)}-${timeHex.slice(8, 12)}-7${rand1}-${rand2}-${rand3}`;
}

async function runPhase3Migration() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('1. Executing migration 000015 schema changes...');
    const sqlPath = path.resolve('../docbuilder-backend/migrations/000015_enhance_document_types_and_add_pages.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sqlContent);
    console.log('✓ Migration 000015 executed successfully.');

    console.log('2. Backfilling template_pages from templates.pages...');
    const tmplsRes = await client.query(`SELECT id, name, pages, margin, canvas_preset, orientation FROM templates WHERE deleted_at IS NULL;`);
    let tmplPageCount = 0;

    for (const t of tmplsRes.rows) {
      let pages = [];
      try {
        pages = typeof t.pages === 'string' ? JSON.parse(t.pages) : (t.pages || []);
      } catch {
        pages = [];
      }

      if (!Array.isArray(pages) || pages.length === 0) {
        // Create default page 1
        const pageId = generateUUIDv7();
        await client.query(`
          INSERT INTO template_pages (id, template_id, page_number, page_name, styles, canvas_json, sort_order)
          VALUES ($1, $2, 1, 'หน้า 1', $3::jsonb, '{}'::jsonb, 0)
          ON CONFLICT (template_id, page_number) DO NOTHING;
        `, [
          pageId,
          t.id,
          JSON.stringify({
            preset: t.canvas_preset || 'a4-portrait',
            orientation: t.orientation || 'portrait',
            margin: t.margin || {}
          })
        ]);
        tmplPageCount++;
      } else {
        for (let i = 0; i < pages.length; i++) {
          const p = pages[i] || {};
          const pageId = generateUUIDv7();
          const pageNum = i + 1;
          const pageName = p.name || p.title || `หน้า ${pageNum}`;
          const styles = {
            preset: t.canvas_preset || 'a4-portrait',
            orientation: t.orientation || 'portrait',
            margin: t.margin || {},
            ...(p.styles || {})
          };
          const canvasJson = p.canvas || p.canvas_json || p.objects ? p : {};

          await client.query(`
            INSERT INTO template_pages (id, template_id, page_number, page_name, styles, canvas_json, sort_order)
            VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)
            ON CONFLICT (template_id, page_number) DO UPDATE SET
              page_name = EXCLUDED.page_name,
              styles = EXCLUDED.styles,
              canvas_json = EXCLUDED.canvas_json,
              updated_at = now();
          `, [
            pageId,
            t.id,
            pageNum,
            pageName,
            JSON.stringify(styles),
            JSON.stringify(canvasJson),
            i
          ]);
          tmplPageCount++;
        }
      }
    }
    console.log(`✓ Backfilled ${tmplPageCount} template pages.`);

    console.log('3. Backfilling document_pages from documents...');
    const docsRes = await client.query(`SELECT id, name, values FROM documents WHERE deleted_at IS NULL;`);
    let docPageCount = 0;

    for (const d of docsRes.rows) {
      let vals = {};
      try {
        vals = typeof d.values === 'string' ? JSON.parse(d.values) : (d.values || {});
      } catch {
        vals = {};
      }

      const pageId = generateUUIDv7();
      await client.query(`
        INSERT INTO document_pages (id, document_id, page_number, page_name, styles, values, sort_order)
        VALUES ($1, $2, 1, 'หน้า 1', $3::jsonb, $4::jsonb, 0)
        ON CONFLICT (document_id, page_number) DO UPDATE SET
          values = EXCLUDED.values,
          updated_at = now();
      `, [
        pageId,
        d.id,
        JSON.stringify({ preset: 'a4-portrait', orientation: 'portrait' }),
        JSON.stringify(vals)
      ]);
      docPageCount++;
    }
    console.log(`✓ Backfilled ${docPageCount} document pages.`);

    await client.query('COMMIT');
    console.log('--- Phase 3 Pages Migration Successful! ---');

    // Verification
    console.log('\n=== Enhanced document_types ===');
    const dtRes = await client.query(`SELECT code, name, thai_name, layout_engine, default_width, default_height, unit, supported_exports FROM document_types ORDER BY code;`);
    console.table(dtRes.rows);

    console.log('\n=== Sample template_pages ===');
    const tpRes = await client.query(`
      SELECT tp.id, t.name as template_name, tp.page_number, tp.page_name, pg_typeof(tp.id) as id_type
      FROM template_pages tp
      JOIN templates t ON tp.template_id = t.id
      LIMIT 5;
    `);
    console.table(tpRes.rows);

    console.log('\n=== Sample document_pages ===');
    const dpRes = await client.query(`
      SELECT dp.id, d.name as document_name, dp.page_number, dp.page_name, pg_typeof(dp.id) as id_type
      FROM document_pages dp
      JOIN documents d ON dp.document_id = d.id
      LIMIT 5;
    `);
    console.table(dpRes.rows);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Phase 3 Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runPhase3Migration().catch(console.error);
