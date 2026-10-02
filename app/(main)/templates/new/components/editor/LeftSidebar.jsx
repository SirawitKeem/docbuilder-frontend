"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Type,
  Hash,
  CheckSquare,
  CircleDot,
  Calendar,
  Table,
  User,
  Mail,
  Phone,
  MapPin,
  Image as ImageIcon,
  Paperclip,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  X,
  Loader2,
  Sparkles,
  Braces,
  Building,
  FileCheck2,
  LayoutTemplate,
  Square,
  Circle,
  Triangle,
  Star,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Check,
  Tag,
  Bookmark,
  PenTool,
  FileSignature,
} from "lucide-react";
import {
  fetchCustomTokens,
  initLiveTokens,
  extractTokensFromTemplate,
} from "@/lib/tokens/tokenEngine";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";
import { VECTOR_ICONS, ICON_CATEGORIES } from "./utils/iconLibrary";

const TAILWIND_COLOR_HEX = {
  "bg-indigo-600": "#4F46E5",
  "bg-purple-600": "#9333EA",
  "bg-emerald-600": "#059669",
  "bg-amber-600": "#D97706",
  "bg-rose-600": "#E11D48",
  "bg-blue-600": "#2563EB",
  "bg-teal-600": "#0D9488",
};

export default function LeftSidebar({
  editorType = "document",
  templateId = null,
  pages = null,
  onAddText,
  onAddShape,
  onAddIcon,
  onAddImage,
  onAddPreset,
  onAddTable,
  onAddSignature,
  onInsertToken,
  isReplacingIcon = false,
}) {
  const isSlide = editorType === "slide";
  const fileInputRef = useRef(null);

  // ── Top Switcher: "elements" | "templates" ──
  const [topTab, setTopTab] = useState("elements");

  // ── Recipients / Signatories State ──
  const [recipients, setRecipients] = useState([
    {
      id: "rec-owner",
      name: "สิรวิทย์ เพชรจำรัส",
      email: "keem@crestzendo.com",
      role: "ผู้จัดทำ / เจ้าของ",
      color: "bg-indigo-600",
    },
  ]);
  const [activeRecipientId, setActiveRecipientId] = useState("rec-owner");
  const [isRecipientMenuOpen, setIsRecipientMenuOpen] = useState(false);
  const [showAddRecipientModal, setShowAddRecipientModal] = useState(false);
  const [newRecName, setNewRecName] = useState("");
  const [newRecEmail, setNewRecEmail] = useState("");
  const [newRecRole, setNewRecRole] = useState("signer");
  const [recSuggestions, setRecSuggestions] = useState([]);
  const [showRecSuggestions, setShowRecSuggestions] = useState(false);

  // Auto-fetch suggestions when typing in add recipient modal
  useEffect(() => {
    if (!showAddRecipientModal) return;
    const q = newRecName || newRecEmail;
    const timer = setTimeout(() => {
      fetch(`/api/recipients/suggest?q=${encodeURIComponent(q)}`)
        .then((r) => (r.ok ? r.json() : []))
        .then(setRecSuggestions)
        .catch(() => {});
    }, 150);
    return () => clearTimeout(timer);
  }, [newRecName, newRecEmail, showAddRecipientModal]);

  const activeRecipient =
    recipients.find((r) => r.id === activeRecipientId) || recipients[0];

  // ── Accordion States ──
  const [openSections, setOpenSections] = useState({
    presets: false,
    tokens: false,
    shapes: false,
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Custom Tokens State ──
  const [customTokens, setCustomTokens] = useState([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [showAddTokenModal, setShowAddTokenModal] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState(null);
  const [isDeletingToken, setIsDeletingToken] = useState(false);
  const [newTokenKey, setNewTokenKey] = useState("");
  const [newTokenLabel, setNewTokenLabel] = useState("");
  const [newTokenExample, setNewTokenExample] = useState("");
  const [newTokenScope, setNewTokenScope] = useState("document");
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [tokenError, setTokenError] = useState("");

  // ── Icon Library State ──
  const [selectedIconCat, setSelectedIconCat] = useState("all");

  // Load custom tokens when component mounts or templateId changes
  const loadCustomTokens = useCallback(async () => {
    setIsLoadingTokens(true);
    try {
      const tokens = await fetchCustomTokens(templateId);
      setCustomTokens(tokens);
      await initLiveTokens();
    } finally {
      setIsLoadingTokens(false);
    }
  }, [templateId]);

  useEffect(() => {
    loadCustomTokens();
  }, [loadCustomTokens]);

  const handleSaveNewToken = async () => {
    setTokenError("");
    const cleanKey = newTokenKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!cleanKey) {
      setTokenError("กรุณาระบุรหัสตัวแปร");
      return;
    }
    if (!newTokenLabel.trim()) {
      setTokenError("กรุณาระบุชื่อฟิลด์ภาษาไทย");
      return;
    }

    setIsSavingToken(true);
    try {
      const res = await fetch("/api/custom-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: cleanKey,
          label: newTokenLabel.trim(),
          example: newTokenExample.trim(),
          scope: newTokenScope,
          templateId: templateId || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setTokenError(err.error || "เกิดข้อผิดพลาด");
        return;
      }
      setNewTokenKey("");
      setNewTokenLabel("");
      setNewTokenExample("");
      setNewTokenScope("document");
      setShowAddTokenModal(false);
      await loadCustomTokens();
    } catch {
      setTokenError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsSavingToken(false);
    }
  };

  const handleConfirmDeleteToken = async () => {
    if (!tokenToDelete) return;
    setIsDeletingToken(true);
    try {
      await fetch(`/api/custom-tokens/${tokenToDelete.id}`, {
        method: "DELETE",
      });
      await loadCustomTokens();
      setTokenToDelete(null);
    } catch (err) {
      console.error("Failed to delete custom token:", err);
    } finally {
      setIsDeletingToken(false);
    }
  };

  // Extract tokens actually present on template pages
  const activeTemplateTokens = React.useMemo(() => {
    return extractTokensFromTemplate({ pages });
  }, [pages]);

  const templateScopedTokens = React.useMemo(() => {
    const seen = new Set();
    const list = [];

    customTokens.forEach((t) => {
      const clean = (t.key || "").replace(/^\{\{|\}\}$/g, "");
      if (clean && !seen.has(clean)) {
        seen.add(clean);
        list.push({
          key: `{{${clean}}}`,
          rawKey: clean,
          label: t.label,
          example: t.example || `[${t.label}]`,
          scope: t.scope,
          id: t.id,
          isCustom: true,
        });
      }
    });

    activeTemplateTokens.forEach((t) => {
      const clean = (t.key || t.rawKey || "").replace(/^\{\{|\}\}$/g, "");
      if (clean && !seen.has(clean)) {
        seen.add(clean);
        list.push({
          key: `{{${clean}}}`,
          rawKey: clean,
          label: t.label || clean,
          example: t.example || "",
          scope: "template",
          isCustom: false,
        });
      }
    });

    return list;
  }, [customTokens, activeTemplateTokens]);

  // Handle local image file upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl && onAddImage) {
        onAddImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Add new recipient
  const handleAddRecipient = async () => {
    if (!newRecName.trim() && !newRecEmail.trim()) return;
    const newId = `rec-${Date.now()}`;
    const name = newRecName.trim() || newRecEmail.trim().split("@")[0];
    const email = newRecEmail.trim() || `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`;
    const roleLabels = {
      signer: "ผู้ลงนาม (Signer)",
      editor: "ผู้ร่วมแก้ไข (Editor)",
      approver: "ผู้อนุมัติ (Approver)",
      viewer: "ผู้ดู (Viewer)",
    };
    const colors = ["bg-purple-600", "bg-emerald-600", "bg-blue-600", "bg-amber-600", "bg-rose-600"];
    const chosenColor = colors[recipients.length % colors.length];

    const newRec = {
      id: newId,
      name,
      email,
      role: roleLabels[newRecRole] || "ผู้รับ",
      color: chosenColor,
    };
    setRecipients((prev) => [...prev, newRec]);
    setActiveRecipientId(newId);

    // If templateId is provided and email is valid, also save authorization & trigger notification
    if (templateId && email && email.includes("@")) {
      try {
        await fetch("/api/authorizations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityId: templateId,
            entityType: "template",
            userEmail: email,
            userName: name,
            roleTitle: roleLabels[newRecRole] || "ผู้รับ",
            permissionLevel: newRecRole,
            grantedByEmail: "keem@crestzendo.com",
          }),
        });
      } catch (err) {
        console.warn("Could not save authorization for recipient:", err);
      }
    }

    setNewRecName("");
    setNewRecEmail("");
    setNewRecRole("signer");
    setShowAddRecipientModal(false);
  };

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col h-[calc(100vh-53px)] select-none z-20 shrink-0 shadow-xs overflow-hidden">
      {/* ── TOP SEGMENTED CONTROL: [ Templates ] | [ Elements ] ── */}
      <div className="p-3 border-b border-gray-100 bg-gray-50/70 shrink-0">
        <div className="grid grid-cols-2 p-1 bg-gray-200/80 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setTopTab("templates")}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center ${
              topTab === "templates"
                ? "bg-white text-gray-900 shadow-2xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Templates
          </button>
          <button
            type="button"
            onClick={() => setTopTab("elements")}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center ${
              topTab === "elements"
                ? "bg-white text-indigo-700 shadow-2xs font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Elements
          </button>
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      {topTab === "templates" ? (
        /* TEMPLATES TAB PLACEHOLDER */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-500 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            <LayoutTemplate className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">
              คลังเทมเพลตมาตรฐาน
            </h3>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              ระบบจะเปิดให้เลือกโครงร่างเอกสารสำเร็จรูป เช่น สัญญา, ใบเสนอราคา,
              และรายงาน ในการอัปเดตถัดไป
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTopTab("elements")}
            className="px-4 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            กลับสู่โหมด Elements
          </button>
        </div>
      ) : (
        /* ELEMENTS TAB CONTENT (NO SEARCH BAR) */
        <div className="flex-1 overflow-y-auto p-3.5 space-y-5">
          {/* 👤 FILLABLE FIELDS / RECIPIENT SELECTOR */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Fillable Fields
              </span>
              <button
                type="button"
                onClick={() => setShowAddRecipientModal(true)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5 cursor-pointer"
                title="เพิ่มผู้รับ"
              >
                <Plus className="w-3 h-3" />
                <span>เพิ่มผู้รับ</span>
              </button>
            </div>

            {/* Recipient Dropdown Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsRecipientMenuOpen(!isRecipientMenuOpen)}
                className="w-full flex items-center justify-between p-2 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-gray-100/80 transition-all text-left cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-full ${activeRecipient.color} text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-2xs`}
                  >
                    {activeRecipient.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-gray-800 truncate leading-tight group-hover:text-indigo-600">
                      {activeRecipient.name}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                      {activeRecipient.email}
                    </p>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-1 group-hover:text-gray-600 transition-colors" />
              </button>

              {/* Recipient Popover */}
              {isRecipientMenuOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 p-1 space-y-0.5">
                  {recipients.map((rec) => (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => {
                        setActiveRecipientId(rec.id);
                        setIsRecipientMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                        rec.id === activeRecipientId
                          ? "bg-indigo-50 text-indigo-700 font-semibold"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className={`w-5 h-5 rounded-full ${rec.color} text-white font-bold text-[9px] flex items-center justify-center shrink-0`}
                        >
                          {rec.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <span className="truncate block font-medium">{rec.name}</span>
                          <span className="text-[10px] text-gray-400 block truncate">{rec.role || rec.email}</span>
                        </div>
                      </div>
                      {rec.id === activeRecipientId && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                  <div className="border-t border-gray-100 pt-1 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecipientMenuOpen(false);
                        setShowAddRecipientModal(true);
                      }}
                      className="w-full flex items-center gap-1.5 p-2 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ เพิ่มผู้รับใหม่</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Recipient Signing Fields (DocuSign Style) */}
            <div className="pt-1.5 space-y-1.5">
              <span className="text-[10px] font-semibold text-gray-500 block truncate">
                ช่องลงนามสำหรับ: <span className="font-bold text-gray-800">{activeRecipient.name}</span>
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (onAddSignature) {
                      const hex = TAILWIND_COLOR_HEX[activeRecipient.color] || "#4F46E5";
                      onAddSignature("recipient", {
                        fieldType: "signature",
                        recipientId: activeRecipient.id,
                        recipientName: activeRecipient.name,
                        recipientRole: activeRecipient.role,
                        recipientEmail: activeRecipient.email,
                        recipientColor: hex,
                      });
                    }
                  }}
                  className="flex items-center gap-1.5 p-2 rounded-lg border border-gray-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/40 text-gray-700 transition-all text-xs font-semibold shadow-2xs cursor-pointer group"
                  title={`วางช่องลงลายมือชื่อสำหรับ ${activeRecipient.name}`}
                >
                  <PenTool className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate">ลายมือชื่อ</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onAddSignature) {
                      const hex = TAILWIND_COLOR_HEX[activeRecipient.color] || "#4F46E5";
                      onAddSignature("recipient", {
                        fieldType: "initials",
                        recipientId: activeRecipient.id,
                        recipientName: activeRecipient.name,
                        recipientRole: activeRecipient.role,
                        recipientEmail: activeRecipient.email,
                        recipientColor: hex,
                      });
                    }
                  }}
                  className="flex items-center gap-1.5 p-2 rounded-lg border border-gray-200 bg-white hover:border-purple-400 hover:bg-purple-50/40 text-gray-700 transition-all text-xs font-semibold shadow-2xs cursor-pointer group"
                  title={`วางช่องเซ็นย่อกำกับสำหรับ ${activeRecipient.name}`}
                >
                  <FileSignature className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="truncate">ลายเซ็นย่อ</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onAddSignature) {
                      const hex = TAILWIND_COLOR_HEX[activeRecipient.color] || "#4F46E5";
                      onAddSignature("recipient", {
                        fieldType: "date_signed",
                        recipientId: activeRecipient.id,
                        recipientName: activeRecipient.name,
                        recipientRole: activeRecipient.role,
                        recipientEmail: activeRecipient.email,
                        recipientColor: hex,
                      });
                    }
                  }}
                  className="col-span-2 flex items-center justify-center gap-1.5 p-2 rounded-lg border border-gray-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/40 text-gray-700 transition-all text-xs font-semibold shadow-2xs cursor-pointer group"
                  title={`วางช่องประทับวันที่เซ็นสำหรับ ${activeRecipient.name}`}
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">วันที่ลงนาม (Date Signed)</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── SECTION 1: TEXT ELEMENTS (2-COLUMN GRID) ── */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-0.5">
              Text Elements
            </span>
            <div className="grid grid-cols-2 gap-2">
              {/* Text */}
              <button
                type="button"
                onClick={() => onAddText && onAddText("ข้อความใหม่", { fontSize: 16 })}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/30 text-gray-700 hover:text-indigo-600 transition-all text-xs font-semibold shadow-2xs cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-indigo-100/70 text-gray-500 group-hover:text-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                  <Type className="w-3.5 h-3.5" />
                </div>
                <span>Text</span>
              </button>

              {/* Number */}
              <button
                type="button"
                onClick={() => onAddText && onAddText("123,456.00", { fontSize: 16, fontFamily: "monospace" })}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/30 text-gray-700 hover:text-indigo-600 transition-all text-xs font-semibold shadow-2xs cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-indigo-100/70 text-gray-500 group-hover:text-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                  <Hash className="w-3.5 h-3.5" />
                </div>
                <span>Number</span>
              </button>

              {/* Checkbox */}
              <button
                type="button"
                onClick={() => onAddPreset && onAddPreset("checkbox")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/30 text-gray-700 hover:text-indigo-600 transition-all text-xs font-semibold shadow-2xs cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-indigo-100/70 text-gray-500 group-hover:text-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                  <CheckSquare className="w-3.5 h-3.5" />
                </div>
                <span>Checkbox</span>
              </button>

              {/* Radio */}
              <button
                type="button"
                onClick={() => onAddPreset && onAddPreset("radio")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/30 text-gray-700 hover:text-indigo-600 transition-all text-xs font-semibold shadow-2xs cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-indigo-100/70 text-gray-500 group-hover:text-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                  <CircleDot className="w-3.5 h-3.5" />
                </div>
                <span>Radio</span>
              </button>

              {/* Dropdown */}
              <button
                type="button"
                onClick={() => onAddPreset && onAddPreset("dropdown")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/30 text-gray-700 hover:text-indigo-600 transition-all text-xs font-semibold shadow-2xs cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-indigo-100/70 text-gray-500 group-hover:text-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
                <span>Dropdown</span>
              </button>

              {/* Date */}
              <button
                type="button"
                onClick={() => onInsertToken && onInsertToken("{{doc_date}}", "วันที่เอกสาร")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/30 text-gray-700 hover:text-indigo-600 transition-all text-xs font-semibold shadow-2xs cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-indigo-100/70 text-gray-500 group-hover:text-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <span>Date</span>
              </button>

              {/* Table */}
              <button
                type="button"
                onClick={() => onAddTable && onAddTable()}
                className="col-span-2 flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/30 text-gray-700 hover:text-indigo-600 transition-all text-xs font-semibold shadow-2xs cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-indigo-100/70 text-gray-500 group-hover:text-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                  <Table className="w-3.5 h-3.5" />
                </div>
                <span>Table (ตารางรายการสินค้า/บริการ)</span>
              </button>
            </div>
          </div>

          {/* ── SECTION 2: PERSONAL DATA ELEMENTS (2-COLUMN GRID) ── */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-0.5">
              Personal Data Elements
            </span>
            <div className="grid grid-cols-2 gap-2">
              {/* Name */}
              <button
                type="button"
                onClick={() => onInsertToken && onInsertToken("{{customer_name}}", "ชื่อผู้รับ/ผู้ลงนาม")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/30 text-gray-700 hover:text-indigo-600 transition-all text-xs font-semibold shadow-2xs cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-indigo-100/70 text-gray-500 group-hover:text-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span>Name</span>
              </button>

              {/* Email */}
              <button
                type="button"
                onClick={() => onInsertToken && onInsertToken("{{customer_email}}", "อีเมล")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/30 text-gray-700 hover:text-indigo-600 transition-all text-xs font-semibold shadow-2xs cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-indigo-100/70 text-gray-500 group-hover:text-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span>Email</span>
              </button>

              {/* Phone */}
              <button
                type="button"
                onClick={() => onInsertToken && onInsertToken("{{customer_phone}}", "เบอร์โทรศัพท์")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/30 text-gray-700 hover:text-indigo-600 transition-all text-xs font-semibold shadow-2xs cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-indigo-100/70 text-gray-500 group-hover:text-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <span>Phone</span>
              </button>

              {/* Address */}
              <button
                type="button"
                onClick={() => onInsertToken && onInsertToken("{{customer_address}}", "ที่อยู่")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/30 text-gray-700 hover:text-indigo-600 transition-all text-xs font-semibold shadow-2xs cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-indigo-100/70 text-gray-500 group-hover:text-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <span>Address</span>
              </button>
            </div>
          </div>

          {/* ── SECTION 3: EXTEND ELEMENTS (2-COLUMN GRID) ── */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-0.5">
              Extend Elements
            </span>
            <div className="grid grid-cols-2 gap-2">
              {/* Image */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/30 text-gray-700 hover:text-indigo-600 transition-all text-xs font-semibold shadow-2xs cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-indigo-100/70 text-gray-500 group-hover:text-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                  <ImageIcon className="w-3.5 h-3.5" />
                </div>
                <span>Image</span>
              </button>

              {/* Attachment */}
              <button
                type="button"
                onClick={() => onAddPreset && onAddPreset("attachment")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/30 text-gray-700 hover:text-indigo-600 transition-all text-xs font-semibold shadow-2xs cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-indigo-100/70 text-gray-500 group-hover:text-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                  <Paperclip className="w-3.5 h-3.5" />
                </div>
                <span>Attachment</span>
              </button>

              {/* Approve */}
              <button
                type="button"
                onClick={() => onAddPreset && onAddPreset("approve_stamp")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/30 hover:border-emerald-400 hover:bg-emerald-50/70 text-emerald-800 transition-all text-xs font-semibold shadow-2xs cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-100/60 text-emerald-700 flex items-center justify-center shrink-0 transition-colors">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span>Approve</span>
              </button>

              {/* Decline */}
              <button
                type="button"
                onClick={() => onAddPreset && onAddPreset("decline_stamp")}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-red-200 bg-red-50/30 hover:border-red-400 hover:bg-red-50/70 text-red-800 transition-all text-xs font-semibold shadow-2xs cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-red-100/60 text-red-700 flex items-center justify-center shrink-0 transition-colors">
                  <XCircle className="w-3.5 h-3.5" />
                </div>
                <span>Decline</span>
              </button>
            </div>
          </div>

          {/* Hidden File Input for Image Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {/* ── ACCORDION 1: PRESET BLOCKS & TEMPLATE STRUCTURE ── */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleSection("presets")}
              className="w-full flex items-center justify-between p-3 bg-gray-50/70 hover:bg-gray-100/60 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600" />
                <span>บล็อกสำเร็จรูป & โครงสร้าง</span>
              </div>
              {openSections.presets ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {openSections.presets && (
              <div className="p-2.5 space-y-1.5 bg-white border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => onAddPreset && onAddPreset("company_header")}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-indigo-50/60 text-left text-xs text-gray-700 hover:text-indigo-700 font-medium transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-gray-400" />
                    <span>หัวกระดาษบริษัท (Company Header)</span>
                  </span>
                  <Plus className="w-3.5 h-3.5 text-gray-400" />
                </button>

                <button
                  type="button"
                  onClick={() => onAddSignature && onAddSignature("dual")}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-indigo-50/60 text-left text-xs text-gray-700 hover:text-indigo-700 font-medium transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FileCheck2 className="w-3.5 h-3.5 text-gray-400" />
                    <span>ช่องลงนามคู่ (Dual Signatures)</span>
                  </span>
                  <Plus className="w-3.5 h-3.5 text-gray-400" />
                </button>

                <button
                  type="button"
                  onClick={() => onAddPreset && onAddPreset("party_info")}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-indigo-50/60 text-left text-xs text-gray-700 hover:text-indigo-700 font-medium transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>ข้อมูลคู่สัญญา (Party Information)</span>
                  </span>
                  <Plus className="w-3.5 h-3.5 text-gray-400" />
                </button>

                <button
                  type="button"
                  onClick={() => onAddPreset && onAddPreset("terms_box")}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-indigo-50/60 text-left text-xs text-gray-700 hover:text-indigo-700 font-medium transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-gray-400" />
                    <span>เงื่อนไข & ข้อตกลง (Terms & Conditions)</span>
                  </span>
                  <Plus className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
            )}
          </div>

          {/* ── ACCORDION 2: TEMPLATE DYNAMIC TOKENS ── */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleSection("tokens")}
              className="w-full flex items-center justify-between p-3 bg-gray-50/70 hover:bg-gray-100/60 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Braces className="w-4 h-4 text-amber-600" />
                <span>ตัวแปรไดนามิกเทมเพลตนี้</span>
                <span className="text-[10px] font-normal px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full">
                  {templateScopedTokens.length}
                </span>
              </div>
              {openSections.tokens ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {openSections.tokens && (
              <div className="p-2.5 space-y-2.5 bg-white border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddTokenModal(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-amber-300 hover:border-amber-500 rounded-xl bg-amber-50/50 hover:bg-amber-100/60 text-amber-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ สร้างตัวแปรใหม่เฉพาะเทมเพลตนี้</span>
                </button>

                {isLoadingTokens ? (
                  <div className="flex items-center justify-center py-4 text-gray-400 text-xs gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                    <span>กำลังโหลด...</span>
                  </div>
                ) : templateScopedTokens.length === 0 ? (
                  <p className="text-center py-3 text-xs text-gray-400">
                    ยังไม่มีตัวแปรที่ใช้ในหน้านี้
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {templateScopedTokens.map((tok) => (
                      <div
                        key={tok.key}
                        className="group flex items-center justify-between p-2 rounded-lg border border-gray-100 hover:border-amber-200 bg-gray-50/50 hover:bg-amber-50/40 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => onInsertToken && onInsertToken(tok.key, tok.label)}
                          className="flex-1 text-left min-w-0 cursor-pointer"
                        >
                          <p className="text-xs font-semibold text-gray-800 truncate">
                            {tok.label}
                          </p>
                          <code className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1 py-0.2 rounded">
                            {tok.key}
                          </code>
                        </button>
                        {tok.isCustom && (
                          <button
                            type="button"
                            onClick={() => setTokenToDelete(tok)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="ลบตัวแปรนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── ACCORDION 3: SHAPES & VECTOR ICONS ── */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleSection("shapes")}
              className="w-full flex items-center justify-between p-3 bg-gray-50/70 hover:bg-gray-100/60 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>รูปทรง & ไอคอนเวกเตอร์</span>
              </div>
              {openSections.shapes ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {openSections.shapes && (
              <div className="p-2.5 space-y-3 bg-white border-t border-gray-100">
                {/* Geometric Shapes Grid */}
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onAddShape && onAddShape({ type: "rectangle" })}
                    className="p-2 rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50/40 text-gray-700 flex flex-col items-center gap-1 transition-all cursor-pointer"
                    title="สี่เหลี่ยม"
                  >
                    <Square className="w-4 h-4" />
                    <span className="text-[10px]">เหลี่ยม</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddShape && onAddShape({ type: "circle" })}
                    className="p-2 rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50/40 text-gray-700 flex flex-col items-center gap-1 transition-all cursor-pointer"
                    title="วงกลม"
                  >
                    <Circle className="w-4 h-4" />
                    <span className="text-[10px]">วงกลม</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddShape && onAddShape({ type: "triangle" })}
                    className="p-2 rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50/40 text-gray-700 flex flex-col items-center gap-1 transition-all cursor-pointer"
                    title="สามเหลี่ยม"
                  >
                    <Triangle className="w-4 h-4" />
                    <span className="text-[10px]">สามเหลี่ยม</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddShape && onAddShape({ type: "star" })}
                    className="p-2 rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50/40 text-gray-700 flex flex-col items-center gap-1 transition-all cursor-pointer"
                    title="ดาว"
                  >
                    <Star className="w-4 h-4" />
                    <span className="text-[10px]">ดาว</span>
                  </button>
                </div>

                {/* Vector Icons Filter & Grid */}
                <div className="space-y-1.5 pt-1 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      คลังไอคอนเวกเตอร์
                    </span>
                    <select
                      value={selectedIconCat}
                      onChange={(e) => setSelectedIconCat(e.target.value)}
                      className="text-[10px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 outline-none"
                    >
                      {ICON_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {VECTOR_ICONS.filter(
                      (icon) =>
                        selectedIconCat === "all" || icon.category === selectedIconCat
                    ).map((icon) => (
                      <button
                        key={icon.id}
                        type="button"
                        onClick={() => onAddIcon && onAddIcon(icon)}
                        className="p-2 rounded-lg border border-gray-100 hover:border-purple-400 hover:bg-purple-50/60 flex flex-col items-center justify-center transition-all cursor-pointer"
                        title={icon.label}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="w-4 h-4"
                          fill="currentColor"
                        >
                          <path d={icon.path} />
                        </svg>
                        <span className="text-[9px] text-gray-500 truncate w-full text-center mt-1">
                          {icon.label.split(" ")[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: ADD CUSTOM TOKEN ── */}
      {showAddTokenModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <Braces className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    สร้างตัวแปรไดนามิกใหม่
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    สำหรับแทรกข้อมูลอัตโนมัติในเทมเพลตนี้
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTokenModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {tokenError && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
                {tokenError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  รหัสตัวแปร (ภาษาอังกฤษตัวพิมพ์เล็ก / ขีดล่าง)
                </label>
                <div className="flex items-center border border-gray-300 rounded-lg px-2.5 py-1.5 bg-gray-50 focus-within:bg-white focus-within:border-amber-500">
                  <span className="font-mono text-xs text-amber-600 font-bold mr-1">
                    {"{{"}
                  </span>
                  <input
                    type="text"
                    value={newTokenKey}
                    onChange={(e) =>
                      setNewTokenKey(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_]/g, "_")
                      )
                    }
                    placeholder="e.g. project_code"
                    className="flex-1 font-mono text-xs bg-transparent outline-none text-gray-900"
                  />
                  <span className="font-mono text-xs text-amber-600 font-bold ml-1">
                    {"}}"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ชื่อฟิลด์ภาษาไทย (Label)
                </label>
                <input
                  type="text"
                  value={newTokenLabel}
                  onChange={(e) => setNewTokenLabel(e.target.value)}
                  placeholder="เช่น รหัสโครงการ, เลขที่สัญญา"
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ค่าตัวอย่าง (Example / Preview Value)
                </label>
                <input
                  type="text"
                  value={newTokenExample}
                  onChange={(e) => setNewTokenExample(e.target.value)}
                  placeholder="เช่น PRJ-2026-001"
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAddTokenModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveNewToken}
                disabled={isSavingToken}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSavingToken ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>บันทึกตัวแปร</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD RECIPIENT / SIGNATORY ── */}
      {/* Add Recipient Modal (Enhanced with Suggestion & Role) */}
      {showAddRecipientModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">
                  เพิ่มผู้รับ (Add Recipient)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddRecipientModal(false);
                  setShowRecSuggestions(false);
                }}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Name or Search */}
              <div className="relative">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ชื่อ-นามสกุล หรือ ค้นหา
                </label>
                <input
                  type="text"
                  value={newRecName}
                  onChange={(e) => {
                    setNewRecName(e.target.value);
                    setShowRecSuggestions(true);
                  }}
                  onFocus={() => setShowRecSuggestions(true)}
                  placeholder="เช่น สมชาย ใจดี, กรรมการผู้จัดการ"
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-indigo-500"
                />

                {/* Suggestions drop */}
                {showRecSuggestions && recSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-40 overflow-y-auto p-1 divide-y divide-gray-50">
                    {recSuggestions.map((item) => (
                      <button
                        key={item.id || item.email}
                        type="button"
                        onClick={() => {
                          setNewRecName(item.name);
                          setNewRecEmail(item.email || "");
                          setShowRecSuggestions(false);
                        }}
                        className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-50 text-left text-xs transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                          <p className="text-[10px] text-gray-500 truncate">{item.email}</p>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0">
                          {item.role}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  อีเมล (Gmail / Corporate Email)
                </label>
                <input
                  type="email"
                  value={newRecEmail}
                  onChange={(e) => setNewRecEmail(e.target.value)}
                  placeholder="somchai@gmail.com"
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-indigo-500"
                />
              </div>

              {/* Role selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  บทบาทและสิทธิ์ (Role & Permission)
                </label>
                <select
                  value={newRecRole}
                  onChange={(e) => setNewRecRole(e.target.value)}
                  className="w-full border border-gray-300 bg-white rounded-lg px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="signer">ผู้ลงนาม (Signer) - ลงลายเซ็นในเอกสาร</option>
                  <option value="editor">ผู้ร่วมแก้ไข (Editor) - ช่วยตรวจและแก้ไขข้อความ</option>
                  <option value="approver">ผู้อนุมัติ (Approver) - ตรวจสอบและกดอนุมัติ</option>
                  <option value="viewer">ผู้ดู (Viewer) - ดูเอกสารได้อย่างเดียว</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setShowAddRecipientModal(false);
                  setShowRecSuggestions(false);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleAddRecipient}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
              >
                เพิ่มผู้รับ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Token Confirmation Modal */}
      {tokenToDelete && (
        <DeleteConfirmModal
          isOpen={Boolean(tokenToDelete)}
          title="ยืนยันการลบตัวแปร"
          description={`คุณต้องการลบตัวแปร "${tokenToDelete.label}" (${tokenToDelete.key}) ใช่หรือไม่?`}
          onConfirm={handleConfirmDeleteToken}
          onCancel={() => setTokenToDelete(null)}
          loading={isDeletingToken}
        />
      )}
    </aside>
  );
}