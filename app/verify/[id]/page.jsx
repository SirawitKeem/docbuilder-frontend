"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  Building2,
  UserCheck,
  Lock,
} from "lucide-react";
import CorporateSeal from "@/components/document/CorporateSeal";
import { useLanguage } from "@/context/LanguageContext";

export default function VerificationPage() {
  const params = useParams();
  const id = params?.id;
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/verify/${id}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "ไม่พบเอกสารนี้");
        setData(json);
      })
      .catch((err) => {
        setErrorMsg(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/80 flex flex-col justify-between p-4 sm:p-8 text-left">
      {/* Header */}
      <div className="max-w-xl w-full mx-auto flex items-center justify-between pb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6D28D9] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-sm shadow-xs">
            CZ
          </div>
          <div>
            <p className="text-xs font-black text-gray-900 leading-tight">{t('verification.title') || "ระบบตรวจสอบความถูกต้องเอกสาร"}</p>
            <p className="text-[10px] text-gray-400">Crest Zendo Document Verification Portal</p>
          </div>
        </div>

        <Link
          href="/"
          className="text-xs font-bold text-[#7C3AED] hover:underline flex items-center gap-1"
        >
          <span>{t('verification.enterSystem') || "เข้าสู่ระบบหลัก"}</span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="max-w-xl w-full mx-auto bg-white rounded-3xl border border-gray-200/90 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-500 font-medium">{t('verification.checking') || "กำลังตรวจสอบความถูกต้องของเอกสาร..."}</p>
          </div>
        ) : errorMsg || !data ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <ShieldAlert size={32} />
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900">{t('verification.cannotVerify') || "ไม่สามารถยืนยันเอกสารนี้ได้"}</h1>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                {errorMsg || "ไม่พบเอกสารนี้ในฐานข้อมูล หรือรหัสการยืนยันไม่ถูกต้อง โปรดติดต่อผู้ออกเอกสาร"}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-left text-xs text-gray-600 space-y-1">
              <span className="font-bold text-gray-800">รหัสตรวจสอบ:</span>
              <p className="font-mono text-rose-600 break-all">{id}</p>
            </div>
          </div>
        ) : (
          <div>
            {/* Status Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/25 text-white">
                    Verified Authenticity
                  </span>
                  <h1 className="text-base sm:text-lg font-black mt-0.5">
                    {t('verification.verified') || "เอกสารของแท้ได้รับการรับรอง"}
                  </h1>
                </div>
              </div>

              <div className="hidden sm:block opacity-90">
                <CorporateSeal className="w-16 h-16" opacity={0.9} />
              </div>
            </div>

            {/* Verification Details */}
            <div className="p-6 sm:p-8 space-y-5 text-left">
              {/* Document Identity */}
              <div className="space-y-1 pb-4 border-b border-gray-100">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {t('verification.documentName') || "ชื่อเอกสารที่ออก"}
                </span>
                <h2 className="text-base font-black text-gray-900">{data.name}</h2>
                <p className="text-xs text-gray-500 font-medium">{data.templateName}</p>
              </div>

              {/* Grid Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                    <Building2 size={12} className="text-[#7C3AED]" />
                    <span>{t('verification.issuingEntity') || "นิติบุคคลผู้ออกเอกสาร"}</span>
                  </span>
                  <p className="font-bold text-gray-900">{data.organization?.nameTh}</p>
                  <p className="text-[11px] text-gray-500">เลขภาษี: {data.organization?.taxId}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                    <UserCheck size={12} className="text-emerald-600" />
                    <span>{t('verification.authorizedSignatory') || "ผู้มีอำนาจอนุมัติและลงนาม"}</span>
                  </span>
                  <p className="font-bold text-gray-900">{data.approvedBy}</p>
                  <p className="text-[11px] text-gray-500">
                    {t('verification.approvedAt') || "อนุมัติเมื่อ: "}{new Date(data.approvedAt).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Token & Cryptographic Proof */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-900 flex items-center gap-1">
                    <Lock size={13} className="text-[#7C3AED]" />
                    <span>Verification Token (รหัสป้องกันการปลอมแปลง)</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {t('verification.activeValid') || "Active Valid"}
                  </span>
                </div>
                <p className="font-mono text-xs text-purple-800 break-all select-all font-bold bg-white p-2.5 rounded-xl border border-purple-200/80">
                  {data.verificationToken}
                </p>
                <p className="text-[10px] text-purple-600 leading-relaxed">
                  ✅ เอกสารนี้ออกโดยระบบบริหารจัดการเอกสารกลางของ บริษัท เครสท์ เซนโด จำกัด และได้รับการลงนามทางอิเล็กทรอนิกส์ตาม พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-xl w-full mx-auto text-center pt-6 text-[11px] text-gray-400">
        © 2026 บริษัท เครสท์ เซนโด จำกัด (CREST ZENDO CO., LTD.) — ระบบความปลอดภัยเอกสารองค์กร
      </div>
    </div>
  );
}
