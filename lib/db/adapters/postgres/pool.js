import pg from "pg";

const { Pool } = pg;

let poolInstance = null;

export function getPool() {
  if (poolInstance) {
    return poolInstance;
  }

  let connectionString = process.env.DATABASE_URL;

  // If no DATABASE_URL, assemble from individual env vars
  if (!connectionString) {
    const host = process.env.DB_HOST || process.env.PGHOST || "127.0.0.1";
    const port = process.env.DB_PORT || process.env.PGPORT || 5432;
    const user = process.env.DB_USER || process.env.PGUSER || "postgres";
    const password = process.env.DB_PASSWORD || process.env.PGPASSWORD || "";
    const database = process.env.DB_NAME || process.env.PGDATABASE || "docbuilder";
    const ssl = process.env.DB_SSL === "true" || process.env.DB_SSLMODE === "require";

    poolInstance = new Pool({
      host,
      port: Number(port),
      user,
      password,
      database,
      ssl: ssl ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    });
  } else {
    poolInstance = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    });
  }

  poolInstance.on("error", (err) => {
    console.error("Unexpected error on idle PostgreSQL client", err);
  });

  return poolInstance;
}

export async function query(text, params) {
  const pool = getPool();
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.DEBUG_SQL === "true") {
    console.log("Executed query", { text, duration, rows: res.rowCount });
  }
  return res;
}

export async function withTransaction(callback) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
