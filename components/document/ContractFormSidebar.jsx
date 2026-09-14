"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Calendar,
  Building2,
  UserCheck,
  Sparkles,
  CheckCircle2,
  FileSignature,
  PenTool,
  Trash2,
} from "lucide-react";
import { useDocumentFields } from "@/context/DocumentFieldsContext";
import SignaturePadModal from "./SignaturePadModal";

export default function ContractFormSidebar({ template, isOpen }) {
  const { t } = useLanguage();
  const { values, setField } = useDocumentFields();
  const [sigModalTarget, setSigModalTarget] = useState(null); // 'our' | 'counterparty' | null

  if (!isOpen) return null;

  const isDistributorOrPartner = template?.id === "distributor" || template?.id === "partner";
  const isPartner = template?.id === "partner";

  const handleFillTodayDate = () => {
    const now = new Date();
    const thaiMonths = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    setField("contract_date_day", String(now.getDate()));
    setField("contract_date_month", thaiMonths[now.getMonth()]);
    setField("contract_date_year", String(now.getFullYear() + 543));
    if (!values.contract_location && template?.id !== "partner") {
      setField("contract_location", "กรุงเทพมหานคร");
    }
  };

  const fields = template?.fields || [];
  const requiredFields = fields.filter((f) => f.required);
  const filledRequiredCount = requiredFields.filter((f) => {
    const val = values[f.id] || (f.sharedKey ? values[f.sharedKey] : "");
    return val && String(val).trim().length > 0;
  }).length;
  const isComplete = requiredFields.length > 0 && filledRequiredCount === requiredFields.length;

  return (
    <div className="w-[360px] xl:w-[400px] bg-white border-r border-[#E5E5E5] flex flex-col h-full shrink-0 shadow-sm z-20 select-none">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-[#E5E5E5] bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center">
              <FileSignature size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 leading-none">กรอกข้อมูลสัญญา</h2>
              <span className="text-[11px] text-gray-500">{template?.name || "หนังสือสัญญา"}</span>
            </div>
          </div>

          <button
            onClick={handleFillTodayDate}
            type="button"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F0EBFF] hover:bg-[#E5DCFF] text-[#7C3AED] text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
            title="ใส่วันที่ปัจจุบันอัตโนมัติ"
          >
            <Sparkles size={12} />
            <span>{t('contractForm.todayDate')}</span>
          </button>
        </div>

        {/* Completion Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-500 font-medium">ความสมบูรณ์ของฟิลด์</span>
            <span className={`font-bold ${isComplete ? "text-emerald-600" : "text-[#7C3AED]"}`}>
              {filledRequiredCount} / {requiredFields.length} ฟิลด์
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isComplete ? "bg-emerald-500" : "bg-gradient-to-r from-[#7C3AED] to-[#7C3AED]"
              }`}
              style={{
                width: `${requiredFields.length > 0 ? (filledRequiredCount / requiredFields.length) * 100 : 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Form Fields Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin text-left">
        
        {/* Section 1: ข้อมูลสัญญา & วันที่ */}
        <div className="space-y-3 p-3.5 rounded-xl border border-gray-100 bg-[#FAFAFC]">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
            <Calendar size={15} className="text-[#7C3AED]" />
            <span>{t('contractForm.section1')}</span>
          </div>

          {template?.id !== "partner" && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-600">สถานที่ทำสัญญา</label>
              <input
                type="text"
                value={values.contract_location || ""}
                onChange={(e) => setField("contract_location", e.target.value)}
                placeholder="เช่น กรุงเทพมหานคร"
                className="w-full h-9 px-3 text-xs rounded-lg border border-gray-200 bg-white focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] outline-none transition-all"
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-600">วัน</label>
              <input
                type="text"
                value={values.contract_date_day || ""}
                onChange={(e) => setField("contract_date_day", e.target.value)}
                placeholder="17"
                className="w-full h-9 px-2.5 text-xs text-center rounded-lg border border-gray-200 bg-white focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-600">เดือน</label>
              <input
                type="text"
                value={values.contract_date_month || ""}
                onChange={(e) => setField("contract_date_month", e.target.value)}
                placeholder="สิงหาคม"
                className="w-full h-9 px-2.5 text-xs text-center rounded-lg border border-gray-200 bg-white focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-600">ปี พ.ศ.</label>
              <input
                type="text"
                value={values.contract_date_year || ""}
                onChange={(e) => setField("contract_date_year", e.target.value)}
                placeholder="2569"
                className="w-full h-9 px-2.5 text-xs text-center rounded-lg border border-gray-200 bg-white focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 2: ข้อมูลคู่สัญญา (Reseller หรือ ผู้รับข้อมูล) */}
        <div className="space-y-3 p-3.5 rounded-xl border border-gray-100 bg-[#FAFAFC]">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
            <Building2 size={15} className="text-[#7C3AED]" />
            <span>
              {isDistributorOrPartner ? t('contractForm.section2') : "ข้อมูลคู่สัญญา (ผู้รับข้อมูล)"}
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-600">
              ชื่อบริษัท / นิติบุคคล <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={
                isDistributorOrPartner
                  ? values.reseller_name || values.counterparty_name || ""
                  : values.receiving_party_name || values.counterparty_name || ""
              }
              onChange={(e) => {
                const val = e.target.value;
                if (isDistributorOrPartner) {
                  setField("reseller_name", val);
                } else {
                  setField("receiving_party_name", val);
                }
                setField("counterparty_name", val);
              }}
              placeholder={isDistributorOrPartner ? "บริษัท ตัวแทนจำหน่าย จำกัด" : "บริษัท คู่สัญญา จำกัด"}
              className="w-full h-9 px-3 text-xs rounded-lg border border-gray-200 bg-white focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] outline-none transition-all"
            />
          </div>

          {/* เลขทะเบียนนิติบุคคล (สำหรับสัญญา Partner หรือ Distributor) */}
          {(isPartner || isDistributorOrPartner) && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-600">
                เลขทะเบียนนิติบุคคล (13 หลัก) {isPartner && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={values.reseller_registration_number || values.counterparty_registration_number || ""}
                onChange={(e) => {
                  setField("reseller_registration_number", e.target.value);
                  setField("counterparty_registration_number", e.target.value);
                }}
                placeholder="เช่น 0105558000000"
                className="w-full h-9 px-3 text-xs rounded-lg border border-gray-200 bg-white focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] outline-none transition-all"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-600">
              ที่อยู่สำนักงานใหญ่ <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={
                isDistributorOrPartner
                  ? values.reseller_address || values.counterparty_address || ""
                  : values.receiving_party_address || values.counterparty_address || ""
              }
              onChange={(e) => {
                const val = e.target.value;
                if (isDistributorOrPartner) {
                  setField("reseller_address", val);
                } else {
                  setField("receiving_party_address", val);
                }
                setField("counterparty_address", val);
              }}
              placeholder="เลขที่ ... ถนน ... แขวง/ตำบล ... เขต/อำเภอ ... จังหวัด ... รหัสไปรษณีย์ ..."
              className="w-full p-2.5 text-xs rounded-lg border border-gray-200 bg-white focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] outline-none transition-all resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Section 3: ข้อมูลผู้ลงนาม & ลายเซ็นดิจิทัลคู่สัญญา */}
        <div className="space-y-3 p-3.5 rounded-xl border border-gray-100 bg-[#FAFAFC]">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
            <UserCheck size={15} className="text-[#7C3AED]" />
            <span>{t('contractForm.section3')} ({isDistributorOrPartner ? "Reseller" : "คู่สัญญา"})</span>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-600">
              ชื่อ-นามสกุล ผู้มีอำนาจลงนาม <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={
                isDistributorOrPartner
                  ? values.reseller_signatory_name || values.counterparty_signatory_name || ""
                  : values.receiving_signatory_name || values.counterparty_signatory_name || ""
              }
              onChange={(e) => {
                const val = e.target.value;
                if (isDistributorOrPartner) {
                  setField("reseller_signatory_name", val);
                } else {
                  setField("receiving_signatory_name", val);
                }
                setField("counterparty_signatory_name", val);
              }}
              placeholder="เช่น นายสมชาย ตัวอย่าง"
              className="w-full h-9 px-3 text-xs rounded-lg border border-gray-200 bg-white focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-600">
              ตำแหน่ง <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={
                isDistributorOrPartner
                  ? values.reseller_signatory_position || values.counterparty_signatory_position || ""
                  : values.receiving_signatory_position || values.counterparty_signatory_position || ""
              }
              onChange={(e) => {
                const val = e.target.value;
                if (isDistributorOrPartner) {
                  setField("reseller_signatory_position", val);
                } else {
                  setField("receiving_signatory_position", val);
                }
                setField("counterparty_signatory_position", val);
              }}
              placeholder="เช่น กรรมการผู้จัดการ"
              className="w-full h-9 px-3 text-xs rounded-lg border border-gray-200 bg-white focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] outline-none transition-all"
            />
          </div>

          {/* ลายเซ็นคู่สัญญา */}
          <div className="pt-2 border-t border-gray-200/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-gray-600">ลายมือชื่อดิจิทัล (คู่สัญญา)</label>
              <button
                type="button"
                onClick={() => setSigModalTarget("counterparty")}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7C3AED] hover:underline cursor-pointer"
              >
                <PenTool size={11} />
                <span>{values.counterparty_signature_image ? "เปลี่ยนลายเซ็น" : "วาด/แนบลายเซ็น"}</span>
              </button>
            </div>

            {values.counterparty_signature_image ? (
              <div className="relative border border-purple-200 bg-purple-50/40 rounded-xl p-2 flex items-center justify-between">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={values.counterparty_signature_image}
                  alt="ลายเซ็นคู่สัญญา"
                  className="max-h-10 max-w-[140px] object-contain"
                />
                <button
                  type="button"
                  onClick={() => setField("counterparty_signature_image", null)}
                  className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="ลบลายเซ็น"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ) : (
              <p className="text-[10px] text-gray-400 italic">ยังไม่ได้แนบลายเซ็น (แสดงจุดไข่ปลาบนกระดาษ A4)</p>
            )}
          </div>
        </div>

        {/* Section 4: ข้อมูลฝ่ายเรา (เครสท์ เซนโด) & ลายเซ็น */}
        <div className="p-3.5 rounded-xl border border-purple-100 bg-[#FBF9FF] text-xs text-gray-600 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="font-bold text-[#7C3AED] flex items-center gap-1.5">
              <CheckCircle2 size={14} /> {t('contractForm.section4')}
            </p>
            <button
              type="button"
              onClick={() => setSigModalTarget("our")}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7C3AED] hover:underline cursor-pointer"
            >
              <PenTool size={11} />
              <span>{values.our_signature_image ? "เปลี่ยนลายเซ็น" : "วาด/แนบลายเซ็น"}</span>
            </button>
          </div>

          <p className="text-[11px] leading-relaxed text-gray-600">
            <strong>บริษัท เครสท์ เซนโด จำกัด</strong>
            <br />
            ผู้ลงนาม: นายศรายุทธ โกสิยารักษ์ (CEO/Founder)
          </p>

          {values.our_signature_image ? (
            <div className="relative border border-purple-200 bg-white rounded-xl p-2 flex items-center justify-between">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={values.our_signature_image}
                alt="ลายเซ็นฝ่ายเรา"
                className="max-h-10 max-w-[140px] object-contain"
              />
              <button
                type="button"
                onClick={() => setField("our_signature_image", null)}
                className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="ลบลายเซ็น"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ) : (
            <p className="text-[10px] text-gray-400 italic">ยังไม่ได้แนบลายเซ็นฝ่ายเรา</p>
          )}

          {/* ตราประทับบริษัทสีแดง Toggle */}
          <label className="flex items-center justify-between pt-2 border-t border-purple-100/80 text-gray-700 cursor-pointer">
            <span className="text-[11px] font-semibold text-gray-700">{t('contractForm.companySeal')}</span>
            <input
              type="checkbox"
              checked={values.include_seal !== false}
              onChange={(e) => setField("include_seal", e.target.checked)}
              className="w-4 h-4 rounded text-[#7C3AED] accent-[#7C3AED] cursor-pointer"
            />
          </label>
        </div>

        {/* Section 5: ความปลอดภัย & ลายน้ำ PDF */}
        <div className="space-y-2 p-3.5 rounded-xl border border-gray-100 bg-[#FAFAFC]">
          <div className="flex items-center justify-between text-xs font-bold text-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-[#7C3AED]">🛡️</span>
              <span>{t('contractForm.section5')}</span>
            </div>
          </div>
          <select
            value={values.watermark || "none"}
            onChange={(e) => setField("watermark", e.target.value)}
            className="w-full h-9 px-2.5 text-xs rounded-lg border border-gray-200 bg-white focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] outline-none transition-all cursor-pointer font-medium"
          >
            <option value="none">⚪ {t('watermark.none')}</option>
            <option value="DRAFT">🟡 {t('watermark.draft')}</option>
            <option value="COPY">🔵 {t('watermark.copy')}</option>
            <option value="CONFIDENTIAL">🔴 {t('watermark.confidential')}</option>
          </select>
        </div>

      </div>

      {/* Signature Pad Modal */}
      {sigModalTarget && (
        <SignaturePadModal
          title={sigModalTarget === "our" ? "ลายมือชื่อฝ่ายเรา (Crest Zendo)" : "ลายมือชื่อคู่สัญญา (Counterparty)"}
          partyName={sigModalTarget === "our" ? "นายศรายุทธ โกสิยารักษ์ (CEO/Founder)" : (values.reseller_signatory_name || values.receiving_signatory_name || "ผู้มีอำนาจลงนาม")}
          initialImage={sigModalTarget === "our" ? values.our_signature_image : values.counterparty_signature_image}
          onSave={(dataUrl) => {
            if (sigModalTarget === "our") {
              setField("our_signature_image", dataUrl);
            } else {
              setField("counterparty_signature_image", dataUrl);
            }
          }}
          onClose={() => setSigModalTarget(null)}
        />
      )}
    </div>
  );
}
