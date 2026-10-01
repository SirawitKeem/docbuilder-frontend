"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Search,
  Check,
  Type,
  Loader2,
} from "lucide-react";
import { CURATED_THAI_FONTS, buildGoogleFontsUrl } from "@/lib/fonts/fontRegistry";

const CATEGORIES = [
  { id: "all", label: "ทั้งหมด" },
  { id: "sans", label: "Sans" },
  { id: "serif", label: "Serif" },
  { id: "script", label: "Script" },
];

export default function GoogleFontPickerModal({
  isOpen,
  onClose,
  onFontSelect,
  installedFonts = [],
}) {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [previewFont, setPreviewFont] = useState(CURATED_THAI_FONTS[0]);
  const [customSampleText, setCustomSampleText] = useState("แบบอักษรภาษาไทย ทดสอบ ๑๒๓ | DocBuilder 2026");
  const [isInstalling, setIsInstalling] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Client-side portal mounting check
  useEffect(() => {
    setMounted(true);
  }, []);

  // Preload all curated Google Fonts into <head> when modal opens for instant live preview
  useEffect(() => {
    if (!isOpen) return;
    const linkId = "gfont-curated-preview-bundle";
    if (!document.getElementById(linkId)) {
      const url = buildGoogleFontsUrl(CURATED_THAI_FONTS);
      if (url) {
        const link = document.createElement("link");
        link.id = linkId;
        link.rel = "stylesheet";
        link.href = url;
        document.head.appendChild(link);
      }
    }
  }, [isOpen]);

  // Set of installed font IDs or families
  const installedSet = useMemo(() => {
    const set = new Set();
    for (const f of installedFonts) {
      if (f.id) set.add(f.id.toLowerCase());
      if (f.family) set.add(f.family.toLowerCase());
    }
    return set;
  }, [installedFonts]);

  // Clean font display name helper (strips any parentheses)
  const getCleanName = (font) => {
    if (!font) return "";
    return (font.name || font.family || "").replace(/\s*\([^)]*\)/g, "").trim();
  };

  // Filter fonts
  const filteredFonts = useMemo(() => {
    return CURATED_THAI_FONTS.filter((font) => {
      const cleanName = getCleanName(font).toLowerCase();
      const family = (font.family || "").toLowerCase();
      const q = searchQuery.trim().toLowerCase();

      const matchSearch = !q || cleanName.includes(q) || family.includes(q);

      const matchCat =
        selectedCategory === "all" ||
        (selectedCategory === "sans" && font.category.includes("sans")) ||
        (selectedCategory === "serif" && font.category.includes("serif")) ||
        (selectedCategory === "script" && font.category.includes("script"));

      return matchSearch && matchCat;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen || !mounted) return null;

  const isCurrentFontInstalled =
    previewFont &&
    (installedSet.has(previewFont.id.toLowerCase()) ||
      installedSet.has(previewFont.family.toLowerCase()));

  const handleInstallAndApply = async () => {
    if (!previewFont) return;
    setIsInstalling(true);
    setStatusMessage(null);

    try {
      if (!isCurrentFontInstalled) {
        const res = await fetch("/api/fonts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fontId: previewFont.id }),
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || "Failed to install font");
        }
      }

      // Inject font link into head if not present
      const fullUrl = buildGoogleFontsUrl([previewFont]);
      if (fullUrl) {
        const linkId = `gfont-active-${previewFont.id}`;
        if (!document.getElementById(linkId)) {
          const link = document.createElement("link");
          link.id = linkId;
          link.rel = "stylesheet";
          link.href = fullUrl;
          document.head.appendChild(link);
        }
      }

      if (onFontSelect) {
        onFontSelect(previewFont);
      }
      onClose();
    } catch (err) {
      console.error("Install font error:", err);
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setIsInstalling(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-4xl h-[560px] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-3.5 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Type size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                Select Google Fonts
              </h2>
              <p className="text-[11px] text-gray-500">
                เพิ่มฟอนต์ภาษาไทยสำหรับเอกสารและสไลด์พรีเซนเทชัน
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Minimalist Search & Category Filter */}
        <div className="px-6 py-2.5 border-b border-gray-100 flex items-center justify-between gap-3 bg-gray-50/50">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาฟอนต์ (เช่น Kanit, Prompt)..."
              className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-800"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-gray-600 hover:bg-gray-200/70"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Split View: Single Scrollbar on Left, Clean Fixed Stage on Right */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Font List (Single clean scrollbar) */}
          <div className="w-5/12 border-r border-gray-100 overflow-y-auto p-3 space-y-1.5 bg-gray-50/30">
            {filteredFonts.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                ไม่พบแบบอักษรที่ค้นหา
              </div>
            ) : (
              filteredFonts.map((font) => {
                const isSelected = previewFont?.id === font.id;
                const isInstalled =
                  installedSet.has(font.id.toLowerCase()) ||
                  installedSet.has(font.family.toLowerCase());
                const cleanName = getCleanName(font);

                return (
                  <div
                    key={font.id}
                    onClick={() => setPreviewFont(font)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white border-indigo-500 shadow-xs ring-1 ring-indigo-500/30"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-xs text-gray-900">
                        {cleanName}
                      </span>
                      {isInstalled ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          <Check size={10} /> ติดตั้งแล้ว
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">
                          Google Fonts
                        </span>
                      )}
                    </div>
                    {/* Typographic Preview Line */}
                    <div
                      className="text-sm text-gray-700 truncate tracking-normal"
                      style={{ fontFamily: font.cssStack }}
                    >
                      แบบอักษรภาษาไทย กขค ๑๒๓
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Live Stage (Clean, Fixed Height, No Scrollbar) */}
          <div className="w-7/12 flex flex-col justify-between p-5 bg-white">
            {previewFont ? (
              <div className="space-y-3">
                {/* Title & Badge */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {getCleanName(previewFont)}
                    </h3>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {previewFont.family}
                    </span>
                  </div>
                  {isCurrentFontInstalled ? (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                      <Check size={12} /> พร้อมใช้งานในระบบ
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                      Google Fonts
                    </span>
                  )}
                </div>

                {/* Custom Test Text Input */}
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">
                    ทดสอบพิมพ์ข้อความ:
                  </label>
                  <input
                    type="text"
                    value={customSampleText}
                    onChange={(e) => setCustomSampleText(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-indigo-500"
                    placeholder="พิมพ์ข้อความที่ต้องการทดสอบ..."
                  />
                </div>

                {/* Live Rendering Stage */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-3">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">
                      พาดหัว (Heading 24px)
                    </span>
                    <h1
                      className="text-xl font-bold text-gray-900 leading-snug truncate"
                      style={{ fontFamily: previewFont.cssStack }}
                    >
                      {customSampleText || "แบบอักษรภาษาไทย DocBuilder"}
                    </h1>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">
                      ข้อความทั่วไป (Body 14px)
                    </span>
                    <p
                      className="text-xs text-gray-700 leading-relaxed"
                      style={{ fontFamily: previewFont.cssStack }}
                    >
                      แบบอักษร {getCleanName(previewFont)} สระบน สระล่าง วรรณยุกต์ และการตัดคำภาษาไทยมีความถูกต้อง สวยงาม รองรับทั้งงานพิมพ์ PDF และสไลด์ PPTX
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">
                      ชุดอักขระ (Characters)
                    </span>
                    <p
                      className="text-[11px] text-gray-500 font-normal truncate"
                      style={{ fontFamily: previewFont.cssStack }}
                    >
                      กขคงจฉชซดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ • ๑๒๓๔๕๖๗๘๙๐ • ABCDEFGHIJKLMNOPQRSTUVWXYZ 1234567890
                    </p>
                  </div>
                </div>

                {statusMessage && (
                  <div
                    className={`p-2 rounded-lg text-xs ${
                      statusMessage.type === "error"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {statusMessage.text}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">
                เลือกแบบอักษรเพื่อดูตัวอย่าง
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleInstallAndApply}
                disabled={isInstalling || !previewFont}
                className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isInstalling ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    กำลังประมวลผล...
                  </>
                ) : isCurrentFontInstalled ? (
                  <>
                    <Check size={13} />
                    เลือกใช้ฟอนต์นี้
                  </>
                ) : (
                  <>
                    <Type size={13} />
                    เพิ่มและใช้ฟอนต์นี้
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
