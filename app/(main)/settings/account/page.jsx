"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UserCircle,
  ShieldCheck,
  CheckCircle2,
  Camera,
  Trash2,
  Laptop,
  Smartphone,
  Globe,
  LogOut,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  SettingsPageHeader,
  SettingsSectionHeading,
  SettingsCard,
} from "@/components/settings/SettingsUI";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { optimizeImageFile } from "@/lib/utils/imageUpload";

export default function AccountSettingsPage() {
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [account, setAccount] = useState({
    fullName: "สิรวิทย์ เพชรจำรัส",
    email: "keem@crestzendo.com",
    role: "Owner / Admin",
    avatar: "",
    twoFactorEnabled: true,
  });

  const [sessions, setSessions] = useState([
    {
      id: "sess-current",
      device: "Chrome บน Windows 11",
      ip: "127.0.0.1",
      location: "Bangkok, Thailand",
      current: true,
      lastActive: "Active now",
    },
    {
      id: "sess-mobile",
      device: "Safari บน iPhone 15 Pro",
      ip: "182.52.41.22",
      location: "Bangkok, Thailand",
      current: false,
      lastActive: "2 ชั่วโมงที่แล้ว",
    },
  ]);

  // Fetch settings from API on mount
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (data.account) {
            setAccount((prev) => ({
              ...prev,
              ...data.account,
              fullName: data.account.fullName || "สิรวิทย์ เพชรจำรัส",
            }));
          }
          if (Array.isArray(data.sessions) && data.sessions.length > 0) {
            setSessions(data.sessions);
          }
        }
      })
      .catch((err) => console.error("Failed to fetch account settings:", err))
      .finally(() => setLoading(false));
  }, []);

  // Handle avatar upload
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMsg("");
      const optimized = await optimizeImageFile(file, 400, 400, 0.85);
      setAccount((prev) => ({ ...prev, avatar: optimized }));
    } catch (err) {
      console.error("Failed to process image:", err);
      setErrorMsg("ไม่สามารถอัปโหลดรูปภาพได้ กรุณาลองใหม่ด้วยไฟล์รูปภาพที่ถูกต้อง");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = () => {
    setAccount((prev) => ({ ...prev, avatar: "" }));
  };

  // Handle session revoke
  const handleRevokeSession = (sessionId) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const handleSignOutOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.current));
  };

  // Handle save
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account,
          sessions,
        }),
      });

      if (!res.ok) throw new Error("บันทึกข้อมูลไม่สำเร็จ");

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
      setErrorMsg("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  // Helper for initials
  const getInitials = (name) => {
    if (!name) return "CZ";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="mx-auto max-w-[640px] pb-12 text-left">
      <SettingsPageHeader
        title={t("account.title") || "Account & Security"}
        description={
          t("account.description") ||
          "Manage your personal profile identity, workspace role, and security credentials."
        }
      />

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-44 rounded-xl bg-muted/60" />
          <div className="h-64 rounded-xl bg-muted/60" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8">
          {/* Personal Profile Section */}
          <div>
            <SettingsSectionHeading
              title={t("account.profileInfo") || "Personal profile"}
              description={
                t("account.updatePhoto") ||
                "Your name and identity displayed across documents and revisions."
              }
            />
            <SettingsCard className="p-6 space-y-6">
              {/* Avatar + Actions */}
              <div className="flex items-center gap-5">
                <div className="relative group">
                  <Avatar className="h-16 w-16 border-2 border-border shadow-xs overflow-hidden">
                    {account.avatar ? (
                      <AvatarImage
                        src={account.avatar}
                        alt={account.fullName}
                        className="object-cover w-full h-full"
                      />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                      {getInitials(account.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    title="เปลี่ยนรูปโปรไฟล์"
                  >
                    <Camera size={18} />
                  </button>
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground leading-none truncate">
                      {account.fullName || "สิรวิทย์ เพชรจำรัส"}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/50 text-primary text-[10px] font-bold border border-violet-100 dark:border-violet-900/40 shrink-0">
                      {account.role || "Owner / Admin"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{account.email}</p>

                  <div className="flex items-center gap-3 pt-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Camera size={13} />
                      <span>{account.avatar ? "เปลี่ยนรูปถ่าย" : "อัปโหลดรูปโปรไฟล์"}</span>
                    </button>
                    {account.avatar && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 size={12} />
                        <span>ลบรูป</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/50">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    {t("account.fullName") || "Full name"} (ชื่อบัญชีผู้ใช้)
                  </label>
                  <input
                    type="text"
                    value={account.fullName}
                    onChange={(e) =>
                      setAccount((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                    placeholder="สิรวิทย์ เพชรจำรัส"
                    className="w-full h-9 px-3 rounded-[8px] border border-border bg-background text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    {t("account.emailAddress") || "Email address"}
                  </label>
                  <input
                    type="email"
                    value={account.email}
                    onChange={(e) =>
                      setAccount((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full h-9 px-3 rounded-[8px] border border-border bg-background text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-2xs"
                  />
                </div>
              </div>
            </SettingsCard>
          </div>

          {/* Security Credentials Section */}
          <div>
            <SettingsSectionHeading
              title={t("account.signInCredentials") || "Sign-in credentials"}
              description={
                t("account.changePassword") ||
                "Ensure your account is protected with a secure password."
              }
            />
            <SettingsCard className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  {t("account.currentPassword") || "Current password"}
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  className="w-full h-9 px-3 rounded-[8px] border border-border bg-background text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    {t("account.newPassword") || "New password"}
                  </label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    className="w-full h-9 px-3 rounded-[8px] border border-border bg-background text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    {t("account.confirmPassword") || "Confirm new password"}
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full h-9 px-3 rounded-[8px] border border-border bg-background text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  {t("account.twoFactor") || "Two-factor authentication is active"}
                </span>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 px-2 py-0.5 rounded-full font-medium">
                  Protected
                </span>
              </div>
            </SettingsCard>
          </div>

          {/* Active Sessions Section (เซสชันที่ใช้งาน) */}
          <div>
            <SettingsSectionHeading
              title={t("account.activeSessions") || "Active Sessions"}
              description="อุปกรณ์และเว็บเบราว์เซอร์ที่กำลังล็อกอินและใช้งานระบบ DocBuilder"
            />
            <SettingsCard className="p-6 space-y-4">
              <div className="divide-y divide-border/50">
                {sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                        {sess.device.toLowerCase().includes("iphone") ||
                        sess.device.toLowerCase().includes("android") ? (
                          <Smartphone size={16} />
                        ) : (
                          <Laptop size={16} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {sess.device}
                          </p>
                          {sess.current && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/40">
                              ● เซสชันปัจจุบัน
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <span>{sess.ip}</span>
                          <span>•</span>
                          <span>{sess.location}</span>
                          <span>•</span>
                          <span className={sess.current ? "text-emerald-600 font-medium" : ""}>
                            {sess.lastActive}
                          </span>
                        </p>
                      </div>
                    </div>

                    {!sess.current && (
                      <button
                        type="button"
                        onClick={() => handleRevokeSession(sess.id)}
                        className="text-xs text-muted-foreground hover:text-destructive font-medium px-2 py-1 rounded hover:bg-muted transition-colors shrink-0 cursor-pointer"
                        title="ออกจากระบบบนอุปกรณ์นี้"
                      >
                        ออกจากระบบ
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {sessions.filter((s) => !s.current).length > 0 && (
                <div className="pt-3 border-t border-border/50 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSignOutOtherSessions}
                    className="text-xs h-8 text-destructive hover:bg-destructive/5 hover:text-destructive border-destructive/30"
                  >
                    <LogOut size={13} className="mr-1.5" />
                    {t("account.signOutAll") || "ออกจากระบบทุกเซสชันอื่น"}
                  </Button>
                </div>
              )}
            </SettingsCard>
          </div>

          {/* Form Actions & Feedback */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {saved && (
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-medium animate-in fade-in">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>บันทึกข้อมูลบัญชีเรียบร้อยแล้ว</span>
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
