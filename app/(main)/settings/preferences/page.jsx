"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, CheckCircle2, Download, Globe, Loader2 } from "lucide-react";
import {
  SettingsPageHeader,
  SettingsSectionHeading,
  SettingsCard,
} from "@/components/settings/SettingsUI";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

export default function PreferencesPage() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [defaultExportFormat, setDefaultExportFormat] = useState("pdf");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fetch current settings
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (data.preferences?.defaultExportFormat) {
            setDefaultExportFormat(data.preferences.defaultExportFormat);
          }
          if (data.language && data.language !== locale) {
            setLocale(data.language);
          }
        }
      })
      .catch((err) => console.error("Failed to fetch settings:", err));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: {
            theme,
            language: locale,
            defaultExportFormat,
          },
          language: locale,
          theme,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[640px] pb-12 text-left">
      <SettingsPageHeader
        title={t("preferences.title") || "Preferences"}
        description={
          t("preferences.description") ||
          "Customize your interface appearance, display theme, and workspace defaults."
        }
      />

      <form onSubmit={handleSave} className="space-y-8">
        {/* Theme Section */}
        <div>
          <SettingsSectionHeading
            title={t("preferences.appearanceTheme") || "Appearance theme"}
            description={
              t("preferences.themeDescription") ||
              "Select how the DocBuilder workspace looks to you."
            }
          />
          <SettingsCard className="p-6 space-y-4">
            {mounted ? (
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-[10px] border text-xs font-medium transition-all cursor-pointer ${
                    theme === "light"
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                      : "border-border hover:bg-muted/50 text-foreground"
                  }`}
                >
                  <Sun size={20} />
                  <span>{t("preferences.light") || "Light"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-[10px] border text-xs font-medium transition-all cursor-pointer ${
                    theme === "dark"
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                      : "border-border hover:bg-muted/50 text-foreground"
                  }`}
                >
                  <Moon size={20} />
                  <span>{t("preferences.dark") || "Dark"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-[10px] border text-xs font-medium transition-all cursor-pointer ${
                    theme === "system"
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                      : "border-border hover:bg-muted/50 text-foreground"
                  }`}
                >
                  <Monitor size={20} />
                  <span>{t("preferences.system") || "System"}</span>
                </button>
              </div>
            ) : (
              <div className="h-16 rounded-[8px] bg-muted/60 animate-pulse" />
            )}
          </SettingsCard>
        </div>

        {/* Workspace Defaults & Regional Section */}
        <div>
          <SettingsSectionHeading
            title={t("preferences.workspaceDefaults") || "Workspace defaults"}
            description="กำหนดภาษาที่ใช้แสดงผล และรูปแบบการส่งออกเอกสารเริ่มต้น"
          />
          <SettingsCard className="p-6 space-y-5">
            <div className="space-y-4">
              {/* Display Language */}
              <div className="space-y-1.5 max-w-xs">
                <label className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Globe size={13} className="text-muted-foreground" />
                  <span>{t("preferences.displayLanguage") || "Display language"}</span>
                </label>
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  className="w-full h-9 px-3 rounded-[8px] border border-border bg-background text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-2xs cursor-pointer"
                >
                  <option value="th">ไทย (Thai)</option>
                  <option value="en">English (US)</option>
                </select>
              </div>

              {/* Default Export Format */}
              <div className="space-y-1.5 pt-2 border-t border-border/50">
                <label className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Download size={13} className="text-muted-foreground" />
                  <span>รูปแบบการส่งออกเอกสารเริ่มต้น (Default Export)</span>
                </label>
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setDefaultExportFormat("pdf")}
                    className={`p-3 rounded-[8px] border text-left transition-all cursor-pointer ${
                      defaultExportFormat === "pdf"
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                        : "border-border hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <p className="text-xs font-bold">PDF (.pdf)</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">เอกสารคมชัดมาตรฐาน</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDefaultExportFormat("html")}
                    className={`p-3 rounded-[8px] border text-left transition-all cursor-pointer ${
                      defaultExportFormat === "html"
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                        : "border-border hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <p className="text-xs font-bold">HTML (.html)</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">เว็บเพจเปิดได้ทันที</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDefaultExportFormat("webp")}
                    className={`p-3 rounded-[8px] border text-left transition-all cursor-pointer ${
                      defaultExportFormat === "webp"
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                        : "border-border hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <p className="text-xs font-bold">WebP (.webp)</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">รูปภาพความละเอียดสูง</p>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div>
                {saved && (
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-medium animate-in fade-in">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>{t("preferences.savedSuccess") || "บันทึกการตั้งค่าเรียบร้อยแล้ว"}</span>
                  </div>
                )}
              </div>
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
                  <span>{t("preferences.savePreferences") || "บันทึกการตั้งค่า"}</span>
                )}
              </Button>
            </div>
          </SettingsCard>
        </div>
      </form>
    </div>
  );
}
