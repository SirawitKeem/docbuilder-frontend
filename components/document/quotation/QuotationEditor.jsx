"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { QuotationDataProvider, useQuotationData } from "@/context/QuotationDataContext";
import { quotationTemplate } from "@/lib/templates/quotation/schema";
import { getQuotation, createQuotation, updateQuotation, createQuotationRevision } from "@/lib/data/quotations";
import { getFieldProfile } from "@/lib/data/fieldProfiles";
import { paginateQuotationLineItems, createEmptyLineItem, validateQuotation } from "@/lib/quotationHelpers";
import QuotationDocument from "./QuotationDocument";
import QuotationFormSidebar from "./QuotationFormSidebar";
import EditorToolbar from "../EditorToolbar";
import PageControls from "../PageControls";
import ReviewScreen from "../ReviewScreen";
import EmailScreen from "../EmailScreen";
import SuccessScreen from "../SuccessScreen";
import SaveConfirmModal from "@/components/common/SaveConfirmModal";

function fileNameFor(quotationNo) {
  return `${quotationNo || "Quotation"}.pdf`;
}

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function QuotationEditorContent({ docId }) {
  const router = useRouter();
  const { quotation, setQuotation, readOnly, setReadOnly } = useQuotationData();

  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [mode, setMode] = useState("edit"); // edit | review | email | success
  const [pdfBase64, setPdfBase64] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [activeDocId, setActiveDocId] = useState(docId || null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingRevision, setIsCreatingRevision] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [isSaveSuccess, setIsSaveSuccess] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(true);
  const scrollContainerRef = useRef(null);
  const pageRefs = useRef([]);

  const fileName = fileNameFor(quotation.quotationNo);
  const pageCount = paginateQuotationLineItems(quotation.lineItems).length;
  const validation = validateQuotation(quotation);

  // Scroll to specific page index in the canvas
  const scrollToPage = (pageIndex) => {
    const el = pageRefs.current[pageIndex];
    if (el && scrollContainerRef.current) {
      const containerTop = scrollContainerRef.current.getBoundingClientRect().top;
      const elTop = el.getBoundingClientRect().top;
      const offset = elTop - containerTop + scrollContainerRef.current.scrollTop - 32;
      scrollContainerRef.current.scrollTo({ top: offset, behavior: "smooth" });
    }
  };

  const handleCreateRevision = async () => {
    if (!activeDocId) return;
    setIsCreatingRevision(true);
    try {
      const newRev = await createQuotationRevision(activeDocId);
      router.push(`/create/quotation?id=${newRev.id}`);
    } catch (err) {
      console.error("Create revision error:", err);
      alert("เกิดข้อผิดพลาดในการสร้างฉบับปรับปรุง");
    } finally {
      setIsCreatingRevision(false);
    }
  };

  // เปิด Pop-Up Modal ยืนยันการบันทึก
  const handleOpenSaveModal = () => {
    setIsSaveSuccess(false);
    setSaveModalOpen(true);
  };

  // ดำเนินการบันทึกลงฐานข้อมูลจริง
  const handleConfirmSaveDocument = async () => {
    setIsSaving(true);
    try {
      let result;
      if (activeDocId) {
        result = await updateQuotation(activeDocId, quotation);
      } else {
        result = await createQuotation(quotation);
        if (result?.id) {
          setActiveDocId(result.id);
          setQuotation((prev) => ({ ...prev, id: result.id, quotationNo: result.quotationNo, revision: result.revision || "01" }));
        }
      }
      const timeStr = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) + " น.";
      setSavedAt(timeStr);
      setIsSaveSuccess(true);
    } catch (err) {
      console.error("Save document error:", err);
      alert("เกิดข้อผิดพลาดในการบันทึกเอกสาร");
      setSaveModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const generateExport = async (format = "pdf") => {
    setGenerating(true);
    try {
      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: "quotation",
          quotationData: quotation,
          fileName,
          format,
        }),
      });

      if (!res.ok) throw new Error(`สร้าง ${format.toUpperCase()} ไม่สำเร็จ`);
      const blob = await res.blob();
      const base64 = await blobToBase64(blob);
      if (format === "pdf") {
        setPdfBase64(base64);
      }
      return { blob, base64 };
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (format = "pdf") => {
    if (!validation.isValid) {
      setShowToast({ type: "error", message: `กรุณากรอกข้อมูลให้ครบถ้วน: ${validation.errors.join(", ")}` });
      setTimeout(() => setShowToast(null), 4000);
      return;
    }

    const baseName = (fileName || `QUOTATION-${quotation.quotationNo || "document"}`).replace(/\.(pdf|html|webp)$/i, "");
    const downloadFileName = `${baseName}.${format}`;

    let blob;
    if (format === "pdf" && pdfBase64) {
      blob = await (await fetch(`data:application/pdf;base64,${pdfBase64}`)).blob();
    } else {
      const result = await generateExport(format);
      blob = result.blob;
    }

    const typeConfigs = {
      pdf: {
        description: "PDF Document (.pdf)",
        accept: { "application/pdf": [".pdf"] },
      },
      html: {
        description: "HTML Document (.html)",
        accept: { "text/html": [".html"] },
      },
      webp: {
        description: "WebP Image (.webp)",
        accept: { "image/webp": [".webp"] },
      },
      png: {
        description: "PNG Image (.png)",
        accept: { "image/png": [".png"] },
      },
    };

    if ("showSaveFilePicker" in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: downloadFileName,
          types: [typeConfigs[format] || typeConfigs.pdf],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadFileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGoToEmail = async () => {
    if (!validation.isValid) {
      setShowToast({ type: "error", message: `กรุณากรอกข้อมูลให้ครบถ้วน: ${validation.errors.join(", ")}` });
      setTimeout(() => setShowToast(null), 4000);
      return;
    }
    if (!pdfBase64) await generateExport("pdf");
    setMode("email");
  };

  if (mode === "success") {
    return <SuccessScreen fileName={fileName} sentTo={sentTo} onCreateNew={() => router.push("/create")} />;
  }

  if (mode === "email") {
    return (
      <EmailScreen
        defaultSubject={`ใบเสนอราคา ${quotation.quotationNo || "Quotation"}`}
        fileName={fileName}
        attachmentBase64={pdfBase64}
        templateId="quotation"
        templateName={quotationTemplate.fullName || "ใบเสนอราคามาตรฐาน"}
        values={quotation}
        onBack={() => setMode("edit")}
        onSent={({ to }) => {
          setSentTo(to);
          setMode("success");
        }}
      />
    );
  }

  if (readOnly) {
    return (
      <ReviewScreen
        template={{
          fullName: quotationTemplate.fullName || "ใบเสนอราคามาตรฐาน",
          name: quotationTemplate.name || "Quotation",
          logo: quotationTemplate.logo,
          pageCount: pageCount,
          isCustomDoc: true,
        }}
        docName={quotation.name || `ใบเสนอราคา ${quotation.quotationNo || ""}`}
        // eslint-disable-next-line react/display-name
        pages={Array.from({ length: pageCount }, (_, i) => () => <QuotationDocument currentPage={i + 1} />)}
        status={{
          isComplete: validation.isValid,
          filled: validation.isValid ? 1 : 0,
          total: 1,
          errors: validation.errors,
        }}
        onExport={handleDownload}
        onSendEmail={handleGoToEmail}
        exporting={generating}
        onBackToEdit={() => setReadOnly(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen relative">
      {/* Editor Toolbar */}
      <EditorToolbar
        template={{
          fullName: `ใบเสนอราคา ${quotation.quotationNo || ""}${quotation.revision ? ` (Rev. ${quotation.revision})` : ""}`,
        }}
        docName={quotation.name || `ใบเสนอราคา ${quotation.quotationNo || ""}`}
        onDocNameChange={(newName) => {
          setQuotation((prev) => ({ ...prev, name: newName }));
        }}
        status={{
          isComplete: validation.isValid,
          filled: validation.isValid ? 1 : 0,
          total: 1,
        }}
        onPreview={() => setReadOnly(true)}
        onExport={handleDownload}
        exporting={generating}
        onSave={handleOpenSaveModal}
        isSaving={isSaving}
        savedAt={savedAt}
        onCreateRevision={activeDocId ? handleCreateRevision : undefined}
        isCreatingRevision={isCreatingRevision}
        isFormOpen={isFormOpen}
        onToggleForm={() => setIsFormOpen((prev) => !prev)}
      />

      {/* 2-Column Split Workspace: Left Form Sidebar + Right Live A4 Canvas */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <QuotationFormSidebar isOpen={isFormOpen} />

        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto bg-gray-100/90"
        >
          <div className="flex flex-col items-center py-8 pb-36 gap-8">
            {Array.from({ length: pageCount }, (_, i) => (
              <div
                key={i}
                ref={(el) => { pageRefs.current[i] = el; }}
                style={{ zoom: zoom / 100 }}
              >
                <QuotationDocument currentPage={i + 1} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Page Controls Footer */}
      <PageControls
        currentPage={currentPage}
        totalPages={pageCount}
        zoom={zoom}
        onPrevPage={() => {
          const prev = Math.max(1, currentPage - 1);
          setCurrentPage(prev);
          scrollToPage(prev - 1);
        }}
        onNextPage={() => {
          const next = Math.min(pageCount, currentPage + 1);
          setCurrentPage(next);
          scrollToPage(next - 1);
        }}
        onZoomOut={() => setZoom((z) => Math.max(50, z - 10))}
        onZoomIn={() => setZoom((z) => Math.min(150, z + 10))}
        onFullscreen={() => {}}
      />

      {/* Pop-Up Modal บันทึกใบเสนอราคา (สไตล์เดียวกับ Delete Confirm) */}
      <SaveConfirmModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onConfirm={handleConfirmSaveDocument}
        isLoading={isSaving}
        isSuccess={isSaveSuccess}
        title="บันทึกใบเสนอราคา?"
        description={`คุณต้องการบันทึกการเปลี่ยนแปลงของใบเสนอราคา "${quotation.name || quotation.quotationNo || "เอกสาร"}" ลงในระบบใช่หรือไม่?`}
        confirmText="บันทึกใบเสนอราคา"
        cancelText="ยกเลิก"
        successTitle="บันทึกใบเสนอราคาสำเร็จเรียบร้อยแล้ว!"
        successDescription={`ข้อมูลใบเสนอราคา "${quotation.quotationNo || ""}" ถูกบันทึกลงในระบบเรียบร้อยแล้ว`}
        secondarySuccessButtonText="แก้ไขต่อ"
        onSecondarySuccessClick={() => setSaveModalOpen(false)}
        successButtonText="ดูเอกสารทั้งหมด"
        onSuccessClose={() => router.push("/documents")}
      />
    </div>
  );
}

export default function QuotationEditor({ docId, profileId }) {
  const [initialQuotation, setInitialQuotation] = useState(null);

  useEffect(() => {
    async function initData() {
      if (docId) {
        const existing = await getQuotation(docId);
        if (existing) {
          setInitialQuotation({
            ...existing,
            billTo: existing.billTo || {},
            lineItems: existing.lineItems?.length > 0 ? existing.lineItems : [createEmptyLineItem()],
            remarksList: Array.isArray(existing.remarksList)
              ? existing.remarksList
              : (existing.remarks ? [existing.remarks] : ["Payment: Annually"]),
            specialDiscount: existing.specialDiscount || 0,
            senderPosition: existing.senderPosition || "",
            senderEmail: existing.senderEmail || "",
          });
          return;
        }
      }

      // Fetch next available Quotation No. from server
      let quotationNo = "";
      try {
        const res = await fetch("/api/quotations/next-no");
        if (res.ok) {
          const data = await res.json();
          quotationNo = data.quotationNo || "";
        }
      } catch {
        quotationNo = "";
      }

      let prefilledBillTo = {};
      let senderPhone = "";

      if (profileId) {
        const profile = await getFieldProfile(profileId);
        if (profile?.values) {
          const val = profile.values;
          prefilledBillTo = {
            companyName: val.bill_to_company || val.counterparty_name || "",
            attn: val.attn_name || val.counterparty_signatory_name || "",
            endUser: val.end_user || "",
            subject: val.subject || "",
            am: val.am_name || val.our_signatory_name || "",
          };
          senderPhone = val.am_phone || "";
        }
      }

      const todayStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      const validityStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      // Fetch dynamic organization details from DB settings
      let orgData = null;
      try {
        const setRes = await fetch("/api/settings");
        if (setRes.ok) {
          const sJson = await setRes.json();
          orgData = sJson.organization || null;
        }
      } catch (e) {
        console.warn("Failed to load organization settings for quotation:", e);
      }

      const dynamicIssuer = orgData ? {
        name: orgData.nameEn || quotationTemplate.issuer.name,
        nameTh: orgData.name || quotationTemplate.issuer.nameTh,
        taxId: orgData.taxId || quotationTemplate.issuer.taxId,
        branch: orgData.branch || quotationTemplate.issuer.branch,
        address: orgData.address || quotationTemplate.issuer.address,
        phone: orgData.phone || quotationTemplate.issuer.phone,
        email: orgData.email || quotationTemplate.issuer.email,
        website: orgData.website || quotationTemplate.issuer.website,
      } : quotationTemplate.issuer;

      setInitialQuotation({
        id: "",
        quotationNo,
        quotationDate: todayStr,
        priceValidity: validityStr,
        deliveryTerm: "7 days",
        creditTerm: "30 days",
        issuer: dynamicIssuer,
        billTo: prefilledBillTo,
        lineItems: [createEmptyLineItem()],
        vatRate: 7,
        specialDiscount: 0,
        remarks: "",
        remarksList: ["Payment: Annually"],
        senderName: "",
        senderPosition: "",
        senderEmail: "",
        senderPhone: senderPhone,
      });
    }

    initData();
  }, [docId, profileId]);

  if (!initialQuotation) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-400 font-medium text-sm">
        กำลังโหลดใบเสนอราคา...
      </div>
    );
  }

  return (
    <QuotationDataProvider initialQuotation={initialQuotation}>
      <QuotationEditorContent docId={docId} />
    </QuotationDataProvider>
  );
}
