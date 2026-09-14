"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  MoreVertical,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
} from "lucide-react";
import { listFieldProfiles, deleteFieldProfile } from "@/lib/data/fieldProfiles";
import { getRelevantTemplates, getDynamicTemplateSchemas } from "@/lib/profiles/compatibility";
import { useLanguage } from "@/context/LanguageContext";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";

function formatThaiDateTime(isoString) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  const monthNamesTh = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
  ];
  const day = date.getDate();
  const month = monthNamesTh[date.getMonth()];
  const year = date.getFullYear() + 543;
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hours}:${minutes} น.`;
}

export default function ProfileDataListPage() {
  const { t } = useLanguage();
  const [profiles, setProfiles] = useState(null);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);
  const [allTemplatesList, setAllTemplatesList] = useState([]);
  
  // UI & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplateFilter, setSelectedTemplateFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  // Selection & Detail Panel State
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = () =>
    listFieldProfiles().then((data) => {
      setProfiles(data);
    });

  useEffect(() => {
    load();
    getDynamicTemplateSchemas().then((data) => {
      setAllTemplatesList(data || []);
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = (id, name) => {
    setProfileToDelete({ id, name });
  };

  const handleConfirmDeleteProfile = async () => {
    if (!profileToDelete) return;
    setIsDeletingProfile(true);
    try {
      await deleteFieldProfile(profileToDelete.id);
      if (selectedProfileId === profileToDelete.id) {
        setSelectedProfileId(null);
      }
      setProfileToDelete(null);
      load();
    } catch (err) {
      console.error("Failed to delete profile:", err);
    } finally {
      setIsDeletingProfile(false);
    }
  };

  if (profiles === null) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Data Presets</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mb-6">
          Manage reusable shared entity data across templates to auto-fill dynamic fields in documents
        </p>
        <div className="h-64 rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  // Filter Profiles
  const filteredProfiles = profiles.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const values = p.values || {};
    
    const companyName = (p.name || values.counterparty_name || values.bill_to_company || values.our_company_name || "").toLowerCase();
    const address = (values.counterparty_address || values.our_company_address || "").toLowerCase();
    const contact = (values.counterparty_signatory_name || values.attn_name || values.our_signatory_name || "").toLowerCase();

    const matchesSearch = !q || companyName.includes(q) || address.includes(q) || contact.includes(q);

    const relevantTemplates = getRelevantTemplates(values, allTemplatesList);
    const matchesTemplate =
      selectedTemplateFilter === "all" ||
      (p.templateIds && p.templateIds.includes(selectedTemplateFilter)) ||
      relevantTemplates.some((r) => r.templateId === selectedTemplateFilter);

    const isComplete =
      (p.templateIds && p.templateIds.length > 0) ||
      (relevantTemplates.length > 0 && relevantTemplates.some((r) => r.isComplete));
    const matchesStatus =
      selectedStatusFilter === "all" ||
      (selectedStatusFilter === "complete" && isComplete) ||
      (selectedStatusFilter === "incomplete" && !isComplete);

    return matchesSearch && matchesTemplate && matchesStatus;
  });

  const totalItems = filteredProfiles.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedProfiles = filteredProfiles.slice(startIndex, startIndex + pageSize);

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);
  const selectedValues = selectedProfile?.values || {};
  const selectedCompanyName = selectedProfile?.name || selectedValues.counterparty_name || selectedValues.bill_to_company || selectedValues.notification_recipient || selectedValues.our_company_name || "Untitled Entity";
  const selectedTaxId = selectedValues.counterparty_registration_number || selectedValues.tax_id || "-";
  const selectedAddress = selectedValues.counterparty_address || selectedValues.notification_new_address_th || selectedValues.our_company_address || "-";
  const selectedPhone = selectedValues.am_phone || selectedValues.phone || "-";
  const selectedEmail = selectedValues.email || "-";
  const selectedContactName = selectedValues.counterparty_signatory_name || selectedValues.notification_signatory_name || selectedValues.attn_name || selectedValues.our_signatory_name || "-";
  const selectedPosition = selectedValues.counterparty_signatory_position || selectedValues.notification_signatory_position || selectedValues.our_signatory_position || "-";
  const selectedRelevantTemplates = selectedProfile ? getRelevantTemplates(selectedValues, allTemplatesList) : [];
  const selectedIsComplete =
    (selectedProfile?.templateIds && selectedProfile.templateIds.length > 0) ||
    (selectedRelevantTemplates.length > 0 && selectedRelevantTemplates.some((r) => r.isComplete));

  return (
    <div>
      {/* Page Header */}
      <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">{t('profileData.title') || "Data Presets"}</h1>
      <p className="text-xs sm:text-sm text-muted-foreground mb-6">
        {t('profileData.description') || "Manage reusable shared entity data across templates to auto-fill dynamic fields in documents"}
      </p>

      {/* Main Section */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Left Column Container */}
        <div className="flex-1 w-full bg-surface border border-border rounded-2xl shadow-xs p-5 space-y-4">
          
          {/* Filter & Toolbar Header */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={t('profileData.searchPlaceholder') || "Search company, signatory, or entity..."}
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-border bg-muted/30 text-xs text-foreground outline-none focus:border-primary focus:bg-surface transition-all placeholder:text-muted-foreground/70"
                />
              </div>

              {/* Template Filter Select */}
              <select
                value={selectedTemplateFilter}
                onChange={(e) => {
                  setSelectedTemplateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 px-3 rounded-xl border border-border bg-surface text-xs font-medium text-foreground outline-none cursor-pointer"
              >
                <option value="all">All Templates</option>
                {allTemplatesList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              {/* Status Filter Select */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => {
                  setSelectedStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 px-3 rounded-xl border border-border bg-surface text-xs font-medium text-foreground outline-none cursor-pointer"
              >
                <option value="all">Status: All</option>
                <option value="complete">Complete</option>
                <option value="incomplete">Incomplete</option>
              </select>
            </div>

            {/* Create New Profile Button */}
            <Link
              href="/profile-data/new"
              className="primary-button inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-[8px] text-white text-xs font-medium hover:opacity-95 transition-all shrink-0 shadow-xs"
            >
              <Plus size={15} />
              {t('profileData.newPreset') || "New Preset"}
            </Link>
          </div>

          {/* Clean Data List */}
          <div className="space-y-2.5">
            {paginatedProfiles.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-border rounded-xl bg-muted/20 text-muted-foreground text-xs">
                {searchQuery ? "No preset data matching your search" : (t('profileData.noPresetsFound') || "No presets created yet — click 'New Preset' above")}
              </div>
            ) : (
              paginatedProfiles.map((p) => {
                const isSelected = selectedProfileId === p.id;
                const values = p.values || {};
                const companyName = p.name || values.counterparty_name || values.our_company_name || "Untitled Entity";
                const address = values.counterparty_address || values.our_company_address || "No address specified";
                const formattedDate = formatThaiDateTime(p.updatedAt || p.createdAt);
                const relevant = getRelevantTemplates(values, allTemplatesList);
                const isComplete =
                  (p.templateIds && p.templateIds.length > 0) ||
                  (relevant.length > 0 && relevant.some((r) => r.isComplete));

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProfileId(p.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer bg-surface relative ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-2xs"
                        : "border-border hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Left Company Details */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Building2 size={20} />
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="font-semibold text-foreground text-sm leading-snug">{companyName}</h3>
                            {isComplete ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-200/50">
                                Complete
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-semibold border border-amber-200/50">
                                Incomplete
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1 truncate max-w-md">
                              <MapPin size={13} className="shrink-0" />
                              <span className="truncate">{address}</span>
                            </span>
                            <span className="flex items-center gap-1 shrink-0 text-[11px]">
                              <Calendar size={12} className="shrink-0" />
                              <span>{formattedDate}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProfileId(p.id);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-muted text-primary font-semibold text-xs transition-colors"
                        >
                          {t('profileData.viewDetails') || "View Details"}
                        </button>

                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === p.id ? null : p.id);
                            }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {openMenuId === p.id && (
                            <div
                              ref={menuRef}
                              className="absolute right-0 top-9 w-36 bg-surface text-foreground rounded-xl shadow-xl border border-border py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-left"
                            >
                              <Link
                                href={`/profile-data/${p.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full text-left px-3 py-2 text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
                              >
                                <Pencil size={14} className="text-muted-foreground" />
                                {t('actions.edit') || "Edit"}
                              </Link>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(null);
                                  handleDelete(p.id, p.name);
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors"
                              >
                                <Trash2 size={14} className="text-destructive" />
                                {t('actions.delete') || "Delete"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs text-muted-foreground border-t border-border">
            <div>
              Showing <strong className="font-semibold text-foreground">{totalItems > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + pageSize, totalItems)}</strong> of <strong className="font-semibold text-foreground">{totalItems}</strong> presets
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

        {/* Right Detail Panel Drawer */}
        {selectedProfile && (
          <div className="w-full lg:w-[400px] bg-surface border border-border rounded-2xl shadow-xs p-5 space-y-4 shrink-0 animate-in fade-in slide-in-from-right-4 duration-200">
            {/* Panel Header */}
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-foreground">Preset Details</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-semibold text-sm text-foreground">{selectedCompanyName}</span>
                  {selectedIsComplete ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-200/50">
                      Complete
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-semibold border border-amber-200/50">
                      Incomplete
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedProfileId(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Close panel"
              >
                <X size={18} />
              </button>
            </div>

            {/* Section 1: Basic Information */}
            <div className="space-y-2 text-xs border-b border-border pb-3">
              <h3 className="font-semibold text-xs tracking-wide text-muted-foreground uppercase">Basic Information</h3>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">Company Name</span>
                <span className="font-semibold text-foreground">{selectedCompanyName}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">Tax ID / Reg No</span>
                <span className="font-mono text-foreground">{selectedTaxId}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">Address</span>
                <span className="text-foreground leading-relaxed">{selectedAddress}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">Phone</span>
                <span className="text-foreground">{selectedPhone}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">Email</span>
                <span className="text-primary">{selectedEmail}</span>
              </div>
            </div>

            {/* Section 2: Primary Contact */}
            <div className="space-y-2 text-xs border-b border-border pb-3">
              <h3 className="font-semibold text-xs tracking-wide text-muted-foreground uppercase">Authorized Signatory</h3>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">Contact Name</span>
                <span className="font-semibold text-foreground">{selectedContactName}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">Position</span>
                <span className="text-foreground">{selectedPosition}</span>
              </div>
            </div>

            {/* Section 3: Compatible Templates */}
            <div className="space-y-2 text-xs border-b border-border pb-3">
              <h3 className="font-semibold text-xs tracking-wide text-muted-foreground uppercase">
                เทมเพลตที่ใช้ร่วมกันได้ (Compatible Templates)
              </h3>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {allTemplatesList
                  .filter(
                    (t) =>
                      selectedProfile?.templateIds?.includes(t.id) ||
                      selectedRelevantTemplates.some((r) => r.templateId === t.id)
                  )
                  .map((t) => (
                    <span
                      key={t.id}
                      className="px-2 py-0.5 rounded-md bg-muted border border-border text-[11px] font-medium text-foreground"
                    >
                      {t.name}
                    </span>
                  ))}
                {allTemplatesList.filter(
                  (t) =>
                    selectedProfile?.templateIds?.includes(t.id) ||
                    selectedRelevantTemplates.some((r) => r.templateId === t.id)
                ).length === 0 && (
                  <span className="text-muted-foreground text-[11px]">
                    ใช้งานได้กับทุกเทมเพลตทั่วไป
                  </span>
                )}
              </div>
            </div>

            {/* Panel Buttons */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                onClick={() => handleDelete(selectedProfile.id, selectedProfile.name)}
                className="h-8 px-3.5 rounded-[6px] border border-destructive/30 text-destructive hover:bg-destructive/10 font-medium text-xs transition-colors cursor-pointer"
              >
                Delete Preset
              </button>
              <Link
                href={`/profile-data/${selectedProfile.id}`}
                className="primary-button h-8 px-3.5 rounded-[6px] text-white font-medium text-xs shadow-xs hover:opacity-95 transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Pencil size={13} />
                Edit Preset
              </Link>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={Boolean(profileToDelete)}
        onClose={() => {
          if (!isDeletingProfile) setProfileToDelete(null);
        }}
        onConfirm={handleConfirmDeleteProfile}
        isLoading={isDeletingProfile}
        title={t('profileData.deletePreset') || "Delete Preset?"}
        description={
          t('profileData.deleteConfirm', { name: profileToDelete?.name || "" }) ||
          `Are you sure you want to delete preset "${profileToDelete?.name || ""}"? This action cannot be undone.`
        }
        cancelText={t('actions.cancel') || "Cancel"}
        confirmText={t('actions.delete') || "Delete"}
      />
    </div>
  );
}
