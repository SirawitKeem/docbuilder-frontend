import { useContext } from "react";
import { formatTHB, calcQuotationTotals } from "@/lib/format";
import { QuotationDataContext } from "@/context/QuotationDataContext";
import { useLanguage } from "@/context/LanguageContext";

export default function PriceSummaryBlock({ lineItems, vatRate, specialDiscount = 0 }) {
  const quotationCtx = useContext(QuotationDataContext);
  const { t } = useLanguage();

  const readOnly = quotationCtx ? quotationCtx.readOnly : true;
  const updateField = quotationCtx ? quotationCtx.updateField : () => {};

  const currentSpecialDiscount = quotationCtx?.quotation?.specialDiscount !== undefined 
    ? quotationCtx.quotation.specialDiscount 
    : specialDiscount;

  const currentVatRate = vatRate === undefined || vatRate === null ? 7 : Number(vatRate);
  const { total, specialDiscount: discountAmount, afterDiscount, vat, grandTotal } = calcQuotationTotals(
    lineItems,
    currentVatRate,
    currentSpecialDiscount
  );

  const hasDiscount = discountAmount > 0;

  return (
    <div className="border border-gray-200 rounded-lg p-2.5 bg-white shadow-2xs h-full flex flex-col justify-between text-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-1 mb-1">
        <p className="text-[10px] font-bold tracking-wider" style={{ color: "#0F4C35" }}>
          {t('quotation.priceSummary') || "PRICE SUMMARY"}
        </p>
      </div>

      <div className="space-y-0.5 text-gray-700 font-medium">
        {/* Subtotal (ยอดก่อนส่วนลด) */}
        <div className="flex justify-between items-center py-0.5">
          <span className="text-[11px] text-gray-600">{t('quotation.subtotal') || "SUBTOTAL"}</span>
          <span className="font-semibold tabular-nums text-gray-900">{formatTHB(total)}</span>
        </div>

        {/* Special Discount Row */}
        <div className="flex justify-between items-center py-0.5">
          <span className="text-[11px] text-gray-600">{t('quotation.specialDiscount') || "Special Discount"}</span>
          {readOnly ? (
            <span className="font-semibold tabular-nums text-gray-700">
              {hasDiscount ? `- ${formatTHB(discountAmount)}` : "0.00"}
            </span>
          ) : (
            <div className="flex items-center justify-end gap-1">
              <span className="text-gray-400 text-xs">-</span>
              <input
                type="number"
                min="0"
                placeholder="0.00"
                value={currentSpecialDiscount === "" || currentSpecialDiscount === undefined || currentSpecialDiscount === null ? "" : currentSpecialDiscount}
                onChange={(e) => {
                  const val = e.target.value === "" ? "" : Number(e.target.value);
                  updateField("specialDiscount", val === "" ? 0 : val);
                }}
                className="w-20 text-right bg-[#F5F3FF] text-[#7C3AED] font-bold rounded border border-[#EDE9FE] text-[11px] px-1 py-0.5 outline-none focus:ring-1 focus:ring-[#7C3AED] tabular-nums"
                title={t('quotation.discountTooltip') || "ส่วนลดพิเศษ (THB)"}
              />
            </div>
          )}
        </div>

        {/* Net Total after discount (แสดงเมื่อมีส่วนลด) */}
        {hasDiscount && (
          <div className="flex justify-between items-center py-0.5 text-gray-800">
            <span className="text-[11px] font-semibold text-gray-700">{t('quotation.totalAfterDisc') || "TOTAL (After Disc.)"}</span>
            <span className="font-semibold tabular-nums text-gray-900">{formatTHB(afterDiscount)}</span>
          </div>
        )}

        {/* VAT Row */}
        <div className="flex justify-between items-center py-0.5">
          <div className="flex items-center gap-1 text-[11px] text-gray-600">
            <span>{t('quotation.vat') || "VAT"}</span>
            {readOnly ? (
              <span className="font-semibold text-gray-700">{currentVatRate}%</span>
            ) : (
              <div className="flex items-center gap-0.5">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={currentVatRate}
                  onChange={(e) => {
                    const val = e.target.value === "" ? 0 : Number(e.target.value);
                    updateField("vatRate", val);
                  }}
                  className="w-9 text-center bg-[#F5F3FF] text-[#7C3AED] font-bold rounded border border-[#EDE9FE] text-[11px] py-0.5 outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  title={t('quotation.vatTooltip') || "ปรับ % ภาษีมูลค่าเพิ่ม"}
                />
                <span className="font-bold text-[10px] text-gray-700">%</span>
              </div>
            )}
          </div>
          <span className="font-semibold tabular-nums text-gray-900">{formatTHB(vat)}</span>
        </div>
      </div>

      {/* Grand Total Row with accounting double-line accent */}
      <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-gray-300">
        <span className="font-bold text-[13px] tracking-wider" style={{ color: "#0F4C35" }}>
          {t('quotation.grandTotal') || "GRAND TOTAL"}
        </span>
        <div className="border-b-2 border-double border-[#0F4C35] pb-0.5">
          <span className="font-bold text-[13px] tabular-nums" style={{ color: "#0F4C35" }}>
            {formatTHB(grandTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}