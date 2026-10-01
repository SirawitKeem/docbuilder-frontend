"use client";

import React, { useEffect, useRef } from "react";
import * as fabric from "fabric";

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
      className="relative bg-white border border-gray-300 shadow-md hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer rounded-xs overflow-hidden select-none"
      style={{ width, height }}
      title={`หน้า ${pageIndex + 1} (คลิกเพื่อแก้ไข)`}
    >
      <canvas ref={canvasElRef} />
    </div>
  );
}
