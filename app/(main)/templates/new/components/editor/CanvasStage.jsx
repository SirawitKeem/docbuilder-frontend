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
  pan = { x: 0, y: 0 },
  isPanning = false,
  isSpaceActive = false,
  isHandToolActive = false,
  showRuler = false,
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
      targetProto.strokeUniform = true; // ✨ Uniform stroke border on all shapes and objects
      targetProto.cornerStyle = "circle";
      targetProto.cornerColor = "#6366F1";
      targetProto.cornerStrokeColor = "#FFFFFF";
      targetProto.cornerSize = 8;
      targetProto.transparentCorners = false;
      targetProto.borderColor = "#6366F1";
      targetProto.borderScaleFactor = 1.5;
      targetProto.padding = 4;

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

    // 🔤 Asian & Thai Textbox Word Wrapping Support (Grapheme-based wrapping)
    // 💎 Disable objectCaching for all text types to ensure 100% vector-sharp text rendering
    // at any font size (from 10px to 2000px) and any zoom level without bitmap blurriness
    if (fabric.config) {
      fabric.config.perfLimitSizeTotal = 16777216; // 4096 x 4096 px
      fabric.config.maxCacheSideLimit = 8192;
    }

    if (fabric.Textbox) {
      if (fabric.Textbox.ownDefaults) {
        fabric.Textbox.ownDefaults.splitByGrapheme = true;
        fabric.Textbox.ownDefaults.minWidth = 10;
        fabric.Textbox.ownDefaults.objectCaching = false;
        fabric.Textbox.ownDefaults.noScaleCache = false;
      }
      if (fabric.Textbox.prototype) {
        fabric.Textbox.prototype.splitByGrapheme = true;
        fabric.Textbox.prototype.minWidth = 10;
        fabric.Textbox.prototype.objectCaching = false;
        fabric.Textbox.prototype.noScaleCache = false;
      }
    }
    if (fabric.Text) {
      if (fabric.Text.ownDefaults) fabric.Text.ownDefaults.objectCaching = false;
      if (fabric.Text.prototype) fabric.Text.prototype.objectCaching = false;
    }
    if (fabric.IText) {
      if (fabric.IText.ownDefaults) fabric.IText.ownDefaults.objectCaching = false;
      if (fabric.IText.prototype) fabric.IText.prototype.objectCaching = false;
    }

    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: preset.width * zoom,
      height: preset.height * zoom,
      backgroundColor: "#FFFFFF",
      selection: true,
      defaultCursor: "default",
      hoverCursor: "default",
      preserveObjectStacking: true,
      renderOnAddRemove: true,
      enableRetinaScaling: true,
    });

    // 🔤 Ensure all textboxes support Thai grapheme wrapping, free resizing, and crystal-clear text
    const patchTextbox = (obj) => {
      if (!obj) return;
      if (obj.type === "textbox" || obj.isType?.("Textbox") || obj.type === "text" || obj.type === "i-text") {
        obj.set({
          splitByGrapheme: true,
          objectCaching: false,
          noScaleCache: false,
        });
        if (typeof obj.initDimensions === "function") {
          obj.initDimensions();
        }
      }
    };

    canvas.on("object:added", (opt) => {
      const target = opt.target;
      if (target) {
        if (target.selectable === false || target.isBackground) {
          target.evented = false;
        }
        patchTextbox(target);
      }
    });

    // 🔤 Handle Textbox scaling: convert scaleX to width so font is never distorted
    // and characters wrap onto new lines dynamically when resizing width
    canvas.on("object:scaling", (opt) => {
      const target = opt.target;
      if (target && (target.type === "textbox" || target.isType?.("Textbox"))) {
        if (target.scaleX && target.scaleX !== 1) {
          const newWidth = Math.max(10, Math.round(target.width * target.scaleX));
          target.set({
            width: newWidth,
            scaleX: 1,
            scaleY: 1,
            splitByGrapheme: true,
          });
          target.initDimensions();
          canvas.requestRenderAll();
        }
      }
    });

    canvas.setZoom(zoom);
    fabricCanvasRef.current = canvas;

    // 🧲 Enhanced Smart Alignment Guides Helper (Page Center, Margins & Object-to-Object)
    const clearSnapGuides = () => {
      const guides = canvas.getObjects().filter((obj) => obj.isSnapGuide);
      guides.forEach((g) => canvas.remove(g));
    };

    const drawSnapGuide = (points, type = "center", label = "") => {
      const isPageCenter = type === "center-x" || type === "center-y";
      const isEdge = type.includes("margin") || type.includes("edge");
      const strokeColor = isPageCenter ? "#F43F5E" : isEdge ? "#6366F1" : "#EC4899";

      const line = new fabric.Line(points, {
        stroke: strokeColor,
        strokeWidth: isPageCenter ? 1.5 : 1.2,
        strokeDashArray: isPageCenter ? [6, 4] : [4, 4],
        selectable: false,
        evented: false,
        isSnapGuide: true,
        excludeFromExport: true,
      });
      canvas.add(line);

      // Clean Guide Badge indicator
      if (label) {
        const isVert = points[0] === points[2];
        const badgeLeft = isVert ? Math.min(preset.width - 150, Math.max(10, points[0] + 6)) : 20;
        const badgeTop = isVert ? 20 : Math.min(preset.height - 30, Math.max(10, points[1] + 4));

        const badgeRect = new fabric.Rect({
          left: badgeLeft,
          top: badgeTop,
          rx: 4,
          ry: 4,
          fill: strokeColor,
          selectable: false,
          evented: false,
          isSnapGuide: true,
          excludeFromExport: true,
        });

        const badgeText = new fabric.Text(label, {
          left: badgeLeft + 6,
          top: badgeTop + 3,
          fontSize: 10,
          fontFamily: "'Noto Sans Thai', sans-serif",
          fontWeight: "bold",
          fill: "#FFFFFF",
          selectable: false,
          evented: false,
          isSnapGuide: true,
          excludeFromExport: true,
        });

        badgeRect.set({
          width: badgeText.width + 12,
          height: badgeText.height + 6,
        });

        canvas.add(badgeRect);
        canvas.add(badgeText);
      }
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

    // 🧲 Smart Snapping & Shift+Drag Axis Constrain (object:moving)
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

      let hasVerticalSnap = false;
      let hasHorizontalSnap = false;

      // 1. Page Center & Margin Snapping (Vertical X-Axis)
      if (!isAxisLockedVertical) {
        const activeMargin = marginPxRef.current ?? preset.marginPx;
        const vSnapPoints = [
          { x: preset.width / 2, type: "center-x", label: "กึ่งกลางหน้ากระดาษ (X)" },
          ...(activeMargin > 0
            ? [
                { x: activeMargin, type: "margin-left", label: "ระยะขอบซ้าย" },
                { x: preset.width - activeMargin, type: "margin-right", label: "ระยะขอบขวา" },
              ]
            : [
                { x: 0, type: "edge-left", label: "ขอบซ้ายสุด" },
                { x: preset.width, type: "edge-right", label: "ขอบขวาสุด" },
              ]),
        ];

        for (const p of vSnapPoints) {
          if (Math.abs(targetCenterX - p.x) <= SNAP_THRESHOLD) {
            target.set("left", p.x - targetWidth / 2);
            drawSnapGuide([p.x, 0, p.x, preset.height], p.type, p.label);
            hasVerticalSnap = true;
            break;
          } else if (Math.abs(targetLeft - p.x) <= SNAP_THRESHOLD) {
            target.set("left", p.x);
            drawSnapGuide([p.x, 0, p.x, preset.height], p.type, p.label);
            hasVerticalSnap = true;
            break;
          } else if (Math.abs(targetRight - p.x) <= SNAP_THRESHOLD) {
            target.set("left", p.x - targetWidth);
            drawSnapGuide([p.x, 0, p.x, preset.height], p.type, p.label);
            hasVerticalSnap = true;
            break;
          }
        }
      }

      // 2. Page Center & Margin Snapping (Horizontal Y-Axis)
      if (!isAxisLockedHorizontal) {
        const activeMargin = marginPxRef.current ?? preset.marginPx;
        const hSnapPoints = [
          { y: preset.height / 2, type: "center-y", label: "กึ่งกลางหน้ากระดาษ (Y)" },
          ...(activeMargin > 0
            ? [
                { y: activeMargin, type: "margin-top", label: "ระยะขอบบน" },
                { y: preset.height - activeMargin, type: "margin-bottom", label: "ระยะขอบล่าง" },
              ]
            : [
                { y: 0, type: "edge-top", label: "ขอบบนสุด" },
                { y: preset.height, type: "edge-bottom", label: "ขอบล่างสุด" },
              ]),
        ];

        for (const p of hSnapPoints) {
          if (Math.abs(targetCenterY - p.y) <= SNAP_THRESHOLD) {
            target.set("top", p.y - targetHeight / 2);
            drawSnapGuide([0, p.y, preset.width, p.y], p.type, p.label);
            hasHorizontalSnap = true;
            break;
          } else if (Math.abs(targetTop - p.y) <= SNAP_THRESHOLD) {
            target.set("top", p.y);
            drawSnapGuide([0, p.y, preset.width, p.y], p.type, p.label);
            hasHorizontalSnap = true;
            break;
          } else if (Math.abs(targetBottom - p.y) <= SNAP_THRESHOLD) {
            target.set("top", p.y - targetHeight);
            drawSnapGuide([0, p.y, preset.width, p.y], p.type, p.label);
            hasHorizontalSnap = true;
            break;
          }
        }
      }

      // 3. Object-to-Object Smart Alignment Guides
      const otherObjects = canvas.getObjects().filter(
        (o) =>
          o !== target &&
          o.selectable !== false &&
          o.visible !== false &&
          !o.isSnapGuide &&
          !o.isPageFooterNumber &&
          !o.excludeFromExport
      );

      for (const other of otherObjects) {
        // Vertical Alignments with other object (X-Axis)
        if (!isAxisLockedVertical && !hasVerticalSnap) {
          const otherW = other.getScaledWidth();
          const otherLeft = other.left;
          const otherCenterX = otherLeft + otherW / 2;
          const otherRight = otherLeft + otherW;

          const minY = Math.min(targetTop, other.top) - 10;
          const maxY = Math.max(targetBottom, other.top + other.getScaledHeight()) + 10;

          if (Math.abs(targetLeft - otherLeft) <= SNAP_THRESHOLD) {
            target.set("left", otherLeft);
            drawSnapGuide([otherLeft, minY, otherLeft, maxY], "object-align");
            hasVerticalSnap = true;
          } else if (Math.abs(targetCenterX - otherCenterX) <= SNAP_THRESHOLD) {
            target.set("left", otherCenterX - targetWidth / 2);
            drawSnapGuide([otherCenterX, minY, otherCenterX, maxY], "object-center");
            hasVerticalSnap = true;
          } else if (Math.abs(targetRight - otherRight) <= SNAP_THRESHOLD) {
            target.set("left", otherRight - targetWidth);
            drawSnapGuide([otherRight, minY, otherRight, maxY], "object-align");
            hasVerticalSnap = true;
          }
        }

        // Horizontal Alignments with other object (Y-Axis)
        if (!isAxisLockedHorizontal && !hasHorizontalSnap) {
          const otherH = other.getScaledHeight();
          const otherTop = other.top;
          const otherCenterY = otherTop + otherH / 2;
          const otherBottom = otherTop + otherH;

          const minX = Math.min(targetLeft, other.left) - 10;
          const maxX = Math.max(targetRight, other.left + other.getScaledWidth()) + 10;

          if (Math.abs(targetTop - otherTop) <= SNAP_THRESHOLD) {
            target.set("top", otherTop);
            drawSnapGuide([minX, otherTop, maxX, otherTop], "object-align");
            hasHorizontalSnap = true;
          } else if (Math.abs(targetCenterY - otherCenterY) <= SNAP_THRESHOLD) {
            target.set("top", otherCenterY - targetHeight / 2);
            drawSnapGuide([minX, otherCenterY, maxX, otherCenterY], "object-center");
            hasHorizontalSnap = true;
          } else if (Math.abs(targetBottom - otherBottom) <= SNAP_THRESHOLD) {
            target.set("top", otherBottom - targetHeight);
            drawSnapGuide([minX, otherBottom, maxX, otherBottom], "object-align");
            hasHorizontalSnap = true;
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
    canvas.on("object:modified", (opt) => {
      clearGuidesAndAxisLock();
      const target = opt?.target;
      if (target) {
        // ✨ Normalize scaling into direct pixel dimensions so borders and rx/ry never distort
        if (target.type === "rect" && (target.scaleX !== 1 || target.scaleY !== 1)) {
          const finalW = Math.round(target.width * (target.scaleX || 1));
          const finalH = Math.round(target.height * (target.scaleY || 1));
          target.set({
            width: Math.max(5, finalW),
            height: Math.max(5, finalH),
            scaleX: 1,
            scaleY: 1,
          });
          target.setCoords();
        } else if (target.type === "circle" && (target.scaleX !== 1 || target.scaleY !== 1)) {
          const avgScale = ((target.scaleX || 1) + (target.scaleY || 1)) / 2;
          const finalRadius = Math.round(target.radius * avgScale);
          target.set({
            radius: Math.max(5, finalRadius),
            scaleX: 1,
            scaleY: 1,
          });
          target.setCoords();
        } else if (target.type === "ellipse" && (target.scaleX !== 1 || target.scaleY !== 1)) {
          const finalRx = Math.round(target.rx * (target.scaleX || 1));
          const finalRy = Math.round(target.ry * (target.scaleY || 1));
          target.set({
            rx: Math.max(2, finalRx),
            ry: Math.max(2, finalRy),
            scaleX: 1,
            scaleY: 1,
          });
          target.setCoords();
        }
      }
    });

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

    // 🔤 Text Editing Synchronization: Ensure user-typed text & line breaks are preserved
    const handleTextSync = (e) => {
      const target = e?.target;
      if (target && (target.type === "textbox" || target.type === "i-text" || target.type === "text" || target.isType?.("Textbox"))) {
        if (target._previewGeneratedText !== undefined && target.text !== target._previewGeneratedText) {
          target.rawTemplateText = target.text;
        } else if (!target._previewGeneratedText) {
          target.rawTemplateText = target.text;
        }
      }
    };

    canvas.on("text:changed", handleTextSync);
    canvas.on("editing:exited", (e) => {
      handleTextSync(e);
      if (onHistoryPush) onHistoryPush(canvas);
    });

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
    <div
      className={`relative flex flex-col items-center justify-start select-none pt-0 pb-1 transition-transform ${
        isPanning
          ? "cursor-grabbing"
          : isSpaceActive || isHandToolActive
          ? "cursor-grab"
          : ""
      }`}
      style={{
        transform: `translate3d(0, ${pan?.y || 0}px, 0)`,
        transition: isPanning ? "none" : "transform 0.05s ease-out",
      }}
    >
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