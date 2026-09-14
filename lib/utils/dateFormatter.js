/**
 * Smart Dual-Language Date Formatting Helpers
 */

const THAI_MONTHS_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

const ENGLISH_MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const ENGLISH_MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"
];

function parseDateInput(input) {
  if (!input) return new Date();
  if (input instanceof Date) return input;
  const parts = String(input).split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  const parsed = new Date(input);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function getTodayIsoDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Format: 01 กันยายน 2569 / September 01, 2026
 */
export function formatDocumentDate(input) {
  const d = parseDateInput(input);
  const day = d.getDate();
  const dayPadded = String(day).padStart(2, "0");
  const monthTh = THAI_MONTHS_FULL[d.getMonth()];
  const monthEn = ENGLISH_MONTHS_FULL[d.getMonth()];
  const yearTh = d.getFullYear() + 543;
  const yearEn = d.getFullYear();

  return `${dayPadded} ${monthTh} ${yearTh} / ${monthEn} ${dayPadded}, ${yearEn}`;
}

/**
 * Format: 16 กันยายน 2569
 */
export function formatEffectiveDateTh(input) {
  const d = parseDateInput(input);
  const day = d.getDate();
  const monthTh = THAI_MONTHS_FULL[d.getMonth()];
  const yearTh = d.getFullYear() + 543;

  return `${day} ${monthTh} ${yearTh}`;
}

/**
 * Format: September 16, 2026
 */
export function formatEffectiveDateEn(input) {
  const d = parseDateInput(input);
  const day = d.getDate();
  const monthEn = ENGLISH_MONTHS_FULL[d.getMonth()];
  const yearEn = d.getFullYear();

  return `${monthEn} ${day}, ${yearEn}`;
}

/**
 * Format: (มีผล 16 ก.ย. 2569 / Effective Sept 16, 2026):
 */
export function formatEffectiveDateBadge(input) {
  const d = parseDateInput(input);
  const day = d.getDate();
  const monthThShort = THAI_MONTHS_SHORT[d.getMonth()];
  const monthEnShort = ENGLISH_MONTHS_SHORT[d.getMonth()];
  const yearTh = d.getFullYear() + 543;
  const yearEn = d.getFullYear();

  return `(มีผล ${day} ${monthThShort} ${yearTh} / Effective ${monthEnShort} ${day}, ${yearEn}):`;
}
