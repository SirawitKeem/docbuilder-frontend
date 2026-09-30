"use client";

import React, { useEffect, useRef } from "react";
import * as fabric from "fabric";
import { Edit2 } from "lucide-react";

export default function StaticPagePreview({
  page,
  pageIndex,
  totalPages,
  zoom = 1,
  preset,
  onClick,
}) {
  const canvasElRef = useRef(null);
  const staticCanvasRef = useRef(null);

  const width = Math.round(preset.width * zoom);
  const height = Math.round(preset.height * zoom);

  useEffect(() => {
    if (!canvasElRef.current) return;

    let isDisposed = false;
    const canvas = new fabric.StaticCanvas(canvasElRef.current, {
      width,
      height,
      backgroundColor: "#FFFFFF",
      renderOnAddRemove: false,
    });
    staticCanvasRef.current = canvas;

    const pageJson = page?.json;
    if (pageJson) {
      const parsed = typeof pageJson === "string" ? JSON.parse(pageJson) : pageJson;
      canvas.loadFromJSON(parsed).then(() => {
        if (isDisposed) return;
        canvas.setZoom(zoom);
        canvas.setDimensions({ width, height });
        canvas.renderAll();
      }).catch((err) => {
        console.warn("StaticPagePreview loadFromJSON error:", err);
      });
    } else {
      canvas.setZoom(zoom);
      canvas.setDimensions({ width, height });
      canvas.renderAll();
    }

    return () => {
      isDisposed = true;
      try {
        canvas.dispose();
      } catch {}
      staticCanvasRef.current = null;
    };
  }, [page?.id, page?.json, zoom, preset.width, preset.height, width, height]);

  return (
    <div
      onClick={onClick}
      className="relative bg-white border border-gray-300 shadow-md hover:border-indigo-400 hover:shadow-xl transition-all cursor-pointer group rounded-xs overflow-hidden select-none"
      style={{ width, height }}
      title={`คลิกเพื่อแก้ไขหน้า ${pageIndex + 1}`}
    >
      <canvas ref={canvasElRef} />

      {/* Hover to Edit Overlay */}
      <div className="absolute inset-0 bg-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
        <span className="bg-indigo-600 text-white text-xs px-3.5 py-1.5 rounded-full font-bold shadow-lg flex items-center gap-1.5 scale-95 group-hover:scale-100 transition-transform">
          <Edit2 className="w-3.5 h-3.5" />
          <span>คลิกเพื่อแก้ไขหน้า {pageIndex + 1}</span>
        </span>
      </div>
    </div>
  );
}
