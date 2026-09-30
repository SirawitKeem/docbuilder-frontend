import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://wawa:wawa1234@192.168.3.164:5432/docbuilder",
});

async function test() {
  const client = await pool.connect();
  try {
    const resTmpl = await client.query("SELECT id, name, governance_policy FROM templates LIMIT 1;");
    console.log("Template governance:", resTmpl.rows[0]);

    const tmplId = resTmpl.rows[0].id;

    // Test permission insert
    const permRes = await client.query(
      `INSERT INTO template_permissions (id, template_id, grantee_type, grantee_name, permission_level)
       VALUES ($1, $2, $3, $4, $5) RETURNING *;`,
      ["perm-test-1", tmplId, "department", "Legal Team", "editor"]
    );
    console.log("Inserted permission:", permRes.rows[0]);

    // Test share link insert
    const shareRes = await client.query(
      `INSERT INTO template_shares (id, template_id, share_token, share_type)
       VALUES ($1, $2, $3, $4) RETURNING *;`,
      ["share-test-1", tmplId, "tsh_test_token_123", "view_only"]
    );
    console.log("Inserted share link:", shareRes.rows[0]);

    // Clean up
    await client.query("DELETE FROM template_permissions WHERE id = $1;", ["perm-test-1"]);
    await client.query("DELETE FROM template_shares WHERE id = $1;", ["share-test-1"]);
    console.log("Cleaned up test records successfully! All queries valid.");
  } finally {
    client.release();
    await pool.end();
  }
}

test().catch(console.error);
