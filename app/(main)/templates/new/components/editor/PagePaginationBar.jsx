"use client";

import React from "react";
import {
  Plus,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Presentation,
  MoveLeft,
  MoveRight,
} from "lucide-react";

export default function PagePaginationBar({
  pages = [],
  activePageIndex = 0,
  editorType = "document",
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onMovePage,
}) {
  const totalPages = pages.length;
  const isSlide = editorType === "slide";
  const itemLabel = isSlide ? "สไลด์" : "หน้า";
  const ItemIcon = isSlide ? Presentation : FileText;

  return (
    <div className="bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-2 flex items-center justify-between select-none z-20 shadow-md">
      {/* ── LEFT: Quick Navigation & Page Indicator ── */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200">
          <button
            onClick={() => onSelectPage(Math.max(0, activePageIndex - 1))}
            disabled={activePageIndex <= 0}
            className="p-1 rounded-md text-gray-700 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
            title={`${itemLabel}ก่อนหน้า`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 text-xs font-semibold text-gray-800 select-none">
            {itemLabel} {activePageIndex + 1} / {totalPages}
          </span>

          <button
            onClick={() => onSelectPage(Math.min(totalPages - 1, activePageIndex + 1))}
            disabled={activePageIndex >= totalPages - 1}
            className="p-1 rounded-md text-gray-700 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
            title={`${itemLabel}ถัดไป`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Move Page Order */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onMovePage(activePageIndex, -1)}
              disabled={activePageIndex === 0}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title={`เลื่อน${itemLabel}นี้ไปข้างหน้า`}
            >
              <MoveLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onMovePage(activePageIndex, 1)}
              disabled={activePageIndex === totalPages - 1}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title={`เลื่อน${itemLabel}นี้ไปข้างหลัง`}
            >
              <MoveRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ── CENTER: Page/Slide Thumbnails / Chips ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-xl py-1 px-2">
        {pages.map((page, idx) => {
          const isActive = idx === activePageIndex;
          return (
            <button
              key={page.id || idx}
              onClick={() => onSelectPage(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
              }`}
            >
              <ItemIcon className="w-3.5 h-3.5" />
              <span>{itemLabel} {idx + 1}</span>
            </button>
          );
        })}
      </div>

      {/* ── RIGHT: Page Action Controls ── */}
      <div className="flex items-center gap-2">
        {/* Duplicate Page/Slide */}
        <button
          onClick={() => onDuplicatePage(activePageIndex)}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors cursor-pointer"
          title={`คัดลอก${itemLabel}นี้ทั้ง${itemLabel} (Duplicate)`}
        >
          <Copy className="w-3.5 h-3.5" />
          <span>คัดลอก{itemLabel}</span>
        </button>

        {/* Delete Page/Slide */}
        <button
          onClick={() => onDeletePage(activePageIndex)}
          disabled={totalPages <= 1}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-35 disabled:hover:bg-white disabled:cursor-not-allowed cursor-pointer"
          title={totalPages <= 1 ? `ต้องมีอย่างน้อย 1 ${itemLabel}` : `ลบ${itemLabel}นี้`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>ลบ{itemLabel}</span>
        </button>

        {/* Add Blank Page/Slide */}
        <button
          onClick={onAddPage}
          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          title={`เพิ่ม${itemLabel}ว่างใหม่`}
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่ม{itemLabel}ใหม่</span>
        </button>
      </div>
    </div>
  );
}