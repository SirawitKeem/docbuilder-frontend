"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Type,
  Square,
  Circle,
  Minus,
  UploadCloud,
  LayoutTemplate,
  Table,
  PenTool,
  Building,
  FileCheck2,
  ScrollText,
  Braces,
  Sparkles,
  Triangle,
  Star,
  ArrowRight,
  Tag,
  Bookmark,
  AlertCircle,
  Plus,
  Trash2,
  X,
  Loader2,
  FileText,
  Users,
  Search,
  Shapes,
} from "lucide-react";
import { AVAILABLE_TOKEN_CATEGORIES, fetchCustomTokens, mergeWithCustomTokens, initLiveTokens } from "@/lib/tokens/tokenEngine";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";
import { VECTOR_ICONS, ICON_CATEGORIES } from "./utils/iconLibrary";


export default function LeftSidebar({
  editorType = "document",
  onAddText,
  onAddShape,
  onAddIcon,
  onAddImage,
  onAddPreset,
  onAddTable,
  onAddSignature,
  onInsertToken,
  isReplacingIcon = false,
}) {
  const isSlide = editorType === "slide";
  const [activeTab, setActiveTab] = useState(isSlide ? "text" : "blocks"); // "blocks" | "tokens" | "text" | "shapes" | "icons" | "uploads"
  const fileInputRef = useRef(null);

  // ── Icons Tab State ──
  const [iconSearch, setIconSearch] = useState("");
  const [selectedIconCat, setSelectedIconCat] = useState("all");

  // ── Custom Tokens State ──
  const [customTokens, setCustomTokens] = useState([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [showAddTokenModal, setShowAddTokenModal] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState(null);
  const [isDeletingToken, setIsDeletingToken] = useState(false);
  const [newTokenKey, setNewTokenKey] = useState("");
  const [newTokenLabel, setNewTokenLabel] = useState("");
  const [newTokenExample, setNewTokenExample] = useState("");
  const [newTokenScope, setNewTokenScope] = useState("document"); // "document" | "entity"
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [tokenError, setTokenError] = useState("");

  // Load custom tokens when tokens tab is opened
  const loadCustomTokens = useCallback(async () => {
    setIsLoadingTokens(true);
    try {
      const tokens = await fetchCustomTokens();
      setCustomTokens(tokens);
      await initLiveTokens();
    } finally {
      setIsLoadingTokens(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "tokens") {
      loadCustomTokens();
    }
  }, [activeTab, loadCustomTokens]);

  const handleSaveNewToken = async () => {
    setTokenError("");
    const cleanKey = newTokenKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!cleanKey) { setTokenError("กรุณาระบุรหัสตัวแปร"); return; }
    if (!newTokenLabel.trim()) { setTokenError("กรุณาระบุชื่อฟิลด์ภาษาไทย"); return; }

    setIsSavingToken(true);
    try {
      const res = await fetch("/api/custom-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: cleanKey, label: newTokenLabel.trim(), example: newTokenExample.trim(), scope: newTokenScope }),
      });
      if (!res.ok) {
        const err = await res.json();
        setTokenError(err.error || "เกิดข้อผิดพลาด");
        return;
      }
      // Reset form and reload
      setNewTokenKey(""); setNewTokenLabel(""); setNewTokenExample(""); setNewTokenScope("document");
      setShowAddTokenModal(false);
      await loadCustomTokens();
    } catch {
      setTokenError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsSavingToken(false);
    }
  };

  const handleDeleteCustomToken = (tok) => {
    setTokenToDelete(tok);
  };

  const handleConfirmDeleteToken = async () => {
    if (!tokenToDelete) return;
    setIsDeletingToken(true);
    try {
      await fetch(`/api/custom-tokens/${tokenToDelete.id}`, { method: "DELETE" });
      await loadCustomTokens();
      setTokenToDelete(null);
    } catch (err) {
      console.error("Failed to delete custom token:", err);
    } finally {
      setIsDeletingToken(false);
    }
  };

  // All token categories (built-in + custom)
  const allTokenCategories = mergeWithCustomTokens(customTokens);

  // Handle local image file upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl && onAddImage) {
        onAddImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };


  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex h-[calc(100vh-53px)] select-none z-20 shrink-0 shadow-xs">
      {/* ── NARROW ICON NAVIGATION RAIL ── */}
      <nav className="w-18 bg-gray-50/90 border-r border-gray-200 flex flex-col items-center py-3 gap-1.5 shrink-0">
        <button
          onClick={() => setActiveTab("blocks")}
          className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "blocks"
              ? "bg-indigo-600 text-white shadow-sm font-semibold"
              : "text-gray-600 hover:bg-gray-200/70 hover:text-gray-900"
          }`}
          title={isSlide ? "โครงร่างสไลด์ (Slide Layouts)" : "บล็อกโครงสร้างเอกสาร"}
        >
          <LayoutTemplate className="w-5 h-5" />
          <span className="text-[10px]">{isSlide ? "โครงร่างสไลด์" : "บล็อกเอกสาร"}</span>
        </button>

        {/* 🏷️ TAB: TOKENS / DYNAMIC VARIABLES (Phase 6) */}
        <button
          onClick={() => setActiveTab("tokens")}
          className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "tokens"
              ? "bg-indigo-600 text-white shadow-sm font-semibold"
              : "text-gray-600 hover:bg-gray-200/70 hover:text-gray-900"
          }`}
          title="ตัวแปรไดนามิก {{token}}"
        >
          <Braces className="w-5 h-5" />
          <span className="text-[10px]">ตัวแปรไดนามิก</span>
        </button>

        <button
          onClick={() => setActiveTab("text")}
          className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "text"
              ? "bg-indigo-600 text-white shadow-sm font-semibold"
              : "text-gray-600 hover:bg-gray-200/70 hover:text-gray-900"
          }`}
          title="ข้อความและฟอนต์"
        >
          <Type className="w-5 h-5" />
          <span className="text-[10px]">ข้อความ</span>
        </button>

        <button
          onClick={() => setActiveTab("shapes")}
          className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "shapes"
              ? "bg-indigo-600 text-white shadow-sm font-semibold"
              : "text-gray-600 hover:bg-gray-200/70 hover:text-gray-900"
          }`}
          title="รูปทรงและเส้น"
        >
          <Square className="w-5 h-5" />
          <span className="text-[10px]">รูปทรง</span>
        </button>

        <button
          onClick={() => setActiveTab("icons")}
          className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "icons"
              ? "bg-indigo-600 text-white shadow-sm font-semibold"
              : "text-gray-600 hover:bg-gray-200/70 hover:text-gray-900"
          }`}
          title="ไอคอนเวกเตอร์ (Vector Icons)"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px]">ไอคอน</span>
        </button>

        <button
          onClick={() => setActiveTab("uploads")}
          className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "uploads"
              ? "bg-indigo-600 text-white shadow-sm font-semibold"
              : "text-gray-600 hover:bg-gray-200/70 hover:text-gray-900"
          }`}
          title="อัปโหลดรูปภาพ / โลโก้"
        >
          <UploadCloud className="w-5 h-5" />
          <span className="text-[10px]">อัปโหลด</span>
        </button>
      </nav>

      {/* ── TAB CONTENT PANEL ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── TAB 1: BLOCKS / SLIDE LAYOUTS ── */}
        {activeTab === "blocks" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {isSlide ? "โครงร่างสไลด์นำเสนอ (16:9)" : "บล็อกเฉพาะทางเอกสาร A4"}
              </h2>
              {isSlide ? (
                <div className="space-y-2">
                  {/* Slide Preset 1: Title & Subtitle */}
                  <button
                    onClick={() => onAddPreset && onAddPreset("slide_title_subtitle")}
                    className="w-full text-left p-3 rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1 text-indigo-700 font-bold text-xs">
                      <LayoutTemplate className="w-4 h-4" />
                      <span>หัวข้อและคำอธิบาย (Title & Subtitle)</span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      กล่องข้อความหัวเรื่องหลักขนาด 44px พร้อมคำอธิบายย่อยจัดกึ่งกลาง
                    </p>
                  </button>

                  {/* Slide Preset 2: Two Column Cards */}
                  <button
                    onClick={() => onAddPreset && onAddPreset("slide_two_column")}
                    className="w-full text-left p-3 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-100 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1 text-gray-800 font-bold text-xs">
                      <Table className="w-4 h-4 text-emerald-600" />
                      <span>เนื้อหา 2 คอลัมน์ (Comparison Cards)</span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      การ์ดเนื้อหาเปรียบเทียบซ้าย-ขวา 2 ฝั่ง พร้อมหัวข้อย่อย
                    </p>
                  </button>

                  {/* Slide Preset 3: Key Metric / Stat Callout */}
                  <button
                    onClick={() => onAddPreset && onAddPreset("slide_stat_callout")}
                    className="w-full text-left p-3 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-100 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1 text-gray-800 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>สถิติสำคัญ (KPI / Key Metric Card)</span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      ตัวเลขไฮไลท์ขนาดใหญ่พร้อมข้อความระบุผลลัพธ์
                    </p>
                  </button>

                  {/* Slide Preset 4: Bullet Points */}
                  <button
                    onClick={() => onAddPreset && onAddPreset("slide_bullets")}
                    className="w-full text-left p-3 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-100 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1 text-gray-800 font-bold text-xs">
                      <ScrollText className="w-4 h-4 text-amber-600" />
                      <span>รายการจุดเด่น (Key Takeaways)</span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      รายการสรุปข้อคิดและจุดเด่น 3 ข้อพร้อมไอคอนนำ
                    </p>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* 1. Quotation Table */}
                  <button
                    onClick={() => onAddTable && onAddTable()}
                    className="w-full text-left p-3 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1 text-blue-700 font-bold text-xs">
                      <Table className="w-4 h-4" />
                      <span>ตารางใบเสนอราคา (Pricing Table)</span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      ตาราง 5 คอลัมน์พร้อมคำนวณ VAT 7% และยอดรวมอัตโนมัติ
                    </p>
                  </button>

                  {/* 2. Signature Dual Block */}
                  <button
                    onClick={() => onAddSignature && onAddSignature("dual")}
                    className="w-full text-left p-3 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-100 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1 text-gray-800 font-bold text-xs">
                      <PenTool className="w-4 h-4 text-indigo-600" />
                      <span>บล็อกลงนามคู่ (ผู้เสนอราคา + ลูกค้า)</span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      ช่องลงลายมือชื่อ 2 ฝั่งซ้าย-ขวา พร้อมวันที่และตำแหน่ง
                    </p>
                  </button>

                  {/* 3. Company Header Block */}
                  <button
                    onClick={() => onAddPreset && onAddPreset("company_header")}
                    className="w-full text-left p-3 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-100 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1 text-gray-800 font-bold text-xs">
                      <Building className="w-4 h-4 text-emerald-600" />
                      <span>หัวกระดาษบริษัท (Company Header)</span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      ชื่อบริษัท, เลขประจำตัวผู้เสียภาษี, ที่อยู่, เบอร์โทร
                    </p>
                  </button>

                  {/* 4. Party Info Grid */}
                  <button
                    onClick={() => onAddPreset && onAddPreset("party_info")}
                    className="w-full text-left p-3 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-100 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1 text-gray-800 font-bold text-xs">
                      <FileCheck2 className="w-4 h-4 text-purple-600" />
                      <span>ข้อมูลคู่สัญญา / เลขที่เอกสาร (Info Grid)</span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      กล่อง Bill To และช่องเลขที่/วันที่เอกสารแบบ 2 คอลัมน์
                    </p>
                  </button>

                  {/* 5. Terms & Conditions Box */}
                  <button
                    onClick={() => onAddPreset && onAddPreset("terms_box")}
                    className="w-full text-left p-3 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-100 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1 text-gray-800 font-bold text-xs">
                      <ScrollText className="w-4 h-4 text-amber-600" />
                      <span>เงื่อนไขและข้อตกลง (Terms & Conditions)</span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      กล่องข้อกำหนดการชำระเงินและเงื่อนไขการส่งมอบ
                    </p>
                  </button>

                  {/* 6. Document Title & Subtitle Badge */}
                  <button
                    onClick={() => onAddPreset && onAddPreset("doc_title")}
                    className="w-full text-left p-3 rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1 text-indigo-700 font-bold text-xs">
                      <Bookmark className="w-4 h-4" />
                      <span>หัวเรื่องเอกสาร (Document Title Badge)</span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      กล่องชื่อเอกสารพร้อมป้ายกำกับ ต้นฉบับ / Original
                    </p>
                  </button>

                  {/* 7. Callout / Highlight Note Box */}
                  <button
                    onClick={() => onAddPreset && onAddPreset("callout_box")}
                    className="w-full text-left p-3 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1 text-amber-800 font-bold text-xs">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>กล่องข้อความไฮไลท์ (Callout / Note)</span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      กล่องเน้นข้อความแจ้งเตือนหรือข้อสังเกตสำคัญ
                    </p>
                  </button>

                  {/* 8. Single Signatory Block */}
                  <button
                    onClick={() => onAddSignature && onAddSignature("single")}
                    className="w-full text-left p-3 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-100 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1 text-gray-800 font-bold text-xs">
                      <PenTool className="w-4 h-4 text-indigo-600" />
                      <span>บล็อกลงนามเดี่ยว (Single Signature)</span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      ช่องลงนามผู้มีอำนาจฝ่ายเดียวพร้อมตำแหน่ง
                    </p>
                  </button>

                  {/* 9. Contract Preamble & Parties Block */}
                  <button
                    onClick={() => onAddPreset && onAddPreset("contract_preamble")}
                    className="w-full text-left p-3 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1 text-blue-700 font-bold text-xs">
                      <ScrollText className="w-4 h-4" />
                      <span>คำนำสัญญาและคู่สัญญา (Contract Preamble)</span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      วันที่, สถานที่, คู่สัญญาฝ่ายที่ 1 & 2 และวัตถุประสงค์ข้อตกลง
                    </p>
                  </button>

                  {/* 10. Contract Clause / Section Block */}
                  <button
                    onClick={() => onAddPreset && onAddPreset("contract_section")}
                    className="w-full text-left p-3 rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1 text-indigo-700 font-bold text-xs">
                      <FileText className="w-4 h-4" />
                      <span>มาตราสัญญา / ข้อกำหนด (Contract Section)</span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      ข้อความมาตราสัญญา (ข้อ X, หัวข้อ, ข้อย่อย, เงื่อนไข)
                    </p>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: DYNAMIC TOKENS ── */}
        {activeTab === "tokens" && (
          <div className="space-y-4">
            {/* Header */}
            <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>ตัวแปรไดนามิก (Data Binding)</span>
              </div>
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                คลิกที่ตัวแปรเพื่อแทรกลงในข้อความ หรือแทรกลงในตาราง ระบบจะดึงข้อมูลจริงมาแทนที่อัตโนมัติเมื่อสร้างเอกสาร
              </p>
            </div>

            {/* + Create New Variable Button */}
            <button
              onClick={() => { setShowAddTokenModal(true); setTokenError(""); }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/40 hover:bg-indigo-100/60 hover:border-indigo-400 text-indigo-700 font-semibold text-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ สร้างตัวแปรใหม่</span>
            </button>

            {/* ── ADD TOKEN MODAL (inline) ── */}
            {showAddTokenModal && (
              <div className="border border-indigo-200 bg-white rounded-xl shadow-md p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900">สร้างตัวแปรใหม่</span>
                  <button onClick={() => setShowAddTokenModal(false)} className="p-0.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Key */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    รหัสตัวแปร <span className="text-gray-400 font-normal">(ภาษาอังกฤษ lowercase_underscore)</span>
                  </label>
                  <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 focus-within:border-indigo-400 focus-within:bg-white">
                    <span className="text-[11px] text-indigo-500 font-mono font-bold shrink-0">{"{{"}…{"}}"}</span>
                    <input
                      type="text"
                      value={newTokenKey}
                      onChange={(e) => setNewTokenKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
                      placeholder="project_deadline"
                      className="flex-1 text-xs outline-none bg-transparent font-mono text-gray-800"
                    />
                  </div>
                </div>

                {/* Label */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">ชื่อฟิลด์ (Label ภาษาไทย)</label>
                  <input
                    type="text"
                    value={newTokenLabel}
                    onChange={(e) => setNewTokenLabel(e.target.value)}
                    placeholder="เช่น กำหนดส่งมอบงาน"
                    className="w-full h-8 px-2.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-indigo-400 bg-gray-50 focus:bg-white"
                  />
                </div>

                {/* Example */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">ตัวอย่างข้อมูล <span className="text-gray-400 font-normal">(สำหรับ Preview)</span></label>
                  <input
                    type="text"
                    value={newTokenExample}
                    onChange={(e) => setNewTokenExample(e.target.value)}
                    placeholder="เช่น 30 กันยายน 2026"
                    className="w-full h-8 px-2.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-indigo-400 bg-gray-50 focus:bg-white"
                  />
                </div>

                {/* Scope Selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">ประเภทตัวแปร</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewTokenScope("document")}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${newTokenScope === "document" ? "border-indigo-400 bg-indigo-50 ring-1 ring-indigo-300" : "border-gray-200 bg-white hover:border-gray-300"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[10px] font-bold text-gray-800">เฉพาะเอกสาร</span>
                      </div>
                      <p className="text-[9.5px] text-gray-500 leading-tight">กรอกใหม่ทุกครั้งที่สร้างเอกสาร</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTokenScope("entity")}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${newTokenScope === "entity" ? "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-300" : "border-gray-200 bg-white hover:border-gray-300"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Users className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-bold text-gray-800">ข้อมูลลูกค้า</span>
                      </div>
                      <p className="text-[9.5px] text-gray-500 leading-tight">เก็บใน Data Preset ใช้ซ้ำได้</p>
                    </button>
                  </div>
                </div>

                {/* Error */}
                {tokenError && (
                  <p className="text-[11px] text-red-600 font-medium">{tokenError}</p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setShowAddTokenModal(false)}
                    className="flex-1 h-8 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSaveNewToken}
                    disabled={isSavingToken}
                    className="flex-1 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isSavingToken ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    {isSavingToken ? "กำลังบันทึก..." : "สร้างตัวแปร"}
                  </button>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isLoadingTokens && (
              <div className="flex items-center justify-center gap-2 py-3 text-xs text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังโหลดตัวแปร...</span>
              </div>
            )}

            {/* Token Categories List */}
            {allTokenCategories.map((cat, idx) => (
              <div key={idx} className="space-y-2">
                <h3 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  {cat.tokens[0]?.isCustom && <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold normal-case">Custom</span>}
                  {cat.category}
                </h3>
                <div className="space-y-1.5">
                  {cat.tokens.map((tok) => (
                    <div key={tok.key} className="group relative">
                      <button
                        onClick={() => onInsertToken && onInsertToken(tok.key, tok.example)}
                        className="w-full text-left p-2 rounded-lg border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all cursor-pointer bg-white shadow-2xs"
                      >
                        <div className="flex items-center justify-between pr-6">
                          <span className="font-mono text-xs font-bold text-indigo-600 group-hover:text-indigo-800">
                            {tok.key}
                          </span>
                          <div className="flex items-center gap-1">
                            {tok.isCustom && tok.scope === "entity" && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">ลูกค้า</span>
                            )}
                            {tok.isCustom && tok.scope === "document" && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">เอกสาร</span>
                            )}
                            <span className="text-[10px] text-gray-500">{tok.label}</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-400 truncate mt-0.5">
                          ตัวอย่าง: {tok.example}
                        </div>
                      </button>
                      {/* Delete button for custom tokens */}
                      {tok.isCustom && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteCustomToken(tok); }}
                          className="absolute top-1.5 right-1.5 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-red-200 text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer shadow-2xs"
                          title="ลบตัวแปรนี้"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}


        {/* ── TAB 3: TEXT & GRAPHIC TYPOGRAPHY ── */}
        {activeTab === "text" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                รูปแบบตัวอักษรกราฟิก (Typography Presets)
              </h2>
              <div className="space-y-2">
                {/* 1. Display Headline */}
                <button
                  onClick={() =>
                    onAddText &&
                    onAddText({
                      text: "พาดหัวกราฟิกขนาดใหญ่",
                      fontSize: 32,
                      fontWeight: 700,
                      fill: "#0F172A",
                    })
                  }
                  className="w-full text-left p-3 rounded-xl border border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-400 transition-all cursor-pointer group"
                >
                  <p className="font-extrabold text-lg text-indigo-950 group-hover:text-indigo-600 transition-colors">
                    พาดหัวกราฟิกใหญ่ (Display)
                  </p>
                  <p className="text-[11px] text-gray-500">32px • ตัวหนาพิเศษ • สไตล์โมเดิร์น</p>
                </button>

                {/* 2. Heading 1 */}
                <button
                  onClick={() =>
                    onAddText &&
                    onAddText({
                      text: "หัวข้อเอกสารหลัก (Heading 1)",
                      fontSize: 22,
                      fontWeight: "bold",
                      fill: "#1E293B",
                    })
                  }
                  className="w-full text-left p-2.5 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all cursor-pointer bg-white shadow-2xs"
                >
                  <p className="font-bold text-base text-gray-900">หัวข้อใหญ่ (Heading 1)</p>
                  <p className="text-[11px] text-gray-400">22px • ตัวหนา (Bold)</p>
                </button>

                {/* 3. Heading 2 */}
                <button
                  onClick={() =>
                    onAddText &&
                    onAddText({
                      text: "หัวข้อย่อย (Heading 2)",
                      fontSize: 16,
                      fontWeight: 600,
                      fill: "#334155",
                    })
                  }
                  className="w-full text-left p-2.5 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all cursor-pointer bg-white shadow-2xs"
                >
                  <p className="font-bold text-sm text-gray-800">หัวข้อย่อย (Heading 2)</p>
                  <p className="text-[11px] text-gray-400">16px • กึ่งหนา (Semi-Bold)</p>
                </button>

                {/* 4. Body Text */}
                <button
                  onClick={() =>
                    onAddText &&
                    onAddText({
                      text: "ข้อความเนื้อหาเอกสาร รายละเอียด หรือเงื่อนไขต่างๆ เพื่อความชัดเจนและอ่านง่าย...",
                      fontSize: 12,
                      fontWeight: "normal",
                      fill: "#334155",
                      lineHeight: 1.5,
                    })
                  }
                  className="w-full text-left p-2.5 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all cursor-pointer bg-white shadow-2xs"
                >
                  <p className="text-xs text-gray-700">เนื้อหาเอกสาร (Body Text)</p>
                  <p className="text-[11px] text-gray-400">12px • ขนาดมาตรฐาน • ระยะบรรทัด 1.5</p>
                </button>

                {/* 5. Callout Lead */}
                <button
                  onClick={() =>
                    onAddText &&
                    onAddText({
                      text: "ข้อความเกริ่นนำหรือประเด็นไฮไลท์สำคัญของเอกสารฉบับนี้",
                      fontSize: 14,
                      fontWeight: 500,
                      fill: "#4338CA",
                      lineHeight: 1.4,
                    })
                  }
                  className="w-full text-left p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 transition-all cursor-pointer"
                >
                  <p className="font-semibold text-xs text-indigo-700">ข้อความเน้นนำสายตา (Callout Lead)</p>
                  <p className="text-[11px] text-indigo-400">14px • กึ่งหนา • สีน้ำเงินเน้นย้ำ</p>
                </button>

                {/* 6. Metric Stat */}
                <button
                  onClick={() =>
                    onAddText &&
                    onAddText({
                      text: "+98.5%",
                      fontSize: 44,
                      fontWeight: 800,
                      fill: "#4F46E5",
                    })
                  }
                  className="w-full text-left p-2.5 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all cursor-pointer bg-white shadow-2xs"
                >
                  <p className="font-extrabold text-2xl text-indigo-600 leading-tight">+98.5%</p>
                  <p className="text-[11px] text-gray-400">44px • ตัวเลขสถิติเด่น (Metric Stat)</p>
                </button>

                {/* 7. Step Section Title */}
                <button
                  onClick={() =>
                    onAddText &&
                    onAddText({
                      text: "01. ข้อมูลทั่วไปและขอบเขตข้อตกลง",
                      fontSize: 15,
                      fontWeight: 700,
                      fill: "#0F172A",
                    })
                  }
                  className="w-full text-left p-2.5 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all cursor-pointer bg-white shadow-2xs"
                >
                  <p className="font-bold text-xs text-gray-900">01. หัวข้อระบุเลขขั้นตอน (Step)</p>
                  <p className="text-[11px] text-gray-400">15px • สไตล์รายงานและสัญญามืออาชีพ</p>
                </button>

                {/* 8. Small Footer Note */}
                <button
                  onClick={() =>
                    onAddText &&
                    onAddText({
                      text: "* หมายเหตุ: ข้อกำหนดและเงื่อนไขนี้มีผลบังคับใช้ตั้งแต่วันที่ระบุในสัญญาเป็นต้นไป",
                      fontSize: 10,
                      fontStyle: "italic",
                      fill: "#64748B",
                    })
                  }
                  className="w-full text-left p-2 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all cursor-pointer bg-white shadow-2xs"
                >
                  <p className="italic text-[11px] text-gray-500">* หมายเหตุ / คำชี้แจงย่อย (Note)</p>
                  <p className="text-[10px] text-gray-400">10px • ตัวเอียง • ข้อมูลท้ายเอกสาร</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: SHAPES ── */}
        {activeTab === "shapes" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                โครงสร้างการ์ด & ป้ายกำกับ
              </h2>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {/* Container Card with Shadow */}
                <button
                  onClick={() => onAddShape && onAddShape({ type: "card" })}
                  className="p-2.5 rounded-xl border border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50/40 flex flex-col items-center gap-1.5 transition-all cursor-pointer bg-white shadow-2xs group"
                  title="การ์ดคอนเทนเนอร์พร้อมเงา (Container Card)"
                >
                  <div className="w-7 h-5 border-2 border-indigo-500 bg-indigo-50/60 rounded-md shadow-xs" />
                  <span className="text-[11px] font-bold text-indigo-900 group-hover:text-indigo-600">การ์ดพร้อมเงา</span>
                </button>

                {/* Slanted Badge */}
                <button
                  onClick={() => onAddShape && onAddShape({ type: "slanted-badge" })}
                  className="p-2.5 rounded-xl border border-red-200 hover:border-red-500 hover:bg-red-50/40 flex flex-col items-center gap-1.5 transition-all cursor-pointer bg-white shadow-2xs group"
                  title="ป้ายหัวข้อเฉียง (Slanted Badge)"
                >
                  <div className="w-7 h-5 bg-red-600 -skew-x-12 rounded-xs" />
                  <span className="text-[11px] font-bold text-red-900 group-hover:text-red-600">ป้ายเฉียง</span>
                </button>

                {/* Accent Stripe Bar */}
                <button
                  onClick={() => onAddShape && onAddShape({ type: "accent-bar" })}
                  className="p-2.5 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/30 flex flex-col items-center gap-1.5 transition-all cursor-pointer bg-white shadow-2xs"
                  title="แถบสีเน้นขอบการ์ด"
                >
                  <div className="w-8 h-2 bg-red-600 rounded-full" />
                  <span className="text-[11px] font-medium text-gray-700">แถบสีขอบล่าง</span>
                </button>

                {/* Diamond */}
                <button
                  onClick={() => onAddShape && onAddShape({ type: "diamond" })}
                  className="p-2.5 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/30 flex flex-col items-center gap-1.5 transition-all cursor-pointer bg-white shadow-2xs"
                  title="สี่เหลี่ยมขนมเปียกปูน / เพชร"
                >
                  <div className="w-4 h-4 border-2 border-indigo-600 rotate-45 my-0.5" />
                  <span className="text-[11px] font-medium text-gray-700">เพชร / ข้าวหลามตัด</span>
                </button>

                {/* Hexagon */}
                <button
                  onClick={() => onAddShape && onAddShape({ type: "hexagon" })}
                  className="p-2.5 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/30 flex flex-col items-center gap-1.5 transition-all cursor-pointer bg-white shadow-2xs col-span-2"
                  title="หกเหลี่ยม (Hexagon)"
                >
                  <Shapes className="w-5 h-5 text-emerald-600" />
                  <span className="text-[11px] font-medium text-gray-700">หกเหลี่ยม (Hexagon)</span>
                </button>
              </div>

              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                รูปทรงเรขาคณิต & เส้น
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {/* 1. Rectangle */}
                <button
                  onClick={() => onAddShape && onAddShape({ type: "rect" })}
                  className="p-2.5 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/30 flex flex-col items-center gap-1.5 transition-all cursor-pointer bg-white shadow-2xs"
                  title="สี่เหลี่ยมผืนผ้า"
                >
                  <Square className="w-5 h-5 text-gray-700" />
                  <span className="text-[11px] font-medium text-gray-700">สี่เหลี่ยม</span>
                </button>

                {/* 2. Rounded Card */}
                <button
                  onClick={() => onAddShape && onAddShape({ type: "rounded-rect" })}
                  className="p-2.5 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/30 flex flex-col items-center gap-1.5 transition-all cursor-pointer bg-white shadow-2xs"
                  title="การ์ดสี่เหลี่ยมมุมมน"
                >
                  <div className="w-5 h-5 border-2 border-gray-700 rounded-md" />
                  <span className="text-[11px] font-medium text-gray-700">การ์ดมุมมน</span>
                </button>

                {/* 3. Circle */}
                <button
                  onClick={() => onAddShape && onAddShape({ type: "circle" })}
                  className="p-2.5 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/30 flex flex-col items-center gap-1.5 transition-all cursor-pointer bg-white shadow-2xs"
                  title="วงกลม"
                >
                  <Circle className="w-5 h-5 text-gray-700" />
                  <span className="text-[11px] font-medium text-gray-700">วงกลม</span>
                </button>

                {/* 4. Ellipse */}
                <button
                  onClick={() => onAddShape && onAddShape({ type: "ellipse" })}
                  className="p-2.5 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/30 flex flex-col items-center gap-1.5 transition-all cursor-pointer bg-white shadow-2xs"
                  title="วงรี"
                >
                  <div className="w-6 h-4 border-2 border-gray-700 rounded-full" />
                  <span className="text-[11px] font-medium text-gray-700">วงรี</span>
                </button>

                {/* 5. Triangle */}
                <button
                  onClick={() => onAddShape && onAddShape({ type: "triangle" })}
                  className="p-2.5 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/30 flex flex-col items-center gap-1.5 transition-all cursor-pointer bg-white shadow-2xs"
                  title="สามเหลี่ยม"
                >
                  <Triangle className="w-5 h-5 text-gray-700" />
                  <span className="text-[11px] font-medium text-gray-700">สามเหลี่ยม</span>
                </button>

                {/* 6. 5-Point Star */}
                <button
                  onClick={() => onAddShape && onAddShape({ type: "star" })}
                  className="p-2.5 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/30 flex flex-col items-center gap-1.5 transition-all cursor-pointer bg-white shadow-2xs"
                  title="ดาว 5 แฉก"
                >
                  <Star className="w-5 h-5 text-gray-700" />
                  <span className="text-[11px] font-medium text-gray-700">ดาว 5 แฉก</span>
                </button>

                {/* 7. Direction Arrow */}
                <button
                  onClick={() => onAddShape && onAddShape({ type: "arrow" })}
                  className="p-2.5 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/30 flex flex-col items-center gap-1.5 transition-all cursor-pointer bg-white shadow-2xs"
                  title="ลูกศรชี้ทิศทาง"
                >
                  <ArrowRight className="w-5 h-5 text-gray-700" />
                  <span className="text-[11px] font-medium text-gray-700">ลูกศร</span>
                </button>

                {/* 8. Pill / Badge */}
                <button
                  onClick={() => onAddShape && onAddShape({ type: "pill" })}
                  className="p-2.5 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/30 flex flex-col items-center gap-1.5 transition-all cursor-pointer bg-white shadow-2xs"
                  title="ป้ายสถานะแคปซูล"
                >
                  <Tag className="w-5 h-5 text-gray-700" />
                  <span className="text-[11px] font-medium text-gray-700">ป้ายแคปซูล</span>
                </button>

                {/* 9. Solid Divider Line */}
                <button
                  onClick={() => onAddShape && onAddShape({ type: "line" })}
                  className="p-2.5 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/30 flex flex-col items-center gap-1.5 transition-all cursor-pointer bg-white shadow-2xs"
                  title="เส้นคั่นทึบ"
                >
                  <Minus className="w-5 h-5 text-gray-700" />
                  <span className="text-[11px] font-medium text-gray-700">เส้นคั่นทึบ</span>
                </button>

                {/* 10. Dashed Divider Line */}
                <button
                  onClick={() => onAddShape && onAddShape({ type: "dashed-line" })}
                  className="p-2.5 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/30 flex flex-col items-center gap-1.5 transition-all cursor-pointer bg-white shadow-2xs"
                  title="เส้นประ"
                >
                  <div className="w-6 h-0.5 border-t-2 border-dashed border-gray-700 my-2" />
                  <span className="text-[11px] font-medium text-gray-700">เส้นประ</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: VECTOR ICONS ── */}
        {activeTab === "icons" && (
          <div className="space-y-4">
            <div>
              {/* 💡 Replace In-Place Indicator Banner */}
              {isReplacingIcon && (
                <div className="mb-3 p-2.5 rounded-xl bg-indigo-50/90 border border-indigo-200 text-indigo-950 text-[11px] flex items-center gap-2 animate-fadeIn shadow-2xs">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 animate-pulse" />
                  <div>
                    <span className="font-bold text-indigo-700">โหมดแทนที่ไอคอน:</span>
                    <span className="text-indigo-800/90 ml-1">คลิกไอคอนด้านล่างเพื่อเปลี่ยนแทนที่อันเดิมทันที</span>
                  </div>
                </div>
              )}

              {/* Search Box */}
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  placeholder="ค้นหาไอคอน (เช่น เงิน, เอกสาร, phone, user...)"
                  className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1 mb-3">
                {ICON_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedIconCat(cat.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
                      selectedIconCat === cat.id
                        ? "bg-indigo-600 text-white shadow-2xs"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Icons Grid */}
              <div className="grid grid-cols-3 gap-2">
                {VECTOR_ICONS
                  .filter((icon) => {
                    const matchCat = selectedIconCat === "all" || icon.category === selectedIconCat;
                    const q = iconSearch.trim().toLowerCase();
                    const matchSearch =
                      !q ||
                      icon.label.toLowerCase().includes(q) ||
                      icon.id.toLowerCase().includes(q) ||
                      icon.category.toLowerCase().includes(q);
                    return matchCat && matchSearch;
                  })
                  .map((icon) => (
                    <button
                      key={icon.id}
                      onClick={() => onAddIcon && onAddIcon(icon)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs group ${
                        isReplacingIcon
                          ? "border-indigo-200 hover:border-indigo-600 hover:bg-indigo-50/80 bg-indigo-50/20"
                          : "border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/40 bg-white"
                      }`}
                      title={isReplacingIcon ? `คลิกเพื่อสลับเป็น ${icon.label}` : icon.label}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-700 group-hover:text-indigo-600 group-hover:scale-110 transition-transform">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                          <path d={icon.path} />
                        </svg>
                      </div>
                      <span className="text-[10px] font-medium text-gray-600 group-hover:text-indigo-900 truncate w-full text-center">
                        {icon.label.split(" ")[0]}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: UPLOADS ── */}
        {activeTab === "uploads" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                อัปโหลดรูปภาพ / โลโก้
              </h2>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-5 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 flex flex-col items-center justify-center gap-2 text-indigo-700 transition-colors cursor-pointer"
              >
                <UploadCloud className="w-8 h-8 text-indigo-500" />
                <span className="text-xs font-bold">เลือกไฟล์รูปภาพ / โลโก้</span>
                <span className="text-[10px] text-gray-400">PNG, JPG, SVG</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Unified Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(tokenToDelete)}
        onClose={() => {
          if (!isDeletingToken) setTokenToDelete(null);
        }}
        onConfirm={handleConfirmDeleteToken}
        isLoading={isDeletingToken}
        title="ลบตัวแปรนี้?"
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบตัวแปร "${tokenToDelete?.label || tokenToDelete?.key || ""}" ออกจากระบบ? การกระทำนี้ไม่สามารถย้อนกลับได้`}
        cancelText="ยกเลิก"
        confirmText="ลบตัวแปร"
      />
    </aside>
  );
}