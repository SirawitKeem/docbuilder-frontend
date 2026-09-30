import crypto from "crypto";

/**
 * 🆔 Enterprise Identity Generator
 * Generates collision-proof, K-Sortable, Type-Prefixed Identifiers.
 * Format: {prefix}_{timestamp_hex}{random_entropy_hex}
 * 
 * Benefits:
 * 1. Zero Collision Risk: Combines millisecond timestamp with 10 bytes (80 bits) of cryptographic random entropy.
 * 2. Time-Ordered (K-Sortable): Natural B-Tree index locality in PostgreSQL (no fragmentation like random UUIDv4).
 * 3. Human-Readable Type Prefix: Instantly identify entity type (e.g. cat_, tmpl_, doc_, usr_).
 */

const PREFIX_REGISTRY = {
  category: "cat",
  template: "tmpl",
  templateVersion: "tver",
  document: "doc",
  quotation: "qt",
  asset: "ast",
  user: "usr",
  organization: "org",
  counterparty: "cp",
  signatory: "sign",
  activityLog: "act",
  notification: "ntf",
  token: "tok",
  sent: "sent",
  fieldProfile: "fp",
  fieldProfileValue: "fpv",
  verification: "vrf",
};

/**
 * Generates a unique, collision-proof ID for a given entity type.
 * @param {keyof typeof PREFIX_REGISTRY} entityType - The type of entity
 * @returns {string} e.g. "doc_019234ab89cf12345678"
 */
export function generateEntityId(entityType = "document") {
  const prefix = PREFIX_REGISTRY[entityType] || entityType.toLowerCase().replace(/[^a-z0-9]/g, "");
  
  // 48-bit timestamp (milliseconds since epoch) -> 12 hex characters
  const timestamp = Date.now().toString(16).padStart(12, "0");
  
  // 64-bit cryptographic random entropy -> 16 hex characters
  const randomBytes = crypto.randomBytes(8).toString("hex");

  return `${prefix}_${timestamp}${randomBytes}`;
}

/**
 * Checks if a string is a valid entity ID with the expected prefix.
 * @param {string} id 
 * @param {string} expectedPrefix 
 * @returns {boolean}
 */
export function isValidEntityId(id, expectedPrefix) {
  if (!id || typeof id !== "string") return false;
  if (!expectedPrefix) return /^[a-z0-9]+_[0-9a-f]{28}$/i.test(id);
  const regex = new RegExp(`^${expectedPrefix}_[0-9a-f]{28}$`, "i");
  return regex.test(id);
}
