/**
 * Utility helpers to convert between PostgreSQL snake_case and Application camelCase
 */

export function snakeToCamel(str) {
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

export function camelToSnake(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function mapRowToCamel(row) {
  if (!row || typeof row !== "object") return row;
  const newObj = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = snakeToCamel(key);
    newObj[camelKey] = value;
  }
  return newObj;
}

export function mapRowsToCamel(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapRowToCamel);
}

export function parseJsonSafe(val, fallback = null) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}
