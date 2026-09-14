"use client";

import React from "react";
import { formatTHB } from "@/lib/format";
import { Building2, MapPin } from "lucide-react";

/**
 * Universal Dynamic Template Document Renderer
 * Renders any template based strictly on its OWN blocks, theme, and orientation.
 * If blocks is empty, renders a completely blank canvas.
 */
export default function UniversalTemplateRenderer({
  template,
  scale = 1,
  className = "",
  currentPage = 1,
  totalPages = 1,
}) {
  if (!template) return null;

  const isLandscape = template.orientation === "landscape";
  const paperWidth = isLandscape ? 1123 : 794;
  const paperHeight = isLandscape ? 794 : 1123;

  const theme = template.theme || {
    primaryColor: "#7C3AED",
    backgroundColor: "#FFFFFF",
    hasBorder: false,
    hasWatermark: false,
    watermarkText: "CONFIDENTIAL",
  };

  const blocks = Array.isArray(template.blocks) ? template.blocks : [];

  return (
    <div
      style={{
        width: paperWidth * scale,
        minHeight: paperHeight * scale,
        transformOrigin: "top center",
        backgroundColor: theme.backgroundColor || "#FFFFFF",
      }}
      className={`universal-template-page rounded-lg shadow-xl border border-gray-300 p-8 sm:p-10 flex flex-col justify-between font-noto-looped text-gray-800 text-xs transition-all relative overflow-hidden ${className}`}
    >
      {/* Optional Watermark */}
      {theme.hasWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
          <span className="text-gray-200 font-black text-6xl rotate-[-35deg] opacity-40 uppercase tracking-widest">
            {theme.watermarkText || "CONFIDENTIAL"}
          </span>
        </div>
      )}

      {/* If no blocks, render 100% clean blank page */}
      {blocks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 text-center min-h-[300px]">
          <div className="space-y-1 text-gray-300">
            <p className="text-sm font-bold">หน้ากระดาษเปล่า (Blank Canvas)</p>
            <p className="text-[10px]">เพิ่มบล็อกเนื้อหาหรือหัวกระดาษจากเมนูด้านซ้ายเพื่อเริ่มออกแบบ</p>
          </div>
        </div>
      ) : (
        /* Render Blocks Sequentially */
        <div className="space-y-4 flex-1 relative z-10">
          {blocks.map((block) => {
            const s = block.settings || {};

            // 1. Header Block
            if (block.type === "header") {
              return (
                <div key={block.id} className="border-b border-gray-200 pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {s.hasLogo !== false && s.logoUrl && (
                        <img
                          src={s.logoUrl}
                          alt="Company Logo"
                          className="h-10 object-contain"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      )}
                      <div>
                        <p className="font-bold text-gray-900 text-xs">{s.companyName || "ชื่อบริษัท / องค์กร"}</p>
                        {s.companyNameEn && <p className="text-[10px] text-gray-500">{s.companyNameEn}</p>}
                        {s.taxId && <p className="text-[9px] text-gray-400">เลขประจำตัวผู้เสียภาษี: {s.taxId}</p>}
                      </div>
                    </div>
                    <div className="text-right text-[9px] text-gray-500 max-w-[240px] space-y-0.5">
                      {s.address && <p>{s.address}</p>}
                      {(s.phone || s.email) && (
                        <p>
                          {s.phone && `โทร: ${s.phone}`} {s.email && `| อีเมล: ${s.email}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // 2. Title Block
            if (block.type === "doc_title") {
              return (
                <div key={block.id} className="text-center py-1">
                  <h2 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                    {s.titleText || template.name || "หัวข้อเอกสาร"}
                  </h2>
                  {s.subtitleText && (
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{s.subtitleText}</p>
                  )}
                </div>
              );
            }

            // 3. Info Grid Block
            if (block.type === "info_grid") {
              return (
                <div key={block.id} className="p-3 rounded-xl border border-gray-200/80 bg-gray-50/50">
                  <div className="grid grid-cols-2 gap-4 text-[11px]">
                    <div className="space-y-0.5">
                      {s.billToTitle && <span className="font-bold text-gray-800">{s.billToTitle}</span>}
                      {s.billToCompany && <p className="text-gray-900 font-semibold">{s.billToCompany}</p>}
                      {s.attnName && <p className="text-gray-600">ผู้ติดต่อ: {s.attnName}</p>}
                      {s.subject && <p className="text-gray-600 font-medium">เรื่อง: {s.subject}</p>}
                    </div>
                    <div className="space-y-0.5 text-right">
                      {s.quotationNo && (
                        <p>
                          <span className="font-semibold text-gray-500">เลขที่:</span>{" "}
                          <span className="font-mono font-bold text-gray-900">{s.quotationNo}</span>
                        </p>
                      )}
                      {s.date && (
                        <p>
                          <span className="font-semibold text-gray-500">วันที่:</span> {s.date}
                        </p>
                      )}
                      {s.validity && (
                        <p>
                          <span className="font-semibold text-gray-500">ยืนราคา:</span> {s.validity}
                        </p>
                      )}
                      {s.amName && (
                        <p>
                          <span className="font-semibold text-gray-500">ผู้จัดทำ:</span> {s.amName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // 4. Pricing / Quotation Table Block
            if (block.type === "quotation_table") {
              const items = s.items || [];
              const subtotal = items.reduce((sum, it) => sum + (Number(it.unitPrice) || 0) * (Number(it.qty) || 1), 0);
              const vatAmount = subtotal * ((Number(s.vatRate) || 7) / 100);
              const grandTotal = subtotal + vatAmount;

              return (
                <div key={block.id} className="rounded-lg overflow-hidden border border-gray-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100/90 text-gray-800 text-[10px] font-bold uppercase border-b border-gray-200">
                        <th className="p-2 w-12 text-center">ลำดับ</th>
                        <th className="p-2">รายการสินค้า / บริการ</th>
                        <th className="p-2 w-16 text-center">จำนวน</th>
                        <th className="p-2 w-24 text-right">ราคา/หน่วย</th>
                        <th className="p-2 w-28 text-right">จำนวนเงิน (บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-[11px]">
                      {items.length === 0 ? (
                        <tr className="hover:bg-gray-50/50">
                          <td className="p-2.5 text-center text-gray-400 font-mono">1</td>
                          <td className="p-2.5 text-gray-400 italic font-medium">[ ระบุรายการสินค้า / บริการ ]</td>
                          <td className="p-2.5 text-center text-gray-400 font-mono">-</td>
                          <td className="p-2.5 text-right text-gray-400 font-mono">-</td>
                          <td className="p-2.5 text-right text-gray-400 font-mono">-</td>
                        </tr>
                      ) : (
                        items.map((it, idx) => (
                          <tr key={it.id || idx} className="hover:bg-gray-50/50">
                            <td className="p-2 text-center text-gray-400 font-mono">{idx + 1}</td>
                            <td className="p-2">
                              <p className="font-bold text-gray-900">{it.title}</p>
                              {it.bullets && (
                                <ul className="text-[10px] text-gray-500 list-disc ml-3.5 mt-0.5 space-y-0.5">
                                  {it.bullets.map((b, bi) => (
                                    <li key={bi}>{b}</li>
                                  ))}
                                </ul>
                              )}
                            </td>
                            <td className="p-2 text-center">{it.qty || 1}</td>
                            <td className="p-2 text-right font-mono">{formatTHB(it.unitPrice)}</td>
                            <td className="p-2 text-right font-mono font-semibold">
                              {formatTHB((it.unitPrice || 0) * (it.qty || 1))}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Summary Row */}
                  <div className="bg-gray-50/80 p-3 border-t border-gray-200 flex justify-end">
                    <div className="w-64 space-y-1 text-[11px]">
                      <div className="flex justify-between text-gray-600">
                        <span>รวมเป็นเงิน:</span>
                        <span className="font-mono font-bold">{subtotal > 0 ? formatTHB(subtotal) : "-"}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>ภาษีมูลค่าเพิ่ม VAT {s.vatRate || 7}%:</span>
                        <span className="font-mono">{subtotal > 0 ? formatTHB(vatAmount) : "-"}</span>
                      </div>
                      <div className="flex justify-between text-gray-900 font-bold border-t border-gray-200 pt-1 text-xs">
                        <span>ยอดรวมทั้งสิ้น:</span>
                        <span className="font-mono text-[#059669] font-black">{subtotal > 0 ? `${formatTHB(grandTotal)} บาท` : "- บาท"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // 5. Terms Block
            if (block.type === "terms") {
              return (
                <div key={block.id} className="p-3 rounded-xl border border-gray-200/80 bg-gray-50/30 text-[11px]">
                  <p className="font-bold text-gray-800 mb-1">{s.heading || "เงื่อนไข:"}</p>
                  <ul className="list-disc ml-4 space-y-0.5 text-gray-600 text-[10px]">
                    {(s.bullets || []).map((b, bi) => (
                      <li key={bi}>{b}</li>
                    ))}
                  </ul>
                </div>
              );
            }

            // 6. Text Block
            if (block.type === "text_block") {
              return (
                <div key={block.id} className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {s.content}
                </div>
              );
            }

            // 6.1 Address Comparison Block
            if (block.type === "address_comparison") {
              return (
                <div key={block.id} className="grid grid-cols-2 gap-3.5 my-2">
                  <div className="bg-[#f3f3f4] rounded-xl p-3 border border-gray-200">
                    <div className="flex items-center gap-1.5 pb-1 mb-1 border-b border-gray-300">
                      <Building2 size={12} className="text-gray-500" />
                      <p className="text-[11px] font-bold text-gray-700">ที่อยู่เดิม / Previous Address:</p>
                    </div>
                    <p className="text-[10px] text-gray-800 font-medium">{s.previousAddressTh}</p>
                    <p className="text-[10px] text-gray-500">{s.previousAddressEn}</p>
                  </div>
                  <div className="bg-gradient-to-br from-[#fff5f5] to-white rounded-xl p-3 border-2 border-[#cb1717]">
                    <div className="flex justify-between items-center pb-1 mb-1 border-b border-[#cb1717]/30">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-[#af0e0e]" />
                        <span className="text-[11px] font-black text-[#af0e0e]">ที่อยู่ใหม่ / New Address:</span>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#cb1717] text-white">มีผล {s.effectiveDate || "16 ก.ย. 2569"}</span>
                    </div>
                    <p className="text-[10px] text-gray-900 font-bold">{s.newAddressTh}</p>
                    <p className="text-[10px] text-gray-600">{s.newAddressEn}</p>
                  </div>
                </div>
              );
            }

            // 6.2 Contract Preamble Block
            if (block.type === "contract_preamble") {
              return (
                <div key={block.id} className="text-xs text-gray-700 leading-relaxed space-y-2 my-2">
                  {(s.dateText || s.locationText) && (
                    <p>
                      {s.locationPrefix || "สัญญาฉบับนี้ทำขึ้น ณ"}{" "}
                      <span className="font-semibold text-gray-900 underline decoration-dotted decoration-gray-400">
                        {s.locationText || "{{contract_location}}"}
                      </span>{" "}
                      {s.datePrefix || "เมื่อวันที่"}{" "}
                      <span className="font-semibold text-gray-900 underline decoration-dotted decoration-gray-400">
                        {s.dateText || "{{contract_date}}"}
                      </span>
                    </p>
                  )}
                  {s.betweenLabel && <p className="font-bold text-gray-800">{s.betweenLabel}</p>}
                  {s.party1Text && (
                    <p className="indent-6">
                      (1) {s.party1Text}
                    </p>
                  )}
                  {s.andLabel && <p className="font-bold text-gray-800">{s.andLabel}</p>}
                  {s.party2Text && (
                    <p className="indent-6">
                      (2) {s.party2Text}
                    </p>
                  )}
                  {s.partiesSummary && <p className="indent-6">{s.partiesSummary}</p>}
                  {s.recital && <p className="indent-6 mt-2">{s.recital}</p>}
                </div>
              );
            }

            // 6.3 Contract Section / Clause Block
            if (block.type === "contract_section") {
              return (
                <div key={block.id} className="text-xs text-gray-800 leading-relaxed space-y-1.5 my-2">
                  {s.title && (
                    <h3 className="font-bold text-gray-900 text-sm mt-3 mb-1 border-b border-gray-100 pb-0.5">
                      {s.title}
                    </h3>
                  )}
                  {s.intro && <p className="pl-2 font-medium text-gray-700">{s.intro}</p>}
                  {s.content && <p className="pl-2">{s.content}</p>}
                  {Array.isArray(s.bullets) && s.bullets.length > 0 && (
                    <ul className="list-disc pl-8 space-y-1 my-1 text-gray-700">
                      {s.bullets.map((b, bi) => (
                        <li key={bi}>{b}</li>
                      ))}
                    </ul>
                  )}
                  {Array.isArray(s.subClauses) && s.subClauses.length > 0 && (
                    <ul className="list-none space-y-1 pl-2 text-gray-700">
                      {s.subClauses.map((sub, si) => (
                        <li key={si} className="pl-2">
                          {sub}
                        </li>
                      ))}
                    </ul>
                  )}
                  {Array.isArray(s.distributorObligations) && s.distributorObligations.length > 0 && (
                    <div className="pl-2 space-y-1 my-1">
                      <p className="font-bold text-gray-800">หน้าที่และความรับผิดชอบของผู้จัดจำหน่ายหลัก:</p>
                      <ul className="list-disc pl-6 space-y-0.5 text-gray-700">
                        {s.distributorObligations.map((ob, oi) => (
                          <li key={oi}>{ob}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(s.resellerObligations) && s.resellerObligations.length > 0 && (
                    <div className="pl-2 space-y-1 my-1">
                      <p className="font-bold text-gray-800">หน้าที่และความรับผิดชอบของตัวแทนจำหน่าย:</p>
                      <ul className="list-disc pl-6 space-y-0.5 text-gray-700">
                        {s.resellerObligations.map((ob, oi) => (
                          <li key={oi}>{ob}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {s.closing && <p className="pl-2 font-medium text-gray-700 mt-1">{s.closing}</p>}
                </div>
              );
            }

            // 7. Signatures Block
            if (block.type === "signatures") {
              const slots = s.slots || [];
              return (
                <div key={block.id} className="pt-4 border-t border-gray-100">
                  <div className={`grid grid-cols-${slots.length || 2} gap-8`}>
                    {slots.map((slot) => (
                      <div key={slot.id} className="text-center space-y-1">
                        <div className="h-10 border-b border-gray-300 border-dashed flex items-end justify-center pb-1">
                          <span className="text-[9px] text-gray-400 italic">[ ลงลายมือชื่อดิจิทัล ]</span>
                        </div>
                        <p className="text-[11px] font-bold text-gray-800">{slot.name || slot.label}</p>
                        <p className="text-[9px] text-gray-400">{slot.role}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}

      {/* Official Thai Pagination Footer */}
      <div className="pt-3 mt-4 border-t border-gray-200/80 flex items-center justify-between text-[10px] text-gray-400 select-none relative z-10 print:text-gray-600">
        <span>{template.name || "เอกสารทางการ"}</span>
        <span className="font-mono font-medium">หน้า {currentPage} จาก {totalPages}</span>
      </div>

      {/* Multi-page Print CSS */}
      <style jsx global>{`
        @media print {
          .universal-template-page {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-height: 100vh !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .universal-page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
        }
      `}</style>
    </div>
  );
}
