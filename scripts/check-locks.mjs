import { query, getPool } from "../lib/db/adapters/postgres/pool.js";

async function checkLocks() {
  const locks = await query(`
    SELECT a.pid, l.mode, l.granted, a.query 
    FROM pg_locks l 
    JOIN pg_stat_activity a ON l.pid = a.pid 
    WHERE a.query NOT LIKE '%pg_stat_activity%'
  `);
  console.log("Current active locks:", locks.rows);
  const pool = getPool();
  await pool.end();
}

checkLocks();
