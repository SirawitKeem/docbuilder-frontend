"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoveLeft,
  MoveRight,
  MoreHorizontal,
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
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const totalPages = pages.length;
  const isSlide = editorType === "slide";
  const itemLabel = isSlide ? "Slide" : "Page";

  useEffect(() => {
    if (!showMoreMenu) return;
    const handleClose = () => setShowMoreMenu(false);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, [showMoreMenu]);

  return (
    <div className="bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-2 flex items-center justify-between select-none z-20 shadow-md">
      {/* ── LEFT: Quick Navigation & Page Indicator ── */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200">
          <button
            onClick={() => onSelectPage(Math.max(0, activePageIndex - 1))}
            disabled={activePageIndex <= 0}
            className="p-1 rounded-md text-gray-700 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
            title={`${itemLabel} ก่อนหน้า`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 text-xs font-semibold text-gray-800 select-none">
            {itemLabel} {activePageIndex + 1} of {totalPages}
          </span>

          <button
            onClick={() => onSelectPage(Math.min(totalPages - 1, activePageIndex + 1))}
            disabled={activePageIndex >= totalPages - 1}
            className="p-1 rounded-md text-gray-700 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
            title={`${itemLabel} ถัดไป`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
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
              <span>{itemLabel} {idx + 1}</span>
            </button>
          );
        })}
      </div>

      {/* ── RIGHT: Minimalist Actions: More (•••) and Add (+) ── */}
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMoreMenu(!showMoreMenu);
            }}
            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            title="ตัวเลือกเพิ่มเติม"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMoreMenu && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 bottom-full mb-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-40 text-xs text-gray-700 animate-in fade-in zoom-in-95 duration-100"
            >
              <button
                type="button"
                onClick={() => {
                  if (onMovePage) onMovePage(activePageIndex, -1);
                  setShowMoreMenu(false);
                }}
                disabled={activePageIndex === 0}
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 disabled:opacity-35 disabled:hover:bg-transparent text-left cursor-pointer"
              >
                <MoveLeft className="w-3.5 h-3.5 text-gray-400" />
                <span>เลื่อนไปข้างหน้า</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onMovePage) onMovePage(activePageIndex, 1);
                  setShowMoreMenu(false);
                }}
                disabled={activePageIndex === totalPages - 1}
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 disabled:opacity-35 disabled:hover:bg-transparent text-left cursor-pointer"
              >
                <MoveRight className="w-3.5 h-3.5 text-gray-400" />
                <span>เลื่อนไปข้างหลัง</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDuplicatePage) onDuplicatePage(activePageIndex);
                  setShowMoreMenu(false);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 text-left cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-gray-400" />
                <span>ทำซ้ำหน้า (Duplicate)</span>
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                type="button"
                onClick={() => {
                  if (onDeletePage) onDeletePage(activePageIndex);
                  setShowMoreMenu(false);
                }}
                disabled={totalPages <= 1}
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-red-50 text-red-600 disabled:opacity-35 disabled:hover:bg-transparent text-left cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>ลบหน้านี้ (Delete)</span>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onAddPage}
          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          title={`เพิ่ม${itemLabel}ใหม่`}
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่ม{itemLabel}ใหม่</span>
        </button>
      </div>
    </div>
  );
}