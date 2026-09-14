"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowLeft, Check, Sparkles, Loader2 } from "lucide-react";
import { fieldRegistry, categoryLabels } from "@/lib/profiles/fieldRegistry";
import {
  getAllTemplateSchemas,
  getTemplateAllKeys,
  getRelevantTemplates,
  buildCustomTemplateSchema,
} from "@/lib/profiles/compatibility";
import { createFieldProfile, updateFieldProfile } from "@/lib/data/fieldProfiles";

function ProfileFormContent({ profile }) {
  const router = useRouter();

  const [name, setName] = useState(profile?.name || "");
  const [values, setValues] = useState(profile?.values || {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Dynamic template + custom token loading ──
  const [allTemplates, setAllTemplates] = useState(() => getAllTemplateSchemas());
  const [customTokens, setCustomTokens] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  useEffect(() => {
    async function loadDynamic() {
      try {
        const [tokRes, tmplRes, catRes] = await Promise.all([
          fetch("/api/custom-tokens", { cache: "no-store" }),
          fetch("/api/templates", { cache: "no-store" }),
          fetch("/api/categories", { cache: "no-store" }),
        ]);
        const tokens = tokRes.ok ? await tokRes.json() : [];
        const customTemplates = tmplRes.ok ? await tmplRes.json() : [];
        const catList = catRes.ok ? await catRes.json() : [];
        setCustomTokens(tokens);
        setCategories(catList || []);

        const customSchemas = customTemplates.map((t) => buildCustomTemplateSchema(t, tokens));

        const sysSchemas = getAllTemplateSchemas();
        const sysIds = new Set(sysSchemas.map((s) => s.id));
        const filteredCustom = customSchemas.filter((c) => !sysIds.has(c.id));

        setAllTemplates([...sysSchemas, ...filteredCustom]);
      } catch (e) {
        console.warn("Failed to load dynamic templates in ProfileForm:", e);
      } finally {
        setIsLoadingTemplates(false);
      }
    }
    loadDynamic();
  }, []);

  // เลือกเทมเพลตที่จะใช้ชุดข้อมูลนี้
  const [selectedTemplateIds, setSelectedTemplateIds] = useState(() => {
    if (profile?.compatibleTemplates && Array.isArray(profile.compatibleTemplates) && profile.compatibleTemplates.length > 0) {
      return profile.compatibleTemplates;
    }
    if (profile?.templateIds && Array.isArray(profile.templateIds) && profile.templateIds.length > 0) {
      return profile.templateIds;
    }
    if (profile?.values) {
      const relevant = getRelevantTemplates(profile.values).map((r) => r.templateId);
      return relevant.length > 0 ? relevant : [];
    }
    return [];
  });


  const toggleTemplateSelect = (id) => {
    setSelectedTemplateIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllTemplates = () => {
    setSelectedTemplateIds(allTemplates.map((t) => t.id));
  };

  const clearAllTemplates = () => {
    setSelectedTemplateIds([]);
  };

  // แสดงเฉพาะ field ที่เทมเพลตที่เลือกใช้งานจริงเท่านั้น
  // รองรับทั้ง System Templates (fieldRegistry) และ Custom Templates (entity tokens)
  const visibleKeys = useMemo(() => {
    if (selectedTemplateIds.length === 0) return [];
    const keys = new Set();
    const customEntityFields = []; // fields from custom templates

    selectedTemplateIds.forEach((id) => {
      // System template: use getTemplateAllKeys
      const systemKeys = getTemplateAllKeys(id);
      if (systemKeys.length > 0) {
        systemKeys.forEach((k) => keys.add(k));
      } else {
        // Custom template: look up schema in allTemplates
        const schema = allTemplates.find((t) => t.id === id);
        if (schema?.fields?.length > 0) {
          schema.fields.forEach((f) => {
            if (f.sharedKey) {
              keys.add(f.sharedKey);
              customEntityFields.push(f.sharedKey);
            }
          });
        } else if (schema) {
          // If custom template has no specific tokens yet, provide essential entity fields
          ["company_name_th", "tax_id", "address_th", "attn_name", "phone", "email"].forEach((k) => keys.add(k));
        }
      }
    });

    // รักษาฟิลด์ที่มีค่าบันทึกอยู่แล้วในโปรไฟล์เดิม
    Object.entries(values).forEach(([k, v]) => {
      if (v) keys.add(k);
    });

    return [...keys];
  }, [selectedTemplateIds, values, allTemplates]);

  // คำนิยามฟิลด์แบบรวม: fieldRegistry (system) + customTokens + template fields
  const resolvedFieldDef = useMemo(() => {
    const combined = { ...fieldRegistry };
    
    // 1. Registered custom tokens
    customTokens.forEach((t) => {
      if (!combined[t.key]) {
        combined[t.key] = {
          label: t.label || t.key,
          type: "text",
          category: "custom",
          placeholder: t.example || "",
          isCustom: true,
        };
      }
    });

    // 2. Dynamic fields extracted from template schemas
    allTemplates.forEach((tmpl) => {
      (tmpl.fields || []).forEach((f) => {
        if (!combined[f.sharedKey]) {
          combined[f.sharedKey] = {
            label: f.label || f.sharedKey,
            type: "text",
            category: f.category || "custom",
            placeholder: f.placeholder || "",
            isCustom: true,
          };
        }
      });
    });

    return combined;
  }, [customTokens, allTemplates]);

  // Group fields by category — use resolvedFieldDef (system + custom tokens)
  const grouped = useMemo(() => {
    const groups = {};
    visibleKeys.forEach((key) => {
      const def = resolvedFieldDef[key];
      if (!def) return; // skip unknown keys
      const cat = def.category || "company";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(key);
    });
    return groups;
  }, [visibleKeys, resolvedFieldDef]);

  const handleChange = (key, val) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Please enter a preset name for easy identification.");
      return;
    }
    if (selectedTemplateIds.length === 0 && Object.keys(values).length === 0) {
      alert("Please select at least 1 template to configure fields.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        values,
        compatibleTemplates: selectedTemplateIds,
        templateIds: selectedTemplateIds,
      };
      if (profile) await updateFieldProfile(profile.id, payload);
      else await createFieldProfile(payload);
      setSaved(true);
      setTimeout(() => router.push("/profile-data"), 600);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Navigation Back */}
      <div>
        <Link
          href="/profile-data"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors bg-surface px-3.5 py-2 rounded-xl border border-border shadow-2xs"
        >
          <ArrowLeft size={15} />
          Back to Data Presets
        </Link>
      </div>

      {/* Main Form Container Card */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-6">
        
        {/* 1. Profile Name Input Field */}
        <div className="space-y-1.5 pb-5 border-b border-border">
          <label className="block text-sm font-semibold text-foreground">Preset Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Crest Zendo Co., Ltd., Partner Profile A"
            className="w-full h-10 px-3.5 rounded-xl border border-border bg-muted/20 text-sm text-foreground outline-none focus:border-primary focus:bg-surface font-medium transition-all placeholder:text-muted-foreground/70"
          />
          <p className="text-xs text-muted-foreground">Used to identify this preset during document generation. Does not appear on final documents.</p>
        </div>

        {/* 2. Template Selector Chips */}
        <div className="space-y-2.5 pb-5 border-b border-border">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-foreground flex items-center gap-1.5">
              <span>Compatible Templates</span>
              <Sparkles size={14} className="text-primary" />
            </label>
            <div className="flex items-center gap-3">
              {selectedTemplateIds.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllTemplates}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Deselect all
                </button>
              )}
              <button
                type="button"
                onClick={selectAllTemplates}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Select all
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Choose which document templates will use this preset — the form will adapt and display relevant fields below.
          </p>

          {isLoadingTemplates ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <Loader2 size={13} className="animate-spin" />
              <span>กำลังโหลดเทมเพลต...</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {allTemplates.map((t) => {
                const isSelected = selectedTemplateIds.includes(t.id);
                const catMatch = categories.find((c) => c.id === t.categoryId);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTemplateSelect(t.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 text-primary border-primary/40 shadow-2xs font-semibold"
                        : "bg-surface text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {isSelected && <Check size={13} className="text-primary shrink-0" />}
                    <span>{t.name}</span>
                    {catMatch && (
                      <span className="px-1.5 py-0.2 rounded-md bg-muted text-[10px] text-muted-foreground">
                        {catMatch.name}
                      </span>
                    )}
                    {t.isCustomTemplate && (
                      <span className="px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-semibold">
                        Custom
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>


        {/* 3. Dynamic Form Fields grouped by Category */}
        {visibleKeys.length === 0 ? (
          <div className="p-10 text-center border border-dashed border-border rounded-xl bg-muted/20 text-muted-foreground text-xs space-y-1">
            <p className="font-semibold text-foreground">💡 No templates selected</p>
            <p>Select one or more templates above to show the required fields to fill.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([category, keys]) => (
            <div key={category} className="space-y-4 pt-1">
              <h2 className="text-xs font-bold text-muted-foreground pb-2 border-b border-border uppercase tracking-wider flex items-center gap-1.5">
                {category === "custom" && <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[9px] font-bold normal-case">Custom</span>}
                {categoryLabels[category] || (category === "custom" ? "ตัวแปรที่กำหนดเอง (Custom Variables)" : category)}
              </h2>
              <div className="space-y-4">
                {keys.map((key) => {
                  const def = resolvedFieldDef[key];
                  if (!def) return null;
                  return (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                        {def.label}
                        {def.isCustom && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 font-bold">custom</span>}
                      </label>
                      {def.type === "textarea" ? (
                        <textarea
                          value={values[key] || ""}
                          placeholder={def.placeholder}
                          onChange={(e) => handleChange(key, e.target.value)}
                          rows={2}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 text-xs text-foreground outline-none focus:border-primary focus:bg-surface resize-none transition-all placeholder:text-muted-foreground/70"
                        />
                      ) : (
                        <input
                          type="text"
                          value={values[key] || ""}
                          placeholder={def.placeholder}
                          onChange={(e) => handleChange(key, e.target.value)}
                          className="w-full h-10 px-3.5 rounded-xl border border-border bg-muted/20 text-xs text-foreground outline-none focus:border-primary focus:bg-surface transition-all placeholder:text-muted-foreground/70"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}


      </div>

      {/* Action Footer Buttons */}
      <div className="flex items-center gap-2.5 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="primary-button h-9 px-5 rounded-[8px] text-white text-xs font-medium shadow-xs hover:opacity-95 disabled:opacity-60 transition-all cursor-pointer"
        >
          {saving ? "Saving..." : "Save Preset"}
        </button>
        <button
          onClick={() => router.push("/profile-data")}
          className="inline-flex items-center justify-center h-9 px-4 rounded-[8px] border border-border text-foreground text-xs font-medium hover:bg-muted transition-colors bg-surface shadow-2xs cursor-pointer"
        >
          Cancel
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
            <CheckCircle2 size={15} />
            Saved successfully
          </span>
        )}
      </div>
    </div>
  );
}

export default function ProfileForm(props) {
  return (
    <Suspense fallback={<div className="h-32 flex items-center justify-center text-muted-foreground text-xs">Loading...</div>}>
      <ProfileFormContent {...props} />
    </Suspense>
  );
}
