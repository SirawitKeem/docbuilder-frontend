"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Save,
  Send,
  Printer,
  FileText,
  Building2,
  MapPin,
  CheckCircle2,
  Eye,
  Sparkles,
  Tag,
  Plus,
  Trash2,
} from "lucide-react";
import UniversalTemplateRenderer from "@/components/document/UniversalTemplateRenderer";
import FabricPrintRenderer from "@/components/document/FabricPrintRenderer";
import { getCanvasPreset } from "@/lib/editor/canvasPresets";
import { extractTokensFromTemplate, DEFAULT_SAMPLE_TOKEN_MAP } from "@/lib/tokens/tokenEngine";
import EmailScreen from "@/components/document/EmailScreen";
import EditorToolbar from "@/components/document/EditorToolbar";
import ReviewScreen from "@/components/document/ReviewScreen";
import { listFieldProfiles } from "@/lib/data/fieldProfiles";
import { QuotationDataProvider } from "@/context/QuotationDataContext";
import QuotationDocument from "@/components/document/quotation/QuotationDocument";
import SaveConfirmModal from "@/components/common/SaveConfirmModal";
import { DynamicContractPage } from "@/components/document/DynamicContractPage";
import { DocumentFieldsProvider } from "@/context/DocumentFieldsContext";

const WATERMARK_OPTIONS = [
  { id: "none", label: "ไม่มีลายน้ำ (ต้นฉบับ)", badge: "Original" },
  { id: "draft", label: "ฉบับร่าง (DRAFT)", badge: "Draft" },
  { id: "copy", label: "สำเนาถูกต้อง (COPY)", badge: "Copy" },
  { id: "confidential", label: "ลับเฉพาะ (CONFIDENTIAL)", badge: "Confidential" },
];

function UniversalDocumentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get("templateId") || searchParams.get("categoryId");
  const docIdParam = searchParams.get("id") || searchParams.get("documentId");

  const [activeDocId, setActiveDocId] = useState(docIdParam || null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [isSaveSuccess, setIsSaveSuccess] = useState(false);

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [documentStatus, setDocumentStatus] = useState("draft");

  // Dynamic values state
  const [values, setValues] = useState({});
  const [detectedTokens, setDetectedTokens] = useState([]);
  const [watermark, setWatermark] = useState("none");
  const [isReviewing, setIsReviewing] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [saveToast, setSaveToast] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [customTokens, setCustomTokens] = useState([]); // custom entity tokens for autofill
  // Dynamic DocTable state (Quotation / Pricing Table support)
  const [hasDocTable, setHasDocTable] = useState(false);
  const [tableItems, setTableItems] = useState([]);
  const [tableVatRate, setTableVatRate] = useState(7);


  const handleSelectProfile = (pId) => {
    setSelectedProfileId(pId);
    if (!pId) return;
    const found = profiles.find((p) => p.id === pId);
    if (found?.values) {
      setValues((prev) => {
        const next = {
          ...prev,
          // Spread all preset values first (includes custom entity token keys directly)
          ...found.values,
          // Organization data aliases (from preset if present, else keep previous)
          company_name: found.values.our_company_name || prev.company_name,
          company_name_en: found.values.our_company_name_en || prev.company_name_en,
          company_tax_id: found.values.our_tax_id || prev.company_tax_id,
          company_address: found.values.our_address || found.values.our_company_address || prev.company_address,
          company_phone: found.values.company_phone || prev.company_phone,
          // Counterparty / Customer data aliases
          customer_company: found.values.customer_company || found.values.counterparty_name || found.values.bill_to_company || found.name || prev.customer_company,
          customer_name: found.values.customer_name || found.values.counterparty_signatory_name || found.values.attn_name || found.values.contact_name || prev.customer_name,
          customer_address: found.values.customer_address || found.values.counterparty_address || found.values.address || prev.customer_address,
          customer_tax_id: found.values.customer_tax_id || found.values.counterparty_registration_number || found.values.tax_id || prev.customer_tax_id,
          attn_name: found.values.attn_name || found.values.counterparty_signatory_name || prev.attn_name,
          authorized_signatory_name: found.values.our_signatory_name || found.values.authorized_signatory_name || prev.authorized_signatory_name,
          authorized_signatory_position: found.values.our_signatory_position || found.values.authorized_signatory_position || prev.authorized_signatory_position,
        };
        // Custom entity tokens: direct key-to-key mapping (no alias needed)
        customTokens.filter((t) => t.scope === "entity").forEach((t) => {
          if (found.values[t.key] !== undefined) {
            next[t.key] = found.values[t.key];
          }
        });
        return next;
      });
    }
  };

  // Load Template Schema & Document
  useEffect(() => {
    listFieldProfiles().then((pList) => setProfiles(pList || [])).catch(() => {});
    // Load custom tokens for entity scope autofill
    fetch("/api/custom-tokens").then((r) => r.ok ? r.json() : []).then(setCustomTokens).catch(() => {});

    async function loadData() {
      try {
        setLoading(true);

        let activeTmplId = templateIdParam;
        let existingDoc = null;

        // If editing existing document, load it directly
        if (docIdParam) {
          try {
            const docRes = await fetch(`/api/documents?id=${docIdParam}`);
            if (docRes.ok) {
              existingDoc = await docRes.json();
              if (existingDoc) {
                setActiveDocId(existingDoc.id);
                if (!activeTmplId && existingDoc.templateId) {
                  activeTmplId = existingDoc.templateId;
                }
              }
            }
          } catch (e) {
            console.warn("Failed to load existing document:", e);
          }
        }

        if (!activeTmplId) {
          setErrorMsg("ไม่พบรหัสเทมเพลต (Template ID is missing)");
          setLoading(false);
          return;
        }

        // Fetch settings & organization to provide dynamic defaults
        let orgData = null;
        let sJson = null;
        try {
          const sRes = await fetch("/api/settings");
          if (sRes.ok) {
            sJson = await sRes.json();
            orgData = sJson?.organization;
          }
        } catch {
          // ignore network failure, fallback gracefully
        }

        const defaultOrgName = orgData?.name || "บริษัทของคุณ";
        const defaultOrgNameEn = orgData?.nameEn || "";
        const defaultOrgTaxId = orgData?.taxId || "";
        const defaultOrgAddress = orgData?.address || "";
        const defaultOrgPhone = orgData?.phone || "";
        const defaultOrgEmail = orgData?.email || "";
        const defaultOrgSignatory =
          orgData?.signatoryName ||
          sJson?.organizationSignatories?.find((s) => s.isDefault)?.name ||
          sJson?.account?.fullName ||
          "ผู้มีอำนาจลงนาม";
        const defaultOrgSignatoryPosition =
          orgData?.signatoryPosition ||
          sJson?.organizationSignatories?.find((s) => s.isDefault)?.position ||
          "กรรมการผู้จัดการ";

        const tmplRes = await fetch(`/api/templates/${activeTmplId}`);
        if (!tmplRes.ok) throw new Error("ไม่พบเทมเพลตนี้ในระบบ");
        const tmplData = await tmplRes.json();
        setTemplate(tmplData);

        setDocumentName(existingDoc?.name || tmplData.name || "เอกสารใหม่");

        // 1. Extract dynamic tokens from template (Fabric canvas or blocks)
        const extracted = extractTokensFromTemplate(tmplData);
        setDetectedTokens(extracted);

        // 2. Extract initial values from blocks or fields or tokens
        const initialVals = {
          company_name: defaultOrgName,
          our_company_name: defaultOrgName,
          company_name_en: defaultOrgNameEn,
          our_company_name_en: defaultOrgNameEn,
          company_tax_id: defaultOrgTaxId,
          our_tax_id: defaultOrgTaxId,
          company_address: defaultOrgAddress,
          our_address: defaultOrgAddress,
          company_phone: defaultOrgPhone,
          company_email: defaultOrgEmail,
          authorized_signatory_name: defaultOrgSignatory,
          authorized_signatory_position: defaultOrgSignatoryPosition,
          sender_name: defaultOrgSignatory,
          sender_position: defaultOrgSignatoryPosition,
          sender_email: defaultOrgEmail,
          sender_phone: defaultOrgPhone,
        };

        // Default sample values for detected tokens
        extracted.forEach((t) => {
          if (!initialVals[t.key]) {
            initialVals[t.key] = DEFAULT_SAMPLE_TOKEN_MAP[t.key] || t.example || "";
          }
        });

        if (Array.isArray(tmplData.blocks)) {
          tmplData.blocks.forEach((b) => {
            const s = b.settings || {};
            if (b.type === "header") {
              initialVals.company_name_th = s.companyName || defaultOrgName;
              initialVals.company_name_en = s.companyNameEn || defaultOrgNameEn;
              initialVals.tax_id = s.taxId || defaultOrgTaxId;
              initialVals.phone = s.phone || defaultOrgPhone;
              initialVals.logo_url = s.logoUrl || "";
            }
            if (b.type === "info_grid") {
              initialVals.doc_date = s.date || "";
              initialVals.recipient = s.recipient || s.billToCompany || "";
              initialVals.subject = s.subject || "";
            }
            if (b.type === "address_comparison") {
              initialVals.old_address_th = s.previousAddressTh || "";
              initialVals.old_address_en = s.previousAddressEn || "";
              initialVals.new_address_th = s.newAddressTh || "";
              initialVals.new_address_en = s.newAddressEn || "";
            }
            if (b.type === "signatures" && Array.isArray(s.slots) && s.slots[0]) {
              initialVals.signatory_name = s.slots[0].name || "";
              initialVals.signatory_position = s.slots[0].role || "";
            }
          });
        }

        // Default notification values fallback
        if (tmplData.id === "tmpl-notification-relocation" || tmplData.categoryId === "notification") {
          initialVals.company_name_th = initialVals.company_name_th || defaultOrgName;
          initialVals.company_name_en = initialVals.company_name_en || defaultOrgNameEn;
          initialVals.tax_id = initialVals.tax_id || defaultOrgTaxId;
          initialVals.phone = initialVals.phone || defaultOrgPhone;
          initialVals.logo_url = initialVals.logo_url || orgData?.logo || "/header_logo.png";
          initialVals.doc_date = initialVals.doc_date || "01 กันยายน 2569 / September 01, 2026";
          initialVals.recipient = initialVals.recipient || "ท่านคู่ค้าและลูกค้าผู้มีอุปการคุณ / Valued Business Partners";
          initialVals.subject = initialVals.subject || "แจ้งเปลี่ยนแปลงที่อยู่สำนักงานใหญ่ / Change of Head Office Address";
          initialVals.old_address_th = initialVals.old_address_th || "45 ซอยโกสุมรวมใจ 37 แขวงดอนเมือง เขตดอนเมือง กรุงเทพมหานคร 10210";
          initialVals.old_address_en = initialVals.old_address_en || "45 Soi Kosum Ruam Chai 37, Don Mueang, Don Mueang, Bangkok 10210, Thailand";
          initialVals.new_address_th = initialVals.new_address_th || defaultOrgAddress;
          initialVals.new_address_en = initialVals.new_address_en || "8/40 The Connect 37, Chang Akat Uthit 10 Alley, Don Mueang, Bangkok 10210";
          initialVals.signatory_name = initialVals.signatory_name || defaultOrgSignatory;
          initialVals.signatory_position = initialVals.signatory_position || defaultOrgSignatoryPosition;
        }

        // If editing existing document, restore all its fields
        if (existingDoc) {
          setDocumentName(existingDoc.name || tmplData.name);
          setDocumentStatus(existingDoc.status || "draft");
          if (existingDoc.watermark) {
            setWatermark(existingDoc.watermark);
          }
          if (existingDoc.values) {
            Object.assign(initialVals, existingDoc.values);
          }
        }

        // 3. Detect DocTable in template pages & initialize line items
        let foundDocTable = null;
        if (Array.isArray(tmplData.pages)) {
          for (const page of tmplData.pages) {
            if (!page) continue;
            const json = typeof page.json === "string" ? JSON.parse(page.json) : page.json;
            if (json && Array.isArray(json.objects)) {
              foundDocTable = json.objects.find(
                (o) => o.isDocTable || o.type === "DocTable" || o.type === "docTable"
              );
              if (foundDocTable) break;
            }
          }
        }

        const isTmplQuotation =
          tmplData.id === "quotation" ||
          tmplData.categoryId === "quotation" ||
          (tmplData.id || "").toLowerCase().includes("quotation") ||
          (tmplData.name || "").toLowerCase().includes("ใบเสนอราคา") ||
          (tmplData.name || "").toLowerCase().includes("quotation");

        if (foundDocTable || isTmplQuotation) {
          setHasDocTable(true);
          const defaultItems = (foundDocTable?.docTableData?.items && foundDocTable.docTableData.items.length > 0)
            ? foundDocTable.docTableData.items
            : [
                { no: "1", desc: "บริการพัฒนาระบบคลาวด์และโครงสร้างพื้นฐานดิจิทัล", qty: 1, price: 150000 },
                { no: "2", desc: "แพ็กเกจความปลอดภัยทางไซเบอร์ WAF & Anti-DDoS 24/7", qty: 1, price: 54000 },
                { no: "3", desc: "บริการฝึกอบรมและสนับสนุนทางเทคนิครายปี (Support SLA)", qty: 1, price: 20000 },
              ];
          const defaultVat = foundDocTable?.docTableData?.vatRate !== undefined ? Number(foundDocTable.docTableData.vatRate) : 7;

          if (existingDoc?.values?.table_items && Array.isArray(existingDoc.values.table_items) && existingDoc.values.table_items.length > 0) {
            setTableItems(existingDoc.values.table_items);
            initialVals.table_items = existingDoc.values.table_items;
          } else {
            setTableItems(defaultItems);
            initialVals.table_items = defaultItems;
          }

          if (existingDoc?.values?.table_vatRate !== undefined) {
            setTableVatRate(Number(existingDoc.values.table_vatRate));
            initialVals.table_vatRate = Number(existingDoc.values.table_vatRate);
          } else {
            setTableVatRate(defaultVat);
            initialVals.table_vatRate = defaultVat;
          }
        }

        setValues(initialVals);
      } catch (err) {
        console.error("Error loading template:", err);
        setErrorMsg(err.message || "เกิดข้อผิดพลาดในการโหลดเทมเพลต");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [templateIdParam, docIdParam]);

  const handleFieldChange = (fieldId, val) => {
    setValues((prev) => ({ ...prev, [fieldId]: val }));
  };

  const handleTableItemChange = (index, field, val) => {
    setTableItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      setValues((v) => ({ ...v, table_items: next }));
      return next;
    });
  };

  const handleAddTableItem = () => {
    setTableItems((prev) => {
      const nextNo = String(prev.length + 1);
      const next = [
        ...prev,
        {
          no: nextNo,
          desc: `รายการสินค้าลำดับที่ ${nextNo}`,
          qty: 1,
          price: 10000,
        },
      ];
      setValues((v) => ({ ...v, table_items: next }));
      return next;
    });
  };

  const handleRemoveTableItem = (index) => {
    if (tableItems.length <= 1) return;
    setTableItems((prev) => {
      const next = prev
        .filter((_, i) => i !== index)
        .map((it, idx) => ({ ...it, no: String(idx + 1) }));
      setValues((v) => ({ ...v, table_items: next }));
      return next;
    });
  };

  const handleVatRateChange = (rate) => {
    setTableVatRate(rate);
    setValues((v) => ({ ...v, table_vatRate: rate }));
  };

  const tableSubtotal = (tableItems || []).reduce(
    (acc, it) => acc + (Number(it.qty) || 1) * (Number(it.price) || 0),
    0
  );
  const tableVatAmount = tableSubtotal * ((Number(tableVatRate) || 0) / 100);
  const tableGrandTotal = tableSubtotal + tableVatAmount;

  const isNotification = (
    template?.id === "tmpl-notification-relocation" ||
    template?.categoryId === "notification" ||
    (template?.name || "").includes("เปลี่ยนแปลงที่ตั้ง")
  );

  const isQuotation =
    template?.id === "quotation" ||
    template?.categoryId === "quotation" ||
    (template?.id || "").toLowerCase().includes("quotation") ||
    (template?.name || "").toLowerCase().includes("ใบเสนอราคา") ||
    (template?.name || "").toLowerCase().includes("quotation");

  const quotationData = React.useMemo(() => {
    return {
      id: activeDocId || "doc-custom",
      quotationNo: values.quotation_no || values.doc_no || "QT-202609-0001",
      revision: values.revision || "01",
      quotationDate: values.date || values.quotation_date || new Date().toISOString().split("T")[0],
      priceValidity: values.validity || values.price_validity || "30 วัน",
      deliveryTerm: values.delivery_term || "7 วัน",
      creditTerm: values.credit_term || "30 วัน",
      billTo: {
        companyName: values.customer_company || values.company_name || values.recipient || "บริษัท ตัวอย่าง จำกัด",
        attn: values.attn_name || values.customer_name || values.contact_person || "-",
        endUser: values.end_user || "-",
        subject: values.subject || "ใบเสนอราคาโครงการและบริการ",
        am: values.am_name || "Account Manager",
      },
      lineItems: (tableItems && tableItems.length > 0)
        ? tableItems.map((it, idx) => ({
            id: `item-${idx}`,
            code: it.no || String(idx + 1),
            title: it.desc || it.title || "รายการสินค้า / บริการ",
            qty: Number(it.qty) || 1,
            unitPrice: Number(it.price) || 0,
            unit: "งาน",
            groups: [],
          }))
        : [
            {
              id: "item-1",
              code: "01",
              title: "บริการพัฒนาระบบคลาวด์และโครงสร้างพื้นฐานดิจิทัล",
              qty: 1,
              unitPrice: 150000,
              unit: "โครงการ",
              groups: [],
            },
          ],
      vatRate: tableVatRate ?? 7,
      specialDiscount: Number(values.discount || values.special_discount || 0),
      remarks: values.remarks || "",
      remarksList: [
        "Payment: Annually",
        "กำหนดยืนราคา 30 วันนับจากวันที่ออกใบเสนอราคา",
        "ราคานี้ยังไม่รวมภาษีมูลค่าเพิ่ม 7% (VAT Excluded)",
      ],
      senderName: values.authorized_signatory_name || values.sender_name || values.our_signatory_name || "ผู้มีอำนาจลงนาม",
      senderPosition: values.authorized_signatory_position || values.sender_position || values.our_signatory_position || "กรรมการผู้จัดการ",
      senderEmail: values.sender_email || values.company_email || values.our_company_email || "",
      senderPhone: values.sender_phone || values.company_phone || values.our_company_phone || "",
    };
  }, [values, tableItems, tableVatRate, activeDocId]);

  const isFabricTemplate = Boolean(
    template?.pages &&
    Array.isArray(template.pages) &&
    template.pages.length > 0 &&
    template.pages[0]?.json
  );

  const currentPreset = getCanvasPreset(
    template?.canvasPreset || (template?.editorType === "slide" ? "slide-16-9" : "a4-portrait")
  );
  const isSquare = currentPreset.width === currentPreset.height;
  const isSlide = template?.editorType === "slide" || currentPreset.id === "slide-16-9";
  const previewScale = isFabricTemplate && currentPreset.width > 800
    ? Math.min(1, 740 / currentPreset.width)
    : 1;

  // เปิด Pop-Up Modal ยืนยันการบันทึก
  const handleOpenSaveModal = () => {
    setIsSaveSuccess(false);
    setSaveModalOpen(true);
  };

  // ดำเนินการบันทึกลง JSON API
  const handleConfirmSave = async (status = "draft") => {
    try {
      setIsSaving(true);
      const payload = {
        name: documentName || template?.name || "เอกสารไม่มีชื่อ",
        templateId: template?.id,
        categoryId: template?.categoryId,
        data: values,
        values: values,
        tableItems: tableItems,
        tableVatRate: tableVatRate,
        status: status,
        updatedAt: new Date().toISOString(),
      };

      let res;
      if (activeDocId && activeDocId !== "preview") {
        res = await fetch(`/api/documents/${activeDocId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        throw new Error("เกิดข้อผิดพลาดในการบันทึกเอกสาร");
      }

      const savedData = await res.json();
      if (savedData?.id && !activeDocId) {
        setActiveDocId(savedData.id);
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("id", savedData.id);
        window.history.replaceState({}, "", newUrl.toString());
      }

      setDocumentStatus(status);
      setIsSaveSuccess(true);
      setSaveToast("บันทึกเอกสารสำเร็จเรียบร้อยแล้ว!");
      setTimeout(() => setSaveToast(""), 3000);
    } catch (err) {
      console.error("Save error:", err);
      alert(err.message || "ไม่สามารถบันทึกเอกสารได้");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportAction = async (format = "pdf") => {
    if (format === "print") {
      window.print();
      return;
    }
    try {
      setIsExporting(true);
      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template?.id || templateIdParam,
          values: values || {},
          quotationData: values || {},
          fileName: documentName || template?.name || "document",
          format,
          canvasPreset: template?.canvasPreset || currentPreset?.id,
          width: currentPreset?.width,
          height: currentPreset?.height,
          mmWidth: currentPreset?.mmWidth,
          mmHeight: currentPreset?.mmHeight,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `ไม่สามารถส่งออก ${format.toUpperCase()} ได้`);
      }

      const blob = await res.blob();
      const baseName = (documentName || template?.name || "document").replace(/\.(pdf|html|webp|png)$/i, "");
      const downloadFileName = `${baseName}.${format}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadFileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      alert(err.message || "เกิดข้อผิดพลาดในการส่งออกไฟล์");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-3">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground font-medium">กำลังเตรียมเอกสารและโหลดข้อมูล...</p>
      </div>
    );
  }

  if (errorMsg || !template) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
        <h2 className="text-sm font-bold text-red-700">ไม่สามารถเปิดเอกสารได้</h2>
        <p className="text-xs text-red-500">{errorMsg || "ไม่พบเทมเพลต"}</p>
        <Link
          href="/templates"
          className="inline-block px-4 py-2 bg-white text-gray-700 text-xs font-bold rounded-xl border border-gray-200 shadow-xs hover:bg-gray-50"
        >
          กลับไปคลังเทมเพลต
        </Link>
      </div>
    );
  }

  // Calculate completion status based on detected tokens and table items
  const totalFields = detectedTokens.length || (hasDocTable ? 3 : 1);
  const filledFields = detectedTokens.length > 0
    ? detectedTokens.filter((t) => Boolean(values[t.key] && String(values[t.key]).trim())).length
    : (hasDocTable && tableItems.length > 0 ? totalFields : 1);
  const isDocumentComplete = totalFields > 0 ? filledFields >= totalFields : true;
  const statusObj = {
    isComplete: isDocumentComplete,
    filled: filledFields,
    total: totalFields,
  };

  const renderDocumentPage = () => {
    const pageContent = (
      <div className="origin-top shadow-xl border border-gray-300 rounded-sm overflow-hidden bg-white print-paper-shadow">
        {isFabricTemplate ? (
          <FabricPrintRenderer
            template={template}
            values={values}
            watermark={watermark}
          />
        ) : isNotification ? (
          <DocumentFieldsProvider initialValues={values} defaultReadOnly={true}>
            <div style={{ width: 794, minHeight: 1123 }} className="bg-white overflow-hidden text-left font-noto-looped">
              <DynamicContractPage templateId="notification" pageNumber={1} />
            </div>
          </DocumentFieldsProvider>
        ) : isQuotation ? (
          <QuotationDataProvider initialQuotation={quotationData} defaultReadOnly={true}>
            <div style={{ width: 794, minHeight: 1123 }} className="bg-white overflow-hidden text-left font-noto-looped">
              <QuotationDocument currentPage={1} />
            </div>
          </QuotationDataProvider>
        ) : (
          <UniversalTemplateRenderer template={template} scale={1} />
        )}
      </div>
    );

    const pageCount = (template?.pages && Array.isArray(template.pages) && template.pages.length > 0)
      ? template.pages.length
      : 1;

    if (previewScale < 1) {
      return (
        <div
          className="print-scale-wrapper transition-all"
          style={{
            width: `${Math.round(currentPreset.width * previewScale)}px`,
            height: `${Math.round(currentPreset.height * pageCount * previewScale)}px`,
            overflow: "hidden",
          }}
        >
          <div
            className="print-scale-inner origin-top-left"
            style={{
              width: `${currentPreset.width}px`,
              height: `${currentPreset.height * pageCount}px`,
              transform: `scale(${previewScale})`,
              transformOrigin: "top left",
            }}
          >
            {pageContent}
          </div>
        </div>
      );
    }

    return pageContent;
  };

  if (isReviewing) {
    return (
      <>
        <ReviewScreen
          template={{
            fullName: documentName || template?.name || "เอกสารกำหนดเอง",
            name: documentName || template?.name,
            isCustomDoc: true,
          }}
          docName={documentName || template?.name}
          customRender={true}
          pages={[renderDocumentPage]}
          status={statusObj}
          onExport={handleExportAction}
          exporting={isExporting}
          onSendEmail={() => setIsEmailModalOpen(true)}
          onBackToEdit={() => setIsReviewing(false)}
        />

        {/* Email Modal */}
        {isEmailModalOpen && (
          <EmailScreen
            documentId={documentId || template?.id}
            defaultSubject={documentName || template?.name || "เอกสารทางการ"}
            fileName={`${documentName || "document"}.pdf`}
            templateId={template?.id}
            templateName={documentName || template?.name}
            values={values}
            onBack={() => setIsEmailModalOpen(false)}
            onSent={() => {
              setIsEmailModalOpen(false);
              setSaveToast("ส่งอีเมลเรียบร้อยแล้ว!");
              setTimeout(() => setSaveToast(""), 3000);
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen relative text-left">
      {/* Save Success Toast */}
      {saveToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={16} />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Unified Editor Toolbar */}
      <EditorToolbar
        template={{
          fullName: template.name || "เอกสารกำหนดเอง",
        }}
        docName={documentName}
        onDocNameChange={setDocumentName}
        status={statusObj}
        onPreview={() => setIsReviewing(true)}
        onExport={handleExportAction}
        exporting={isExporting}
        onSave={handleOpenSaveModal}
        isSaving={isSaving}
        isFormOpen={isFormOpen}
        onToggleForm={() => setIsFormOpen((prev) => !prev)}
      />

      {/* 2-Column Split Workspace */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left Column: Editable Form Fields (Sidebar) */}
        {isFormOpen && (
          <aside className="w-[360px] xl:w-[400px] bg-surface border-r border-border flex flex-col h-full shrink-0 shadow-2xs z-20 select-none overflow-y-auto p-4 space-y-4 text-left scrollbar-thin">
            <div className="p-3.5 rounded-[10px] border border-border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center font-bold text-xs">
                    <FileText size={15} />
                  </div>
                  <h2 className="text-sm font-bold text-foreground">กรอกและปรับแต่งข้อมูล</h2>
                </div>
                <span className="text-[10px] font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                  Live Sync ⚡
                </span>
              </div>



              {/* Data Preset Selector */}
              {profiles.length > 0 && (
                <div className="space-y-1 pt-1 border-t border-border/60">
                  <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <Sparkles size={12} className="text-primary" />
                    <span>ดึงข้อมูลจากชุดข้อมูล (Data Preset)</span>
                  </label>
                  <select
                    value={selectedProfileId}
                    onChange={(e) => handleSelectProfile(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-[8px] border border-border bg-surface text-xs text-foreground outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">-- ไม่ใช้ชุดข้อมูล (กำหนดเอง) --</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* If Notification Document */}
            {isNotification ? (
              <div className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">วันที่ออกเอกสาร (Date)</label>
                  <input
                    type="text"
                    value={values.doc_date || ""}
                    onChange={(e) => handleFieldChange("doc_date", e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">เรียน / ผู้รับ (To / Recipient)</label>
                  <input
                    type="text"
                    value={values.recipient || ""}
                    onChange={(e) => handleFieldChange("recipient", e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">เรื่อง (Subject)</label>
                  <input
                    type="text"
                    value={values.subject || ""}
                    onChange={(e) => handleFieldChange("subject", e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div className="pt-2 border-t border-gray-100 space-y-1">
                  <label className="font-bold text-gray-700 flex items-center gap-1.5">
                    <Building2 size={13} className="text-gray-400" />
                    <span>ที่อยู่เดิม (Previous Address)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={values.old_address_th || ""}
                    onChange={(e) => handleFieldChange("old_address_th", e.target.value)}
                    placeholder="ที่อยู่เดิม (ภาษาไทย)..."
                    className="w-full p-2.5 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-[#7C3AED]"
                  />
                  <textarea
                    rows={2}
                    value={values.old_address_en || ""}
                    onChange={(e) => handleFieldChange("old_address_en", e.target.value)}
                    placeholder="Previous Address (English)..."
                    className="w-full p-2.5 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div className="pt-2 border-t border-gray-100 space-y-1">
                  <label className="font-bold text-[#af0e0e] flex items-center gap-1.5">
                    <MapPin size={13} />
                    <span>ที่อยู่ใหม่ (New Address - มีผล 16 ก.ย. 2569)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={values.new_address_th || ""}
                    onChange={(e) => handleFieldChange("new_address_th", e.target.value)}
                    placeholder="ที่อยู่ใหม่ (ภาษาไทย)..."
                    className="w-full p-2.5 rounded-lg border border-red-200 bg-red-50/20 text-xs outline-none focus:border-red-500"
                  />
                  <textarea
                    rows={2}
                    value={values.new_address_en || ""}
                    onChange={(e) => handleFieldChange("new_address_en", e.target.value)}
                    placeholder="New Address (English)..."
                    className="w-full p-2.5 rounded-lg border border-red-200 bg-red-50/20 text-xs outline-none focus:border-red-500"
                  />
                </div>

                <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">ชื่อผู้ลงนาม</label>
                    <input
                      type="text"
                      value={values.signatory_name || ""}
                      onChange={(e) => handleFieldChange("signatory_name", e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-[#7C3AED]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">ตำแหน่ง</label>
                    <input
                      type="text"
                      value={values.signatory_position || ""}
                      onChange={(e) => handleFieldChange("signatory_position", e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-[#7C3AED]"
                    />
                  </div>
                </div>
              </div>
            ) : isFabricTemplate ? (
              /* Fabric Studio Dynamic Form */
              <div className="space-y-4">
                {/* 1. Dynamic Table Items if template has DocTable */}
                {hasDocTable && (
                  <div className="space-y-3 p-3.5 rounded-[10px] border border-border bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                        <Tag size={14} className="text-primary" />
                        <span>รายการสินค้า / บริการในตาราง</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddTableItem}
                        className="text-[11px] font-medium text-primary hover:underline cursor-pointer inline-flex items-center gap-0.5"
                      >
                        <Plus size={11} />
                        <span>เพิ่มรายการ</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {tableItems.map((item, idx) => {
                        const amount = (Number(item.qty) || 1) * (Number(item.price) || 0);
                        return (
                          <div
                            key={idx}
                            className="p-3 rounded-[8px] bg-surface border border-border/80 shadow-2xs space-y-2 relative group"
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] bg-muted text-muted-foreground font-mono">
                                #{idx + 1}
                              </span>
                              {tableItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTableItem(idx)}
                                  className="p-1 rounded-[6px] text-muted-foreground/60 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer ml-auto"
                                  title="ลบรายการนี้"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>

                            <input
                              type="text"
                              value={item.desc || item.title || ""}
                              onChange={(e) => handleTableItemChange(idx, "desc", e.target.value)}
                              placeholder="ชื่อรายการสินค้าหรือบริการ..."
                              className="w-full h-8 px-2.5 text-xs font-medium rounded-[6px] border border-border bg-surface text-foreground outline-none focus:border-primary"
                            />

                            <div className="grid grid-cols-2 gap-2 pt-0.5">
                              <div className="space-y-0.5">
                                <label className="text-[10px] text-muted-foreground">จำนวน (Qty)</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.qty ?? 1}
                                  onChange={(e) => handleTableItemChange(idx, "qty", Number(e.target.value) || 1)}
                                  className="w-full h-7 px-2 text-xs text-center rounded-[6px] border border-border bg-surface text-foreground outline-none focus:border-primary tabular-nums"
                                />
                              </div>
                              <div className="space-y-0.5">
                                <label className="text-[10px] text-muted-foreground">ราคาต่อหน่วย (THB)</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={item.price ?? 0}
                                  onChange={(e) => handleTableItemChange(idx, "price", Number(e.target.value) || 0)}
                                  className="w-full h-7 px-2 text-xs text-right rounded-[6px] border border-border bg-surface text-foreground outline-none focus:border-primary tabular-nums"
                                />
                              </div>
                            </div>

                            <div className="pt-1.5 border-t border-border/60 flex items-center justify-between text-[11px]">
                              <span className="text-muted-foreground">จำนวนเงิน:</span>
                              <span className="font-semibold font-mono text-foreground">
                                {amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Price Summary */}
                    <div className="p-3 rounded-[8px] bg-surface border border-border/80 space-y-1.5 text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>รวมเป็นเงิน (Subtotal):</span>
                        <span className="font-mono text-foreground">
                          {tableSubtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <span>ภาษีมูลค่าเพิ่ม:</span>
                          <select
                            value={tableVatRate}
                            onChange={(e) => handleVatRateChange(Number(e.target.value))}
                            className="h-6 px-1 text-[11px] rounded border border-border bg-surface text-foreground cursor-pointer"
                          >
                            <option value={7}>7%</option>
                            <option value={0}>0% (ยกเว้น)</option>
                          </select>
                        </div>
                        <span className="font-mono text-foreground">
                          {tableVatAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                        </span>
                      </div>
                      <div className="pt-1.5 border-t border-border flex justify-between font-bold text-foreground">
                        <span>จำนวนเงินรวมทั้งสิ้น:</span>
                        <span className="font-mono text-primary text-sm">
                          {tableGrandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Dynamic Variables */}
                {detectedTokens.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-200/60">
                      <span className="font-semibold">ตัวแปรไดนามิกที่ตรวจพบในเทมเพลต</span>
                      <span className="font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#7C3AED]">
                        {detectedTokens.length} ตัวแปร
                      </span>
                    </div>

                    {Object.entries(
                      detectedTokens.reduce((acc, t) => {
                        const cat = t.category || "ข้อมูลทั่วไป (General)";
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(t);
                        return acc;
                      }, {})
                    ).map(([category, tokens]) => (
                      <div key={category} className="space-y-3 pt-2 first:pt-0">
                        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                          <span>{category}</span>
                        </div>
                        {tokens.map((t) => (
                          <div key={t.key} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="font-bold text-gray-700 text-xs">
                                {t.label}
                              </label>
                              <span className="text-[10px] font-mono text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                                {t.rawKey}
                              </span>
                            </div>
                            {t.key.endsWith("_text") || (values[t.key] && values[t.key].length > 40) ? (
                              <textarea
                                rows={3}
                                value={values[t.key] ?? ""}
                                onChange={(e) => handleFieldChange(t.key, e.target.value)}
                                placeholder={t.example || `ระบุ ${t.label}...`}
                                className="w-full p-2.5 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-[#7C3AED] transition-colors resize-y leading-relaxed"
                              />
                            ) : (
                              <input
                                type="text"
                                value={values[t.key] ?? ""}
                                onChange={(e) => handleFieldChange(t.key, e.target.value)}
                                placeholder={t.example || `ระบุ ${t.label}...`}
                                className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-[#7C3AED] transition-colors"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {!hasDocTable && detectedTokens.length === 0 && (
                  <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-purple-900">
                      <CheckCircle2 size={16} className="text-purple-600" />
                      <span>เทมเพลตพร้อมใช้งาน (Static Design)</span>
                    </div>
                    <p className="text-purple-700 leading-relaxed">
                      เทมเพลตนี้ไม่มีตัวแปรแบบไดนามิก (เช่น <code className="bg-purple-100 px-1 py-0.5 rounded text-[11px] font-mono">{"{{company_name}}"}</code>) คุณสามารถพิมพ์หรือส่งออกเอกสารได้ทันที
                    </p>
                    <Link
                      href={`/templates/new?edit=${template.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] hover:underline pt-1"
                    >
                      <span>แก้ไขเลย์เอาต์ใน Studio</span>
                      <span>→</span>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              /* Generic Block Form */
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  เทมเพลตนี้ประกอบด้วยโครงสร้างบล็อกอัตโนมัติ ข้อมูลจะถูกจัดระเบียบตาม Layout มาตรฐาน
                </p>
                {(template.blocks || []).map((b, idx) => (
                  <div key={b.id || idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 space-y-1">
                    <p className="text-xs font-bold text-gray-800">{b.title || b.type}</p>
                    {b.settings?.content && (
                      <textarea
                        rows={3}
                        defaultValue={b.settings.content}
                        onChange={(e) => {
                          b.settings.content = e.target.value;
                          setValues({ ...values, [`block_${b.id}`]: e.target.value });
                        }}
                        className="w-full p-2 bg-white rounded-lg border border-gray-200 text-xs"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Watermark Selector */}
            <div className="pt-4 border-t border-border space-y-1">
              <label className="text-xs font-semibold text-foreground">ลายน้ำเอกสาร (PDF Watermark)</label>
              <select
                value={watermark}
                onChange={(e) => setWatermark(e.target.value)}
                className="w-full h-9 px-2.5 rounded-[8px] border border-border bg-surface text-xs text-foreground outline-none focus:border-primary"
              >
                {WATERMARK_OPTIONS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
          </aside>
        )}

        {/* Right Column: Live Document Output */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-muted/30 p-4 sm:p-6 flex flex-col items-center">
          <div className="w-full max-w-[850px] flex flex-col items-center space-y-3">
            <div className="w-full flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Eye size={15} className="text-primary" />
                <span className="text-xs font-bold text-foreground">
                  {isSquare
                    ? "พรีวิวสี่เหลี่ยมจัตุรัส (Square Preview)"
                    : isSlide
                    ? "พรีวิวกระดาษสไลด์ 16:9 เสมือนจริง (Slide Preview)"
                    : "พรีวิวกระดาษ A4 เสมือนจริง (Print Preview)"}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground">
                {currentPreset.mmWidth && currentPreset.mmHeight
                  ? `ขนาด ${currentPreset.mmWidth} x ${currentPreset.mmHeight} mm`
                  : `ขนาด ${currentPreset.width} x ${currentPreset.height} px`}
              </span>
            </div>

            {/* Document Output Container */}
            <div className="w-full flex justify-center overflow-x-auto print-container-wrapper">
              {renderDocumentPage()}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          aside, nav, header, [data-sidebar], .no-print, .lg\\:col-span-5, button, input {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
          }
          .grid {
            display: block !important;
          }
          .lg\\:col-span-7 {
            width: 100% !important;
          }
          .print-scale-wrapper {
            width: auto !important;
            height: auto !important;
            overflow: visible !important;
          }
          .print-scale-inner {
            width: auto !important;
            height: auto !important;
            transform: none !important;
          }
          .print-container-wrapper {
            padding: 0 !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
          }
          .print-paper-shadow {
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* Email Modal */}
      {isEmailModalOpen && (
        <EmailScreen
          document={{
            id: activeDocId || "preview",
            name: documentName,
            status: documentStatus,
          }}
          onClose={() => setIsEmailModalOpen(false)}
        />
      )}

      {/* Pop-Up Modal บันทึกเอกสาร (สไตล์เดียวกับ Delete Confirm) */}
      <SaveConfirmModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onConfirm={() => handleConfirmSave("draft")}
        isLoading={isSaving}
        isSuccess={isSaveSuccess}
        title="บันทึกเอกสาร?"
        description={`คุณต้องการบันทึกการเปลี่ยนแปลงของเอกสาร "${documentName || template?.name || "เอกสาร"}" ลงในระบบใช่หรือไม่?`}
        confirmText="บันทึกเอกสาร"
        cancelText="ยกเลิก"
        successTitle="บันทึกเอกสารสำเร็จเรียบร้อยแล้ว!"
        successDescription={`ข้อมูลเอกสาร "${documentName || template?.name || ""}" ถูกบันทึกลงในระบบเรียบร้อยแล้ว`}
        secondarySuccessButtonText="แก้ไขต่อ"
        onSecondarySuccessClick={() => setSaveModalOpen(false)}
        successButtonText="ดูเอกสารทั้งหมด"
        onSuccessClose={() => router.push("/documents")}
      />
    </div>
  );
}

export default function UniversalDocumentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <UniversalDocumentContent />
    </Suspense>
  );
}
