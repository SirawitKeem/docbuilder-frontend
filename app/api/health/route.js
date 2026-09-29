import { NextResponse } from "next/server";
import { query } from "@/lib/db/adapters/postgres/pool.js";

/**
 * GET /api/health
 * Comprehensive health check endpoint verifying:
 * 1. Application runtime
 * 2. Active DB Adapter (postgres / json)
 * 3. Live PostgreSQL connection, latency, and table statistics
 */
export async function GET() {
  const activeAdapter = process.env.DB_ADAPTER || process.env.DB_DRIVER || "json";
  const startTime = Date.now();

  const healthData = {
    status: "ok",
    timestamp: new Date().toISOString(),
    adapter: activeAdapter,
    database: {
      connected: false,
      latencyMs: null,
      details: null,
    },
    version: "1.0.0",
  };

  if (activeAdapter === "postgres" || activeAdapter === "pg") {
    try {
      const dbStart = Date.now();
      const res = await query(
        `SELECT current_database() as database, 
                current_user as user, 
                version() as pg_version,
                (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count;`
      );
      const latencyMs = Date.now() - dbStart;

      healthData.database = {
        connected: true,
        latencyMs,
        details: {
          database: res.rows[0]?.database,
          user: res.rows[0]?.user,
          tableCount: Number(res.rows[0]?.table_count || 0),
        },
      };
    } catch (err) {
      healthData.status = "degraded";
      healthData.database = {
        connected: false,
        error: err.message,
      };
    }
  } else {
    healthData.database = {
      connected: true,
      mode: "json_file",
      details: "Using local JSON database (data/db.json)",
    };
  }

  healthData.totalResponseMs = Date.now() - startTime;
  const statusCode = healthData.status === "ok" ? 200 : 503;
  return NextResponse.json(healthData, { status: statusCode });
}
