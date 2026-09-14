"use client";

import React, { useRef, useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  X,
  PenTool,
  Upload,
  RotateCcw,
  Check,
  Trash2,
} from "lucide-react";

export default function SignaturePadModal({
  title = "ลงลายมือชื่อดิจิทัล",
  partyName = "ผู้มีอำนาจลงนาม",
  onSave,
  onClose,
}) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("draw"); // 'draw' | 'upload'
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [inkColor, setInkColor] = useState("#0f172a"); // Dark Navy / Slate

  // Setup Canvas
  useEffect(() => {
    if (activeTab !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = inkColor;
  }, [activeTab, inkColor]);

  // Drawing Handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    if (e.cancelable) e.preventDefault();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Upload Handler
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result);
    };
    reader.readAsDataURL(file);
  };

  // Save Signature
  const handleConfirm = () => {
    if (activeTab === "draw") {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      const dataUrl = canvas.toDataURL("image/png");
      onSave(dataUrl);
    } else if (activeTab === "upload") {
      if (!uploadedImage) return;
      onSave(uploadedImage);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5E5E5] rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left select-none">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center">
              <PenTool size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 leading-tight">
                {title === "ลงลายมือชื่อดิจิทัล" ? t('signature.title') : title}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">{partyName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-6 pt-4 flex items-center gap-2 border-b border-gray-100">
          <button
            type="button"
            onClick={() => setActiveTab("draw")}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "draw"
                ? "border-[#7C3AED] text-[#7C3AED]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <PenTool size={14} />
            <span>{t('signature.drawLive')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "upload"
                ? "border-[#7C3AED] text-[#7C3AED]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Upload size={14} />
            <span>{t('signature.uploadImage')}</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-4">
          {activeTab === "draw" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="text-[11px] font-medium">วาดลายเซ็นของคุณภายในกรอบด้านล่าง:</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px]">สีหมึก:</span>
                  <button
                    type="button"
                    onClick={() => setInkColor("#0f172a")}
                    className={`w-4 h-4 rounded-full bg-[#0f172a] border cursor-pointer ${
                      inkColor === "#0f172a" ? "ring-2 ring-purple-400" : ""
                    }`}
                    title="สีน้ำเงินเข้ม / สีกรมท่า"
                  />
                  <button
                    type="button"
                    onClick={() => setInkColor("#1d4ed8")}
                    className={`w-4 h-4 rounded-full bg-[#1d4ed8] border cursor-pointer ${
                      inkColor === "#1d4ed8" ? "ring-2 ring-purple-400" : ""
                    }`}
                    title="สีน้ำเงินสด"
                  />
                  <button
                    type="button"
                    onClick={() => setInkColor("#000000")}
                    className={`w-4 h-4 rounded-full bg-black border cursor-pointer ${
                      inkColor === "#000000" ? "ring-2 ring-purple-400" : ""
                    }`}
                    title="สีดำ"
                  />
                </div>
              </div>

              {/* Canvas Pad */}
              <div className="relative border-2 border-dashed border-gray-200 rounded-2xl bg-[#FAFAFC] overflow-hidden group">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-44 cursor-crosshair touch-none"
                />

                {!hasDrawn && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-gray-300 text-xs font-medium">
                    {t('signature.placeholder')}
                  </div>
                )}

                {hasDrawn && (
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 shadow-sm border border-gray-200 text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
                    title={t('signature.clear')}
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-[11px] font-semibold text-gray-600 block">
                เลือกไฟล์รูปลายเซ็น (แนะนำไฟล์ PNG พื้นหลังโปร่งใส):
              </label>

              {uploadedImage ? (
                <div className="relative border border-gray-200 rounded-2xl p-4 bg-gray-50 flex flex-col items-center justify-center h-44">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadedImage}
                    alt="Uploaded Signature"
                    className="max-h-28 max-w-[280px] object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setUploadedImage(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white shadow-sm border border-gray-200 text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    title="ลบรูปภาพ"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-gray-200 hover:border-[#7C3AED] rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-[#FAFAFC] hover:bg-[#F5F3FF]/30 transition-all h-44">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center">
                    <Upload size={18} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">คลิกเพื่ออัปโหลดรูปลายเซ็น</span>
                  <span className="text-[10px] text-gray-400">รองรับไฟล์ PNG, JPG, WEBP (สูงสุด 2MB)</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-surface border-t border-border flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-9 px-4 rounded-[8px] border border-border text-foreground hover:bg-muted text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            {t('actions.cancel')}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={activeTab === "draw" ? !hasDrawn : !uploadedImage}
            className="primary-button inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] text-white text-xs font-medium hover:opacity-95 disabled:opacity-40 transition-all shadow-xs cursor-pointer"
          >
            <Check size={14} />
            <span>{t('signature.apply')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
