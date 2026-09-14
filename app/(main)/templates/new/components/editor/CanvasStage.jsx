"use client";

import React, { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { CornerRuler, TopRuler, LeftRuler } from "./Ruler";
import { CUSTOM_CANVAS_PROPS } from "./elements/DocTable";
import { getCanvasPreset } from "@/lib/editor/canvasPresets";

export const A4_WIDTH = 794;
export const A4_HEIGHT = 1123;
export const MARGIN_PX = 56; // ~15mm printable margin
const SNAP_THRESHOLD = 6; // px distance to snap

export default function CanvasStage({
  zoom = 1,
  showRuler = true,
  showMargin = true,
  marginPx = null,
  marginMm = null,
  canvasPreset = "a4-portrait",
  onCanvasReady,
  onHistoryPush,
  onSelectionChange,
}) {
  const preset = getCanvasPreset(canvasPreset);
  const effectiveMarginPx = marginPx !== null && marginPx !== undefined ? marginPx : preset.marginPx;
  const marginPxRef = useRef(effectiveMarginPx);

  useEffect(() => {
    marginPxRef.current = effectiveMarginPx;
  }, [effectiveMarginPx]);

  const canvasContainerRef = useRef(null);
  const canvasElRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: null, y: null });

  // Initialize Fabric Canvas with Dynamic Preset Dimensions
  useEffect(() => {
    if (!canvasElRef.current) return;

    // Set official Fabric v6 customProperties on FabricObject and Group
    if (fabric.FabricObject) {
      fabric.FabricObject.customProperties = Array.from(
        new Set([...(fabric.FabricObject.customProperties || []), ...CUSTOM_CANVAS_PROPS])
      );
    }
    if (fabric.Group) {
      fabric.Group.customProperties = Array.from(
        new Set([...(fabric.Group.customProperties || []), ...CUSTOM_CANVAS_PROPS])
      );
    }

    // Apply global prototype patch with guard to prevent recursive wrapping in dev mode
    const targetProto = fabric.FabricObject ? fabric.FabricObject.prototype : fabric.Object ? fabric.Object.prototype : null;
    if (targetProto) {
      targetProto.originX = "left";
      targetProto.originY = "top";

      if (!targetProto.__customPropsPatched) {
        const origToObject = targetProto.toObject;
        targetProto.toObject = function (propertiesToInclude = []) {
          return origToObject.call(this, [...CUSTOM_CANVAS_PROPS, ...propertiesToInclude]);
        };
        targetProto.__customPropsPatched = true;
      }
    }

    if (fabric.Group && fabric.Group.prototype && !fabric.Group.prototype.__customPropsPatched) {
      const origGroupToObject = fabric.Group.prototype.toObject;
      fabric.Group.prototype.toObject = function (propertiesToInclude = []) {
        return origGroupToObject.call(this, [...CUSTOM_CANVAS_PROPS, ...propertiesToInclude]);
      };
      fabric.Group.prototype.__customPropsPatched = true;
    }

    if (fabric.StaticCanvas && fabric.StaticCanvas.prototype && !fabric.StaticCanvas.prototype.__customPropsPatched) {
      const origStaticToObject = fabric.StaticCanvas.prototype.toObject;
      fabric.StaticCanvas.prototype.toObject = function (propertiesToInclude = []) {
        return origStaticToObject.call(this, [...CUSTOM_CANVAS_PROPS, ...propertiesToInclude]);
      };
      fabric.StaticCanvas.prototype.toJSON = function (propertiesToInclude = []) {
        return this.toObject([...CUSTOM_CANVAS_PROPS, ...propertiesToInclude]);
      };
      fabric.StaticCanvas.prototype.__customPropsPatched = true;
    }

    if (fabric.Canvas && fabric.Canvas.prototype && !fabric.Canvas.prototype.__customPropsPatched) {
      fabric.Canvas.prototype.toJSON = function (propertiesToInclude = []) {
        return this.toObject([...CUSTOM_CANVAS_PROPS, ...propertiesToInclude]);
      };
      fabric.Canvas.prototype.__customPropsPatched = true;
    }

    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: preset.width * zoom,
      height: preset.height * zoom,
      backgroundColor: "#FFFFFF",
      selection: true,
      preserveObjectStacking: true,
      renderOnAddRemove: true,
      enableRetinaScaling: true,
    });

    canvas.setZoom(zoom);
    fabricCanvasRef.current = canvas;

    // 🧲 Smart Snapping Guidelines Helper
    const clearSnapGuides = () => {
      const guides = canvas.getObjects().filter((obj) => obj.isSnapGuide);
      guides.forEach((g) => canvas.remove(g));
    };

    const drawSnapGuide = (points) => {
      const line = new fabric.Line(points, {
        stroke: "#D946EF",
        strokeWidth: 1.2,
        strokeDashArray: [4, 4],
        selectable: false,
        evented: false,
        isSnapGuide: true,
        excludeFromExport: true,
      });
      canvas.add(line);
    };

    // 🎯 Drag Origin Tracking for Shift-Constrained Movement
    const trackDragStart = (target) => {
      if (!target) return;
      target._dragStart = { left: target.left, top: target.top };
    };

    canvas.on("mouse:down", (opt) => {
      if (opt.target) trackDragStart(opt.target);
    });
    canvas.on("before:transform", (opt) => {
      if (opt.transform?.target) trackDragStart(opt.transform.target);
    });

    // 🧲 Snapping & Shift+Drag Axis Constrain (object:moving)
    canvas.on("object:moving", (opt) => {
      const target = opt.target;
      if (!target || target.isSnapGuide) return;

      clearSnapGuides();

      const e = opt.e;
      let isAxisLockedHorizontal = false;
      let isAxisLockedVertical = false;

      // ── Shift+Drag Axis Constrain ──
      if (e && e.shiftKey) {
        if (!target._axisLockStart) {
          target._axisLockStart = target._dragStart
            ? { ...target._dragStart }
            : { left: target.left, top: target.top };
        }
        const dx = Math.abs(target.left - target._axisLockStart.left);
        const dy = Math.abs(target.top - target._axisLockStart.top);
        if (dx > dy) {
          target.set("top", target._axisLockStart.top); // Lock horizontal (constant Y)
          isAxisLockedHorizontal = true;
        } else {
          target.set("left", target._axisLockStart.left); // Lock vertical (constant X)
          isAxisLockedVertical = true;
        }
      } else {
        target._axisLockStart = null;
      }

      const targetWidth = target.getScaledWidth();
      const targetHeight = target.getScaledHeight();

      const targetLeft = target.left;
      const targetCenterX = targetLeft + targetWidth / 2;
      const targetRight = targetLeft + targetWidth;

      const targetTop = target.top;
      const targetCenterY = targetTop + targetHeight / 2;
      const targetBottom = targetTop + targetHeight;

      // Vertical Snap Points: Left Margin, Center, Right Margin (only if not vertically locked)
      if (!isAxisLockedVertical) {
        const activeMargin = marginPxRef.current ?? preset.marginPx;
        const vSnapPoints = [
          ...(activeMargin > 0
            ? [
                { x: activeMargin, type: "margin-left" },
                { x: preset.width - activeMargin, type: "margin-right" },
              ]
            : [
                { x: 0, type: "edge-left" },
                { x: preset.width, type: "edge-right" },
              ]),
          { x: preset.width / 2, type: "center-x" },
        ];

        for (const p of vSnapPoints) {
          if (Math.abs(targetCenterX - p.x) <= SNAP_THRESHOLD) {
            target.set("left", p.x - targetWidth / 2);
            drawSnapGuide([p.x, 0, p.x, preset.height], "vertical");
            break;
          } else if (Math.abs(targetLeft - p.x) <= SNAP_THRESHOLD) {
            target.set("left", p.x);
            drawSnapGuide([p.x, 0, p.x, preset.height], "vertical");
            break;
          } else if (Math.abs(targetRight - p.x) <= SNAP_THRESHOLD) {
            target.set("left", p.x - targetWidth);
            drawSnapGuide([p.x, 0, p.x, preset.height], "vertical");
            break;
          }
        }
      }

      // Horizontal Snap Points: Top Margin, Center, Bottom Margin (only if not horizontally locked)
      if (!isAxisLockedHorizontal) {
        const activeMargin = marginPxRef.current ?? preset.marginPx;
        const hSnapPoints = [
          ...(activeMargin > 0
            ? [
                { y: activeMargin, type: "margin-top" },
                { y: preset.height - activeMargin, type: "margin-bottom" },
              ]
            : [
                { y: 0, type: "edge-top" },
                { y: preset.height, type: "edge-bottom" },
              ]),
          { y: preset.height / 2, type: "center-y" },
        ];

        for (const p of hSnapPoints) {
          if (Math.abs(targetCenterY - p.y) <= SNAP_THRESHOLD) {
            target.set("top", p.y - targetHeight / 2);
            drawSnapGuide([0, p.y, preset.width, p.y], "horizontal");
            break;
          } else if (Math.abs(targetTop - p.y) <= SNAP_THRESHOLD) {
            target.set("top", p.y);
            drawSnapGuide([0, p.y, preset.width, p.y], "horizontal");
            break;
          } else if (Math.abs(targetBottom - p.y) <= SNAP_THRESHOLD) {
            target.set("top", p.y - targetHeight);
            drawSnapGuide([0, p.y, preset.width, p.y], "horizontal");
            break;
          }
        }
      }
    });

    // Clear guidelines and axis-lock cache when mouse is released
    const clearGuidesAndAxisLock = () => {
      clearSnapGuides();
      const active = canvas.getActiveObject();
      if (active) {
        active._axisLockStart = null;
        active._dragStart = { left: active.left, top: active.top };
      }
      canvas.getObjects().forEach((o) => {
        if (o._axisLockStart) o._axisLockStart = null;
        o._dragStart = { left: o.left, top: o.top };
      });
    };
    canvas.on("mouse:up", clearGuidesAndAxisLock);
    canvas.on("object:modified", clearGuidesAndAxisLock);

    // Mouse tracking for Ruler indicators
    canvas.on("mouse:move", (opt) => {
      if (!opt.e) return;
      const pointer = canvas.getPointer(opt.e);
      setMousePos({ x: pointer.x * zoom, y: pointer.y * zoom });
    });

    canvas.on("mouse:out", () => {
      setMousePos({ x: null, y: null });
    });

    // 🔒 Selection Change & Rubber-band Lock Filtering
    let isFilteringSelection = false;
    const filterSelectionLockedObjects = (activeObj) => {
      if (isFilteringSelection || !activeObj) return;
      if (activeObj.type?.toLowerCase() === "activeselection") {
        const objects = activeObj.getObjects();
        const hasLockedOrSystem = objects.some(
          (o) =>
            o.locked ||
            o.lockMovementX ||
            o.lockMovementY ||
            o.selectable === false ||
            o.isPageFooterNumber ||
            o.isSnapGuide ||
            o.excludeFromExport
        );
        if (hasLockedOrSystem) {
          isFilteringSelection = true;
          const allowedObjects = objects.filter(
            (o) =>
              !(
                o.locked ||
                o.lockMovementX ||
                o.lockMovementY ||
                o.selectable === false ||
                o.isPageFooterNumber ||
                o.isSnapGuide ||
                o.excludeFromExport
              )
          );
          canvas.discardActiveObject();
          if (allowedObjects.length === 1) {
            canvas.setActiveObject(allowedObjects[0]);
          } else if (allowedObjects.length > 1) {
            const cleanSelection = new fabric.ActiveSelection(allowedObjects, { canvas });
            canvas.setActiveObject(cleanSelection);
          }
          canvas.requestRenderAll();
          isFilteringSelection = false;
        }
      }
    };

    const handleSelection = (e) => {
      const active = canvas.getActiveObject();
      filterSelectionLockedObjects(active);
      const currentActive = canvas.getActiveObject();
      if (currentActive) {
        currentActive._dragStart = { left: currentActive.left, top: currentActive.top };
      }
      if (onSelectionChange) onSelectionChange(currentActive);
    };

    const handleClearSelection = () => {
      if (onSelectionChange) onSelectionChange(null);
    };

    canvas.on("selection:created", handleSelection);
    canvas.on("selection:updated", handleSelection);
    canvas.on("selection:cleared", handleClearSelection);

    // History Mutation Events
    const handleMutation = (e) => {
      if (e && e.target && e.target.isSnapGuide) return;
      if (onHistoryPush) onHistoryPush(canvas);
    };

    canvas.on("object:modified", handleMutation);
    canvas.on("object:added", (e) => {
      if (e && e.target && e.target.isSnapGuide) return;
      if (onHistoryPush) onHistoryPush(canvas);
    });
    canvas.on("object:removed", (e) => {
      if (e && e.target && e.target.isSnapGuide) return;
      if (onHistoryPush) onHistoryPush(canvas);
    });

    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      window.__FABRIC_CANVAS__ = canvas;
      window.__FABRIC__ = fabric;
    }
    if (onCanvasReady) {
      onCanvasReady(canvas);
    }

    return () => {
      if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
        if (window.__FABRIC_CANVAS__ === canvas) {
          delete window.__FABRIC_CANVAS__;
          delete window.__FABRIC__;
        }
      }
      try {
        canvas.dispose();
      } catch (err) {
        console.warn("Canvas dispose:", err);
      }
    };
  }, [preset.id]);

  // Native Zoom without CSS distortion
  useEffect(() => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;

    canvas.setZoom(zoom);
    canvas.setDimensions({
      width: preset.width * zoom,
      height: preset.height * zoom,
    });
    canvas.requestRenderAll();
  }, [zoom, preset.width, preset.height]);

  const currentWidth = preset.width * zoom;
  const currentHeight = preset.height * zoom;
  const currentMargin = effectiveMarginPx * zoom;
  const marginLabel = preset.mmWidth
    ? `${marginMm !== null && marginMm !== undefined ? marginMm : Math.round((effectiveMarginPx * 25.4) / 96)}mm`
    : `${effectiveMarginPx}px`;

  const isMarginActive = showMargin && effectiveMarginPx > 0;

  return (
    <div className="relative flex flex-col items-center justify-start select-none py-6">
      <div className="flex flex-col bg-white border border-gray-300 shadow-2xl rounded-xs overflow-hidden">
        {showRuler && (
          <div className="flex items-center bg-[#F8FAFC]">
            <CornerRuler canvasPreset={preset} />
            <TopRuler width={currentWidth} zoom={zoom} mousePos={mousePos} canvasPreset={preset} />
          </div>
        )}

        <div className="flex items-start">
          {showRuler && (
            <LeftRuler height={currentHeight} zoom={zoom} mousePos={mousePos} canvasPreset={preset} />
          )}

          <div
            ref={canvasContainerRef}
            className="relative bg-white"
            style={{ width: currentWidth, height: currentHeight }}
          >
            {/* Margin Guide: Keep in DOM with CSS visibility to prevent React reconciliation insertBefore error with Fabric */}
            <div
              data-testid="margin-guide"
              className={`absolute inset-0 pointer-events-none z-10 border border-dashed border-rose-400/70 transition-opacity duration-150 ${
                isMarginActive ? "opacity-100" : "opacity-0 pointer-events-none invisible"
              }`}
              style={{ margin: `${currentMargin}px` }}
            >
              {isMarginActive && (
                <span className="absolute top-1 left-2 text-[10px] font-mono text-rose-500 font-semibold select-none bg-rose-50/90 px-1 rounded-xs shadow-2xs">
                  Margin ({marginLabel})
                </span>
              )}
            </div>

            {/* Isolate Fabric Canvas in its own wrapper to prevent DOM manipulation collisions */}
            <div className="absolute inset-0 pointer-events-auto">
              <canvas ref={canvasElRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}