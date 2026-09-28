"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { DocumentFieldsProvider, useDocumentFields } from "@/context/DocumentFieldsContext";
import { templateRegistry, getCompletionStatus } from "@/lib/templates/registry";
import { getFieldProfile } from "@/lib/data/fieldProfiles";
import EditorToolbar from "./EditorToolbar";
import DocumentCanvas from "./DocumentCanvas";
import PageControls from "./PageControls";
import ReviewScreen from "./ReviewScreen";
import EmailScreen from "./EmailScreen";
import SuccessScreen from "./SuccessScreen";
import ContractFormSidebar from "./ContractFormSidebar";
import NotificationFormSidebar from "./NotificationFormSidebar";
import SaveConfirmModal from "@/components/common/SaveConfirmModal";

function fileNameFor(prefix) {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear() + 543;
  return `${prefix}_${dd}-${mm}-${yyyy}.pdf`;
}

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function EditorContent({ templateId, initialDocId, initialDocName, profileId }) {
  const router = useRouter();
  const { schema, pages } = templateRegistry[templateId];
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [mode, setMode] = useState("edit"); // edit | review | email | success
  const [pdfBase64, setPdfBase64] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [activeDocId, setActiveDocId] = useState(initialDocId || null);
  const [docName, setDocName] = useState(initialDocName || fileNameFor(schema.name.replace(/\s+/g, "")));
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [isSaveSuccess, setIsSaveSuccess] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(true);
  const { readOnly, setReadOnly, values } = useDocumentFields();

  const fileName = docName.endsWith(".pdf") ? docName : `${docName}.pdf`;
  const status = getCompletionStatus(values, templateId);

  // เปิด Pop-Up Modal ยืนยันการบันทึก
  const handleOpenSaveModal = () => {
    setIsSaveSuccess(false);
    setSaveModalOpen(true);
  };

  // ดำเนินการบันทึกลงฐานข้อมูลจริง
  const handleConfirmSaveDocument = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(activeDocId ? { id: activeDocId } : {}),
          name: docName,
          templateId,
          templateName: schema.fullName,
          profileId: profileId || null,
          values,
          status: "draft",
        }),
      });

      if (!res.ok) throw new Error("บันทึกไม่สำเร็จ");
      const record = await res.json();
      if (record?.id) {
        setActiveDocId(record.id);
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
        body: JSON.stringify({ templateId, values, fileName, format }),
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
    const baseName = (fileName || schema.fullName || "เอกสาร").replace(/\.(pdf|html|webp)$/i, "");
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

    // 1. ลองใช้ File System Access API (เปิดหน้าต่าง "Save As...")
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

    // 2. Fallback
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadFileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGoToEmail = async () => {
    if (!pdfBase64) await generateExport("pdf");
    setMode("email");
  };

  if (mode === "success") {
    return <SuccessScreen fileName={fileName} sentTo={sentTo} onCreateNew={() => router.push("/create")} />;
  }

  if (mode === "email") {
    return (
      <EmailScreen
        defaultSubject={schema.fullName}
        fileName={fileName}
        attachmentBase64={pdfBase64}
        templateId={templateId}
        templateName={schema.fullName}
        values={values}
        onBack={() => setMode("review")}
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
        template={schema}
        docName={docName}
        pages={pages}
        status={status}
        onExport={handleDownload}
        onSendEmail={handleGoToEmail}
        exporting={generating}
        onBackToEdit={() => setReadOnly(false)}
      />
    );
  }

  const PageContent = pages[currentPage - 1];

  return (
    <div className="flex flex-col h-screen relative">

      <EditorToolbar
        template={schema}
        docName={docName}
        onDocNameChange={setDocName}
        status={status}
        onPreview={() => setReadOnly(true)}
        onExport={handleDownload}
        exporting={generating}
        onSave={handleOpenSaveModal}
        isSaving={isSaving}
        savedAt={savedAt}
        isFormOpen={isFormOpen}
        onToggleForm={() => setIsFormOpen((prev) => !prev)}
      />

      {/* 2-Column Split Workspace: Left Form + Right Live A4 Canvas */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {templateId === "notification" ? (
          <NotificationFormSidebar
            template={schema}
            isOpen={isFormOpen}
          />
        ) : (
          <ContractFormSidebar
            template={schema}
            isOpen={isFormOpen}
          />
        )}

        <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden bg-muted/30">
          <DocumentCanvas
            logo={schema.logo}
            footerTitle={schema.fullName}
            currentPage={currentPage}
            totalPages={schema.pageCount}
            hasHeader={schema.hasHeader !== false}
            hasFooter={schema.hasFooter !== false}
            zoom={zoom}
          >
            <PageContent content={schema.content} />
          </DocumentCanvas>
        </div>
      </div>

      <PageControls
        currentPage={currentPage}
        totalPages={schema.pageCount}
        zoom={zoom}
        onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
        onNextPage={() => setCurrentPage((p) => Math.min(schema.pageCount, p + 1))}
        onZoomOut={() => setZoom((z) => Math.max(50, z - 10))}
        onZoomIn={() => setZoom((z) => Math.min(150, z + 10))}
        onFullscreen={() => {}}
      />

      {/* Pop-Up Modal บันทึกเอกสาร (สไตล์เดียวกับ Delete Confirm) */}
      <SaveConfirmModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onConfirm={handleConfirmSaveDocument}
        isLoading={isSaving}
        isSuccess={isSaveSuccess}
        title="บันทึกเอกสาร?"
        description={`คุณต้องการบันทึกการเปลี่ยนแปลงของเอกสาร "${docName}" ลงในระบบใช่หรือไม่?`}
        confirmText="บันทึกเอกสาร"
        cancelText="ยกเลิก"
        successTitle="บันทึกเอกสารสำเร็จเรียบร้อยแล้ว!"
        successDescription={`ข้อมูลเอกสาร "${docName}" ถูกบันทึกลงในระบบเรียบร้อยแล้ว`}
        secondarySuccessButtonText="แก้ไขต่อ"
        onSecondarySuccessClick={() => setSaveModalOpen(false)}
        successButtonText="ดูเอกสารทั้งหมด"
        onSuccessClose={() => router.push("/documents")}
      />
    </div>
  );
}

export default function DocumentEditor({ templateId, profileId, docId }) {
  const [initialValues, setInitialValues] = useState(null); // null = กำลังโหลด
  const [loadedDocId, setLoadedDocId] = useState(docId || null);
  const [loadedDocName, setLoadedDocName] = useState(null);
  const [activeProfileId, setActiveProfileId] = useState(profileId || null);

  useEffect(() => {
    const { schema } = templateRegistry[templateId];

    async function load() {
      // Fetch dynamic organization details from DB settings
      let orgData = null;
      try {
        const setRes = await fetch("/api/settings");
        if (setRes.ok) {
          const sJson = await setRes.json();
          orgData = sJson.organization || null;
        }
      } catch (e) {
        console.warn("Failed to load organization settings for document:", e);
      }

      const dynamicOrgDefaults = orgData ? {
        our_company_name: orgData.name || "บริษัทของคุณ",
        our_company_name_en: orgData.nameEn || "",
        our_tax_id: orgData.taxId || "",
        our_address: orgData.address || "",
        our_phone: orgData.phone || "",
        our_signatory_name: orgData.authorizedSignatory || orgData.signatoryName || "ผู้มีอำนาจลงนาม",
        our_signatory_position: orgData.signatoryTitle || orgData.signatoryPosition || "กรรมการผู้จัดการ",
      } : {};

      // 1. หากเป็นการเปิดแก้ไขเอกสารเดิมที่เคยบันทึกไว้ (มี docId)
      if (docId) {
        try {
          const res = await fetch(`/api/documents?id=${docId}`);
          if (res.ok) {
            const doc = await res.json();
            const mergedValues = {
              ...dynamicOrgDefaults,
              ...(schema.defaultValues || {}),
              ...(doc.values || {}),
            };
            setInitialValues(mergedValues);
            setLoadedDocId(doc.id);
            setLoadedDocName(doc.name || null);
            if (doc.profileId) {
              setActiveProfileId(doc.profileId);
            }
            return;
          }
        } catch (err) {
          console.error("Load document error:", err);
        }
      }

      // 2. หากเป็นการเลือกใช้ Profile Data
      if (profileId) {
        const profile = await getFieldProfile(profileId);
        const prefilled = { ...dynamicOrgDefaults, ...(schema.defaultValues || {}) };
        if (profile?.values) {
          for (const field of schema.fields) {
            if (field.sharedKey && profile.values[field.sharedKey]) {
              prefilled[field.id] = profile.values[field.sharedKey];
            }
          }
        }
        setInitialValues(prefilled);
        return;
      }

      // 3. เริ่มจากเอกสารเปล่า (ใช้ dynamicOrgDefaults + defaultValues จาก schema)
      setInitialValues({ ...dynamicOrgDefaults, ...(schema.defaultValues || {}) });
    }

    load();
  }, [templateId, profileId, docId]);

  if (initialValues === null) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-400 font-medium text-sm">
        กำลังโหลดเอกสาร...
      </div>
    );
  }

  return (
    <DocumentFieldsProvider initialValues={initialValues}>
      <EditorContent
        templateId={templateId}
        initialDocId={loadedDocId}
        initialDocName={loadedDocName}
        profileId={activeProfileId || profileId || null}
      />
    </DocumentFieldsProvider>
  );
}