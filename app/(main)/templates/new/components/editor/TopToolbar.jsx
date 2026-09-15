"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Ruler,
  Save,
  Edit2,
  Check,
  Sparkles,
  Download,
  Loader2,
  Minus,
  Plus,
  Hand,
  ChevronDown,
  Maximize2,
  Focus,
} from "lucide-react";
import { getCanvasPreset } from "@/lib/editor/canvasPresets";

export default function TopToolbar({
  templateName,
  onUpdateTemplateName,
  categoryName,
  editorType = "document",
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitToScreen,
  onZoomTo100,
  onZoomToSelection,
  onResetPan,
  onSetCustomZoom,
  isHandToolActive = false,
  onToggleHandTool,
  showRuler,
  onToggleRuler,
  showMargin,
  onToggleMargin,
  marginMm = 15,
  marginPx = 56,
  onUpdateMargin,
  canvasPreset = "a4-portrait",
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  saving,
  isPreviewTokens = false,
  onTogglePreviewTokens,
  onExportPptx,
  isExportingPptx = false,
  onExportPdf,
  isExportingPdf = false,
}) {
  const preset = getCanvasPreset(canvasPreset);
  const isSlide = editorType === "slide";
  const isMetric = Boolean(preset?.mmWidth);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(templateName);
  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const zoomMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (zoomMenuRef.current && !zoomMenuRef.current.contains(e.target)) {
        setShowZoomMenu(false);
      }
    };
    if (showZoomMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showZoomMenu]);

  const currentVal = isMetric
    ? (marginMm !== null && marginMm !== undefined ? marginMm : 15)
    : (marginPx !== null && marginPx !== undefined ? marginPx : 40);

  const [inputStr, setInputStr] = useState(String(currentVal));

  useEffect(() => {
    setInputStr(String(currentVal));
  }, [currentVal]);

  const handleStep = (delta) => {
    if (!onUpdateMargin) return;
    const stepSize = isMetric ? 1 : 5;
    const nextVal = Math.max(0, currentVal + delta * stepSize);
    onUpdateMargin(nextVal, isMetric ? "mm" : "px");
    if (!showMargin && nextVal > 0 && onToggleMargin) {
      onToggleMargin();
    }
  };

  const handleInputChange = (e) => {
    const raw = e.target.value;
    setInputStr(raw);
    if (!onUpdateMargin) return;
    if (raw === "") return;
    const val = parseInt(raw, 10);
    if (!isNaN(val)) {
      const clamped = Math.max(0, Math.min(isMetric ? 60 : 200, val));
      onUpdateMargin(clamped, isMetric ? "mm" : "px");
      if (!showMargin && clamped > 0 && onToggleMargin) {
        onToggleMargin();
      }
    }
  };

  const handleInputBlur = () => {
    if (!onUpdateMargin) return;
    if (inputStr === "" || isNaN(parseInt(inputStr, 10))) {
      onUpdateMargin(0, isMetric ? "mm" : "px");
      setInputStr("0");
    } else {
      const clamped = Math.max(0, Math.min(isMetric ? 60 : 200, parseInt(inputStr, 10)));
      onUpdateMargin(clamped, isMetric ? "mm" : "px");
      setInputStr(String(clamped));
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      handleStep(1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      handleStep(-1);
    } else if (e.key === "Enter") {
      e.target.blur();
    }
  };

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      onUpdateTemplateName(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSaveTitle();
    if (e.key === "Escape") {
      setTitleInput(templateName);
      setIsEditingTitle(false);
    }
  };

  return (
    <header className="h-[53px] bg-white border-b border-gray-200 px-4 flex items-center justify-between select-none z-30 shadow-2xs">
      {/* ── LEFT: Back + Document Title ── */}
      <div className="flex items-center gap-3">
        <Link
          href="/templates"
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          title="ย้อนกลับไปหน้ารายการเทมเพลต"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="flex items-center gap-2">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                {isSlide ? `${categoryName} • Presentation (16:9)` : categoryName || "A4 Template"}
              </span>
            </div>

            {isEditingTitle ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="text-sm font-bold text-gray-900 bg-gray-50 border border-indigo-500 rounded px-2 py-0.5 outline-none"
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => {
                  setTitleInput(templateName || (isSlide ? "เทมเพลตสไลด์ใหม่ (16:9)" : "เทมเพลตเอกสารใหม่ (A4)"));
                  setIsEditingTitle(true);
                }}
                className="group flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded -ml-1 transition-colors"
                title="คลิกเพื่อเปลี่ยนชื่อเทมเพลต"
              >
                <h1 className="text-sm font-bold text-gray-900 leading-tight">
                  {templateName || (isSlide ? "เทมเพลตสไลด์ใหม่ (16:9)" : "เทมเพลตเอกสารใหม่ (A4)")}
                </h1>
                <Edit2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CENTER: History & Zoom & View Guides ── */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-md text-gray-700 hover:bg-white disabled:opacity-35 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="เลิกทำ (Undo - Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-md text-gray-700 hover:bg-white disabled:opacity-35 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="ทำซ้ำ (Redo - Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom & Viewport Navigation Controls */}
        <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5 text-gray-700 text-xs font-medium" ref={zoomMenuRef}>
          {/* Hand Tool Toggle Button */}
          {onToggleHandTool && (
            <button
              type="button"
              onClick={onToggleHandTool}
              className={`p-1.5 rounded-md transition-colors cursor-pointer mr-0.5 ${
                isHandToolActive
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "hover:bg-white text-gray-700"
              }`}
              title="เครื่องมือเลื่อนพื้นที่ Hand Tool (กด H หรือกด Spacebar ค้างเพื่อลากแคนวาส)"
            >
              <Hand className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onZoomOut}
            className="p-1.5 hover:bg-white rounded-md transition-colors cursor-pointer"
            title="ย่อขนาด (Ctrl + -)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Zoom Percentage Dropdown Trigger */}
          <button
            type="button"
            onClick={() => setShowZoomMenu(!showZoomMenu)}
            className="px-1.5 py-1 hover:bg-white rounded-md transition-colors cursor-pointer flex items-center gap-1 font-mono font-bold text-xs text-gray-800"
            title="เลือกระดับการซูม (คลิกเพื่อดูตัวเลือก)"
          >
            <span>{Math.round(zoom * 100)}%</span>
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </button>

          <button
            onClick={onZoomIn}
            className="p-1.5 hover:bg-white rounded-md transition-colors cursor-pointer"
            title="ขยายขนาด (Ctrl + +)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={onFitToScreen || onZoomReset}
            className="p-1.5 hover:bg-white rounded-md transition-colors border-l border-gray-200 ml-0.5 cursor-pointer"
            title="พอดีหน้าจอ Fit to Screen (Shift + 1)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Dropdown Popover */}
          {showZoomMenu && (
            <div className="absolute top-full left-0 mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-50 text-xs font-normal">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                การซูมและการจัดมุมมอง
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onFitToScreen) onFitToScreen();
                  else if (onZoomReset) onZoomReset();
                  setShowZoomMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>พอดีหน้าจอ (Fit to Screen)</span>
                </span>
                <kbd className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Shift+1</kbd>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onZoomToSelection) onZoomToSelection();
                  setShowZoomMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Focus className="w-3.5 h-3.5" />
                  <span>ซูมวัตถุที่เลือก (Selection)</span>
                </span>
                <kbd className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Shift+2</kbd>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onZoomTo100) onZoomTo100();
                  else if (onSetCustomZoom) onSetCustomZoom(1.0);
                  setShowZoomMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>ขนาดจริง 100%</span>
                </span>
                <kbd className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Ctrl+0</kbd>
              </button>

              <div className="border-t border-gray-100 my-1" />

              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                ระดับการซูม (Presets)
              </div>

              <div className="grid grid-cols-3 gap-1 px-2 py-1">
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((presetVal) => (
                  <button
                    key={presetVal}
                    type="button"
                    onClick={() => {
                      if (onSetCustomZoom) onSetCustomZoom(presetVal);
                      setShowZoomMenu(false);
                    }}
                    className={`px-2 py-1 text-center rounded font-mono text-xs transition-colors cursor-pointer ${
                      Math.round(zoom * 100) === Math.round(presetVal * 100)
                        ? "bg-indigo-600 text-white font-bold"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {Math.round(presetVal * 100)}%
                  </button>
                ))}
              </div>

              <div className="border-t border-gray-100 my-1" />

              <button
                type="button"
                onClick={() => {
                  if (onResetPan) onResetPan();
                  setShowZoomMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-between transition-colors cursor-pointer text-gray-600"
              >
                <span>จัดตำแหน่งกึ่งกลาง (Reset Pan)</span>
                <kbd className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Center</kbd>
              </button>
            </div>
          )}
        </div>

        {/* View Guides Toggles */}
        <div className="flex items-center gap-1.5 ml-1">
          <button
            onClick={onToggleRuler}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              showRuler
                ? "bg-slate-800 text-white border-slate-800 shadow-xs"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
            title={isMetric ? "เปิด/ปิด ไม้บรรทัดหน่วยมิลลิเมตร (mm)" : "เปิด/ปิด ไม้บรรทัดพิกเซล (px)"}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>{isMetric ? "ไม้บรรทัด (mm)" : "ไม้บรรทัด (px)"}</span>
          </button>

          {/* ── Direct Inline Margin Control (No Dropdown) ── */}
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${
              currentVal > 0 && showMargin
                ? "bg-rose-50/70 border-rose-200 text-rose-800"
                : "bg-white border-gray-200 text-gray-600"
            }`}
            title={
              currentVal === 0
                ? "ไม่มีเส้นขอบ (ระยะขอบเป็น 0)"
                : `ระยะขอบ: ${currentVal} ${isMetric ? "mm" : "px"} (ใส่ 0 เพื่อไม่มีเส้นขอบ)`
            }
          >
            {/* Margin Toggle / Label */}
            <button
              type="button"
              data-testid="margin-badge-btn"
              onClick={onToggleMargin}
              className={`text-xs select-none cursor-pointer flex items-center gap-1 transition-colors ${
                currentVal > 0 && showMargin
                  ? "text-rose-700 hover:text-rose-900 font-semibold"
                  : "text-gray-500 hover:text-gray-800 font-medium"
              }`}
              title={
                currentVal === 0
                  ? "ระยะขอบเป็น 0 (ไม่มีเส้นขอบ)"
                  : showMargin
                  ? "คลิกเพื่อซ่อนเส้นไกด์ระยะขอบ"
                  : "คลิกเพื่อเปิดเส้นไกด์ระยะขอบ"
              }
            >
              <span>Margin:</span>
            </button>

            {/* Stepper Minus */}
            <button
              type="button"
              data-testid="margin-minus-btn"
              onClick={() => handleStep(-1)}
              className="w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer transition-colors"
              title={isMetric ? "ลดระยะขอบ 1 mm" : "ลดระยะขอบ 5 px"}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            {/* Direct Number Input */}
            <div className="flex items-center">
              <input
                type="number"
                data-testid="margin-input"
                min={0}
                max={isMetric ? 60 : 200}
                value={inputStr}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                onFocus={(e) => e.target.select()}
                className="w-10 h-6 text-center font-mono font-bold text-xs bg-white border border-gray-300 rounded focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none text-gray-900 shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                title="คลิกเพื่อพิมพ์ตัวเลขระยะขอบที่ต้องการ (0 = ไม่มีเส้นขอบ)"
              />
            </div>

            <span className="text-[11px] font-bold text-gray-500 select-none">
              {isMetric ? "mm" : "px"}
            </span>

            {/* Stepper Plus */}
            <button
              type="button"
              data-testid="margin-plus-btn"
              onClick={() => handleStep(1)}
              className="w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer transition-colors"
              title={isMetric ? "เพิ่มระยะขอบ 1 mm" : "เพิ่มระยะขอบ 5 px"}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Preview & Save Button ── */}
      <div className="flex items-center gap-2">
        {/* Token Preview Toggle */}
        {onTogglePreviewTokens && (
          <button
            onClick={onTogglePreviewTokens}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isPreviewTokens
                ? "bg-amber-500 text-white border-amber-600 shadow-xs animate-pulse"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
            title={isPreviewTokens ? "คลิกเพื่อสลับกลับไปดูชื่อตัวแปร {{...}}" : "คลิกเพื่อแสดงตัวอย่างข้อมูลจริง"}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isPreviewTokens ? "พรีวิวข้อมูลจริง (ON)" : "พรีวิวข้อมูลจริง"}</span>
          </button>
        )}

        {/* ── PPTX Export Button: STRICTLY rendered ONLY when editorType === 'slide' ── */}
        {isSlide && onExportPptx && (
          <button
            onClick={onExportPptx}
            disabled={isExportingPptx}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all disabled:opacity-50 cursor-pointer"
            title="ดาวน์โหลดงานนำเสนอเป็นไฟล์ Microsoft PowerPoint (.pptx)"
          >
            {isExportingPptx ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isExportingPptx ? "กำลังสร้าง .pptx..." : "ดาวน์โหลด .pptx"}</span>
          </button>
        )}

        {/* ── Optional PDF Export Button: ONLY when editorType !== 'slide' ── */}
        {!isSlide && onExportPdf && (
          <button
            onClick={onExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 h-9 px-3.5 border border-border bg-white hover:bg-gray-50 text-gray-700 rounded-[8px] text-xs font-medium shadow-2xs hover:shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            title="ดาวน์โหลดเอกสารเป็นไฟล์ PDF"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <Download className="w-4 h-4 text-primary" />
            )}
            <span>{isExportingPdf ? "กำลังสร้าง PDF..." : "ดาวน์โหลด PDF"}</span>
          </button>
        )}

        <button
          onClick={onSave}
          disabled={saving}
          className="primary-button flex items-center gap-2 h-9 px-4 rounded-[8px] text-white text-xs font-medium shadow-xs hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "กำลังบันทึก..." : "บันทึกเทมเพลต"}</span>
        </button>
      </div>
    </header>
  );
}