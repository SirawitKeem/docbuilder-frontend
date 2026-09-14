"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import {
  ArrowLeft,
  Building2,
  FileText,
  Plus,
  Search,
  Pencil,
  Trash2,
  MoreHorizontal,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { listFieldProfiles, deleteFieldProfile } from "@/lib/data/fieldProfiles";
import { templateRegistry } from "@/lib/templates/registry";
import { checkCompatibility, getRelevantTemplates, getTemplateAllKeys } from "@/lib/profiles/compatibility";
import DocumentEditor from "./DocumentEditor";
import QuotationEditor from "./quotation/QuotationEditor";
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

function ProfileSelectGateContent({ templateId }) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const docIdFromUrl = searchParams.get("id") || searchParams.get("docId");
  const subTemplateId = searchParams.get("templateId");

  const [profiles, setProfiles] = useState(null);
  const [selectedId, setSelectedId] = useState(undefined); // undefined = ยังไม่เลือก
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);
  const menuRef = useRef(null);

  const entry = templateRegistry[templateId];
  const template = entry?.schema;
  const shortTemplateTitle = template?.name || template?.fullName || "เอกสาร";
  const isQuotation = template?.type === "quotation" || templateId === "quotation";

  const load = () => {
    listFieldProfiles().then((data) => {
      setProfiles(data);
    });
  };

  useEffect(() => {
    load();
  }, [templateId]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = (e, id, name) => {
    e.stopPropagation();
    setOpenMenuId(null);
    setProfileToDelete({ id, name });
  };

  const handleConfirmDeleteProfile = async () => {
    if (!profileToDelete) return;
    setIsDeletingProfile(true);
    try {
      await deleteFieldProfile(profileToDelete.id);
      setProfileToDelete(null);
      load();
    } catch (err) {
      console.error("Failed to delete profile:", err);
    } finally {
      setIsDeletingProfile(false);
    }
  };

  // หากเป็นการเปิดเอกสารเดิมด้วย ID จาก URL ให้ข้ามไปหน้า Editor ทันที
  if (docIdFromUrl) {
    if (isQuotation) {
      return <QuotationEditor docId={docIdFromUrl} />;
    }
    return <DocumentEditor templateId={templateId} docId={docIdFromUrl} />;
  }

  // เลือกแล้ว (รวมถึงเลือก "เอกสารเปล่า" ที่ selectedId = null) → เข้าตัว editor จริง
  if (selectedId !== undefined) {
    if (isQuotation) {
      return <QuotationEditor profileId={selectedId} subTemplateId={subTemplateId} />;
    }
    return <DocumentEditor templateId={templateId} profileId={selectedId} subTemplateId={subTemplateId} />;
  }

  if (profiles === null) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('profileGate.title') || "Select data preset"}</h1>
          <p className="text-sm text-gray-500">
            เทมเพลต: <span className="font-semibold text-gray-800">{shortTemplateTitle}</span>
          </p>
        </div>
        <div className="h-64 rounded-card bg-gray-100 animate-pulse" />
      </div>
    );
  }

  // กรองเฉพาะชุดข้อมูลที่ใช้งานร่วมกับ templateId นี้ได้จริง
  const templateKeys = getTemplateAllKeys(templateId);

  const filteredProfiles = profiles.filter((p) => {
    const values = p.values || {};
    const relevant = getRelevantTemplates(values);
    
    // ตรวจสอบว่าชุดข้อมูลนี้เกี่ยวข้องหรือใช้งานกับเทมเพลตนี้ได้ไหม
    const isExplicitlyCompatible = Array.isArray(p.compatibleTemplates) && (
      p.compatibleTemplates.includes(templateId) ||
      p.compatibleTemplates.includes("all") ||
      p.compatibleTemplates.length === 0
    );
    const isRelevantToThisTemplate = relevant.some((r) => r.templateId === templateId);
    const hasAnyMatchingField = templateKeys.some((k) => values[k]?.trim?.());

    // หากไม่ใช่ชุดข้อมูลที่ใช้กับเทมเพลตนี้ ให้กรองออก
    if (!isExplicitlyCompatible && !isRelevantToThisTemplate && !hasAnyMatchingField) {
      return false;
    }

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const name = (p.name || "").toLowerCase();
    const counterparty = (values.counterparty_name || values.bill_to_company || values.receiving_party_name || values.notification_recipient || values.notification_subject || "").toLowerCase();
    const signatory = (
      values.our_signatory_name ||
      values.disclosing_signatory_name ||
      values.counterparty_signatory_name ||
      values.notification_signatory_name ||
      values.attn_name ||
      values.am_name ||
      ""
    ).toLowerCase();
    return name.includes(q) || counterparty.includes(q) || signatory.includes(q);
  });

  return (
    <div>
      {/* Navigation Back */}
      <div className="mb-4">
        <Link
          href="/create"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={15} />
          {t('profileGate.backToTemplates')}
        </Link>
      </div>

      {/* Header Title Section */}
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold text-[#171717]">{t('profileGate.title')}</h1>
        <p className="text-sm text-[#646469]">
          {t('profileGate.description')} <strong className="text-[#7C3AED] font-bold">{shortTemplateTitle}</strong>
        </p>
      </div>

      {/* Main Container Card */}
      <div className="bg-white border border-[#E5E5E5] rounded-[16px] p-6 shadow-card space-y-5">
        
        {/* Toolbar: Search Input + Create Profile Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 sm:max-w-md">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={17} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`${t('profileGate.searchPresets')} ${shortTemplateTitle}...`}
              className="w-full h-9 pl-10 pr-4 rounded-[8px] border border-border bg-muted/20 focus:bg-surface text-xs text-foreground outline-none focus:border-primary transition-all placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setSelectedId(null)}
              type="button"
              className="primary-button inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-[8px] text-white text-xs font-medium shadow-xs hover:opacity-95 transition-all cursor-pointer"
            >
              <FileText size={15} />
              <span>{t('profileGate.startNow')}</span>
            </button>

            <Link
              href="/profile-data/new"
              target="_blank"
              className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-[8px] border border-border bg-surface text-foreground hover:bg-muted text-xs font-medium transition-colors shrink-0 shadow-2xs"
            >
              <Plus size={15} />
              <span>{t('profileGate.addPreset')}</span>
            </Link>
          </div>
        </div>

        {/* Profiles Table / Card List */}
        <div className="border border-gray-200/90 rounded-xl overflow-visible bg-white">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200/90 text-xs font-semibold text-gray-500 bg-gray-50/70">
                <th className="px-5 py-3.5">{t('profileGate.presetName')}</th>
                <th className="px-5 py-3.5">สถานะสำหรับ {shortTemplateTitle}</th>
                <th className="px-5 py-3.5">อัปเดตล่าสุด</th>
                <th className="px-5 py-3.5 text-right w-36">การกระทำ</th>
              </tr>
            </thead>
            <tbody>
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-gray-400 text-sm">
                    {searchQuery
                      ? "ไม่พบชุดข้อมูลที่ตรงกับการค้นหา"
                      : `ยังไม่มีชุดข้อมูลที่บันทึกไว้สำหรับ ${shortTemplateTitle} — สามารถเริ่มสร้างชุดแรกหรือเลือกเอกสารเปล่าได้เลย`}
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((p) => {
                  const companyName = p.name || p.values?.bill_to_company || p.values?.our_company_name || p.values?.counterparty_name || "บริษัท ไม่ระบุชื่อ";
                  const address = (
                    p.values?.end_user ||
                    p.values?.our_company_address ||
                    p.values?.counterparty_address ||
                    "ไม่ได้ระบุรายละเอียด"
                  );

                  const compat = checkCompatibility(p.values || {}, templateId);

                  return (
                    <tr
                      key={p.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors"
                    >
                      {/* Company Name & Address */}
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Building2 size={20} />
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 text-sm block">{companyName}</span>
                            <p className="text-xs text-gray-400 mt-1 max-w-lg leading-relaxed line-clamp-2">
                              {address}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Compatibility status */}
                      <td className="px-5 py-4 text-xs font-medium">
                        {compat.isComplete ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                            <CheckCircle2 size={13} /> {t('profileGate.complete')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold">
                            <AlertCircle size={13} /> {t('profileGate.missingFields', { count: compat.missing.length })}
                          </span>
                        )}
                      </td>

                      {/* Last Updated */}
                      <td className="px-5 py-4 text-gray-500 text-xs font-mono">
                        {formatThaiDateTime(p.updatedAt || p.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right relative">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedId(p.id)}
                            className="primary-button h-8 px-3.5 rounded-[8px] text-white text-xs font-medium shadow-xs hover:opacity-95 transition-all shrink-0 cursor-pointer"
                          >
                            เลือกใช้งาน
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === p.id ? null : p.id);
                            }}
                            className="size-8 rounded-[8px] border border-border bg-surface hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                            title="ตัวเลือกเพิ่มเติม"
                          >
                            <MoreHorizontal size={15} />
                          </button>

                          {/* Dropdown Menu */}
                          {openMenuId === p.id && (
                            <div
                              ref={menuRef}
                              className="absolute right-5 top-11 w-36 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-left"
                            >
                              <Link
                                href={`/profile-data/${p.id}`}
                                target="_blank"
                                onClick={() => setOpenMenuId(null)}
                                className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                              >
                                <Pencil size={14} className="text-gray-500" />
                                แก้ไขข้อมูล
                              </Link>
                              <button
                                onClick={(e) => handleDelete(e, p.id, p.name)}
                                className="w-full text-left px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                              >
                                <Trash2 size={14} className="text-red-500" />
                                ลบชุดข้อมูล
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

        {/* Blank Document Choice Card */}
        <div
          onClick={() => setSelectedId(null)}
          className="w-full flex items-center justify-between p-4 rounded-[16px] border border-dashed border-[#E5E5E5] bg-gray-50/50 hover:bg-[#F6F6FA] transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3.5 min-w-0 pr-4">
            <div className="w-10 h-10 rounded-[10px] bg-gray-200 text-gray-600 flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[#171717] text-sm group-hover:text-[#7C3AED] transition-colors">
                {t('profileGate.blankDocument')}
              </p>
              <p className="text-xs text-[#646469] mt-0.5 truncate">
                {t('profileGate.blankDesc')}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] bg-surface border border-border text-foreground text-xs font-medium group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all shadow-2xs">
            <span>{t('profileGate.blankDocument')}</span>
            <ChevronRight size={15} />
          </div>
        </div>

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
        zIndex="z-[60]"
      />
    </div>
  );
}

export default function ProfileSelectGate(props) {
  return (
    <Suspense
      fallback={
        <div className="h-64 flex items-center justify-center text-gray-400 font-medium text-sm">
          กำลังโหลด...
        </div>
      }
    >
      <ProfileSelectGateContent {...props} />
    </Suspense>
  );
}
