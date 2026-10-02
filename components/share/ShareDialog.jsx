"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Link as LinkIcon,
  Check,
  User,
  Shield,
  Trash2,
  ChevronDown,
  Search,
  Loader2,
  Users,
  PenTool,
  CheckCircle,
  Eye,
  FileEdit,
} from "lucide-react";

export default function ShareDialog({
  isOpen,
  onClose,
  entityId,
  entityType = "document",
  entityTitle = "เอกสารนี้",
  currentUserEmail = "keem@crestzendo.com",
  currentUserName = "สิรวิทย์ เพชรจำรัส",
}) {
  const [authorizations, setAuthorizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Invite form state
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [permissionLevel, setPermissionLevel] = useState("editor"); // 'editor' | 'signer' | 'approver' | 'viewer'
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const searchBoxRef = useRef(null);

  // Load existing authorizations
  useEffect(() => {
    if (!isOpen || !entityId) return;
    setLoading(true);
    fetch(`/api/authorizations?entityId=${entityId}&entityType=${entityType}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setAuthorizations(data || []))
      .catch((e) => console.warn("Failed to load authorizations:", e))
      .finally(() => setLoading(false));
  }, [isOpen, entityId, entityType]);

  // Load auto-suggestions
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetch(`/api/recipients/suggest?q=${encodeURIComponent(query)}`)
        .then((r) => (r.ok ? r.json() : []))
        .then(setSuggestions)
        .catch(() => {});
    }, 150);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Handle select suggestion
  const handleSelectSuggestion = (item) => {
    setSelectedUser(item);
    setQuery(item.email || item.name);
    setShowSuggestions(false);
  };

  // Handle Invite / Add
  const handleInvite = async (e) => {
    e?.preventDefault();
    setErrorMsg("");

    const email = (selectedUser?.email || query).trim();
    if (!email || !email.includes("@")) {
      setErrorMsg("กรุณาระบุอีเมลที่ถูกต้อง (เช่น yourname@gmail.com)");
      return;
    }

    setIsInviting(true);
    try {
      const res = await fetch("/api/authorizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId,
          entityType,
          userEmail: email,
          userName: selectedUser?.name || email.split("@")[0],
          roleTitle: selectedUser?.role || "ผู้รับเอกสาร",
          permissionLevel,
          grantedByEmail: currentUserEmail,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "ไม่สามารถเพิ่มสิทธิ์ได้");
      }

      const created = await res.json();
      setAuthorizations((prev) => [...prev, created]);
      setQuery("");
      setSelectedUser(null);
    } catch (err) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการแชร์");
    } finally {
      setIsInviting(false);
    }
  };

  // Change permission level
  const handleChangePermission = async (authId, newLevel) => {
    try {
      const res = await fetch("/api/authorizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: authId, permissionLevel: newLevel }),
      });
      if (res.ok) {
        setAuthorizations((prev) =>
          prev.map((a) => (a.id === authId ? { ...a, permissionLevel: newLevel } : a))
        );
      }
    } catch (err) {
      console.error("Failed to update permission:", err);
    }
  };

  // Revoke permission
  const handleRevoke = async (authId) => {
    try {
      const res = await fetch(`/api/authorizations?id=${authId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAuthorizations((prev) => prev.filter((a) => a.id !== authId));
      }
    } catch (err) {
      console.error("Failed to revoke permission:", err);
    }
  };

  // Copy share link
  const handleCopyLink = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const roleConfigs = {
    editor: { label: "can edit", thai: "ผู้ร่วมแก้ไข", icon: FileEdit, color: "text-blue-600" },
    signer: { label: "can sign", thai: "ผู้ลงนาม", icon: PenTool, color: "text-purple-600" },
    approver: { label: "can approve", thai: "ผู้อนุมัติ", icon: CheckCircle, color: "text-emerald-600" },
    viewer: { label: "can view", thai: "ดูอย่างเดียว", icon: Eye, color: "text-gray-500" },
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-gray-900 dark:text-gray-100 animate-in zoom-in-[0.98] duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              แชร์ {entityType === "template" ? "แม่แบบนี้" : "เอกสารนี้"}
            </h2>
            <span className="text-[11px] text-gray-400 truncate max-w-[200px]">
              ({entityTitle})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span className="text-emerald-600">คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <LinkIcon size={14} />
                  <span>Copy link</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Invite Bar (Universal Input & Role Dropdown) */}
        <div className="p-5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
          <form onSubmit={handleInvite} className="flex items-center gap-2">
            {/* Input with Auto-suggest */}
            <div className="relative flex-1" ref={searchBoxRef}>
              <div className="flex items-center border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl px-3 py-2 shadow-2xs focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all">
                <Search size={14} className="text-gray-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="พิมพ์ชื่อ หรืออีเมล Gmail เพื่อแชร์..."
                  className="w-full text-xs text-gray-900 dark:text-gray-100 bg-transparent outline-none placeholder:text-gray-400"
                />
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto p-1 divide-y divide-gray-100 dark:divide-zinc-700/50">
                  {suggestions.map((item) => (
                    <button
                      key={item.id || item.email}
                      type="button"
                      onClick={() => handleSelectSuggestion(item)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                          {item.name ? item.name.slice(0, 2).toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {item.email}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 shrink-0">
                        {item.role}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Permission Selector */}
            <div className="relative shrink-0">
              <select
                value={permissionLevel}
                onChange={(e) => setPermissionLevel(e.target.value)}
                className="h-[38px] px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 outline-none cursor-pointer hover:border-gray-300 shadow-2xs"
              >
                <option value="editor">can edit (แก้ไข)</option>
                <option value="signer">can sign (ลงนาม)</option>
                <option value="approver">can approve (อนุมัติ)</option>
                <option value="viewer">can view (ดู)</option>
              </select>
            </div>

            {/* Invite Button */}
            <button
              type="submit"
              disabled={isInviting || !query.trim()}
              className="h-[38px] px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {isInviting ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <span>เชิญ</span>
              )}
            </button>
          </form>

          {errorMsg && (
            <p className="text-[11px] text-rose-500 mt-2 font-medium">{errorMsg}</p>
          )}
        </div>

        {/* Who has access list */}
        <div className="p-5 space-y-3">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Who has access (ผู้มีสิทธิ์เข้าถึง)
          </p>

          <div className="divide-y divide-gray-100 dark:divide-zinc-800/80 max-h-64 overflow-y-auto">
            {/* Owner Row */}
            <div className="py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  {currentUserName ? currentUserName.slice(0, 2).toUpperCase() : "SP"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                      {currentUserName}
                    </p>
                    <span className="text-[10px] text-gray-400">(you)</span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">{currentUserEmail}</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-0.5">
                owner
              </span>
            </div>

            {/* Authorized Users Rows */}
            {authorizations.map((auth) => {
              const cfg = roleConfigs[auth.permissionLevel] || roleConfigs.viewer;
              const IconComp = cfg.icon;

              return (
                <div key={auth.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/50 font-bold text-xs flex items-center justify-center shrink-0">
                      {auth.userName ? auth.userName.slice(0, 2).toUpperCase() : "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                        {auth.userName || auth.userEmail}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">{auth.userEmail}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      value={auth.permissionLevel}
                      onChange={(e) => handleChangePermission(auth.id, e.target.value)}
                      className="text-xs bg-transparent border-0 font-medium text-gray-600 dark:text-gray-300 outline-none cursor-pointer hover:text-indigo-600"
                    >
                      <option value="editor">can edit</option>
                      <option value="signer">can sign</option>
                      <option value="approver">can approve</option>
                      <option value="viewer">can view</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRevoke(auth.id)}
                      className="p-1 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="ลบสิทธิ์เข้าถึง"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
