"use client";

import React, { useMemo } from "react";
import { getCanvasPreset } from "@/lib/editor/canvasPresets";

export function CornerRuler({ canvasPreset = "a4-portrait" }) {
  const preset = getCanvasPreset(canvasPreset);
  const isMetric = preset.mmWidth !== null;

  return (
    <div className="w-6 h-6 bg-gray-200 border-r border-b border-gray-300 flex items-center justify-center select-none shrink-0 z-20">
      <span className="text-[9px] font-mono font-bold text-gray-500">
        {isMetric ? "mm" : "px"}
      </span>
    </div>
  );
}

export function TopRuler({ width, zoom, mousePos, canvasPreset = "a4-portrait" }) {
  const preset = getCanvasPreset(canvasPreset);
  const isMetric = preset.mmWidth !== null;

  // Memoize static ticks based on zoom, width, and preset
  const ticks = useMemo(() => {
    const items = [];

    if (isMetric) {
      const totalMm = preset.mmWidth || 210;
      const mmStep = (preset.width / totalMm) * zoom;

      for (let mm = 0; mm <= totalMm; mm++) {
        const x = mm * mmStep;
        const isCm = mm % 10 === 0;
        const isHalfCm = mm % 5 === 0 && !isCm;

        items.push(
          <g key={mm}>
            <line
              x1={x}
              y1={isCm ? 6 : isHalfCm ? 13 : 17}
              x2={x}
              y2={24}
              stroke={isCm ? "#64748B" : "#CBD5E1"}
              strokeWidth={isCm ? 1.2 : 0.8}
            />
            {isCm && (
              <text
                x={x + 2}
                y={10}
                fontSize="8.5"
                fill="#475569"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                className="select-none font-semibold"
              >
                {mm}
              </text>
            )}
          </g>
        );
      }
    } else {
      // Pixel ticks for Slides (every 10px, label every 100px)
      const totalPx = preset.width || 1280;
      for (let px = 0; px <= totalPx; px += 10) {
        const x = px * zoom;
        const isMajor = px % 100 === 0;
        const isMid = px % 50 === 0 && !isMajor;

        items.push(
          <g key={px}>
            <line
              x1={x}
              y1={isMajor ? 6 : isMid ? 13 : 18}
              x2={x}
              y2={24}
              stroke={isMajor ? "#64748B" : "#CBD5E1"}
              strokeWidth={isMajor ? 1.2 : 0.8}
            />
            {isMajor && (
              <text
                x={x + 2}
                y={10}
                fontSize="8"
                fill="#475569"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                className="select-none font-semibold"
              >
                {px}
              </text>
            )}
          </g>
        );
      }
    }

    return items;
  }, [zoom, preset.id, preset.width, isMetric]);

  return (
    <div
      className="relative h-6 bg-[#F8FAFC] border-b border-gray-300 select-none overflow-hidden"
      style={{ width }}
    >
      <svg width={width} height={24} className="block pointer-events-none">
        {ticks}
        {mousePos?.x !== undefined && mousePos.x !== null && mousePos.x >= 0 && mousePos.x <= width && (
          <line
            x1={mousePos.x}
            y1={0}
            x2={mousePos.x}
            y2={24}
            stroke="#EF4444"
            strokeWidth={1.5}
          />
        )}
      </svg>
    </div>
  );
}

export function LeftRuler({ height, zoom, mousePos, canvasPreset = "a4-portrait" }) {
  const preset = getCanvasPreset(canvasPreset);
  const isMetric = preset.mmHeight !== null;

  // Memoize static ticks based on zoom, height, and preset
  const ticks = useMemo(() => {
    const items = [];

    if (isMetric) {
      const totalMm = preset.mmHeight || 297;
      const mmStep = (preset.height / totalMm) * zoom;

      for (let mm = 0; mm <= totalMm; mm++) {
        const y = mm * mmStep;
        const isCm = mm % 10 === 0;
        const isHalfCm = mm % 5 === 0 && !isCm;

        items.push(
          <g key={mm}>
            <line
              x1={isCm ? 6 : isHalfCm ? 13 : 17}
              y1={y}
              x2={24}
              y2={y}
              stroke={isCm ? "#64748B" : "#CBD5E1"}
              strokeWidth={isCm ? 1.2 : 0.8}
            />
            {isCm && (
              <text
                x={2}
                y={y + 8}
                fontSize="8.5"
                fill="#475569"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                className="select-none font-semibold"
              >
                {mm}
              </text>
            )}
          </g>
        );
      }
    } else {
      // Pixel ticks for Slides (every 10px, label every 100px)
      const totalPx = preset.height || 720;
      for (let px = 0; px <= totalPx; px += 10) {
        const y = px * zoom;
        const isMajor = px % 100 === 0;
        const isMid = px % 50 === 0 && !isMajor;

        items.push(
          <g key={px}>
            <line
              x1={isMajor ? 6 : isMid ? 13 : 18}
              y1={y}
              x2={24}
              y2={y}
              stroke={isMajor ? "#64748B" : "#CBD5E1"}
              strokeWidth={isMajor ? 1.2 : 0.8}
            />
            {isMajor && (
              <text
                x={2}
                y={y + 8}
                fontSize="8"
                fill="#475569"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                className="select-none font-semibold"
              >
                {px}
              </text>
            )}
          </g>
        );
      }
    }

    return items;
  }, [zoom, preset.id, preset.height, isMetric]);

  return (
    <div
      className="relative w-6 bg-[#F8FAFC] border-r border-gray-300 select-none overflow-hidden"
      style={{ height }}
    >
      <svg width={24} height={height} className="block pointer-events-none">
        {ticks}
        {mousePos?.y !== undefined && mousePos.y !== null && mousePos.y >= 0 && mousePos.y <= height && (
          <line
            x1={0}
            y1={mousePos.y}
            x2={24}
            y2={mousePos.y}
            stroke="#EF4444"
            strokeWidth={1.5}
          />
        )}
      </svg>
    </div>
  );
}