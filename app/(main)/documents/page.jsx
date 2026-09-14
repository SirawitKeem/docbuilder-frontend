"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
} from "lucide-react";
import { getDocumentHistory } from "@/lib/data/documents";
import DocumentsTable from "@/components/documents/DocumentsTable";
import { getTemplates } from "@/lib/data/templates";
import { extractDocumentMeta } from "@/lib/data/documentMeta";
import { useLanguage } from "@/context/LanguageContext";

export default function DocumentsPage() {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allTemplatesList, setAllTemplatesList] = useState([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'exported'
  const [templateFilter, setTemplateFilter] = useState("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadDocuments = () => {
    setLoading(true);
    getDocumentHistory().then((data) => {
      setDocuments(data || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDocuments();
    getTemplates().then((data) => {
      setAllTemplatesList((data || []).filter((t) => t.available !== false));
    });
  }, []);

  // Filter Documents dynamically
  const filteredDocuments = documents.filter((doc) => {
    const meta = extractDocumentMeta(doc);
    const q = searchQuery.toLowerCase().trim();
    const docName = (meta?.name || doc.name || "").toLowerCase();
    const docNo = (meta?.docNumber || "").toLowerCase();
    const counterparty = (meta?.counterpartyName || "").toLowerCase();
    const templateName = (meta?.templateName || doc.templateName || "").toLowerCase();

    const matchesSearch = !q || docName.includes(q) || docNo.includes(q) || counterparty.includes(q) || templateName.includes(q);

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "exported" && meta?.hasExported);

    const matchesTemplate =
      templateFilter === "all" ||
      doc.templateId === templateFilter ||
      meta?.categoryId === templateFilter ||
      meta?.templateId === templateFilter ||
      meta?.rawTemplateId === templateFilter;

    return matchesSearch && matchesTab && matchesTemplate;
  });

  // Calculate tab counts
  const allCount = documents.length;
  const exportedCount = documents.filter((d) => extractDocumentMeta(d)?.hasExported).length;

  // Pagination Calculations
  const totalItems = filteredDocuments.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedDocuments = filteredDocuments.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-6">
      {/* Page Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">
            {t('documents.title') || "My Documents"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('documents.description') || "View, filter, and manage all your generated agreements and official documents."}
          </p>
        </div>

        <Link
          href="/create"
          className="primary-button inline-flex items-center gap-2 h-9 px-4 rounded-[6px] text-white font-medium text-xs shadow-xs hover:opacity-95 transition-all cursor-pointer select-none"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>{t('documents.newDocument') || "New Document"}</span>
        </Link>
      </div>

      {/* Toolbar & Filter Bar Container (Minimal & Clean) */}
      <div className="bg-surface border border-border rounded-xl p-3 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Segmented Tabs: All Documents vs Export History */}
          <div className="inline-flex items-center h-9 p-1 bg-muted/50 rounded-[8px] border border-border/60 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab("all");
                setCurrentPage(1);
              }}
              className={`h-7 px-3 rounded-[6px] text-xs font-medium transition-all inline-flex items-center gap-2 select-none cursor-pointer ${
                activeTab === "all"
                  ? "bg-surface text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{t('status.all')}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold tabular-nums leading-none transition-colors ${
                  activeTab === "all"
                    ? "bg-muted text-foreground"
                    : "bg-muted/70 text-muted-foreground"
                }`}
              >
                {allCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("exported");
                setCurrentPage(1);
              }}
              className={`h-7 px-3 rounded-[6px] text-xs font-medium transition-all inline-flex items-center gap-2 select-none cursor-pointer ${
                activeTab === "exported"
                  ? "bg-surface text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{t('documents.exportHistory') || "Export History"}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold tabular-nums leading-none transition-colors ${
                  activeTab === "exported"
                    ? "bg-muted text-foreground"
                    : "bg-muted/70 text-muted-foreground"
                }`}
              >
                {exportedCount}
              </span>
            </button>
          </div>

          {/* Search Input & Template Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={t('documents.searchPlaceholder')}
                className="w-full h-9 pl-9 pr-8 rounded-[8px] border border-border bg-surface text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-sm transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Template Filter Select with Custom Arrow */}
            <div className="relative shrink-0 sm:w-44">
              <select
                value={templateFilter}
                onChange={(e) => {
                  setTemplateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-9 pl-3.5 pr-8.5 rounded-[8px] border border-border bg-surface text-xs font-medium text-foreground outline-none cursor-pointer appearance-none transition-all hover:bg-muted/20 focus:border-primary focus:ring-2 focus:ring-primary/10 truncate"
              >
                <option value="all">{t('documents.allTemplates') || t('documents.templateFilter')}</option>
                {allTemplatesList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Documents Table */}
      {loading ? (
        <div className="h-64 rounded-2xl bg-muted animate-pulse" />
      ) : (
        <div className="space-y-4">
          <DocumentsTable
            documents={paginatedDocuments}
            showSentTo={activeTab === "exported"}
            emptyMessage={activeTab === "exported" ? "No export or email history found" : "No documents found matching your search"}
            onRefresh={loadDocuments}
          />

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 text-xs text-muted-foreground">
            <div>
              {t('pagination.showing', { start: totalItems > 0 ? startIndex + 1 : 0, end: Math.min(startIndex + pageSize, totalItems), total: totalItems })}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  disabled={validCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                      validCurrentPage === pageNum
                        ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                        : "border border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  disabled={validCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2 rounded-lg border border-border bg-surface text-xs text-muted-foreground outline-none cursor-pointer"
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
