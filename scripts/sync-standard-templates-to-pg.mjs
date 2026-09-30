import { getPool, query } from "../lib/db/adapters/postgres/pool.js";
import { synthesizeCanvasPagesFromTemplate } from "../lib/templates/blockToCanvas.js";

async function syncStandardTemplatesToPostgres() {
  console.log("=================================================================");
  console.log("🚀 Syncing High-Fidelity 1:1 Canvas Templates into PostgreSQL");
  console.log("=================================================================\n");

  const targetIds = [
    "tmpl-quotation-standard",
    "tmpl-nda-standard",
    "tmpl-partner-standard",
    "tmpl-distributor-standard",
    "tmpl-notification-standard",
    "notification",
  ];

  try {
    for (const tId of targetIds) {
      process.stdout.write(`Processing [${tId}] ... `);
      const res = await query("SELECT id, category_id, name FROM templates WHERE id = $1", [tId]);
      if (res.rows.length === 0) {
        console.log("⚠️ Not found in DB, skipping");
        continue;
      }

      const row = res.rows[0];
      const templateObj = {
        id: row.id,
        categoryId: row.category_id,
        name: row.name,
        blocks: row.blocks,
      };

      const highFidelityPages = synthesizeCanvasPagesFromTemplate(templateObj, { force: true });
      const pageCount = highFidelityPages.length;
      const pagesJson = JSON.stringify(highFidelityPages);

      // 1. Update templates table
      await query(
        `UPDATE templates 
         SET pages = $1::jsonb, 
             updated_at = NOW() 
         WHERE id = $2`,
        [pagesJson, tId]
      );

      // 2. Update active template_version if exists
      await query(
        `UPDATE template_versions 
         SET pages = $1::jsonb 
         WHERE template_id = $2`,
        [pagesJson, tId]
      );

      console.log(`✅ Synced! Pages: ${pageCount}, Size: ${Math.round(pagesJson.length / 1024)} KB`);
    }

    console.log("\n=================================================================");
    console.log("🎉 All Standard Templates have been updated in PostgreSQL 100%!");
    console.log("=================================================================");
  } catch (err) {
    console.error("❌ Sync Error:", err);
    process.exit(1);
  } finally {
    const pool = getPool();
    await pool.end();
  }
}

syncStandardTemplatesToPostgres();
