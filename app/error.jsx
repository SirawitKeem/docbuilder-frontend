"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("DocBuilder Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 text-foreground font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200/80 p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            เกิดข้อผิดพลาดในการโหลดหน้าเว็บ
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            ระบบพบปัญหาในการประมวลผลข้อมูลชั่วคราว คุณสามารถลองโหลดใหม่อีกครั้ง หรือกลับสู่หน้าหลัก
          </p>
        </div>

        {error?.message && (
          <div className="bg-red-50/70 border border-red-200/60 rounded-xl p-3 text-left">
            <span className="text-[10px] font-bold text-red-700 uppercase block mb-1">
              ข้อผิดพลาดที่พบ (Technical Details):
            </span>
            <p className="font-mono text-xs text-red-900 break-words line-clamp-3">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary hover:opacity-95 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ลองใหม่อีกครั้ง (Reload)</span>
          </button>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>กลับสู่หน้าหลัก (Back to Home)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
