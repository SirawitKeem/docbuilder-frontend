"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import {
  X,
  Check,
  ArrowRight,
  FileText,
  Search,
  Info,
  CheckCircle2,
} from "lucide-react";
import { getTemplatesByCategory } from "@/lib/data/templates";
import { QuotationDataProvider } from "@/context/QuotationDataContext";
import QuotationDocument from "@/components/document/quotation/QuotationDocument";
import { DocumentFieldsProvider } from "@/context/DocumentFieldsContext";
import DocumentHeader from "@/components/document/DocumentHeader";
import DocumentFooter from "@/components/document/DocumentFooter";
import { DynamicContractPage } from "@/components/document/DynamicContractPage";
import { notificationTemplate } from "@/lib/templates/notification/schema";
import UniversalTemplateRenderer from "@/components/document/UniversalTemplateRenderer";
import FabricPrintRenderer from "@/components/document/FabricPrintRenderer";
import { DEFAULT_SAMPLE_TOKEN_MAP } from "@/lib/tokens/tokenEngine";

const emptyQuotationPreviewData = {
  id: "preview",
  quotationNo: "CZ26080001",
  revision: "01",
  quotationDate: "",
  priceValidity: "",
  deliveryTerm: "",
  creditTerm: "",
  billTo: {
    companyName: "",
    attn: "",
    endUser: "",
    subject: "",
    am: "",
  },
  lineItems: [],
  vatRate: 7,
  specialDiscount: 0,
  remarks: "",
  remarksList: ["Payment: Annually"],
  senderName: "",
  senderPosition: "",
  senderEmail: "",
  senderPhone: "",
};

/**
 * Helper component: Loads full template by ID and renders via FabricPrintRenderer
 */
function CustomFabricTemplatePreview({ templateId, scale = 0.151, fallback }) {
  const [loadedTemplate, setLoadedTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!templateId) {
      setLoading(false);
      return;
    }
    fetch(`/api/templates/${templateId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active) {
          setLoadedTemplate(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Failed to load template for preview:", err);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [templateId]);

  const preset = getCanvasPreset(
    loadedTemplate?.canvasPreset || (loadedTemplate?.editorType === "slide" ? "slide-16-9" : "a4-portrait")
  );
  const width = (preset?.width || 794) * scale;
  const height = (preset?.height || 1123) * scale;

  if (loading) {
    return (
      <div
        className="overflow-hidden rounded-md shadow-xs border border-gray-100 bg-white relative shrink-0 flex items-center justify-center animate-pulse"
        style={{ width, height }}
      >
        <div className="w-4 h-4 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!loadedTemplate) {
    return fallback || null;
  }

  // If template has blocks without pages (Universal Block format)
  if ((!loadedTemplate.pages || loadedTemplate.pages.length === 0) && Array.isArray(loadedTemplate.blocks) && loadedTemplate.blocks.length > 0) {
    return (
      <div
        className="overflow-hidden rounded-md shadow-xs border border-gray-200 bg-white relative shrink-0"
        style={{ width, height }}
      >
        <div
          className="origin-top-left pointer-events-none select-none"
          style={{
            width: preset.width,
            height: preset.height,
            transform: `scale(${scale})`,
          }}
        >
          <UniversalTemplateRenderer template={loadedTemplate} scale={1} />
        </div>
      </div>
    );
  }

  // Fabric Canvas Rendering
  return (
    <div
      className="overflow-hidden rounded-md shadow-xs border border-gray-200 bg-white relative shrink-0"
      style={{ width, height }}
    >
      <div
        className="origin-top-left pointer-events-none select-none"
        style={{
          width: preset.width,
          height: preset.height,
          transform: `scale(${scale})`,
        }}
      >
        <FabricPrintRenderer
          template={loadedTemplate}
          values={DEFAULT_SAMPLE_TOKEN_MAP}
        />
      </div>
    </div>
  );
}

function LegacyStaticPreview({ effectiveCategory, scale, width, height }) {
  const content = useMemo(() => {
    if (effectiveCategory === "quotation") {
      return (
        <QuotationDataProvider initialQuotation={emptyQuotationPreviewData}>
          <div style={{ width: 794, height: 1123 }} className="bg-white overflow-hidden text-left font-sans select-none">
            <QuotationDocument currentPage={1} />
          </div>
        </QuotationDataProvider>
      );
    }

    if (effectiveCategory === "nda") {
      return (
        <DocumentFieldsProvider initialValues={{}} defaultReadOnly={true}>
          <div style={{ width: 794, height: 1123 }} className="bg-white text-left font-sans px-14 pt-10 pb-6 flex flex-col justify-between overflow-hidden select-none">
            <DocumentHeader logo="/quotation.png" />
            <div className="flex-1 min-h-0 overflow-hidden text-gray-900 text-sm">
              <DynamicContractPage templateId="nda" pageNumber={1} />
            </div>
            <DocumentFooter currentPage={1} totalPages={4} />
          </div>
        </DocumentFieldsProvider>
      );
    }

    if (effectiveCategory === "partner") {
      return (
        <DocumentFieldsProvider initialValues={{}} defaultReadOnly={true}>
          <div style={{ width: 794, height: 1123 }} className="bg-white text-left font-sans px-14 pt-10 pb-6 flex flex-col justify-between overflow-hidden">
            <DocumentHeader logo="/quotation.png" />
            <div className="flex-1 min-h-0 overflow-hidden text-gray-900 text-sm">
              <DynamicContractPage templateId="partner" pageNumber={1} />
            </div>
            <DocumentFooter currentPage={1} totalPages={5} />
          </div>
        </DocumentFieldsProvider>
      );
    }

    if (effectiveCategory === "distributor") {
      return (
        <DocumentFieldsProvider initialValues={{}} defaultReadOnly={true}>
          <div style={{ width: 794, height: 1123 }} className="bg-white text-left font-sans px-14 pt-10 pb-6 flex flex-col justify-between overflow-hidden">
            <DocumentHeader logo="/quotation.png" />
            <div className="flex-1 min-h-0 overflow-hidden text-gray-900 text-sm">
              <DynamicContractPage templateId="distributor" pageNumber={1} />
            </div>
            <DocumentFooter currentPage={1} totalPages={5} />
          </div>
        </DocumentFieldsProvider>
      );
    }

    if (effectiveCategory === "notification") {
      return (
        <DocumentFieldsProvider initialValues={notificationTemplate?.previewData || {}} defaultReadOnly={true}>
          <div style={{ width: 794, height: 1123 }} className="bg-white overflow-hidden text-left font-sans select-none">
            <DynamicContractPage templateId="notification" pageNumber={1} />
          </div>
        </DocumentFieldsProvider>
      );
    }

    return (
      <div style={{ width: 794, height: 1123 }} className="bg-white text-left font-sans p-10 flex flex-col justify-between overflow-hidden">
        <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#7C3AED] flex items-center justify-center text-white font-bold text-xs">
              CZ
            </div>
            <div>
              <p className="font-bold text-gray-900 text-xs">Crest Zendo Co., Ltd.</p>
              <p className="text-[10px] text-gray-500">CREST ZENDO CO., LTD.</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-[#7C3AED] font-bold border border-purple-100">
            Official Document
          </span>
        </div>
        <div className="flex-1 py-6 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
          <div className="h-2.5 bg-gray-100 rounded w-full" />
          <div className="h-2.5 bg-gray-100 rounded w-5/6" />
          <div className="h-2.5 bg-gray-100 rounded w-4/6" />
        </div>
        <div className="border-t border-gray-100 pt-4 flex justify-between">
          <div className="h-8 border-b border-gray-300 w-28" />
          <div className="h-8 border-b border-gray-300 w-28" />
        </div>
      </div>
    );
  }, [effectiveCategory]);

  return (
    <div
      className="overflow-hidden rounded-md shadow-xs border border-gray-200 bg-white relative shrink-0"
      style={{ width, height }}
    >
      <div
        className="origin-top-left pointer-events-none select-none"
        style={{
          width: 794,
          height: 1123,
          transform: `scale(${scale})`,
        }}
      >
        {content}
      </div>
    </div>
  );
}

/**
 * Authentic Document Preview rendered directly from the real Document Component
 */
function RealTemplatePreview({ categoryId, templateItem = null, scale = 0.151 }) {
  const width = 794 * scale;
  const height = 1123 * scale;

  const fallbackSkeleton = (
    <div
      className="overflow-hidden rounded-md shadow-xs border border-gray-200 bg-white relative shrink-0"
      style={{ width, height }}
    >
      <div
        className="origin-top-left pointer-events-none select-none"
        style={{
          width: 794,
          height: 1123,
          transform: `scale(${scale})`,
        }}
      >
        <div style={{ width: 794, height: 1123 }} className="bg-white text-left font-sans p-10 flex flex-col justify-between overflow-hidden">
          <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#7C3AED] flex items-center justify-center text-white font-bold text-xs">
                CZ
              </div>
              <div>
                <p className="font-bold text-gray-900 text-xs">Crest Zendo Co., Ltd.</p>
                <p className="text-[10px] text-gray-500">CREST ZENDO CO., LTD.</p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-[#7C3AED] font-bold border border-purple-100">
              Official Document
            </span>
          </div>
          <div className="flex-1 py-6 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
            <div className="h-2.5 bg-gray-100 rounded w-full" />
            <div className="h-2.5 bg-gray-100 rounded w-5/6" />
            <div className="h-2.5 bg-gray-100 rounded w-4/6" />
          </div>
          <div className="border-t border-gray-100 pt-4 flex justify-between">
            <div className="h-8 border-b border-gray-300 w-28" />
            <div className="h-8 border-b border-gray-300 w-28" />
          </div>
        </div>
      </div>
    </div>
  );

  if (templateItem?.id) {
    return (
      <CustomFabricTemplatePreview
        templateId={templateItem.id}
        scale={scale}
        fallback={fallbackSkeleton}
      />
    );
  }

  const effectiveCategory = (templateItem?.categoryId || categoryId || "").toLowerCase();
  return (
    <LegacyStaticPreview
      effectiveCategory={effectiveCategory}
      scale={scale}
      width={width}
      height={height}
    />
  );
}

export default function TemplateSelectModal({ category, onClose }) {
  const router = useRouter();
  const { t } = useLanguage();

  const [subTemplates, setSubTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Load sub-templates asynchronously from single API/JSON source
  useEffect(() => {
    if (!category?.id) {
      setSubTemplates([]);
      return;
    }
    Promise.resolve(getTemplatesByCategory(category.id)).then((data) => {
      const list = Array.isArray(data) ? data : [];
      setSubTemplates(list);
      if (list.length > 0) {
        setSelectedTemplate(list[0]);
      }
    });
  }, [category]);

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Filtered sub-templates based on Search
  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return subTemplates;
    const q = searchQuery.toLowerCase();
    return subTemplates.filter((item) => {
      const matchName = item.name?.toLowerCase().includes(q);
      const matchEng = item.englishName?.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      return matchName || matchEng || matchDesc;
    });
  }, [subTemplates, searchQuery]);

  // Handle navigate to create document with selected template
  const handleUseTemplate = () => {
    if (!selectedTemplate || !category?.id) return;
    onClose?.();
    router.push(`/create/custom?templateId=${selectedTemplate.id}&categoryId=${category.id}`);
  };

  if (!category) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[580px] max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 overflow-hidden border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="h-18 px-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#7C3AED] flex items-center justify-center shrink-0 border border-purple-100/60 shadow-2xs">
              <FileText size={20} className="text-[#7C3AED]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                Select {category.name} Template
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Choose a template to create {category.fullName || category.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center cursor-pointer"
            title="Close (ESC)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-gray-50 flex items-center justify-between gap-4 shrink-0 bg-gray-50/40">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('templateSelect.searchPlaceholder') || "Search templates..."}
              className="w-full pl-8.5 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
            />
          </div>
          <div className="text-xs text-gray-500 font-medium">
            {filteredTemplates.length} templates available
          </div>
        </div>

        {/* Main Body: Left Cards Grid + Right Detail Preview Panel */}
        <div className="px-6 py-4 flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-5 overflow-hidden">
          {/* Left Grid: Sub-template Cards (7 cols on md) */}
          <div className="md:col-span-7 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredTemplates.map((item) => {
                const isSelected = selectedTemplate?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedTemplate(item)}
                    className={`rounded-xl p-3 border transition-all duration-150 cursor-pointer flex flex-col justify-between relative group ${
                      isSelected
                        ? "border-[#7C3AED] bg-[#F5F3FF] ring-1.5 ring-[#7C3AED] shadow-xs"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-2xs"
                    }`}
                  >
                    {/* Top Right Checkmark Badge when active */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4.5 h-4.5 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shadow-xs z-10 animate-in zoom-in-50 duration-150">
                        <Check size={11} strokeWidth={3} />
                      </div>
                    )}

                    {/* Miniature Real Document Container */}
                    <div className="w-full h-40 rounded-lg bg-[#F8F9FB] flex items-center justify-center p-2 mb-2.5 overflow-hidden">
                      <RealTemplatePreview
                        categoryId={category.id}
                        templateItem={item}
                        scale={0.132}
                      />
                    </div>

                    {/* Title & Tag */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-xs text-gray-900 group-hover:text-[#7C3AED] transition-colors truncate">
                          {item.name}
                        </h3>
                        {(item.badge || item.tag) && (
                          <span
                            className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                              item.badge === "Standard" || item.badge === "มาตรฐาน" || item.tag === "มาตรฐาน"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : item.badge === "Custom" || item.badge === "กำหนดเอง"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : item.tagColor || "bg-gray-100 text-gray-700 border-gray-200"
                            }`}
                          >
                            {item.badge || item.tag}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed font-normal">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="py-16 text-center text-gray-400 font-medium text-xs">
                No templates found matching your search
              </div>
            )}
          </div>

          {/* Right Sidebar: Dynamic Template Detail Preview (5 cols on md) */}
          {selectedTemplate && (
            <div className="md:col-span-5 bg-[#FAF9FD] rounded-xl border border-purple-100/70 p-4 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-3.5">
                {/* Floating Real Document Preview Container */}
                <div className="w-full h-44 rounded-lg bg-gradient-to-b from-purple-100/50 to-purple-50/30 flex items-center justify-center p-2 shadow-2xs border border-purple-100/40 overflow-hidden">
                  <div className="transform hover:scale-105 transition-transform duration-200">
                    <RealTemplatePreview
                      categoryId={category.id}
                      templateItem={selectedTemplate}
                      scale={0.145}
                    />
                  </div>
                </div>

                {/* Template Name & Details */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-gray-900">
                      {selectedTemplate.name}
                    </h3>
                    {(selectedTemplate.badge || selectedTemplate.tag) && (
                      <span
                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                          selectedTemplate.badge === "Standard" || selectedTemplate.badge === "มาตรฐาน" || selectedTemplate.tag === "มาตรฐาน"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : selectedTemplate.badge === "Custom" || selectedTemplate.badge === "กำหนดเอง"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : selectedTemplate.tagColor || "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {selectedTemplate.badge || selectedTemplate.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-normal leading-relaxed">
                    {selectedTemplate.description}
                  </p>
                </div>

                {/* Info Block */}
                <div className="space-y-1.5 pt-2.5 border-t border-gray-200/60 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-gray-800 mb-1">
                    <Info size={13} className="text-gray-400" />
                    <span>{t('templateSelect.specs') || "Template Specifications"}</span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600 py-0.5">
                    <span className="text-gray-500">
                      {selectedTemplate.editorType === "slide"
                        ? "Slide Count"
                        : selectedTemplate.editorType === "sheet"
                        ? "Workbook Structure"
                        : "Page Count"}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {selectedTemplate.editorType === "sheet"
                        ? "ตารางคำนวณและสูตร"
                        : selectedTemplate.editorType === "slide"
                        ? `${selectedTemplate.pageCount || (selectedTemplate.pages?.length || 1)} สไลด์ (16:9)`
                        : selectedTemplate.pageCount || (selectedTemplate.pages?.length ? `${selectedTemplate.pages.length} หน้า A4` : "1 หน้า A4")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600 py-0.5">
                    <span className="text-gray-500">File Format</span>
                    <span className="font-semibold text-gray-900">
                      {selectedTemplate.editorType === "sheet"
                        ? "Excel (.xlsx) / CSV"
                        : selectedTemplate.editorType === "slide"
                        ? "Slides (16:9 Presentation)"
                        : "PDF / Print (A4)"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600 py-0.5">
                    <span className="text-gray-500">
                      {selectedTemplate.editorType === "sheet" ? "Formulas & Grid" : "Email & Print Ready"}
                    </span>
                    <CheckCircle2 size={15} className="text-emerald-500 fill-emerald-50" />
                  </div>
                </div>

                {/* Highlights Block */}
                {(() => {
                  const resolvedFeatures =
                    selectedTemplate.features && selectedTemplate.features.length > 0
                      ? selectedTemplate.features
                      : selectedTemplate.editorType === "sheet"
                      ? [
                          "สูตรคำนวณและตารางอัตโนมัติ (Formulas)",
                          "จัดรูปแบบเซลล์และสไตล์แบบสเปรดชีต",
                          "ส่งออกไฟล์ Excel (.xlsx) และ CSV",
                          "รองรับการดึงข้อมูลจากชุดข้อมูลกลาง (Data Presets)",
                        ]
                      : selectedTemplate.editorType === "slide"
                      ? [
                          "อัตราส่วนมาตรฐาน Widescreen 16:9",
                          "ปรับแต่งกราฟิกและข้อความแบบอิสระ (Visual Studio)",
                          "ส่งออกไฟล์ PDF คุณภาพสูงและสไลด์นำเสนอ",
                          "รองรับการแทนที่ตัวแปรไดนามิกอัตโนมัติ",
                        ]
                      : [
                          "มาตรฐานเอกสารแนวตั้ง A4 Portrait",
                          "ระบบรองรับลายมือชื่อและตรายางประทับ",
                          "ส่งออก PDF สำหรับพิมพ์และส่งอีเมลได้ทันที",
                          "รองรับการผูกข้อมูลจากชุดข้อมูลกลาง (Data Presets)",
                        ];

                  return (
                    <div className="space-y-1.5 pt-2 border-t border-gray-200/60 text-xs">
                      <div className="font-bold text-gray-800">{t('templateSelect.features') || "Key Features"}</div>
                      <div className="space-y-1">
                        {resolvedFeatures.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-gray-600 font-normal text-[11.5px]">
                            <Check size={13} className="text-emerald-600 shrink-0 mt-0.5 stroke-[2.5]" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Bar */}
        <div className="h-16 px-6 border-t border-border bg-surface flex items-center justify-end gap-2.5 shrink-0">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center h-9 px-4 rounded-[8px] border border-border bg-surface hover:bg-muted text-foreground text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            {t('actions.cancel') || "Cancel"}
          </button>

          <button
            onClick={handleUseTemplate}
            className="primary-button inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] text-white text-xs font-medium shadow-xs hover:opacity-95 transition-all cursor-pointer"
          >
            <FileText size={14} />
            <span>{t('templates.useTemplate') || "Use Template"}</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}