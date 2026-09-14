"use client";

import React, { useState, useEffect } from "react";
import { Edit3, Check, X, Loader2, AlertCircle, Sparkles, Folder } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function EditTemplateModal({
  isOpen,
  onClose,
  template,
  categories = [],
  onSuccess,
}) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    badge: "Standard",
    description: "",
    categoryId: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (template && isOpen) {
      setFormData({
        name: template.name || "",
        badge: template.badge || "Standard",
        description: template.description || "",
        categoryId: template.categoryId || "",
      });
      setError("");
    }
  }, [template, isOpen]);

  if (!isOpen || !template) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("กรุณากรอกชื่อเทมเพลต (Please enter template name)");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          badge: formData.badge.trim() || "Standard",
          description: formData.description.trim(),
          categoryId: formData.categoryId || template.categoryId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูลเทมเพลต");
      }

      if (onSuccess) {
        await onSuccess();
      }
      onClose();
    } catch (err) {
      console.error("Save template error:", err);
      setError(err.message || "Failed to save template info");
    } finally {
      setSaving(false);
    }
  };

  const isStandard = formData.badge === "Standard" || formData.badge === "มาตรฐาน";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-surface border border-border rounded-[14px] shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
              <Edit3 size={17} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground leading-tight">
                ตั้งค่าและแก้ไขเทมเพลต (Edit Template)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                กำหนดชื่อ รายละเอียด และสถานะ Standard / Custom
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[6px] text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-[8px] bg-destructive/10 border border-destructive/20 text-xs font-medium text-destructive flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Template Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">
              ชื่อเทมเพลต (Template Name) <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. สัญญาจ้างบริการมาตรฐาน"
              className="w-full h-9 px-3 rounded-[8px] border border-border bg-surface text-xs font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-2xs"
            />
          </div>

          {/* Template Type / Badge (Standard vs Custom) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">
              ประเภทเทมเพลต (Template Type / Badge)
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="inline-flex items-center p-1 bg-muted/40 rounded-[8px] border border-border shrink-0 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, badge: "Standard" })}
                  className={`h-7 px-3 rounded-[6px] text-xs font-medium transition-all select-none cursor-pointer ${
                    isStandard
                      ? "bg-emerald-600 text-white font-semibold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Standard (มาตรฐาน)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, badge: "Custom" })}
                  className={`h-7 px-3 rounded-[6px] text-xs font-medium transition-all select-none cursor-pointer ${
                    !isStandard
                      ? "bg-primary text-white font-semibold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Custom (กำหนดเอง)
                </button>
              </div>
              <input
                type="text"
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                placeholder="ป้ายกำกับ เช่น Standard, กำหนดเอง, ฉบับร่าง"
                className="h-8 px-2.5 rounded-[6px] border border-border bg-surface text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 flex-1 shadow-2xs"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {isStandard
                ? "✓ เทมเพลตนี้จะแสดงป้าย 'Standard' สีเขียวสำหรับเอกสารที่เป็นแบบแผนทางการ"
                : "✦ เทมเพลตนี้จะแสดงป้ายกำหนดเองสำหรับเอกสารเฉพาะทาง"}
            </p>
          </div>

          {/* Category Selection */}
          {categories.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                หมวดหมู่เอกสาร (Category)
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full h-9 px-3 rounded-[8px] border border-border bg-surface text-xs text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-2xs"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {cat.fullName ? `(${cat.fullName})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">
              คำอธิบายเทมเพลต (Description)
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="ระบุรายละเอียดการใช้งาน เช่น โครงสร้างสัญญาและข้อกำหนดที่สำคัญ..."
              className="w-full p-2.5 rounded-[8px] border border-border bg-surface text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-2xs resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2 bg-surface">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-9 px-3.5 rounded-[8px] border border-border bg-surface hover:bg-muted text-xs font-medium text-foreground transition-all cursor-pointer"
            >
              {t('actions.cancel') || "ยกเลิก"}
            </button>
            <button
              type="submit"
              disabled={saving || !formData.name.trim()}
              className="primary-button h-9 px-4 rounded-[8px] text-white text-xs font-medium shadow-xs hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>บันทึกการแก้ไข (Save)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
