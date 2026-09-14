"use client";

import { useState, useEffect, useRef } from "react";
import {
  Eye,
  MoreHorizontal,
  Edit3,
  Trash2,
  X,
  Download,
  CopyPlus,
  Send,
  Pencil,
  Check,
  Copy,
  CheckCircle2,
  ArrowRight,
  FileText,
  Globe,
  Image as ImageIcon,
  Loader2,
  Receipt,
  Mail,
  ChevronRight,
  History,
  Clock,
  Calendar,
  Printer,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { templateRegistry } from "@/lib/templates/registry";
import { getFieldProfile } from "@/lib/data/fieldProfiles";
import { DocumentFieldsProvider } from "@/context/DocumentFieldsContext";
import { paginateQuotationLineItems } from "@/lib/quotationHelpers";
import QuotationDocument from "@/components/document/quotation/QuotationDocument";
import DocumentHeader from "@/components/document/DocumentHeader";
import DocumentFooter from "@/components/document/DocumentFooter";
import EmailScreen from "@/components/document/EmailScreen";
import { extractDocumentMeta } from "@/lib/data/documentMeta";
import { useLanguage } from "@/context/LanguageContext";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { getDocumentEditPath, LEGACY_TEMPLATE_ID_MAP } from "@/lib/templates/templateResolver";

const getCounterpartyName = (doc) => {
  if (doc?.values) {
    if (doc.values.counterparty_name) return doc.values.counterparty_name;
    if (doc.values.recipient) return doc.values.recipient;
    if (doc.values.reseller_company_name) return doc.values.reseller_company_name;
    if (doc.values.distributor_company_name && doc.values.distributor_company_name !== "บริษัท เครสท์ เซนโด จำกัด" && doc.values.distributor_company_name !== "Crest Zendo Co., Ltd.") {
      return doc.values.distributor_company_name;
    }
    if (doc.values.subject) return doc.values.subject;
  }
  if (doc?.billTo && (doc.billTo.companyName || doc.billTo.name)) {
    return doc.billTo.companyName || doc.billTo.name;
  }
  return "-";
};

function PdfIcon({ className = "w-8 h-9" }) {
  return (
    <svg className={className} viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 0C1.79086 0 0 1.79086 0 4V34C0 36.2091 1.79086 38 4 38H28C30.2091 38 32 36.2091 32 34V10L22 0H4Z" fill="#E53935"/>
      <path d="M22 0L32 10H24C22.8954 10 22 9.10457 22 8V0Z" fill="#C62828"/>
      <text x="16" y="27" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="sans-serif">PDF</text>
    </svg>
  );
}


function formatDateTime(dateString) {
  if (!dateString) return { dateStr: "-", timeStr: "" };
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return { dateStr: dateString, timeStr: "" };

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dateStr = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const timeStr = `${hours}:${minutes}`;
  return { dateStr, timeStr };
}

export default function DocumentsTable({
  documents = [],
  showSentTo = false,
  emptyMessage = "No documents found",
  deleteApiUrl = "/api/documents",
  allowEdit = true,
  onRefresh,
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [emailDoc, setEmailDoc] = useState(null);
  const [renameDoc, setRenameDoc] = useState(null);
  const [toast, setToast] = useState(null);
  
  // Custom Delete Confirmation Modal State (null | { type: 'single', id, docName } | { type: 'bulk', count })
  const [deleteModalState, setDeleteModalState] = useState(null);
  const [expandedExportDocId, setExpandedExportDocId] = useState(null);

  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
        setExpandedExportDocId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIds((prev) => prev.filter((id) => documents.some((d) => d.id === id)));
  }, [documents]);

  const allVisibleIds = documents.map((d) => d.id);
  const isAllSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allVisibleIds);
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // 1-Click Duplicate Document
  const handleDuplicate = async (doc) => {
    try {
      const duplicateName = `[Copy] ${doc.name || "Document"}`;
      let newDoc;

      if (doc.templateId === "quotation") {
        const payload = {
          ...doc,
          name: duplicateName,
          status: "draft",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        delete payload.id;
        delete payload._id;

        const res = await fetch("/api/quotations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to duplicate quotation");
        newDoc = await res.json();
      } else {
        const payload = {
          ...doc,
          name: duplicateName,
          status: "draft",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        delete payload.id;
        delete payload._id;

        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to duplicate document");
        newDoc = await res.json();
      }

      setToast({
        message: `Duplicated "${duplicateName}" successfully`,
        action: {
          label: "Edit Now",
          onClick: () => {
            const targetPath = doc.templateId === "quotation"
              ? `/create/quotation?id=${newDoc.id}`
              : `/create/${doc.templateId || "nda"}?id=${newDoc.id}`;
            router.push(targetPath);
          },
        },
      });

      if (onRefresh) {
        onRefresh();
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("Duplicate error:", err);
      alert("Failed to duplicate document");
    }
  };

  // 1-Click Convert Quotation to Receipt
  const handleCreateReceiptFromQuotation = async (doc) => {
    setOpenMenuId(null);
    try {
      const receiptNo = `REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 900) + 100)}`;
      const receiptName = `Receipt ${receiptNo} (${doc.quotationNo || doc.name})`;
      const payload = {
        ...doc,
        name: receiptName,
        quotationNo: receiptNo,
        originalQuotationNo: doc.quotationNo,
        status: "completed",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      delete payload.id;
      delete payload._id;

      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to generate receipt");
      const newReceipt = await res.json();

      setToast({
        message: `Receipt "${receiptName}" generated successfully`,
        action: {
          label: "View Receipt",
          onClick: () => {
            router.push(`/create/quotation?id=${newReceipt.id}`);
          },
        },
      });

      if (onRefresh) {
        onRefresh();
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("Create receipt error:", err);
      alert("Failed to generate receipt");
    }
  };

  // Trigger Confirmation Modal for Single Delete
  const requestSingleDelete = (doc) => {
    setDeleteModalState({
      type: "single",
      id: doc.id,
      docName: doc.name || "this document",
    });
  };

  // Trigger Confirmation Modal for Bulk Delete
  const requestBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setDeleteModalState({
      type: "bulk",
      count: selectedIds.length,
    });
  };

  // Execute Single Delete after Pop-up confirmation
  const confirmSingleDelete = async (id) => {
    setDeletingId(id);
    setDeleteModalState(null);
    try {
      await fetch(`${deleteApiUrl}?id=${id}`, { method: "DELETE" });
      setSelectedIds((prev) => prev.filter((x) => x !== id));
      if (onRefresh) {
        onRefresh();
      } else {
        router.refresh();
        window.location.reload();
      }
    } finally {
      setDeletingId(null);
    }
  };

  // Execute Bulk Delete after Pop-up confirmation
  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    setDeleteModalState(null);
    try {
      const idsParam = encodeURIComponent(selectedIds.join(","));
      const res = await fetch(`${deleteApiUrl}?ids=${idsParam}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) throw new Error("Failed to delete items");
      setSelectedIds([]);
      if (onRefresh) {
        onRefresh();
      } else {
        router.refresh();
        window.location.reload();
      }
    } catch (err) {
      console.error("Bulk delete error:", err);
      alert("Failed to delete selected items");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const [downloadingDocId, setDownloadingDocId] = useState(null);

  const handlePrintOrExport = (doc) => {
    window.open(`/print/${doc.templateId || "nda"}?id=${doc.id}`, "_blank");
    // Record print in audit log
    fetch(`/api/documents/${doc.id}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "export", format: "PRINT", performedBy: "ผู้ใช้งาน (Admin)" }),
    }).then(() => {
      if (onRefresh) onRefresh();
    }).catch(() => {});
  };

  const handleDirectExport = async (doc, format = "pdf") => {
    setDownloadingDocId(`${doc.id}_${format}`);
    try {
      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: doc.templateId || "nda",
          values: doc.values || {},
          quotationData: doc.values || {},
          fileName: doc.name || "document",
          format,
        }),
      });
      if (!res.ok) throw new Error("Failed to export document");
      const blob = await res.blob();
      const baseName = (doc.name || "document").replace(/\.(pdf|html|webp)$/i, "");
      const downloadFileName = `${baseName}.${format}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadFileName;
      a.click();
      URL.revokeObjectURL(url);

      // Record export action in audit log
      fetch(`/api/documents/${doc.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "export", format: format.toUpperCase(), performedBy: "ผู้ใช้งาน (Admin)" }),
      }).then(() => {
        if (onRefresh) onRefresh();
      }).catch(() => {});
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to download document");
    } finally {
      setDownloadingDocId(null);
    }
  };

  return (
    <>
      {/* Toast Notification with Quick Action */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-gray-900/95 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-200 border border-gray-700/60 backdrop-blur-md">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="leading-snug">{toast.message}</span>
          {toast.action && (
            <button
              onClick={() => {
                toast.action.onClick();
                setToast(null);
              }}
              className="primary-button ml-1 px-2.5 py-1 rounded-[6px] text-white text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 shadow-xs hover:opacity-95"
            >
              <span>{toast.action.label}</span>
              <ArrowRight size={12} />
            </button>
          )}
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-gray-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="mb-3 p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>{selectedIds.length} items selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={requestBulkDelete}
              disabled={isBulkDeleting}
              className="px-4 py-1.5 rounded-xl bg-[#FF3B30] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Trash2 size={14} className="text-white" />
              <span className="text-white">{isBulkDeleting ? "Deleting..." : `Delete selected (${selectedIds.length})`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-surface border border-border rounded-[12px] shadow-2xs overflow-hidden transition-colors">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground bg-muted/40">
              {/* Checkbox Column */}
              <th className="w-[48px] px-4 py-3.5 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                  title={isAllSelected ? "Deselect all" : "Select all"}
                />
              </th>
              <th className="px-4 py-3.5">{t('table.documentName')}</th>
              <th className="w-[24%] px-4 py-3.5">{showSentTo ? t('table.sentTo') : t('table.counterparty')}</th>
              <th className="w-[18%] px-4 py-3.5">{t('table.template')}</th>
              <th className="w-[14%] px-4 py-3.5">{t('table.lastModified')}</th>
              <th className="w-[110px] px-4 py-3.5 text-right whitespace-nowrap">{t('table.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                  <div className="font-medium mb-1">{t('table.noDocuments')}</div>
                  <div className="text-xs">{emptyMessage || t('table.noDocumentsDesc')}</div>
                </td>
              </tr>
            ) : (
              documents.map((doc, docIdx) => {
                const meta = extractDocumentMeta(doc);
                const isSelected = selectedIds.includes(doc.id);
                const isNearBottom = docIdx >= Math.max(0, documents.length - 2);

                return (
                  <tr
                    key={doc.id}
                    className={`transition-colors ${
                      isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/40"
                    }`}
                  >
                    {/* Checkbox Row Cell */}
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(doc.id)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                      />
                    </td>

                    {/* Document Title & Meta */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-[8px] bg-muted/80 flex items-center justify-center text-muted-foreground shrink-0 border border-border/60">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 group/name">
                            <Link
                              href={`/documents/${doc.id}`}
                              className="font-medium text-foreground text-sm leading-snug truncate max-w-[260px] sm:max-w-xs hover:text-primary transition-colors"
                              title={meta.name}
                            >
                              {meta.name}
                            </Link>
                            <button
                              onClick={() => setRenameDoc(doc)}
                              className="opacity-0 group-hover/name:opacity-100 p-0.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-all cursor-pointer"
                              title="Rename document"
                            >
                              <Pencil size={11} />
                            </button>
                          </div>
                          {meta.docNumber ? (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {meta.docNumber}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    {/* Client / Counterparty OR History Channel & Recipient */}
                    <td className="px-4 py-3.5">
                      {showSentTo ? (
                        <div className="flex items-center gap-2">
                          {doc.actionType === "export" || doc.channel === "download" || doc.channel === "print" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                              {doc.channel === "print" || doc.format === "PRINT" ? (
                                <Printer size={12} className="shrink-0 text-blue-600" />
                              ) : (
                                <Download size={12} className="shrink-0 text-blue-600" />
                              )}
                              <span>{doc.format ? `${doc.format}` : "Export"}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              <Mail size={12} className="shrink-0 text-emerald-600" />
                              <span>Email</span>
                            </span>
                          )}
                          <div className="min-w-0">
                            <span className="truncate block text-xs font-medium text-foreground" title={doc.sentTo || "-"}>
                              {doc.sentTo || "-"}
                            </span>
                            {doc.sentBy && (
                              <span className="text-[10px] text-muted-foreground block truncate">
                                โดย: {doc.sentBy}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-medium text-foreground truncate max-w-[220px]" title={meta.counterpartyName}>
                            {meta.counterpartyName}
                          </p>
                          {meta.contactPerson && (
                            <p className="text-[11px] text-muted-foreground truncate max-w-[220px] mt-0.5" title={meta.contactPerson}>
                              {meta.contactPerson}
                            </p>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Template */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-foreground">
                          {meta.templateName}
                        </span>
                        {meta.categoryName && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                            {meta.categoryName}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Last Modified */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="text-foreground text-xs font-medium" title={meta.fullDateTime}>
                        {meta.relativeTime}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDateTime(meta.updatedAt).dateStr}
                      </p>
                    </td>

                    {/* Action Column */}
                    <td className="px-4 py-3.5 relative whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="p-1.5 rounded-[6px] hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="Preview document"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openMenuId === doc.id) {
                              setOpenMenuId(null);
                              setExpandedExportDocId(null);
                            } else {
                              setOpenMenuId(doc.id);
                              setExpandedExportDocId(null);
                            }
                          }}
                          className="p-1.5 rounded-[6px] hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="More actions"
                        >
                          <MoreHorizontal size={16} />
                        </button>

                        {openMenuId === doc.id && (
                          <div
                            ref={menuRef}
                            className={`absolute right-4 ${isNearBottom ? "bottom-10" : "top-11"} w-56 bg-surface text-foreground rounded-xl shadow-xl border border-border py-1 z-50 animate-in fade-in zoom-in-95 duration-100 opacity-100 text-left`}
                          >
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleDuplicate(doc);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors whitespace-nowrap cursor-pointer"
                              >
                                <Copy size={14} className="text-muted-foreground" />
                                <span>{t('actions.duplicateDocument') || "Duplicate document"}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setRenameDoc(doc);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors whitespace-nowrap cursor-pointer"
                              >
                                <Pencil size={14} className="text-muted-foreground" />
                                <span>{t('actions.renameDocument') || "Rename document"}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setEmailDoc(doc);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors whitespace-nowrap cursor-pointer"
                              >
                                <Send size={14} className="text-muted-foreground" />
                                <span>{t('actions.sendEmail') || "Send email"}</span>
                              </button>
                              {allowEdit && (
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    router.push(getDocumentEditPath(doc));
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors whitespace-nowrap cursor-pointer"
                                >
                                  <Edit3 size={14} className="text-muted-foreground" />
                                  <span>{t('actions.editDocument') || "Edit document"}</span>
                                </button>
                              )}
                              {doc.templateId === "quotation" && (
                                <>
                                  <button
                                    onClick={() => handleCreateReceiptFromQuotation(doc)}
                                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors whitespace-nowrap cursor-pointer"
                                  >
                                    <Receipt size={14} className="text-muted-foreground" />
                                    <span>Generate receipt</span>
                                  </button>
                                  <button
                                    onClick={async () => {
                                      setOpenMenuId(null);
                                      try {
                                        const res = await fetch(`/api/quotations/${doc.id}/revision`, { method: "POST" });
                                        if (!res.ok) throw new Error();
                                        const newRev = await res.json();
                                        router.push(`/create/quotation?id=${newRev.id}`);
                                      } catch {
                                        alert("Failed to create revision");
                                      }
                                    }}
                                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors whitespace-nowrap cursor-pointer"
                                  >
                                    <CopyPlus size={14} className="text-muted-foreground" />
                                    <span>Create new revision</span>
                                  </button>
                                </>
                              )}
  
                              {/* 📥 Unified Export Item (Click to expand 3 formats) */}
                              <div className="border-t border-border/50 my-1 pt-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedExportDocId(expandedExportDocId === doc.id ? null : doc.id);
                                  }}
                                  className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between transition-colors whitespace-nowrap cursor-pointer ${
                                    expandedExportDocId === doc.id
                                      ? "bg-primary/10 text-primary font-semibold"
                                      : "text-foreground hover:bg-muted"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <Download
                                      size={14}
                                      className={expandedExportDocId === doc.id ? "text-primary" : "text-muted-foreground"}
                                    />
                                    <span>Export document</span>
                                  </div>
                                  <ChevronRight
                                    size={13}
                                    className={`text-muted-foreground transition-transform duration-200 ${
                                      expandedExportDocId === doc.id ? "rotate-90 text-primary" : ""
                                    }`}
                                  />
                                </button>
  
                                {expandedExportDocId === doc.id && (
                                  <div className="mx-2 my-1 p-1 bg-muted/60 rounded-lg border border-border/60 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                                    <button
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        setExpandedExportDocId(null);
                                        handlePrintOrExport(doc);
                                      }}
                                      className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-background hover:shadow-xs rounded-md flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer"
                                    >
                                      <FileText size={13} className="text-red-500 shrink-0" />
                                      <span>{t('actions.exportPdfPrint') || "Export PDF / Print"}</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        setExpandedExportDocId(null);
                                        handleDirectExport(doc, "html");
                                      }}
                                      disabled={downloadingDocId === `${doc.id}_html`}
                                      className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-background hover:shadow-xs rounded-md flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
                                    >
                                      {downloadingDocId === `${doc.id}_html` ? (
                                        <Loader2 size={13} className="animate-spin text-blue-500 shrink-0" />
                                      ) : (
                                        <Globe size={13} className="text-blue-500 shrink-0" />
                                      )}
                                      <span>Export HTML (.html)</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        setExpandedExportDocId(null);
                                        handleDirectExport(doc, "webp");
                                      }}
                                      disabled={downloadingDocId === `${doc.id}_webp`}
                                      className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-background hover:shadow-xs rounded-md flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
                                    >
                                      {downloadingDocId === `${doc.id}_webp` ? (
                                        <Loader2 size={13} className="animate-spin text-purple-500 shrink-0" />
                                      ) : (
                                        <ImageIcon size={13} className="text-purple-500 shrink-0" />
                                      )}
                                      <span>Export WebP (.webp)</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  requestSingleDelete(doc);
                                }}
                                disabled={deletingId === doc.id}
                                className="w-full text-left px-3.5 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 flex items-center gap-2.5 transition-colors disabled:opacity-40 whitespace-nowrap cursor-pointer"
                              >
                                <Trash2 size={14} className="text-destructive" />
                                <span>{t('actions.deleteDocument') || "Delete document"}</span>
                              </button>
                            </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Reusable Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteModalState)}
        onClose={() => setDeleteModalState(null)}
        onConfirm={() => {
          if (!deleteModalState) return;
          if (deleteModalState.type === "bulk") {
            confirmBulkDelete();
          } else {
            confirmSingleDelete(deleteModalState.id);
          }
        }}
        isLoading={Boolean(deletingId || isBulkDeleting)}
        title={
          deleteModalState?.type === "bulk"
            ? `Delete ${deleteModalState.count} selected documents?`
            : t('deleteModal.title') || "Delete document?"
        }
        description={
          deleteModalState?.type === "bulk"
            ? `All ${deleteModalState.count} selected documents will be permanently removed from workspace. This action cannot be undone.`
            : t('deleteModal.message') || `Document "${deleteModalState?.docName}" will be permanently removed from workspace. This action cannot be undone.`
        }
        cancelText={t('actions.cancel') || "Cancel"}
        confirmText={t('actions.delete') || "Delete"}
      />

      {/* Pop-Up Modal Preview */}
      {previewDoc && (
        <PreviewModal
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* Pop-Up Modal Send Email */}
      {emailDoc && (
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto animate-in fade-in duration-150">
          <EmailScreen
            documentId={emailDoc.id}
            defaultSubject={`Document: ${emailDoc.templateName || emailDoc.name || "Document"}`}
            fileName={emailDoc.name || `${emailDoc.templateId || "document"}.pdf`}
            templateId={emailDoc.templateId || "nda"}
            templateName={emailDoc.templateName}
            values={emailDoc.values || {}}
            onBack={() => setEmailDoc(null)}
            onSent={() => {
              setEmailDoc(null);
              if (onRefresh) onRefresh();
            }}
          />
        </div>
      )}

      {/* Pop-Up Modal Rename Document */}
      {renameDoc && (
        <RenameModal
          doc={renameDoc}
          onClose={() => setRenameDoc(null)}
          onRenamed={() => {
            if (onRefresh) onRefresh();
            else router.refresh();
          }}
        />
      )}
    </>
  );
}

function RenameModal({ doc, onClose, onRenamed }) {
  const [name, setName] = useState(doc.name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const endpoint = doc.templateId === "quotation" ? "/api/quotations" : "/api/documents";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: doc.id, name: name.trim() }),
      });
      if (!res.ok) throw new Error("Failed to rename document");
      onRenamed();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to rename document");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5E5E5] rounded-[24px] shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center">
              <Pencil size={16} />
            </div>
            <h3 className="text-base font-bold text-gray-900">Rename Document</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">New Document Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter document name..."
              className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#F5F3FF] transition-all"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full h-9 rounded-[8px] border border-border bg-surface text-foreground hover:bg-muted text-xs font-medium transition-colors cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="primary-button w-full h-9 rounded-[8px] text-white text-xs font-medium transition-all shadow-xs flex items-center justify-center disabled:opacity-50 cursor-pointer hover:opacity-95"
            >
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PreviewModal({ doc, onClose }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("preview"); // "preview" | "timeline"
  const [freshDoc, setFreshDoc] = useState(doc);
  const canonicalId = LEGACY_TEMPLATE_ID_MAP[freshDoc?.templateId] || freshDoc?.templateId;
  const entry = templateRegistry[canonicalId] || templateRegistry[freshDoc?.templateId] || templateRegistry["nda"];
  const [modalValues, setModalValues] = useState(freshDoc.values || {});

  // Fetch freshest document details on mount
  useEffect(() => {
    if (!doc?.id) return;
    fetch(`/api/documents/${doc.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const docData = data.data || data;
          setFreshDoc(docData);
          setModalValues(docData.values || {});
        }
      })
      .catch((err) => console.warn("Could not fetch fresh doc details:", err));
  }, [doc?.id]);

  useEffect(() => {
    const { schema } = entry || {};
    if (!schema) return;

    getFieldProfile(freshDoc.profileId).then((profile) => {
      const merged = { ...freshDoc.values };
      const profileValues = profile?.values || profile || {};

      if (Array.isArray(schema.fields)) {
        for (const field of schema.fields) {
          if (field.sharedKey && profileValues[field.sharedKey]) {
            merged[field.id] = merged[field.id] || profileValues[field.sharedKey];
          }
        }
      }
      setModalValues(merged);
    });
  }, [freshDoc, entry]);

  const { schema, pages, DocumentComponent } = entry || {};
  const isQuotation = freshDoc.templateId === "quotation" || schema?.type === "quotation";
  const quotationPageCount = isQuotation ? (paginateQuotationLineItems(modalValues.lineItems || []).length || 1) : 1;

  // Build unified chronological timeline (merging activityLogs and exportHistory)
  const activityLogs = freshDoc.activityLogs || [];
  const exportHistory = freshDoc.exportHistory || [];

  const timelineEvents = [...activityLogs];
  for (const exp of exportHistory) {
    const exists = timelineEvents.some(
      (ev) => ev.id === exp.id || (ev.action === "export" && Math.abs(new Date(ev.timestamp || 0) - new Date(exp.exportedAt || 0)) < 1500)
    );
    if (!exists) {
      timelineEvents.push({
        id: exp.id,
        action: "export",
        format: exp.format,
        performedBy: exp.performedBy || "Admin",
        timestamp: exp.exportedAt,
        details: exp.details || `ส่งออกเอกสาร ${exp.format}`,
      });
    }
  }

  // Fallback initial event if empty
  if (timelineEvents.length === 0 && freshDoc.createdAt) {
    timelineEvents.push({
      id: "initial-create",
      action: "create",
      performedBy: freshDoc.createdBy || "ผู้จัดทำ (Admin)",
      timestamp: freshDoc.createdAt,
      details: "สร้างเอกสาร",
    });
  }

  timelineEvents.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

  const getActionBadge = (event) => {
    const act = (event.action || "").toLowerCase();
    if (act === "create") {
      return {
        label: t('history.createdDoc') || "สร้างเอกสาร",
        icon: Sparkles,
        bgColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        iconColor: "text-emerald-600",
      };
    }
    if (act === "edit") {
      return {
        label: t('history.editedDoc') || "แก้ไขเอกสาร",
        icon: Pencil,
        bgColor: "bg-amber-50 text-amber-700 border-amber-200",
        iconColor: "text-amber-600",
      };
    }
    if (act === "export") {
      const isPrint = event.format === "PRINT" || (event.details && event.details.includes("พิมพ์"));
      return {
        label: isPrint ? "พิมพ์เอกสาร" : `${t('history.exportedDoc') || "ส่งออก"} ${event.format || "PDF"}`,
        icon: isPrint ? Printer : Download,
        bgColor: "bg-blue-50 text-blue-700 border-blue-200",
        iconColor: "text-blue-600",
      };
    }
    if (act === "email") {
      return {
        label: t('history.sentEmailDoc') || "ส่งอีเมล",
        icon: Mail,
        bgColor: "bg-purple-50 text-purple-700 border-purple-200",
        iconColor: "text-purple-600",
      };
    }
    if (act === "approve") {
      return {
        label: "อนุมัติเอกสาร",
        icon: CheckCircle2,
        bgColor: "bg-green-50 text-green-700 border-green-200",
        iconColor: "text-green-600",
      };
    }
    if (act === "reject") {
      return {
        label: "ส่งกลับแก้ไข",
        icon: AlertCircle,
        bgColor: "bg-rose-50 text-rose-700 border-rose-200",
        iconColor: "text-rose-600",
      };
    }
    return {
      label: event.action || "กิจกรรม",
      icon: Clock,
      bgColor: "bg-gray-50 text-gray-700 border-gray-200",
      iconColor: "text-gray-600",
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-border">
        {/* Modal Header */}
        <div className="px-6 py-3.5 border-b border-border flex items-center justify-between bg-muted/30">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground text-base truncate max-w-[320px] sm:max-w-md">{freshDoc.name}</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border/60">
                {freshDoc.templateName || "Document"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Last modified {extractDocumentMeta(freshDoc)?.relativeTime || "-"} • Created {formatDateTime(freshDoc.createdAt).dateStr}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab Navigation */}
            <div className="inline-flex items-center h-8 p-0.5 bg-muted/70 rounded-[8px] border border-border/60 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`h-7 px-3 rounded-[6px] text-xs font-medium transition-all inline-flex items-center gap-1.5 select-none cursor-pointer ${
                  activeTab === "preview"
                    ? "bg-surface text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eye size={13} />
                <span>{t('history.previewTab') || "ตัวอย่างเอกสาร"}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("timeline")}
                className={`h-7 px-3 rounded-[6px] text-xs font-medium transition-all inline-flex items-center gap-1.5 select-none cursor-pointer ${
                  activeTab === "timeline"
                    ? "bg-surface text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <History size={13} />
                <span>{t('history.historyTab') || "ประวัติและกิจกรรม"}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold tabular-nums ${
                  activeTab === "timeline" ? "bg-muted text-foreground" : "bg-muted/70 text-muted-foreground"
                }`}>
                  {timelineEvents.length}
                </span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {activeTab === "preview" ? (
          <ErrorBoundary title="ไม่สามารถแสดงตัวอย่างเอกสารนี้ได้">
            <div className="flex-1 overflow-auto bg-muted p-8 flex flex-col items-center gap-8">
              {isQuotation ? (
                Array.from({ length: quotationPageCount }, (_, i) => (
                  <div key={i} className="shrink-0">
                    <QuotationDocument quotation={modalValues} currentPage={i + 1} />
                  </div>
                ))
              ) : DocumentComponent ? (
                <div className="shrink-0 shadow-document">
                  <DocumentFieldsProvider initialValues={modalValues} defaultReadOnly>
                    <DocumentComponent data={modalValues} values={modalValues} quotation={modalValues} />
                  </DocumentFieldsProvider>
                </div>
              ) : pages && pages.length > 0 ? (
                <DocumentFieldsProvider key={JSON.stringify(modalValues)} initialValues={modalValues} defaultReadOnly>
                  {pages.map((PageContent, i) => (
                    <div
                      key={i}
                      className="bg-[#FFFFFF] shadow-document w-[794px] min-h-[1123px] flex flex-col justify-between font-noto-looped text-gray-900 rounded-sm shrink-0 overflow-hidden"
                      style={{
                        padding: schema?.hasHeader === false ? "0px" : "28px 48px",
                        boxSizing: "border-box",
                      }}
                    >
                    {schema?.hasHeader !== false && <DocumentHeader logo={schema?.logo} />}
                    <div className="flex-1 min-h-0 overflow-hidden text-left">
                      <PageContent />
                    </div>
                    {schema?.hasFooter !== false && (
                      <DocumentFooter
                        title={schema?.fullName}
                        pageNumber={i + 1}
                        totalPages={pages.length}
                      />
                    )}
                  </div>
                ))}
              </DocumentFieldsProvider>
            ) : (
              /* Fallback for Studio Custom Documents without standard entry */
              <div className="bg-surface border border-border rounded-2xl shadow-sm p-8 max-w-2xl w-full text-left space-y-6">
                <div className="flex items-start justify-between border-b border-border pb-4">
                  <div>
                    <h4 className="text-lg font-bold text-foreground">{freshDoc.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      เทมเพลต: {freshDoc.templateName || freshDoc.templateId || "Custom Template"}
                    </p>
                  </div>
                  {freshDoc.verificationToken && (
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground block font-mono">Verification Token</span>
                      <span className="text-xs font-mono font-semibold text-primary">{freshDoc.verificationToken}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h5 className="text-xs font-semibold text-foreground uppercase tracking-wider">ข้อมูลที่กรอกไว้ในเอกสาร</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2">
                    {Object.entries(freshDoc.values || {}).map(([k, v]) => {
                      if (typeof v === "object" && v !== null) return null;
                      return (
                        <div key={k} className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                          <span className="text-[11px] font-medium text-muted-foreground block truncate">{k}</span>
                          <span className="text-xs font-semibold text-foreground block truncate">{String(v || "-")}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">เอกสารกำหนดเองจาก Template Studio</span>
                  <Link
                    href={getDocumentEditPath(freshDoc)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-95 transition-opacity"
                  >
                    <Edit3 size={13} />
                    <span>เปิดแก้ไขใน Studio</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </ErrorBoundary>
        ) : (
          /* Timeline & Activity History Tab */
          <div className="flex-1 overflow-auto bg-surface p-6 sm:p-8 space-y-6">
            {/* Top Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border">
                <span className="text-[11px] font-medium text-muted-foreground block">สถานะปัจจุบัน</span>
                <span className="text-sm font-semibold text-foreground mt-0.5 block">
                  {freshDoc.status === "sent" ? "ส่งแล้ว" : freshDoc.status === "exported" ? "ส่งออกแล้ว" : "ฉบับร่าง (Draft)"}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border">
                <span className="text-[11px] font-medium text-muted-foreground block">จำนวนการส่งออก / พิมพ์</span>
                <span className="text-sm font-semibold text-foreground mt-0.5 block">
                  {exportHistory.length} ครั้ง
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border">
                <span className="text-[11px] font-medium text-muted-foreground block">สร้างเมื่อ</span>
                <span className="text-sm font-semibold text-foreground mt-0.5 block truncate">
                  {formatDateTime(freshDoc.createdAt).dateStr} {formatDateTime(freshDoc.createdAt).timeStr}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border">
                <span className="text-[11px] font-medium text-muted-foreground block">รหัสยืนยัน (Token)</span>
                <span className="text-xs font-mono font-semibold text-primary mt-1 block truncate" title={freshDoc.verificationToken || freshDoc.id}>
                  {freshDoc.verificationToken || freshDoc.id}
                </span>
              </div>
            </div>

            {/* Timeline Visual Feed */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                <History size={14} className="text-muted-foreground" />
                <span>{t('history.activityTimeline') || "ประวัติกิจกรรม & การส่งออก"}</span>
              </h4>

              {timelineEvents.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 border border-dashed border-border rounded-xl">
                  <Clock size={28} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs font-medium text-muted-foreground">
                    {t('history.noActivity') || "ยังไม่มีประวัติกิจกรรมสำหรับเอกสารนี้"}
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
                  {timelineEvents.map((ev, idx) => {
                    const badge = getActionBadge(ev);
                    const IconComponent = badge.icon;
                    const { dateStr, timeStr } = formatDateTime(ev.timestamp);

                    return (
                      <div key={ev.id || idx} className="relative group">
                        {/* Timeline Node Point */}
                        <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-surface flex items-center justify-center ${badge.bgColor}`}>
                          <IconComponent size={10} className={badge.iconColor} />
                        </div>

                        {/* Event Content Card */}
                        <div className="bg-surface border border-border/70 rounded-xl p-3.5 shadow-2xs hover:border-border transition-all">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badge.bgColor}`}>
                                <IconComponent size={11} className={badge.iconColor} />
                                <span>{badge.label}</span>
                              </span>
                              {ev.performedBy && (
                                <span className="text-xs text-muted-foreground font-medium">
                                  โดย {ev.performedBy}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
                              {dateStr} {timeStr}
                            </span>
                          </div>

                          {ev.details && (
                            <p className="text-xs text-foreground mt-1">
                              {ev.details}
                            </p>
                          )}
                          {ev.comment && (
                            <p className="text-xs text-muted-foreground italic mt-0.5 bg-muted/30 p-1.5 rounded-md">
                              &ldquo;{ev.comment}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-border flex items-center justify-between bg-muted/30">
          <p className="text-xs text-muted-foreground">
            {activeTab === "preview" ? "Document Preview Mode (Read-only)" : `Total ${timelineEvents.length} recorded events`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center h-9 px-4 text-xs font-medium text-foreground bg-surface border border-border hover:bg-muted rounded-[8px] transition-colors shadow-2xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
