"use client";

import React, { useState, useEffect } from "react";
import * as fabric from "fabric";
import {
  Sliders,
  Layers,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Trash2,
  ArrowUp,
  ArrowDown,
  Square,
  Plus,
  Minus,
  Table as TableIcon,
  RotateCw,
  RotateCcw,
  Sparkles,
  Palette,
  X as XIcon,
  PenTool,
  Copy,
  ClipboardPaste,
  FlipHorizontal,
  FlipVertical,
  Group,
  Ungroup,
  List,
  Type,
  ArrowLeftRight,
  ArrowUpDown,
} from "lucide-react";
import { getCanvasPreset } from "@/lib/editor/canvasPresets";
import {
  DEFAULT_FONTS,
  buildGoogleFontsUrl,
  FONT_WEIGHT_LABELS,
  getAvailableWeights,
} from "@/lib/fonts/fontRegistry";
import GoogleFontPickerModal from "./GoogleFontPickerModal";

// 🎨 Helper to dynamically extract unique hex colors currently used on canvas objects
function extractDocumentColors(canvas) {
  if (!canvas) return [];
  const colorSet = new Set();

  const normalizeColor = (val) => {
    if (!val || typeof val !== "string") return null;
    const clean = val.trim();
    if (clean === "transparent" || clean === "none" || clean === "rgba(0,0,0,0)") return null;
    if (clean.startsWith("#")) {
      if (clean.length === 4) {
        return `#${clean[1]}${clean[1]}${clean[2]}${clean[2]}${clean[3]}${clean[3]}`.toUpperCase();
      }
      return clean.substring(0, 7).toUpperCase();
    }
    const rgbMatch = clean.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, "0");
      const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, "0");
      const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, "0");
      return `#${r}${g}${b}`.toUpperCase();
    }
    return null;
  };

  const processObject = (obj) => {
    if (!obj || obj.isSnapGuide) return;
    if (typeof obj.fill === "string") {
      const c = normalizeColor(obj.fill);
      if (c) colorSet.add(c);
    } else if (obj.fill && Array.isArray(obj.fill.colorStops)) {
      obj.fill.colorStops.forEach((stop) => {
        const c = normalizeColor(stop.color);
        if (c) colorSet.add(c);
      });
    }
    if (typeof obj.stroke === "string") {
      const c = normalizeColor(obj.stroke);
      if (c) colorSet.add(c);
    }
    if (typeof obj.textStroke === "string") {
      const c = normalizeColor(obj.textStroke);
      if (c) colorSet.add(c);
    }
    if (obj.getObjects && typeof obj.getObjects === "function") {
      obj.getObjects().forEach(processObject);
    }
  };

  try {
    canvas.getObjects().forEach(processObject);
  } catch (e) {
    console.warn("Color extraction error:", e);
  }

  // Base fallback colors if canvas is mostly empty
  const fallbackBrandColors = ["#DC2626", "#991B1B", "#0F172A", "#111827", "#4F46E5", "#059669", "#F59E0B", "#FFFFFF"];
  fallbackBrandColors.forEach((c) => colorSet.add(c));

  return Array.from(colorSet).slice(0, 16);
}

export default function RightSidebar({
  canvas,
  activeObject,
  onPushHistory,
  canvasPreset = "a4-portrait",
  marginMm = 15,
  marginPx = 56,
  onUpdateMargin,
  onCopy,
  onPaste,
}) {
  const preset = getCanvasPreset(canvasPreset);
  const [activeTab, setActiveTab] = useState("properties");
  const [layersList, setLayersList] = useState([]);
  const [allFonts, setAllFonts] = useState(DEFAULT_FONTS);
  const [isFontPickerOpen, setIsFontPickerOpen] = useState(false);
  const [documentColors, setDocumentColors] = useState([]);

  // 🎨 Listen to canvas mutations to keep document colors dynamically updated
  useEffect(() => {
    if (!canvas) return;
    const updateColors = () => {
      setDocumentColors(extractDocumentColors(canvas));
    };
    updateColors();
    canvas.on("object:added", updateColors);
    canvas.on("object:modified", updateColors);
    canvas.on("object:removed", updateColors);
    return () => {
      canvas.off("object:added", updateColors);
      canvas.off("object:modified", updateColors);
      canvas.off("object:removed", updateColors);
    };
  }, [canvas]);

  // 🔤 Load Registered Fonts from API and Preload Google Fonts Stylesheet
  const loadFonts = async () => {
    try {
      const res = await fetch("/api/fonts");
      const data = await res.json();
      if (data.success && Array.isArray(data.allFonts)) {
        setAllFonts(data.allFonts);
        const url = buildGoogleFontsUrl(data.allFonts);
        if (url && typeof document !== "undefined") {
          let link = document.getElementById("gfonts-docbuilder-registry");
          if (!link) {
            link = document.createElement("link");
            link.id = "gfonts-docbuilder-registry";
            link.rel = "stylesheet";
            document.head.appendChild(link);
          }
          link.href = url;
        }
      }
    } catch (e) {
      console.error("Failed to load fonts:", e);
    }
  };

  useEffect(() => {
    loadFonts();
  }, []);

  // 🎨 Fill & Gradient States for Shapes
  const [fillType, setFillType] = useState("solid"); // "solid" | "linear" | "radial"
  const [gradientAngle, setGradientAngle] = useState(90); // 0 to 360 degrees
  const [colorStops, setColorStops] = useState([
    { offset: 0, color: "#4F46E5" },
    { offset: 1, color: "#06B6D4" },
  ]);

  const [propsState, setPropsState] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    angle: 0,
    opacity: 1,
    fill: "#000000",
    stroke: "#000000",
    strokeWidth: 0,
    rx: 0,
    text: "",
    fontSize: 14,
    fontFamily: "'Noto Sans Thai', sans-serif",
    fontWeight: 400,
    fontStyle: "normal",
    underline: false,
    textAlign: "left",
    lineHeight: 1.2,
    locked: false,
    visible: true,
    shadowEnabled: false,
    shadowColor: "rgba(0, 0, 0, 0.15)",
    shadowBlur: 12,
    shadowOffsetX: 0,
    shadowOffsetY: 4,
    strokeStyle: "solid",
    textStrokeEnabled: false,
    textStroke: "#FFFFFF",
    textStrokeWidth: 1.5,
    charSpacing: 0,
    splitByGrapheme: true,
  });

  // 🌈 Fabric.js Gradient Factory
  const buildFabricGradient = (type, angleDeg, stops) => {
    const sortedStops = [...stops].sort((a, b) => Number(a.offset) - Number(b.offset));
    const fabricStops = sortedStops.map((s) => ({
      offset: Math.max(0, Math.min(1, Number(s.offset))),
      color: s.color || "#000000",
    }));

    if (type === "radial") {
      return new fabric.Gradient({
        type: "radial",
        gradientUnits: "percentage",
        coords: {
          r1: 0,
          r2: 0.5,
          x1: 0.5,
          y1: 0.5,
          x2: 0.5,
          y2: 0.5,
        },
        colorStops: fabricStops,
      });
    }

    // Linear gradient (percentage coords based on angle)
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    const dx = Math.cos(angleRad) * 0.5;
    const dy = Math.sin(angleRad) * 0.5;

    return new fabric.Gradient({
      type: "linear",
      gradientUnits: "percentage",
      coords: {
        x1: 0.5 - dx,
        y1: 0.5 - dy,
        x2: 0.5 + dx,
        y2: 0.5 + dy,
      },
      colorStops: fabricStops,
    });
  };

  const applyGradientFill = (type, angle, stops) => {
    if (!canvas || !activeObject) return;
    const grad = buildFabricGradient(type, angle, stops);
    activeObject.set("fill", grad);
    activeObject.dirty = true;
    canvas.requestRenderAll();
    if (onPushHistory) onPushHistory(canvas);
  };

  // Sync state when activeObject changes
  useEffect(() => {
    if (!activeObject) return;

    const isText = activeObject.type === "textbox" || activeObject.type === "i-text" || activeObject.type === "text";
    const scaledWidth = activeObject.getScaledWidth ? activeObject.getScaledWidth() : (activeObject.width || 0) * (activeObject.scaleX || 1);
    const scaledHeight = activeObject.getScaledHeight ? activeObject.getScaledHeight() : (activeObject.height || 0) * (activeObject.scaleY || 1);

    // 1. Font weight extraction (300 - 800)
    let parsedWeight = 400;
    if (isText && activeObject.fontWeight) {
      if (activeObject.fontWeight === "bold") parsedWeight = 700;
      else if (activeObject.fontWeight === "normal") parsedWeight = 400;
      else parsedWeight = Number(activeObject.fontWeight) || 400;
    }

    // 2. Fill & Gradient extraction
    let currentFillHex = "#4F46E5";
    if (typeof activeObject.fill === "string") {
      currentFillHex = activeObject.fill;
      setFillType("solid");
    } else if (activeObject.fill && typeof activeObject.fill === "object") {
      const gType = activeObject.fill.type || "linear";
      setFillType(gType === "radial" ? "radial" : "linear");
      if (Array.isArray(activeObject.fill.colorStops) && activeObject.fill.colorStops.length >= 2) {
        setColorStops(
          activeObject.fill.colorStops.map((cs) => ({
            offset: Number(cs.offset) !== undefined ? Number(cs.offset) : 0,
            color: cs.color || "#4F46E5",
          }))
        );
        currentFillHex = activeObject.fill.colorStops[0]?.color || "#4F46E5";
      }
      if (gType === "linear" && activeObject.fill.coords) {
        const c = activeObject.fill.coords;
        const dx = (c.x2 ?? 1) - (c.x1 ?? 0);
        const dy = (c.y2 ?? 0) - (c.y1 ?? 0);
        let deg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI + 90);
        if (deg < 0) deg += 360;
        setGradientAngle(deg % 360);
      }
    }

    // 3. Drop Shadow extraction
    const sObj = activeObject.shadow;
    const shadowEnabled = Boolean(sObj);
    const shadowColor = sObj?.color || "rgba(0, 0, 0, 0.15)";
    const shadowBlur = sObj?.blur !== undefined ? sObj.blur : 12;
    const shadowOffsetX = sObj?.offsetX !== undefined ? sObj.offsetX : 0;
    const shadowOffsetY = sObj?.offsetY !== undefined ? sObj.offsetY : 4;

    // 4. Stroke Style extraction
    let strokeStyle = "solid";
    if (Array.isArray(activeObject.strokeDashArray) && activeObject.strokeDashArray.length > 0) {
      if (activeObject.strokeDashArray[0] <= 3) {
        strokeStyle = "dotted";
      } else {
        strokeStyle = "dashed";
      }
    }

    // 5. Text Stroke extraction
    const textStroke = isText && typeof activeObject.stroke === "string" ? activeObject.stroke : "#FFFFFF";
    const textStrokeWidth = isText && activeObject.strokeWidth ? activeObject.strokeWidth : 0;
    const textStrokeEnabled = Boolean(isText && activeObject.strokeWidth && activeObject.strokeWidth > 0);
    const charSpacing = isText ? (activeObject.charSpacing || 0) : 0;
    const splitByGrapheme = isText ? (activeObject.splitByGrapheme !== false) : true;

    setPropsState({
      left: Math.round(activeObject.left || 0),
      top: Math.round(activeObject.top || 0),
      width: Math.round(scaledWidth),
      height: Math.round(scaledHeight),
      angle: Math.round(activeObject.angle || 0),
      opacity: activeObject.opacity !== undefined ? activeObject.opacity : 1,
      fill: currentFillHex,
      stroke: typeof activeObject.stroke === "string" ? activeObject.stroke : "#000000",
      strokeWidth: activeObject.strokeWidth || 0,
      rx: activeObject.rx || 0,
      text: isText ? activeObject.text : "",
      fontSize: isText ? activeObject.fontSize || 14 : 14,
      fontFamily: isText ? activeObject.fontFamily || "'Noto Sans Thai', sans-serif" : "'Noto Sans Thai', sans-serif",
      fontWeight: parsedWeight,
      fontStyle: isText ? activeObject.fontStyle || "normal" : "normal",
      underline: isText ? Boolean(activeObject.underline) : false,
      textAlign: isText ? activeObject.textAlign || "left" : "left",
      lineHeight: isText ? activeObject.lineHeight || 1.2 : 1.2,
      locked: Boolean(activeObject.lockMovementX),
      visible: activeObject.visible !== false,
      shadowEnabled,
      shadowColor,
      shadowBlur,
      shadowOffsetX,
      shadowOffsetY,
      strokeStyle,
      textStrokeEnabled,
      textStroke,
      textStrokeWidth,
      charSpacing,
      splitByGrapheme,
    });
  }, [activeObject]);

  // Refresh Layers List whenever canvas changes or after Undo/Redo
  const refreshLayers = () => {
    if (!canvas) return;
    const objs = canvas.getObjects();
    setLayersList([...objs].reverse());
  };

  useEffect(() => {
    if (!canvas) return;
    refreshLayers();

    const handleCanvasChange = () => {
      refreshLayers();
    };

    canvas.on("object:added", handleCanvasChange);
    canvas.on("object:removed", handleCanvasChange);
    canvas.on("object:modified", handleCanvasChange);

    return () => {
      canvas.off("object:added", handleCanvasChange);
      canvas.off("object:removed", handleCanvasChange);
      canvas.off("object:modified", handleCanvasChange);
    };
  }, [canvas]);

  const applyProperty = (key, value) => {
    if (!canvas || !activeObject) return;

    if (key === "width" || key === "height") {
      if (activeObject.type === "textbox" || activeObject.isType?.("Textbox")) {
        if (key === "width") {
          const newW = Math.max(10, Number(value));
          activeObject.set({
            width: newW,
            scaleX: 1,
            splitByGrapheme: true,
            objectCaching: false,
          });
          if (typeof activeObject.initDimensions === "function") {
            activeObject.initDimensions();
          }
          activeObject.dirty = true;
        }
      } else if (activeObject.type === "rect") {
        if (key === "width") {
          const newW = Math.max(5, Number(value));
          activeObject.set({ width: newW, scaleX: 1 });
        } else if (key === "height") {
          const newH = Math.max(5, Number(value));
          activeObject.set({ height: newH, scaleY: 1 });
        }
        activeObject.setCoords();
        activeObject.dirty = true;
      } else if (activeObject.type === "circle") {
        const newD = Math.max(5, Number(value));
        activeObject.set({ radius: newD / 2, scaleX: 1, scaleY: 1 });
        activeObject.setCoords();
        activeObject.dirty = true;
      } else if (activeObject.type === "ellipse") {
        if (key === "width") {
          activeObject.set({ rx: Math.max(2, Number(value) / 2), scaleX: 1 });
        } else if (key === "height") {
          activeObject.set({ ry: Math.max(2, Number(value) / 2), scaleY: 1 });
        }
        activeObject.setCoords();
        activeObject.dirty = true;
      } else if (activeObject.type === "line") {
        if (key === "width") {
          const newW = Math.max(5, Number(value));
          activeObject.set({ x2: (activeObject.x1 || 0) + newW, scaleX: 1 });
        }
        activeObject.setCoords();
        activeObject.dirty = true;
      } else {
        if (key === "width") activeObject.scaleToWidth(Number(value));
        if (key === "height") activeObject.scaleToHeight(Number(value));
        activeObject.setCoords();
        activeObject.dirty = true;
      }
    } else if (key === "rx") {
      const rVal = Math.max(0, Number(value));
      activeObject.set({ rx: rVal, ry: rVal });
      activeObject.dirty = true;
    } else if (key === "strokeWidth") {
      const sw = Math.max(0, Number(value));
      activeObject.set({ strokeWidth: sw, strokeUniform: true });
      activeObject.dirty = true;
    } else if (key === "fontSize") {
      const size = Math.max(1, Number(value));
      activeObject.set({
        fontSize: size,
        objectCaching: false,
      });
      if (typeof activeObject.initDimensions === "function") {
        activeObject.initDimensions();
      }
      activeObject.dirty = true;
    } else if (key === "splitByGrapheme") {
      activeObject.set({
        splitByGrapheme: Boolean(value),
        objectCaching: false,
      });
      if (typeof activeObject.initDimensions === "function") {
        activeObject.initDimensions();
      }
      activeObject.dirty = true;
    } else if (key === "fontWeight") {
      // ⚖️ Support numeric weights (300, 400, 500, 600, 700, 800)
      activeObject.set("fontWeight", Number(value) || value);
      activeObject.dirty = true;
    } else {
      activeObject.set(key, value);
      if (key === "angle") {
        activeObject.setCoords();
      }
      activeObject.dirty = true;
    }

    setPropsState((prev) => ({ ...prev, [key]: value }));
    canvas.requestRenderAll();
    if (onPushHistory) onPushHistory(canvas);
  };

  const handleShadowChange = (patch) => {
    if (!canvas || !activeObject) return;
    const nextProps = {
      shadowEnabled: propsState.shadowEnabled,
      shadowColor: propsState.shadowColor,
      shadowBlur: propsState.shadowBlur,
      shadowOffsetX: propsState.shadowOffsetX,
      shadowOffsetY: propsState.shadowOffsetY,
      ...patch,
    };

    if (!nextProps.shadowEnabled) {
      activeObject.set("shadow", null);
    } else {
      activeObject.set(
        "shadow",
        new fabric.Shadow({
          color: nextProps.shadowColor,
          blur: Number(nextProps.shadowBlur),
          offsetX: Number(nextProps.shadowOffsetX),
          offsetY: Number(nextProps.shadowOffsetY),
        })
      );
    }
    activeObject.dirty = true;
    canvas.requestRenderAll();
    setPropsState((prev) => ({ ...prev, ...nextProps }));
    if (onPushHistory) onPushHistory(canvas);
  };

  const handleStrokeStyleChange = (newStyle) => {
    if (!canvas || !activeObject) return;
    let dashArr = null;
    if (newStyle === "dashed") dashArr = [8, 6];
    else if (newStyle === "dotted") dashArr = [2, 4];
    activeObject.set("strokeDashArray", dashArr);
    activeObject.dirty = true;
    canvas.requestRenderAll();
    setPropsState((prev) => ({ ...prev, strokeStyle: newStyle }));
    if (onPushHistory) onPushHistory(canvas);
  };

  const applyTextStroke = (enabled, color, width) => {
    if (!canvas || !activeObject) return;
    const strokeColor = color !== undefined ? color : (propsState.textStroke || "#FFFFFF");
    const strokeWidth = width !== undefined ? Number(width) : (propsState.textStrokeWidth || 1.5);

    if (!enabled) {
      activeObject.set({
        stroke: null,
        strokeWidth: 0,
      });
      setPropsState((prev) => ({
        ...prev,
        textStrokeEnabled: false,
      }));
    } else {
      activeObject.set({
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        paintFirst: "stroke",
      });
      setPropsState((prev) => ({
        ...prev,
        textStrokeEnabled: true,
        textStroke: strokeColor,
        textStrokeWidth: strokeWidth,
      }));
    }
    activeObject.dirty = true;
    canvas.requestRenderAll();
    if (onPushHistory) onPushHistory(canvas);
  };

  const handleFontFromPicker = (selectedFont) => {
    if (!selectedFont) return;
    setAllFonts((prev) => {
      if (prev.some((f) => f.id === selectedFont.id)) return prev;
      return [...prev, selectedFont];
    });
    applyProperty("fontFamily", selectedFont.cssStack);
    loadFonts();
  };

  // 🎨 Fill & Gradient Actions
  const handleFillTypeChange = (newType) => {
    setFillType(newType);
    if (newType === "solid") {
      const solidColor = colorStops[0]?.color || propsState.fill || "#4F46E5";
      applyProperty("fill", solidColor);
    } else if (newType === "linear") {
      applyGradientFill("linear", gradientAngle, colorStops);
    } else if (newType === "radial") {
      applyGradientFill("radial", gradientAngle, colorStops);
    }
  };

  const handleUpdateStop = (index, field, value) => {
    const nextStops = [...colorStops];
    nextStops[index] = { ...nextStops[index], [field]: value };
    setColorStops(nextStops);
    if (fillType !== "solid") {
      applyGradientFill(fillType, gradientAngle, nextStops);
    }
  };

  const handleAddStop = () => {
    const sorted = [...colorStops].sort((a, b) => a.offset - b.offset);
    const newOffset = sorted.length > 0 ? (sorted[0].offset + sorted[sorted.length - 1].offset) / 2 : 0.5;
    const newColor = sorted[1]?.color || "#06B6D4";
    const nextStops = [...colorStops, { offset: Number(newOffset.toFixed(2)), color: newColor }].sort(
      (a, b) => a.offset - b.offset
    );
    setColorStops(nextStops);
    if (fillType !== "solid") {
      applyGradientFill(fillType, gradientAngle, nextStops);
    }
  };

  const handleRemoveStop = (index) => {
    if (colorStops.length <= 2) return;
    const nextStops = colorStops.filter((_, i) => i !== index);
    setColorStops(nextStops);
    if (fillType !== "solid") {
      applyGradientFill(fillType, gradientAngle, nextStops);
    }
  };

  const handleAngleChange = (newAngle) => {
    const norm = Math.max(0, Math.min(360, Number(newAngle) || 0));
    setGradientAngle(norm);
    if (fillType === "linear") {
      applyGradientFill("linear", norm, colorStops);
    }
  };

  // 100% Zoom-Independent Alignment using getScaledWidth() / getScaledHeight()
  const handleAlign = (type) => {
    if (!canvas || !activeObject) return;

    // Use unscaled native A4 dimension metrics
    const objWidth = activeObject.getScaledWidth ? activeObject.getScaledWidth() : (activeObject.width || 0) * (activeObject.scaleX || 1);
    const objHeight = activeObject.getScaledHeight ? activeObject.getScaledHeight() : (activeObject.height || 0) * (activeObject.scaleY || 1);

    const effectiveMargin = marginPx !== null && marginPx !== undefined ? marginPx : preset.marginPx;

    switch (type) {
      case "left":
        activeObject.set("left", effectiveMargin);
        break;
      case "center":
        activeObject.set("left", (preset.width - objWidth) / 2);
        break;
      case "right":
        activeObject.set("left", preset.width - effectiveMargin - objWidth);
        break;
      case "top":
        activeObject.set("top", effectiveMargin);
        break;
      case "middle":
        activeObject.set("top", (preset.height - objHeight) / 2);
        break;
      case "bottom":
        activeObject.set("top", preset.height - effectiveMargin - objHeight);
        break;
    }

    setPropsState((prev) => ({
      ...prev,
      left: Math.round(activeObject.left),
      top: Math.round(activeObject.top),
    }));
    activeObject.setCoords();
    canvas.requestRenderAll();
    if (onPushHistory) onPushHistory(canvas);
  };

  const handleBringForward = (obj = activeObject) => {
    if (!canvas || !obj) return;
    if (canvas.bringObjectForward) canvas.bringObjectForward(obj);
    else if (canvas.bringForward) canvas.bringForward(obj);
    canvas.requestRenderAll();
    refreshLayers();
    if (onPushHistory) onPushHistory(canvas);
  };

  const handleSendBackward = (obj = activeObject) => {
    if (!canvas || !obj) return;
    if (canvas.sendObjectBackwards) canvas.sendObjectBackwards(obj);
    else if (canvas.sendBackwards) canvas.sendBackwards(obj);
    canvas.requestRenderAll();
    refreshLayers();
    if (onPushHistory) onPushHistory(canvas);
  };

  // Toggle Lock: Keeps selectable=true so object can be clicked and unlocked anytime
  const handleToggleLock = (obj = activeObject) => {
    if (!canvas || !obj) return;
    const isLocked = !obj.lockMovementX;
    obj.set({
      lockMovementX: isLocked,
      lockMovementY: isLocked,
      lockRotation: isLocked,
      lockScalingX: isLocked,
      lockScalingY: isLocked,
      hasControls: !isLocked,
      selectable: true, // Always selectable so it can be selected and unlocked
    });
    setPropsState((prev) => ({ ...prev, locked: isLocked }));
    canvas.requestRenderAll();
    refreshLayers();
    if (onPushHistory) onPushHistory(canvas);
  };

  const handleToggleVisibility = (obj = activeObject) => {
    if (!canvas || !obj) return;
    const isVisible = obj.visible !== false;
    obj.set("visible", !isVisible);
    if (isVisible) canvas.discardActiveObject();
    canvas.requestRenderAll();
    refreshLayers();
    if (onPushHistory) onPushHistory(canvas);
  };

  const handleDelete = (obj = activeObject) => {
    if (!canvas || !obj) return;
    canvas.remove(obj);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    refreshLayers();
    if (onPushHistory) onPushHistory(canvas);
  };

  const handleDuplicate = async (obj = activeObject) => {
    if (!canvas || !obj) return;
    const clone = await obj.clone(CUSTOM_CANVAS_PROPS);
    if (!clone) return;
    clone.set({
      left: (obj.left || 0) + 20,
      top: (obj.top || 0) + 20,
      evented: true,
    });
    if (clone.type?.toLowerCase() === "activeselection") {
      clone.canvas = canvas;
      clone.forEachObject((innerObj) => {
        canvas.add(innerObj);
      });
      clone.setCoords();
      canvas.setActiveObject(clone);
    } else {
      canvas.add(clone);
      canvas.setActiveObject(clone);
    }
    canvas.requestRenderAll();
    refreshLayers();
    if (onPushHistory) onPushHistory(canvas);
  };

  const handleFlip = (direction) => {
    if (!canvas || !activeObject) return;
    if (direction === "x") {
      activeObject.set("flipX", !activeObject.flipX);
    } else {
      activeObject.set("flipY", !activeObject.flipY);
    }
    activeObject.setCoords();
    activeObject.dirty = true;
    canvas.requestRenderAll();
    if (onPushHistory) onPushHistory(canvas);
  };

  const handleRotateStep = (degrees) => {
    if (!canvas || !activeObject) return;
    const currentAngle = activeObject.angle || 0;
    const nextAngle = (Math.round(currentAngle + degrees) + 360) % 360;
    activeObject.set("angle", nextAngle);
    activeObject.setCoords();
    activeObject.dirty = true;
    setPropsState((prev) => ({ ...prev, angle: nextAngle }));
    canvas.requestRenderAll();
    if (onPushHistory) onPushHistory(canvas);
  };

  const handleGroupSelection = () => {
    if (!canvas || !activeObject || activeObject.type?.toLowerCase() !== "activeselection") return;
    const selectionObjects = activeObject.getObjects();
    if (selectionObjects.length < 2) return;

    const hasCustomClass = selectionObjects.some(
      (o) => o.isDocTable || o.type === "DocTable" || o.type === "doctable" || o.isSignatureBlock
    );
    if (hasCustomClass) {
      alert("ไม่สามารถรวมกลุ่ม (Group) ตารางหรือบล็อกลงนามร่วมกับวัตถุอื่นได้");
      return;
    }

    canvas.discardActiveObject();
    selectionObjects.forEach((obj) => canvas.remove(obj));
    const newGroup = new fabric.Group(selectionObjects, { isUserGroup: true });
    canvas.add(newGroup);
    canvas.setActiveObject(newGroup);
    canvas.requestRenderAll();
    refreshLayers();
    if (onPushHistory) onPushHistory(canvas);
  };

  const handleUngroupSelection = () => {
    if (!canvas || !activeObject || (!activeObject.isUserGroup && activeObject.type !== "group")) return;
    const childObjects = [...activeObject.getObjects()];
    const absTransforms = childObjects.map((child) => child.calcTransformMatrix());

    canvas.discardActiveObject();
    canvas.remove(activeObject);

    childObjects.forEach((child, i) => {
      const matrix = absTransforms[i];
      const decomposed = fabric.util.qrDecompose(matrix);
      child.set({
        left: decomposed.translateX,
        top: decomposed.translateY,
        scaleX: decomposed.scaleX,
        scaleY: decomposed.scaleY,
        angle: decomposed.angle,
        skewX: decomposed.skewX,
        skewY: 0,
        group: undefined,
      });
      child.setCoords();
      canvas.add(child);
    });

    const sel = new fabric.ActiveSelection(childObjects, { canvas });
    canvas.setActiveObject(sel);
    canvas.requestRenderAll();
    refreshLayers();
    if (onPushHistory) onPushHistory(canvas);
  };

  const handleAlignWithinSelection = (type) => {
    if (!canvas || !activeObject || activeObject.type?.toLowerCase() !== "activeselection") return;
    const objects = activeObject.getObjects();
    if (objects.length < 2) return;
    const groupWidth = activeObject.width;
    const groupHeight = activeObject.height;

    objects.forEach((obj) => {
      const w = obj.getScaledWidth ? obj.getScaledWidth() : (obj.width || 0) * (obj.scaleX || 1);
      const h = obj.getScaledHeight ? obj.getScaledHeight() : (obj.height || 0) * (obj.scaleY || 1);
      switch (type) {
        case "left":
          obj.set("left", -groupWidth / 2);
          break;
        case "center":
          obj.set("left", -w / 2);
          break;
        case "right":
          obj.set("left", groupWidth / 2 - w);
          break;
        case "top":
          obj.set("top", -groupHeight / 2);
          break;
        case "middle":
          obj.set("top", -h / 2);
          break;
        case "bottom":
          obj.set("top", groupHeight / 2 - h);
          break;
      }
      obj.setCoords();
    });
    activeObject.setCoords();
    activeObject.dirty = true;
    canvas.requestRenderAll();
    if (onPushHistory) onPushHistory(canvas);
  };

  const handleDistribute = (direction) => {
    if (!canvas || !activeObject || activeObject.type?.toLowerCase() !== "activeselection") return;
    const objects = activeObject.getObjects();
    if (objects.length < 3) return;

    if (direction === "horizontal") {
      const sorted = [...objects].sort((a, b) => (a.left || 0) - (b.left || 0));
      const minLeft = sorted[0].left || 0;
      const maxLeft = sorted[sorted.length - 1].left || 0;
      const step = (maxLeft - minLeft) / (sorted.length - 1);
      sorted.forEach((obj, idx) => {
        obj.set("left", minLeft + step * idx);
        obj.setCoords();
      });
    } else {
      const sorted = [...objects].sort((a, b) => (a.top || 0) - (b.top || 0));
      const minTop = sorted[0].top || 0;
      const maxTop = sorted[sorted.length - 1].top || 0;
      const step = (maxTop - minTop) / (sorted.length - 1);
      sorted.forEach((obj, idx) => {
        obj.set("top", minTop + step * idx);
        obj.setCoords();
      });
    }
    activeObject.setCoords();
    activeObject.dirty = true;
    canvas.requestRenderAll();
    if (onPushHistory) onPushHistory(canvas);
  };

  const handleTextTransform = (mode) => {
    if (!canvas || !activeObject || !isText) return;
    const currentText = activeObject.text || "";
    let transformed = currentText;
    if (mode === "uppercase") {
      transformed = currentText.toUpperCase();
    } else if (mode === "lowercase") {
      transformed = currentText.toLowerCase();
    } else if (mode === "capitalize") {
      transformed = currentText.replace(/\b\w/g, (c) => c.toUpperCase());
    }
    activeObject.set({ text: transformed, objectCaching: false });
    if (typeof activeObject.initDimensions === "function") activeObject.initDimensions();
    activeObject.dirty = true;
    setPropsState((prev) => ({ ...prev, text: transformed }));
    canvas.requestRenderAll();
    if (onPushHistory) onPushHistory(canvas);
  };

  const handleToggleBulletList = () => {
    if (!canvas || !activeObject || !isText) return;
    const currentText = activeObject.text || "";
    const lines = currentText.split("\n");
    const allBulleted = lines.every((l) => l.trim().startsWith("• "));
    const updatedLines = lines.map((line) => {
      if (allBulleted) {
        return line.replace(/^\s*•\s*/, "");
      } else {
        return line.trim().startsWith("• ") ? line : `• ${line}`;
      }
    });
    const newText = updatedLines.join("\n");
    activeObject.set({ text: newText, objectCaching: false });
    if (typeof activeObject.initDimensions === "function") activeObject.initDimensions();
    activeObject.dirty = true;
    setPropsState((prev) => ({ ...prev, text: newText }));
    canvas.requestRenderAll();
    if (onPushHistory) onPushHistory(canvas);
  };

  const isMultiple = Boolean(activeObject && activeObject.type?.toLowerCase() === "activeselection");
  const isGroup = Boolean(activeObject && (activeObject.isUserGroup || (activeObject.type === "group" && !activeObject.isDocTable)));
  const isText = Boolean(activeObject && (activeObject.type === "textbox" || activeObject.type === "i-text" || activeObject.type === "text"));
  const isIcon = Boolean(activeObject && (activeObject.isIcon || activeObject.iconId || (activeObject.type === "path" && !activeObject.isArrow)));
  const isShape = Boolean(activeObject && (
    activeObject.type === "rect" ||
    activeObject.type === "circle" ||
    activeObject.type === "line" ||
    activeObject.type === "polygon" ||
    activeObject.type === "ellipse" ||
    activeObject.type === "triangle" ||
    activeObject.type === "path" ||
    activeObject.isShape
  ));
  const isDocTable = Boolean(activeObject && (activeObject.isDocTable || activeObject.type === "DocTable" || activeObject.type === "docTable"));

  return (
    <aside className="editor-right-sidebar w-80 bg-white border-l border-gray-200 flex flex-col h-[calc(100vh-53px)] select-none z-20 shrink-0 shadow-xs">
      <div className="flex border-b border-gray-200 bg-gray-50/70 p-1 gap-1">
        <button
          onClick={() => setActiveTab("properties")}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "properties" ? "bg-white text-indigo-600 shadow-xs" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>คุณสมบัติ (Properties)</span>
        </button>

        <button
          onClick={() => setActiveTab("layers")}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "layers" ? "bg-white text-indigo-600 shadow-xs" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>เลเยอร์ ({layersList.length})</span>
        </button>
      </div>

      {activeTab === "properties" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {!activeObject ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Square className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">ยังไม่ได้เลือกวัตถุ</p>
                <p className="text-gray-400 text-[11px] mt-0.5">คลิกที่วัตถุบน{preset.id === "slide-16-9" ? "สไลด์" : "หน้าเอกสาร"}เพื่อปรับแต่ง</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-left space-y-1.5 mt-4">
                <div className="flex justify-between text-gray-500">
                  <span>ประเภท / ขนาด:</span>
                  <span className="font-mono font-semibold text-gray-800">{preset.name}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>พิกเซล (96 DPI):</span>
                  <span className="font-mono font-semibold text-gray-800">{preset.width} × {preset.height} px</span>
                </div>
                <div className="pt-2 border-t border-gray-200/60">
                  <div className="flex justify-between items-center text-gray-600 mb-1.5">
                    <span className="text-xs font-medium">ระยะขอบ (Margin):</span>
                    <span className="font-mono font-semibold text-rose-600 text-xs">
                      {preset.mmWidth
                        ? ((marginMm ?? 15) === 0
                            ? "ไม่มีเส้นขอบ (0 mm)"
                            : `${marginMm ?? Math.round((marginPx * 25.4) / 96)} mm (${marginPx} px)`)
                        : (marginPx === 0
                            ? "ไม่มีเส้นขอบ (0 px)"
                            : `${marginPx} px`)}
                    </span>
                  </div>
                  {onUpdateMargin && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="number"
                        min={0}
                        max={preset.mmWidth ? 60 : 200}
                        value={preset.mmWidth ? (marginMm ?? 15) : marginPx}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          onUpdateMargin(val, preset.mmWidth ? "mm" : "px");
                        }}
                        className="w-16 font-mono text-center text-xs font-bold bg-white border border-gray-300 rounded-md px-1.5 py-1 outline-none focus:border-rose-500"
                      />
                      <span className="text-[11px] text-gray-400 font-medium">{preset.mmWidth ? "mm" : "px"}</span>
                      <div className="flex items-center gap-1 ml-auto">
                        {(preset.mmWidth ? [0, 10, 15, 20] : [0, 20, 40, 60]).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => onUpdateMargin(m, preset.mmWidth ? "mm" : "px")}
                            className={`px-1.5 py-0.5 text-[10px] font-mono rounded border cursor-pointer transition-colors ${
                              (preset.mmWidth ? marginMm : marginPx) === m
                                ? "bg-rose-50 border-rose-300 text-rose-700 font-bold"
                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 📋 Cross-Template Clipboard Paste */}
                {onPaste && (
                  <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                        <ClipboardPaste className="w-4 h-4 text-indigo-600" />
                        <span>คลิปบอร์ดข้ามโปรเจกต์</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={onPaste}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      <span>วางวัตถุที่คัดลอกไว้ (Ctrl+V)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span
                  className="font-bold text-gray-900 text-sm truncate max-w-[150px]"
                  title={
                    isMultiple
                      ? `เลือก ${activeObject.getObjects?.()?.length || 0} ชิ้น`
                      : isGroup
                      ? "กลุ่มวัตถุ (Group)"
                      : isDocTable
                      ? "ตารางใบเสนอราคา"
                      : isText
                      ? "ข้อความ (Text)"
                      : isIcon
                      ? "ไอคอนเวกเตอร์"
                      : isShape
                      ? "รูปทรง (Shape)"
                      : "รูปภาพ (Image)"
                  }
                >
                  {isMultiple
                    ? `👥 เลือกหลายชิ้น (${activeObject.getObjects?.()?.length || 0})`
                    : isGroup
                    ? "📦 กลุ่มวัตถุ (Group)"
                    : isDocTable
                    ? "📊 ตารางใบเสนอราคา"
                    : isText
                    ? "🔤 ข้อความ (Text)"
                    : isIcon
                    ? "✨ ไอคอนเวกเตอร์"
                    : isShape
                    ? "🔷 รูปทรง (Shape)"
                    : "🖼️ รูปภาพ (Image)"}
                </span>
                <div className="flex items-center gap-1">
                  {/* 📋 Copy Button (Cross-Template) */}
                  {onCopy && (
                    <button
                      type="button"
                      onClick={onCopy}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                      title="คัดลอกวัตถุข้ามโปรเจกต์ (Copy - Ctrl+C)"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {/* 📋 Duplicate Button */}
                  <button
                    type="button"
                    onClick={() => handleDuplicate()}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                    title="ทำซ้ำวัตถุในหน้านี้ (Duplicate - Ctrl+D)"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleLock()}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      propsState.locked ? "bg-amber-50 text-amber-600 border-amber-200" : "text-gray-500 hover:bg-gray-100 border-gray-200"
                    }`}
                    title={propsState.locked ? "ปลดล็อกวัตถุ" : "ล็อกวัตถุ"}
                  >
                    {propsState.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete()}
                    className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="ลบวัตถุ (Delete)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 👥 MULTI-SELECTION TOOLS */}
              {isMultiple && (
                <div className="space-y-3 p-3 bg-indigo-50/80 rounded-xl border border-indigo-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                      <Group className="w-4 h-4 text-indigo-600" />
                      <span>จัดการวัตถุที่เลือก ({activeObject.getObjects?.()?.length || 0} ชิ้น)</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleGroupSelection}
                      className="flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer transition-colors"
                      title="รวมเป็นกลุ่มเดียวกัน (Ctrl+G)"
                    >
                      <Group className="w-3 h-3" />
                      <span>จัดกลุ่ม (Ctrl+G)</span>
                    </button>
                  </div>

                  {/* Align Within Selection */}
                  <div className="pt-1 border-t border-indigo-200/60">
                    <label className="text-[10px] text-indigo-900 font-semibold mb-1 block">จัดชิดระหว่างวัตถุที่เลือก</label>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => handleAlignWithinSelection("left")}
                        className="py-1 px-1.5 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded text-[10px] font-medium cursor-pointer"
                      >
                        ชิดซ้าย
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAlignWithinSelection("center")}
                        className="py-1 px-1.5 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded text-[10px] font-medium cursor-pointer"
                      >
                        กึ่งกลาง
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAlignWithinSelection("right")}
                        className="py-1 px-1.5 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded text-[10px] font-medium cursor-pointer"
                      >
                        ชิดขวา
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAlignWithinSelection("top")}
                        className="py-1 px-1.5 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded text-[10px] font-medium cursor-pointer"
                      >
                        ชิดบน
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAlignWithinSelection("middle")}
                        className="py-1 px-1.5 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded text-[10px] font-medium cursor-pointer"
                      >
                        กึ่งกลางตั้ง
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAlignWithinSelection("bottom")}
                        className="py-1 px-1.5 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded text-[10px] font-medium cursor-pointer"
                      >
                        ชิดล่าง
                      </button>
                    </div>
                  </div>

                  {/* Distribute Evenly */}
                  {activeObject.getObjects?.()?.length >= 3 && (
                    <div className="pt-1 border-t border-indigo-200/60">
                      <label className="text-[10px] text-indigo-900 font-semibold mb-1 block">กระจายระยะห่างเท่ากัน</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDistribute("horizontal")}
                          className="flex items-center justify-center gap-1 py-1 px-1.5 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded text-[10px] font-medium cursor-pointer"
                        >
                          <ArrowLeftRight className="w-3 h-3 text-indigo-600" />
                          <span>แนวนอน</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDistribute("vertical")}
                          className="flex items-center justify-center gap-1 py-1 px-1.5 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded text-[10px] font-medium cursor-pointer"
                        >
                          <ArrowUpDown className="w-3 h-3 text-indigo-600" />
                          <span>แนวตั้ง</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 📦 GROUP UNGROUP CONTROLS */}
              {isGroup && (
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Group className="w-4 h-4 text-amber-700" />
                    <div>
                      <span className="font-bold text-amber-950 text-xs block">กลุ่มวัตถุ (Group)</span>
                      <span className="text-[10px] text-amber-700 block">มี {activeObject.getObjects?.()?.length || 0} วัตถุข้างใน</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleUngroupSelection}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold shadow-2xs cursor-pointer transition-colors"
                    title="แยกกลุ่มออกจากกัน (Ctrl+Shift+G)"
                  >
                    <Ungroup className="w-3.5 h-3.5 text-amber-700" />
                    <span>ยกเลิกกลุ่ม</span>
                  </button>
                </div>
              )}

              {/* ── DOCTABLE DYNAMIC ROW CONTROLS ── */}
              {isDocTable && (
                <div className="space-y-3 p-3 bg-blue-50/70 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                      <TableIcon className="w-4 h-4 text-blue-600" />
                      <span>จัดการแถวตาราง</span>
                    </span>
                    <span className="text-[11px] font-semibold text-blue-800 bg-blue-100/90 px-2 py-0.5 rounded-full border border-blue-200">
                      {activeObject.docTableData?.items?.length || 0} แถว
                    </span>
                  </div>

                  {/* Add / Remove Row Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        activeObject.addRow();
                        if (onPushHistory) onPushHistory(canvas);
                      }}
                      className="flex items-center justify-center gap-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มแถว (+)</span>
                    </button>

                    <button
                      onClick={() => {
                        activeObject.removeRow();
                        if (onPushHistory) onPushHistory(canvas);
                      }}
                      className="flex items-center justify-center gap-1 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>ลบแถว (-)</span>
                    </button>
                  </div>

                  {/* Header Color Picker & VAT Toggle */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200/60">
                    <div>
                      <label className="text-[10px] text-blue-900 font-semibold mb-1 block">สีหัวตาราง</label>
                      <div className="flex items-center gap-1.5 bg-white border border-blue-200 rounded-lg p-1">
                        <input
                          type="color"
                          value={typeof activeObject.docTableData?.themeColor === "string" && /^#[0-9A-Fa-f]{6}$/.test(activeObject.docTableData.themeColor) ? activeObject.docTableData.themeColor : "#2563EB"}
                          onChange={(e) => {
                            activeObject.setThemeColor(e.target.value);
                            if (onPushHistory) onPushHistory(canvas);
                          }}
                          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <span className="font-mono text-[10px] text-blue-900 uppercase truncate">
                          {typeof activeObject.docTableData?.themeColor === "string" ? activeObject.docTableData.themeColor : "#2563EB"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-blue-900 font-semibold mb-1 block">ภาษีมูลค่าเพิ่ม</label>
                      <select
                        value={activeObject.docTableData?.vatRate !== undefined ? activeObject.docTableData.vatRate : 7}
                        onChange={(e) => {
                          activeObject.setVatRate(Number(e.target.value));
                          if (onPushHistory) onPushHistory(canvas);
                        }}
                        className="w-full bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-xs font-bold text-blue-900 outline-none cursor-pointer"
                      >
                        <option value={7}>VAT 7%</option>
                        <option value={0}>VAT 0% (ยกเว้น)</option>
                      </select>
                    </div>
                  </div>

                  {/* Row Items Details Editor in Studio */}
                  {Array.isArray(activeObject.docTableData?.items) && activeObject.docTableData.items.length > 0 && (
                    <div className="pt-2 border-t border-blue-200/60 space-y-2">
                      <label className="text-[10px] text-blue-900 font-bold block">
                        รายละเอียดแถวในตาราง ({activeObject.docTableData.items.length} รายการ)
                      </label>
                      <div className="max-h-56 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                        {activeObject.docTableData.items.map((item, idx) => (
                          <div key={idx} className="p-2 bg-white rounded-lg border border-blue-200/80 shadow-2xs space-y-1.5 text-xs">
                            <div className="flex items-center justify-between text-[10px] text-blue-950 font-bold">
                              <span>แถวที่ #{idx + 1}</span>
                              {activeObject.docTableData.items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextItems = activeObject.docTableData.items
                                      .filter((_, i) => i !== idx)
                                      .map((it, i) => ({ ...it, no: String(i + 1) }));
                                    activeObject.updateTableData({ items: nextItems });
                                    if (onPushHistory) onPushHistory(canvas);
                                  }}
                                  className="text-red-500 hover:text-red-700 cursor-pointer p-0.5"
                                  title="ลบแถวนี้"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              value={item.desc || item.title || ""}
                              onChange={(e) => {
                                const nextItems = [...activeObject.docTableData.items];
                                nextItems[idx] = { ...nextItems[idx], desc: e.target.value };
                                activeObject.updateTableData({ items: nextItems });
                                if (onPushHistory) onPushHistory(canvas);
                              }}
                              placeholder="รายละเอียดสินค้า..."
                              className="w-full h-7 px-2 text-[11px] rounded border border-gray-200 outline-none focus:border-blue-500"
                            />
                            <div className="grid grid-cols-2 gap-1.5">
                              <div>
                                <label className="text-[9px] text-gray-500 block">จำนวน</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.qty ?? 1}
                                  onChange={(e) => {
                                    const nextItems = [...activeObject.docTableData.items];
                                    nextItems[idx] = { ...nextItems[idx], qty: Number(e.target.value) || 1 };
                                    activeObject.updateTableData({ items: nextItems });
                                    if (onPushHistory) onPushHistory(canvas);
                                  }}
                                  className="w-full h-6 px-1.5 text-[11px] text-center rounded border border-gray-200 outline-none focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-gray-500 block">ราคา/หน่วย</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={item.price ?? 0}
                                  onChange={(e) => {
                                    const nextItems = [...activeObject.docTableData.items];
                                    nextItems[idx] = { ...nextItems[idx], price: Number(e.target.value) || 0 };
                                    activeObject.updateTableData({ items: nextItems });
                                    if (onPushHistory) onPushHistory(canvas);
                                  }}
                                  className="w-full h-6 px-1.5 text-[11px] text-right rounded border border-gray-200 outline-none focus:border-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isText && (
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">แบบอักษรและการจัดวาง</h3>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] text-gray-500 block">แบบอักษร</label>
                      <button
                        type="button"
                        onClick={() => setIsFontPickerOpen(true)}
                        className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                        title="ค้นหาฟอนต์จาก Google Fonts"
                      >
                        <Plus size={11} /> เพิ่มฟอนต์
                      </button>
                    </div>
                    <select
                      value={propsState.fontFamily}
                      onChange={(e) => {
                        if (e.target.value === "__ADD_CUSTOM_FONT__") {
                          setIsFontPickerOpen(true);
                          return;
                        }
                        applyProperty("fontFamily", e.target.value);
                      }}
                      style={{ fontFamily: propsState.fontFamily }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-800 outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {allFonts.map((font) => (
                        <option
                          key={font.id}
                          value={font.cssStack}
                          style={{ fontFamily: font.cssStack }}
                        >
                          {(font.name || font.family || "").replace(/\s*\([^)]*\)/g, "").trim()}
                        </option>
                      ))}
                      <option value="__ADD_CUSTOM_FONT__" className="text-indigo-600 font-semibold bg-indigo-50">
                        + เพิ่มฟอนต์ Google Fonts...
                      </option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-gray-500 mb-1 block">ขนาด</label>
                      <input
                        type="number"
                        min="8"
                        max="120"
                        value={propsState.fontSize}
                        onChange={(e) => applyProperty("fontSize", Number(e.target.value))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-gray-800 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-gray-500 mb-1 block">สีตัวอักษร</label>
                      <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg p-1">
                        <input
                          type="color"
                          value={typeof propsState.fill === "string" && /^#[0-9A-Fa-f]{6}$/.test(propsState.fill) ? propsState.fill : "#111827"}
                          onChange={(e) => applyProperty("fill", e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <span className="font-mono text-[11px] text-gray-600 uppercase truncate">
                          {typeof propsState.fill === "string" ? propsState.fill : "สีพิเศษ"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 🎨 Dynamic Document Colors Palette for Text */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-700 font-bold flex items-center gap-1">
                        <Palette className="w-3 h-3 text-indigo-600" />
                        <span>สีในเอกสารนี้ (Document Colors)</span>
                      </span>
                      <span className="text-[9px] text-gray-400 font-medium">สีที่ใช้จริงบนหน้า</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap bg-gray-50/70 p-1.5 rounded-lg border border-gray-200/60">
                      {documentColors.map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => applyProperty("fill", col)}
                          className={`w-5 h-5 rounded-full border border-gray-300 shadow-2xs hover:scale-115 transition-transform cursor-pointer ${
                            typeof propsState.fill === "string" && propsState.fill.toLowerCase() === col.toLowerCase() ? "ring-2 ring-indigo-600 ring-offset-1 scale-110" : ""
                          }`}
                          style={{ backgroundColor: col }}
                          title={`ใช้สี ${col}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* ⚖️ Font Weight Selector */}
                  {(() => {
                    const currentAvailableWeights = getAvailableWeights(propsState.fontFamily, allFonts);
                    return (
                      <div className="space-y-1.5 p-2 bg-gray-50/80 rounded-lg border border-gray-200/70">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-gray-700 block">
                            น้ำหนักตัวอักษร (Weight)
                          </label>
                          <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                            {propsState.fontWeight}
                          </span>
                        </div>
                        <select
                          value={propsState.fontWeight}
                          onChange={(e) => applyProperty("fontWeight", Number(e.target.value))}
                          className="w-full bg-white border border-gray-200 rounded-md px-2 py-1.5 text-xs font-semibold text-gray-800 outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
                        >
                          {currentAvailableWeights.map((w) => (
                            <option key={w} value={w}>
                              {FONT_WEIGHT_LABELS[w] || `${w}`}
                            </option>
                          ))}
                        </select>
                        {preset.id?.includes("slide") && (
                          <p className="text-[9.5px] text-gray-400 italic">
                            * PowerPoint แสดงผล: &lt;600 = ปกติ, &ge;600 = ตัวหนา
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-1">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => {
                          const currentAvailableWeights = getAvailableWeights(propsState.fontFamily, allFonts);
                          const isCurrentlyBold = Number(propsState.fontWeight) >= 600;
                          const targetWeight = isCurrentlyBold
                            ? (currentAvailableWeights.includes(400) ? 400 : currentAvailableWeights[0])
                            : (currentAvailableWeights.includes(700) ? 700 : currentAvailableWeights[currentAvailableWeights.length - 1]);
                          applyProperty("fontWeight", targetWeight);
                        }}
                        className={`p-1.5 rounded cursor-pointer transition-colors ${
                          Number(propsState.fontWeight) >= 600 ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-200"
                        }`}
                        title={Number(propsState.fontWeight) >= 600 ? "เปลี่ยนเป็นตัวปกติ (Normal)" : "เปลี่ยนเป็นตัวหนา (Bold)"}
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => applyProperty("fontStyle", propsState.fontStyle === "italic" ? "normal" : "italic")}
                        className={`p-1.5 rounded cursor-pointer ${
                          propsState.fontStyle === "italic" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-200"
                        }`}
                        title="ตัวเอียง (Italic)"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => applyProperty("underline", !propsState.underline)}
                        className={`p-1.5 rounded cursor-pointer ${
                          propsState.underline ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-200"
                        }`}
                        title="ขีดเส้นใต้ (Underline)"
                      >
                        <Underline className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="h-4 w-px bg-gray-300" />

                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => applyProperty("textAlign", "left")}
                        className={`p-1.5 rounded cursor-pointer ${
                          propsState.textAlign === "left" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-200"
                        }`}
                        title="ชิดซ้าย"
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => applyProperty("textAlign", "center")}
                        className={`p-1.5 rounded cursor-pointer ${
                          propsState.textAlign === "center" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-200"
                        }`}
                        title="กึ่งกลาง"
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => applyProperty("textAlign", "right")}
                        className={`p-1.5 rounded cursor-pointer ${
                          propsState.textAlign === "right" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-200"
                        }`}
                        title="ชิดขวา"
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 🔠 Text Case & Bullet List Tools */}
                  <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-1">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleTextTransform("uppercase")}
                        className="px-2 py-1 text-[11px] font-bold text-gray-700 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                        title="แปลงเป็นตัวพิมพ์ใหญ่ทั้งหมด (UPPERCASE)"
                      >
                        AA
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTextTransform("lowercase")}
                        className="px-2 py-1 text-[11px] font-bold text-gray-700 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                        title="แปลงเป็นตัวพิมพ์เล็กทั้งหมด (lowercase)"
                      >
                        aa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTextTransform("capitalize")}
                        className="px-2 py-1 text-[11px] font-bold text-gray-700 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                        title="ตัวแรกของคำพิมพ์ใหญ่ (Title Case)"
                      >
                        Aa
                      </button>
                    </div>

                    <div className="h-4 w-px bg-gray-300" />

                    <button
                      type="button"
                      onClick={handleToggleBulletList}
                      className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                      title="เพิ่ม/ลบ สัญลักษณ์จุดหัวข้อ (Bullet Points)"
                    >
                      <List className="w-3.5 h-3.5 text-indigo-600" />
                      <span>จุดหัวข้อ (•)</span>
                    </button>
                  </div>

                  {/* 📏 Line Height & Letter Spacing */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-gray-50/80 rounded-xl border border-gray-200/70">
                    <div>
                      <div className="flex justify-between items-center text-[11px] text-gray-600 mb-1">
                        <span>ระยะบรรทัด</span>
                        <input
                          type="number"
                          min="0.5"
                          max="3"
                          step="0.05"
                          value={propsState.lineHeight || 1.2}
                          onChange={(e) => applyProperty("lineHeight", Number(e.target.value))}
                          className="w-12 text-right font-mono font-bold text-indigo-600 bg-white border border-gray-200 rounded px-1 py-0.5 text-[10px] outline-none focus:border-indigo-500"
                        />
                      </div>
                      <input
                        type="range"
                        min="0.8"
                        max="2.5"
                        step="0.05"
                        value={propsState.lineHeight || 1.2}
                        onChange={(e) => applyProperty("lineHeight", Number(e.target.value))}
                        className="w-full accent-indigo-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center text-[11px] text-gray-600 mb-1">
                        <span>ระยะตัวอักษร</span>
                        <input
                          type="number"
                          min="-50"
                          max="200"
                          step="5"
                          value={propsState.charSpacing || 0}
                          onChange={(e) => applyProperty("charSpacing", Number(e.target.value))}
                          className="w-12 text-right font-mono font-bold text-indigo-600 bg-white border border-gray-200 rounded px-1 py-0.5 text-[10px] outline-none focus:border-indigo-500"
                        />
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="200"
                        step="10"
                        value={propsState.charSpacing || 0}
                        onChange={(e) => applyProperty("charSpacing", Number(e.target.value))}
                        className="w-full accent-indigo-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* 🖋️ Text Stroke Controls */}
                  <div className="p-2.5 bg-gray-50/90 rounded-xl border border-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                        <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                        <span>เส้นขอบตัวอักษร (Text Stroke)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => applyTextStroke(!propsState.textStrokeEnabled)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                          propsState.textStrokeEnabled
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                      >
                        {propsState.textStrokeEnabled ? "เปิดใช้งาน" : "ปิด"}
                      </button>
                    </div>

                    {propsState.textStrokeEnabled && (
                      <div className="space-y-2 pt-1 border-t border-gray-200/60">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-gray-500 mb-0.5 block">สีขอบตัวอักษร</label>
                            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg p-1 shadow-2xs">
                              <input
                                type="color"
                                value={typeof propsState.textStroke === "string" && /^#[0-9A-Fa-f]{6}$/.test(propsState.textStroke) ? propsState.textStroke : "#000000"}
                                onChange={(e) => applyTextStroke(true, e.target.value, propsState.textStrokeWidth)}
                                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                              />
                              <span className="font-mono text-[10px] text-gray-600 uppercase truncate">
                                {typeof propsState.textStroke === "string" ? propsState.textStroke : ""}
                              </span>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between items-center text-[10px] text-gray-500 mb-0.5">
                              <span>ความหนาขอบ</span>
                              <div className="flex items-center bg-white border border-gray-200 rounded px-1 py-0.2 focus-within:border-indigo-500">
                                <input
                                  type="number"
                                  min="0.5"
                                  max="20"
                                  step="0.5"
                                  value={propsState.textStrokeWidth}
                                  onChange={(e) => applyTextStroke(true, propsState.textStroke, Number(e.target.value))}
                                  className="w-8 text-right font-mono text-[10px] font-bold text-indigo-600 outline-none bg-transparent"
                                />
                                <span className="text-[9px] text-gray-400 font-mono ml-0.5 select-none">px</span>
                              </div>
                            </div>
                            <input
                              type="range"
                              min="0.5"
                              max="10"
                              step="0.5"
                              value={propsState.textStrokeWidth}
                              onChange={(e) => applyTextStroke(true, propsState.textStroke, Number(e.target.value))}
                              className="w-full accent-indigo-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Quick Stroke Color Presets */}
                        {/* Dynamic Document Colors for Stroke */}
                        <div className="flex items-center gap-1 pt-1 flex-wrap">
                          <span className="text-[10px] text-gray-500 font-semibold mr-0.5">สีในเอกสาร:</span>
                          {documentColors.slice(0, 8).map((col) => (
                            <button
                              key={col}
                              type="button"
                              onClick={() => applyTextStroke(true, col, propsState.textStrokeWidth || 1.5)}
                              className={`w-5 h-5 rounded-full border transition-transform hover:scale-110 cursor-pointer ${
                                typeof propsState.textStroke === "string" && propsState.textStroke.toLowerCase() === col.toLowerCase() ? "ring-2 ring-indigo-500" : "border-gray-300"
                              }`}
                              style={{ backgroundColor: col }}
                              title={`ขอบสี ${col}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 🌌 Text Shadow Controls */}
                  <div className="p-2.5 bg-gray-50/90 rounded-xl border border-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>เงาข้อความ (Text Shadow)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleShadowChange({ shadowEnabled: !propsState.shadowEnabled })}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                          propsState.shadowEnabled
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                      >
                        {propsState.shadowEnabled ? "เปิดใช้งาน" : "ปิด"}
                      </button>
                    </div>

                    {propsState.shadowEnabled && (
                      <div className="space-y-2 pt-1 border-t border-gray-200/60">
                        {/* Quick Shadow Presets for Text */}
                        <div className="grid grid-cols-4 gap-1">
                          {[
                            { label: "นุ่มนวล", blur: 8, x: 0, y: 3, color: "rgba(0, 0, 0, 0.25)" },
                            { label: "คมชัด", blur: 2, x: 2, y: 2, color: "rgba(0, 0, 0, 0.5)" },
                            { label: "3D แดง", blur: 4, x: 0, y: 3, color: "rgba(185, 28, 28, 0.6)" },
                            { label: "เรืองแสง", blur: 12, x: 0, y: 0, color: "rgba(255, 255, 255, 0.8)" },
                          ].map((sp) => (
                            <button
                              key={sp.label}
                              type="button"
                              onClick={() =>
                                handleShadowChange({
                                  shadowEnabled: true,
                                  shadowBlur: sp.blur,
                                  shadowOffsetX: sp.x,
                                  shadowOffsetY: sp.y,
                                  shadowColor: sp.color,
                                })
                              }
                              className="py-1 text-[10px] rounded bg-white hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 text-gray-700 font-medium transition-colors cursor-pointer"
                            >
                              {sp.label}
                            </button>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                              <span>ความฟุ้ง</span>
                              <span className="font-mono font-bold text-indigo-600">{propsState.shadowBlur}px</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="30"
                              value={propsState.shadowBlur}
                              onChange={(e) => handleShadowChange({ shadowBlur: Number(e.target.value) })}
                              className="w-full accent-indigo-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-gray-500 mb-0.5 block">สีเงา</label>
                            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg p-1 shadow-2xs">
                              <input
                                type="color"
                                value={propsState.shadowColor?.startsWith("#") ? propsState.shadowColor : "#000000"}
                                onChange={(e) => handleShadowChange({ shadowColor: e.target.value })}
                                className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                              />
                              <span className="font-mono text-[9.5px] text-gray-600 truncate">
                                {typeof propsState.shadowColor === "string" ? propsState.shadowColor : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* การตัดคำและขึ้นบรรทัดใหม่ (Text Wrapping) */}
                  <div className="pt-2 border-t border-gray-200/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-gray-700 block">ตัดบรรทัดภาษาไทยอัตโนมัติ</span>
                        <span className="text-[10px] text-gray-400 block">ตัดตามตัวอักษรเพื่อไม่ให้กล่องติดคำยาว</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => applyProperty("splitByGrapheme", !propsState.splitByGrapheme)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                          propsState.splitByGrapheme
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                      >
                        {propsState.splitByGrapheme ? "เปิดใช้งาน" : "ปิด"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isShape && (
                <div className="space-y-3.5">
                  {isIcon && (
                    <div className="p-2.5 bg-indigo-50/80 rounded-xl border border-indigo-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-indigo-950 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span>สีไอคอนเวกเตอร์ (Vector Color)</span>
                        </span>
                        <span className="font-mono text-[10px] font-bold text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200 uppercase">
                          {typeof propsState.fill === "string" ? propsState.fill : "Gradient"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {documentColors.slice(0, 10).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              applyProperty("fill", c);
                              handleUpdateStop(0, "color", c);
                            }}
                            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${
                              typeof propsState.fill === "string" && propsState.fill.toLowerCase() === c.toLowerCase() ? "border-indigo-600 scale-110 shadow-xs" : "border-gray-200"
                            }`}
                            style={{ backgroundColor: c }}
                            title={`ใช้สี ${c}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <h3 className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                    สีพื้นหลังและเส้นขอบ
                  </h3>

                  {/* 🎨 Fill Type Picker (Solid / Linear / Radial) */}
                  <div className="space-y-2 p-2.5 bg-gray-50/90 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-indigo-600" />
                        <span>รูปแบบสีพื้น (Fill)</span>
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 uppercase">
                        {fillType}
                      </span>
                    </div>

                    {/* Mode Tabs */}
                    <div className="grid grid-cols-3 gap-1 p-0.5 bg-gray-200/70 rounded-lg text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => handleFillTypeChange("solid")}
                        className={`py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                          fillType === "solid"
                            ? "bg-white text-indigo-600 shadow-xs font-bold"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        สีเดี่ยว
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFillTypeChange("linear")}
                        className={`py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                          fillType === "linear"
                            ? "bg-white text-indigo-600 shadow-xs font-bold"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        ไล่สีเส้นตรง
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFillTypeChange("radial")}
                        className={`py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                          fillType === "radial"
                            ? "bg-white text-indigo-600 shadow-xs font-bold"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        ไล่สีวงกลม
                      </button>
                    </div>

                    {/* SOLID FILL */}
                    {fillType === "solid" && (
                      <div className="pt-0.5 space-y-2">
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1.5 shadow-2xs">
                          <input
                            type="color"
                            value={typeof propsState.fill === "string" && /^#[0-9A-Fa-f]{6}$/.test(propsState.fill) ? propsState.fill : "#4F46E5"}
                            onChange={(e) => {
                              applyProperty("fill", e.target.value);
                              handleUpdateStop(0, "color", e.target.value);
                            }}
                            className="w-7 h-7 rounded-md cursor-pointer border-0 bg-transparent"
                          />
                          <input
                            type="text"
                            value={typeof propsState.fill === "string" ? propsState.fill : ""}
                            onChange={(e) => {
                              applyProperty("fill", e.target.value);
                              handleUpdateStop(0, "color", e.target.value);
                            }}
                            className="font-mono text-xs text-gray-800 uppercase font-semibold outline-none flex-1"
                          />
                        </div>

                        {/* Document Colors for Shape Solid Fill */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span className="text-[10px] text-gray-500 font-semibold mr-0.5">สีในเอกสาร:</span>
                          {documentColors.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                applyProperty("fill", c);
                                handleUpdateStop(0, "color", c);
                              }}
                              className={`w-5 h-5 rounded-full border transition-transform hover:scale-110 cursor-pointer ${
                                typeof propsState.fill === "string" && propsState.fill.toLowerCase() === c.toLowerCase() ? "ring-2 ring-indigo-600 ring-offset-1 scale-110" : "border-gray-300"
                              }`}
                              style={{ backgroundColor: c }}
                              title={`ใช้สี ${c}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* GRADIENT FILL (Linear / Radial) */}
                    {fillType !== "solid" && (
                      <div className="space-y-2 pt-0.5">
                        {/* Live Preview Bar */}
                        <div
                          className="w-full h-7 rounded-lg border border-gray-300/80 shadow-inner"
                          style={{
                            background:
                              fillType === "radial"
                                ? `radial-gradient(circle, ${[...colorStops]
                                    .sort((a, b) => a.offset - b.offset)
                                    .map((s) => `${s.color} ${Math.round(s.offset * 100)}%`)
                                    .join(", ")})`
                                : `linear-gradient(${gradientAngle}deg, ${[...colorStops]
                                    .sort((a, b) => a.offset - b.offset)
                                    .map((s) => `${s.color} ${Math.round(s.offset * 100)}%`)
                                    .join(", ")})`,
                          }}
                        />

                        {/* Angle Controls for Linear Gradient */}
                        {fillType === "linear" && (
                          <div className="space-y-1.5 p-2 bg-white rounded-lg border border-gray-200/80 shadow-2xs">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-gray-600 font-medium flex items-center gap-1">
                                <RotateCw className="w-3 h-3 text-gray-500" />
                                <span>มุมองศา (Angle)</span>
                              </span>
                              <div className="flex items-center gap-0.5">
                                <input
                                  type="number"
                                  min="0"
                                  max="360"
                                  value={gradientAngle}
                                  onChange={(e) => handleAngleChange(e.target.value)}
                                  className="w-12 text-center font-mono text-xs font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded px-1 py-0.5 outline-none"
                                />
                                <span className="text-gray-400 text-xs">°</span>
                              </div>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="360"
                              value={gradientAngle}
                              onChange={(e) => handleAngleChange(e.target.value)}
                              className="w-full accent-indigo-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                            />
                            <div className="grid grid-cols-4 gap-1 pt-0.5">
                              {[
                                { label: "0° บน", deg: 0 },
                                { label: "90° ขวา", deg: 90 },
                                { label: "180° ล่าง", deg: 180 },
                                { label: "45° ทแยง", deg: 45 },
                              ].map((presetAngle) => (
                                <button
                                  key={presetAngle.deg}
                                  type="button"
                                  onClick={() => handleAngleChange(presetAngle.deg)}
                                  className={`py-0.5 text-[10px] rounded border transition-colors cursor-pointer ${
                                    gradientAngle === presetAngle.deg
                                      ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-bold"
                                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                                  }`}
                                >
                                  {presetAngle.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Color Stops List */}
                        <div className="space-y-1.5 p-2 bg-white rounded-lg border border-gray-200/80 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-gray-700">
                              จุดสี (Color Stops: {colorStops.length})
                            </span>
                            <button
                              type="button"
                              onClick={handleAddStop}
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> เพิ่มจุดสี
                            </button>
                          </div>

                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                            {colorStops.map((stop, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-1.5 p-1 bg-gray-50 rounded-md border border-gray-200/60 text-xs"
                              >
                                <input
                                  type="color"
                                  value={typeof stop.color === "string" && /^#[0-9A-Fa-f]{6}$/.test(stop.color) ? stop.color : "#4F46E5"}
                                  onChange={(e) => handleUpdateStop(idx, "color", e.target.value)}
                                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent shrink-0"
                                />
                                <span className="font-mono text-[10px] text-gray-600 uppercase w-14 truncate shrink-0">
                                  {typeof stop.color === "string" ? stop.color : ""}
                                </span>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.01"
                                  value={stop.offset}
                                  onChange={(e) => handleUpdateStop(idx, "offset", Number(e.target.value))}
                                  className="flex-1 accent-indigo-600 h-1 bg-gray-200 rounded cursor-pointer min-w-10"
                                />
                                <span className="font-mono text-[10px] text-gray-500 w-7 text-right shrink-0">
                                  {Math.round(stop.offset * 100)}%
                                </span>
                                {colorStops.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveStop(idx)}
                                    className="p-0.5 text-gray-400 hover:text-red-600 rounded transition-colors cursor-pointer shrink-0"
                                    title="ลบจุดสี"
                                  >
                                    <XIcon className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">

                    <div className="col-span-2">
                      <label className="text-[11px] text-gray-500 mb-1 block">สีเส้นขอบ (Stroke)</label>
                      <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg p-1">
                        <input
                          type="color"
                          value={typeof propsState.stroke === "string" && /^#[0-9A-Fa-f]{6}$/.test(propsState.stroke) ? propsState.stroke : "#000000"}
                          onChange={(e) => applyProperty("stroke", e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <span className="font-mono text-[11px] text-gray-600 uppercase truncate">
                          {typeof propsState.stroke === "string" ? propsState.stroke : ""}
                        </span>
                      </div>
                      {/* Document Colors for Stroke */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                        <span className="text-[10px] text-gray-400 font-medium mr-0.5">สีในเอกสาร:</span>
                        {documentColors.slice(0, 8).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => applyProperty("stroke", c)}
                            className={`w-4.5 h-4.5 rounded-full border transition-transform hover:scale-110 cursor-pointer ${
                              typeof propsState.stroke === "string" && propsState.stroke.toLowerCase() === c.toLowerCase() ? "ring-2 ring-indigo-600 ring-offset-1 scale-110" : "border-gray-300"
                            }`}
                            style={{ backgroundColor: c }}
                            title={`ขอบสี ${c}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-gray-500 mb-1 block">ความหนาขอบ (px)</label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={propsState.strokeWidth}
                        onChange={(e) => applyProperty("strokeWidth", Number(e.target.value))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-gray-800 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-gray-500 mb-1 block">สไตล์เส้น (Stroke Style)</label>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: "solid", label: "ทึบ" },
                          { id: "dashed", label: "ประ" },
                          { id: "dotted", label: "จุด" },
                        ].map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => handleStrokeStyleChange(st.id)}
                            className={`py-1 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                              propsState.strokeStyle === st.id
                                ? "bg-indigo-600 text-white font-bold"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {activeObject.type === "rect" && (
                      <div className="col-span-2">
                        <label className="text-[11px] text-gray-500 mb-1 block">ความโค้งมน (Radius)</label>
                        <input
                          type="number"
                          min="0"
                          max="60"
                          value={propsState.rx}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            activeObject.set("ry", val);
                            applyProperty("rx", val);
                          }}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-gray-800 outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* ── DROP SHADOW CONTROLS ── */}
                  <div className="space-y-2.5 pt-3 border-t border-gray-200/80">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-700 uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        <span>เงาตกกระทบ (Drop Shadow)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleShadowChange({ shadowEnabled: !propsState.shadowEnabled })}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                          propsState.shadowEnabled
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                      >
                        {propsState.shadowEnabled ? "เปิดใช้งาน" : "ปิด"}
                      </button>
                    </div>

                    {propsState.shadowEnabled && (
                      <div className="space-y-2.5 p-2.5 bg-gray-50/90 rounded-xl border border-gray-200">
                        {/* Quick Presets */}
                        <div>
                          <label className="text-[10px] text-gray-500 mb-1 block">พรีเซ็ตเงาด่วน</label>
                          <div className="grid grid-cols-4 gap-1">
                            {[
                              { label: "นุ่มนวล", blur: 16, x: 0, y: 8, color: "rgba(0, 0, 0, 0.08)" },
                              { label: "ลอยเด่น", blur: 24, x: 0, y: 12, color: "rgba(0, 0, 0, 0.16)" },
                              { label: "คมชัด", blur: 4, x: 4, y: 4, color: "rgba(0, 0, 0, 0.25)" },
                              { label: "ประกายแดง", blur: 14, x: 0, y: 4, color: "rgba(220, 38, 38, 0.35)" },
                            ].map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() =>
                                  handleShadowChange({
                                    shadowEnabled: true,
                                    shadowBlur: preset.blur,
                                    shadowOffsetX: preset.x,
                                    shadowOffsetY: preset.y,
                                    shadowColor: preset.color,
                                  })
                                }
                                className="py-1 text-[10px] rounded bg-white hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 text-gray-700 font-medium transition-colors cursor-pointer"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Blur & Color */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                              <span>ความฟุ้ง (Blur)</span>
                              <span className="font-mono font-bold">{propsState.shadowBlur}px</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="50"
                              value={propsState.shadowBlur}
                              onChange={(e) => handleShadowChange({ shadowBlur: Number(e.target.value) })}
                              className="w-full accent-indigo-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-gray-500 mb-0.5 block">สีเงา</label>
                            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg p-1 shadow-2xs">
                              <input
                                type="color"
                                value={typeof propsState.shadowColor === "string" && /^#[0-9A-Fa-f]{6}$/.test(propsState.shadowColor) ? propsState.shadowColor : "#000000"}
                                onChange={(e) => handleShadowChange({ shadowColor: e.target.value })}
                                className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                              />
                              <span className="font-mono text-[9.5px] text-gray-600 truncate">
                                {typeof propsState.shadowColor === "string" ? propsState.shadowColor : ""}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Offset X & Y */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                              <span>ระยะ X</span>
                              <span className="font-mono font-bold">{propsState.shadowOffsetX}px</span>
                            </div>
                            <input
                              type="range"
                              min="-30"
                              max="30"
                              value={propsState.shadowOffsetX}
                              onChange={(e) => handleShadowChange({ shadowOffsetX: Number(e.target.value) })}
                              className="w-full accent-indigo-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                              <span>ระยะ Y</span>
                              <span className="font-mono font-bold">{propsState.shadowOffsetY}px</span>
                            </div>
                            <input
                              type="range"
                              min="-30"
                              max="30"
                              value={propsState.shadowOffsetY}
                              onChange={(e) => handleShadowChange({ shadowOffsetY: Number(e.target.value) })}
                              className="w-full accent-indigo-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h3 className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">ตำแหน่งและขนาด</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-gray-500 mb-1 block">พิกัด X (ซ้าย - px)</label>
                    <input
                      type="number"
                      value={propsState.left}
                      onChange={(e) => applyProperty("left", Number(e.target.value))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-gray-800 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 mb-1 block">พิกัด Y (บน - px)</label>
                    <input
                      type="number"
                      value={propsState.top}
                      onChange={(e) => applyProperty("top", Number(e.target.value))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-gray-800 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* 📏 Width (W) & Height (H) */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] text-gray-500 block">ความกว้าง W (px)</label>
                      {isText && (
                        <span className="text-[9px] text-indigo-600 font-semibold bg-indigo-50 px-1 rounded">กล่องตัดคำ</span>
                      )}
                    </div>
                    <input
                      type="number"
                      min="10"
                      value={propsState.width}
                      onChange={(e) => applyProperty("width", Number(e.target.value))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-gray-800 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] text-gray-500 block">ความสูง H (px)</label>
                      {isText && (
                        <span className="text-[9px] text-gray-400 font-semibold">อัตโนมัติ</span>
                      )}
                    </div>
                    <input
                      type="number"
                      min="10"
                      value={propsState.height}
                      onChange={(e) => applyProperty("height", Number(e.target.value))}
                      disabled={isText}
                      className={`w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-gray-800 outline-none focus:border-indigo-500 ${
                        isText ? "opacity-60 cursor-not-allowed bg-gray-100" : ""
                      }`}
                      title={isText ? "ความสูงของกล่องข้อความจะคำนวณอัตโนมัติตามจำนวนบรรทัดของข้อความ" : ""}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[11px] text-gray-500 mb-1">
                    <span>ความโปร่งใส (Opacity)</span>
                    <div className="flex items-center bg-gray-50 hover:bg-white focus-within:bg-white border border-gray-200 focus-within:border-indigo-500 rounded px-1.5 py-0.5 shadow-2xs transition-all">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={Math.round((propsState.opacity ?? 1) * 100)}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "") {
                            applyProperty("opacity", 1);
                            return;
                          }
                          const val = Number(raw);
                          if (!isNaN(val)) {
                            const clamped = Math.max(0, Math.min(100, Math.round(val)));
                            applyProperty("opacity", clamped / 100);
                          }
                        }}
                        className="w-8 text-right font-mono text-[11px] font-bold text-gray-800 outline-none bg-transparent"
                      />
                      <span className="text-[10px] text-gray-400 font-mono select-none ml-0.5 font-bold">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={propsState.opacity}
                    onChange={(e) => applyProperty("opacity", Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* 🔄 Rotation & Flip Controls */}
                <div className="space-y-2 pt-1 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-gray-500 block">การหมุน (องศา)</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleRotateStep(-90)}
                        className="p-1 rounded bg-gray-50 hover:bg-gray-200 border border-gray-200 text-gray-600 cursor-pointer transition-colors"
                        title="หมุนทวนเข็ม -90°"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRotateStep(90)}
                        className="p-1 rounded bg-gray-50 hover:bg-gray-200 border border-gray-200 text-gray-600 cursor-pointer transition-colors"
                        title="หมุนตามเข็ม +90°"
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={propsState.angle}
                      onChange={(e) => applyProperty("angle", Number(e.target.value))}
                      className="flex-1 accent-indigo-600 cursor-pointer"
                    />
                    <div className="flex items-center bg-gray-50 hover:bg-white focus-within:bg-white border border-gray-200 focus-within:border-indigo-500 rounded-lg px-2 py-1 w-20 shadow-2xs transition-all">
                      <input
                        type="number"
                        min="0"
                        max="360"
                        value={propsState.angle ?? 0}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "") {
                            applyProperty("angle", 0);
                            return;
                          }
                          const val = Number(raw);
                          if (!isNaN(val)) {
                            const clamped = Math.max(0, Math.min(360, Math.round(val)));
                            applyProperty("angle", clamped);
                          }
                        }}
                        className="w-full text-right font-mono text-xs font-bold text-gray-700 outline-none bg-transparent"
                      />
                      <span className="text-xs text-gray-400 font-mono ml-0.5 select-none font-bold">°</span>
                    </div>
                  </div>

                  {/* Flip Horizontal / Vertical */}
                  <div>
                    <label className="text-[11px] text-gray-500 mb-1 block">กลับด้าน (Flip)</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleFlip("x")}
                        className="flex items-center justify-center gap-1 py-1.5 px-2 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 rounded text-[10px] font-medium transition-colors cursor-pointer"
                        title="กลับด้านแนวนอน (Flip Horizontal)"
                      >
                        <FlipHorizontal className="w-3.5 h-3.5" />
                        <span>กลับแนวนอน</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFlip("y")}
                        className="flex items-center justify-center gap-1 py-1.5 px-2 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 rounded text-[10px] font-medium transition-colors cursor-pointer"
                        title="กลับด้านแนวตั้ง (Flip Vertical)"
                      >
                        <FlipVertical className="w-3.5 h-3.5" />
                        <span>กลับแนวตั้ง</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-gray-500 mb-1.5 block">จัดตำแหน่งบนหน้ากระดาษ A4</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => handleAlign("left")}
                      className="py-1.5 px-2 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 rounded text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      ชิดซ้าย
                    </button>
                    <button
                      onClick={() => handleAlign("center")}
                      className="py-1.5 px-2 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 rounded text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      กึ่งกลางแนวนอน
                    </button>
                    <button
                      onClick={() => handleAlign("right")}
                      className="py-1.5 px-2 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 rounded text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      ชิดขวา
                    </button>
                    <button
                      onClick={() => handleAlign("top")}
                      className="py-1.5 px-2 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 rounded text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      ชิดบน
                    </button>
                    <button
                      onClick={() => handleAlign("middle")}
                      className="py-1.5 px-2 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 rounded text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      กึ่งกลางแนวตั้ง
                    </button>
                    <button
                      onClick={() => handleAlign("bottom")}
                      className="py-1.5 px-2 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 rounded text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      ชิดล่าง
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-[11px] text-gray-500 mb-1.5 block">ลำดับชั้น (Layer Stacking)</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleBringForward()}
                      className="flex items-center justify-center gap-1 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-[11px] font-medium cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                      <span>ขยับขึ้น 1 ชั้น</span>
                    </button>
                    <button
                      onClick={() => handleSendBackward()}
                      className="flex items-center justify-center gap-1 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-[11px] font-medium cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                      <span>ขยับลง 1 ชั้น</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "layers" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 text-xs">
          {layersList.length === 0 ? (
            <div className="text-center py-10 text-gray-400">ไม่มีวัตถุบนหน้ากระดาษ</div>
          ) : (
            layersList.map((obj, idx) => {
              const isSelected = activeObject === obj;
              const isObjTable = obj.isDocTable || obj.type === "DocTable" || obj.type === "docTable";
              const isObjText = obj.type === "textbox" || obj.type === "i-text" || obj.type === "text";
              const isObjShape = obj.type === "rect" || obj.type === "circle" || obj.type === "line";
              const label = isObjTable
                ? `ตารางใบเสนอราคา (${obj.docTableData?.items?.length || 0} แถว)`
                : isObjText
                ? obj.text || "กล่องข้อความ"
                : isObjShape
                ? `รูปทรง (${obj.type})`
                : "กลุ่มวัตถุ / รูปภาพ";

              return (
                <div
                  key={idx}
                  onClick={() => {
                    canvas.setActiveObject(obj);
                    canvas.requestRenderAll();
                  }}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50/80 border-indigo-300 text-indigo-900 font-semibold shadow-xs"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1 mr-2">
                    <span className="text-[10px] font-mono text-gray-400">#{layersList.length - idx}</span>
                    <span className="truncate text-xs">{label}</span>
                  </div>

                  <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleBringForward(obj)}
                      className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-200"
                      title="เลื่อนขึ้น"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleSendBackward(obj)}
                      className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-200"
                      title="เลื่อนลง"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleToggleLock(obj)}
                      className={`p-1 rounded ${
                        obj.lockMovementX ? "text-amber-600 bg-amber-50" : "text-gray-400 hover:text-gray-700 hover:bg-gray-200"
                      }`}
                      title={obj.lockMovementX ? "ปลดล็อก" : "ล็อก"}
                    >
                      {obj.lockMovementX ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => handleToggleVisibility(obj)}
                      className={`p-1 rounded ${
                        obj.visible === false ? "text-gray-300" : "text-gray-500 hover:text-gray-800 hover:bg-gray-200"
                      }`}
                      title={obj.visible === false ? "แสดง" : "ซ่อน"}
                    >
                      {obj.visible === false ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 🔤 Google Fonts Picker & Live Preview Modal */}
      <GoogleFontPickerModal
        isOpen={isFontPickerOpen}
        onClose={() => setIsFontPickerOpen(false)}
        onFontSelect={handleFontFromPicker}
        installedFonts={allFonts}
      />
    </aside>
  );
}