"use client";

import React from "react";
import {
  Receipt,
  Building2,
  Calendar,
  FileText,
  UserCheck,
  Plus,
  Trash2,
  Tag,
  DollarSign,
  Calculator,
} from "lucide-react";
import { useQuotationData } from "@/context/QuotationDataContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatTHB, calcLineItemAmount, calcQuotationTotals } from "@/lib/format";

export default function QuotationFormSidebar({ isOpen = true }) {
  const { t } = useLanguage();
  const {
    quotation,
    updateBillTo,
    updateField,
    updateLineItem,
    addLineItem,
    removeLineItem,
  } = useQuotationData();

  if (!isOpen || !quotation) return null;

  const billTo = quotation.billTo || {};
  const lineItems = quotation.lineItems || [];
  const currentVatRate = quotation.vatRate === undefined || quotation.vatRate === null ? 7 : Number(quotation.vatRate);
  const currentDiscount = quotation.specialDiscount || 0;

  const { total, specialDiscount: discountAmount, vat, grandTotal } = calcQuotationTotals(
    lineItems,
    currentVatRate,
    currentDiscount
  );

  return (
    <aside className="w-[360px] xl:w-[400px] bg-surface border-r border-border flex flex-col h-full shrink-0 shadow-2xs z-20 select-none text-left">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border bg-surface">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[8px] bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shadow-2xs">
              <Receipt size={17} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground leading-tight">
                {t('quotation.formTitle') || "กรอกข้อมูลใบเสนอราคา"}
              </h2>
              <span className="text-[11px] text-muted-foreground font-mono">
                {quotation.quotationNo || "Quotation"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={addLineItem}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-medium transition-colors cursor-pointer border border-primary/20 shadow-2xs"
            title="เพิ่มรายการสินค้าใหม่"
          >
            <Plus size={12} />
            <span>{t('quotation.addItem') || "+ เพิ่มรายการ"}</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>จำนวนรายการสินค้า:</span>
          <span className="font-semibold text-foreground font-mono">
            {lineItems.length} รายการ
          </span>
        </div>
      </div>

      {/* Form Fields Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin text-left">
        {/* Section 1: ข้อมูลลูกค้า (Customer / Bill To) */}
        <div className="space-y-3 p-3.5 rounded-[10px] border border-border bg-muted/20">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Building2 size={14} className="text-primary" />
            <span>1. ข้อมูลลูกค้า (Bill To)</span>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              ชื่อบริษัทลูกค้า <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={billTo.companyName || ""}
              onChange={(e) => updateBillTo("companyName", e.target.value)}
              placeholder="เช่น CS LoxInfo Public Company Limited"
              className="w-full h-9 px-3 text-xs rounded-[8px] border border-border bg-surface text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              ผู้ติดต่อ (Attn.) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={billTo.attn || ""}
              onChange={(e) => updateBillTo("attn", e.target.value)}
              placeholder="ชื่อผู้ติดต่อหรือผู้มีอำนาจตัดสินใจ"
              className="w-full h-9 px-3 text-xs rounded-[8px] border border-border bg-surface text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                End User
              </label>
              <input
                type="text"
                value={billTo.endUser || ""}
                onChange={(e) => updateBillTo("endUser", e.target.value)}
                placeholder="เช่น ผู้ใช้งานจริง"
                className="w-full h-9 px-2.5 text-xs rounded-[8px] border border-border bg-surface text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                หัวข้อเรื่อง (Subject)
              </label>
              <input
                type="text"
                value={billTo.subject || ""}
                onChange={(e) => updateBillTo("subject", e.target.value)}
                placeholder="หัวข้องาน"
                className="w-full h-9 px-2.5 text-xs rounded-[8px] border border-border bg-surface text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 2: ข้อมูลเอกสาร & เงื่อนไข (Document & Terms) */}
        <div className="space-y-3 p-3.5 rounded-[10px] border border-border bg-muted/20">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Calendar size={14} className="text-primary" />
            <span>2. ข้อมูลเอกสาร & เงื่อนไข</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                เลขที่ใบเสนอราคา
              </label>
              <input
                type="text"
                value={quotation.quotationNo || ""}
                onChange={(e) => updateField("quotationNo", e.target.value)}
                placeholder="CZ26080001"
                className="w-full h-9 px-2.5 text-xs font-mono rounded-[8px] border border-border bg-surface text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                วันที่ออกเอกสาร
              </label>
              <input
                type="text"
                value={quotation.quotationDate || ""}
                onChange={(e) => updateField("quotationDate", e.target.value)}
                placeholder="เช่น 17 Aug 2026"
                className="w-full h-9 px-2.5 text-xs rounded-[8px] border border-border bg-surface text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground truncate block" title="กำหนดยืนราคา">
                กำหนดยืนราคา
              </label>
              <input
                type="text"
                value={quotation.priceValidity || ""}
                onChange={(e) => updateField("priceValidity", e.target.value)}
                placeholder="30 days"
                className="w-full h-9 px-2 text-xs text-center rounded-[8px] border border-border bg-surface text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground truncate block" title="ระยะเวลาส่งมอบ">
                ส่งมอบ
              </label>
              <input
                type="text"
                value={quotation.deliveryTerm || ""}
                onChange={(e) => updateField("deliveryTerm", e.target.value)}
                placeholder="7 days"
                className="w-full h-9 px-2 text-xs text-center rounded-[8px] border border-border bg-surface text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground truncate block" title="เงื่อนไขชำระเงิน">
                เครดิตเทอม
              </label>
              <input
                type="text"
                value={quotation.creditTerm || ""}
                onChange={(e) => updateField("creditTerm", e.target.value)}
                placeholder="30 days"
                className="w-full h-9 px-2 text-xs text-center rounded-[8px] border border-border bg-surface text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 3: รายการสินค้า & บริการ (Line Items Table) */}
        <div className="space-y-3 p-3.5 rounded-[10px] border border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Tag size={14} className="text-primary" />
              <span>3. รายการสินค้า / บริการ</span>
            </div>
            <button
              type="button"
              onClick={addLineItem}
              className="text-[11px] font-medium text-primary hover:underline cursor-pointer inline-flex items-center gap-0.5"
            >
              <Plus size={11} />
              <span>เพิ่ม</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {lineItems.map((item, idx) => {
              const amount = calcLineItemAmount(item);
              return (
                <div
                  key={item.id || idx}
                  className="p-3 rounded-[8px] bg-surface border border-border/80 shadow-2xs space-y-2 relative group"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] bg-muted text-muted-foreground font-mono">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={item.code || ""}
                      onChange={(e) => updateLineItem(item.id, { ...item, code: e.target.value })}
                      placeholder="Code (รหัส)"
                      className="w-24 h-7 px-1.5 text-[11px] font-mono rounded-[6px] border border-border bg-muted/20 text-foreground outline-none focus:border-primary"
                    />
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItem(item.id)}
                        className="p-1 rounded-[6px] text-muted-foreground/60 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer ml-auto"
                        title="ลบรายการนี้"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={item.title || ""}
                    onChange={(e) => updateLineItem(item.id, { ...item, title: e.target.value })}
                    placeholder="ชื่อรายการสินค้าหรือบริการ..."
                    className="w-full h-8 px-2.5 text-xs font-medium rounded-[6px] border border-border bg-surface text-foreground outline-none focus:border-primary"
                  />

                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <div className="space-y-0.5">
                      <label className="text-[10px] text-muted-foreground">จำนวน (Qty)</label>
                      <input
                        type="number"
                        min="1"
                        value={item.qty ?? 1}
                        onChange={(e) => updateLineItem(item.id, { ...item, qty: Number(e.target.value) || 1 })}
                        className="w-full h-7 px-2 text-xs text-center rounded-[6px] border border-border bg-surface text-foreground outline-none focus:border-primary tabular-nums"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[10px] text-muted-foreground">ราคาต่อหน่วย (THB)</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.unitPrice ?? 0}
                        onChange={(e) => updateLineItem(item.id, { ...item, unitPrice: Number(e.target.value) || 0 })}
                        className="w-full h-7 px-2 text-xs text-right rounded-[6px] border border-border bg-surface text-foreground outline-none focus:border-primary tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="pt-1 border-t border-border/50 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground text-[10px]">รวมรายการนี้:</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {formatTHB(amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: สรุปราคา (Price Summary) */}
        <div className="space-y-2 p-3.5 rounded-[10px] border border-border bg-muted/20">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-1">
            <Calculator size={14} className="text-primary" />
            <span>4. สรุปราคา (Price Summary)</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>ยอดรวมก่อนส่วนลด:</span>
              <span className="font-semibold text-foreground tabular-nums">{formatTHB(total)}</span>
            </div>

            <div className="flex justify-between items-center text-muted-foreground">
              <span>ส่วนลดพิเศษ (THB):</span>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-xs">-</span>
                <input
                  type="number"
                  min="0"
                  value={currentDiscount || ""}
                  onChange={(e) => updateField("specialDiscount", e.target.value === "" ? 0 : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-20 h-7 px-1.5 text-right text-xs rounded-[6px] border border-border bg-surface text-primary font-semibold outline-none focus:border-primary tabular-nums"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-muted-foreground">
              <span>ภาษีมูลค่าเพิ่ม (VAT {currentVatRate}%):</span>
              <span className="font-semibold text-foreground tabular-nums">{formatTHB(vat)}</span>
            </div>

            <div className="pt-2 border-t border-border flex justify-between items-center text-sm font-bold text-foreground">
              <span>ยอดรวมทั้งสิ้น:</span>
              <span className="text-primary text-base tabular-nums">{formatTHB(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Section 5: ผู้ประสานงาน (AM / Sender) */}
        <div className="space-y-3 p-3.5 rounded-[10px] border border-border bg-muted/20">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <UserCheck size={14} className="text-primary" />
            <span>5. ข้อมูลผู้ประสานงาน (Account Manager)</span>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              ชื่อผู้ประสานงาน (AM)
            </label>
            <input
              type="text"
              value={quotation.senderName || billTo.am || ""}
              onChange={(e) => {
                updateField("senderName", e.target.value);
                updateBillTo("am", e.target.value);
              }}
              placeholder="เช่น Narin Rattanavijai / Channel Manager"
              className="w-full h-9 px-3 text-xs rounded-[8px] border border-border bg-surface text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              เบอร์โทรศัพท์ติดต่อ
            </label>
            <input
              type="text"
              value={quotation.senderPhone || ""}
              onChange={(e) => updateField("senderPhone", e.target.value)}
              placeholder="+6682-44-686-95"
              className="w-full h-9 px-3 text-xs rounded-[8px] border border-border bg-surface text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
