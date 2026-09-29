import { getPool, query } from "../lib/db/adapters/postgres/pool.js";
import {
  postgresDocumentsRepo,
  postgresQuotationsRepo,
  postgresCustomTemplatesRepo,
  postgresCategoriesRepo,
  postgresSettingsRepo,
  postgresCustomTokensRepo,
  postgresNotificationsRepo,
  postgresSentHistoryRepo,
  postgresFieldProfilesRepo,
  postgresOrganizationsRepo,
  postgresUsersRepo,
} from "../lib/db/adapters/postgres/index.js";
import { getNextAtomicDocumentNo } from "../lib/db/adapters/postgres/counters.js";

async function runTestSuite() {
  console.log("=================================================================");
  console.log("🧪 PostgreSQL Adapter Integration & CRUD Test Suite (Phase 2)");
  console.log("=================================================================\n");

  const pool = getPool();
  try {
    const pingRes = await query("SELECT current_database(), current_user, version();");
    const { current_database, current_user } = pingRes.rows[0];
    console.log(`✅ Connected successfully to PostgreSQL DB: [${current_database}] as User: [${current_user}]\n`);
  } catch (err) {
    console.error("❌ Failed to connect to PostgreSQL:", err.message);
    console.log("\n⚠️ Hint: If running from outside the private network (192.168.3.164), please ensure VPN or LAN is connected.");
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`Testing: ${name.padEnd(45)} ... `);
      await fn();
      console.log("✅ PASSED");
      passed++;
    } catch (err) {
      console.log("❌ FAILED");
      console.error(`   Error: ${err.message}`);
      failed++;
    }
  }

  // 1. Atomic Counter Test
  await test("1. Atomic Document Counter", async () => {
    const num1 = await getNextAtomicDocumentNo("CZ");
    if (!num1.startsWith("CZ") || num1.length !== 10) {
      throw new Error(`Invalid counter format: ${num1}`);
    }
    const num2 = await getNextAtomicDocumentNo("CZ");
    if (num2 === num1) {
      throw new Error(`Counter did not increment: ${num1} vs ${num2}`);
    }
  });

  // 2. Categories Repo Read Test
  await test("2. Categories Repository (getAll)", async () => {
    const cats = await postgresCategoriesRepo.getAll();
    if (!Array.isArray(cats)) throw new Error("Expected array of categories");
  });

  // 3. Custom Templates Repo Read Test
  await test("3. Custom Templates Repository (getAll)", async () => {
    const tmpls = await postgresCustomTemplatesRepo.getAll();
    if (!Array.isArray(tmpls)) throw new Error("Expected array of templates");
  });

  // 4. Documents Repo Read Test
  await test("4. Documents Repository (getAll)", async () => {
    const docs = await postgresDocumentsRepo.getAll();
    if (!Array.isArray(docs)) throw new Error("Expected array of documents");
  });

  // 5. Settings Repo Read Test
  await test("5. Settings Repository (get)", async () => {
    const settings = await postgresSettingsRepo.get();
    if (typeof settings !== "object" || settings === null) {
      throw new Error("Expected settings map object");
    }
  });

  // 6. Custom Tokens Repo Read Test
  await test("6. Custom Tokens Repository (getAll)", async () => {
    const tokens = await postgresCustomTokensRepo.getAll();
    if (!Array.isArray(tokens)) throw new Error("Expected array of tokens");
  });

  // 7. Notifications Repo Read Test
  await test("7. Notifications Repository (getAll & count)", async () => {
    const notifs = await postgresNotificationsRepo.getAll();
    const count = await postgresNotificationsRepo.getUnreadCount();
    if (!Array.isArray(notifs) || typeof count !== "number") {
      throw new Error("Invalid notifications response");
    }
  });

  // 8. Sent History Repo Read Test
  await test("8. Sent History Repository (getAll)", async () => {
    const history = await postgresSentHistoryRepo.getAll();
    if (!Array.isArray(history)) throw new Error("Expected array of sent history");
  });

  // 9. Field Profiles Repo Read Test
  await test("9. Field Profiles Repository (getAll)", async () => {
    const profiles = await postgresFieldProfilesRepo.getAll();
    if (!Array.isArray(profiles)) throw new Error("Expected array of field profiles");
  });

  // 10. Organizations & Users Read Test
  await test("10. Organizations & Users (getPrimary)", async () => {
    const org = await postgresOrganizationsRepo.getPrimary();
    const user = await postgresUsersRepo.getPrimary();
    if (!org || !user) throw new Error("Primary organization or user not found");
  });

  // 11. Optimistic Locking Test (Create, Update with correct version, Update with wrong version)
  await test("11. Optimistic Locking Conflict (HTTP 409)", async () => {
    const testDocId = `test-opt-lock-${Date.now()}`;
    // Create
    const created = await postgresDocumentsRepo.create({
      id: testDocId,
      name: "Test Optimistic Lock",
      status: "draft",
    });

    if (created.version !== 1) {
      throw new Error(`Expected initial version 1, got ${created.version}`);
    }

    // Valid update with matching version
    const updated = await postgresDocumentsRepo.update(testDocId, {
      name: "Test Optimistic Lock Updated",
      version: 1,
    });

    if (updated.version !== 2) {
      throw new Error(`Expected version 2 after update, got ${updated.version}`);
    }

    // Conflicting update with stale version
    let conflictCaught = false;
    try {
      await postgresDocumentsRepo.update(testDocId, {
        name: "Conflicting Update",
        version: 1, // Stale version!
      });
    } catch (err) {
      if (err.statusCode === 409 || err.code === "VERSION_CONFLICT") {
        conflictCaught = true;
      } else {
        throw new Error(`Expected 409 conflict error, got: ${err.message}`);
      }
    }

    if (!conflictCaught) {
      throw new Error("Optimistic locking failed to catch version mismatch!");
    }

    // Cleanup test record
    await postgresDocumentsRepo.delete(testDocId);
  });

  console.log("\n=================================================================");
  console.log(`📊 Test Summary: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log("=================================================================\n");

  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
