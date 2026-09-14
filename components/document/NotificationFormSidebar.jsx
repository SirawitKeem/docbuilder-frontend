"use client";

import React from "react";
import {
  Calendar,
  Building2,
  UserCheck,
  Sparkles,
  Megaphone,
  MapPin,
  Clock,
} from "lucide-react";
import { useDocumentFields } from "@/context/DocumentFieldsContext";
import {
  formatDocumentDate,
  formatEffectiveDateTh,
  formatEffectiveDateEn,
  formatEffectiveDateBadge,
  getTodayIsoDate,
} from "@/lib/utils/dateFormatter";
import { useLanguage } from "@/context/LanguageContext";

export default function NotificationFormSidebar({ template, isOpen }) {
  const { values, setField } = useDocumentFields();
  const { t } = useLanguage();

  if (!isOpen) return null;

  const handleDocDatePick = (isoDate) => {
    if (!isoDate) return;
    const formatted = formatDocumentDate(isoDate);
    setField("doc_date", formatted);
  };

  const handleEffectiveDatePick = (isoDate) => {
    if (!isoDate) return;
    const th = formatEffectiveDateTh(isoDate);
    const en = formatEffectiveDateEn(isoDate);
    const badge = formatEffectiveDateBadge(isoDate);
    setField("effective_date", th);
    setField("effective_date_en", en);
    setField("effective_date_badge", badge);
  };

  const fields = template?.fields || [];
  const requiredFields = fields.filter((f) => f.required);
  const filledRequiredCount = requiredFields.filter((f) => {
    const val = values[f.id] || (f.sharedKey ? values[f.sharedKey] : "");
    return val && String(val).trim().length > 0;
  }).length;
  const isComplete = requiredFields.length > 0 && filledRequiredCount === requiredFields.length;

  return (
    <div className="w-[360px] xl:w-[400px] bg-white border-r border-[#E4E4E8] flex flex-col h-full shrink-0 shadow-sm z-20 select-none">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-[#E4E4E8] bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Megaphone size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 leading-none">{t('notificationForm.title') || "กรอกข้อมูลหนังสือแจ้ง"}</h2>
              <span className="text-[11px] text-gray-500">{template?.fullName || "หนังสือแจ้งและประกาศ"}</span>
            </div>
          </div>

          <button
            onClick={() => handleDocDatePick(getTodayIsoDate())}
            type="button"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
            title="ตั้งวันที่ออกเอกสารเป็นวันนี้"
          >
            <Sparkles size={12} />
            <span>ใส่วันที่วันนี้</span>
          </button>
        </div>

        {/* Completion Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-500 font-medium">ความสมบูรณ์ของฟิลด์</span>
            <span className={`font-bold ${isComplete ? "text-emerald-600" : "text-rose-600"}`}>
              {filledRequiredCount} / {requiredFields.length} ฟิลด์
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isComplete ? "bg-emerald-500" : "bg-gradient-to-r from-rose-500 to-red-600"
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
        
        {/* Section 1: ข้อมูลหนังสือและวันที่ออกเอกสาร */}
        <div className="space-y-3 p-3.5 rounded-xl border border-gray-100 bg-[#FAFAFC]">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
            <Calendar size={15} className="text-rose-600" />
            <span>{t('notificationForm.section1') || "1. ข้อมูลหนังสือและวันที่ออกเอกสาร"}</span>
          </div>

          {/* Smart Date Picker for Document Date */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-gray-600">
                วันที่ออกเอกสาร (Date) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400">เลือกปฏิทิน:</span>
                <input
                  type="date"
                  onChange={(e) => handleDocDatePick(e.target.value)}
                  className="text-[10px] border border-gray-200 rounded px-1.5 py-0.5 bg-white text-gray-700 cursor-pointer outline-none focus:border-rose-500"
                  title="เลือกวันที่จากปฏิทินเพื่อแปลง 2 ภาษาอัตโนมัติ"
                />
              </div>
            </div>
            <input
              type="text"
              value={values.doc_date || ""}
              onChange={(e) => setField("doc_date", e.target.value)}
              placeholder="01 กันยายน 2569 / September 01, 2026"
              className="w-full h-9 px-3 text-xs rounded-lg border border-gray-200 bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
            />
          </div>

          {/* Recipient */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-600">
              เรียน / ผู้รับ (To / Recipient) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={values.recipient || ""}
              onChange={(e) => setField("recipient", e.target.value)}
              placeholder="ท่านคู่ค้าและลูกค้าผู้มีอุปการคุณ / Valued Business Partners"
              className="w-full h-9 px-3 text-xs rounded-lg border border-gray-200 bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
            />
          </div>

          {/* Subject */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-600">
              เรื่อง / หัวข้อ (Subject) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={values.subject || ""}
              onChange={(e) => setField("subject", e.target.value)}
              placeholder="แจ้งเปลี่ยนแปลงที่อยู่สำนักงานใหญ่ / Change of Head Office Address"
              className="w-full h-9 px-3 text-xs rounded-lg border border-gray-200 bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Section 2: วันที่มีผลบังคับใช้ (Effective Date) */}
        <div className="space-y-3 p-3.5 rounded-xl border border-rose-100/70 bg-rose-50/20">
          <div className="flex items-center justify-between text-xs font-bold text-gray-800">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-rose-600" />
              <span>{t('notificationForm.section2') || "2. วันที่มีผลบังคับใช้ (Effective Date)"}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-rose-600 font-normal">เลือกปฏิทิน:</span>
              <input
                type="date"
                onChange={(e) => handleEffectiveDatePick(e.target.value)}
                className="text-[10px] border border-rose-200 rounded px-1.5 py-0.5 bg-white text-gray-700 cursor-pointer outline-none focus:border-rose-500"
                title="เลือกวันที่เพื่ออัปเดตทั้งภาษาไทยและอังกฤษพร้อมกัน"
              />
            </div>
          </div>

          {/* Thai Effective Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-600">
              {t('notificationForm.effectiveDateTH') || "วันที่มีผล (ภาษาไทย)"} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={values.effective_date || ""}
              onChange={(e) => setField("effective_date", e.target.value)}
              placeholder="16 กันยายน 2569"
              className="w-full h-9 px-3 text-xs rounded-lg border border-gray-200 bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
            />
          </div>

          {/* English Effective Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-600">
              {t('notificationForm.effectiveDateEN') || "Effective Date (English)"} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={values.effective_date_en || ""}
              onChange={(e) => setField("effective_date_en", e.target.value)}
              placeholder="September 16, 2026"
              className="w-full h-9 px-3 text-xs rounded-lg border border-gray-200 bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Section 3: ข้อมูลที่อยู่เดิม (Previous Address) */}
        <div className="space-y-3 p-3.5 rounded-xl border border-gray-100 bg-[#FAFAFC]">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
            <Building2 size={15} className="text-gray-600" />
            <span>{t('notificationForm.section3') || "3. ที่อยู่เดิม (Previous Address)"}</span>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-600">
              {t('notificationForm.prevAddressTH') || "ที่อยู่เดิม (ภาษาไทย)"} <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={values.old_address_th || ""}
              onChange={(e) => setField("old_address_th", e.target.value)}
              placeholder="45 ซอยโกสุมรวมใจ 37 แขวงดอนเมือง เขตดอนเมือง กรุงเทพมหานคร 10210"
              className="w-full p-2.5 text-xs rounded-lg border border-gray-200 bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-600">
              {t('notificationForm.prevAddressEN') || "Previous Address (ภาษาอังกฤษ)"} <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={values.old_address_en || ""}
              onChange={(e) => setField("old_address_en", e.target.value)}
              placeholder="45 Soi Kosum Ruam Chai 37, Don Mueang, Don Mueang, Bangkok 10210, Thailand"
              className="w-full p-2.5 text-xs rounded-lg border border-gray-200 bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* Section 4: ข้อมูลที่อยู่ใหม่ (New Address) */}
        <div className="space-y-3 p-3.5 rounded-xl border border-blue-100/80 bg-blue-50/20">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
            <MapPin size={15} className="text-blue-600" />
            <span>4. ที่อยู่ใหม่ (New Address)</span>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-600">
              {t('notificationForm.newAddressTH') || "ที่อยู่ใหม่ (ภาษาไทย)"} <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={values.new_address_th || ""}
              onChange={(e) => setField("new_address_th", e.target.value)}
              placeholder="18 ซอยโกสุมรวมใจ 35 แยก 4 แขวงดอนเมือง เขตดอนเมือง กรุงเทพมหานคร 10210"
              className="w-full p-2.5 text-xs rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-600">
              {t('notificationForm.newAddressEN') || "New Address (ภาษาอังกฤษ)"} <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={values.new_address_en || ""}
              onChange={(e) => setField("new_address_en", e.target.value)}
              placeholder="18 Soi Kosum Ruam Chai 35 Yaek 4, Don Mueang, Don Mueang, Bangkok 10210, Thailand"
              className="w-full p-2.5 text-xs rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* Section 5: ผู้มีอำนาจลงนาม (Signatory) */}
        <div className="space-y-3 p-3.5 rounded-xl border border-gray-100 bg-[#FAFAFC]">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
            <UserCheck size={15} className="text-rose-600" />
            <span>{t('notificationForm.section4') || "5. ผู้มีอำนาจลงนาม (Signatory)"}</span>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-600">
              ชื่อผู้ลงนาม <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={values.signatory_name || ""}
              onChange={(e) => setField("signatory_name", e.target.value)}
              placeholder="นายศรายุทธ  โกสิยารักษ์"
              className="w-full h-9 px-3 text-xs rounded-lg border border-gray-200 bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-600">
              ตำแหน่งผู้ลงนาม <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={values.signatory_position || ""}
              onChange={(e) => setField("signatory_position", e.target.value)}
              placeholder="กรรมการผู้จัดการ / CEO"
              className="w-full h-9 px-3 text-xs rounded-lg border border-gray-200 bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
