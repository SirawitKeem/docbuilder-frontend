"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Share2,
  Users,
  Globe,
  Shield,
  Copy,
  Check,
  Plus,
  Trash2,
  Lock,
  Calendar,
  Eye,
  FileCheck,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Sparkles,
} from "lucide-react";

export default function TemplateShareModal({ isOpen, onClose, template, onUpdated }) {
  const [activeTab, setActiveTab] = useState("internal"); // 'internal', 'external', 'control'
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Internal Sharing State
  const [orgAccess, setOrgAccess] = useState("creator"); // 'viewer', 'creator', 'editor', 'none'
  const [permissions, setPermissions] = useState([]);
  const [newGranteeType, setNewGranteeType] = useState("department");
  const [newGranteeName, setNewGranteeName] = useState("");
  const [newGranteeLevel, setNewGranteeLevel] = useState("creator");

  // External Sharing State
  const [shares, setShares] = useState([]);
  const [shareType, setShareType] = useState("view_only");
  const [sharePassword, setSharePassword] = useState("");
  const [expiryDays, setExpiryDays] = useState("7");
  const [isCreatingShare, setIsCreatingShare] = useState(false);

  // Control & Governance State
  const [governance, setGovernance] = useState({
    is_locked: false,
    require_approval: false,
    lock_immutable_clauses: false,
    enforce_watermark: "none",
    allow_export_formats: ["pdf", "pptx", "xlsx"],
  });

  const templateId = template?.id;

  // Load existing permissions, shares, and governance on open
  useEffect(() => {
    if (isOpen && templateId) {
      loadData();
    }
  }, [isOpen, templateId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const [permRes, shareRes, govRes] = await Promise.all([
        fetch(`/api/templates/${templateId}/permissions`),
        fetch(`/api/templates/${templateId}/shares`),
        fetch(`/api/templates/${templateId}/governance`),
      ]);

      if (permRes.ok) {
        const pData = await permRes.json();
        setPermissions(Array.isArray(pData) ? pData : []);
      }
      if (shareRes.ok) {
        const sData = await shareRes.json();
        setShares(Array.isArray(sData) ? sData : []);
      }
      if (govRes.ok) {
        const gData = await govRes.json();
        if (gData && typeof gData === "object") {
          setGovernance((prev) => ({ ...prev, ...gData }));
        }
      }
    } catch (err) {
      console.error("Error loading share data:", err);
      setErrorMsg("ไม่สามารถโหลดข้อมูลสิทธิ์การเข้าถึงได้");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !template) return null;

  // Handle Internal Permission Add
  const handleAddPermission = async (e) => {
    e.preventDefault();
    if (!newGranteeName.trim()) return;

    try {
      const res = await fetch(`/api/templates/${templateId}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          granteeType: newGranteeType,
          granteeName: newGranteeName.trim(),
          permissionLevel: newGranteeLevel,
        }),
      });

      if (res.ok) {
        setNewGranteeName("");
        await loadData();
        showFeedback("เพิ่มสิทธิ์การเข้าถึงเรียบร้อยแล้ว");
      }
    } catch (err) {
      console.error("Error adding permission:", err);
      setErrorMsg("เกิดข้อผิดพลาดในการบันทึกสิทธิ์");
    }
  };

  // Handle Permission Delete
  const handleDeletePermission = async (permId) => {
    try {
      const res = await fetch(`/api/templates/${templateId}/permissions?permissionId=${permId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPermissions((prev) => prev.filter((p) => p.id !== permId));
        showFeedback("ลบสิทธิ์เรียบร้อยแล้ว");
      }
    } catch (err) {
      console.error("Error deleting permission:", err);
    }
  };

  // Handle External Share Link Creation
  const handleCreateShareLink = async () => {
    try {
      setIsCreatingShare(true);
      let expiresAt = null;
      if (expiryDays !== "never") {
        const days = parseInt(expiryDays, 10) || 7;
        const d = new Date();
        d.setDate(d.getDate() + days);
        expiresAt = d.toISOString();
      }

      const res = await fetch(`/api/templates/${templateId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shareType,
          password: sharePassword.trim() || null,
          expiresAt,
        }),
      });

      if (res.ok) {
        setSharePassword("");
        await loadData();
        showFeedback("สร้างลิงก์สำหรับแชร์ภายนอกสำเร็จ");
      }
    } catch (err) {
      console.error("Error creating share link:", err);
      setErrorMsg("ไม่สามารถสร้างลิงก์แชร์ได้");
    } finally {
      setIsCreatingShare(false);
    }
  };

  // Toggle Share Link Active
  const handleToggleShareActive = async (shareId, currentActive) => {
    try {
      const res = await fetch(`/api/templates/${templateId}/shares?shareId=${shareId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res.ok) {
        setShares((prev) =>
          prev.map((s) => (s.id === shareId ? { ...s, isActive: !currentActive } : s))
        );
      }
    } catch (err) {
      console.error("Error toggling share:", err);
    }
  };

  // Delete Share Link
  const handleDeleteShare = async (shareId) => {
    try {
      const res = await fetch(`/api/templates/${templateId}/shares?shareId=${shareId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setShares((prev) => prev.filter((s) => s.id !== shareId));
        showFeedback("ลบลิงก์แชร์เรียบร้อยแล้ว");
      }
    } catch (err) {
      console.error("Error deleting share:", err);
    }
  };

  // Save Governance Settings
  const handleSaveGovernance = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/templates/${templateId}/governance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(governance),
      });

      if (res.ok) {
        showFeedback("บันทึกนโยบายการควบคุมสิทธิ์เรียบร้อยแล้ว");
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      console.error("Error saving governance:", err);
      setErrorMsg("ไม่สามารถบันทึกนโยบายได้");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showFeedback = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const activeShareLink = shares.find((s) => s.isActive);
  const publicShareUrl = activeShareLink
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/shared/template/${activeShareLink.shareToken}`
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Share2 size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                แชร์และกำหนดสิทธิ์เทมเพลต
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-md">
                {template.name || "Untitled Template"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/30 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("internal")}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "internal"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <Users size={15} />
            <span>Share Internal (แชร์ภายใน)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("external")}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "external"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <Globe size={15} />
            <span>Share External (แชร์ภายนอก)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("control")}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "control"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <Shield size={15} />
            <span>Control (กำหนดสิทธิ์ & นโยบาย)</span>
          </button>
        </div>

        {/* Feedback Alert Banners */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
            <Check size={14} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: SHARE INTERNAL */}
          {activeTab === "internal" && (
            <div className="space-y-6">
              {/* Org-Wide Access */}
              <div className="bg-gray-50 dark:bg-neutral-900/40 p-4 rounded-xl border border-gray-200/80 dark:border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                      สิทธิ์ทั่วไปในองค์กร (Organization Access)
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      กำหนดสิทธิ์เริ่มต้นสำหรับพนักงานทุกคนในบริษัท
                    </p>
                  </div>
                  <select
                    value={orgAccess}
                    onChange={(e) => setOrgAccess(e.target.value)}
                    className="h-8 px-3 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-gray-900 dark:text-gray-100 font-medium outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="creator">สามารถนำไปใช้สร้างเอกสารได้ (Can Use)</option>
                    <option value="viewer">ดูตัวอย่างได้อย่างเดียว (Can View)</option>
                    <option value="editor">แก้ไขโครงสร้างเทมเพลตได้ (Can Edit)</option>
                    <option value="none">ซ่อน (Restricted / เฉพาะผู้ที่ได้รับสิทธิ์)</option>
                  </select>
                </div>
              </div>

              {/* Add Department / User Permission Form */}
              <form onSubmit={handleAddPermission} className="space-y-3">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                  เพิ่มสิทธิ์เฉพาะแผนกหรือรายบุคคล
                </h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={newGranteeType}
                    onChange={(e) => setNewGranteeType(e.target.value)}
                    className="h-9 px-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-medium outline-none focus:border-primary shrink-0"
                  >
                    <option value="department">🏢 แผนก (Department)</option>
                    <option value="user">👤 บุคคล (User)</option>
                  </select>

                  <input
                    type="text"
                    value={newGranteeName}
                    onChange={(e) => setNewGranteeName(e.target.value)}
                    placeholder={
                      newGranteeType === "department"
                        ? "เช่น ฝ่ายขาย (Sales), ฝ่ายกฎหมาย (Legal)"
                        : "ชื่อพนักงาน หรือ อีเมล (e.g. somchai@company.com)"
                    }
                    className="flex-1 h-9 px-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs outline-none focus:border-primary"
                  />

                  <select
                    value={newGranteeLevel}
                    onChange={(e) => setNewGranteeLevel(e.target.value)}
                    className="h-9 px-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-medium outline-none focus:border-primary shrink-0"
                  >
                    <option value="creator">Can Use (สร้างเอกสาร)</option>
                    <option value="viewer">Can View (ดูอย่างเดียว)</option>
                    <option value="editor">Can Edit (แก้ไขเทมเพลต)</option>
                    <option value="admin">Admin (ผู้จัดการสิทธิ์)</option>
                  </select>

                  <button
                    type="submit"
                    className="h-9 px-4 rounded-xl bg-primary text-white text-xs font-semibold hover:opacity-90 flex items-center justify-center gap-1.5 shrink-0 transition-opacity cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>เพิ่ม</span>
                  </button>
                </div>
              </form>

              {/* Granted Permissions List */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  รายชื่อแผนกและผู้ได้รับสิทธิ์ ({permissions.length})
                </h4>
                {permissions.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-neutral-800 text-center text-xs text-gray-400">
                    ยังไม่มีการกำหนดสิทธิ์เฉพาะเจาะจง (ทุกคนใช้งานตามสิทธิ์เริ่มต้นขององค์กร)
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-neutral-800 border border-gray-200/80 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900/30">
                    {permissions.map((p) => (
                      <div
                        key={p.id}
                        className="px-4 py-3 flex items-center justify-between text-xs hover:bg-gray-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">
                            {p.granteeType === "department" ? "🏢" : "👤"}
                          </span>
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-white block">
                              {p.granteeName}
                            </span>
                            <span className="text-[10px] text-gray-400 capitalize">
                              {p.granteeType}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                            {p.permissionLevel === "creator"
                              ? "Can Use"
                              : p.permissionLevel === "editor"
                              ? "Can Edit"
                              : p.permissionLevel === "admin"
                              ? "Admin"
                              : "Viewer"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeletePermission(p.id)}
                            className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                            title="ลบสิทธิ์"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SHARE EXTERNAL */}
          {activeTab === "external" && (
            <div className="space-y-6">
              {/* Quick Link Card if active link exists */}
              {publicShareUrl && (
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      ลิงก์ภายนอกเปิดใช้งานอยู่ (Public Link Active)
                    </span>
                    <a
                      href={publicShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-700 hover:underline inline-flex items-center gap-1"
                    >
                      <span>เปิดดูหน้าจริง</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={publicShareUrl}
                      className="flex-1 h-9 px-3 bg-white dark:bg-neutral-800 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-gray-700 dark:text-gray-200 font-mono outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(publicShareUrl)}
                      className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copied ? "คัดลอกแล้ว!" : "Copy Link"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Create New Link Controls */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-neutral-800 space-y-4 bg-gray-50/50 dark:bg-neutral-900/30">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                  สร้างลิงก์สำหรับแชร์ภายนอกใหม่
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Share Mode */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      โหมดการแชร์
                    </label>
                    <select
                      value={shareType}
                      onChange={(e) => setShareType(e.target.value)}
                      className="w-full h-8.5 px-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs outline-none"
                    >
                      <option value="view_only">ดูตัวอย่างอย่างเดียว (View Only)</option>
                      <option value="fillable">อนุญาตให้กรอกข้อมูล (Fill & Submit)</option>
                    </select>
                  </div>

                  {/* Expiry */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      อายุการใช้งานลิงก์
                    </label>
                    <select
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(e.target.value)}
                      className="w-full h-8.5 px-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs outline-none"
                    >
                      <option value="1">1 วัน (24 ชั่วโมง)</option>
                      <option value="7">7 วัน</option>
                      <option value="30">30 วัน</option>
                      <option value="never">ไม่มีวันหมดอายุ</option>
                    </select>
                  </div>

                  {/* Password Protection */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      รหัสผ่านป้องกัน (ถ้าต้องการ)
                    </label>
                    <input
                      type="password"
                      value={sharePassword}
                      onChange={(e) => setSharePassword(e.target.value)}
                      placeholder="กำหนดรหัสผ่าน..."
                      className="w-full h-8.5 px-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleCreateShareLink}
                    disabled={isCreatingShare}
                    className="h-8.5 px-4 rounded-xl bg-primary text-white text-xs font-semibold hover:opacity-90 flex items-center gap-1.5 transition-opacity cursor-pointer disabled:opacity-50"
                  >
                    <Plus size={14} />
                    <span>{isCreatingShare ? "กำลังสร้าง..." : "สร้างลิงก์แชร์ใหม่"}</span>
                  </button>
                </div>
              </div>

              {/* History / All Links List */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  ประวัติลิงก์แชร์ภายนอก ({shares.length})
                </h4>
                {shares.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">ยังไม่มีการสร้างลิงก์แชร์ภายนอก</p>
                ) : (
                  <div className="border border-gray-200/80 dark:border-neutral-800 rounded-xl divide-y divide-gray-100 dark:divide-neutral-800 overflow-hidden">
                    {shares.map((s) => (
                      <div
                        key={s.id}
                        className="px-4 py-3 flex items-center justify-between text-xs bg-white dark:bg-neutral-900"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-gray-800 dark:text-gray-200 font-medium">
                              ...{s.shareToken.slice(-12)}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400">
                              {s.shareType === "fillable" ? "Fillable" : "View Only"}
                            </span>
                            {s.passwordHash && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                🔒 Password Protected
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400">
                            เข้าดูแล้ว: {s.viewCount || 0} ครั้ง • {s.expiresAt ? `หมดอายุ: ${new Date(s.expiresAt).toLocaleDateString("th-TH")}` : "ไม่หมดอายุ"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleShareActive(s.id, s.isActive)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
                              s.isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                            }`}
                          >
                            {s.isActive ? "เปิดใช้งาน (Active)" : "ปิดชั่วคราว (Paused)"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteShare(s.id)}
                            className="p-1 rounded-md text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="ลบลิงก์นี้"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CONTROL & GOVERNANCE */}
          {activeTab === "control" && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-neutral-900/40 border border-gray-200/80 dark:border-neutral-800 space-y-4">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Shield size={14} className="text-primary" />
                  <span>นโยบายความปลอดภัยและการควบคุมเทมเพลต (Governance Policies)</span>
                </h3>

                {/* 1. Lock Template */}
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 block">
                      ล็อกโครงสร้างเทมเพลต (Lock Template)
                    </span>
                    <span className="text-[11px] text-gray-500 leading-relaxed block">
                      ป้องกันไม่ให้ผู้ใช้งานทั่วไปแก้ไข เลื่อนตำแหน่ง หรือลบองค์ประกอบในตัวเทมเพลต
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={governance.is_locked}
                    onChange={(e) =>
                      setGovernance((prev) => ({ ...prev, is_locked: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary accent-primary cursor-pointer mt-1"
                  />
                </div>

                {/* 2. Require Approval */}
                <div className="flex items-start justify-between gap-3 border-t border-gray-200/60 dark:border-neutral-800 pt-3">
                  <div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 block">
                      บังคับผ่านการอนุมัติ (Require Approval Workflow)
                    </span>
                    <span className="text-[11px] text-gray-500 leading-relaxed block">
                      เอกสารที่สร้างจากเทมเพลตนี้ต้องส่งขออนุมัติตามสายงานก่อนจึงจะลงนามหรือส่งออกได้
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={governance.require_approval}
                    onChange={(e) =>
                      setGovernance((prev) => ({ ...prev, require_approval: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary accent-primary cursor-pointer mt-1"
                  />
                </div>

                {/* 3. Lock Immutable Clauses */}
                <div className="flex items-start justify-between gap-3 border-t border-gray-200/60 dark:border-neutral-800 pt-3">
                  <div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 block">
                      ล็อกข้อความสัญญามาตรฐาน (Immutable Legal Clauses)
                    </span>
                    <span className="text-[11px] text-gray-500 leading-relaxed block">
                      ห้ามเปลี่ยนแปลงสาระสำคัญของมาตราสัญญา อนุญาตให้กรอกได้เฉพาะตัวแปร/ฟิลด์เท่านั้น
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={governance.lock_immutable_clauses}
                    onChange={(e) =>
                      setGovernance((prev) => ({
                        ...prev,
                        lock_immutable_clauses: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary accent-primary cursor-pointer mt-1"
                  />
                </div>

                {/* 4. Enforce Watermark */}
                <div className="flex items-center justify-between gap-3 border-t border-gray-200/60 dark:border-neutral-800 pt-3">
                  <div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 block">
                      บังคับใส่ลายน้ำอัตโนมัติ (Enforce Watermark)
                    </span>
                    <span className="text-[11px] text-gray-500 block">
                      แสดงลายน้ำบนเอกสารสำหรับผู้ใช้ทั่วไปหรือภายนอก
                    </span>
                  </div>
                  <select
                    value={governance.enforce_watermark || "none"}
                    onChange={(e) =>
                      setGovernance((prev) => ({ ...prev, enforce_watermark: e.target.value }))
                    }
                    className="h-8 px-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-medium outline-none"
                  >
                    <option value="none">ไม่มีลายน้ำ (None)</option>
                    <option value="DRAFT">ฉบับร่าง (DRAFT)</option>
                    <option value="CONFIDENTIAL">ลับเฉพาะ (CONFIDENTIAL)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveGovernance}
                  disabled={loading}
                  className="h-9 px-5 rounded-xl bg-primary text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
                >
                  <FileCheck size={14} />
                  <span>{loading ? "กำลังบันทึก..." : "บันทึกนโยบายควบคุม"}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/50 flex items-center justify-between text-xs">
          <span className="text-gray-400">
            เทมเพลต: <span className="font-semibold text-gray-600 dark:text-gray-300">{template.id}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="h-8.5 px-4 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 font-semibold transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
