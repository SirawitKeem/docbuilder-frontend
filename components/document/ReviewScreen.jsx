"use client";

import { useContext, useState, useRef, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { createClientNotification } from "@/lib/utils/notifications";
import {
  ArrowLeft,
  Send,
  Download,
  Loader2,
  ChevronDown,
  FileText,
  Globe,
  Image as ImageIcon,
  MoreHorizontal,
} from "lucide-react";
import { DocumentFieldsContext } from "@/context/DocumentFieldsContext";
import DocumentHeader from "./DocumentHeader";
import DocumentFooter from "./DocumentFooter";

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

export default function ReviewScreen({
  template,
  docName,
  pages,
  status,
  onExport,
  onSendEmail,
  exporting,
  onBackToEdit,
  onBack,
  customRender = false,
}) {
  const { t } = useLanguage();
  const docFieldsCtx = useContext(DocumentFieldsContext);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("pdf");
  const exportMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBack = () => {
    if (onBackToEdit) {
      onBackToEdit();
    } else if (onBack) {
      onBack();
    } else if (docFieldsCtx) {
      docFieldsCtx.setReadOnly(false);
    }
  };

  const handleExportAction = (format) => {
    onExport?.(format);
    createClientNotification({
      type: "document_exported",
      title: "ส่งออกเอกสารสำเร็จ",
      description: `ส่งออกไฟล์ "${docName || template?.fullName || "เอกสาร"}" เป็น .${format.toUpperCase()} เรียบร้อยแล้ว`,
      link: "/documents",
      metadata: { format, docName: docName || template?.fullName },
    });
  };

  const isCustomDoc = customRender || template?.isCustomDoc;

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-noto-looped">
      {/* Top Header Bar: Proportions and button layout 100% matched with EditorToolbar */}
      <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0 select-none z-30">
        {/* Left: Back button + Document Title + Status indicator */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-700 shrink-0 cursor-pointer transition-colors"
            title="ย้อนกลับไปแก้ไข"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-gray-900 truncate max-w-[280px]">
                {docName || template?.fullName || template?.name || t('review.title') || "ตรวจสอบเอกสาร"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {status?.isComplete ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#17682F]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#239742]" />
                  {t('toolbar.allFieldsFilled') || "All fields filled"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#646469]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B2AFBC]" />
                  {status?.total ? `กรอกแล้ว ${status.filled}/${status.total}` : "กำลังตรวจสอบข้อมูล"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions (Send Email + Multi-Format Export + MoreHorizontal) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Send Email button */}
          <button
            onClick={onSendEmail}
            disabled={!status?.isComplete || exporting}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-[8px] border border-border bg-surface text-foreground text-xs font-medium hover:bg-muted transition-colors disabled:opacity-60 cursor-pointer shadow-2xs"
            title={t('actions.sendEmail')}
          >
            <Send size={15} className="text-muted-foreground" />
            <span className="hidden sm:inline">{t('actions.sendEmail')}</span>
          </button>

          {/* Multi-Format Export (PDF, HTML, WebP) */}
          <div className="relative flex items-center" ref={exportMenuRef}>
            <button
              onClick={() => handleExportAction(selectedFormat)}
              disabled={!status?.isComplete || exporting}
              className="primary-button inline-flex items-center gap-1.5 h-9 pl-3.5 pr-2 rounded-l-[8px] text-white text-xs font-medium hover:opacity-95 transition-all disabled:opacity-60 cursor-pointer shadow-xs"
              title={`ส่งออกเอกสารในรูปแบบ .${selectedFormat}`}
            >
              {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              <span className="hidden sm:inline">
                {exporting ? "กำลังส่งออก..." : `Export ${selectedFormat.toUpperCase()}`}
              </span>
            </button>
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              disabled={!status?.isComplete || exporting}
              className="primary-button h-9 px-2 rounded-r-[8px] text-white hover:opacity-95 border-l border-white/25 transition-all disabled:opacity-60 flex items-center justify-center cursor-pointer shadow-xs"
              title="เลือกรูปแบบการส่งออก (PDF, HTML, WebP)"
            >
              <ChevronDown size={14} className={`transition-transform duration-150 ${exportMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {exportMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                <div className="px-3 py-1.5 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {t('review.selectExport') || "เลือกรูปแบบการ Export"}
                </div>

                {/* 1. PDF */}
                <button
                  onClick={() => {
                    setSelectedFormat("pdf");
                    setExportMenuOpen(false);
                    handleExportAction("pdf");
                  }}
                  className={`w-full text-left px-3.5 py-2.5 hover:bg-gray-50 flex items-start gap-3 transition-colors cursor-pointer group ${
                    selectedFormat === "pdf" ? "bg-purple-50/50" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">PDF Document (.pdf)</span>
                      <span className="text-[10px] font-medium bg-red-50 text-red-700 px-1.5 py-0.5 rounded">พิมพ์ / ส่งงาน</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">เอกสารต้นฉบับคมชัดมาตรฐาน สำหรับพิมพ์และส่งทางการ</p>
                  </div>
                </button>

                {/* 2. HTML */}
                <button
                  onClick={() => {
                    setSelectedFormat("html");
                    setExportMenuOpen(false);
                    handleExportAction("html");
                  }}
                  className={`w-full text-left px-3.5 py-2.5 hover:bg-gray-50 flex items-start gap-3 transition-colors cursor-pointer group border-t border-gray-100 ${
                    selectedFormat === "html" ? "bg-purple-50/50" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    <Globe size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">HTML Webpage (.html)</span>
                      <span className="text-[10px] font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">เว็บเพจ</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">หน้าเว็บ Standalone พกพาสะดวก เปิดบนเบราว์เซอร์ได้ทันที</p>
                  </div>
                </button>

                {/* 3. WebP */}
                <button
                  onClick={() => {
                    setSelectedFormat("webp");
                    setExportMenuOpen(false);
                    handleExportAction("webp");
                  }}
                  className={`w-full text-left px-3.5 py-2.5 hover:bg-gray-50 flex items-start gap-3 transition-colors cursor-pointer group border-t border-gray-100 ${
                    selectedFormat === "webp" ? "bg-purple-50/50" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    <ImageIcon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">WebP Image (.webp)</span>
                      <span className="text-[10px] font-medium bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">รูปภาพ 2x</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">รูปภาพความละเอียดสูง คมชัดระดับ Retina ขนาดไฟล์เล็ก</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* More options button (same as EditorToolbar to keep Export PDF at the exact same horizontal position) */}
          <button className="p-2 rounded-[10px] text-[#646469] hover:bg-[#F6F6FA] cursor-pointer">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-100/70">
        <div className="max-w-4xl mx-auto px-4 py-8">

          <div className="space-y-8 pb-12 flex flex-col items-center">
            {pages.map((PageContent, i) => {
              if (isCustomDoc) {
                return (
                  <div key={i} className="shrink-0">
                    <PageContent />
                  </div>
                );
              }

              return (
                <div
                  key={i}
                  className="bg-white shadow-document font-noto-looped shrink-0 text-gray-900 overflow-hidden"
                  style={{ width: A4_WIDTH, height: A4_HEIGHT, minHeight: A4_HEIGHT }}
                >
                  <div
                    className="flex flex-col overflow-hidden text-left"
                    style={{
                      padding: `${template.hasHeader !== false ? "28px" : "0px"} 48px ${template.hasFooter !== false ? "28px" : "0px"} 48px`,
                      height: A4_HEIGHT,
                      boxSizing: "border-box",
                    }}
                  >
                    {template.hasHeader !== false && <DocumentHeader logo={template.logo} />}
                    <div className="flex-1 min-h-0 flex flex-col">
                      <PageContent />
                    </div>
                    {template.hasFooter !== false && (
                      <DocumentFooter title={template.fullName} pageNumber={i + 1} totalPages={pages.length} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}