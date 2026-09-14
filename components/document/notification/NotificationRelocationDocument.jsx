"use client";

import React from "react";
import defaultContent from "@/lib/templates/notification/content.json";
import { notificationSamplePreview } from "@/lib/templates/notification/schema";
import { useDocumentFields } from "@/context/DocumentFieldsContext";

export default function NotificationRelocationDocument({ data, values, quotation, content = defaultContent }) {
  const c = content || defaultContent;
  const ctx = useDocumentFields?.() || { values: {} };
  const isPreview = !data && !values && !quotation && (!ctx.values || Object.keys(ctx.values).length === 0);
  const sample = notificationSamplePreview || {};
  const d = data || values || quotation || (ctx.values && Object.keys(ctx.values).length > 0 ? { ...sample, ...ctx.values } : sample);

  const docDate = d.doc_date || sample.doc_date || "";
  const recipient = d.recipient || sample.recipient || "";
  const subject = d.subject || sample.subject || "";
  const effectiveDate = d.effective_date || sample.effective_date || "";
  const effectiveDateEn = d.effective_date_en || sample.effective_date_en || "";
  const effectiveDateBadge = d.effective_date_badge || sample.effective_date_badge || (effectiveDate ? `(มีผล ${effectiveDate} / Effective ${effectiveDateEn || effectiveDate}):` : "");
  const oldAddressTh = d.old_address_th || sample.old_address_th || "";
  const oldAddressEn = d.old_address_en || sample.old_address_en || "";
  const newAddressTh = d.new_address_th || sample.new_address_th || "";
  const newAddressEn = d.new_address_en || sample.new_address_en || "";
  const signatoryName = d.signatory_name || sample.signatory_name || "";
  const signatoryPosition = d.signatory_position || sample.signatory_position || "";

  return (
    <div
      className="bg-white text-gray-900 overflow-hidden text-left flex flex-col justify-between text-[14.5px] leading-[1.7]"
      style={{
        width: 794,
        minHeight: 1123,
        height: 1123,
        boxSizing: "border-box",
        padding: "0px 48px 0px 48px",
        fontFamily: "var(--font-inter), 'Inter', var(--font-noto-thai), 'Noto Sans Thai', sans-serif",
      }}
    >
      {/* ── TOP & MAIN CONTENT ── */}
      <div>
        {/* ── TOP FLUSH GRAPHIC STRIPE (Flush to top edge of paper) ── */}
        <div className="-mx-12 mt-0 mb-4 overflow-hidden pointer-events-none">
          <svg viewBox="0 0 1000 48" className="w-full h-9 block" preserveAspectRatio="none">
            <defs>
              <linearGradient id="topHeaderRedRibbon2" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7f1d1d" />
                <stop offset="25%" stopColor="#b91c1c" />
                <stop offset="65%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <linearGradient id="topHeaderRedShadow2" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#450a0a" />
                <stop offset="100%" stopColor="#991b1b" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="1000" height="11" fill="#242b35" />
            <path d="M 620 11 C 645 11, 660 45, 685 45 L 1000 45 L 1000 11 Z" fill="url(#topHeaderRedShadow2)" opacity="0.45" />
            <path d="M 630 11 C 655 11, 670 45, 695 45 L 1000 45 L 1000 11 Z" fill="url(#topHeaderRedRibbon2)" />
          </svg>
        </div>

        {/* 1. COMPANY HEADER & LOGO */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 shrink-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.header?.logoUrl || "/header_logo.png"} alt="Company Logo" className="max-w-full max-h-full object-contain" />
          </div>
          <div className="space-y-0.5 pt-0.5">
            <h1 className="text-[16.5px] font-bold text-gray-900 leading-tight">
              {c.header?.companyNameTh}
            </h1>
            <p className="text-[12.5px] text-gray-700 leading-tight">
              {c.header?.companyAddressTh}
            </p>
            <p className="text-[12px] text-gray-600 leading-tight">
              เลขประจำตัวผู้เสียภาษีอากร {c.header?.taxId} ({c.header?.branch}) &nbsp;|&nbsp; โทร: {c.header?.phone}
            </p>
          </div>
        </div>

        {/* 2. DOCUMENT TITLE */}
        <div className="text-center mt-7 mb-3">
          <h2 className="text-[18.5px] font-bold text-gray-900 tracking-tight">
            {c.title?.titleTh}
          </h2>
          <p className="text-[14.5px] font-semibold text-gray-900 tracking-normal mt-0.5">
            {c.title?.titleEn}
          </p>
        </div>

        {/* 3. DATE right-aligned (Unbolded / Normal weight) */}
        <div className="flex justify-end text-[14.5px] text-gray-900 font-normal my-5">
          <div className="flex items-center gap-2">
            <span className="text-gray-900 font-normal">{c.labels?.dateLabel}</span>
            <span className="text-gray-950 font-normal">{docDate}</span>
          </div>
        </div>

        {/* 4. TO & SUBJECT (Unbolded) */}
        <div className="space-y-1.5 text-[14.5px] text-gray-900 mb-4">
          <div className="flex items-start gap-2">
            <span className="text-gray-900 shrink-0">{c.labels?.toLabel}</span>
            <span className="text-gray-950 font-normal flex-1">{recipient}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-900 shrink-0">{c.labels?.subjectLabel}</span>
            <span className="text-gray-950 font-normal flex-1">{subject}</span>
          </div>
        </div>

        {/* 5. FORMAL LETTER BODY */}
        <div className="space-y-2.5 text-[14.5px] leading-[1.7] text-gray-900 text-justify mb-4">
          <p className="indent-8">
            {c.body?.paragraphThPre} <span className="font-bold text-gray-950">{effectiveDate}</span> {c.body?.paragraphThPost}
          </p>
          <p className="indent-8 text-gray-900">
            {c.body?.paragraphEnPre} <span className="font-bold text-gray-900">{effectiveDateEn}</span> {c.body?.paragraphEnPost}
          </p>
        </div>

        {/* 6. ADDRESS CARDS */}
        <div className="space-y-4 mb-4.5 pt-1.5">
          <div style={{ backgroundColor: "#f1f3f5" }} className="rounded-xs border-l-4 border-gray-500 p-4.5">
            <div className="text-[14.5px] font-bold text-gray-900 mb-0.5">
              {c.labels?.previousAddressLabel}
            </div>
            <div className="space-y-0.5 text-[14px] text-gray-900 leading-relaxed font-normal">
              <p>{oldAddressTh}</p>
              <p>{oldAddressEn}</p>
            </div>
          </div>
          <div style={{ backgroundColor: "#e2eefb" }} className="rounded-xs border-l-4 border-[#1d4ed8] p-4.5">
            <div className="text-[14.5px] font-bold text-gray-950 mb-0.5">
              {c.labels?.newAddressLabel} <span className="font-semibold text-gray-800">{effectiveDateBadge}</span>
            </div>
            <div className="space-y-0.5 text-[14px] text-gray-950 leading-relaxed font-normal">
              <p>{newAddressTh}</p>
              <p>{newAddressEn}</p>
            </div>
          </div>
        </div>

        {/* 7. SIGNATORY BLOCK */}
        <div className="pt-13 pb-1 flex justify-end">
          <div className="w-80 text-center space-y-1.5 text-[14.5px]">
            <p className="text-gray-900">
              {c.labels?.sincerelyLabel}
            </p>
            <div className="pt-8 pb-2.5 flex items-center justify-center min-h-[50px]">
              {d.our_signature_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={d.our_signature_image}
                  alt="Signature"
                  className="max-h-12 max-w-[160px] object-contain select-none"
                />
              ) : (
                <span className="text-gray-400 font-mono tracking-wider text-[12.5px] whitespace-nowrap">
                  ( ................................. )
                </span>
              )}
            </div>
            <div className="space-y-0.5">
              <p className="text-gray-900 font-semibold text-[14.5px]">{signatoryName}</p>
              <p className="text-[13.5px] text-gray-700">{signatoryPosition}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM FLUSH GRAPHIC STRIPE (Flush to bottom edge of paper) ── */}
      <div className="-mx-12 mb-0 mt-0 overflow-hidden pointer-events-none">
        <svg viewBox="0 0 1000 48" className="w-full h-9 block" preserveAspectRatio="none">
          <defs>
            <linearGradient id="btmHeaderRedRibbon2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7f1d1d" />
              <stop offset="25%" stopColor="#b91c1c" />
              <stop offset="65%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            <linearGradient id="btmHeaderRedShadow2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#450a0a" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
          </defs>
          <path d="M 0 0 L 320 0 C 345 0, 365 34, 390 34 L 0 34 Z" fill="url(#btmHeaderRedShadow2)" opacity="0.45" />
          <path d="M 0 0 L 305 0 C 330 0, 350 34, 375 34 L 0 34 Z" fill="url(#btmHeaderRedRibbon2)" />
          <rect x="0" y="34" width="1000" height="14" fill="#242b35" />
        </svg>
      </div>
    </div>
  );
}
