"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  FileText,
  Presentation,
  Table,
  SlidersHorizontal,
  ArrowRight,
  Sparkles,
  Check,
  Maximize2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { QUICK_CUSTOM_PRESETS } from "@/lib/editor/canvasPresets";

export default function NewTemplateTypeModal({
  isOpen,
  onClose,
  onSelect,
  categoryName = "",
}) {
  const { t } = useLanguage();

  // Active view mode: 'standard' or 'custom'
  const [activeMode, setActiveMode] = useState("standard"); // 'standard' | 'custom'

  // Custom dimensions state
  const [unit, setUnit] = useState("mm"); // 'mm' | 'px'
  const [width, setWidth] = useState(297);
  const [height, setHeight] = useState(420);
  const [customName, setCustomName] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState("poster-a3");

  // Close on ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset states when opening
  useEffect(() => {
    if (isOpen) {
      setActiveMode("standard");
      setUnit("mm");
      setWidth(297);
      setHeight(420);
      setCustomName("");
      setSelectedPresetId("poster-a3");
    }
  }, [isOpen]);

  // Handle Quick Preset Selection
  const handleSelectQuickPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setUnit(preset.unit);
    setWidth(preset.width);
    setHeight(preset.height);
    if (!customName || customName.startsWith("โปสเตอร์") || customName.startsWith("Poster")) {
      setCustomName(preset.label);
    }
  };

  // Compute live aspect ratio for the preview silhouette
  const aspectRatioRatio = useMemo(() => {
    const w = parseFloat(width) || 1;
    const h = parseFloat(height) || 1;
    const maxRatio = Math.max(w, h);
    return {
      wRatio: (w / maxRatio) * 100,
      hRatio: (h / maxRatio) * 100,
      isLandscape: w > h,
      ratioText: w === h ? "1:1" : `${(w / Math.min(w, h)).toFixed(1)} : ${(h / Math.min(w, h)).toFixed(1)}`,
    };
  }, [width, height]);

  // Submit custom format
  const handleConfirmCustom = (e) => {
    e?.preventDefault();
    const w = Math.max(10, parseFloat(width) || 100);
    const h = Math.max(10, parseFloat(height) || 100);
    onSelect?.("custom", {
      width: w,
      height: h,
      unit,
      name: customName.trim() || `กำหนดขนาดเอง (${w} × ${h} ${unit})`,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 dark:bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border/80 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col animate-in fade-in zoom-in-[0.98] duration-150 overflow-hidden text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between shrink-0 bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <Sparkles size={17} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground tracking-tight">
                  {t('newTemplate.title') || "เลือกรูปแบบการสร้างเทมเพลต"}
                </h2>
                {categoryName && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
                    {categoryName}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                เลือกรูปแบบเอกสารมาตรฐาน หรือกำหนดขนาดอิสระสำหรับโปสเตอร์ สื่อโซเชียล และสิ่งพิมพ์
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center cursor-pointer"
            title="ปิดหน้าต่าง (ESC)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 bg-muted/20 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Format Type Selection Grid (4 Minimal Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Docs (A4) */}
            <div
              onClick={() => onSelect?.("document")}
              className="group bg-surface hover:bg-muted/40 rounded-xl border border-border/80 hover:border-foreground/30 p-4.5 flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all duration-150 cursor-pointer text-left relative"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/50 flex items-center justify-center transition-transform group-hover:scale-105">
                    <FileText size={20} />
                  </div>
                  <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">
                    A4
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {t('newTemplate.docs') || "Docs (เอกสาร A4)"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                  สัญญา ใบเสนอราคา ใบเสร็จ ประกาศทางการ พร้อมระบบตารางและฟิลด์อัตโนมัติ
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground font-mono">210 × 297 mm</span>
                <span className="text-xs font-medium text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  สร้าง <ArrowRight size={12} />
                </span>
              </div>
            </div>

            {/* 2. Slides (16:9) */}
            <div
              onClick={() => onSelect?.("slide")}
              className="group bg-surface hover:bg-muted/40 rounded-xl border border-border/80 hover:border-foreground/30 p-4.5 flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all duration-150 cursor-pointer text-left relative"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50 flex items-center justify-center transition-transform group-hover:scale-105">
                    <Presentation size={20} />
                  </div>
                  <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">
                    16:9
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-foreground group-hover:text-amber-600 transition-colors">
                  {t('newTemplate.slides') || "Slides (งานนำเสนอ)"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                  สไลด์ Pitch Deck แนะนำบริษัท รายงานผลงาน และส่งออกเป็น PDF เวกเตอร์
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground font-mono">1280 × 720 px</span>
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  สร้าง <ArrowRight size={12} />
                </span>
              </div>
            </div>

            {/* 3. Sheets (.xlsx) */}
            <div
              onClick={() => onSelect?.("sheet")}
              className="group bg-surface hover:bg-muted/40 rounded-xl border border-border/80 hover:border-foreground/30 p-4.5 flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all duration-150 cursor-pointer text-left relative"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 flex items-center justify-center transition-transform group-hover:scale-105">
                    <Table size={20} />
                  </div>
                  <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">
                    .xlsx
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-foreground group-hover:text-emerald-600 transition-colors">
                  {t('newTemplate.sheets') || "Sheets (ตารางคำนวณ)"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                  บัญชีสินค้า ใบแจกแจงราคา พร้อมสูตรคำนวณอัตโนมัติและส่งออก Excel แท้
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground font-mono">Excel Grid</span>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  สร้าง <ArrowRight size={12} />
                </span>
              </div>
            </div>

            {/* 4. Custom Size / Poster */}
            <div
              onClick={() => setActiveMode(activeMode === "custom" ? "standard" : "custom")}
              className={`group rounded-xl border p-4.5 flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all duration-150 cursor-pointer text-left relative ${
                activeMode === "custom"
                  ? "bg-primary/[0.04] dark:bg-primary/[0.12] border-primary ring-1 ring-primary/60"
                  : "bg-surface hover:bg-muted/40 border-border/80 hover:border-foreground/30"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 border ${
                      activeMode === "custom"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/50"
                    }`}
                  >
                    <SlidersHorizontal size={18} />
                  </div>
                  <span
                    className={`text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full border ${
                      activeMode === "custom"
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-muted text-muted-foreground border-border/50"
                    }`}
                  >
                    กำหนดเอง
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  กำหนดขนาดเอง
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                  สำหรับโปสเตอร์ (Poster), แบนเนอร์, ป้ายประกาศ หรือสัดส่วนอิสระตามต้องการ
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground font-mono">Poster / Custom</span>
                <span className="text-xs font-medium text-primary flex items-center gap-1">
                  {activeMode === "custom" ? "เปิดอยู่ ↓" : "ปรับขนาด →"}
                </span>
              </div>
            </div>
          </div>

          {/* Custom Size Configuration Panel (Expands when activeMode === 'custom') */}
          {activeMode === "custom" && (
            <div className="bg-surface rounded-xl border border-border p-5 shadow-xs animate-in fade-in slide-in-from-top-2 duration-150 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Maximize2 size={16} className="text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">
                    ตั้งค่าขนาดและสัดส่วนแคนวาส (Custom Canvas Dimensions)
                  </h4>
                </div>
                <span className="text-xs text-muted-foreground">
                  เลือกพรีเซ็ตหรือระบุความกว้าง × ความสูงได้ทันที
                </span>
              </div>

              {/* Quick Presets Pills */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  ขนาดสำเร็จรูปยอดนิยม (Quick Presets)
                </label>
                <div className="flex flex-wrap gap-2">
                  {QUICK_CUSTOM_PRESETS.map((p) => {
                    const isSelected = selectedPresetId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectQuickPreset(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                            : "bg-surface hover:bg-muted text-foreground border-border/70 hover:border-foreground/30"
                        }`}
                      >
                        {isSelected && <Check size={13} className="shrink-0" />}
                        <span>{p.label}</span>
                        <span className="opacity-70 text-[11px]">({p.width}×{p.height} {p.unit})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dimension Inputs & Live Silhouette Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-1">
                {/* Inputs (2 columns) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Width */}
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1.5">
                        ความกว้าง (Width)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="10"
                          max="10000"
                          value={width}
                          onChange={(e) => {
                            setSelectedPresetId(null);
                            setWidth(e.target.value);
                          }}
                          className="w-full h-9 px-3 pr-10 rounded-lg border border-border bg-muted/20 focus:bg-surface focus:border-primary focus:outline-none text-xs font-mono text-foreground font-semibold"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none">
                          {unit}
                        </span>
                      </div>
                    </div>

                    {/* Height */}
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1.5">
                        ความสูง (Height)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="10"
                          max="10000"
                          value={height}
                          onChange={(e) => {
                            setSelectedPresetId(null);
                            setHeight(e.target.value);
                          }}
                          className="w-full h-9 px-3 pr-10 rounded-lg border border-border bg-muted/20 focus:bg-surface focus:border-primary focus:outline-none text-xs font-mono text-foreground font-semibold"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none">
                          {unit}
                        </span>
                      </div>
                    </div>

                    {/* Unit Switcher */}
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1.5">
                        หน่วยวัด (Unit)
                      </label>
                      <div className="h-9 p-1 bg-muted/40 rounded-lg border border-border/70 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (unit !== "mm") {
                              setUnit("mm");
                              setWidth(Math.round(width * 0.264583) || 210);
                              setHeight(Math.round(height * 0.264583) || 297);
                            }
                          }}
                          className={`flex-1 h-full rounded-md text-xs font-semibold transition-all cursor-pointer ${
                            unit === "mm"
                              ? "bg-surface text-foreground shadow-2xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          มม. (mm)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (unit !== "px") {
                              setUnit("px");
                              setWidth(Math.round(width * 3.7795) || 1080);
                              setHeight(Math.round(height * 3.7795) || 1920);
                            }
                          }}
                          className={`flex-1 h-full rounded-md text-xs font-semibold transition-all cursor-pointer ${
                            unit === "px"
                              ? "bg-surface text-foreground shadow-2xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          พิกเซล (px)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Optional Template Title */}
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1.5">
                      ชื่อแม่แบบ (Template Name) <span className="text-muted-foreground text-[11px] font-normal">(ไม่ระบุก็ได้)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น โปสเตอร์งานสัมมนาประจำปี, แบนเนอร์แคมเปญใหม่..."
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 focus:bg-surface focus:border-primary focus:outline-none text-xs text-foreground placeholder:text-muted-foreground/60"
                    />
                  </div>
                </div>

                {/* Live Proportion Silhouette Preview */}
                <div className="bg-muted/30 border border-border/70 rounded-xl p-4 flex flex-col items-center justify-center min-h-[140px]">
                  <span className="text-[11px] font-medium text-muted-foreground mb-3">
                    สัดส่วนพรีวิว ({aspectRatioRatio.ratioText})
                  </span>
                  <div className="w-24 h-24 flex items-center justify-center">
                    <div
                      style={{
                        width: `${Math.max(20, aspectRatioRatio.wRatio * 0.9)}%`,
                        height: `${Math.max(20, aspectRatioRatio.hRatio * 0.9)}%`,
                      }}
                      className="bg-primary/20 border-2 border-primary rounded-sm transition-all duration-200 flex items-center justify-center text-[9px] font-mono text-primary font-bold shadow-2xs"
                    >
                      {aspectRatioRatio.isLandscape ? "W" : "H"}
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-foreground font-semibold mt-2">
                    {width} × {height} {unit}
                  </span>
                </div>
              </div>

              {/* Submit Button inside custom panel */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setActiveMode("standard")}
                  className="inline-flex items-center justify-center h-9 px-3.5 rounded-[8px] border border-border hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-2xs"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCustom}
                  className="primary-button inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] text-white text-xs font-medium shadow-xs hover:opacity-95 transition-all cursor-pointer"
                >
                  <span>เริ่มสร้างเทมเพลตขนาดนี้</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-surface border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <span>กด ESC เพื่อยกเลิก</span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-9 px-4 rounded-[8px] border border-border bg-surface hover:bg-muted text-foreground text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            {t('actions.cancel') || "ยกเลิก"}
          </button>
        </div>
      </div>
    </div>
  );
}