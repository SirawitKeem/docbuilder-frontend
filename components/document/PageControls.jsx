"use client";

import { ChevronLeft, ChevronRight, Minus, Plus, Maximize2 } from "lucide-react";

export default function PageControls({
  currentPage,
  totalPages,
  zoom,
  onPrevPage,
  onNextPage,
  onZoomOut,
  onZoomIn,
  onFullscreen,
}) {
  return (
    <div className="h-14 border-t border-gray-200 bg-white flex items-center justify-center gap-1 px-4">
      <button
        onClick={onPrevPage}
        disabled={currentPage <= 1}
        className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronLeft size={18} className="text-gray-700" />
      </button>

      <span className="text-sm text-gray-700 px-3 tabular-nums">
        {currentPage} / {totalPages}
      </span>

      <button
        onClick={onNextPage}
        disabled={currentPage >= totalPages}
        className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronRight size={18} className="text-gray-700" />
      </button>

      <div className="w-px h-5 bg-gray-200 mx-2" />

      <button onClick={onZoomOut} className="p-2 rounded hover:bg-gray-100">
        <Minus size={16} className="text-gray-700" />
      </button>
      <span className="text-sm text-gray-700 w-12 text-center tabular-nums">{zoom}%</span>
      <button onClick={onZoomIn} className="p-2 rounded hover:bg-gray-100">
        <Plus size={16} className="text-gray-700" />
      </button>

      <div className="w-px h-5 bg-gray-200 mx-2" />

      <button onClick={onFullscreen} className="p-2 rounded hover:bg-gray-100">
        <Maximize2 size={16} className="text-gray-700" />
      </button>
    </div>
  );
}