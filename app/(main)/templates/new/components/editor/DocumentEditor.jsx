"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import * as fabric from "fabric";
import TopToolbar from "./TopToolbar";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import { ChevronUp, ChevronDown, Copy, Trash2, Plus, Minus } from "lucide-react";
import { useHistory } from "./hooks/useHistory";
import { A4_WIDTH, MARGIN_PX } from "./CanvasStage";
import { createDocTable, CUSTOM_CANVAS_PROPS } from "./elements/DocTable";
import { cloneFabricObject, saveToCrossTemplateStorage, loadFromCrossTemplateStorage } from "./utils/clipboard";
import { createSignatureBlock } from "./elements/SignatureBlock";
import { createCompanyHeaderBlock, createPartyInfoGrid, createTermsBox } from "./elements/HeaderBlock";
import { applyTokensToCanvas, revertTokensInPageJson, initLiveTokens } from "@/lib/tokens/tokenEngine";
import { getCanvasPreset, mmToPx, pxToMm } from "@/lib/editor/canvasPresets";
import TemplateShareModal from "@/components/templates/TemplateShareModal";

// Dynamically import CanvasStage with SSR disabled
const CanvasStage = dynamic(() => import("./CanvasStage"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[800px]">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-gray-500">กำลังโหลด Studio Engine...</p>
      </div>
    </div>
  ),
});

// Dynamically import StaticPagePreview with SSR disabled
const StaticPagePreview = dynamic(() => import("./StaticPagePreview"), {
  ssr: false,
});

/**
 * Automatically updates or adds the dynamic Page Number indicator at the bottom right of the page/slide
 */
function syncPageNumberOnCanvas(canvas, pageIdx, totalPages, editorType = "document", preset = null, showPageNumber = true) {
  if (!canvas) return;
  const p = preset || { width: 794, height: 1123, marginPx: 56 };
  const objs = canvas.getObjects();
  const pageNumObjs = objs.filter((o) =>
    o.isPageFooterNumber ||
    o.name === "pageFooterNumber" ||
    (o.text && typeof o.text === "string" && (/^page \d+ of \d+$/i.test(o.text.trim()) || /^หน้า \d+ (จาก|\/) \d+$/i.test(o.text.trim())))
  );

  // 🛡️ When page numbers are toggled OFF, remove all page number objects from canvas
  if (!showPageNumber) {
    if (pageNumObjs.length > 0) {
      pageNumObjs.forEach((o) => canvas.remove(o));
      canvas.requestRenderAll();
    }
    return;
  }

  const isSlide = editorType === "slide";
  const textVal = isSlide ? `สไลด์ ${pageIdx + 1} / ${totalPages}` : `หน้า ${pageIdx + 1} จาก ${totalPages}`;

  if (pageNumObjs.length > 0) {
    pageNumObjs[0].set({
      text: textVal,
      isPageFooterNumber: true,
      name: "pageFooterNumber",
    });
    for (let i = 1; i < pageNumObjs.length; i++) {
      canvas.remove(pageNumObjs[i]);
    }
  } else {
    const pageNumObj = new fabric.Textbox(textVal, {
      left: p.width - p.marginPx - 120,
      top: p.height - (isSlide ? 28 : 32),
      width: 120,
      fontSize: 10,
      fill: "#94A3B8",
      fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
      textAlign: "right",
      selectable: true,
      hasControls: false,
    });
    pageNumObj.isPageFooterNumber = true;
    pageNumObj.name = "pageFooterNumber";
    canvas.add(pageNumObj);
  }
  canvas.requestRenderAll();
}

/**
 * 🔤 Ensures all textboxes support Thai grapheme wrapping and vector-sharp text rendering
 * without blurry bitmap caching at any font size or canvas zoom level.
 */
function ensureThaiTextWrapping(canvas) {
  if (!canvas) return;
  canvas.getObjects().forEach((obj) => {
    if (obj.type === "textbox" || obj.isType?.("Textbox") || obj.type === "text" || obj.type === "i-text") {
      obj.set({
        splitByGrapheme: true,
        objectCaching: false,
        noScaleCache: false,
      });
      if (typeof obj.initDimensions === "function") obj.initDimensions();
    }
  });
}

/**
 * 🔒 Ensures unselectable and background objects do not intercept mouse events,
 * allowing full-canvas marquee selection box (rubber-band selection) and normal cursor behavior.
 */
function ensureUnselectableObjectsAreNotEvented(canvas) {
  if (!canvas) return;
  canvas.getObjects().forEach((obj) => {
    if (obj.selectable === false || obj.isBackground) {
      obj.evented = false;
    }
  });
}

export default function DocumentEditor({
  templateId = null,
  templateName = "เทมเพลตเอกสารใหม่ (A4)",
  categoryName = "Notification Letter",
  onSave,
  saving = false,
  initialPages = null,
  initialMarginMm = null,
  initialMarginPx = null,
  initialShowPageNumbers = null,
  editorType = "document",
  canvasPreset = null,
}) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const effectivePresetKey = canvasPreset || (editorType === "slide" ? "slide-16-9" : "a4-portrait");
  const preset = getCanvasPreset(effectivePresetKey);
  const isMetric = Boolean(preset.mmWidth);

  // 📐 Dynamic Margin State (mm for Docs, px for Slides)
  const [marginMm, setMarginMm] = useState(() => {
    if (initialMarginMm !== null && initialMarginMm !== undefined) {
      return Number(initialMarginMm);
    }
    return isMetric ? 15 : null;
  });

  const [marginPx, setMarginPx] = useState(() => {
    if (initialMarginPx !== null && initialMarginPx !== undefined) {
      return Number(initialMarginPx);
    }
    if (isMetric) {
      return mmToPx(initialMarginMm ?? 15);
    }
    return preset.marginPx || 40;
  });

  useEffect(() => {
    if (initialMarginMm !== null && initialMarginMm !== undefined) {
      setMarginMm(Number(initialMarginMm));
      setMarginPx(mmToPx(Number(initialMarginMm)));
    } else if (initialMarginPx !== null && initialMarginPx !== undefined) {
      setMarginPx(Number(initialMarginPx));
      if (isMetric) setMarginMm(pxToMm(Number(initialMarginPx)));
    }
  }, [initialMarginMm, initialMarginPx, isMetric]);

  useEffect(() => {
    initLiveTokens();
  }, []);

  const handleUpdateMargin = useCallback((value, unit = isMetric ? "mm" : "px") => {
    const num = Math.max(0, Number(value) || 0);
    if (unit === "mm") {
      setMarginMm(num);
      setMarginPx(mmToPx(num));
    } else {
      setMarginPx(num);
      if (isMetric) {
        setMarginMm(pxToMm(num));
      }
    }
    hasUnsavedChangesRef.current = true;
  }, [isMetric]);

  const mainContainerRef = useRef(null);
  const [currentTitle, setCurrentTitle] = useState(templateName);
  const [zoom, setZoom] = useState(preset.defaultZoom || (editorType === "slide" ? 0.65 : 0.85));
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpaceActive, setIsSpaceActive] = useState(false);
  const [isHandToolActive, setIsHandToolActive] = useState(false);

  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const isSpacePressedRef = useRef(false);
  const isHandToolActiveRef = useRef(false);
  const isDraggingPanRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    isHandToolActiveRef.current = isHandToolActive;
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      if (isHandToolActive || isSpaceActive) {
        canvas.defaultCursor = "grab";
        canvas.hoverCursor = "grab";
        canvas.selection = false;
      } else {
        canvas.defaultCursor = "default";
        canvas.hoverCursor = "default";
        canvas.selection = true;
      }
      canvas.requestRenderAll();
    }
  }, [isHandToolActive, isSpaceActive]);

  const [showRuler, setShowRuler] = useState(false);
  const [showMargin, setShowMargin] = useState(true);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const pageRefs = useRef({});
  const [activeObject, setActiveObject] = useState(null);
  const [canvasInstance, setCanvasInstance] = useState(null);
  const [isPreviewTokens, setIsPreviewTokens] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const fabricCanvasRef = useRef(null);
  const hasUnsavedChangesRef = useRef(false);
  const clipboardRef = useRef(null);
  const nudgeTimerRef = useRef(null);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  const {
    initHistory,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory();

  const handleHistoryPush = useCallback((canvas) => {
    pushState(canvas);
    hasUnsavedChangesRef.current = true;
  }, [pushState]);

  const handleCopy = useCallback(async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj) {
      showToast("⚠️ กรุณาคลิกเลือกวัตถุที่ต้องการคัดลอกก่อน");
      return;
    }

    const res = await saveToCrossTemplateStorage(activeObj);
    if (res?.success) {
      clipboardRef.current = {
        pasteCount: 0,
        timestamp: Date.now(),
        sourceObj: activeObj,
      };
      showToast(`📋 คัดลอก ${res.count} ชิ้นส่วนแล้ว (นำไปวางในเทมเพลตอื่นได้ทันที)`);
    } else {
      showToast("⚠️ ไม่สามารถคัดลอกวัตถุได้");
    }
  }, [showToast]);

  const handlePaste = useCallback(async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (clipboardRef.current) {
      clipboardRef.current.pasteCount += 1;
    } else {
      clipboardRef.current = { pasteCount: 1, sourceObj: null, timestamp: Date.now() };
    }

    const offset = 20 * clipboardRef.current.pasteCount;
    const pasted = await loadFromCrossTemplateStorage(canvas, offset, offset);
    if (pasted) {
      setActiveObject(pasted);
      handleHistoryPush(canvas);
      hasUnsavedChangesRef.current = true;
      showToast("✨ วางชิ้นส่วนจากคลิปบอร์ดเรียบร้อยแล้ว");
    } else {
      showToast("⚠️ ไม่มีข้อมูลในคลิปบอร์ด กรุณากดคัดลอกวัตถุก่อน");
    }
  }, [handleHistoryPush, showToast]);

  // Sync title when loaded from async fetch (e.g. edit mode)
  useEffect(() => {
    if (templateName) {
      setCurrentTitle(templateName);
    }
  }, [templateName]);

  // 📐 REAL Dynamic Fit-to-Screen Zoom Calculation (Measures actual viewport container)
  const calculateFitZoom = useCallback(() => {
    if (!mainContainerRef.current) return preset.defaultZoom || (editorType === "slide" ? 0.65 : 0.85);
    const containerWidth = mainContainerRef.current.clientWidth;
    const containerHeight = mainContainerRef.current.clientHeight;

    const availableWidth = Math.max(200, containerWidth - 48);
    const availableHeight = Math.max(200, containerHeight - 48);

    const scaleX = availableWidth / preset.width;
    const scaleY = availableHeight / preset.height;
    const fitScale = Math.min(scaleX, scaleY) * 0.92;

    return Math.min(1.4, Math.max(0.3, Number(fitScale.toFixed(2))));
  }, [preset.width, preset.height, preset.defaultZoom, editorType]);

  // Dynamic zoom adjustment ONLY on initial mount or when template preset changes
  useEffect(() => {
    const fit = calculateFitZoom();
    setZoom(fit);

    // Run once after initial DOM render pass to ensure accurate container dimensions
    const timer = setTimeout(() => {
      const refinedFit = calculateFitZoom();
      setZoom(refinedFit);
    }, 60);

    return () => clearTimeout(timer);
  }, [preset.id, editorType]);

  // 📄 Multi-Page State
  const [pages, setPages] = useState(() => {
    if (initialPages && Array.isArray(initialPages) && initialPages.length > 0) {
      return initialPages;
    }
    return [{ id: "page-1", json: null }];
  });
  const [activePageIndex, setActivePageIndex] = useState(0);

  // Smooth scroll to active page in vertical multi-page view
  useEffect(() => {
    const el = pageRefs.current[activePageIndex];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activePageIndex]);

  const isPosterOrSquare = preset.width === preset.height || (canvasPreset && canvasPreset.includes("poster"));
  const [showPageNumber, setShowPageNumber] = useState(() => {
    if (initialShowPageNumbers !== null && initialShowPageNumbers !== undefined) {
      return initialShowPageNumbers;
    }
    return !isPosterOrSquare;
  });
  const showPageNumberRef = useRef(
    initialShowPageNumbers !== null && initialShowPageNumbers !== undefined
      ? initialShowPageNumbers
      : !isPosterOrSquare
  );

  useEffect(() => {
    if (initialShowPageNumbers !== null && initialShowPageNumbers !== undefined) {
      setShowPageNumber(initialShowPageNumbers);
      showPageNumberRef.current = initialShowPageNumbers;
      const canvas = fabricCanvasRef.current;
      if (canvas) {
        syncPageNumberOnCanvas(canvas, activePageIndex, pages.length, editorType, preset, initialShowPageNumbers);
      }
    }
  }, [initialShowPageNumbers, activePageIndex, pages.length, editorType, preset]);

  useEffect(() => {
    showPageNumberRef.current = showPageNumber;
  }, [showPageNumber]);

  const handleTogglePageNumber = useCallback(() => {
    setShowPageNumber((prev) => {
      const next = !prev;
      showPageNumberRef.current = next;
      const canvas = fabricCanvasRef.current;
      if (canvas) {
        syncPageNumberOnCanvas(canvas, activePageIndex, pages.length, editorType, preset, next);
      }
      return next;
    });
  }, [activePageIndex, pages.length, editorType, preset]);

  // 🛡️ Unsaved-Changes Warning on Tab/Window Close (Phase 7)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChangesRef.current) {
        e.preventDefault();
        e.returnValue = "คุณมีการแก้ไขที่ยังไม่ได้บันทึก ต้องการออกจากหน้านี้หรือไม่?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Load initialPages when provided (e.g. from API edit mode)
  useEffect(() => {
    if (initialPages && Array.isArray(initialPages) && initialPages.length > 0) {
      setPages(initialPages);
      if (fabricCanvasRef.current && initialPages[0]?.json) {
        const parsedFirst = typeof initialPages[0].json === "string" ? JSON.parse(initialPages[0].json) : initialPages[0].json;
        fabricCanvasRef.current.loadFromJSON(parsedFirst).then(() => {
          syncPageNumberOnCanvas(fabricCanvasRef.current, 0, initialPages.length, editorType, preset, showPageNumberRef.current);
          ensureThaiTextWrapping(fabricCanvasRef.current);
          ensureUnselectableObjectsAreNotEvented(fabricCanvasRef.current);
          fabricCanvasRef.current.renderAll();
          initHistory(fabricCanvasRef.current);
          hasUnsavedChangesRef.current = false;
        });
      }
    }
  }, [initialPages, initHistory, editorType, preset.id]);

  // Canvas Ready Callback
  const handleCanvasReady = useCallback((canvas) => {
    fabricCanvasRef.current = canvas;
    setCanvasInstance(canvas);

    const pagesToLoad = (initialPages && Array.isArray(initialPages) && initialPages.length > 0)
      ? initialPages
      : (pages && Array.isArray(pages) && pages.length > 0 && pages[0]?.json)
      ? pages
      : null;

    if (pagesToLoad && pagesToLoad.length > 0) {
      if (pagesToLoad[0]?.json) {
        const parsedFirst = typeof pagesToLoad[0].json === "string" ? JSON.parse(pagesToLoad[0].json) : pagesToLoad[0].json;
        canvas.loadFromJSON(parsedFirst).then(() => {
          syncPageNumberOnCanvas(canvas, 0, pagesToLoad.length, editorType, preset, showPageNumberRef.current);
          ensureThaiTextWrapping(canvas);
          ensureUnselectableObjectsAreNotEvented(canvas);
          canvas.renderAll();
          initHistory(canvas);
          hasUnsavedChangesRef.current = false;
        });
      } else {
        syncPageNumberOnCanvas(canvas, 0, pagesToLoad.length, editorType, preset, showPageNumberRef.current);
        initHistory(canvas);
        hasUnsavedChangesRef.current = false;
      }
      setPages(pagesToLoad);
    } else {
      // Embed initial page footer number
      syncPageNumberOnCanvas(canvas, 0, 1, editorType, preset, showPageNumberRef.current);
      initHistory(canvas);
      const initialJson = canvas.toJSON(CUSTOM_CANVAS_PROPS);
      setPages([{ id: "page-1", json: initialJson }]);
      hasUnsavedChangesRef.current = false;
    }

    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      window.__DOC_EDITOR_INIT_HISTORY__ = initHistory;
      window.__DOC_EDITOR_PUSH_HISTORY__ = handleHistoryPush;
      window.__DOC_EDITOR_CANVAS__ = canvas;
    }
  }, [initialPages, pages, initHistory, editorType, preset.id, handleHistoryPush]);

  // 🔍 Figma-style Viewport Zoom & Pan Handlers
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(4.0, Number((z * 1.15).toFixed(2))));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.15, Number((z / 1.15).toFixed(2))));
  }, []);

  const handleFitToScreen = useCallback(() => {
    const fit = calculateFitZoom();
    setZoom(fit);
    setPan({ x: 0, y: 0 });
  }, [calculateFitZoom]);

  const handleZoomTo100 = useCallback(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleResetPan = useCallback(() => {
    setPan({ x: 0, y: 0 });
  }, []);

  const handleSetCustomZoom = useCallback((val) => {
    const clamped = Math.min(4.0, Math.max(0.15, Number(Number(val).toFixed(2))));
    setZoom(clamped);
  }, []);

  const handleZoomToSelection = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    const container = mainContainerRef.current;
    if (!canvas || !container) return;

    const active = canvas.getActiveObject();
    if (!active) {
      handleFitToScreen();
      return;
    }

    const availW = Math.max(100, container.clientWidth - 120);
    const availH = Math.max(100, container.clientHeight - 120);

    const objW = Math.max(40, active.getScaledWidth());
    const objH = Math.max(40, active.getScaledHeight());

    const scaleX = availW / objW;
    const scaleY = availH / objH;
    const targetZoom = Math.min(3.0, Math.max(0.3, Number((Math.min(scaleX, scaleY) * 0.7).toFixed(2))));

    const objCenterX = active.left + objW / 2;
    const objCenterY = active.top + objH / 2;

    const pageCenterX = preset.width / 2;
    const pageCenterY = preset.height / 2;

    const panX = -(objCenterX - pageCenterX) * targetZoom;
    const panY = -(objCenterY - pageCenterY) * targetZoom;

    setZoom(targetZoom);
    setPan({ x: Math.round(panX), y: Math.round(panY) });
  }, [handleFitToScreen, preset.width, preset.height]);

  const handleZoomReset = handleFitToScreen;

  // 🔍 Figma-style Viewport Zoom (Ctrl + Wheel centered at mouse) and Wheel Pan
  useEffect(() => {
    const container = mainContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      // 1. Zoom with Ctrl / Cmd / Trackpad pinch
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();

        const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
        const curZoom = zoomRef.current;
        const newZoom = Math.min(4.0, Math.max(0.2, Number((curZoom * zoomFactor).toFixed(3))));

        if (newZoom === curZoom) return;
        setZoom(newZoom);
        return;
      }

      // 2. Normal wheel: Allow natural vertical scroll of the multi-page stack
      // Do not preventDefault, container handles overflow-y-auto with clean boundaries!
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // 🖐️ Middle Click (Mouse 3) & Spacebar + Left Click Canvas Drag (Pan)
  useEffect(() => {
    const container = mainContainerRef.current;
    if (!container) return;

    const handlePointerDown = (e) => {
      const isMiddle = e.button === 1;
      const isHandDrag = e.button === 0 && (isSpacePressedRef.current || isHandToolActiveRef.current);

      if (isMiddle || isHandDrag) {
        e.preventDefault();
        e.stopPropagation();

        isDraggingPanRef.current = true;
        dragStartPosRef.current = {
          x: e.clientX,
          y: e.clientY,
          panX: panRef.current.x,
          panY: panRef.current.y,
        };
        setIsPanning(true);
      }
    };

    const handlePointerMove = (e) => {
      if (!isDraggingPanRef.current) return;
      e.preventDefault();
      const dx = e.clientX - dragStartPosRef.current.x;
      const dy = e.clientY - dragStartPosRef.current.y;
      setPan({
        x: Math.round(dragStartPosRef.current.panX + dx),
        y: Math.round(dragStartPosRef.current.panY + dy),
      });
    };

    const handlePointerUp = (e) => {
      if (isDraggingPanRef.current) {
        isDraggingPanRef.current = false;
        setIsPanning(false);
      }
    };

    const handleAuxClick = (e) => {
      if (e.button === 1) {
        e.preventDefault();
      }
    };

    container.addEventListener("pointerdown", handlePointerDown, { capture: true });
    container.addEventListener("auxclick", handleAuxClick);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      container.removeEventListener("auxclick", handleAuxClick);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  // 🏷️ Toggle Live Data Preview
  const handleTogglePreviewTokens = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const nextPreviewState = !isPreviewTokens;
    setIsPreviewTokens(nextPreviewState);
    applyTokensToCanvas(canvas, nextPreviewState);
  }, [isPreviewTokens]);

  // 🏷️ Insert Token into Active Textbox or create new Token field
  const handleInsertToken = useCallback((tokenKey) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const activeObj = canvas.getActiveObject();

    // 1. If currently selecting a Textbox
    if (activeObj && (activeObj.type === "textbox" || activeObj.type === "i-text" || activeObj.type === "text")) {
      const currentText = activeObj.text || "";
      const newText = currentText ? `${currentText} ${tokenKey}` : tokenKey;
      activeObj.set("text", newText);
      activeObj.rawTemplateText = newText;
      activeObj.isTokenField = true;
      activeObj.tokenKey = tokenKey;
      canvas.requestRenderAll();
      handleHistoryPush(canvas);
      return;
    }

    // 2. If currently selecting a DocTable
    if (activeObj && activeObj.isDocTable && activeObj.addRow) {
      activeObj.addRow({
        desc: `บริการตามสัญญาสำหรับ ${tokenKey}`,
        qty: 1,
        price: 50000,
      });
      handleHistoryPush(canvas);
      return;
    }

    // 3. Otherwise add new standalone dynamic token textbox
    const tokenBox = new fabric.Textbox(tokenKey, {
      left: MARGIN_PX + 20,
      top: MARGIN_PX + 60,
      width: 280,
      fontSize: 13,
      fontWeight: "bold",
      fill: "#4338CA",
      fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
      editable: true,
    });
    tokenBox.isTokenField = true;
    tokenBox.tokenKey = tokenKey;
    tokenBox.rawTemplateText = tokenKey;

    canvas.add(tokenBox);
    canvas.setActiveObject(tokenBox);
    canvas.requestRenderAll();
    handleHistoryPush(canvas);
  }, [handleHistoryPush]);

  // 📄 Multi-Page Actions

  // 1. Switch Page
  const handleSelectPage = useCallback((targetIndex) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || targetIndex === activePageIndex || targetIndex < 0 || targetIndex >= pages.length) {
      return;
    }

    // Always restore raw tokens before capturing snapshot
    if (isPreviewTokens) {
      applyTokensToCanvas(canvas, false);
      setIsPreviewTokens(false);
    }

    const currentJson = canvas.toJSON(CUSTOM_CANVAS_PROPS);
    const updatedPages = pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, json: currentJson } : p
    );

    setPages(updatedPages);
    setActivePageIndex(targetIndex);
    setActiveObject(null);

    // Load target page
    const targetPageJson = updatedPages[targetIndex].json;
    if (targetPageJson) {
      const parsedTarget = typeof targetPageJson === "string" ? JSON.parse(targetPageJson) : targetPageJson;
      canvas.loadFromJSON(parsedTarget).then(() => {
        syncPageNumberOnCanvas(canvas, targetIndex, updatedPages.length, editorType, preset, showPageNumberRef.current);
        ensureThaiTextWrapping(canvas);
        ensureUnselectableObjectsAreNotEvented(canvas);
        canvas.renderAll();
        initHistory(canvas);
      });
    } else {
      canvas.clear();
      canvas.backgroundColor = "#FFFFFF";
      syncPageNumberOnCanvas(canvas, targetIndex, updatedPages.length, editorType, preset, showPageNumberRef.current);
      canvas.renderAll();
      initHistory(canvas);
    }
  }, [activePageIndex, pages, initHistory, isPreviewTokens, editorType, preset.id]);

  // 2. Add Blank Page
  const handleAddPage = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (isPreviewTokens) {
      applyTokensToCanvas(canvas, false);
      setIsPreviewTokens(false);
    }

    const currentJson = canvas.toJSON(CUSTOM_CANVAS_PROPS);
    const newPageId = `page-${Date.now()}`;
    const blankJson = { version: "6.5.0", objects: [] };

    const updatedPages = [
      ...pages.map((p, idx) => (idx === activePageIndex ? { ...p, json: currentJson } : p)),
      { id: newPageId, json: blankJson },
    ];

    const newIndex = updatedPages.length - 1;
    setPages(updatedPages);
    setActivePageIndex(newIndex);
    setActiveObject(null);

    canvas.clear();
    canvas.backgroundColor = "#FFFFFF";
    syncPageNumberOnCanvas(canvas, newIndex, updatedPages.length, editorType, preset, showPageNumberRef.current);
    canvas.renderAll();
    initHistory(canvas);
    hasUnsavedChangesRef.current = true;
  }, [activePageIndex, pages, initHistory, isPreviewTokens, editorType, preset.id]);

  // 3. Duplicate Page (Deep JSON Clone)
  const handleDuplicatePage = useCallback((indexToDuplicate) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (isPreviewTokens) {
      applyTokensToCanvas(canvas, false);
      setIsPreviewTokens(false);
    }

    const currentJson = canvas.toJSON(CUSTOM_CANVAS_PROPS);
    const sourcePage = pages[indexToDuplicate];
    const sourceJson = indexToDuplicate === activePageIndex ? currentJson : sourcePage.json;

    const duplicatedPage = {
      id: `page-${Date.now()}`,
      json: JSON.parse(JSON.stringify(sourceJson)),
    };

    const updatedPages = [...pages];
    if (activePageIndex === indexToDuplicate) {
      updatedPages[activePageIndex] = { ...updatedPages[activePageIndex], json: currentJson };
    }
    updatedPages.splice(indexToDuplicate + 1, 0, duplicatedPage);

    const newIndex = indexToDuplicate + 1;
    setPages(updatedPages);
    setActivePageIndex(newIndex);
    setActiveObject(null);

    canvas.loadFromJSON(duplicatedPage.json).then(() => {
      syncPageNumberOnCanvas(canvas, newIndex, updatedPages.length, editorType, preset, showPageNumberRef.current);
      ensureThaiTextWrapping(canvas);
      canvas.renderAll();
      initHistory(canvas);
      hasUnsavedChangesRef.current = true;
    });
  }, [activePageIndex, pages, initHistory, isPreviewTokens, editorType, preset.id]);

  // 4. Delete Page
  const handleDeletePage = useCallback((indexToDelete) => {
    if (pages.length <= 1) return;
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (isPreviewTokens) {
      applyTokensToCanvas(canvas, false);
      setIsPreviewTokens(false);
    }

    const remainingPages = pages.filter((_, idx) => idx !== indexToDelete);
    const newActiveIndex = Math.min(
      remainingPages.length - 1,
      activePageIndex >= indexToDelete ? Math.max(0, activePageIndex - 1) : activePageIndex
    );

    setPages(remainingPages);
    setActivePageIndex(newActiveIndex);
    setActiveObject(null);

    const targetJson = remainingPages[newActiveIndex].json;
    if (targetJson) {
      canvas.loadFromJSON(targetJson).then(() => {
        syncPageNumberOnCanvas(canvas, newActiveIndex, remainingPages.length, editorType, preset, showPageNumberRef.current);
        ensureThaiTextWrapping(canvas);
        canvas.renderAll();
        initHistory(canvas);
        hasUnsavedChangesRef.current = true;
      });
    } else {
      canvas.clear();
      canvas.backgroundColor = "#FFFFFF";
      syncPageNumberOnCanvas(canvas, newActiveIndex, remainingPages.length, editorType, preset, showPageNumberRef.current);
      canvas.renderAll();
      initHistory(canvas);
      hasUnsavedChangesRef.current = true;
    }
  }, [activePageIndex, pages, initHistory, isPreviewTokens, editorType, preset.id]);

  // 5. Move Page Order
  const handleMovePage = useCallback((currentIndex, direction) => {
    const delta = typeof direction === "number" ? direction : direction === "up" ? -1 : 1;
    const targetIndex = currentIndex + delta;
    if (targetIndex < 0 || targetIndex >= pages.length) return;
    const canvas = fabricCanvasRef.current;

    const currentJson = canvas ? canvas.toJSON(CUSTOM_CANVAS_PROPS) : null;
    const updatedPages = pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, json: currentJson } : p
    );

    const temp = updatedPages[currentIndex];
    updatedPages[currentIndex] = updatedPages[targetIndex];
    updatedPages[targetIndex] = temp;

    setPages(updatedPages);
    setActivePageIndex(targetIndex);

    if (canvas) {
      syncPageNumberOnCanvas(canvas, targetIndex, updatedPages.length, editorType, preset, showPageNumberRef.current);
    }
    hasUnsavedChangesRef.current = true;
  }, [activePageIndex, pages, editorType, preset.id]);

  // 6. Canva-Style Add Page Between
  const handleAddPageBetween = useCallback((targetIndex) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (isPreviewTokens) {
      applyTokensToCanvas(canvas, false);
      setIsPreviewTokens(false);
    }

    const currentJson = canvas.toJSON(CUSTOM_CANVAS_PROPS);
    const newPageId = `page-${Date.now()}`;
    const blankJson = { version: "6.5.0", objects: [] };

    const updatedPages = [...pages];
    updatedPages[activePageIndex] = { ...updatedPages[activePageIndex], json: currentJson };
    const insertAt = targetIndex + 1;
    updatedPages.splice(insertAt, 0, { id: newPageId, json: blankJson });

    setPages(updatedPages);
    setActivePageIndex(insertAt);
    setActiveObject(null);

    canvas.clear();
    canvas.backgroundColor = "#FFFFFF";
    syncPageNumberOnCanvas(canvas, insertAt, updatedPages.length, editorType, preset, showPageNumberRef.current);
    canvas.renderAll();
    initHistory(canvas);
    hasUnsavedChangesRef.current = true;
  }, [activePageIndex, pages, initHistory, isPreviewTokens, editorType, preset.id]);

  // 📍 Viewport-aware Coordinate Helper (Places new objects in center of current visible view)
  const getSpawnCoords = useCallback((width = 200, height = 100) => {
    const canvas = fabricCanvasRef.current;
    const pw = preset.width || 794;
    const ph = preset.height || 1123;
    let spawnLeft = Math.round(pw / 2);
    let spawnTop = Math.round(ph / 3);

    if (canvas && canvas.getVpCenter) {
      const center = canvas.getVpCenter();
      if (center && !isNaN(center.x) && !isNaN(center.y)) {
        spawnLeft = Math.round(center.x);
        spawnTop = Math.round(center.y);
      }
    }

    const minX = MARGIN_PX + 20;
    const maxX = pw - MARGIN_PX - 20 - width;
    const minY = MARGIN_PX + 20;
    const maxY = ph - MARGIN_PX - 20 - height;

    const finalLeft = Math.max(minX, Math.min(Math.max(minX, maxX), spawnLeft - width / 2));
    const finalTop = Math.max(minY, Math.min(Math.max(minY, maxY), spawnTop - height / 2));

    return { left: Math.round(finalLeft), top: Math.round(finalTop) };
  }, [preset.width, preset.height]);

  // 🔤 Add Text
  const handleAddText = useCallback((options = {}) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const w = options.width || 320;
    const h = options.fontSize ? options.fontSize * 2 : 40;
    const { left, top } = getSpawnCoords(w, h);

    const textbox = new fabric.Textbox(options.text || "ข้อความตัวอย่าง", {
      left,
      top,
      width: w,
      fontSize: options.fontSize || 14,
      fontWeight: options.fontWeight || "normal",
      fontStyle: options.fontStyle || "normal",
      fill: options.fill || "#111827",
      fontFamily: options.fontFamily || "'Noto Sans Thai', 'Noto Sans', sans-serif",
      charSpacing: options.charSpacing || 0,
      lineHeight: options.lineHeight || 1.3,
      textAlign: options.textAlign || "left",
      splitByGrapheme: true,
      objectCaching: false,
      editable: true,
      strokeUniform: true,
      cornerColor: "#6366F1",
      cornerStrokeColor: "#FFFFFF",
      cornerStyle: "circle",
      cornerSize: 8,
      transparentCorners: false,
      borderColor: "#6366F1",
    });

    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.renderAll();
    handleHistoryPush(canvas);
  }, [getSpawnCoords, handleHistoryPush]);

  // 🔷 Add Shape
  const handleAddShape = useCallback((options) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const baseShapeProps = {
      strokeUniform: true,
      cornerColor: "#6366F1",
      cornerStrokeColor: "#FFFFFF",
      cornerStyle: "circle",
      cornerSize: 8,
      transparentCorners: false,
      borderColor: "#6366F1",
      borderScaleFactor: 1.5,
      padding: 4,
    };

    let shapeObj = null;

    if (options.type === "rect") {
      const w = options.width || 240;
      const h = options.height || 100;
      const { left, top } = getSpawnCoords(w, h);
      shapeObj = new fabric.Rect({
        ...baseShapeProps,
        left,
        top,
        width: w,
        height: h,
        fill: options.fill || "#F3F4F6",
        stroke: options.stroke || "#9CA3AF",
        strokeWidth: options.strokeWidth || 1,
        rx: 0,
        ry: 0,
      });
    } else if (options.type === "rounded-rect") {
      const w = options.width || 240;
      const h = options.height || 110;
      const { left, top } = getSpawnCoords(w, h);
      shapeObj = new fabric.Rect({
        ...baseShapeProps,
        left,
        top,
        width: w,
        height: h,
        fill: options.fill || "#F8FAFC",
        stroke: options.stroke || "#CBD5E1",
        strokeWidth: options.strokeWidth || 1.5,
        rx: options.rx || 12,
        ry: options.ry || 12,
      });
    } else if (options.type === "circle") {
      const radius = options.radius || 48;
      const { left, top } = getSpawnCoords(radius * 2, radius * 2);
      shapeObj = new fabric.Circle({
        ...baseShapeProps,
        left,
        top,
        radius,
        fill: options.fill || "#EEF2FF",
        stroke: options.stroke || "#6366F1",
        strokeWidth: options.strokeWidth || 2,
      });
    } else if (options.type === "ellipse") {
      const rx = options.rx || 65;
      const ry = options.ry || 40;
      const { left, top } = getSpawnCoords(rx * 2, ry * 2);
      shapeObj = new fabric.Ellipse({
        ...baseShapeProps,
        left,
        top,
        rx,
        ry,
        fill: options.fill || "#F0FDF4",
        stroke: options.stroke || "#10B981",
        strokeWidth: options.strokeWidth || 2,
      });
    } else if (options.type === "triangle") {
      const w = options.width || 90;
      const h = options.height || 80;
      const { left, top } = getSpawnCoords(w, h);
      shapeObj = new fabric.Triangle({
        ...baseShapeProps,
        left,
        top,
        width: w,
        height: h,
        fill: options.fill || "#FEF3C7",
        stroke: options.stroke || "#F59E0B",
        strokeWidth: options.strokeWidth || 2,
      });
    } else if (options.type === "star") {
      const starPoints = [
        { x: 50, y: 0 },
        { x: 61, y: 35 },
        { x: 98, y: 35 },
        { x: 68, y: 57 },
        { x: 79, y: 91 },
        { x: 50, y: 70 },
        { x: 21, y: 91 },
        { x: 32, y: 57 },
        { x: 2, y: 35 },
        { x: 39, y: 35 },
      ];
      const { left, top } = getSpawnCoords(100, 100);
      shapeObj = new fabric.Polygon(starPoints, {
        ...baseShapeProps,
        left,
        top,
        fill: options.fill || "#FEF08A",
        stroke: options.stroke || "#CA8A04",
        strokeWidth: options.strokeWidth || 2,
      });
    } else if (options.type === "arrow") {
      const { left, top } = getSpawnCoords(190, 50);
      shapeObj = new fabric.Path("M 0 15 L 140 15 L 140 0 L 190 25 L 140 50 L 140 35 L 0 35 Z", {
        ...baseShapeProps,
        left,
        top,
        fill: options.fill || "#6366F1",
        stroke: options.stroke || "#4338CA",
        strokeWidth: options.strokeWidth || 1,
      });
    } else if (options.type === "pill") {
      const w = options.width || 140;
      const h = options.height || 40;
      const { left, top } = getSpawnCoords(w, h);
      shapeObj = new fabric.Rect({
        ...baseShapeProps,
        left,
        top,
        width: w,
        height: h,
        rx: 20,
        ry: 20,
        fill: options.fill || "#EEF2FF",
        stroke: options.stroke || "#6366F1",
        strokeWidth: options.strokeWidth || 1.5,
      });
    } else if (options.type === "line") {
      const len = options.width || 300;
      const { left, top } = getSpawnCoords(len, 2);
      shapeObj = new fabric.Line([0, 0, len, 0], {
        ...baseShapeProps,
        left,
        top,
        stroke: options.stroke || "#9CA3AF",
        strokeWidth: options.strokeWidth || 1.5,
      });
    } else if (options.type === "dashed-line") {
      const len = options.width || 300;
      const { left, top } = getSpawnCoords(len, 2);
      shapeObj = new fabric.Line([0, 0, len, 0], {
        ...baseShapeProps,
        left,
        top,
        stroke: options.stroke || "#64748B",
        strokeWidth: options.strokeWidth || 1.5,
        strokeDashArray: [6, 4],
      });
    } else if (options.type === "card") {
      const w = options.width || 340;
      const h = options.height || 220;
      const { left, top } = getSpawnCoords(w, h);
      shapeObj = new fabric.Rect({
        ...baseShapeProps,
        left,
        top,
        width: w,
        height: h,
        fill: options.fill || "#FFFFFF",
        stroke: options.stroke || "#E2E8F0",
        strokeWidth: options.strokeWidth || 1.5,
        rx: options.rx || 20,
        ry: options.ry || 20,
        shadow: new fabric.Shadow({
          color: "rgba(0, 0, 0, 0.08)",
          blur: 16,
          offsetX: 0,
          offsetY: 8,
        }),
      });
    } else if (options.type === "slanted-badge") {
      const w = options.width || 145;
      const h = options.height || 60;
      const slant = 24;
      const points = [
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: w - slant, y: h },
        { x: 0, y: h },
      ];
      const { left, top } = getSpawnCoords(w, h);
      shapeObj = new fabric.Polygon(points, {
        ...baseShapeProps,
        left,
        top,
        fill: options.fill || "#DC2626",
        stroke: options.stroke || "transparent",
        strokeWidth: 0,
      });
    } else if (options.type === "accent-bar") {
      const w = options.width || 310;
      const h = options.height || 8;
      const { left, top } = getSpawnCoords(w, h);
      shapeObj = new fabric.Rect({
        ...baseShapeProps,
        left,
        top,
        width: w,
        height: h,
        fill: options.fill || "#DC2626",
        rx: 4,
        ry: 4,
      });
    } else if (options.type === "diamond") {
      const size = options.size || 80;
      const diamondPoints = [
        { x: size / 2, y: 0 },
        { x: size, y: size / 2 },
        { x: size / 2, y: size },
        { x: 0, y: size / 2 },
      ];
      const { left, top } = getSpawnCoords(size, size);
      shapeObj = new fabric.Polygon(diamondPoints, {
        ...baseShapeProps,
        left,
        top,
        fill: options.fill || "#EEF2FF",
        stroke: options.stroke || "#6366F1",
        strokeWidth: 2,
      });
    } else if (options.type === "hexagon") {
      const r = options.radius || 45;
      const hexPoints = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        hexPoints.push({
          x: r + r * Math.cos(angle),
          y: r + r * Math.sin(angle),
        });
      }
      const { left, top } = getSpawnCoords(r * 2, r * 2);
      shapeObj = new fabric.Polygon(hexPoints, {
        ...baseShapeProps,
        left,
        top,
        fill: options.fill || "#ECFDF5",
        stroke: options.stroke || "#10B981",
        strokeWidth: 2,
      });
    }

    if (shapeObj) {
      canvas.add(shapeObj);
      canvas.setActiveObject(shapeObj);
      canvas.renderAll();
      handleHistoryPush(canvas);
    }
  }, [getSpawnCoords, handleHistoryPush]);

  // ✨ Add or Replace Vector Icon
  const handleAddIcon = useCallback((iconData) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !iconData || !iconData.path) return;

    const activeObj = canvas.getActiveObject();
    const isReplacing = Boolean(activeObj && (activeObj.isIcon || activeObj.type === "path"));

    if (isReplacing) {
      // 🔄 Replace selected icon in-place with exact same position, scale, and color
      const currentLeft = activeObj.left;
      const currentTop = activeObj.top;
      const currentScaleX = activeObj.scaleX || 1;
      const currentScaleY = activeObj.scaleY || 1;
      const currentFill = activeObj.fill || iconData.defaultFill || "#DC2626";
      const currentStroke = activeObj.stroke || "transparent";
      const currentStrokeWidth = activeObj.strokeWidth || 0;
      const currentAngle = activeObj.angle || 0;
      const currentOpacity = activeObj.opacity ?? 1;
      const currentOriginX = activeObj.originX || "left";
      const currentOriginY = activeObj.originY || "top";
      const currentFlipX = activeObj.flipX || false;
      const currentFlipY = activeObj.flipY || false;

      // Find index in canvas to preserve Z-order
      const objects = canvas.getObjects();
      const objIndex = objects.indexOf(activeObj);

      const newPathObj = new fabric.Path(iconData.path, {
        left: currentLeft,
        top: currentTop,
        originX: currentOriginX,
        originY: currentOriginY,
        scaleX: currentScaleX,
        scaleY: currentScaleY,
        fill: currentFill,
        stroke: currentStroke,
        strokeWidth: currentStrokeWidth,
        angle: currentAngle,
        opacity: currentOpacity,
        flipX: currentFlipX,
        flipY: currentFlipY,
        selectable: true,
        isIcon: true,
        iconId: iconData.id,
        iconLabel: iconData.label,
      });

      canvas.remove(activeObj);
      if (objIndex >= 0) {
        canvas.insertAt(newPathObj, objIndex);
      } else {
        canvas.add(newPathObj);
      }
      canvas.setActiveObject(newPathObj);
      canvas.requestRenderAll();
      handleHistoryPush(canvas);
      showToast(`✨ สลับไอคอนเป็น "${iconData.label.split(" ")[0]}" สำเร็จ`);
    } else {
      // ➕ Add brand new icon at default margin position
      const { left, top } = getSpawnCoords(50, 50);
      const pathObj = new fabric.Path(iconData.path, {
        left,
        top,
        scaleX: iconData.scale || 2.2,
        scaleY: iconData.scale || 2.2,
        fill: iconData.defaultFill || "#DC2626",
        stroke: "transparent",
        strokeWidth: 0,
        selectable: true,
        isIcon: true,
        iconId: iconData.id,
        iconLabel: iconData.label,
        cornerColor: "#6366F1",
        cornerStrokeColor: "#FFFFFF",
        cornerStyle: "circle",
        cornerSize: 8,
        transparentCorners: false,
        borderColor: "#6366F1",
      });

      canvas.add(pathObj);
      canvas.setActiveObject(pathObj);
      canvas.requestRenderAll();
      handleHistoryPush(canvas);
    }
  }, [getSpawnCoords, handleHistoryPush, showToast]);

  // 📁 Add Image / Logo
  const handleAddImage = useCallback((imageUrl) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const applyImage = (img) => {
      const maxWidth = 300;
      if (img.width > maxWidth) {
        const scale = maxWidth / img.width;
        img.scale(scale);
      }
      const imgW = img.getScaledWidth ? img.getScaledWidth() : (img.width || 200);
      const imgH = img.getScaledHeight ? img.getScaledHeight() : (img.height || 150);
      const { left, top } = getSpawnCoords(imgW, imgH);
      img.set({
        left,
        top,
        cornerColor: "#6366F1",
        cornerStrokeColor: "#FFFFFF",
        cornerStyle: "circle",
        cornerSize: 8,
        transparentCorners: false,
        borderColor: "#6366F1",
      });

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      handleHistoryPush(canvas);
    };

    if (fabric.FabricImage && fabric.FabricImage.fromURL) {
      fabric.FabricImage.fromURL(imageUrl, { crossOrigin: "anonymous" })
        .then(applyImage)
        .catch((err) => console.error("Image load error:", err));
    } else if (fabric.Image && fabric.Image.fromURL) {
      fabric.Image.fromURL(
        imageUrl,
        (img) => applyImage(img),
        { crossOrigin: "anonymous" }
      );
    }
  }, [getSpawnCoords, handleHistoryPush]);

  // 📊 Add Quotation / Pricing Table
  const handleAddTable = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const currentMargin = marginPx !== null && marginPx !== undefined ? marginPx : preset.marginPx;
    const currentWidth = Math.max(300, preset.width - currentMargin * 2);

    const tableGroup = createDocTable({
      left: currentMargin,
      top: 320,
      width: currentWidth,
      primaryColor: "#2563EB",
      rowCount: 3,
    });

    canvas.add(tableGroup);
    canvas.setActiveObject(tableGroup);
    canvas.renderAll();
    handleHistoryPush(canvas);
  }, [handleHistoryPush, marginPx, preset.width, preset.marginPx]);

  // ✍️ Add Signature Block
  const handleAddSignature = useCallback((type = "dual") => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const currentMargin = marginPx !== null && marginPx !== undefined ? marginPx : preset.marginPx;
    const currentWidth = Math.max(300, preset.width - currentMargin * 2);
    const topPos = Math.max(300, preset.height - currentMargin - 220);

    const sigGroup = createSignatureBlock({
      type,
      left: currentMargin,
      top: topPos,
      width: currentWidth,
      primaryColor: "#1E293B",
    });

    canvas.add(sigGroup);
    canvas.setActiveObject(sigGroup);
    canvas.renderAll();
    handleHistoryPush(canvas);
  }, [handleHistoryPush, marginPx, preset.width, preset.height, preset.marginPx]);

  // 📑 Add Preset Block
  const handleAddPreset = useCallback((presetKey) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const currentMargin = marginPx !== null && marginPx !== undefined ? marginPx : preset.marginPx;
    const currentWidth = Math.max(300, preset.width - currentMargin * 2);

    let group = null;

    if (presetKey === "company_header") {
      group = createCompanyHeaderBlock({
        left: currentMargin,
        top: currentMargin,
        width: currentWidth,
      });
    } else if (presetKey === "party_info") {
      group = createPartyInfoGrid({
        left: currentMargin,
        top: currentMargin + 90,
        width: currentWidth,
      });
    } else if (presetKey === "terms_box") {
      group = createTermsBox({
        left: currentMargin,
        top: Math.max(400, preset.height - currentMargin - 380),
        width: currentWidth,
      });
    } else if (presetKey === "slide_title_subtitle") {
      const title = new fabric.IText("หัวข้อการนำเสนอหลัก (Presentation Title)", {
        left: 80,
        top: 220,
        fontSize: 42,
        fontFamily: "'Noto Sans Thai', sans-serif",
        fontWeight: "bold",
        fill: "#0F172A",
      });
      const subtitle = new fabric.IText("คำอธิบายหรือสาระสำคัญสำหรับการบรรยายในสไลด์นี้", {
        left: 80,
        top: 290,
        fontSize: 22,
        fontFamily: "'Noto Sans Thai', sans-serif",
        fill: "#64748B",
      });
      group = new fabric.Group([title, subtitle], { left: 80, top: 220 });
    } else if (presetKey === "slide_two_column") {
      const card1Bg = new fabric.Rect({ left: 80, top: 180, width: 520, height: 420, fill: "#F8FAFC", stroke: "#CBD5E1", rx: 16, ry: 16 });
      const card1Title = new fabric.IText("ประเด็นที่ 1 (Topic A)", { left: 110, top: 210, fontSize: 24, fontWeight: "bold", fill: "#1E293B" });
      const card1Body = new fabric.IText("• รายละเอียดและข้อสังเกตสำคัญ\n• ปัจจัยที่ส่งผลต่อการดำเนินการ\n• ผลลัพธ์เชิงบวกที่คาดว่าจะได้รับ", { left: 110, top: 260, fontSize: 18, fill: "#475569", lineHeight: 1.5 });

      const card2Bg = new fabric.Rect({ left: 660, top: 180, width: 520, height: 420, fill: "#F8FAFC", stroke: "#CBD5E1", rx: 16, ry: 16 });
      const card2Title = new fabric.IText("ประเด็นที่ 2 (Topic B)", { left: 690, top: 210, fontSize: 24, fontWeight: "bold", fill: "#1E293B" });
      const card2Body = new fabric.IText("• แผนงานและขั้นตอนการทดสอบ\n• การบริหารความเสี่ยงในโครงการ\n• กำหนดการส่งมอบงานขั้นสุดท้าย", { left: 690, top: 260, fontSize: 18, fill: "#475569", lineHeight: 1.5 });

      group = new fabric.Group([card1Bg, card1Title, card1Body, card2Bg, card2Title, card2Body], { left: 80, top: 180 });
    } else if (presetKey === "slide_stat_callout") {
      const cardBg = new fabric.Rect({ left: 340, top: 200, width: 600, height: 320, fill: "#EEF2FF", stroke: "#C7D2FE", strokeWidth: 2, rx: 24, ry: 24 });
      const statNum = new fabric.IText("+185%", { left: 490, top: 240, fontSize: 72, fontWeight: "bold", fill: "#4F46E5" });
      const statLabel = new fabric.IText("อัตราการเติบโตของยอดขายรายไตรมาส (Quarterly Growth)", { left: 400, top: 350, fontSize: 20, fill: "#3730A3" });
      const statSub = new fabric.IText("เปรียบเทียบกับเป้าหมายประจำปี 2026", { left: 470, top: 400, fontSize: 16, fill: "#6366F1" });
    } else if (presetKey === "doc_title") {
      const titleBoxBg = new fabric.Rect({
        left: 0,
        top: 0,
        width: 240,
        height: 80,
        fill: "#EEF2FF",
        stroke: "#6366F1",
        strokeWidth: 1.5,
        rx: 8,
        ry: 8,
      });
      const titleMain = new fabric.IText("ใบเสนอราคา\nQUOTATION", {
        left: 0,
        top: 14,
        width: 240,
        fontSize: 16,
        fontWeight: "bold",
        fill: "#4338CA",
        fontFamily: "'Noto Sans Thai', sans-serif",
        textAlign: "center",
      });
      const titleSub = new fabric.IText("ต้นฉบับ / Original", {
        left: 0,
        top: 54,
        width: 240,
        fontSize: 10,
        fill: "#6366F1",
        fontFamily: "'Noto Sans Thai', sans-serif",
        textAlign: "center",
      });
      group = new fabric.Group([titleBoxBg, titleMain, titleSub], {
        left: currentMargin + currentWidth - 240,
        top: currentMargin,
      });
    } else if (presetKey === "callout_box") {
      const calloutBg = new fabric.Rect({
        left: 0,
        top: 0,
        width: currentWidth,
        height: 70,
        fill: "#FFFBEB",
        stroke: "#F59E0B",
        strokeWidth: 1.5,
        rx: 8,
        ry: 8,
      });
      const calloutTitle = new fabric.IText("ข้อสังเกตและเงื่อนไขสำคัญ (Important Note):", {
        left: 16,
        top: 12,
        fontSize: 12,
        fontWeight: "bold",
        fill: "#B45309",
        fontFamily: "'Noto Sans Thai', sans-serif",
      });
      const calloutBody = new fabric.IText("กรุณาตรวจสอบรายละเอียดความถูกต้องก่อนลงนามอนุมัติ เอกสารนี้มีผลผูกพันตามกฎหมาย", {
        left: 16,
        top: 36,
        fontSize: 11,
        fill: "#92400E",
        fontFamily: "'Noto Sans Thai', sans-serif",
      });
      group = new fabric.Group([calloutBg, calloutTitle, calloutBody], {
        left: currentMargin,
        top: Math.max(300, preset.height - currentMargin - 180),
      });
    } else if (presetKey === "contract_preamble") {
      const preambleBg = new fabric.Rect({
        left: 0,
        top: 0,
        width: currentWidth,
        height: 120,
        fill: "#F8FAFC",
        stroke: "#E2E8F0",
        strokeWidth: 1,
        rx: 8,
        ry: 8,
      });
      const preambleText = new fabric.IText(
        "สัญญาฉบับนี้ทำขึ้น ณ {{contract_location}} เมื่อวันที่ {{contract_date}}\nระหว่าง: {{company_name}} (\"ฝ่ายที่หนึ่ง\")\nและ: {{counterparty_name}} (\"ฝ่ายที่สอง\")\n\nคู่สัญญาทั้งสองฝ่ายตกลงเข้าทำสัญญามีข้อกำหนดและเงื่อนไขดังต่อไปนี้:",
        {
          left: 16,
          top: 14,
          width: currentWidth - 32,
          fontSize: 11,
          lineHeight: 1.55,
          fill: "#334155",
          fontFamily: "'Noto Sans Thai', sans-serif",
        }
      );
      group = new fabric.Group([preambleBg, preambleText], {
        left: currentMargin,
        top: currentMargin + 110,
      });
    } else if (presetKey === "contract_section") {
      const secTitle = new fabric.IText("ข้อ 1. วัตถุประสงค์และขอบเขตข้อตกลง (Scope & Objectives)", {
        left: 0,
        top: 0,
        width: currentWidth,
        fontSize: 13,
        fontWeight: "bold",
        fill: "#1E293B",
        fontFamily: "'Noto Sans Thai', sans-serif",
      });
      const secBody = new fabric.IText(
        "1.1 คู่สัญญาตกลงร่วมมือกันในการดำเนินงานตามขอบเขตและวัตถุประสงค์ที่ระบุไว้ในสัญญานี้\n1.2 แต่ละฝ่ายจะต้องปฏิบัติตามกฎหมายและมาตรฐานทางวิชาชีพที่เกี่ยวข้องอย่างเคร่งครัด\n1.3 ข้อตกลงเพิ่มเติมใด ๆ ให้ทำเป็นลายลักษณ์อักษรและลงนามโดยผู้มีอำนาจของทั้งสองฝ่าย",
        {
          left: 0,
          top: 28,
          width: currentWidth,
          fontSize: 11,
          lineHeight: 1.6,
          fill: "#475569",
          fontFamily: "'Noto Sans Thai', sans-serif",
        }
      );
      group = new fabric.Group([secTitle, secBody], {
        left: currentMargin,
        top: currentMargin + 250,
      });
    } else if (presetKey === "slide_bullets") {
      const t1 = new fabric.IText("✔ 1. สรุปภาพรวมและกลยุทธ์สำคัญขององค์กร", { left: 120, top: 200, fontSize: 24, fontWeight: "bold", fill: "#1E293B" });
      const t2 = new fabric.IText("✔ 2. ทิศทางการพัฒนาเทคโนโลยีและระบบอัตโนมัติ", { left: 120, top: 280, fontSize: 24, fontWeight: "bold", fill: "#1E293B" });
      const t3 = new fabric.IText("✔ 3. แผนการวัดผลและการรักษาเสถียรภาพระบบ 24/7", { left: 120, top: 360, fontSize: 24, fontWeight: "bold", fill: "#1E293B" });
      group = new fabric.Group([t1, t2, t3], { left: 120, top: 200 });
    } else if (presetKey === "checkbox") {
      const box = new fabric.Rect({ left: 0, top: 2, width: 16, height: 16, fill: "#FFFFFF", stroke: "#4B5563", strokeWidth: 1.5, rx: 3, ry: 3 });
      const label = new fabric.IText("ระบุตัวเลือกข้อความ (Checkbox)", { left: 24, top: 0, fontSize: 13, fill: "#1F2937", fontFamily: "'Noto Sans Thai', sans-serif" });
      group = new fabric.Group([box, label], { left: currentMargin, top: currentMargin + 80 });
    } else if (presetKey === "radio") {
      const outerCircle = new fabric.Circle({ left: 0, top: 2, radius: 8, fill: "#FFFFFF", stroke: "#4B5563", strokeWidth: 1.5 });
      const innerDot = new fabric.Circle({ left: 4, top: 6, radius: 4, fill: "#4F46E5" });
      const radioLabel = new fabric.IText("ระบุตัวเลือกข้อความ (Radio)", { left: 24, top: 0, fontSize: 13, fill: "#1F2937", fontFamily: "'Noto Sans Thai', sans-serif" });
      group = new fabric.Group([outerCircle, innerDot, radioLabel], { left: currentMargin, top: currentMargin + 80 });
    } else if (presetKey === "dropdown") {
      const ddBg = new fabric.Rect({ left: 0, top: 0, width: 220, height: 34, fill: "#F9FAFB", stroke: "#D1D5DB", strokeWidth: 1.2, rx: 6, ry: 6 });
      const ddText = new fabric.IText("เลือกรายการ...  ▾", { left: 12, top: 8, fontSize: 12, fill: "#6B7280", fontFamily: "'Noto Sans Thai', sans-serif" });
      group = new fabric.Group([ddBg, ddText], { left: currentMargin, top: currentMargin + 80 });
    } else if (presetKey === "attachment") {
      const attachBg = new fabric.Rect({ left: 0, top: 0, width: 240, height: 44, fill: "#F8FAFC", stroke: "#CBD5E1", strokeWidth: 1.5, rx: 8, ry: 8 });
      const attachText = new fabric.IText("📎 เอกสารแนบ (คลิกเพื่อดูไฟล์)", { left: 14, top: 13, fontSize: 12, fill: "#334155", fontWeight: "bold", fontFamily: "'Noto Sans Thai', sans-serif" });
      group = new fabric.Group([attachBg, attachText], { left: currentMargin, top: currentMargin + 100 });
    } else if (presetKey === "approve_stamp") {
      const stampBg = new fabric.Rect({ left: 0, top: 0, width: 170, height: 42, fill: "#ECFDF5", stroke: "#10B981", strokeWidth: 2, rx: 8, ry: 8 });
      const stampText = new fabric.IText("✔ อนุมัติแล้ว (APPROVED)", { left: 14, top: 12, fontSize: 12, fill: "#047857", fontWeight: "bold", fontFamily: "'Noto Sans Thai', sans-serif" });
      group = new fabric.Group([stampBg, stampText], { left: currentMargin, top: currentMargin + 120 });
    } else if (presetKey === "decline_stamp") {
      const decBg = new fabric.Rect({ left: 0, top: 0, width: 160, height: 42, fill: "#FEF2F2", stroke: "#EF4444", strokeWidth: 2, rx: 8, ry: 8 });
      const decText = new fabric.IText("✖ ปฏิเสธ (DECLINED)", { left: 16, top: 12, fontSize: 12, fill: "#B91C1C", fontWeight: "bold", fontFamily: "'Noto Sans Thai', sans-serif" });
      group = new fabric.Group([decBg, decText], { left: currentMargin, top: currentMargin + 120 });
    }

    if (group) {
      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.renderAll();
      handleHistoryPush(canvas);
    }
  }, [handleHistoryPush]);

  // 🛡️ Full Multi-Page Save Payload with 100% Guaranteed Raw Token Preservation Across ALL Pages
  const handleSaveAll = useCallback(async () => {
    if (!onSave) return;
    const canvas = fabricCanvasRef.current;

    // 1. Always force-restore raw tokens on active canvas before capturing final JSON
    if (canvas) {
      const activeObj = canvas.getActiveObject();
      if (activeObj && activeObj.isEditing && typeof activeObj.exitEditing === "function") {
        activeObj.exitEditing();
        if (activeObj._previewGeneratedText !== undefined && activeObj.text !== activeObj._previewGeneratedText) {
          activeObj.rawTemplateText = activeObj.text;
        } else if (!activeObj._previewGeneratedText) {
          activeObj.rawTemplateText = activeObj.text;
        }
      }
      applyTokensToCanvas(canvas, false);
      setIsPreviewTokens(false);
    }

    const currentJson = canvas ? canvas.toJSON(CUSTOM_CANVAS_PROPS) : null;

    // 2. 🛡️ CRITICAL MULTI-PAGE GUARD:
    // Strip mock preview values and force raw tokens across EVERY SINGLE PAGE in the document tree
    const allPages = pages.map((p, idx) => {
      const pageJson = idx === activePageIndex ? currentJson : p.json;
      return {
        ...p,
        json: revertTokensInPageJson(pageJson),
      };
    });

    try {
      await onSave({
        name: currentTitle,
        categoryName,
        editorType: editorType || "document",
        canvasPreset: canvasPreset || (editorType === "slide" ? "slide-16-9" : "a4-portrait"),
        pageCount: allPages.length,
        pages: allPages,
        marginMm,
        marginPx,
        showPageNumbers: showPageNumber,
      });

      hasUnsavedChangesRef.current = false;
      showToast("✨ บันทึกเทมเพลตเรียบร้อยแล้ว (ทำงานต่อได้ทันที)");
    } catch (err) {
      console.error("Save error:", err);
      showToast(`❌ ${err.message || "เกิดข้อผิดพลาดในการบันทึกเทมเพลต"}`);
    }
  }, [
    onSave,
    currentTitle,
    categoryName,
    editorType,
    canvasPreset,
    pages,
    activePageIndex,
    marginMm,
    marginPx,
    showPageNumber,
    showToast,
  ]);

  // Keyboard Shortcuts: Save, Copy, Paste, Duplicate, Select All, Nudge, Escape, Undo, Redo, Delete
  useEffect(() => {
    const handleKeyDown = async (e) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      const activeEl = document.activeElement;
      const isInputActive =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.isContentEditable);

      const activeObj = canvas.getActiveObject();
      const isTextEditing = activeObj && activeObj.isEditing;

      const isModifier = e.ctrlKey || e.metaKey;
      const code = e.code;

      // ── 0. Save (Ctrl+S / Cmd+S / Thai ห) ──
      const isSaveKey = code === "KeyS" || e.key === "s" || e.key === "S" || e.key === "ห";
      if (isModifier && isSaveKey && !e.shiftKey) {
        e.preventDefault();
        handleSaveAll();
        return;
      }

      // ── 1. Copy (Ctrl+C / Cmd+C / Thai แ) ──
      const isCopyKey = code === "KeyC" || e.key === "c" || e.key === "C" || e.key === "แ";
      if (isModifier && isCopyKey && !e.shiftKey) {
        if (isInputActive || isTextEditing) {
          return; // Allow standard browser text copying
        }
        e.preventDefault();
        handleCopy();
        return;
      }

      // ── 2. Paste (Ctrl+V / Cmd+V / Thai อ) ──
      const isPasteKey = code === "KeyV" || e.key === "v" || e.key === "V" || e.key === "อ";
      if (isModifier && isPasteKey && !e.shiftKey) {
        if (isInputActive || isTextEditing) {
          return; // Allow standard browser text pasting into input
        }
        e.preventDefault();
        handlePaste();
        return;
      }

      // ── 3. Duplicate (Ctrl+D / Cmd+D) ──
      if (isModifier && code === "KeyD" && !e.shiftKey) {
        if (isInputActive || isTextEditing) {
          return;
        }
        if (!activeObj) return;

        e.preventDefault();
        const duplicatedObj = await cloneFabricObject(activeObj, 20, 20);
        if (!duplicatedObj) return;

        canvas.discardActiveObject();

        if (duplicatedObj.type?.toLowerCase() === "activeselection") {
          duplicatedObj.canvas = canvas;
          duplicatedObj.forEachObject((obj) => {
            canvas.add(obj);
          });
          duplicatedObj.setCoords();
          canvas.setActiveObject(duplicatedObj);
          setActiveObject(duplicatedObj);
        } else {
          canvas.add(duplicatedObj);
          canvas.setActiveObject(duplicatedObj);
          setActiveObject(duplicatedObj);
        }

        canvas.requestRenderAll();
        handleHistoryPush(canvas);
        hasUnsavedChangesRef.current = true;
        return;
      }

      // ── 4. Select All (Ctrl+A / Cmd+A) ──
      if (isModifier && code === "KeyA" && !e.shiftKey) {
        if (isInputActive || isTextEditing) {
          return; // Allow native text select all in inputs/textboxes
        }

        e.preventDefault();
        const selectableObjects = canvas.getObjects().filter((obj) => {
          if (
            obj.locked ||
            obj.lockMovementX ||
            obj.lockMovementY ||
            obj.selectable === false
          ) {
            return false;
          }
          if (obj.isPageFooterNumber || obj.isSnapGuide || obj.excludeFromExport) {
            return false;
          }
          return true;
        });

        if (selectableObjects.length === 0) {
          canvas.discardActiveObject();
          canvas.requestRenderAll();
          setActiveObject(null);
        } else if (selectableObjects.length === 1) {
          canvas.setActiveObject(selectableObjects[0]);
          canvas.requestRenderAll();
          setActiveObject(selectableObjects[0]);
        } else {
          canvas.discardActiveObject();
          const selection = new fabric.ActiveSelection(selectableObjects, { canvas });
          canvas.setActiveObject(selection);
          canvas.requestRenderAll();
          setActiveObject(selection);
        }
        return;
      }

      // ── 5. Group (Ctrl+G / Cmd+G without Shift) ──
      if (isModifier && code === "KeyG" && !e.shiftKey) {
        if (isInputActive || isTextEditing) return;
        if (!activeObj || activeObj.type?.toLowerCase() !== "activeselection") return;

        const selectionObjects = activeObj.getObjects();
        if (selectionObjects.length < 2) return;

        // Custom Class Guard: reject grouping if DocTable or SignatureBlock is present
        const hasCustomClass = selectionObjects.some(
          (o) =>
            o.isDocTable ||
            o.type === "DocTable" ||
            o.type === "doctable" ||
            o.isSignatureBlock ||
            o.type === "SignatureBlock"
        );
        if (hasCustomClass) {
          alert("ไม่สามารถรวมกลุ่ม (Group) ตารางหรือบล็อกลงนามร่วมกับวัตถุอื่นได้");
          return;
        }

        e.preventDefault();
        canvas.discardActiveObject();
        selectionObjects.forEach((obj) => canvas.remove(obj));

        const newGroup = new fabric.Group(selectionObjects, {
          isUserGroup: true,
        });

        canvas.add(newGroup);
        canvas.setActiveObject(newGroup);
        setActiveObject(newGroup);
        canvas.requestRenderAll();
        handleHistoryPush(canvas);
        hasUnsavedChangesRef.current = true;
        return;
      }

      // ── 6. Ungroup (Ctrl+Shift+G / Cmd+Shift+G) ──
      if (isModifier && code === "KeyG" && e.shiftKey) {
        if (isInputActive || isTextEditing) return;
        if (!activeObj || !activeObj.isUserGroup || activeObj.type !== "group") return;

        e.preventDefault();
        const childObjects = [...activeObj.getObjects()];
        const absTransforms = childObjects.map((child) => child.calcTransformMatrix());

        canvas.discardActiveObject();
        canvas.remove(activeObj);

        childObjects.forEach((child, i) => {
          child.group = undefined;
          fabric.util.applyTransformToObject(child, absTransforms[i]);
          child.setCoords();
          canvas.add(child);
        });

        canvas.discardActiveObject();
        setActiveObject(null);
        canvas.requestRenderAll();
        handleHistoryPush(canvas);
        hasUnsavedChangesRef.current = true;
        return;
      }

      // ── 7. Arrow Key Nudge (ArrowUp, ArrowDown, ArrowLeft, ArrowRight) ──
      if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
      ) {
        if (isInputActive || isTextEditing) {
          return; // Allow cursor navigation inside text
        }
        if (!activeObj) return;

        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        let dx = 0;
        let dy = 0;

        if (e.key === "ArrowUp") dy = -step;
        else if (e.key === "ArrowDown") dy = step;
        else if (e.key === "ArrowLeft") dx = -step;
        else if (e.key === "ArrowRight") dx = step;

        activeObj.set({
          left: (activeObj.left ?? 0) + dx,
          top: (activeObj.top ?? 0) + dy,
        });
        activeObj.setCoords();
        canvas.requestRenderAll();
        hasUnsavedChangesRef.current = true;

        // Debounce history push (350ms) to avoid cluttering undo stack during rapid nudging
        if (nudgeTimerRef.current) {
          clearTimeout(nudgeTimerRef.current);
        }
        nudgeTimerRef.current = setTimeout(() => {
          handleHistoryPush(canvas);
          nudgeTimerRef.current = null;
        }, 350);
        return;
      }

      // ── 8. Escape (Esc) ──
      if (e.key === "Escape" || e.code === "Escape") {
        if (activeObj) {
          if (activeObj.isEditing) {
            activeObj.exitEditing();
            canvas.requestRenderAll();
          } else {
            canvas.discardActiveObject();
            canvas.requestRenderAll();
            setActiveObject(null);
          }
        }
        return;
      }

      // ── 9. Undo (Ctrl+Z / Cmd+Z) ──
      if (isModifier && code === "KeyZ" && !e.shiftKey) {
        if (isInputActive || isTextEditing) return;
        e.preventDefault();
        undo(canvas);
        hasUnsavedChangesRef.current = true;
        return;
      }

      // ── 10. Redo (Ctrl+Y / Cmd+Y or Ctrl+Shift+Z / Cmd+Shift+Z) ──
      if (
        (isModifier && code === "KeyY" && !e.shiftKey) ||
        (isModifier && e.shiftKey && code === "KeyZ")
      ) {
        if (isInputActive || isTextEditing) return;
        e.preventDefault();
        redo(canvas);
        hasUnsavedChangesRef.current = true;
        return;
      }

      // ── 11. Delete / Backspace ──
      if (e.key === "Delete" || e.key === "Backspace") {
        if (isInputActive || isTextEditing) {
          return; // Allow typing backspace in inputs and textboxes
        }
        if (activeObj) {
          e.preventDefault();
          if (activeObj.type?.toLowerCase() === "activeselection") {
            activeObj.forEachObject((obj) => canvas.remove(obj));
            canvas.discardActiveObject();
          } else {
            canvas.remove(activeObj);
            canvas.discardActiveObject();
          }
          canvas.renderAll();
          setActiveObject(null);
          handleHistoryPush(canvas);
          hasUnsavedChangesRef.current = true;
        }
        return;
      }

      // ── 12. Toggle Bold (Ctrl+B / Cmd+B) - Phase G.1 standard with e.code === "KeyB" ──
      if (isModifier && code === "KeyB" && !e.shiftKey) {
        if (isInputActive && !isTextEditing) return; // Don't intercept outside canvas
        if (!activeObj) return;

        const isTextObj =
          activeObj.type === "textbox" ||
          activeObj.type === "i-text" ||
          activeObj.type === "text";
        if (!isTextObj) return;

        e.preventDefault();
        const currentWeight = activeObj.fontWeight;
        const isBold = currentWeight === "bold" || Number(currentWeight) >= 600;
        const newWeight = isBold ? 400 : 700;

        if (activeObj.isEditing && activeObj.selectionStart !== activeObj.selectionEnd) {
          activeObj.setSelectionStyles({ fontWeight: newWeight });
        } else {
          activeObj.set("fontWeight", newWeight);
        }
        activeObj.dirty = true;
        canvas.requestRenderAll();
        setActiveObject(activeObj);
        handleHistoryPush(canvas);
        hasUnsavedChangesRef.current = true;
        return;
      }
      // ── 13. Spacebar Hand Tool (Hold Space to Pan) ──
      if (e.code === "Space" && !e.repeat) {
        if (isInputActive || isTextEditing) {
          return; // Allow typing space inside text!
        }
        e.preventDefault();
        isSpacePressedRef.current = true;
        setIsSpaceActive(true);
        return;
      }

      // ── 14. Toggle Hand Tool (H) & Select Tool (V) ──
      if (code === "KeyH" && !isModifier && !e.shiftKey) {
        if (isInputActive || isTextEditing) return;
        e.preventDefault();
        setIsHandToolActive((prev) => !prev);
        return;
      }
      if (code === "KeyV" && !isModifier && !e.shiftKey) {
        if (isInputActive || isTextEditing) return;
        e.preventDefault();
        setIsHandToolActive(false);
        return;
      }

      // ── 15. Fit to Screen (Shift + 1) ──
      if (e.shiftKey && (code === "Digit1" || code === "Numpad1") && !isModifier) {
        if (isInputActive || isTextEditing) return;
        e.preventDefault();
        handleFitToScreen();
        return;
      }

      // ── 16. Zoom to Selection (Shift + 2) ──
      if (e.shiftKey && (code === "Digit2" || code === "Numpad2") && !isModifier) {
        if (isInputActive || isTextEditing) return;
        e.preventDefault();
        handleZoomToSelection();
        return;
      }

      // ── 17. Zoom to 100% (Ctrl + 0 / Cmd + 0) ──
      if (isModifier && (code === "Digit0" || code === "Numpad0")) {
        if (isInputActive || isTextEditing) return;
        e.preventDefault();
        handleZoomTo100();
        return;
      }

      // ── 18. Zoom In (Ctrl + + / Ctrl + =) ──
      if (isModifier && (code === "Equal" || code === "NumpadAdd")) {
        if (isInputActive || isTextEditing) return;
        e.preventDefault();
        handleZoomIn();
        return;
      }

      // ── 19. Zoom Out (Ctrl + - / Ctrl + _) ──
      if (isModifier && (code === "Minus" || code === "NumpadSubtract")) {
        if (isInputActive || isTextEditing) return;
        e.preventDefault();
        handleZoomOut();
        return;
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === "Space") {
        isSpacePressedRef.current = false;
        setIsSpaceActive(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (nudgeTimerRef.current) {
        clearTimeout(nudgeTimerRef.current);
        nudgeTimerRef.current = null;
      }
    };
  }, [undo, redo, handleHistoryPush, handleFitToScreen, handleZoomToSelection, handleZoomTo100, handleZoomIn, handleZoomOut, handleCopy, handlePaste, handleSaveAll]);

  // 🚀 Export Native Microsoft PowerPoint (.pptx) Handler
  const handleExportPptx = async () => {
    try {
      setIsExportingPptx(true);
      const canvas = fabricCanvasRef.current;
      const currentJson = canvas ? canvas.toJSON(CUSTOM_CANVAS_PROPS) : null;

      // Ensure active page is updated in pages list
      const allPages = pages.map((p, idx) => {
        const pageJson = idx === activePageIndex ? currentJson : p.json;
        return {
          ...p,
          json: pageJson,
        };
      });

      const res = await fetch("/api/export-pptx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: currentTitle || "Presentation",
          canvasPreset: preset.id,
          editorType: "slide",
          pages: allPages,
          fileName: `${currentTitle || "presentation"}.pptx`,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "สร้างไฟล์ PowerPoint ไม่สำเร็จ");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(currentTitle || "presentation").replace(/[/\\?%*:|"<>]/g, "_")}.pptx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export PPTX error:", err);
      alert(err.message || "เกิดข้อผิดพลาดในการดาวน์โหลด .pptx");
    } finally {
      setIsExportingPptx(false);
    }
  };

  // 🖼️ Export PNG Handler — exports each page as a high-res PNG file
  const handleExportPng = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    try {
      setIsExportingPng(true);

      // Save current active page JSON
      const currentPageJson = canvas.toJSON(CUSTOM_CANVAS_PROPS);
      const allPages = pages.map((p, idx) =>
        idx === activePageIndex ? { ...p, json: currentPageJson } : p
      );

      const safeName = (currentTitle || "template").replace(/[/\\?%*:|"<>]/g, "_");

      // Helper: hide snap guides / page number decorators, export, then restore
      const captureCanvasPng = () => {
        const objects = canvas.getObjects();
        const hidden = [];
        objects.forEach((obj) => {
          if (obj.isSnapGuide || obj.isPageFooterNumber || obj.excludeFromExport) {
            obj.set("visible", false);
            hidden.push(obj);
          }
        });
        canvas.discardActiveObject();
        canvas.renderAll();
        // Dynamically compute multiplier based on current zoom so the exported PNG matches exact template preset dimensions
        const exportMultiplier = zoom > 0 ? 1 / zoom : 1;
        const dataUrl = canvas.toDataURL({ format: "png", quality: 1, multiplier: exportMultiplier });
        hidden.forEach((obj) => obj.set("visible", true));
        canvas.renderAll();
        return dataUrl;
      };

      // Helper: trigger browser download
      const downloadPng = (dataUrl, fileName) => {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
      };

      if (allPages.length === 1) {
        // Single page — export directly from the live canvas
        const dataUrl = captureCanvasPng();
        downloadPng(dataUrl, `${safeName}.png`);
      } else {
        // Multi-page — load each page into the live canvas, capture, then restore
        for (let i = 0; i < allPages.length; i++) {
          const page = allPages[i];
          if (!page.json) continue;

          if (i !== activePageIndex) {
            // Temporarily load the target page onto the canvas
            await canvas.loadFromJSON(page.json);
          }

          const dataUrl = captureCanvasPng();
          downloadPng(dataUrl, `${safeName}_หน้า${i + 1}.png`);

          if (i !== activePageIndex) {
            // Restore the original active page
            await canvas.loadFromJSON(currentPageJson);
            canvas.renderAll();
          }

          // Small delay between downloads to avoid browser blocking
          if (i < allPages.length - 1) {
            await new Promise((r) => setTimeout(r, 350));
          }
        }
      }
    } catch (err) {
      console.error("Export PNG error:", err);
      alert(err.message || "เกิดข้อผิดพลาดในการ Export PNG");
    } finally {
      setIsExportingPng(false);
    }
  };

  return (
    <div className="h-screen bg-[#F1F3F6] flex flex-col overflow-hidden">
      {/* ── TOP TOOLBAR ── */}
      <TopToolbar
        templateName={currentTitle}
        onUpdateTemplateName={(newTitle) => {
          setCurrentTitle(newTitle);
          hasUnsavedChangesRef.current = true;
        }}
        categoryName={categoryName}
        editorType={editorType}
        canvasPreset={preset.id}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onFitToScreen={handleFitToScreen}
        onZoomTo100={handleZoomTo100}
        onZoomToSelection={handleZoomToSelection}
        onResetPan={handleResetPan}
        onSetCustomZoom={handleSetCustomZoom}
        isHandToolActive={isHandToolActive}
        onToggleHandTool={() => setIsHandToolActive((prev) => !prev)}
        showRuler={showRuler}
        onToggleRuler={() => setShowRuler(!showRuler)}
        showMargin={showMargin}
        onToggleMargin={() => setShowMargin(!showMargin)}
        marginMm={marginMm}
        marginPx={marginPx}
        onUpdateMargin={handleUpdateMargin}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={() => {
          undo(fabricCanvasRef.current);
          hasUnsavedChangesRef.current = true;
        }}
        onRedo={() => {
          redo(fabricCanvasRef.current);
          hasUnsavedChangesRef.current = true;
        }}
        onSave={handleSaveAll}
        saving={saving}
        onOpenShare={templateId ? () => setIsShareModalOpen(true) : null}
        showPageNumber={showPageNumber}
        onTogglePageNumber={handleTogglePageNumber}
        isPreviewTokens={isPreviewTokens}
        onTogglePreviewTokens={handleTogglePreviewTokens}
        onExportPptx={handleExportPptx}
        isExportingPptx={isExportingPptx}
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen((prev) => !prev)}
        canCopy={Boolean(activeObject)}
        onCopy={handleCopy}
        onPaste={handlePaste}
      />

      {/* ── MAIN STUDIO BODY: LEFT SIDEBAR + CANVAS + RIGHT SIDEBAR ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Tool Sidebar */}
        {isLeftSidebarOpen && (
          <LeftSidebar
            editorType={editorType}
            templateId={templateId}
            pages={pages}
            onAddText={handleAddText}
            onAddShape={handleAddShape}
            onAddIcon={handleAddIcon}
            onAddImage={handleAddImage}
            onAddPreset={handleAddPreset}
            onAddTable={handleAddTable}
            onAddSignature={handleAddSignature}
            onInsertToken={handleInsertToken}
            isReplacingIcon={Boolean(activeObject && (activeObject.isIcon || activeObject.type === "path"))}
            onClose={() => setIsLeftSidebarOpen(false)}
          />
        )}

        {/* Center Canvas Stage (Canva-Style Vertical Multi-Page View) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#F1F3F6] relative">
          <main
            ref={mainContainerRef}
            tabIndex={0}
            className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col items-center py-8 px-4 outline-none select-none scroll-smooth bg-[#F1F3F6]"
          >
            <div className="flex flex-col items-center w-full space-y-6">
              {pages.map((p, idx) => {
                const isActive = idx === activePageIndex;
                return (
                  <div
                    key={p.id || `page-${idx}`}
                    ref={(el) => {
                      pageRefs.current[idx] = el;
                    }}
                    className="flex flex-col items-center w-full"
                    style={{ maxWidth: Math.round(preset.width * zoom) + 24 }}
                  >
                    {/* 📄 Page Header Bar (Canva Style) */}
                    <div
                      className="w-full flex items-center justify-between pb-2 px-1 select-none"
                      style={{ maxWidth: Math.round(preset.width * zoom) }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full transition-colors ${
                            isActive
                              ? "bg-indigo-600 text-white shadow-2xs"
                              : "bg-gray-200/80 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          หน้า {idx + 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Move Up */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMovePage(idx, "up");
                          }}
                          disabled={idx === 0}
                          title="เลื่อนหน้าขึ้น"
                          className="p-1 rounded-md hover:bg-gray-200 text-gray-600 hover:text-gray-900 disabled:opacity-25 disabled:pointer-events-none cursor-pointer transition-colors"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>

                        {/* Move Down */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMovePage(idx, "down");
                          }}
                          disabled={idx === pages.length - 1}
                          title="เลื่อนหน้าลง"
                          className="p-1 rounded-md hover:bg-gray-200 text-gray-600 hover:text-gray-900 disabled:opacity-25 disabled:pointer-events-none cursor-pointer transition-colors"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>

                        {/* Duplicate */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicatePage(idx);
                          }}
                          title="ทำซ้ำหน้านี้ (Duplicate)"
                          className="p-1 rounded-md hover:bg-gray-200 text-gray-600 hover:text-gray-900 cursor-pointer transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePage(idx);
                          }}
                          disabled={pages.length <= 1}
                          title="ลบหน้านี้"
                          className="p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 disabled:opacity-25 disabled:pointer-events-none cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* 🎨 Canvas or Static Preview */}
                    {isActive ? (
                      <CanvasStage
                        zoom={zoom}
                        pan={pan}
                        isPanning={isPanning}
                        isSpaceActive={isSpaceActive}
                        isHandToolActive={isHandToolActive}
                        showRuler={showRuler}
                        showMargin={showMargin}
                        marginPx={marginPx}
                        marginMm={marginMm}
                        canvasPreset={preset.id}
                        onCanvasReady={handleCanvasReady}
                        onHistoryPush={handleHistoryPush}
                        onSelectionChange={setActiveObject}
                      />
                    ) : (
                      <StaticPagePreview
                        page={p}
                        pageIndex={idx}
                        totalPages={pages.length}
                        zoom={zoom}
                        preset={preset}
                        onClick={() => handleSelectPage(idx)}
                      />
                    )}

                    {/* ➕ Canva Between-Page Divider */}
                    {idx < pages.length - 1 && (
                      <div
                        className="w-full flex items-center justify-center pt-8 pb-2 group/divider relative"
                        style={{ maxWidth: Math.round(preset.width * zoom) }}
                      >
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed border-gray-300 group-hover/divider:border-indigo-400 transition-colors" />
                        <button
                          type="button"
                          onClick={() => handleAddPageBetween(idx)}
                          className="relative z-10 px-3.5 py-1 bg-white hover:bg-indigo-50 border border-gray-300 hover:border-indigo-400 text-gray-600 hover:text-indigo-600 rounded-full text-xs font-medium shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>เพิ่มหน้า</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ➕ Canva Bottom Add Page Button */}
              <div
                className="w-full flex flex-col items-center justify-center pt-4 pb-16"
                style={{ maxWidth: Math.round(preset.width * zoom) }}
              >
                <button
                  type="button"
                  onClick={handleAddPage}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-dashed border-indigo-300 hover:border-indigo-500 bg-white hover:bg-indigo-50/60 text-indigo-700 font-semibold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มหน้าใหม่</span>
                </button>
              </div>
            </div>

            {/* 💡 Floating Viewport Status & Zoom Bar (Canva Style) */}
            <div className="fixed bottom-4 right-8 z-30 flex items-center gap-2 bg-white/95 backdrop-blur-md border border-gray-200/90 shadow-lg rounded-full px-3.5 py-1.5 text-xs text-gray-700 select-none">
              <span className="font-semibold text-gray-600 text-[11px] pr-2 border-r border-gray-200">
                หน้า {activePageIndex + 1} / {pages.length}
              </span>
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 hover:bg-gray-100 rounded-md cursor-pointer text-gray-600 hover:text-gray-900 transition-colors"
                title="ย่อ (Ctrl + -)"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono font-bold text-xs text-indigo-700 min-w-[36px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 hover:bg-gray-100 rounded-md cursor-pointer text-gray-600 hover:text-gray-900 transition-colors"
                title="ขยาย (Ctrl + +)"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleFitToScreen}
                className="ml-1 px-2.5 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-[10px] font-semibold cursor-pointer transition-colors"
                title="พอดีจอ (Shift+1)"
              >
                พอดีจอ
              </button>
            </div>
          </main>
        </div>

        {/* Right Properties & Layers Sidebar */}
        <RightSidebar
          canvas={canvasInstance}
          activeObject={activeObject}
          canvasPreset={preset.id}
          marginMm={marginMm}
          marginPx={marginPx}
          onUpdateMargin={handleUpdateMargin}
          onPushHistory={handleHistoryPush}
          onCopy={handleCopy}
          onPaste={handlePaste}
        />
      </div>

      {/* 🍞 Interactive Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-none border border-white/10">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 🛡️ Template Share & Permissions Modal */}
      {isShareModalOpen && templateId && (
        <TemplateShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          template={{ id: templateId, name: currentTitle }}
        />
      )}
    </div>
  );
}