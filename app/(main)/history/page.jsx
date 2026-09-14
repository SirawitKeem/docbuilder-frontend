"use client";

import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import DocumentsTable from "@/components/documents/DocumentsTable";
import { getTemplates } from "@/lib/data/templates";
import { useLanguage } from "@/context/LanguageContext";

export default function HistoryPage() {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allTemplatesList, setAllTemplatesList] = useState([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'email' | 'export'
  const [templateFilter, setTemplateFilter] = useState("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchHistory = () => {
    setLoading(true);
    fetch("/api/sent-history")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setDocuments(data || []);
        setLoading(false);
      })
      .catch(() => {
        setDocuments([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHistory();
    getTemplates().then((data) => {
      setAllTemplatesList((data || []).filter((t) => t.available !== false));
    });
  }, []);

  // Filter Sent Documents dynamically
  const filteredDocuments = documents.filter((doc) => {
    const q = searchQuery.toLowerCase().trim();
    const docName = (doc.name || "").toLowerCase();
    const templateName = (doc.templateName || "").toLowerCase();
    const sentTo = (doc.sentTo || "").toLowerCase();

    const matchesSearch = !q || docName.includes(q) || templateName.includes(q) || sentTo.includes(q);
    const matchesTemplate = templateFilter === "all" || doc.templateId === templateFilter;

    const isExport = doc.actionType === "export" || doc.channel === "download" || doc.channel === "print";
    const isEmail = doc.actionType === "email" || (!doc.actionType && !isExport);

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "email" && isEmail) ||
      (activeTab === "export" && isExport);

    return matchesSearch && matchesTemplate && matchesTab;
  });

  // Calculate tab counts
  const allCount = documents.length;
  const emailCount = documents.filter((d) => !(d.actionType === "export" || d.channel === "download" || d.channel === "print")).length;
  const exportCount = documents.filter((d) => d.actionType === "export" || d.channel === "download" || d.channel === "print").length;

  // Pagination Calculations
  const totalItems = filteredDocuments.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedDocuments = filteredDocuments.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">
          {t('history.title') || "Sent & Activity History"}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {t('history.description') || "ตรวจสอบและติดตามเอกสารทั้งหมดที่เคยสร้าง ส่งออก และส่งออกจากระบบ"}
        </p>
      </div>

      {/* Clean Toolbar Container: Tabs, Search Input & Template Filter */}
      <div className="bg-surface border border-border rounded-xl p-3 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Segmented Tabs: All vs Email vs Exports */}
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
              <span>{t('history.allChannels') || "ทั้งหมด"}</span>
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
                setActiveTab("email");
                setCurrentPage(1);
              }}
              className={`h-7 px-3 rounded-[6px] text-xs font-medium transition-all inline-flex items-center gap-2 select-none cursor-pointer ${
                activeTab === "email"
                  ? "bg-surface text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{t('history.channelEmail') || "ส่งอีเมล"}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold tabular-nums leading-none transition-colors ${
                  activeTab === "email"
                    ? "bg-muted text-foreground"
                    : "bg-muted/70 text-muted-foreground"
                }`}
              >
                {emailCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("export");
                setCurrentPage(1);
              }}
              className={`h-7 px-3 rounded-[6px] text-xs font-medium transition-all inline-flex items-center gap-2 select-none cursor-pointer ${
                activeTab === "export"
                  ? "bg-surface text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{t('history.channelExport') || "ส่งออก / ดาวน์โหลด"}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold tabular-nums leading-none transition-colors ${
                  activeTab === "export"
                    ? "bg-muted text-foreground"
                    : "bg-muted/70 text-muted-foreground"
                }`}
              >
                {exportCount}
              </span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:max-w-xl justify-end">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={t('history.searchPlaceholder') || "ค้นหาตามชื่อเอกสาร หรือ ผู้รับ..."}
                className="w-full h-8 pl-8 pr-3 rounded-[8px] border border-border bg-surface text-xs text-foreground outline-none focus:border-primary transition-all"
              />
            </div>

            {/* Template Filter Select */}
            <select
              value={templateFilter}
              onChange={(e) => {
                setTemplateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 px-3 rounded-[8px] border border-border bg-surface text-xs font-medium text-foreground outline-none cursor-pointer shrink-0 shadow-2xs"
            >
              <option value="all">{t('documents.allTemplates') || "ทุกเทมเพลต"}</option>
              {allTemplatesList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Sent History Documents Table */}
      {loading ? (
        <div className="h-64 rounded-2xl bg-muted animate-pulse" />
      ) : (
        <div className="space-y-4">
          <DocumentsTable
            documents={paginatedDocuments}
            deleteApiUrl="/api/sent-history"
            showSentTo
            allowEdit={false}
            emptyMessage={t('history.noResults') || "ไม่พบประวัติการส่งเอกสารที่ตรงกับการค้นหา"}
            onRefresh={fetchHistory}
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
                    className={`w-8 h-8 rounded-[8px] text-xs font-semibold transition-all ${
                      validCurrentPage === pageNum
                        ? "primary-button text-white shadow-2xs"
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
                <option value={5}>{t('pagination.perPage', { count: 5 })}</option>
                <option value={10}>{t('pagination.perPage', { count: 10 })}</option>
                <option value={20}>{t('pagination.perPage', { count: 20 })}</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
