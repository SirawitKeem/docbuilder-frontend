import { quotationsRepo } from "@/lib/db/repositories";

/**
 * GET /api/quotations/next-no
 * Returns the next available Quotation No. without creating a record.
 */
export async function GET() {
  const quotations = await quotationsRepo.getAll();
  const now = new Date();
  const year2Digits = String(now.getFullYear()).slice(-2);
  const month2Digits = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `CZ${year2Digits}${month2Digits}`;

  const sameMonthItems = quotations.filter(
    (q) => q.quotationNo && q.quotationNo.startsWith(prefix)
  );
  const nextNum = sameMonthItems.length + 1;
  const quotationNo = `${prefix}${String(nextNum).padStart(4, "0")}`;

  return Response.json({ quotationNo });
}
