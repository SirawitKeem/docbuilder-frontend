"use client";

import React, { useState, useEffect } from "react";
import { FolderSymlink, Check, X, Loader2, AlertCircle } from "lucide-react";
import { EXTENDED_ICON_MAP } from "@/components/templates/CreateCategoryModal";
import { COLOR_MAP } from "@/components/templates/CategoryManagerModal";
import { useLanguage } from "@/context/LanguageContext";

export default function MoveCategoryModal({
  isOpen,
  onClose,
  template,
  categories = [],
  onSuccess,
}) {
  const { t } = useLanguage();
  const [targetCategoryId, setTargetCategoryId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (template) {
      setTargetCategoryId(template.categoryId || "");
      setError("");
    }
  }, [template, isOpen]);

  if (!isOpen || !template) return null;

  const currentCategory = categories.find((c) => c.id === template.categoryId);

  const handleMove = async () => {
    if (!targetCategoryId) {
      setError("กรุณาเลือกหมวดหมู่ปลายทาง");
      return;
    }
    if (targetCategoryId === template.categoryId) {
      setError("เทมเพลตนี้อยู่ในหมวดหมู่นี้อยู่แล้ว");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: targetCategoryId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาดในการย้ายหมวดหมู่");
      }

      if (onSuccess) {
        onSuccess(targetCategoryId);
      }
      onClose();
    } catch (err) {
      console.error("Move category error:", err);
      setError(err.message || "Failed to move template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl p-6 space-y-5 z-10 animate-in fade-in zoom-in-95 duration-150 text-left">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center shrink-0">
              <FolderSymlink size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                ย้ายหมวดหมู่เอกสาร
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                เลือกหมวดหมู่ใหม่สำหรับเทมเพลตนี้
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Template Info Card */}
        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-2">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            เทมเพลตที่เลือก
          </div>
          <div className="text-sm font-semibold text-foreground truncate">
            {template.name}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border/60">
            <span>หมวดหมู่ปัจจุบัน:</span>
            <span className="font-medium text-foreground bg-surface px-2 py-0.5 rounded-md border border-border shadow-2xs">
              {currentCategory?.name || template.categoryId}
            </span>
          </div>
        </div>

        {/* Category Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-foreground">
            หมวดหมู่ปลายทาง (Destination Category)
          </label>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {categories.map((cat) => {
              const iconData = EXTENDED_ICON_MAP[cat.icon];
              const Icon = iconData ? iconData.icon : FolderSymlink;
              const colorClass = COLOR_MAP[cat.color] || COLOR_MAP.purple;
              const isSelected = targetCategoryId === cat.id;
              const isCurrent = cat.id === template.categoryId;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setTargetCategoryId(cat.id);
                    setError("");
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5 text-foreground shadow-2xs"
                      : "border-border hover:border-neutral-300 dark:hover:border-neutral-700 bg-surface hover:bg-muted/30 text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-[6px] flex items-center justify-center border ${colorClass.bg} ${colorClass.text} ${colorClass.border} shrink-0`}
                    >
                      <Icon size={14} />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                        <span>{cat.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-normal text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                            (ปัจจุบัน)
                          </span>
                        )}
                      </div>
                      {cat.fullName && (
                        <div className="text-[11px] text-muted-foreground truncate">
                          {cat.fullName}
                        </div>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="size-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                      <Check size={12} strokeWidth={2.5} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-9 px-4 rounded-xl border border-border bg-surface hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleMove}
            disabled={saving || !targetCategoryId || targetCategoryId === template.categoryId}
            className="primary-button h-9 px-4 rounded-xl text-white text-xs font-medium inline-flex items-center gap-2 shadow-xs cursor-pointer hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>กำลังย้าย...</span>
              </>
            ) : (
              <>
                <FolderSymlink size={14} />
                <span>ย้ายหมวดหมู่</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
