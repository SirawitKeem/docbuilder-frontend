"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Building2,
  CheckCircle2,
  Camera,
  Trash2,
  Upload,
  AlertCircle,
  Loader2,
  Globe,
  Mail,
  Phone,
} from "lucide-react";
import {
  SettingsPageHeader,
  SettingsSectionHeading,
  SettingsCard,
} from "@/components/settings/SettingsUI";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { optimizeImageFile } from "@/lib/utils/imageUpload";

export default function GeneralSettingsPage() {
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [organization, setOrganization] = useState({
    name: "บริษัท เครสท์ เซนโด จำกัด",
    nameEn: "Crest Zendo Co., Ltd.",
    taxId: "0105558073755",
    branch: "สำนักงานใหญ่",
    address:
      "8/40 The Connect 37, ซอยช่างอากาศอุทิศ 10 แยก 1-2 แขวงดอนเมือง เขตดอนเมือง กรุงเทพมหานคร 10210",
    phone: "02-123-4567",
    email: "contact@crestzendo.com",
    website: "https://crestzendo.com",
    logo: "",
  });

  // Fetch settings from API
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.organization) {
          setOrganization((prev) => ({
            ...prev,
            ...data.organization,
          }));
        }
      })
      .catch((err) => console.error("Failed to fetch organization settings:", err))
      .finally(() => setLoading(false));
  }, []);

  // Logo upload
  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMsg("");
      // Optimize logo up to 600x300 for crisp document headers
      const optimized = await optimizeImageFile(file, 600, 300, 0.9);
      setOrganization((prev) => ({ ...prev, logo: optimized }));
    } catch (err) {
      console.error("Failed to process logo image:", err);
      setErrorMsg("ไม่สามารถประมวลผลไฟล์โลโก้ได้ กรุณาใช้ไฟล์รูปภาพ (PNG, JPG, WebP)");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = () => {
    setOrganization((prev) => ({ ...prev, logo: "" }));
  };

  // Save changes
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization,
        }),
      });

      if (!res.ok) throw new Error("บันทึกข้อมูลไม่สำเร็จ");

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save organization settings:", err);
      setErrorMsg("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[640px] pb-12 text-left">
      <SettingsPageHeader
        title={t("general.title") || "General"}
        description={
          t("general.description") ||
          "Manage organization identity, head office legal address, and corporate logo."
        }
      />

      {loading ? (
        <div className="h-96 rounded-xl bg-muted/60 animate-pulse" />
      ) : (
        <form onSubmit={handleSave} className="space-y-8">
          {/* Organization Details Section */}
          <div>
            <SettingsSectionHeading
              title={t("general.companyDetails") || "Organization identity"}
              description="ข้อมูลนิติบุคคลทางการและโลโก้บริษัทสำหรับใช้บนเอกสารทั้งหมดที่ออกในระบบ"
            />
            <SettingsCard className="p-6 space-y-6">
              {/* Logo Section */}
              <div className="space-y-2 pb-4 border-b border-border/50">
                <label className="block text-xs font-semibold text-foreground">
                  โลโก้บริษัท (Company Logo)
                </label>
                <div className="flex items-center gap-5">
                  <div className="w-32 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30 overflow-hidden relative group shrink-0">
                    {organization.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={organization.logo}
                        alt="Company Logo"
                        className="max-h-full max-w-full object-contain p-1.5"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground gap-1">
                        <Building2 size={20} className="text-muted-foreground/60" />
                        <span className="text-[10px] font-medium">ยังไม่มีโลโก้</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs h-8 gap-1.5 cursor-pointer"
                      >
                        <Upload size={13} />
                        <span>{organization.logo ? "เปลี่ยนโลโก้" : "อัปโหลดโลโก้"}</span>
                      </Button>
                      {organization.logo && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveLogo}
                          className="text-xs h-8 text-muted-foreground hover:text-destructive gap-1 cursor-pointer"
                        >
                          <Trash2 size={13} />
                          <span>ลบ</span>
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      แนะนำเป็นไฟล์ PNG พื้นหลังโปร่งใส หรือ JPG (ขนาดกว้างสูงสุด 600px)
                    </p>
                  </div>
                </div>
              </div>

              {/* Company Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    ชื่อบริษัทภาษาไทย (Company Name TH)
                  </label>
                  <input
                    type="text"
                    value={organization.name}
                    onChange={(e) =>
                      setOrganization((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="บริษัท เครสท์ เซนโด จำกัด"
                    className="w-full h-9 px-3 rounded-[8px] border border-border bg-background text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    ชื่อบริษัทภาษาอังกฤษ (Company Name EN)
                  </label>
                  <input
                    type="text"
                    value={organization.nameEn}
                    onChange={(e) =>
                      setOrganization((prev) => ({ ...prev, nameEn: e.target.value }))
                    }
                    placeholder="Crest Zendo Co., Ltd."
                    className="w-full h-9 px-3 rounded-[8px] border border-border bg-background text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Tax ID & Branch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    {t("general.taxId") || "Tax Registration Number (13 Digits)"}
                  </label>
                  <input
                    type="text"
                    value={organization.taxId}
                    onChange={(e) =>
                      setOrganization((prev) => ({ ...prev, taxId: e.target.value }))
                    }
                    placeholder="0105558073755"
                    className="w-full h-9 px-3 rounded-[8px] border border-border bg-background text-xs text-foreground font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    {t("general.headOffice") || "Head Office / Branch"}
                  </label>
                  <input
                    type="text"
                    value={organization.branch}
                    onChange={(e) =>
                      setOrganization((prev) => ({ ...prev, branch: e.target.value }))
                    }
                    placeholder="สำนักงานใหญ่"
                    className="w-full h-9 px-3 rounded-[8px] border border-border bg-background text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  {t("general.addressEN") || "Head office address"}
                </label>
                <textarea
                  rows={2}
                  value={organization.address}
                  onChange={(e) =>
                    setOrganization((prev) => ({ ...prev, address: e.target.value }))
                  }
                  className="w-full p-2.5 rounded-[8px] border border-border bg-background text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-2xs resize-none leading-relaxed"
                />
              </div>

              {/* Contact Info (Phone, Email, Website) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border/50">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground flex items-center gap-1">
                    <Phone size={12} className="text-muted-foreground" />
                    <span>เบอร์โทรศัพท์</span>
                  </label>
                  <input
                    type="text"
                    value={organization.phone || ""}
                    onChange={(e) =>
                      setOrganization((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="02-123-4567"
                    className="w-full h-9 px-3 rounded-[8px] border border-border bg-background text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground flex items-center gap-1">
                    <Mail size={12} className="text-muted-foreground" />
                    <span>อีเมลติดต่อ</span>
                  </label>
                  <input
                    type="email"
                    value={organization.email || ""}
                    onChange={(e) =>
                      setOrganization((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="contact@crestzendo.com"
                    className="w-full h-9 px-3 rounded-[8px] border border-border bg-background text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground flex items-center gap-1">
                    <Globe size={12} className="text-muted-foreground" />
                    <span>เว็บไซต์</span>
                  </label>
                  <input
                    type="url"
                    value={organization.website || ""}
                    onChange={(e) =>
                      setOrganization((prev) => ({ ...prev, website: e.target.value }))
                    }
                    placeholder="https://crestzendo.com"
                    className="w-full h-9 px-3 rounded-[8px] border border-border bg-background text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-2xs"
                  />
                </div>
              </div>
            </SettingsCard>
          </div>

          {/* Form Actions & Feedback */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {saved && (
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-medium animate-in fade-in">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>บันทึกข้อมูลองค์กรเรียบร้อยแล้ว</span>
                </div>
              )}
              {errorMsg && (
                <div className="flex items-center gap-2 text-destructive text-xs font-medium animate-in fade-in">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="text-xs h-9 px-5 primary-button"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-1.5" />
                    <span>{t("actions.saving") || "กำลังบันทึก..."}</span>
                  </>
                ) : (
                  <span>{t("account.saveChanges") || "บันทึกการเปลี่ยนแปลง"}</span>
                )}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
