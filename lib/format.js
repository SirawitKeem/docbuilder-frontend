/**
 * Format a number as THB currency with commas and 2 decimal places
 */
export function formatTHB(num) {
  if (num === null || num === undefined || isNaN(num)) return "0.00";
  return Number(num).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Calculate amount for a single line item (qty * unitPrice)
 */
export function calcLineItemAmount(item) {
  if (!item) return 0;
  const qty = Number(item.qty) || 0;
  const unitPrice = Number(item.unitPrice) || 0;
  return qty * unitPrice;
}

/**
 * Calculate Total, Special Discount, VAT amount, and Grand Total for array of line items
 */
export function calcQuotationTotals(lineItems = [], vatRate = 7, specialDiscount = 0) {
  const total = (lineItems || []).reduce((sum, item) => {
    let itemTotal = calcLineItemAmount(item);

    if (item.groups && item.groups.length > 0) {
      item.groups.forEach((g) => {
        if (g.unitPrice) {
          const gQty = Number(g.qty) || 1;
          const gPrice = Number(g.unitPrice) || 0;
          itemTotal += gQty * gPrice;
        }

        if (g.bullets && g.bullets.length > 0) {
          g.bullets.forEach((b) => {
            if (b.unitPrice) {
              const bQty = Number(b.qty) || 1;
              const bPrice = Number(b.unitPrice) || 0;
              itemTotal += bQty * bPrice;
            }

            if (b.subBullets && b.subBullets.length > 0) {
              b.subBullets.forEach((sb) => {
                if (sb.unitPrice) {
                  const sbQty = Number(sb.qty) || 1;
                  const sbPrice = Number(sb.unitPrice) || 0;
                  itemTotal += sbQty * sbPrice;
                }
              });
            }
          });
        }
      });
    }

    return sum + itemTotal;
  }, 0);

  const discount = Number(specialDiscount) || 0;
  const afterDiscount = Math.max(0, total - discount);
  const rate = Number(vatRate) || 0;
  const vat = (afterDiscount * rate) / 100;
  const grandTotal = afterDiscount + vat;

  return {
    subtotal: total,
    total,
    specialDiscount: discount,
    afterDiscount,
    vat,
    grandTotal,
  };
}

