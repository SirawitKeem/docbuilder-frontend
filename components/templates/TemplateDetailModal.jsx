"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  Eye,
  CheckCircle2,
  Layers,
  Edit3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ICON_MAP } from "./CategoryManagerModal";
import UniversalTemplateRenderer from "@/components/document/UniversalTemplateRenderer";
import FabricPrintRenderer from "@/components/document/FabricPrintRenderer";
import { getCanvasPreset } from "@/lib/editor/canvasPresets";
import { QuotationDataProvider } from "@/context/QuotationDataContext";
import QuotationDocument from "@/components/document/quotation/QuotationDocument";
import { DocumentFieldsProvider } from "@/context/DocumentFieldsContext";
import DocumentHeader from "@/components/document/DocumentHeader";
import DocumentFooter from "@/components/document/DocumentFooter";

import { DynamicContractPage } from "@/components/document/DynamicContractPage";

const emptyQuotationPreviewData = {
  id: "preview",
  quotationNo: "QT-YYYYMM-XXXX",
  revision: "01",
  quotationDate: "",
  priceValidity: "",
  deliveryTerm: "",
  creditTerm: "",
  billTo: {
    companyName: "",
    attn: "",
    endUser: "",
    subject: "",
    am: "",
  },
  lineItems: [],
  vatRate: 7,
  specialDiscount: 0,
  remarks: "",
  remarksList: [],
  senderName: "",
  senderPosition: "",
  senderEmail: "",
  senderPhone: "",
};

function AuthenticDocumentPreview({ template, currentPage = 1, totalPages = 1, scale = 0.58 }) {
  const catId = (template.categoryId || "").toLowerCase();
  const tmplId = (template.id || "").toLowerCase();

  const isFabricCanvas = Boolean(
    template.pages &&
    Array.isArray(template.pages) &&
    template.pages.length > 0 &&
    template.pages[0]?.json
  );

  if (isFabricCanvas) {
    const preset = getCanvasPreset(
      template.canvasPreset || (template.editorType === "slide" ? "slide-16-9" : "a4-portrait")
    );
    const isSquare = preset.width === preset.height;
    const targetWidth = isSquare ? 430 : (preset.width > 900 ? 470 : 430);
    const canvasScale = targetWidth / preset.width;

    return (
      <div
        className="origin-top rounded-sm shadow-xl border border-gray-300 overflow-hidden bg-white"
        style={{
          width: Math.round(preset.width * canvasScale),
          height: Math.round(preset.height * canvasScale),
        }}
      >
        <div
          style={{
            width: preset.width,
            height: preset.height,
            transform: `scale(${canvasScale})`,
            transformOrigin: "top left",
          }}
        >
          <FabricPrintRenderer
            template={template}
            values={{}}
            watermark="none"
          />
        </div>
      </div>
    );
  }

  const isLandscape = template.orientation === "landscape";
  const effectiveScale = isLandscape ? 0.48 : scale;

  if (catId === "quotation" || tmplId.includes("quotation")) {
    return (
      <div
        className="origin-top rounded-sm shadow-xl border border-gray-300 overflow-hidden"
        style={{
          width: 794 * effectiveScale,
          minHeight: 1123 * effectiveScale,
        }}
      >
        <div
          style={{
            width: 794,
            height: 1123,
            transform: `scale(${effectiveScale})`,
            transformOrigin: "top left",
          }}
        >
          <QuotationDataProvider initialQuotation={emptyQuotationPreviewData} defaultReadOnly={true}>
            <div className="bg-white overflow-hidden text-left font-noto-looped w-[794px] h-[1123px]">
              <QuotationDocument currentPage={currentPage} />
            </div>
          </QuotationDataProvider>
        </div>
      </div>
    );
  }

  const isNdaTemplate = catId === "nda"
    || tmplId === "nda"
    || tmplId.includes("-nda-")
    || tmplId.startsWith("nda-");

  if (isNdaTemplate) {
    return (
      <div
        className="origin-top rounded-sm shadow-xl border border-gray-300 overflow-hidden"
        style={{
          width: 794 * effectiveScale,
          minHeight: 1123 * effectiveScale,
        }}
      >
        <div
          style={{
            width: 794,
            height: 1123,
            transform: `scale(${effectiveScale})`,
            transformOrigin: "top left",
          }}
        >
          <DocumentFieldsProvider initialValues={{}} defaultReadOnly={true}>
            <div className="bg-white text-left font-noto-looped px-14 pt-10 pb-6 flex flex-col justify-between overflow-hidden w-[794px] h-[1123px]">
              <DocumentHeader logo="/quotation.png" />
              <div className="flex-1 min-h-0 overflow-hidden text-gray-900 text-sm">
                <DynamicContractPage templateId="nda" pageNumber={currentPage} />
              </div>
              <DocumentFooter currentPage={currentPage} totalPages={4} />
            </div>
          </DocumentFieldsProvider>
        </div>
      </div>
    );
  }

  if (catId === "partner" || tmplId.includes("partner")) {
    return (
      <div
        className="origin-top rounded-sm shadow-xl border border-gray-300 overflow-hidden"
        style={{
          width: 794 * effectiveScale,
          minHeight: 1123 * effectiveScale,
        }}
      >
        <div
          style={{
            width: 794,
            height: 1123,
            transform: `scale(${effectiveScale})`,
            transformOrigin: "top left",
          }}
        >
          <DocumentFieldsProvider initialValues={{}} defaultReadOnly={true}>
            <div className="bg-white text-left font-noto-looped px-14 pt-10 pb-6 flex flex-col justify-between overflow-hidden w-[794px] h-[1123px]">
              <DocumentHeader logo="/quotation.png" />
              <div className="flex-1 min-h-0 overflow-hidden text-gray-900 text-sm">
                <DynamicContractPage templateId="partner" pageNumber={currentPage} />
              </div>
              <DocumentFooter currentPage={currentPage} totalPages={5} />
            </div>
          </DocumentFieldsProvider>
        </div>
      </div>
    );
  }

  if (catId === "distributor" || tmplId.includes("distributor")) {
    return (
      <div
        className="origin-top rounded-sm shadow-xl border border-gray-300 overflow-hidden"
        style={{
          width: 794 * effectiveScale,
          minHeight: 1123 * effectiveScale,
        }}
      >
        <div
          style={{
            width: 794,
            height: 1123,
            transform: `scale(${effectiveScale})`,
            transformOrigin: "top left",
          }}
        >
          <DocumentFieldsProvider initialValues={{}} defaultReadOnly={true}>
            <div className="bg-white text-left font-noto-looped px-14 pt-10 pb-6 flex flex-col justify-between overflow-hidden w-[794px] h-[1123px]">
              <DocumentHeader logo="/quotation.png" />
              <div className="flex-1 min-h-0 overflow-hidden text-gray-900 text-sm">
                <DynamicContractPage templateId="distributor" pageNumber={currentPage} />
              </div>
              <DocumentFooter currentPage={currentPage} totalPages={5} />
            </div>
          </DocumentFieldsProvider>
        </div>
      </div>
    );
  }

  if (catId === "notification" || tmplId.includes("notification") || tmplId.includes("relocation")) {
    return (
      <div
        className="origin-top rounded-sm shadow-xl border border-gray-300 overflow-hidden"
        style={{
          width: 794 * effectiveScale,
          minHeight: 1123 * effectiveScale,
        }}
      >
        <div
          style={{
            width: 794,
            height: 1123,
            transform: `scale(${effectiveScale})`,
            transformOrigin: "top left",
          }}
        >
          <DocumentFieldsProvider initialValues={{}} defaultReadOnly={true}>
            <div className="bg-white text-left font-noto-looped px-14 pt-10 pb-6 flex flex-col justify-between overflow-hidden w-[794px] h-[1123px]">
              <DocumentHeader logo="/quotation.png" />
              <div className="flex-1 min-h-0 overflow-hidden text-gray-900 text-sm">
                <DynamicContractPage templateId="notification" pageNumber={1} />
              </div>
              <DocumentFooter currentPage={1} totalPages={1} />
            </div>
          </DocumentFieldsProvider>
        </div>
      </div>
    );
  }

  return (
    <UniversalTemplateRenderer
      template={template}
      scale={effectiveScale}
      currentPage={currentPage}
      totalPages={totalPages}
    />
  );
}

export default function TemplateDetailModal({ template, onClose }) {
  const [currentPage, setCurrentPage] = useState(1);

  if (!template) return null;

  const iconName = template.icon || "FileText";
  const IconComp = ICON_MAP[iconName] || ICON_MAP.FileText;

  const catId = (template.categoryId || "").toLowerCase();
  const tmplId = (template.id || "").toLowerCase();
  const isNdaTemplate = catId === "nda"
    || tmplId === "nda"
    || tmplId.includes("-nda-")
    || tmplId.startsWith("nda-");

  let totalPages = Array.isArray(template.pages) && template.pages.length > 0
    ? template.pages.length
    : 1;
  if (totalPages === 1 && isNdaTemplate) totalPages = 4;
  else if (catId === "partner" || tmplId.includes("partner")) totalPages = 5;
  else if (catId === "distributor" || tmplId.includes("distributor")) totalPages = 5;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] text-[#7C3AED] border border-[#EDE9FE] flex items-center justify-center">
              <IconComp size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C3AED] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                  {template.badge || "เทมเพลต"}
                </span>
                <span className="text-xs text-gray-400 font-medium">รหัส: {template.id}</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-gray-900 leading-tight mt-0.5">
                {template.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: 2-Column Split */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start bg-slate-100/60">
          {/* Left Column: Authentic Document Renderer */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Eye size={13} className="text-[#7C3AED]" />
                <span>ตัวอย่างโครงสร้างหน้าเอกสารจริง (Authentic Document UI)</span>
              </span>
              <span className="text-[10px] text-gray-400">
                {template.orientation === "landscape" ? "A4 แนวนอน" : "A4 แนวตั้ง"}
              </span>
            </div>

            {/* Multi-Page Navigation Toolbar (if totalPages > 1) */}
            {totalPages > 1 && (
              <div className="bg-white rounded-xl border border-gray-200/80 p-2 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="หน้าก่อนหน้า"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <span className="text-xs font-bold text-gray-800 px-2">
                    หน้า {currentPage} จาก {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="หน้าถัดไป"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>

                {/* Page Number Pills */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => setCurrentPage(pg)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pg
                          ? "bg-[#7C3AED] text-white shadow-2xs"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                      }`}
                    >
                      {pg}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Render Canvas */}
            <div className="p-4 rounded-2xl bg-gray-200/60 border border-gray-300/80 flex justify-center shadow-inner overflow-hidden">
              <AuthenticDocumentPreview template={template} currentPage={currentPage} totalPages={totalPages} scale={0.58} />
            </div>
          </div>

          {/* Right Column: Specification & Structure Details */}
          <div className="lg:col-span-5 space-y-4">
            {/* Description Card */}
            <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs space-y-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                วัตถุประสงค์และการใช้งาน
              </span>
              <p className="text-xs text-gray-700 leading-relaxed">
                {template.description || "เทมเพลตสำหรับใช้งานในองค์กร ปรับแต่งได้อิสระ 100%"}
              </p>
            </div>

            {/* Blocks / Elements Summary */}
            <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Layers size={13} className="text-[#7C3AED]" />
                  <span>โครงสร้างบล็อกในเทมเพลต ({template.blocks?.length || 0})</span>
                </span>
                <span className="text-[10px] text-gray-400">ปรับแต่งได้แบบ Canva</span>
              </div>

              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {(template.blocks || []).map((b, i) => (
                  <div
                    key={b.id || i}
                    className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-gray-800">{b.title || b.type}</span>
                    <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                      {b.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Security & Theme */}
            <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs space-y-2 text-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                ข้อมูลจำเพาะและรูปแบบเอกสาร
              </span>
              <div className="space-y-1.5 text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>
                    รูปแบบ:{" "}
                    <strong className="text-gray-800 font-semibold">
                      {template.editorType === "sheet"
                        ? "สเปรดชีตตารางคำนวณ (.xlsx)"
                        : template.editorType === "slide"
                        ? "งานนำเสนอสไลด์ (16:9 Presentation)"
                        : "เอกสารทางการ A4 (Portrait PDF)"}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>
                    การจัดวาง:{" "}
                    {template.editorType === "sheet"
                      ? "ตารางเวิร์กชีตและสูตร"
                      : template.editorType === "slide" || template.orientation === "landscape"
                      ? "แนวนอน (16:9 Landscape)"
                      : "แนวตั้ง (A4 Portrait)"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>
                    ขนาด/จำนวน:{" "}
                    {template.editorType === "sheet"
                      ? "มัลติเซลล์และแถวตารางแบบไดนามิก"
                      : template.editorType === "slide"
                      ? `${totalPages} สไลด์ (16:9 Widescreen)`
                      : `${totalPages} หน้า A4`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>
                    {template.editorType === "sheet"
                      ? "การคำนวณสูตรและสรุปยอดอัตโนมัติ"
                      : "ระบบลงนามดิจิทัลและตรายาง (Digital Signature)"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-border bg-surface flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-9 px-4 rounded-[8px] border border-border bg-surface hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer shadow-2xs"
          >
            ปิดหน้าต่าง
          </button>

          <div className="flex items-center gap-2">
            <Link
              href={`/templates/new?edit=${template.id}`}
              className="primary-button inline-flex items-center gap-2 h-9 px-4 rounded-[8px] text-white text-xs font-medium shadow-xs hover:opacity-95 transition-all cursor-pointer"
            >
              <Edit3 size={14} />
              <span>แก้ไขและปรับแต่งเทมเพลตนี้</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
