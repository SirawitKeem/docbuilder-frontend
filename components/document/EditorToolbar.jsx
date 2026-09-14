"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { createClientNotification } from "@/lib/utils/notifications";
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Eye,
  Download,
  Save,
  MoreHorizontal,
  Loader2,
  Check,
  CopyPlus,
  SlidersHorizontal,
  Pencil,
  ChevronDown,
  FileText,
  Globe,
  Image as ImageIcon,
} from "lucide-react";

export default function EditorToolbar({
  template,
  docName,
  onDocNameChange,
  status,
  onPreview,
  onExport,
  exporting,
  onSave,
  isSaving,
  savedAt,
  onCreateRevision,
  isCreatingRevision,
  isFormOpen,
  onToggleForm,
}) {
  const { t } = useLanguage();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(docName || template?.fullName || "เอกสาร");
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

  useEffect(() => {
    if (docName) setNameInput(docName);
  }, [docName]);

  const handleFinishEdit = () => {
    setIsEditingName(false);
    if (nameInput.trim() && onDocNameChange) {
      onDocNameChange(nameInput.trim());
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

  return (
    <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0 select-none">
      <div className="flex items-center gap-4 min-w-0">
        <Link href="/" className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-700 shrink-0">
          <ArrowLeft size={20} />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 group">
            {isEditingName ? (
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleFinishEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFinishEdit();
                }}
                className="h-7 px-2 text-sm font-semibold text-gray-900 border border-[#7C3AED] rounded-md outline-none focus:ring-1 focus:ring-[#7C3AED]"
                autoFocus
              />
            ) : (
              <div
                onClick={() => setIsEditingName(true)}
                className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-100/70 px-1 py-0.5 rounded-md transition-colors"
                title={t('toolbar.clickToRename')}
              >
                <p className="text-sm font-bold text-gray-900 truncate max-w-[280px]">
                  {docName || template.fullName}
                </p>
                <Pencil size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={status} />
            {savedAt && (
              <span className="text-[11px] text-gray-400 font-normal hidden sm:inline-flex items-center gap-1">
                <Check size={12} className="text-success-600" />
                {t('toolbar.savedAt', { time: savedAt })}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-1">
        <button disabled className="p-2 rounded-lg text-gray-300 cursor-not-allowed">
          <Undo2 size={18} />
        </button>
        <button disabled className="p-2 rounded-lg text-gray-300 cursor-not-allowed">
          <Redo2 size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* ปุ่ม เปิด/ปิด แถบฟอร์มกรอกข้อมูล */}
        {onToggleForm && (
          <button
            onClick={onToggleForm}
            className={`flex items-center gap-1.5 h-10 px-3.5 rounded-[10px] border text-xs font-bold transition-all cursor-pointer ${
              isFormOpen
                ? "border-[#7C3AED] bg-[#F5F3FF] text-[#7C3AED]"
                : "border-[#E5E5E5] bg-white text-[#52525B] hover:bg-[#F6F6FA]"
            }`}
            title="เปิด/ปิด แถบฟอร์มกรอกข้อมูล"
          >
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">{isFormOpen ? t('toolbar.hideForm') : t('toolbar.showForm')}</span>
          </button>
        )}
        {/* ปุ่ม สร้าง Rev ใหม่ (เมื่อเป็นเอกสารที่บันทึกแล้ว) */}
        {onCreateRevision && (
          <button
            onClick={onCreateRevision}
            disabled={isCreatingRevision}
            className="flex items-center gap-2 h-10 px-4 rounded-[10px] border border-[#E5E5E5] text-[#171717] text-sm font-medium hover:bg-[#F6F6FA] transition-colors disabled:opacity-60"
            title="สร้างฉบับปรับปรุงใหม่ (คงเลข Quotation No. เดิม แต่อัปเกรด Rev ขึ้น)"
          >
            {isCreatingRevision ? (
              <Loader2 size={16} className="animate-spin text-[#7C3AED]" />
            ) : (
              <CopyPlus size={16} />
            )}
            <span className="hidden sm:inline">{isCreatingRevision ? "กำลังสร้าง..." : "สร้าง Rev ใหม่"}</span>
          </button>
        )}

        {/* ปุ่ม บันทึกเอกสาร (Save Document) */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-[8px] border border-border bg-surface text-foreground text-xs font-medium hover:bg-muted transition-colors disabled:opacity-60 cursor-pointer shadow-2xs"
          title="บันทึกเอกสารนี้ไว้ในคลัง 'เอกสารของฉัน'"
        >
          {isSaving ? <Loader2 size={15} className="animate-spin text-primary" /> : <Save size={15} className="text-muted-foreground" />}
          <span className="hidden sm:inline">{isSaving ? t('actions.saving') : t('toolbar.saveDocument')}</span>
        </button>

        {/* ปุ่ม Preview */}
        <button
          onClick={onPreview}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-[8px] border border-border bg-surface text-foreground text-xs font-medium hover:bg-muted transition-colors cursor-pointer shadow-2xs"
        >
          <Eye size={15} className="text-muted-foreground" />
          <span className="hidden sm:inline">{t('actions.preview')}</span>
        </button>

        {/* ปุ่ม Multi-Format Export (PDF, HTML, WebP) */}
        <div className="relative flex items-center" ref={exportMenuRef}>
          <button
            onClick={() => handleExportAction(selectedFormat)}
            disabled={exporting}
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
            disabled={exporting}
            className="primary-button h-9 px-2 rounded-r-[8px] text-white hover:opacity-95 border-l border-white/25 transition-all disabled:opacity-60 flex items-center justify-center cursor-pointer shadow-xs"
            title="เลือกรูปแบบการส่งออก (PDF, HTML, WebP)"
          >
            <ChevronDown size={14} className={`transition-transform duration-150 ${exportMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown Menu */}
          {exportMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                เลือกรูปแบบการ Export
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

        <button className="p-2 rounded-[10px] text-[#646469] hover:bg-[#F6F6FA]">
          <MoreHorizontal size={18} />
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const { t } = useLanguage();
  if (status.isComplete) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#17682F]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#239742]" />
        {t('toolbar.allFieldsFilled')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#646469]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#B2AFBC]" />
      กรอกแล้ว {status.filled}/{status.total}
    </span>
  );
}