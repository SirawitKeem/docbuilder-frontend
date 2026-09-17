"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";

export default function TemplateEditorError({ error, reset }) {
  useEffect(() => {
    console.error("Template Editor Error:", error);
  }, [error]);

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-gray-50/50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200/80 p-8 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">
          เกิดข้อผิดพลาดในการโหลดตัวแก้ไข
        </h2>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          ไม่สามารถเปิดตัวแก้ไขเทมเพลตได้ในขณะนี้ อาจเกิดจากข้อมูลวัตถุหรือการเชื่อมต่อ
          กรุณาลองรีโหลดใหม่อีกครั้ง หรือกลับไปยังหน้ารายการเทมเพลต
        </p>

        {error?.message && (
          <div className="bg-red-50/70 border border-red-200/60 rounded-xl p-3 mb-6 text-left">
            <span className="text-[10px] font-bold text-red-700 uppercase block mb-1">
              ข้อผิดพลาดที่พบ:
            </span>
            <p className="font-mono text-xs text-red-900 break-words line-clamp-3">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ลองใหม่อีกครั้ง (Retry)</span>
          </button>

          <Link
            href="/templates"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้ารายการเทมเพลต</span>
          </Link>

          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-gray-600 py-1 transition-colors"
          >
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
