import { query } from "./pool.js";

/**
 * Generates an atomic sequential document number using document_counters table.
 * Thread-safe and concurrency-safe via INSERT ... ON CONFLICT DO UPDATE RETURNING.
 *
 * @param {string} prefix - e.g. "CZ" or from organization settings
 * @param {Date} [date] - Reference date (defaults to now)
 * @returns {Promise<string>} e.g. "CZ26090001"
 */
export async function getNextAtomicDocumentNo(prefix = "CZ", date = new Date()) {
  const now = date instanceof Date ? date : new Date(date);
  const year2Digits = String(now.getFullYear()).slice(-2);
  const month2Digits = String(now.getMonth() + 1).padStart(2, "0");
  const period = `${year2Digits}${month2Digits}`;

  const sql = `
    INSERT INTO document_counters (prefix, period, last_value, updated_at)
    VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
    ON CONFLICT (prefix, period)
    DO UPDATE SET 
      last_value = document_counters.last_value + 1,
      updated_at = CURRENT_TIMESTAMP
    RETURNING last_value;
  `;

  const res = await query(sql, [prefix, period]);
  const nextNum = res.rows[0].last_value;
  const running4Digits = String(nextNum).padStart(4, "0");

  return `${prefix}${period}${running4Digits}`;
}
