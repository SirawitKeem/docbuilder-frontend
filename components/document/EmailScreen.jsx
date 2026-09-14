"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  ArrowLeft,
  Mail,
  Tag,
  MessageSquare,
  FileText,
  Eye,
  Maximize2,
  CheckCircle2,
  ShieldCheck,
  Info,
  Loader2,
  Send,
  X,
  Globe,
  Image as ImageIcon,
} from "lucide-react";
import { templateRegistry } from "@/lib/templates/registry";
import { DocumentFieldsProvider } from "@/context/DocumentFieldsContext";
import { paginateQuotationLineItems } from "@/lib/quotationHelpers";
import QuotationDocument from "./quotation/QuotationDocument";
import DocumentHeader from "./DocumentHeader";
import DocumentFooter from "./DocumentFooter";

export default function EmailScreen({
  documentId,
  defaultSubject,
  fileName,
  attachmentBase64,
  pdfBase64,
  templateId = "nda",
  templateName,
  values = {},
  onBack,
  onSent,
}) {
  const { t } = useLanguage();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState(defaultSubject || "");
  const [message, setMessage] = useState(
    "เรียนผู้รับ\n\nกรุณาตรวจสอบเอกสารแนบท้ายอีเมลนี้\n\nขอบคุณครับ"
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("pdf");
  const [formatAttachments, setFormatAttachments] = useState({
    pdf: attachmentBase64 || pdfBase64,
    html: null,
    webp: null,
  });
  const [loadingFormat, setLoadingFormat] = useState(false);

  const baseFileName = (fileName || schema?.fullName || "document").replace(/\.(pdf|html|webp)$/i, "");
  const currentAttachmentName = `${baseFileName}.${selectedFormat}`;
  const activeAttachment = formatAttachments[selectedFormat];
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to);

  const entry = templateRegistry[templateId] || templateRegistry["nda"];
  const { schema, pages, DocumentComponent } = entry || {};
  const isQuotation = templateId === "quotation" || schema?.type === "quotation" || Boolean(DocumentComponent);
  const quotationPages = isQuotation ? paginateQuotationLineItems(values?.lineItems || []) : [];
  const pageCount = isQuotation ? (quotationPages.length || 1) : (pages ? pages.length : 4);
  const Page1Component = pages ? pages[0] : null;

  const handleSelectFormat = async (fmt) => {
    setSelectedFormat(fmt);
    setError("");
    if (!formatAttachments[fmt]) {
      setLoadingFormat(true);
      try {
        const res = await fetch("/api/export-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId,
            values,
            quotationData: values,
            fileName: `${baseFileName}.${fmt}`,
            format: fmt,
          }),
        });
        if (!res.ok) throw new Error(`ไม่สามารถเตรียมไฟล์ .${fmt} ได้`);
        const blob = await res.blob();
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result;
            resolve(typeof result === "string" ? result.split(",")[1] : "");
          };
          reader.readAsDataURL(blob);
        });
        setFormatAttachments((prev) => ({ ...prev, [fmt]: base64 }));
      } catch (err) {
        console.error("Generate format error:", err);
        setError(`ไม่สามารถสร้างไฟล์แนบ .${fmt} ได้: ${err.message}`);
      } finally {
        setLoadingFormat(false);
      }
    }
  };

  const handleSend = async () => {
    setError("");
    if (!isValidEmail) {
      setError("กรุณากรอกอีเมลผู้รับให้ถูกต้อง");
      return;
    }
    if (!activeAttachment) {
      setError("ไฟล์แนบยังเตรียมไม่เสร็จ กรุณารอสักครู่");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          to,
          subject,
          message,
          attachmentBase64: activeAttachment,
          attachmentName: currentAttachmentName,
          contentType:
            selectedFormat === "webp"
              ? "image/webp"
              : selectedFormat === "html"
              ? "text/html"
              : "application/pdf",
          templateId,
          templateName: schema?.fullName || templateName,
          values,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ส่งไม่สำเร็จ");
      onSent?.({ to, fileName: currentAttachmentName });
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/70">
      {/* Top Bar Navigation */}
      <div className="h-16 border-b border-gray-200 bg-white flex items-center gap-4 px-8 shrink-0 shadow-2xs">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
          title="ย้อนกลับ"
        >
          <ArrowLeft size={20} />
        </button>
        <p className="text-base font-bold text-gray-900">ส่งเอกสารทางอีเมล</p>
      </div>

      {/* Main Content Layout - 2 Columns */}
      <div className="flex-1 overflow-auto max-w-7xl w-full mx-auto p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Email Form Card (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-card space-y-6">
            
            {/* Step 1: Recipient Email */}
            <div>
              <div className="mb-2">
                <h3 className="text-sm font-bold text-gray-900">
                  {t('email.recipientLabel')}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">กรอกอีเมลของผู้รับที่ต้องการส่งเอกสาร</p>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
                />
              </div>
            </div>

            {/* Step 2: Email Subject */}
            <div>
              <div className="mb-2">
                <h3 className="text-sm font-bold text-gray-900">
                  {t('email.subjectLabel')}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">กำหนดหัวข้อของอีเมลที่ผู้รับจะเห็น</p>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Tag size={18} />
                </div>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all font-medium text-gray-800"
                />
              </div>
            </div>

            {/* Step 3: Email Message */}
            <div>
              <div className="mb-2">
                <h3 className="text-sm font-bold text-gray-900">{t('email.messageLabel')}</h3>
                <p className="text-xs text-gray-500 mt-0.5">เขียนข้อความเพิ่มเติมที่ต้องการส่งถึงผู้รับ</p>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-3.5 text-gray-400">
                  <MessageSquare size={18} />
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all leading-relaxed resize-none"
                />
                <div className="text-right text-[11px] text-gray-400 mt-1 font-mono">
                  {message.length}/1,000
                </div>
              </div>
            </div>

            {/* Step 4: Attachment Format Selector & Card */}
            <div>
              <div className="mb-2">
                <h3 className="text-sm font-bold text-gray-900">
                  {t('email.attachmentLabel')}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">เลือกรูปแบบเอกสารที่ต้องการแนบไปกับอีเมล</p>
              </div>

              {/* Format Selector 3 Cards */}
              <div className="grid grid-cols-3 gap-2.5 mb-3">
                {/* 1. PDF */}
                <button
                  type="button"
                  onClick={() => handleSelectFormat("pdf")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedFormat === "pdf"
                      ? "border-red-500 bg-red-50/50 shadow-xs ring-2 ring-red-500/20"
                      : "border-gray-200 bg-white hover:bg-gray-50/80"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      selectedFormat === "pdf" ? "bg-red-500 text-white" : "bg-red-50 text-red-600"
                    }`}>
                      <FileText size={15} />
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100/80 text-red-700">.PDF</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">PDF Document</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">เอกสารทางการ / พิมพ์</p>
                  </div>
                </button>

                {/* 2. HTML */}
                <button
                  type="button"
                  onClick={() => handleSelectFormat("html")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedFormat === "html"
                      ? "border-blue-500 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20"
                      : "border-gray-200 bg-white hover:bg-gray-50/80"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      selectedFormat === "html" ? "bg-blue-500 text-white" : "bg-blue-50 text-blue-600"
                    }`}>
                      <Globe size={15} />
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100/80 text-blue-700">.HTML</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">HTML Webpage</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">หน้าเว็บ Standalone</p>
                  </div>
                </button>

                {/* 3. WebP */}
                <button
                  type="button"
                  onClick={() => handleSelectFormat("webp")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedFormat === "webp"
                      ? "border-purple-500 bg-purple-50/50 shadow-xs ring-2 ring-purple-500/20"
                      : "border-gray-200 bg-white hover:bg-gray-50/80"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      selectedFormat === "webp" ? "bg-purple-500 text-white" : "bg-purple-50 text-purple-600"
                    }`}>
                      <ImageIcon size={15} />
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100/80 text-purple-700">.WEBP</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">WebP Image</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">รูปคมชัด 2x / แชท</p>
                  </div>
                </button>
              </div>

              {/* Attachment File Card */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-gray-50/60">
                <div className="flex items-center gap-3 overflow-hidden pr-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedFormat === "pdf" ? "bg-red-100 text-red-600" :
                    selectedFormat === "html" ? "bg-blue-100 text-blue-600" :
                    "bg-purple-100 text-purple-600"
                  }`}>
                    {selectedFormat === "pdf" ? <FileText size={20} /> :
                     selectedFormat === "html" ? <Globe size={20} /> :
                     <ImageIcon size={20} />}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-gray-900 truncate">{currentAttachmentName}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                      {loadingFormat ? (
                        <>
                          <Loader2 size={12} className="animate-spin text-purple-600" />
                          <span>กำลังเตรียมไฟล์ {selectedFormat.toUpperCase()}...</span>
                        </>
                      ) : (
                        <span>
                          {selectedFormat === "pdf" ? t('email.pdfBadge') :
                           selectedFormat === "html" ? "HTML Webpage (Standalone) • พร้อมแนบส่ง" :
                           "WebP High-Res Image • พร้อมแนบส่ง"}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFullPreview(true)}
                  className="px-3.5 py-2 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs cursor-pointer"
                >
                  <Eye size={14} />
                  ดูไฟล์
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium border border-red-200">
                {error}
              </div>
            )}

            {/* Bottom Alert Banner & Send Button */}
            <div className="pt-4 border-t border-[#E5E5E5] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 p-3 rounded-[10px] bg-[#F5F3FF] text-[#6D28D9] border border-[#EDE9FE] text-xs flex-1">
                <ShieldCheck size={18} className="shrink-0 text-[#7C3AED]" />
                <span>โปรดตรวจสอบอีเมลผู้รับและรายละเอียดให้ถูกต้องก่อนส่ง</span>
              </div>
              <button
                onClick={handleSend}
                disabled={sending || loadingFormat || !activeAttachment}
                className="primary-button w-full sm:w-auto px-6 h-9 rounded-[8px] text-white text-xs font-medium hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer shadow-xs"
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {sending ? t('email.sending') : t('email.confirmSend')}
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN: Live Scaled 100% Identical Document Preview Card */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Document Thumbnail Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-card space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">ตัวอย่างไฟล์แนบ</h3>
                <p className="text-xs text-gray-500 mt-0.5">ตัวอย่างเอกสารที่จะถูกส่งไปยังผู้รับ</p>
              </div>

              {/* Preview Frame Container */}
              <div className="bg-gray-100/90 border border-gray-200 rounded-xl p-3 flex flex-col items-center relative overflow-hidden">
                {/* Header Tag */}
                <div className="w-full flex items-center justify-between pb-2.5 mb-2 border-b border-gray-200 px-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-800 truncate pr-2">
                    {selectedFormat === "pdf" ? (
                      <FileText size={15} className="text-red-500 shrink-0" />
                    ) : selectedFormat === "html" ? (
                      <Globe size={15} className="text-blue-500 shrink-0" />
                    ) : (
                      <ImageIcon size={15} className="text-purple-500 shrink-0" />
                    )}
                    <span className="truncate">{currentAttachmentName}</span>
                  </div>
                  <button
                    onClick={() => setShowFullPreview(true)}
                    className="p-1 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors"
                    title="ขยายขนาดเต็มจอ"
                  >
                    <Maximize2 size={15} />
                  </button>
                </div>

                {/* 100% Exact Scaled Preview Container (A4 Aspect Ratio: 794x1122/1123) */}
                <div className="w-full flex justify-center py-1 relative">
                  <div
                    className="relative rounded border border-gray-300 shadow-sm overflow-hidden bg-white"
                    style={{
                      width: 794 * 0.36,
                      height: 1122 * 0.36,
                    }}
                  >
                    <div
                      style={{
                        width: 794,
                        height: 1122,
                        transform: "scale(0.36)",
                        transformOrigin: "top left",
                      }}
                      className="text-left"
                    >
                      {isQuotation ? (
                        <QuotationDocument quotation={values} currentPage={1} />
                      ) : (
                        <div
                          className="flex flex-col font-noto-looped h-full box-border text-gray-900 bg-white overflow-hidden"
                          style={{
                            width: 794,
                            height: 1123,
                            padding: `${schema?.hasHeader !== false ? "28px" : "0px"} 48px ${schema?.hasFooter !== false ? "28px" : "0px"} 48px`,
                          }}
                        >
                          <DocumentFieldsProvider initialValues={values} defaultReadOnly>
                            {schema?.hasHeader !== false && <DocumentHeader logo={schema?.logo} />}
                            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                              {Page1Component && <Page1Component />}
                            </div>
                            {schema?.hasFooter !== false && (
                              <DocumentFooter
                                title={schema?.fullName}
                                pageNumber={1}
                                totalPages={pageCount}
                              />
                            )}
                          </DocumentFieldsProvider>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Page Pill Counter Badge */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white text-[11px] font-semibold px-3.5 py-1 rounded-full shadow-md backdrop-blur-2xs">
                    หน้า 1 / {pageCount}
                  </div>
                </div>

                {/* Footer Status Bar */}
                <div className="w-full flex items-center justify-between pt-3 mt-2 border-t border-gray-200 px-1 text-xs">
                  <span className="text-gray-500 font-medium">
                    {selectedFormat.toUpperCase()} • {pageCount} หน้า
                  </span>
                  <span className="flex items-center gap-1 text-success-600 font-bold text-[11px] bg-success-100 px-2.5 py-0.5 rounded-full">
                    {loadingFormat ? <Loader2 size={13} className="animate-spin text-purple-600" /> : <CheckCircle2 size={13} />}
                    {loadingFormat ? "กำลังเตรียมไฟล์..." : "พร้อมส่ง"}
                  </span>
                </div>
              </div>
            </div>

            {/* Note Information Card */}
            <div className="bg-primary-50/80 border border-primary-100 rounded-xl p-4 flex gap-3 text-xs text-primary-900 shadow-2xs">
              <Info size={18} className="text-primary-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-0.5">หมายเหตุ</p>
                <p className="leading-relaxed text-primary-800">
                  เมื่อกดส่งอีเมล ระบบจะส่งไฟล์แนบรูปแบบ {selectedFormat.toUpperCase()} ({currentAttachmentName}) ไปยังอีเมลผู้รับที่ระบุไว้ทันที พร้อมบันทึกประวัติไว้ในหน้าประวัติการส่ง
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Full Document View Modal */}
      {showFullPreview && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white z-10 shadow-2xs">
              <div>
                <h3 className="font-bold text-gray-900 text-base">{fileName}</h3>
                <p className="text-xs text-gray-500 mt-0.5">ตัวอย่างเอกสารแบบเต็ม ({pageCount} หน้า)</p>
              </div>
              <button
                onClick={() => setShowFullPreview(false)}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Full Document Pages Scroll Area - Render at exact A4 794px x 1122/1123px */}
            <div className="flex-1 overflow-auto bg-gray-200/90 p-8 flex flex-col items-center gap-8">
              {isQuotation ? (
                Array.from({ length: pageCount }, (_, i) => (
                  <div key={i} className="shrink-0">
                    <QuotationDocument quotation={values} currentPage={i + 1} />
                  </div>
                ))
              ) : (
                <DocumentFieldsProvider initialValues={values} defaultReadOnly>
                  {(pages || []).map((PageContent, i) => (
                    <div
                      key={i}
                      className="bg-white shadow-xl rounded-sm shrink-0 font-noto-looped text-gray-900 overflow-hidden"
                      style={{ width: 794, minHeight: 1123, height: 1123 }}
                    >
                      <div
                        className="flex flex-col h-full box-border text-left overflow-hidden"
                        style={{
                          height: 1123,
                          padding: `${schema?.hasHeader !== false ? "28px" : "0px"} 48px ${schema?.hasFooter !== false ? "28px" : "0px"} 48px`,
                        }}
                      >
                        {schema?.hasHeader !== false && <DocumentHeader logo={schema?.logo} />}
                        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                          <PageContent />
                        </div>
                        {schema?.hasFooter !== false && (
                          <DocumentFooter
                            title={schema?.fullName}
                            pageNumber={i + 1}
                            totalPages={pages.length}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </DocumentFieldsProvider>
              )}
            </div>

            <div className="px-6 py-3.5 border-t border-gray-200 flex items-center justify-between bg-white z-10">
              <span className="text-xs text-gray-500 font-medium">
                ทั้งหมด {pageCount} หน้า • ขนาด 794 × 1123px (A4)
              </span>
              <button
                onClick={() => setShowFullPreview(false)}
                className="px-5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors bg-white shadow-2xs"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}