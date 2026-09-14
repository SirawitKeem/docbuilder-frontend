"use client";

import { Suspense, useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { DocumentFieldsProvider } from "@/context/DocumentFieldsContext";
import { templateRegistry } from "@/lib/templates/registry";
import DocumentHeader from "@/components/document/DocumentHeader";
import DocumentFooter from "@/components/document/DocumentFooter";
import FabricPrintRenderer from "@/components/document/FabricPrintRenderer";
import "@/app/print/print.css";

function decodeValues(encoded) {
  if (!encoded) return null;
  try {
    const binaryString = atob(encoded);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const json = new TextDecoder("utf-8").decode(bytes);
    return JSON.parse(json);
  } catch {
    try {
      const json = decodeURIComponent(escape(atob(encoded)));
      return JSON.parse(json);
    } catch (e2) {
      console.error("decodeValues error:", e2);
      return null;
    }
  }
}

const watermarkLabels = {
  DRAFT: "ฉบับร่าง (DRAFT)",
  COPY: "สำเนาถูกต้อง (COPY)",
  CONFIDENTIAL: "ลับเฉพาะ (CONFIDENTIAL)",
};

function PrintContent() {
  const { templateId } = useParams();
  const searchParams = useSearchParams();

  const [injectedData, setInjectedData] = useState(null);
  const [customTemplate, setCustomTemplate] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [loadingCustom, setLoadingCustom] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.__PRINT_DATA__) {
      setInjectedData(window.__PRINT_DATA__);
    }
  }, []);

  const values = injectedData || decodeValues(searchParams.get("data")) || {};
  const activeWatermark = values.watermark || searchParams.get("watermark");
  const entry = templateRegistry[templateId];

  // If not in static registry, fetch custom template from API
  useEffect(() => {
    if (!entry && templateId) {
      setLoadingCustom(true);
      fetch(`/api/templates/${templateId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setCustomTemplate(data);
          }
        })
        .catch((err) => console.error("Error fetching custom template:", err))
        .finally(() => setLoadingCustom(false));
    }
  }, [entry, templateId]);

  useEffect(() => {
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => {
        if (entry) setIsReady(true);
      });
    } else {
      if (entry) setIsReady(true);
    }
  }, [entry]);

  // 1. Custom Studio Template Rendering (Docs / Slides)
  if (!entry && customTemplate) {
    const isSlide = customTemplate?.canvasPreset === "slide-16-9" || customTemplate?.editorType === "slide";
    const pageWidth = isSlide ? 1280 : 794;

    return (
      <div id="print-root" className="bg-white relative" style={{ width: `${pageWidth}px` }}>
        <FabricPrintRenderer
          template={customTemplate}
          values={values}
          watermark={activeWatermark}
          onReady={() => setIsReady(true)}
        />
      </div>
    );
  }

  if (!entry && loadingCustom) {
    return (
      <div className="p-8 text-center text-xs text-gray-500 font-sans">
        กำลังโหลดเทมเพลตสำหรับพิมพ์...
      </div>
    );
  }

  if (!entry && !customTemplate) {
    return <p className="p-8 text-red-500 font-sans">ไม่พบเทมเพลต: {templateId}</p>;
  }

  const { schema, pages, DocumentComponent } = entry;

  if (schema?.type === "quotation" || DocumentComponent) {
    const QuotationComp = DocumentComponent;
    return (
      <div
        id="print-root"
        className="border-0 p-0 m-0 w-[794px] bg-white relative"
        data-ready={isReady ? "true" : "false"}
      >
        <style>{`
          @page {
            size: 210mm 297mm;
            margin: 0;
          }
          @media print, all {
            html, body {
              background: #ffffff !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 794px !important;
              min-width: 794px !important;
              max-width: 794px !important;
              height: auto !important;
              max-height: none !important;
              overflow: visible !important;
            }
            #print-root {
              margin: 0 !important;
              padding: 0 !important;
              width: 794px !important;
              height: auto !important;
              overflow: visible !important;
            }
            .quotation-document-wrapper {
              display: block !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 794px !important;
              height: auto !important;
              overflow: visible !important;
            }
            .quotation-document-wrapper > div {
              display: flex !important;
              box-shadow: none !important;
              margin: 0 !important;
              width: 794px !important;
              height: 297mm !important;
              min-height: 297mm !important;
              max-height: 297mm !important;
              overflow: hidden !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              box-sizing: border-box !important;
              position: relative !important;
            }
            .quotation-document-wrapper > div + div {
              page-break-before: always !important;
              break-before: page !important;
            }
            .quotation-document-wrapper > :not([hidden]) ~ :not([hidden]) {
              --tw-space-y-reverse: 0 !important;
              margin-top: 0 !important;
              margin-bottom: 0 !important;
            }
          }
        `}</style>
        <QuotationComp quotation={values} values={values} data={values} />
      </div>
    );
  }

  return (
    <DocumentFieldsProvider initialValues={values} defaultReadOnly>
      <div id="print-root">
        {(pages || []).map((PageContent, i) => (
          <div
            key={i}
            className="print-page font-noto-looped relative"
            data-ready={isReady ? "true" : "false"}
          >
            {activeWatermark && watermarkLabels[activeWatermark] && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30 select-none overflow-hidden">
                <div
                  className="font-black uppercase border-4 px-8 py-4 rounded-3xl"
                  style={{
                    transform: "rotate(-35deg)",
                    fontSize: "52px",
                    letterSpacing: "0.15em",
                    color: "rgba(100, 116, 139, 0.12)",
                    borderColor: "rgba(100, 116, 139, 0.14)",
                  }}
                >
                  {watermarkLabels[activeWatermark]}
                </div>
              </div>
            )}
            {schema.hasHeader !== false && <DocumentHeader logo={schema.logo} />}
            <div className="print-page-body">
              <PageContent />
            </div>
            {schema.hasFooter !== false && (
              <DocumentFooter title={schema.fullName} pageNumber={i + 1} totalPages={pages.length} />
            )}
          </div>
        ))}
      </div>
    </DocumentFieldsProvider>
  );
}

export default function PrintPage() {
  return (
    <Suspense fallback={null}>
      <PrintContent />
    </Suspense>
  );
}