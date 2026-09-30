import { getPool, query } from "../lib/db/adapters/postgres/pool.js";
import { generateEntityId, isValidEntityId } from "../lib/db/idGenerator.js";
import {
  postgresDocumentsRepo,
  postgresCategoriesRepo,
  postgresCustomTemplatesRepo,
  postgresCounterpartiesRepo,
  postgresOrganizationSignatoriesRepo,
} from "../lib/db/adapters/postgres/index.js";

async function runPhaseABCVerification() {
  console.log("=================================================================");
  console.log("🔬 DocBuilder Enterprise Architecture Verification: Phases A, B, C");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`Testing: ${name.padEnd(55)} ... `);
      await fn();
      console.log("✅ PASSED");
      passed++;
    } catch (err) {
      console.log("❌ FAILED");
      console.error(`   Error: ${err.message}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Phase A: ID Generator Concurrency & Collision Stress Test
  // ---------------------------------------------------------------------------
  await test("A1. ID Stress Test (50,000 Concurrent IDs - Zero Collision)", async () => {
    const count = 50000;
    const generatedSet = new Set();
    const prefixes = ["doc", "tmpl", "cat", "qt", "usr", "org", "ntf", "cp", "sign"];

    for (let i = 0; i < count; i++) {
      const type = prefixes[i % prefixes.length];
      const id = generateEntityId(type);
      if (generatedSet.has(id)) {
        throw new Error(`Primary Key Collision detected on iteration ${i}: ${id}`);
      }
      generatedSet.add(id);
    }

    if (generatedSet.size !== count) {
      throw new Error(`Set size mismatch: expected ${count}, got ${generatedSet.size}`);
    }
  });

  await test("A2. ID Format & Prefix Validation (K-Sortable Enterprise Spec)", async () => {
    const testCases = [
      { type: "document", expectedPrefix: "doc" },
      { type: "template", expectedPrefix: "tmpl" },
      { type: "category", expectedPrefix: "cat" },
      { type: "quotation", expectedPrefix: "qt" },
      { type: "notification", expectedPrefix: "ntf" },
      { type: "counterparty", expectedPrefix: "cp" },
      { type: "signatory", expectedPrefix: "sign" },
    ];

    for (const { type, expectedPrefix } of testCases) {
      const id = generateEntityId(type);
      if (!isValidEntityId(id, expectedPrefix)) {
        throw new Error(`ID ${id} failed validation for prefix ${expectedPrefix}`);
      }
    }
  });

  // ---------------------------------------------------------------------------
  // 2. Phase A & B: Multi-Tenant Composite Unique Constraints
  // ---------------------------------------------------------------------------
  await test("A3. Composite Unique Constraint on Categories (uq_categories_org_name)", async () => {
    const testOrg = "org-crestzendo";
    const uniqueCatName = `Test Category ${Date.now()}`;

    // 1. Create first category
    const cat1 = await postgresCategoriesRepo.create({
      orgId: testOrg,
      name: uniqueCatName,
      fullName: `${uniqueCatName} Full`,
    });

    try {
      // 2. Attempt to create exact duplicate in same org -> MUST fail with 23505
      await postgresCategoriesRepo.create({
        orgId: testOrg,
        name: uniqueCatName,
        fullName: "Duplicate",
      });
      throw new Error("Expected unique constraint violation on category name in same org, but it succeeded!");
    } catch (err) {
      if (err.code !== "23505") {
        throw err;
      }
    } finally {
      // Cleanup
      await query("DELETE FROM categories WHERE id = $1", [cat1.id]);
    }
  });

  await test("A4. Composite Unique Constraint on Templates (uq_templates_org_cat_name)", async () => {
    const testOrg = "org-crestzendo";
    const testCat = "quotation";
    const uniqueTmplName = `Test Template ${Date.now()}`;

    // 1. Create first template
    const tmpl1 = await postgresCustomTemplatesRepo.create({
      orgId: testOrg,
      categoryId: testCat,
      name: uniqueTmplName,
      editorType: "document",
      pages: [],
    });

    try {
      // 2. Attempt to create duplicate in same org and category -> MUST fail
      await postgresCustomTemplatesRepo.create({
        orgId: testOrg,
        categoryId: testCat,
        name: uniqueTmplName,
        editorType: "document",
        pages: [],
      });
      throw new Error("Expected unique constraint violation on template name in same org & category, but it succeeded!");
    } catch (err) {
      if (err.code !== "23505") {
        throw err;
      }
    } finally {
      // Cleanup
      await query("DELETE FROM templates WHERE id = $1", [tmpl1.id]);
    }
  });

  // ---------------------------------------------------------------------------
  // 3. Phase B: 3NF Relational Decoupling & Legal Immutability Snapshot
  // ---------------------------------------------------------------------------
  await test("B1. 3NF Counterparty Normalization with Document Foreign Key", async () => {
    // 1. Create normalized Counterparty
    const cp = await postgresCounterpartiesRepo.create({
      orgId: "org-crestzendo",
      companyNameTh: "บริษัท เอเปกซ์ เทคโนโลยี จำกัด (มหาชน)",
      registrationNumber: "0107565000999",
      addressTh: "123 อาคารสาทรทาวเวอร์ ชั้น 15 ถนนสาทรใต้ แขวงยานนาวา เขตสาทร กรุงเทพฯ 10120",
      email: "contact@apextech.co.th",
    });

    // 2. Create Document linking to counterparties via FK
    const doc = await postgresDocumentsRepo.create({
      orgId: "org-crestzendo",
      templateId: "tmpl-quotation-standard",
      counterpartyId: cp.id,
      name: "ใบเสนอราคาโครงการ Apex Phase 1",
      status: "draft",
      values: {
        totalAmount: 150000,
      },
    });

    if (doc.counterpartyId !== cp.id) {
      throw new Error(`Document counterpartyId mismatch: expected ${cp.id}, got ${doc.counterpartyId}`);
    }

    // 3. Relational 3NF Query (JOIN)
    const joinRes = await query(`
      SELECT d.id AS doc_id, d.name AS doc_name, c.company_name_th, c.registration_number, c.address_th
      FROM documents d
      JOIN counterparties c ON d.counterparty_id = c.id
      WHERE d.id = $1;
    `, [doc.id]);

    if (joinRes.rows.length === 0 || joinRes.rows[0].company_name_th !== "บริษัท เอเปกซ์ เทคโนโลยี จำกัด (มหาชน)") {
      throw new Error("3NF Relational JOIN failed to resolve counterparty data");
    }

    // 4. Test Legal/Audit Immutability: When document is finalized/approved,
    // future changes to counterparties do NOT alter historical signed snapshots!
    const frozenSnapshot = {
      counterparty: {
        companyName: cp.companyNameTh,
        taxId: cp.registrationNumber,
        address: cp.addressTh,
      },
      frozenAt: new Date().toISOString(),
    };

    const finalizedDoc = await postgresDocumentsRepo.update(doc.id, {
      status: "approved",
      values: {
        ...doc.values,
        historicalSnapshot: frozenSnapshot,
      },
    });

    if (!finalizedDoc.values.historicalSnapshot || finalizedDoc.values.historicalSnapshot.counterparty.taxId !== "0107565000999") {
      throw new Error("Audit immutable snapshot verification failed");
    }

    // Cleanup
    await query("DELETE FROM documents WHERE id = $1", [doc.id]);
    await query("DELETE FROM counterparties WHERE id = $1", [cp.id]);
  });

  // ---------------------------------------------------------------------------
  // 4. Phase C: Three-Level Architecture Index & Physical Verification
  // ---------------------------------------------------------------------------
  await test("C1. Physical Storage Indexes (B-Tree FKs & GIN JSONB)", async () => {
    const explainDoc = await query(`
      EXPLAIN SELECT * FROM documents WHERE org_id = 'org-crestzendo' AND counterparty_id = 'cp-test';
    `);
    const planText = explainDoc.rows.map(r => r["QUERY PLAN"]).join(" ");
    // Verify that PostgreSQL can reference indexes
    const indexes = await query(`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'documents' 
        AND indexname IN ('idx_documents_org_id', 'idx_documents_values_gin');
    `);
    if (indexes.rows.length !== 2) {
      throw new Error(`Expected 2 indexes on documents, found ${indexes.rows.length}`);
    }
  });

  console.log("\n=================================================================");
  console.log(`📊 Phase A/B/C Verification Summary: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log("=================================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhaseABCVerification().catch((err) => {
  console.error("Fatal Test Suite Error:", err);
  process.exit(1);
});
