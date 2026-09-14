"use client";

import React, { useState } from "react";
import {
  X,
  Plus,
  FolderPlus,
  FileSignature,
  Megaphone,
  Users,
  ClipboardList,
  Receipt,
  Building2,
  Handshake,
  FileText,
  Shield,
  Briefcase,
  GraduationCap,
  Award,
  Package,
  Bookmark,
  CreditCard,
  Folder,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export const EXTENDED_ICON_MAP = {
  FileText: { icon: FileText, label: "เอกสารทั่วไป" },
  Receipt: { icon: Receipt, label: "ใบเสนอราคา/การเงิน" },
  FileSignature: { icon: FileSignature, label: "สัญญา/ข้อตกลง" },
  Handshake: { icon: Handshake, label: "พันธมิตร" },
  Building2: { icon: Building2, label: "ตัวแทนจำหน่าย/องค์กร" },
  Shield: { icon: Shield, label: "ความปลอดภัย/NDA" },
  Briefcase: { icon: Briefcase, label: "งานธุรกิจ/HR" },
  ClipboardList: { icon: ClipboardList, label: "แบบฟอร์ม/คำร้อง" },
  Award: { icon: Award, label: "ใบรับรอง/Certificate" },
  CreditCard: { icon: CreditCard, label: "ใบแจ้งหนี้/การชำระเงิน" },
  Package: { icon: Package, label: "จัดซื้อ/สต็อกสินค้า" },
  Bookmark: { icon: Bookmark, label: "บันทึก/ระเบียบ" },
  Megaphone: { icon: Megaphone, label: "ประกาศองค์กร" },
  Users: { icon: Users, label: "บุคลากร/ทีมงาน" },
  GraduationCap: { icon: GraduationCap, label: "การฝึกอบรม/ศึกษา" },
  Folder: { icon: Folder, label: "โฟลเดอร์แฟ้มงาน" },
};

const COLOR_OPTIONS = [
  { id: "purple", name: "Purple", nameTH: "ม่วง", hex: "#7C3AED", bg: "bg-[#F5F3FF]", text: "text-[#7C3AED]", border: "border-[#EDE9FE]" },
  { id: "blue", name: "Blue", nameTH: "น้ำเงิน", hex: "#2563EB", bg: "bg-[#EFF6FF]", text: "text-[#2563EB]", border: "border-[#DBEAFE]" },
  { id: "emerald", name: "Emerald", nameTH: "เขียว", hex: "#059669", bg: "bg-[#ECFDF5]", text: "text-[#059669]", border: "border-[#D1FAE5]" },
  { id: "amber", name: "Amber", nameTH: "ส้ม/ทอง", hex: "#D97706", bg: "bg-[#FFFBEB]", text: "text-[#D97706]", border: "border-[#FEF3C7]" },
  { id: "rose", name: "Rose", nameTH: "ชมพู", hex: "#E11D48", bg: "bg-[#FFF1F2]", text: "text-[#E11D48]", border: "border-[#FFE4E6]" },
  { id: "indigo", name: "Indigo", nameTH: "คราม", hex: "#4F46E5", bg: "bg-[#EEF2FF]", text: "text-[#4F46E5]", border: "border-[#E0E7FF]" },
  { id: "cyan", name: "Cyan", nameTH: "ฟ้า", hex: "#0891B2", bg: "bg-[#ECFEFF]", text: "text-[#0891B2]", border: "border-[#CFFAFE]" },
];

export default function CreateCategoryModal({ isOpen, onClose, onCreated }) {
  const { t, locale } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    fullName: "",
    icon: "FileText",
    color: "purple",
    badge: "หมวดใหม่",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const SelectedIconData = EXTENDED_ICON_MAP[formData.icon] || EXTENDED_ICON_MAP.FileText;
  const SelectedIconComp = SelectedIconData.icon;
  const selectedColorStyle = COLOR_OPTIONS.find((c) => c.id === formData.color) || COLOR_OPTIONS[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg(t('createCategory.errorEmptyName') || "Please enter a category name");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          fullName: formData.fullName.trim() || formData.name.trim(),
          description: "",
          icon: formData.icon,
          color: formData.color,
          badge: formData.badge || "หมวดใหม่",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || t('createCategory.errorSave') || "Failed to create category");
      }

      if (onCreated) {
        await onCreated();
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || t('createCategory.errorSave') || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-surface border border-border rounded-[14px] shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-left animate-in fade-in zoom-in-98 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[8px] bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
              <FolderPlus size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground leading-tight">
                {t('createCategory.title') || "New Category"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('createCategory.description') || "Create a new folder category to organize document templates"}
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

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-[8px] bg-destructive/10 border border-destructive/20 text-xs font-medium text-destructive">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Input Form (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Category English / Main Name */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  {t('createCategory.nameLabel') || "Category Name (English / Primary)"}{" "}
                  <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('createCategory.namePlaceholder') || "e.g. Purchase Order, Invoice, MOU..."}
                  className="w-full h-9 px-3 rounded-[8px] border border-border bg-surface text-xs font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-2xs"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t('createCategory.nameHelper') || "Main title for this category in the templates catalog"}
                </p>
              </div>

              {/* Category Full Thai Name */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  {t('createCategory.fullNameLabel') || "Thai Full Name"}
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder={t('createCategory.fullNamePlaceholder') || "e.g. ใบสั่งซื้อสินค้า (Purchase Order)..."}
                  className="w-full h-9 px-3 rounded-[8px] border border-border bg-surface text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-2xs"
                />
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  {t('createCategory.selectIcon') || "Select Category Icon"}
                </label>
                <div className="grid grid-cols-8 gap-1.5">
                  {Object.entries(EXTENDED_ICON_MAP).map(([key, item]) => {
                    const Icon = item.icon;
                    const isSelected = formData.icon === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: key })}
                        className={`h-9 rounded-[8px] flex items-center justify-center transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-primary/10 text-primary border-primary ring-1 ring-primary/20 shadow-2xs"
                            : "bg-surface hover:bg-muted text-muted-foreground border-border"
                        }`}
                        title={item.label}
                      >
                        <Icon size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Theme Presets */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  {t('createCategory.colorTheme') || "Color Theme"}
                </label>
                <div className="flex items-center flex-wrap gap-1.5">
                  {COLOR_OPTIONS.map((c) => {
                    const isSelected = formData.color === c.id;
                    const colorLabel = locale === "th" ? c.nameTH : c.name;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: c.id })}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium transition-all cursor-pointer border ${
                          isSelected
                            ? `${c.bg} ${c.text} ${c.border} ring-1 ring-primary/30 shadow-2xs`
                            : "bg-surface text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{colorLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Live Preview (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles size={13} className="text-primary" />
                  <span>{t('createCategory.livePreview') || "Live Preview"}</span>
                </span>
              </div>

              {/* Authentic Minimal Clean Preview Card matching /templates */}
              <div className="bg-surface border border-border rounded-[12px] shadow-2xs p-4 flex flex-col justify-between h-40 select-none text-left relative overflow-hidden">
                {/* Top: Icon + Count Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`w-9 h-9 rounded-[6px] ${selectedColorStyle.bg} ${selectedColorStyle.text} ${selectedColorStyle.border} border flex items-center justify-center shadow-2xs`}
                  >
                    <SelectedIconComp size={18} />
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-border bg-muted/70 text-muted-foreground tabular-nums">
                    {t('createCategory.templateCount') || "0 templates"}
                  </span>
                </div>

                {/* Title */}
                <div className="my-auto">
                  <h3 className="font-semibold text-foreground text-sm line-clamp-1 font-sans">
                    {formData.name || (t('createCategory.previewTitle') || "New Category Title")}
                  </h3>
                </div>

                {/* Bottom CTA */}
                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>{t('createCategory.browse') || "Browse templates"}</span>
                  <div className="size-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <ChevronRight size={11} />
                  </div>
                </div>
              </div>

              {/* Tip Callout */}
              <div className="p-3 rounded-[8px] bg-muted/40 border border-border text-[11px] text-muted-foreground leading-relaxed">
                💡 {t('createCategory.tip') || "Once created, the category folder will be ready in your templates catalog immediately."}
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2 bg-surface">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3.5 rounded-[8px] border border-border bg-surface hover:bg-muted text-xs font-medium text-foreground transition-all cursor-pointer"
            >
              {t('createCategory.cancel') || t('actions.cancel') || "Cancel"}
            </button>

            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="primary-button h-9 px-4 rounded-[8px] text-white text-xs font-medium shadow-xs hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t('createCategory.creating') || "Creating..."}</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>{t('createCategory.createBtn') || "Create Category"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
