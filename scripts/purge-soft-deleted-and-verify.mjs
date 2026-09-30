import { query } from "../lib/db/adapters/postgres/pool.js";
import {
  postgresDocumentsRepo,
  postgresCustomTemplatesRepo,
} from "../lib/db/adapters/postgres/index.js";

async function purgeAndVerify() {
  console.log("=================================================================");
  console.log("🧹 Purging Soft-Deleted Documents & Verifying 100% Delete & Filter");
  console.log("=================================================================\n");

  // 1. Check lingering soft-deleted documents
  const preCheck = await query(`SELECT id, name, deleted_at FROM documents WHERE deleted_at IS NOT NULL;`);
  console.log(`Found ${preCheck.rows.length} lingering soft-deleted document(s):`);
  preCheck.rows.forEach(r => console.log(`  - ID: ${r.id} | Name: "${r.name}" | DeletedAt: ${r.deleted_at}`));

  // Purge soft-deleted documents
  const purgeRes = await query(`DELETE FROM documents WHERE deleted_at IS NOT NULL;`);
  console.log(`\n✅ Purged ${purgeRes.rowCount} soft-deleted document(s) from PostgreSQL!\n`);

  // Verify 0 soft-deleted documents remain
  const postCheck = await query(`SELECT count(*) as count FROM documents WHERE deleted_at IS NOT NULL;`);
  console.log(`Remaining soft-deleted documents in DB: ${postCheck.rows[0].count}`);

  console.log("\n-----------------------------------------------------------------");
  console.log("🧪 1. Testing Document Hard Delete Functionality");
  console.log("-----------------------------------------------------------------");

  // Create a temporary document
  const testDoc = await postgresDocumentsRepo.create({
    orgId: "org-crestzendo",
    templateId: "tmpl-quotation-standard",
    name: "เอกสารทดสอบการลบถาวร (Hard Delete Test)",
    status: "draft",
    values: { testKey: "testValue" },
  });
  console.log(`Created test document: ${testDoc.id} ("${testDoc.name}")`);

  // Verify it exists in DB
  const existsCheck = await query(`SELECT id FROM documents WHERE id = $1;`, [testDoc.id]);
  if (existsCheck.rows.length !== 1) {
    throw new Error("Test document was not found after creation!");
  }
  console.log(`Verified test document exists in DB: ${existsCheck.rows.length} row`);

  // Delete it
  const delRes = await postgresDocumentsRepo.delete(testDoc.id);
  console.log(`Called postgresDocumentsRepo.delete(${testDoc.id}) -> Result:`, delRes);

  // Verify it is TRULY GONE from DB
  const goneCheck = await query(`SELECT id FROM documents WHERE id = $1;`, [testDoc.id]);
  if (goneCheck.rows.length !== 0) {
    throw new Error(`Test document STILL EXISTS in PostgreSQL! Expected 0 rows, got ${goneCheck.rows.length}`);
  }
  console.log(`✅ VERIFIED: Test document is 100% GONE from PostgreSQL (0 rows found)!`);

  console.log("\n-----------------------------------------------------------------");
  console.log("🧪 2. Testing Category-based Template Filtering in PostgreSQL");
  console.log("-----------------------------------------------------------------");

  const categoriesToTest = [
    { cat: "quotation", expectedId: "tmpl-quotation-standard" },
    { cat: "nda", expectedId: "tmpl-nda-standard" },
    { cat: "partner", expectedId: "tmpl-partner-standard" },
    { cat: "distributor", expectedId: "tmpl-distributor-standard" },
    { cat: "company-announcement", expectedPrefix: "tmpl-1789" },
  ];

  for (const { cat, expectedId, expectedPrefix } of categoriesToTest) {
    const tmpls = await postgresCustomTemplatesRepo.getAll({ categoryId: cat });
    console.log(`\nCategory: [${cat}] -> Found ${tmpls.length} template(s):`);

    tmpls.forEach(t => {
      console.log(`  - [${t.categoryId}] ${t.id} ("${t.name}")`);
      if (t.categoryId.toLowerCase() !== cat.toLowerCase()) {
        throw new Error(`LEAK DETECTED: Template ${t.id} has category ${t.categoryId}, expected ${cat}!`);
      }
    });

    if (expectedId && !tmpls.some(t => t.id === expectedId)) {
      throw new Error(`Expected template ${expectedId} not found in category ${cat}!`);
    }

    if (expectedPrefix && !tmpls.some(t => t.id.startsWith(expectedPrefix))) {
      throw new Error(`Expected template with prefix ${expectedPrefix} not found in category ${cat}!`);
    }

    console.log(`  ✅ Passed: All templates strictly belong to category [${cat}]`);
  }

  console.log("\n=================================================================");
  console.log("🎉 All Verifications Passed Successfully with 0 Errors!");
  console.log("=================================================================\n");

  process.exit(0);
}

purgeAndVerify().catch((err) => {
  console.error("❌ Verification Failed:", err);
  process.exit(1);
});
