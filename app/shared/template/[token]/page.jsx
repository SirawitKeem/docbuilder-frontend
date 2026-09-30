"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import FabricPrintRenderer from "@/components/document/FabricPrintRenderer";
import { getCanvasPreset } from "@/lib/editor/canvasPresets";
import { Lock, FileText, Download, Printer, Shield, AlertTriangle, Eye, ChevronLeft, ChevronRight } from "lucide-react";

export default function SharedTemplateViewer() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSharedTemplate = async (password = null) => {
    try {
      setLoading(true);
      setError(null);
      setPasswordError("");

      const headers = {};
      if (password) {
        headers["x-share-password"] = password;
      }

      const res = await fetch(`/api/shared-templates/${token}`, { headers });
      const json = await res.json();

      if (res.status === 401) {
        setPasswordRequired(true);
        if (password) setPasswordError(json.error || "รหัสผ่านไม่ถูกต้อง");
        return;
      }

      if (!res.ok) {
        setError(json.error || "ไม่สามารถโหลดเทมเพลตได้");
        return;
      }

      setPasswordRequired(false);
      setData(json);
    } catch (err) {
      console.error("Error loading shared template:", err);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSharedTemplate();
    }
  }, [token]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    fetchSharedTemplate(passwordInput.trim());
  };

  if (loading && !data && !passwordRequired) {
    return (
      <div className="min-h-screen bg-[#F1F3F6] flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-gray-600">กำลังโหลดเอกสารที่แชร์...</p>
        </div>
      </div>
    );
  }

  // Password Entry Screen
  if (passwordRequired) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl border border-gray-200/80 p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Lock size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">เอกสารนี้ได้รับการป้องกันด้วยรหัสผ่าน</h2>
            <p className="text-xs text-gray-500 mt-1">กรุณากรอกรหัสผ่านเพื่อเข้าดูเอกสาร</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="รหัสผ่านเข้าดูเอกสาร..."
              required
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs outline-none focus:border-primary"
            />
            {passwordError && (
              <p className="text-xs text-red-600 font-medium text-left">{passwordError}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-xl bg-primary text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {loading ? "กำลังตรวจสอบ..." : "เข้าสู่เอกสาร"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200/80 p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-base font-bold text-gray-900">ไม่สามารถเปิดเอกสารได้</h2>
          <p className="text-xs text-gray-500 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  const pages = data?.pages || [];
  const totalPages = pages.length || 1;
  const activePageIndex = Math.max(0, Math.min(currentPage - 1, totalPages - 1));
  const activePage = pages[activePageIndex] ? [pages[activePageIndex]] : pages;
  const singlePageTemplate = { ...data, pages: activePage };

  const preset = getCanvasPreset(
    data?.canvasPreset || (data?.editorType === "slide" ? "slide-16-9" : "a4-portrait")
  );
  const targetWidth = Math.min(800, preset.width);
  const scale = targetWidth / preset.width;

  return (
    <div className="min-h-screen bg-[#E5E9F0] flex flex-col font-sans">
      {/* Top Bar */}
      <header className="h-14 bg-white border-b border-gray-200/80 px-6 flex items-center justify-between shadow-2xs sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileText size={16} />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
              {data?.templateName || "เอกสารแชร์ภายนอก"}
            </h1>
            <span className="text-[10px] text-gray-400">
              โหมด: {data?.shareType === "fillable" ? "สามารถกรอกข้อมูลได้" : "ดูตัวอย่างอย่างเดียว (Read-only)"}
            </span>
          </div>
        </div>

        {/* Pagination & Print */}
        <div className="flex items-center gap-2">
          {totalPages > 1 && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 text-xs text-gray-700">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded hover:bg-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-1 text-[11px] font-semibold">
                หน้า {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded hover:bg-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="h-8 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer size={13} />
            <span className="hidden sm:inline">พิมพ์</span>
          </button>
        </div>
      </header>

      {/* Main Canvas Viewer */}
      <main className="flex-1 flex items-center justify-center p-6 overflow-auto">
        <div
          className="rounded-sm shadow-2xl border border-gray-300 overflow-hidden bg-white"
          style={{
            width: Math.round(preset.width * scale),
            height: Math.round(preset.height * scale),
          }}
        >
          <div
            style={{
              width: preset.width,
              height: preset.height,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <FabricPrintRenderer
              template={singlePageTemplate}
              values={{}}
              watermark={data?.governancePolicy?.enforce_watermark || "none"}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
