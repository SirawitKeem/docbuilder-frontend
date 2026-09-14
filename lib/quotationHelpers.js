let counter = 0;

export function genId(prefix) {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

export function createEmptyLineItem() {
  return {
    id: genId("item"),
    title: "",
    qty: 1,
    unitPrice: 0,
    groups: [
      {
        id: genId("group"),
        heading: "",
        bullets: [{ id: genId("bullet"), text: "", subBullets: [] }],
      },
    ],
  };
}

export function createEmptyGroup() {
  return {
    id: genId("group"),
    heading: "",
    bullets: [{ id: genId("bullet"), text: "", subBullets: [] }],
  };
}

export function createEmptyBullet() {
  return { id: genId("bullet"), text: "", subBullets: [] };
}

export function createEmptySubBullet() {
  return { id: genId("sub"), text: "" };
}

export function estimateGroupHeight(group) {
  let h = group.heading ? 22 : 0;
  (group.bullets || []).forEach((b) => {
    const textLen = (b.text || "").length;
    const lines = Math.max(1, Math.ceil(textLen / 52));
    h += lines * 18 + 4;
    if (b.subBullets && b.subBullets.length > 0) {
      b.subBullets.forEach((sb) => {
        const sbLen = (sb.text || "").length;
        const sbLines = Math.max(1, Math.ceil(sbLen / 48));
        h += sbLines * 16 + 2;
      });
    }
  });
  return Math.max(h, 20);
}

export function estimateLineItemHeight(item) {
  let h = item.title ? 28 : 0;
  (item.groups || []).forEach((g) => {
    h += estimateGroupHeight(g);
  });
  return Math.max(h, 28);
}

/**
 * Paginate quotation content dynamically based on content height.
 * Automatically splits onto 1, 2, 3, or N pages with ZERO overlap.
 */
export function paginateQuotationBlocks(lineItems = []) {
  if (!lineItems || lineItems.length === 0) {
    return [{ blocks: [], hasSummary: true }];
  }

  // Capacity budgets for standard A4 card layout (1122px total card height)
  const PAGE1_MAX_HEIGHT = 620;
  const PAGEN_MAX_HEIGHT = 950;
  const SUMMARY_BLOCK_HEIGHT = 220;

  // Flatten line items into flow blocks
  const blocks = [];
  lineItems.forEach((item, itemIdx) => {
    blocks.push({
      type: "item-header",
      id: `header-${item.id || itemIdx}`,
      item,
      height: item.title ? 28 : 0,
    });

    if (item.groups && item.groups.length > 0) {
      item.groups.forEach((group, groupIdx) => {
        blocks.push({
          type: "group-block",
          id: `group-${group.id || groupIdx}`,
          item,
          group,
          height: estimateGroupHeight(group),
        });
      });
    }
  });

  const pages = [];
  let currentBlocks = [];
  let currentHeight = 0;
  let isFirstPage = true;

  blocks.forEach((block) => {
    const maxCapacity = isFirstPage ? PAGE1_MAX_HEIGHT : PAGEN_MAX_HEIGHT;

    if (currentHeight + block.height > maxCapacity && currentBlocks.length > 0) {
      pages.push({ blocks: currentBlocks, hasSummary: false });
      currentBlocks = [block];
      currentHeight = block.height;
      isFirstPage = false;
    } else {
      currentBlocks.push(block);
      currentHeight += block.height;
    }
  });

  if (currentBlocks.length > 0) {
    pages.push({ blocks: currentBlocks, hasSummary: false });
  }

  // Check if the last page has enough room for the Summary block
  const lastPageIndex = pages.length - 1;
  const lastPage = pages[lastPageIndex];
  let lastPageItemsHeight = 0;
  lastPage.blocks.forEach((b) => {
    lastPageItemsHeight += b.height;
  });

  const lastPageMaxCapacity = lastPageIndex === 0 ? PAGE1_MAX_HEIGHT : PAGEN_MAX_HEIGHT;
  if (lastPageItemsHeight + SUMMARY_BLOCK_HEIGHT <= lastPageMaxCapacity) {
    lastPage.hasSummary = true;
  } else {
    pages.push({ blocks: [], hasSummary: true });
  }

  return pages;
}

export function paginateQuotationLineItems(lineItems = []) {
  return paginateQuotationBlocks(lineItems);
}

/**
 * Validate a quotation object before Export / Send Email.
 * Returns { isValid, errors[] } where errors is a list of missing field names.
 */
export function validateQuotation(q) {
  const errors = [];

  if (!q.quotationNo?.trim()) errors.push("Quotation No.");
  if (!q.billTo?.companyName?.trim()) errors.push("ชื่อบริษัทลูกค้า (To)");
  if (!q.billTo?.attn?.trim()) errors.push("ผู้ติดต่อ (Attn.)");
  if (!q.senderName?.trim()) errors.push("ชื่อผู้ส่ง (Best regards)");

  const hasValidItem = (q.lineItems || []).some((it) => {
    const hasTitle = it.title?.trim();
    const hasGroupPrice = (it.groups || []).some(
      (g) => parseFloat(g.unitPrice) > 0
    );
    const hasItemPrice = parseFloat(it.unitPrice) > 0;
    return hasTitle && (hasGroupPrice || hasItemPrice);
  });
  if (!hasValidItem) errors.push("รายการสินค้า/บริการ (ต้องมีชื่อและราคา อย่างน้อย 1 รายการ)");

  return { isValid: errors.length === 0, errors };
}

/**
 * Calculate quotation subtotal, discount, VAT 7%, and grand total.
 */
export function calculateQuotationSummary(
  lineItems = [],
  specialDiscount = 0,
  withholdingTaxPercent = 0
) {
  let subtotal = 0;
  (lineItems || []).forEach((item) => {
    const qty = Number(item.qty) || 1;
    let itemPrice = Number(item.unitPrice) || 0;
    if (item.groups && item.groups.length > 0) {
      let groupSum = 0;
      item.groups.forEach((g) => {
        if (g.unitPrice !== undefined && g.unitPrice !== null && g.unitPrice !== "") {
          groupSum += Number(g.unitPrice) || 0;
        }
      });
      if (groupSum > 0) {
        itemPrice = groupSum;
      }
    }
    subtotal += itemPrice * qty;
  });

  const discount = Number(specialDiscount) || 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  const vat = afterDiscount * 0.07;
  const grandTotal = afterDiscount + vat;
  const withholdingTax = (grandTotal * (Number(withholdingTaxPercent) || 0)) / 100;
  const netPayable = grandTotal - withholdingTax;

  return {
    subtotal,
    discount,
    afterDiscount,
    vat,
    grandTotal,
    withholdingTax,
    netPayable,
  };
}
