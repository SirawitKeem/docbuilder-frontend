"use client";

import Image from "next/image";
import { Plus, X, Trash2 } from "lucide-react";
import PriceSummaryBlock from "./PriceSummaryBlock";
import QuotationFooter from "./QuotationFooter";
import InlineTextField from "./InlineTextField";
import InlineDatePicker from "./InlineDatePicker";
import InlineTermSelect from "./InlineTermSelect";
import { useContext } from "react";
import { quotationTemplate } from "@/lib/templates/quotation/schema";
import { QuotationDataContext } from "@/context/QuotationDataContext";
import { paginateQuotationBlocks } from "@/lib/quotationHelpers";
import { formatTHB, calcLineItemAmount } from "@/lib/format";

function LineItemHeaderRow({ item }) {
  const quotationCtx = useContext(QuotationDataContext);

  const readOnly = quotationCtx ? quotationCtx.readOnly : true;
  const updateLineItem = quotationCtx ? quotationCtx.updateLineItem : () => {};
  const removeLineItem = quotationCtx ? quotationCtx.removeLineItem : () => {};
  const addGroup = quotationCtx ? quotationCtx.addGroup : () => {};
  const addBullet = quotationCtx ? quotationCtx.addBullet : () => {};
  const amount = calcLineItemAmount(item);

  const hasContent = item.title || item.code || item.unitPrice || item.qty > 1;
  if (readOnly && !hasContent) {
    return null;
  }

  // Find or create default group for direct bullets under this item
  const firstGroupId = item.groups && item.groups.length > 0 ? item.groups[0].id : null;

  return (
    <div className="line-item-header group/item relative py-0.5">
      {/* Floating Action Toolbar on Hover in Edit Mode */}
      {!readOnly && (
        <div className="opacity-0 group-hover/item:opacity-100 absolute right-1 -top-3 z-20 flex items-center gap-1 bg-white border border-emerald-300 shadow-md px-2 py-0.5 rounded-md transition-opacity">
          <button
            onClick={() => {
              if (firstGroupId) {
                addBullet(item.id, firstGroupId);
              } else {
                addGroup(item.id);
              }
            }}
            className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded transition-colors"
            title="เพิ่ม Bullet (•) ใต้ชื่อเรื่องนี้"
          >
            <Plus size={11} /> เพิ่ม bullet (•)
          </button>

          <button
            onClick={() => addGroup(item.id)}
            className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded transition-colors"
            title="เพิ่มหมวดหมู่ย่อย"
          >
            <Plus size={11} /> เพิ่มหมวดหมู่ย่อย
          </button>

          <button
            onClick={() => removeLineItem(item.id)}
            className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="ลบรายการหลักนี้"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}

      {/* 5 Columns: PRODUCT CODE | DESCRIPTION | QTY | PRICE | AMOUNT */}
      <div className="grid grid-cols-[105px_1fr_40px_105px_105px] gap-2 py-0.5 items-center">
        <div className="text-xs text-gray-600">
          <InlineTextField
            value={item.code}
            onChange={(v) => updateLineItem(item.id, { ...item, code: v })}
            placeholder="Code..."
            readOnly={readOnly}
          />
        </div>

        <div className="w-full">
          <InlineTextField
            value={item.title}
            onChange={(v) => updateLineItem(item.id, { ...item, title: v })}
            placeholder="ชื่อรายการหลัก / ชื่อเรื่อง..."
            readOnly={readOnly}
            className="font-bold text-xs text-gray-900 w-full block"
          />
        </div>

        <div className="text-center text-xs font-semibold text-gray-900">
          <InlineTextField
            value={item.qty}
            numeric
            onChange={(v) => updateLineItem(item.id, { ...item, qty: v })}
            readOnly={readOnly}
            className="text-center text-xs font-semibold text-gray-900 w-10"
          />
        </div>

        <div className="text-right text-xs font-semibold text-gray-900">
          {readOnly ? (
            item.unitPrice ? formatTHB(item.unitPrice) : ""
          ) : (
            <InlineTextField
              value={item.unitPrice}
              numeric
              onChange={(v) => updateLineItem(item.id, { ...item, unitPrice: v })}
              readOnly={readOnly}
              className="text-right text-xs text-gray-900 w-20"
            />
          )}
        </div>

        <div className="text-right text-xs font-bold text-gray-900">
          {amount > 0 ? formatTHB(amount) : ""}
        </div>
      </div>
    </div>
  );
}

function GroupBlockRow({ item, group }) {
  const quotationCtx = useContext(QuotationDataContext);

  const readOnly = quotationCtx ? quotationCtx.readOnly : true;
  const updateGroup = quotationCtx ? quotationCtx.updateGroup : () => {};
  const removeGroup = quotationCtx ? quotationCtx.removeGroup : () => {};
  const addBullet = quotationCtx ? quotationCtx.addBullet : () => {};
  const updateBullet = quotationCtx ? quotationCtx.updateBullet : () => {};
  const removeBullet = quotationCtx ? quotationCtx.removeBullet : () => {};
  const addSubBullet = quotationCtx ? quotationCtx.addSubBullet : () => {};

  const groupAmount = group.unitPrice ? (group.qty || 1) * group.unitPrice : null;
  const hasHeading = group.heading && group.heading.trim() !== "";
  const hasCodeOrPrice = group.code || group.unitPrice;
  const shouldRenderHeadingRow = !readOnly || hasHeading || hasCodeOrPrice;

  return (
    <div className="group-block group/group space-y-0.5 relative py-0.5 pl-1">
      {/* 5 Columns Group Header: Render ONLY if it has content or is in edit mode with a heading */}
      {shouldRenderHeadingRow && (hasHeading || hasCodeOrPrice || !readOnly) && (
        <div className="grid grid-cols-[105px_1fr_40px_105px_105px] gap-2 items-center relative">
          <div className="text-xs text-gray-500">
            <InlineTextField
              value={group.code}
              onChange={(v) => updateGroup(item.id, group.id, { ...group, code: v })}
              placeholder="Code..."
              readOnly={readOnly}
            />
          </div>

          <div className="flex items-center gap-1 relative">
            <InlineTextField
              value={group.heading}
              onChange={(v) => updateGroup(item.id, group.id, { ...group, heading: v })}
              placeholder="ชื่อหมวดหมู่ย่อย (เว้นว่างได้ถ้าต้องการใส่ Bullet เลย)..."
              readOnly={readOnly}
              className="font-bold text-xs text-gray-900 tracking-wide flex-1"
            />

            {!readOnly && (
              <button
                onClick={() => removeGroup(item.id, group.id)}
                className="opacity-0 group-hover/group:opacity-100 absolute -right-4 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-red-500 transition-opacity shrink-0"
                title="ลบหมวดหมู่นี้"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="text-center text-xs font-semibold text-gray-900">
            <InlineTextField
              value={group.qty}
              numeric
              onChange={(v) => updateGroup(item.id, group.id, { ...group, qty: v })}
              readOnly={readOnly}
              className="text-center text-xs font-semibold text-gray-900 w-10"
            />
          </div>

          <div className="text-right text-xs font-semibold text-gray-900">
            {readOnly ? (
              group.unitPrice ? formatTHB(group.unitPrice) : ""
            ) : (
              <InlineTextField
                value={group.unitPrice}
                numeric
                onChange={(v) => updateGroup(item.id, group.id, { ...group, unitPrice: v })}
                readOnly={readOnly}
                className="text-right text-xs text-gray-900 w-20"
              />
            )}
          </div>

          <div className="text-right text-xs font-semibold text-gray-800">
            {groupAmount ? formatTHB(groupAmount) : ""}
          </div>
        </div>
      )}

      {/* Bullets List aligned across 5 Columns */}
      <div className="space-y-0.5">
        {(group.bullets || []).map((bullet) => {
          const bAmount = bullet.unitPrice ? (bullet.qty || 1) * bullet.unitPrice : null;

          return (
            <div key={bullet.id} className="space-y-0.5">
              {/* Bullet Row (5-Column Grid) */}
              <div className="grid grid-cols-[105px_1fr_40px_105px_105px] gap-2 items-center text-[10.5px] group/bullet py-0.5">
                <div className="text-[10.5px] text-gray-500">
                  <InlineTextField
                    value={bullet.code}
                    onChange={(v) => updateBullet(item.id, group.id, bullet.id, { ...bullet, code: v })}
                    placeholder=""
                    readOnly={readOnly}
                  />
                </div>

                <div className="flex items-start gap-1 relative">
                  <span className="shrink-0 text-gray-400 font-bold mt-0.5">•</span>
                  <InlineTextField
                    value={bullet.text}
                    onChange={(v) => updateBullet(item.id, group.id, bullet.id, { ...bullet, text: v })}
                    placeholder="รายละเอียด..."
                    readOnly={readOnly}
                    className="flex-1 text-[10.5px]"
                  />

                  {!readOnly && (
                    <span className="opacity-0 group-hover/bullet:opacity-100 absolute right-0 -top-1 z-10 flex items-center gap-0.5 bg-white/95 border border-gray-200 shadow-xs px-1 py-0.2 rounded transition-opacity">
                      <button
                        onClick={() => addSubBullet(item.id, group.id, bullet.id)}
                        className="text-gray-500 hover:text-emerald-600 p-0.5"
                        title="เพิ่มข้อความย่อย (-)"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => removeBullet(item.id, group.id, bullet.id)}
                        className="text-gray-500 hover:text-red-500 p-0.5"
                        title="ลบรายการนี้"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )}
                </div>

                <div className="text-center text-[10.5px] font-semibold text-gray-900">
                  {readOnly ? (
                    bullet.qty || ""
                  ) : (
                    <InlineTextField
                      value={bullet.qty}
                      numeric
                      onChange={(v) => updateBullet(item.id, group.id, bullet.id, { ...bullet, qty: v })}
                      placeholder=""
                      readOnly={readOnly}
                      className="text-center text-[10.5px] font-semibold text-gray-900 w-8"
                    />
                  )}
                </div>

                <div className="text-right text-[10.5px] font-semibold text-gray-900">
                  {readOnly ? (
                    bullet.unitPrice ? formatTHB(bullet.unitPrice) : ""
                  ) : (
                    <InlineTextField
                      value={bullet.unitPrice}
                      numeric
                      onChange={(v) => updateBullet(item.id, group.id, bullet.id, { ...bullet, unitPrice: v })}
                      placeholder=""
                      readOnly={readOnly}
                      className="text-right text-[10.5px] text-gray-900 w-20"
                    />
                  )}
                </div>

                <div className="text-right text-[10.5px] font-semibold text-gray-800">
                  {bAmount ? formatTHB(bAmount) : ""}
                </div>
              </div>

              {/* Sub-bullets List */}
              {bullet.subBullets?.length > 0 && (
                <div className="space-y-0.5">
                  {bullet.subBullets.map((sb) => {
                    const sbAmount = sb.unitPrice ? (sb.qty || 1) * sb.unitPrice : null;

                    return (
                      <div key={sb.id} className="grid grid-cols-[105px_1fr_40px_105px_105px] gap-2 items-center text-[10px] group/subbullet py-0.5">
                        <div />
                        <div className="flex items-start gap-1 pl-4 relative">
                          <span className="shrink-0 text-gray-400 font-bold mt-0.5">-</span>
                          <InlineTextField
                            value={sb.text}
                            onChange={(v) => {
                              const updatedSub = bullet.subBullets.map((x) =>
                                x.id === sb.id ? { ...x, text: v } : x
                              );
                              updateBullet(item.id, group.id, bullet.id, { ...bullet, subBullets: updatedSub });
                            }}
                            placeholder="รายละเอียดย่อย..."
                            readOnly={readOnly}
                            className="flex-1 text-[10px] text-gray-600"
                          />

                          {!readOnly && (
                            <button
                              onClick={() => {
                                const updatedSub = bullet.subBullets.filter((x) => x.id !== sb.id);
                                updateBullet(item.id, group.id, bullet.id, { ...bullet, subBullets: updatedSub });
                              }}
                              className="opacity-0 group-hover/subbullet:opacity-100 absolute right-0 -top-1 z-10 bg-white/95 border border-gray-200 shadow-xs rounded text-gray-500 hover:text-red-500 p-0.5 transition-opacity"
                              title="ลบ"
                            >
                              <X size={11} />
                            </button>
                          )}
                        </div>

                        <div className="text-center text-[10px] font-semibold text-gray-800">
                          {readOnly ? (
                            sb.qty || ""
                          ) : (
                            <InlineTextField
                              value={sb.qty}
                              numeric
                              onChange={(v) => {
                                const updatedSub = bullet.subBullets.map((x) =>
                                  x.id === sb.id ? { ...x, qty: v } : x
                                );
                                updateBullet(item.id, group.id, bullet.id, { ...bullet, subBullets: updatedSub });
                              }}
                              placeholder=""
                              readOnly={readOnly}
                              className="text-center text-[10px] w-8"
                            />
                          )}
                        </div>

                        <div className="text-right text-[10px] text-gray-800">
                          {readOnly ? (
                            sb.unitPrice ? formatTHB(sb.unitPrice) : ""
                          ) : (
                            <InlineTextField
                              value={sb.unitPrice}
                              numeric
                              onChange={(v) => {
                                const updatedSub = bullet.subBullets.map((x) =>
                                  x.id === sb.id ? { ...x, unitPrice: v } : x
                                );
                                updateBullet(item.id, group.id, bullet.id, { ...bullet, subBullets: updatedSub });
                              }}
                              placeholder=""
                              readOnly={readOnly}
                              className="text-right text-[10px] text-gray-800 w-20"
                            />
                          )}
                        </div>

                        <div className="text-right text-[10px] font-semibold text-gray-800">
                          {sbAmount ? formatTHB(sbAmount) : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!readOnly && hasHeading && (
        <button
          onClick={() => addBullet(item.id, group.id)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 pt-0.5 pl-[113px]"
        >
          <Plus size={12} /> เพิ่ม bullet (•)
        </button>
      )}
    </div>
  );
}

export default function QuotationDocument({ quotation: propQuotation, currentPage }) {
  const quotationCtx = useContext(QuotationDataContext);

  const quotation = quotationCtx?.quotation || propQuotation || {};
  const readOnly = quotationCtx ? quotationCtx.readOnly : true;
  const updateBillTo = quotationCtx ? quotationCtx.updateBillTo : () => {};
  const updateIssuer = quotationCtx ? quotationCtx.updateIssuer : () => {};
  const updateField = quotationCtx ? quotationCtx.updateField : () => {};
  const addLineItem = quotationCtx ? quotationCtx.addLineItem : () => {};

  const { logo } = quotationTemplate;
  const currentIssuer = { ...quotationTemplate.issuer, ...(quotation.issuer || {}) };
  const {
    quotationNo = "CZ26080001",
    quotationDate = "17 Aug 2026",
    priceValidity = "15 Sep 2026",
    deliveryTerm = "7 days",
    creditTerm = "30 days",
    billTo = {},
    lineItems: rawLineItems = [],
    vatRate = 7,
    senderName = "Narin Rattanavajij (PoP)",
    senderPhone = "+6682-44-686-95",
  } = quotation;

  const lineItems = rawLineItems || [];

  // Paginate line items and groups at the block level
  const pagesList = paginateQuotationBlocks(lineItems);
  const totalPages = pagesList.length;

  const displayedPages = currentPage
    ? pagesList.filter((_, idx) => idx === Math.min(Math.max(currentPage, 1), totalPages) - 1)
    : pagesList;

  return (
    <div className="quotation-document-wrapper block w-[794px] mx-auto space-y-8">
      {displayedPages.map((pageData) => {
        const pageIdx = pagesList.indexOf(pageData);
        const isFirstPage = pageIdx === 0;
        const pageNumber = pageIdx + 1;
        const isLastPage = pageNumber === totalPages;
        const { blocks, hasSummary } = pageData;

        return (
          <div
            key={pageIdx}
            className="bg-white shadow-xl rounded-sm text-gray-900 px-8 py-6 font-sans flex flex-col justify-between overflow-hidden relative"
            style={{ width: 794, height: 1122, minHeight: 1122, boxSizing: "border-box" }}
          >
            {/* Header Background Graphic (bg1.png) */}
            {isFirstPage && (
              <div
                className="absolute top-0 left-0 right-0 w-full h-[115px] pointer-events-none z-0 bg-no-repeat bg-cover"
                style={{
                  backgroundImage: "url('/bg1.png')",
                  backgroundSize: "100% 100%",
                  backgroundPosition: "top center",
                }}
              />
            )}

            <div className="flex-1 flex flex-col justify-start space-y-2 overflow-hidden relative z-10">
              {/* Header Section */}
              {isFirstPage ? (
                <>
                  <div className="flex items-start justify-between mb-0 pb-0 gap-4 pt-3" style={{ breakAfter: "avoid" }}>
                    {/* Left Brand Area: Logo + Uniform 4-Row Company Info Container */}
                    <div className="flex items-start gap-2.5 shrink-0">
                      <Image src={logo || "/quotation.png"} alt="logo" width={138} height={90} style={{ width: "auto", height: 62 }} className="object-contain shrink-0" />
                      
                      {/* Uniform spacing between all 4 lines — equal distance */}
                      <div className="flex flex-col w-[310px] max-w-[310px] shrink-0 space-y-1.5">
                        {/* Line 1: CREST ZENDO CO., LTD. */}
                        <InlineTextField
                          value={currentIssuer.name}
                          onChange={(v) => updateIssuer("name", v)}
                          readOnly={readOnly}
                          className="font-bold text-gray-900 leading-none truncate block w-full"
                          style={{ fontSize: 12, lineHeight: 1 }}
                        />

                        {/* Line 2: บริษัท เครสท์ เซนโด จำกัด */}
                        <InlineTextField
                          value={currentIssuer.nameTh}
                          onChange={(v) => updateIssuer("nameTh", v)}
                          readOnly={readOnly}
                          className="font-bold text-gray-900 leading-none truncate block w-full"
                          style={{ fontSize: 12, lineHeight: 1 }}
                        />

                        {/* Line 3: Address */}
                        <InlineTextField
                          value={currentIssuer.address || "The Connect 37, 8/40 Soi Chang Akat Uthit 10 Yaek 1-2, Donmueang, Bangkok 10210"}
                          onChange={(v) => updateIssuer("address", v)}
                          readOnly={readOnly}
                          className="text-gray-600 tracking-tight whitespace-nowrap block w-full leading-none font-medium"
                          style={{ fontSize: 8.5, lineHeight: 1 }}
                        />

                        {/* Line 4: เลขประจำตัวผู้เสียภาษีอากร */}
                        <div className="flex items-center gap-1 leading-none tracking-tight whitespace-nowrap" style={{ fontSize: 9.5, lineHeight: 1 }}>
                          <span className="shrink-0 font-medium text-gray-600 pl-0.5" style={{ fontSize: 9.5 }}>เลขประจำตัวผู้เสียภาษีอากร:</span>
                          <span
                            className="inline-flex items-center justify-center px-1.5 py-0 text-white font-semibold tracking-normal rounded-full shrink-0 h-[13px]"
                            style={{ backgroundColor: "#0F4C35", fontSize: 9 }}
                          >
                            <InlineTextField
                              value={currentIssuer.taxIdNumber || "0105558073755"}
                              onChange={(v) => updateIssuer("taxIdNumber", v)}
                              readOnly={readOnly}
                              className="font-semibold text-white tracking-normal text-center w-[75px] p-0 leading-none"
                              style={{ fontSize: 9, lineHeight: 1 }}
                            />
                          </span>
                          <span className="text-gray-600 font-normal shrink-0" style={{ fontSize: 9.5 }}>
                            <InlineTextField
                              value={currentIssuer.taxBranch || "(สำนักงานใหญ่)"}
                              onChange={(v) => updateIssuer("taxBranch", v)}
                              readOnly={readOnly}
                              className="text-gray-600 font-normal w-[75px]"
                              style={{ fontSize: 9.5 }}
                            />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: QUOTATION Title — aligned flush with right edge of table below */}
                    <div className="text-right shrink-0 ml-auto w-[280px]">
                      <h1 className="text-right leading-none pt-2.5" style={{ color: "#0F4C35" }}>
                        <InlineTextField
                          value={quotation.docTitle || "QUOTATION"}
                          onChange={(v) => updateField("docTitle", v)}
                          readOnly={readOnly}
                          placeholder="QUOTATION"
                          className="w-[280px] text-[33px] font-black tracking-wider text-right leading-none block p-0"
                          style={{ color: "#0F4C35", textAlign: "right" }}
                        />
                      </h1>
                    </div>
                  </div>

                  {/* Compact 5 Symmetric Rows Grid with Top and Bottom Borders */}
                  <div className="grid grid-cols-2 gap-6 mb-0 mt-0 pt-3 pb-2.5" style={{ breakAfter: "avoid" }}>
                    {/* Left Table (5 Rows) */}
                    <div>
                      <table className="w-full border-collapse" style={{ fontSize: 11, lineHeight: "21px" }}>
                        <colgroup>
                          <col style={{ width: 62 }} />
                          <col />
                        </colgroup>
                        <tbody>
                          {[
                            { label: "To", value: billTo.companyName, field: "companyName", placeholder: "ชื่อบริษัทลูกค้า..." },
                            { label: "Attn.", value: billTo.attn, field: "attn", placeholder: "ชื่อผู้ติดต่อ..." },
                            { label: "End User", value: billTo.endUser, field: "endUser", placeholder: "End User..." },
                            { label: "Subject", value: billTo.subject, field: "subject", placeholder: "หัวข้อเรื่อง..." },
                            { label: "AM", value: billTo.am, field: "am", placeholder: "ชื่อ AM..." },
                          ].map(({ label, value, field, placeholder }) => (
                            <tr key={field} style={{ height: 21 }}>
                              <td
                                className="font-semibold align-middle py-0"
                                style={{ color: "#0F4C35", fontSize: 11, lineHeight: "21px", whiteSpace: "nowrap", verticalAlign: "middle" }}
                              >
                                {label}
                              </td>
                              <td className="py-0" style={{ verticalAlign: "middle" }}>
                                <InlineTextField
                                  value={value}
                                  onChange={(v) => updateBillTo(field, v)}
                                  readOnly={readOnly}
                                  placeholder={placeholder}
                                  className="font-normal text-gray-800 w-full"
                                  style={{ fontSize: 11, lineHeight: "21px" }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Right Table — same row height as left, no negative margin hack */}
                    <div>
                      <table className="text-[11px] w-full border-collapse ml-auto" style={{ maxWidth: 212 }}>
                        <colgroup>
                          <col style={{ width: "45%" }} />
                          <col style={{ width: "55%" }} />
                        </colgroup>
                        <tbody>
                          <tr style={{ height: 21 }}>
                            <td className="font-semibold align-middle py-0 whitespace-nowrap" style={{ color: "#0F4C35", fontSize: 11, lineHeight: "21px" }}>Quotation No.</td>
                            <td className="text-right align-middle py-0">
                              <div className="flex items-center justify-end gap-1">
                                <span
                                  className="inline-flex items-center px-2 py-0.5 text-white font-semibold tracking-normal rounded-md shrink-0 h-[18px]"
                                  style={{ backgroundColor: "#0F4C35", fontSize: 11 }}
                                >
                                  <InlineTextField
                                    value={quotationNo}
                                    onChange={(v) => updateField("quotationNo", v)}
                                    readOnly={readOnly}
                                    placeholder="CZ26080001"
                                    className="font-semibold text-white tracking-normal text-center w-[82px]"
                                    style={{ fontSize: 11 }}
                                  />
                                </span>
                                <span
                                  className="inline-flex items-center px-1.5 py-0.5 text-white font-semibold tracking-normal rounded-md shrink-0 h-[18px]"
                                  style={{ backgroundColor: "#0F4C35", fontSize: 11 }}
                                >
                                  <InlineTextField
                                    value={quotation.revision || "01"}
                                    onChange={(v) => updateField("revision", v)}
                                    readOnly={readOnly}
                                    placeholder="01"
                                    className="font-semibold text-white tracking-normal text-center w-[22px]"
                                    style={{ fontSize: 11 }}
                                  />
                                </span>
                              </div>
                            </td>
                          </tr>
                          {[
                            { label: "Quotation Date", content: <InlineDatePicker value={quotationDate} onChange={(v) => updateField("quotationDate", v)} readOnly={readOnly} className="font-normal text-[11px] text-gray-800 text-right" /> },
                            { label: "Price Validity", content: <InlineDatePicker value={priceValidity} onChange={(v) => updateField("priceValidity", v)} readOnly={readOnly} className="font-normal text-[11px] text-gray-800 text-right" /> },
                            { label: "Delivery Term", content: <InlineTermSelect value={deliveryTerm} onChange={(v) => updateField("deliveryTerm", v)} readOnly={readOnly} options={["7 days", "14 days", "30 days", "60 days", "Immediate"]} className="font-normal text-[11px] text-gray-800 text-right" /> },
                            { label: "Credit Term", content: <InlineTermSelect value={creditTerm} onChange={(v) => updateField("creditTerm", v)} readOnly={readOnly} options={["30 days", "45 days", "60 days", "90 days", "Cash / 100% Advance"]} className="font-normal text-[11px] text-gray-800 text-right" /> },
                          ].map(({ label, content }) => (
                            <tr key={label} style={{ height: 21 }}>
                              <td className="font-semibold align-middle py-0 whitespace-nowrap" style={{ color: "#0F4C35", fontSize: 11, lineHeight: "21px" }}>{label}</td>
                              <td className="text-right align-middle py-0">{content}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                /* Page 2+ Continued Compact Header */
                <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-1.5">
                  <div className="flex items-center gap-2">
                    <Image src={logo || "/quotation.png"} alt="logo" width={95} height={26} className="w-[100px] h-auto object-contain shrink-0" />
                    <span className="text-[11px] font-semibold text-gray-600">| ใบเสนอราคา (ต่อหน้า {pageNumber})</span>
                  </div>
                  <div className="text-right text-xs font-semibold text-gray-800">
                    {quotationNo}
                  </div>
                </div>
              )}

              {/* 5-Column Description Table Header (Refined lighter font size & weight) */}
              <div
                className="grid grid-cols-[105px_1fr_40px_105px_105px] gap-2 px-3 py-1.5 text-white text-[10px] font-semibold tracking-wider rounded-t-md mb-1 items-center"
                style={{ backgroundColor: "#0F4C35" }}
              >
                <span>PRODUCT CODE</span>
                <span>DESCRIPTION {pageNumber > 1 ? "(Continued)" : ""}</span>
                <span className="text-center">QTY</span>
                <span className="text-right">PRICE</span>
                <span className="text-right">AMOUNT</span>
              </div>

              {/* Description Table Flow Chunks */}
              <div className="border border-t-0 border-gray-200/90 px-3 py-1.5 rounded-b-md min-h-[160px]">
                {blocks.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 text-xs italic font-medium">
                    [ ระบุรายการสินค้า / บริการ ]
                  </div>
                ) : (
                  blocks.map((block, bIdx) => {
                    const nextBlock = blocks[bIdx + 1];
                    const isEndOfItemBlock = !nextBlock || nextBlock.type === "item-header";

                    if (block.type === "item-header") {
                      return (
                        <div
                          key={block.id}
                          className={isEndOfItemBlock ? "pb-1.5 mb-1.5" : ""}
                        >
                          <LineItemHeaderRow item={block.item} />
                        </div>
                      );
                    }
                    if (block.type === "group-block") {
                      return (
                        <div
                          key={block.id}
                          className={isEndOfItemBlock ? "pb-1.5 mb-1.5" : ""}
                        >
                          <GroupBlockRow item={block.item} group={block.group} />
                        </div>
                      );
                    }
                    return null;
                  })
                )}

                {/* Add Line Item Button (shown when editable on the last page of table items) */}
                {!readOnly && (isLastPage || totalPages === 1) && (
                  <button
                    onClick={addLineItem}
                    className="w-full h-8 mt-2 rounded-lg border border-dashed border-gray-300 text-[11.5px] font-semibold text-gray-500 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/50 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus size={13} /> เพิ่มรายการสินค้า / บริการใหม่
                  </button>
                )}
              </div>

              {/* Dynamic Remarks Section directly below table (tightly aligned to table bottom) */}
              {hasSummary && (() => {
                const currentRemarksList = Array.isArray(quotation.remarksList)
                  ? quotation.remarksList
                  : (quotation.remarks ? [quotation.remarks] : []);
                
                const activeRemarks = currentRemarksList.filter((r) => r && r.trim().length > 0);

                // In ReadOnly mode (Preview / Export PDF), hide completely if there are no remarks
                if (readOnly && activeRemarks.length === 0) {
                  return null;
                }

                return (
                  <div className="mt-1 mb-0.5 text-left px-1">
                    {/* Header + Add button */}
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-[10px] text-gray-800 tracking-wide">Remarks :</span>
                      {!readOnly && (
                        <button
                          onClick={() => {
                            updateField("remarksList", [...currentRemarksList, ""]);
                          }}
                          className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded transition-colors"
                          title="เพิ่มข้อความหมายเหตุ"
                        >
                          <Plus size={10} /> เพิ่ม Remark
                        </button>
                      )}
                    </div>

                    {/* Remarks items */}
                    {currentRemarksList.length > 0 ? (
                      <div className="space-y-0.5 pl-1">
                        {currentRemarksList.map((rem, idx) => {
                          if (readOnly && !rem?.trim()) return null;
                          return (
                            <div key={idx} className="flex items-center gap-1.5 group/rem text-[9.5px]">
                              <span className="text-red-500 font-bold">•</span>
                              <InlineTextField
                                value={rem}
                                onChange={(v) => {
                                  const updated = [...currentRemarksList];
                                  updated[idx] = v;
                                  updateField("remarksList", updated);
                                }}
                                readOnly={readOnly}
                                placeholder="ระบุหมายเหตุ (เช่น Payment: Annually)..."
                                className="text-[9.5px] text-red-600 font-semibold flex-1 leading-tight"
                              />
                              {!readOnly && (
                                <button
                                  onClick={() => {
                                    const updated = currentRemarksList.filter((_, i) => i !== idx);
                                    updateField("remarksList", updated);
                                  }}
                                  className="opacity-70 hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-opacity"
                                  title="ลบหมายเหตุนี้"
                                >
                                  <Trash2 size={11} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      !readOnly && (
                        <div className="text-[9px] text-gray-400 italic pl-1">
                          ไม่มีหมายเหตุ (สามารถกด &quot;+ เพิ่ม Remark&quot; ด้านบนเพื่อเพิ่มได้)
                        </div>
                      )
                    )}
                  </div>
                );
              })()}

              {/* Summary Block (Sign-off, Customer Signature, PRICE SUMMARY) */}
              {hasSummary && (
                <div className="mt-auto pt-2 mb-2" style={{ breakInside: "avoid" }}>
                  {/* 3-Column Bottom Summary Section — equal width columns */}
                  <div className="grid grid-cols-3 gap-3 items-stretch">
                    {/* Column 1: Sign-off / Best regards */}
                    <div className="border border-gray-200 rounded-lg p-2.5 bg-white shadow-2xs h-full flex flex-col justify-between text-left">
                      <div>
                        <div className="border-b border-gray-100 pb-1 mb-2">
                          <p className="text-[10.5px] font-bold" style={{ color: "#0F4C35" }}>
                            Best regards,
                          </p>
                        </div>
                        {/* Uniform space-y-1.5 for all 4 fields — strictly 1 row per item */}
                        <div className="space-y-1.5 text-[10px]">
                          <div className="block leading-tight">
                            <InlineTextField
                              value={senderName}
                              onChange={(v) => updateField("senderName", v)}
                              readOnly={readOnly}
                              placeholder="ชื่อ-นามสกุล ผู้เสนอราคา..."
                              className="font-bold text-[11px] text-gray-900 block w-full leading-tight"
                            />
                          </div>
                          <div className="block leading-tight">
                            <InlineTextField
                              value={quotation.senderPosition || ""}
                              onChange={(v) => updateField("senderPosition", v)}
                              readOnly={readOnly}
                              placeholder="ตำแหน่ง (เช่น Account Manager)..."
                              className="text-gray-700 block text-[8.5px] w-full leading-tight tracking-tight"
                              style={{ fontSize: 8.5 }}
                            />
                          </div>
                          <div className="block leading-tight">
                            <InlineTextField
                              value={quotation.senderEmail || ""}
                              onChange={(v) => updateField("senderEmail", v)}
                              readOnly={readOnly}
                              placeholder="Email..."
                              className="text-gray-600 block text-[8.5px] w-full leading-tight tracking-tight"
                              style={{ fontSize: 8.5 }}
                            />
                          </div>
                          <div className="block leading-tight">
                            <InlineTextField
                              value={senderPhone}
                              onChange={(v) => updateField("senderPhone", v)}
                              readOnly={readOnly}
                              placeholder="Mobile / เบอร์โทรศัพท์..."
                              className="text-gray-600 block text-[8.5px] w-full leading-tight tracking-tight"
                              style={{ fontSize: 8.5 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Approve to purchase */}
                    <div className="border border-gray-200 rounded-lg p-2.5 bg-white shadow-2xs h-full flex flex-col justify-between text-center">
                      <div>
                        <div className="border-b border-gray-100 pb-1 mb-2">
                          <p className="text-[10.5px] font-bold text-center" style={{ color: "#0F4C35" }}>
                            Approve to purchase
                          </p>
                        </div>
                      </div>
                      {/* Signature line */}
                      <div className="flex flex-col items-center justify-end space-y-1 mt-auto pt-3 pb-1">
                        <div className="w-[85%] border-b border-gray-400 border-dashed mb-1" />
                        <p className="text-[9.5px] font-semibold text-gray-700 leading-none">Authorized Signature / Date</p>
                      </div>
                    </div>

                    {/* Column 3: Price Summary Box */}
                    <PriceSummaryBlock
                      lineItems={lineItems}
                      vatRate={vatRate}
                      specialDiscount={quotation.specialDiscount}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer on EVERY Page */}
            <QuotationFooter pageNumber={pageNumber} totalPages={totalPages} issuerData={quotation.issuer} />
          </div>
        );
      })}
    </div>
  );
}