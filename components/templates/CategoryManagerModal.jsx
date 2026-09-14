"use client";

import React, { useState } from "react";
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Layers,
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
  Sparkles,
} from "lucide-react";
import { EXTENDED_ICON_MAP } from "./CreateCategoryModal";
import { useLanguage } from "@/context/LanguageContext";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";

export const ICON_MAP = {
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
};

export const COLOR_MAP = {
  purple: { bg: "bg-[#F5F3FF]", text: "text-[#7C3AED]", border: "border-[#EDE9FE]", ring: "ring-[#7C3AED]" },
  blue: { bg: "bg-[#EFF6FF]", text: "text-[#2563EB]", border: "border-[#DBEAFE]", ring: "ring-[#2563EB]" },
  emerald: { bg: "bg-[#ECFDF5]", text: "text-[#059669]", border: "border-[#D1FAE5]", ring: "ring-[#059669]" },
  amber: { bg: "bg-[#FFFBEB]", text: "text-[#D97706]", border: "border-[#FEF3C7]", ring: "ring-[#D97706]" },
  rose: { bg: "bg-[#FFF1F2]", text: "text-[#E11D48]", border: "border-[#FFE4E6]", ring: "ring-[#E11D48]" },
  indigo: { bg: "bg-[#EEF2FF]", text: "text-[#4F46E5]", border: "border-[#E0E7FF]", ring: "ring-[#4F46E5]" },
  cyan: { bg: "bg-[#ECFEFF]", text: "text-[#0891B2]", border: "border-[#CFFAFE]", ring: "ring-[#0891B2]" },
};

export default function CategoryManagerModal({
  isOpen,
  onClose,
  categories = [],
  onCategoriesUpdated,
  onOpenCreateModal,
}) {
  const { t } = useLanguage();
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    fullName: "",
    icon: "FileText",
    color: "purple",
    badge: "พร้อมใช้งาน",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  if (!isOpen) return null;

  const handleStartEdit = (cat) => {
    setEditingId(cat.id);
    setFormData({
      name: cat.name || "",
      fullName: cat.fullName || cat.name || "",
      icon: cat.icon || "FileText",
      color: cat.color || "purple",
      badge: cat.badge || "พร้อมใช้งาน",
    });
    setErrorMsg("");
  };

  const handleCancelForm = () => {
    setEditingId(null);
    setFormData({
      name: "",
      fullName: "",
      icon: "FileText",
      color: "purple",
      badge: "พร้อมใช้งาน",
    });
    setErrorMsg("");
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg("Category name (EN) is required");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/categories/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update category");

      handleCancelForm();
      if (onCategoriesUpdated) onCategoriesUpdated();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (cat) => {
    if (["quotation", "nda", "partner", "distributor"].includes(cat.id)) {
      alert(t('categoryManager.protectedAlert') || "System default categories cannot be deleted");
      return;
    }
    setCategoryToDelete(cat);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsDeletingCategory(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/categories/${categoryToDelete.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete category");

      if (editingId === categoryToDelete.id) handleCancelForm();
      if (onCategoriesUpdated) onCategoriesUpdated();
      setCategoryToDelete(null);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsDeletingCategory(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
        <div className="bg-surface rounded-[14px] shadow-lg border border-border w-full max-w-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-98 duration-150 text-left">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[8px] bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground leading-tight">
                {t('categoryManager.title') || "Manage Categories"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('categoryManager.description') || "View, edit, or manage category folders in workspace"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[6px] text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-[8px] bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium">
              {errorMsg}
            </div>
          )}

          {/* Edit Form Section */}
          {editingId && (
            <form onSubmit={handleSave} className="p-3.5 rounded-[10px] bg-muted/40 border border-border space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                  <Sparkles size={13} />
                  <span>{t('categoryManager.editInfo') || "Edit Category Info"}</span>
                </span>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {t('categoryManager.cancel') || t('actions.cancel') || "Cancel"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    {t('categoryManager.nameEN') || "Category Name (EN) *"}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Purchase Order"
                    className="w-full h-9 px-3 rounded-[8px] border border-border bg-surface text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-2xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    {t('categoryManager.nameTH') || "Thai Full Name"}
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="เช่น ใบสั่งซื้อสินค้า (Purchase Order)"
                    className="w-full h-9 px-3 rounded-[8px] border border-border bg-surface text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="h-8 px-3 text-xs font-medium text-foreground bg-surface hover:bg-muted border border-border rounded-[6px] transition-colors cursor-pointer"
                >
                  {t('categoryManager.cancel') || t('actions.cancel') || "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="primary-button h-8 px-3.5 text-xs font-medium text-white rounded-[6px] shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {loading ? (t('actions.saving') || "Saving...") : (t('categoryManager.save') || "Save Changes")}
                </button>
              </div>
            </form>
          )}

          {/* Header Action Bar */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-foreground">
              {t('categoryManager.allCategories', { count: categories.length }) || `All Categories (${categories.length})`}
            </span>
            <button
              type="button"
              onClick={() => {
                if (onOpenCreateModal) onOpenCreateModal();
              }}
              className="primary-button inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] text-white text-xs font-medium shadow-xs cursor-pointer hover:opacity-95 transition-all"
            >
              <Plus size={13} />
              <span>{t('categoryManager.addNew') || "New Category"}</span>
            </button>
          </div>

          {/* Categories List */}
          <div className="space-y-2">
            {categories.map((cat) => {
              const IconData = EXTENDED_ICON_MAP[cat.icon];
              const IconComp = IconData ? IconData.icon : (ICON_MAP[cat.icon] || FileText);
              const colorStyle = COLOR_MAP[cat.color] || COLOR_MAP.purple;
              const isProtected = ["quotation", "nda", "partner", "distributor"].includes(cat.id);

              return (
                <div
                  key={cat.id}
                  className="group flex items-center justify-between p-3 rounded-[10px] border border-border bg-surface hover:border-primary/30 transition-all shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-[6px] ${colorStyle.bg} ${colorStyle.text} border ${colorStyle.border} flex items-center justify-center shrink-0 shadow-2xs`}>
                      <IconComp size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{cat.name}</span>
                        {isProtected ? (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {t('categoryManager.standard') || "Standard"}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {cat.badge || t('categoryManager.custom') || "Custom"}
                          </span>
                        )}
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-border bg-muted/60 text-muted-foreground tabular-nums">
                          {t('categoryManager.templatesCount', { count: cat.templateCount || 0 }) || `${cat.templateCount || 0} templates`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(cat)}
                      className="w-8 h-8 rounded-[6px] text-muted-foreground hover:text-primary hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
                      title={t('categoryManager.editTooltip') || "Edit"}
                    >
                      <Edit2 size={14} />
                    </button>
                    {!isProtected && (
                      <button
                        type="button"
                        onClick={() => handleDelete(cat)}
                        className="w-8 h-8 rounded-[6px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors cursor-pointer"
                        title={t('categoryManager.deleteTooltip') || "Delete"}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-border bg-surface flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-3.5 rounded-[8px] border border-border bg-surface hover:bg-muted text-xs font-medium text-foreground transition-all cursor-pointer"
          >
            {t('categoryManager.close') || t('actions.close') || "Close"}
          </button>
        </div>
      </div>
    </div>

      <DeleteConfirmModal
        isOpen={Boolean(categoryToDelete)}
        onClose={() => {
          if (!isDeletingCategory) setCategoryToDelete(null);
        }}
        onConfirm={handleConfirmDeleteCategory}
        isLoading={isDeletingCategory}
        title={t('categoryManager.deleteConfirmTitle') || "ลบประเภทเอกสาร?"}
        description={
          t('categoryManager.deleteConfirmMessage', { name: categoryToDelete?.name || "" }) ||
          `คุณแน่ใจหรือไม่ว่าต้องการลบประเภทเอกสาร "${categoryToDelete?.name || ""}"? การกระทำนี้ไม่สามารถย้อนกลับได้`
        }
        cancelText={t('categoryManager.cancelButton') || t('actions.cancel') || "ยกเลิก"}
        confirmText={t('categoryManager.deleteButton') || t('actions.delete') || "ลบประเภทเอกสาร"}
        zIndex="z-[60]"
      />
    </>
  );
}
