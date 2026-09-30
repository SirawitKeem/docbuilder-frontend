"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";

export default function TemplatesPageError({ error, reset }) {
  useEffect(() => {
    console.error("Templates Hub Error:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 text-foreground font-sans">
      <div className="max-w-md w-full bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl border border-gray-200/80 dark:border-gray-800 p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            ไม่สามารถโหลดหน้ารายการเทมเพลตได้
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            อาจเกิดจากการดึงข้อมูลเทมเพลตหรือการเชื่อมต่อฐานข้อมูล กรุณาลองโหลดใหม่อีกครั้ง
          </p>
        </div>

        {error?.message && (
          <div className="bg-red-50/70 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900/40 rounded-xl p-3 text-left">
            <span className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase block mb-1">
              สาเหตุข้อผิดพลาด:
            </span>
            <p className="font-mono text-xs text-red-900 dark:text-red-200 break-words line-clamp-3">
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
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้าหลัก (Back to Home)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
