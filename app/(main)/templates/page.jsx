"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import {
  Folder,
  Search,
  Plus,
  Settings,
  Eye,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderOpen,
  Edit3,
  Table,
  Presentation,
  Check,
  X,
  FolderSymlink,
  Share2,
} from "lucide-react";
import CategoryManagerModal, { ICON_MAP, COLOR_MAP } from "@/components/templates/CategoryManagerModal";
import CreateCategoryModal, { EXTENDED_ICON_MAP } from "@/components/templates/CreateCategoryModal";
import TemplateDetailModal from "@/components/templates/TemplateDetailModal";
import NewTemplateTypeModal from "@/components/templates/NewTemplateTypeModal";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";
import MoveCategoryModal from "@/components/templates/MoveCategoryModal";
import EditTemplateModal from "@/components/templates/EditTemplateModal";
import ShareDialog from "@/components/share/ShareDialog";
import ErrorBoundary from "@/components/common/ErrorBoundary";

export default function TemplatesHubPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Category for Level 2 view (null = Level 1 All Collections)
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

  // Edit Template State
  const [templateToEdit, setTemplateToEdit] = useState(null);

  // Renaming Template State
  const [renamingTemplate, setRenamingTemplate] = useState(null);
  const [newName, setNewName] = useState("");
  const [isRenamingLoading, setIsRenamingLoading] = useState(false);

  // Delete Template State
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);

  // Move Category State
  const [templateToMove, setTemplateToMove] = useState(null);

  // Share & Permissions State
  const [templateToShare, setTemplateToShare] = useState(null);

  const handleSelectType = (editorType, customOptions = null) => {
    setIsTypeModalOpen(false);
    const catId = selectedCategory?.id || categories[0]?.id || "notification";
    if (editorType === "sheet") {
      router.push(`/templates/new?categoryId=${catId}&editorType=sheet`);
    } else if (editorType === "custom" && customOptions) {
      const { width, height, unit, name } = customOptions;
      const presetId = `custom_${width}_${height}_${unit || "px"}`;
      const nameParam = name ? `&customName=${encodeURIComponent(name)}` : "";
      router.push(`/templates/new?categoryId=${catId}&editorType=document&canvasPreset=${presetId}&w=${width}&h=${height}&unit=${unit || "px"}${nameParam}`);
    } else {
      const preset = editorType === "slide" ? "slide-16-9" : "a4-portrait";
      router.push(`/templates/new?categoryId=${catId}&editorType=${editorType}&canvasPreset=${preset}`);
    }
  };

  // Load Categories & Templates from API dynamically
  const loadData = async () => {
    try {
      setLoading(true);
      const [catRes, tmplRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/templates"),
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData || []);
      }

      if (tmplRes.ok) {
        const tmplData = await tmplRes.json();
        setTemplates(tmplData || []);
      }
    } catch (err) {
      console.error("Error loading templates hub:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter Categories in Level 1
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.fullName || "").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q) ||
        (c.id || "").toLowerCase().includes(q)
    );
  }, [categories, searchQuery]);

  // Filter Templates in Level 2
  const currentCategoryTemplates = useMemo(() => {
    if (!selectedCategory) return [];
    const catTemplates = templates.filter((t) => t.categoryId === selectedCategory.id);
    if (!searchQuery.trim()) return catTemplates;
    const q = searchQuery.toLowerCase();
    return catTemplates.filter(
      (t) =>
        (t.name || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q) ||
        (t.badge || "").toLowerCase().includes(q)
    );
  }, [templates, selectedCategory, searchQuery]);

  // Duplicate a Template
  const handleDuplicateTemplate = async (tmpl) => {
    try {
      const copyPayload = {
        ...tmpl,
        id: undefined,
        name: t('templates.copyName', { name: tmpl.name }) || `${tmpl.name} (คัดลอก)`,
        badge: t('templates.copyBadge') || "ฉบับคัดลอก",
        status: "published",
      };

      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(copyPayload),
      });

      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error("Error duplicating template:", err);
    }
  };

  // Confirm Delete Custom Template
  const handleConfirmDeleteTemplate = async () => {
    if (!templateToDelete) return;
    setIsDeletingTemplate(true);
    try {
      const res = await fetch(`/api/templates/${templateToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        await loadData();
        setTemplateToDelete(null);
      }
    } catch (err) {
      console.error("Error deleting template:", err);
    } finally {
      setIsDeletingTemplate(false);
    }
  };

  // Start Renaming
  const handleStartRename = (tmpl) => {
    setRenamingTemplate(tmpl);
    setNewName(tmpl.name);
  };

  // Save Renamed Template
  const handleSaveRename = async () => {
    if (!renamingTemplate || !newName.trim()) return;
    setIsRenamingLoading(true);
    try {
      const res = await fetch(`/api/templates/${renamingTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        await loadData();
        setRenamingTemplate(null);
      }
    } catch (err) {
      console.error("Error renaming template:", err);
    } finally {
      setIsRenamingLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left pb-16">
      {/* LEVEL 1: Categories Collection View */}
      {!selectedCategory ? (
        <>
          {/* Header & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">
                {t('templates.title') || "Templates"}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t('templates.description') || "Select a document category to browse or customize templates"}
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="h-9 px-3.5 rounded-[8px] border border-border bg-surface hover:bg-muted text-xs font-medium text-foreground transition-all cursor-pointer inline-flex items-center gap-2 shadow-2xs"
                title="Manage template categories"
              >
                <Settings size={15} className="text-muted-foreground" />
                <span>Manage Categories</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCreateCategoryModalOpen(true)}
                className="primary-button h-9 px-4 rounded-[8px] text-white text-xs font-medium inline-flex items-center gap-2 shadow-xs cursor-pointer hover:opacity-95 transition-all"
                title="Create a new document category"
              >
                <Plus size={15} />
                <span>New Category</span>
              </button>
            </div>
          </div>

          {/* Minimal Search Toolbar */}
          <div className="bg-surface border border-border rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('templates.searchPlaceholder') || "Search categories..."}
                className="w-full h-9 pl-9 pr-8 rounded-[8px] border border-border bg-surface text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-sm transition-colors cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <span className="text-xs text-muted-foreground font-medium shrink-0">
              {filteredCategories.length} {filteredCategories.length === 1 ? "category" : "categories"}
            </span>
          </div>

          {/* Categories Grid (Minimal Clean matching /create) */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-44 rounded-[12px] bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-12 text-center bg-surface rounded-[12px] border border-dashed border-border space-y-3">
              <div className="w-10 h-10 rounded-[8px] bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Folder size={20} />
              </div>
              <h3 className="text-sm font-semibold text-foreground">No categories found matching your search</h3>
              <button
                type="button"
                onClick={() => setIsCreateCategoryModalOpen(true)}
                className="primary-button inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] text-white text-xs font-medium cursor-pointer"
              >
                <Plus size={13} />
                <span>New Category</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredCategories.map((cat) => {
                const IconData = EXTENDED_ICON_MAP[cat.icon];
                const IconComp = IconData ? IconData.icon : (ICON_MAP[cat.icon] || FileText);
                const colorStyle = COLOR_MAP[cat.color] || COLOR_MAP.purple;
                const tmplCount = (templates || []).filter((t) => t.categoryId === cat.id).length;

                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSearchQuery("");
                    }}
                    className="bg-surface border border-border rounded-[12px] shadow-2xs p-4 sm:p-5 h-full flex flex-col justify-between transition-all duration-200 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-card text-left relative overflow-hidden select-none cursor-pointer group"
                  >
                    {/* Top Bar: Icon + Count Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className={`w-9 h-9 rounded-[6px] flex items-center justify-center border ${colorStyle.bg} ${colorStyle.text} ${colorStyle.border} shadow-2xs transition-transform group-hover:scale-105 duration-200`}>
                        <IconComp size={18} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {cat.badge && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            cat.badge === "Standard" || cat.badge === "มาตรฐาน"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                              : "bg-primary/10 text-primary border-primary/20"
                          }`}>
                            {cat.badge}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-border bg-muted/70 text-muted-foreground tabular-nums">
                          {tmplCount} {tmplCount === 1 ? "template" : "templates"}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="flex-1 my-1">
                      <h3 className="font-semibold text-foreground text-sm sm:text-[15px] group-hover:text-primary transition-colors line-clamp-1 font-sans">
                        {cat.name}
                      </h3>
                    </div>

                    {/* Bottom Action CTA */}
                    <div className="mt-auto pt-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-150">
                        {t('templates.browseTemplates') || "Browse templates"}
                      </span>
                      <div className="size-6 rounded-full bg-muted/80 group-hover:bg-neutral-200/80 dark:group-hover:bg-neutral-700/80 flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-all duration-150">
                        <ChevronRight size={12} className="transition-transform duration-150 group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* LEVEL 2: Inside Selected Category */
        <>
          {/* Breadcrumbs Navigation & Header */}
          <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchQuery("");
                }}
                className="w-8 h-8 rounded-[8px] border border-border bg-surface hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-2xs cursor-pointer"
                title="Back to categories"
              >
                <ChevronLeft size={16} />
              </button>

              <div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className="hover:text-foreground transition-colors cursor-pointer"
                  >
                    {t('templates.title') || "Templates"}
                  </button>
                  <span>/</span>
                  <span className="font-semibold text-foreground">{selectedCategory?.name}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground leading-tight mt-0.5">
                  {selectedCategory?.name}
                </h2>
              </div>
            </div>

            {/* Action: Create New Template in this Category */}
            <button
              type="button"
              onClick={() => setIsTypeModalOpen(true)}
              className="primary-button h-9 px-3.5 rounded-[8px] text-white text-xs font-medium inline-flex items-center gap-2 shadow-xs hover:opacity-95 transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>{t('templates.newTemplate') || "New Template"}</span>
            </button>
          </div>

          {/* Minimal Search Toolbar */}
          <div className="bg-surface border border-border rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`${t('actions.search') || "Search"} ${selectedCategory?.name}...`}
                className="w-full h-9 pl-9 pr-8 rounded-[8px] border border-border bg-surface text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-sm transition-colors cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <span className="text-xs text-muted-foreground font-medium shrink-0">
              {currentCategoryTemplates.length} {currentCategoryTemplates.length === 1 ? "template" : "templates"}
            </span>
          </div>

          {/* Templates Grid (Clean & Essential Information Only) */}
          {currentCategoryTemplates.length === 0 ? (
            <div className="p-12 text-center bg-surface rounded-[12px] border border-dashed border-border space-y-3">
              <div className="w-10 h-10 rounded-[8px] bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <FileText size={20} />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {t('templates.noTemplates') || "No templates found in this category"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t('templates.noTemplatesDesc', { name: selectedCategory?.name }) || `Create a new template for ${selectedCategory?.name} to get started.`}
              </p>
              <button
                type="button"
                onClick={() => setIsTypeModalOpen(true)}
                className="primary-button inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] text-white text-xs font-medium cursor-pointer"
              >
                <Plus size={13} />
                <span>{t('templates.newTemplate') || "New Template"}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {currentCategoryTemplates.map((tmpl) => {
                const isSheet = tmpl.editorType === "sheet";
                const isSlide = tmpl.editorType === "slide";
                const FormatIcon = isSheet ? Table : isSlide ? Presentation : FileText;

                return (
                  <div
                    key={tmpl.id}
                    className="bg-surface border border-border rounded-[12px] shadow-2xs p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-card group text-left relative"
                  >
                    <div>
                      {/* Top: Format Icon + Badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="w-8 h-8 rounded-[6px] bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-2xs">
                          <FormatIcon size={16} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {Array.isArray(tmpl.pages) && tmpl.pages.length > 1 && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800 select-none">
                              {tmpl.pages.length} {isSlide ? "สไลด์" : "หน้า"}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTemplateToEdit(tmpl);
                            }}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer hover:opacity-80 select-none ${
                              tmpl.badge === "Standard" || tmpl.badge === "มาตรฐาน"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                                : tmpl.badge === "Custom" || tmpl.badge === "กำหนดเอง"
                                ? "bg-primary/10 text-primary border-primary/20"
                                : "border-border bg-muted/70 text-muted-foreground"
                            }`}
                            title="คลิกเพื่อแก้ไขประเภทเทมเพลต (Click to change badge / type)"
                          >
                            {tmpl.badge || (isSheet ? "Sheet" : isSlide ? "Slide" : "A4")}
                          </button>
                        </div>
                      </div>

                      {/* Title & Edit */}
                      <div className="flex items-start justify-between gap-2 my-1">
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-1 font-sans">
                          {tmpl.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setTemplateToEdit(tmpl)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-[4px] transition-all cursor-pointer"
                          title="แก้ไขข้อมูลเทมเพลต (Edit template info)"
                        >
                          <Edit3 size={12} />
                        </button>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-muted-foreground/80 mt-1 mb-3 line-clamp-2 leading-relaxed font-normal">
                        {tmpl.description || "Standard document blueprint ready for use"}
                      </p>
                    </div>

                    {/* Bottom: Actions Bar */}
                    <div className="mt-auto pt-3 border-t border-border/60 flex items-center justify-between gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setPreviewTemplate(tmpl)}
                        className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title="Quick preview"
                      >
                        <Eye size={13} />
                        <span>{t('actions.preview') || "Preview"}</span>
                      </button>

                      <div className="flex items-center gap-1">

                        <button
                          type="button"
                          onClick={() => setTemplateToShare(tmpl)}
                          className="size-7 rounded-[6px] hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                          title="แชร์แม่แบบ (Share template)"
                        >
                          <Share2 size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicateTemplate(tmpl)}
                          className="size-7 rounded-[6px] hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                          title="Duplicate template"
                        >
                          <Copy size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setTemplateToMove(tmpl)}
                          className="size-7 rounded-[6px] hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                          title="ย้ายหมวดหมู่ (Move category)"
                        >
                          <FolderSymlink size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateToDelete(tmpl)}
                          className="size-7 rounded-[6px] hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors cursor-pointer"
                          title="Delete template"
                        >
                          <Trash2 size={13} />
                        </button>

                        <Link
                          href={`/templates/new?edit=${tmpl.id}`}
                          className="h-7 px-2.5 rounded-[6px] bg-muted/70 hover:bg-muted text-xs font-medium text-foreground inline-flex items-center gap-1 border border-border/80 transition-colors shadow-2xs"
                          title="Edit in Studio"
                        >
                          <Edit3 size={11} />
                          <span>{t('actions.edit') || "Edit"}</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Category Manager Modal (List, Edit, Delete) */}
      {isCategoryModalOpen && (
        <ErrorBoundary title="เกิดข้อผิดพลาดในหน้าต่างจัดการหมวดหมู่">
          <CategoryManagerModal
            isOpen={isCategoryModalOpen}
            onClose={() => {
              setIsCategoryModalOpen(false);
              loadData();
            }}
            categories={categories}
            onCategoriesUpdated={loadData}
            onOpenCreateModal={() => {
              setIsCategoryModalOpen(false);
              setIsCreateCategoryModalOpen(true);
            }}
          />
        </ErrorBoundary>
      )}

      {/* Dedicated Create Category Modal */}
      {isCreateCategoryModalOpen && (
        <ErrorBoundary title="เกิดข้อผิดพลาดในหน้าต่างสร้างหมวดหมู่">
          <CreateCategoryModal
            isOpen={isCreateCategoryModalOpen}
            onClose={() => setIsCreateCategoryModalOpen(false)}
            onCreated={loadData}
          />
        </ErrorBoundary>
      )}

      {/* Template Detail / Preview Modal with Error Boundary */}
      {previewTemplate && (
        <ErrorBoundary title="เกิดข้อผิดพลาดในการแสดงตัวอย่างเทมเพลต">
          <TemplateDetailModal
            template={previewTemplate}
            onClose={() => setPreviewTemplate(null)}
            onOpenShare={(tmpl) => setTemplateToShare(tmpl)}
          />
        </ErrorBoundary>
      )}

      {/* Template Share & Permissions Modal */}
      {templateToShare && (
        <TemplateShareModal
          isOpen={Boolean(templateToShare)}
          onClose={() => setTemplateToShare(null)}
          template={templateToShare}
          onUpdated={loadData}
        />
      )}

      {/* New Template Type Picker Modal (Docs / Slides / Sheets) */}
      <NewTemplateTypeModal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        onSelect={handleSelectType}
        categoryName={selectedCategory?.name}
      />

      {/* Reusable Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(templateToDelete)}
        onClose={() => {
          if (!isDeletingTemplate) setTemplateToDelete(null);
        }}
        onConfirm={handleConfirmDeleteTemplate}
        isLoading={isDeletingTemplate}
        title={t('templates.deleteModalTitle') || "Delete template?"}
        description={
          t('templates.deleteModalMessage', { name: templateToDelete?.name || "" }) ||
          `Are you sure you want to delete template "${templateToDelete?.name || ""}" from catalog? This action cannot be undone.`
        }
        cancelText={t('actions.cancel') || "Cancel"}
        confirmText={t('actions.delete') || "Delete"}
      />

      {/* Move Category Modal */}
      <MoveCategoryModal
        isOpen={Boolean(templateToMove)}
        onClose={() => setTemplateToMove(null)}
        template={templateToMove}
        categories={categories}
        onSuccess={async () => {
          await loadData();
          setTemplateToMove(null);
        }}
      />

      {/* Edit Template Modal (Configure Name, Category, Badge: Standard / Custom, Description) */}
      <EditTemplateModal
        isOpen={Boolean(templateToEdit)}
        onClose={() => setTemplateToEdit(null)}
        template={templateToEdit}
        categories={categories}
        onSuccess={loadData}
      />

      {/* Share Dialog */}
      {templateToShare && (
        <ShareDialog
          isOpen={Boolean(templateToShare)}
          onClose={() => setTemplateToShare(null)}
          entityId={templateToShare.id}
          entityType="template"
          entityTitle={templateToShare.name}
        />
      )}
    </div>
  );
}
