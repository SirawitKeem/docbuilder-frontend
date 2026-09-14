"use client";

import React from "react";
import Field from "./Field";
import CorporateSeal from "./CorporateSeal";
import { useDocumentFields } from "@/context/DocumentFieldsContext";

import ndaContent from "@/lib/templates/nda/content.js";
import partnerContent from "@/lib/templates/partner/content.js";
import distContent from "@/lib/templates/distributor/content.js";
import notifContent from "@/lib/templates/notification/content.json";

/**
 * Universal Dynamic Contract Page Component
 * Renders any page of any contract template based on structured data and blocks
 * Eliminates all hardcoded JSX page files while maintaining 100% visual fidelity
 */
export function DynamicContractPage({ templateId, pageNumber }) {
  const { values = {} } = useDocumentFields?.() || { values: {} };

  // --------------------------------------------------------------------------
  // 1. NDA (Non-Disclosure Agreement) - 4 Pages
  // --------------------------------------------------------------------------
  if (templateId === "nda") {
    const c = ndaContent;
    const disclosingCompany = values.disclosing_party_name || values.our_company_name || "บริษัท เครสท์ เซนโด จำกัด";
    const disclosingName = values.disclosing_signatory_name || values.our_signatory_name || "นายศรายุทธ โกสิยารักษ์";
    const disclosingPos = values.disclosing_signatory_position || values.our_signatory_position || "กรรมการผู้จัดการ / CEO";

    if (pageNumber === 1) {
      const sec1 = c.sections?.[0] || {};
      return (
        <div className="document-body">
          <h1>{c.title?.titleTh || "หนังสือสัญญาไม่เปิดเผยข้อมูล"}</h1>
          <p className="subtitle text-center text-[16px] mb-2">{c.title?.titleEn || "Non-Disclosure Agreement (NDA)"}</p>

          <p style={{ marginBottom: "5px" }}>
            {c.preamble?.locationPrefix || "สัญญาฉบับนี้ทำขึ้น ณ"}{" "}
            <Field id="contract_location" placeholder="กรุงเทพมหานคร" minWidth={14} />{" "}
            {c.preamble?.datePrefix || "เมื่อวันที่"} <Field id="contract_date_day" placeholder="17" minWidth={3} />{" "}
            {c.preamble?.monthPrefix || "เดือน"} <Field id="contract_date_month" placeholder="สิงหาคม" minWidth={8} />{" "}
            {c.preamble?.yearPrefix || "พ.ศ."} <Field id="contract_date_year" placeholder="2569" minWidth={5} />
          </p>

          <p className="font-normal" style={{ marginTop: "4px", marginBottom: "4px" }}>
            {c.preamble?.betweenLabel || "ระหว่าง:"}
          </p>

          <p className="indent-8" style={{ marginBottom: "4px" }}>
            (1) <Field id="disclosing_party_name" placeholder={disclosingCompany} minWidth={24} /> {c.preamble?.disclosingPartyBoilerplate || "สำนักงานใหญ่ ตั้งอยู่เลขที่ 8/40 เดอะ คอนเนค 37 ซอยช่างอากาศอุทิศ 10 แยก 1-2 แขวงดอนเมือง เขตดอนเมือง กรุงเทพมหานคร 10210 ซึ่งต่อไปในสัญญานี้จะเรียกว่า"}{" "}
            <span className="font-bold">{c.preamble?.disclosingPartyRole || "ผู้เปิดเผยข้อมูล"}</span> ฝ่ายหนึ่ง
          </p>

          <p className="font-normal" style={{ marginTop: "4px", marginBottom: "4px" }}>
            {c.preamble?.andLabel || "กับ"}
          </p>

          <p className="indent-8" style={{ marginBottom: "4px" }}>
            (2) บริษัท/นิติบุคคล{" "}
            <Field id="receiving_party_name" placeholder="บริษัท ตัวอย่าง จำกัด" minWidth={24} />{" "}
            {c.preamble?.receivingPartyAddressPrefix || "สำนักงานใหญ่ ตั้งอยู่เลขที่"}{" "}
            <Field
              id="receiving_party_address"
              type="textarea"
              placeholder="เลขที่ ... แขวง/ตำบล ... เขต/อำเภอ ... จังหวัด ... รหัสไปรษณีย์ ..."
            />
            <br />
            ซึ่งต่อไปในสัญญานี้จะเรียกว่า{" "}
            <span className="font-bold">{c.preamble?.receivingPartyRole || "ผู้รับข้อมูล"}</span> อีกฝ่ายหนึ่ง
          </p>

          <p className="indent-8" style={{ marginTop: "4px", marginBottom: "4px" }}>
            {c.preamble?.partiesSummary}
          </p>

          <p className="indent-8" style={{ marginTop: "6px", marginBottom: "8px" }}>
            {c.preamble?.recital}
          </p>

          <h2>{sec1.title}</h2>
          <p className="pl-4">{sec1.intro}</p>
          <ul className="list-disc pl-10 space-y-1 mb-2 font-normal">
            {(sec1.bullets || []).map((b, idx) => (
              <li key={idx}>{b}</li>
            ))}
          </ul>
        </div>
      );
    }

    if (pageNumber === 2) {
      const sec2 = c.sections?.[1] || {};
      const sec3 = c.sections?.[2] || {};
      const sec4 = c.sections?.[3] || {};
      return (
        <div className="document-body pt-3">
          <h2>{sec2.title}</h2>
          <p className="pl-4">{sec2.intro}</p>
          <ul className="list-none space-y-1 mb-4">
            {(sec2.subClauses || []).map((sub, idx) => (
              <li key={idx} className="pl-4">{sub}</li>
            ))}
          </ul>

          <h2>{sec3.title}</h2>
          <p className="pl-4">{sec3.intro}</p>
          <ul className="list-disc pl-10 space-y-1 mb-2 font-normal">
            {(sec3.bullets || []).map((b, idx) => (
              <li key={idx}>{b}</li>
            ))}
          </ul>
          {sec3.closing && <p className="pl-4">{sec3.closing}</p>}

          <h2>{sec4.title}</h2>
          <p className="pl-4 font-bold">{sec4.intro}</p>
          <ul className="list-none space-y-1 font-normal">
            {(sec4.subClauses || []).map((sub, idx) => (
              <li key={idx} className="pl-4">{sub}</li>
            ))}
          </ul>
        </div>
      );
    }

    if (pageNumber === 3) {
      const sec5 = c.sections?.[4] || {};
      const sec6 = c.sections?.[5] || {};
      const sec7 = c.sections?.[6] || {};
      const sec8 = c.sections?.[7] || {};
      return (
        <div className="document-body pt-3">
          <h2>{sec5.title}</h2>
          <p className="pl-4 mb-3 font-normal">{sec5.content}</p>

          <h2>{sec6.title}</h2>
          <p className="pl-4 mb-3 font-normal">{sec6.content}</p>

          <h2>{sec7.title}</h2>
          <p className="pl-4 mb-3 font-normal">{sec7.content}</p>

          <h2>{sec8.title}</h2>
          <p className="pl-4 mb-3 font-normal">{sec8.content}</p>
        </div>
      );
    }

    if (pageNumber === 4) {
      const sec9 = c.sections?.[8] || {};
      const sec10 = c.sections?.[9] || {};
      return (
        <div className="document-body pt-3">
          <h2>{sec9.title}</h2>
          <ul className="list-none space-y-1 mb-3">
            {(sec9.subClauses || []).map((sub, idx) => (
              <li key={idx} className="pl-4">{sub}</li>
            ))}
          </ul>

          <h2>{sec10.title}</h2>
          <ul className="list-none space-y-1" style={{ marginBottom: "12px" }}>
            {(sec10.subClauses || []).map((sub, idx) => (
              <li key={idx} className="pl-4">{sub}</li>
            ))}
          </ul>

          <p className="indent-8" style={{ marginBottom: "28px" }}>
            {c.witnessStatement || "สัญญานี้ทำขึ้นเป็นสองฉบับมีข้อความถูกต้องตรงกัน คู่สัญญาทั้งสองฝ่ายได้อ่านและเข้าใจข้อความโดยละเอียดตลอดแล้ว จึงได้ลงลายมือชื่อไว้เป็นหลักฐานสำคัญต่อหน้าพยาน"}
          </p>

          {/* Symmetrical 2-Column Signature Block */}
          <div className="grid grid-cols-2 gap-10" style={{ marginBottom: "50px" }}>
            <div className="text-center flex flex-col items-center relative">
              <p className="font-bold mb-1">{c.signatures?.disclosingTitle || "ผู้เปิดเผยข้อมูล (Disclosing Party)"}</p>
              <p className="font-bold mb-1">{disclosingCompany}</p>
              <div className="h-16 flex items-center justify-center relative w-full mb-0.5">
                {values.our_signature_image ? (
                  <img
                    src={values.our_signature_image}
                    alt="ลายเซ็นฝ่ายเรา"
                    className="max-h-14 max-w-[180px] object-contain select-none z-10"
                  />
                ) : null}
              </div>
              <p className="mb-3">{c.signatures?.signPlaceholder || "ลงชื่อ ...................................................."}</p>
              <p className="font-semibold">({disclosingName})</p>
              <p className="text-gray-600 text-xs">{disclosingPos}</p>
              {values.company_seal !== false && (
                <div className="absolute right-2 top-8 pointer-events-none">
                  <CorporateSeal className="w-20 h-20" opacity={0.88} />
                </div>
              )}
            </div>

            <div className="text-center flex flex-col items-center relative">
              <p className="font-bold mb-1">{c.signatures?.receivingTitle || "ผู้รับข้อมูล (Receiving Party)"}</p>
              <p className="font-bold mb-1">
                {values.receiving_party_name || "บริษัท/นิติบุคคลผู้รับข้อมูล"}
              </p>
              <div className="h-16 flex items-center justify-center relative w-full mb-0.5">
                {values.counterparty_signature_image ? (
                  <img
                    src={values.counterparty_signature_image}
                    alt="ลายเซ็นคู่สัญญา"
                    className="max-h-14 max-w-[180px] object-contain select-none z-10"
                  />
                ) : null}
              </div>
              <p className="mb-3">{c.signatures?.signPlaceholder || "ลงชื่อ ...................................................."}</p>
              <p className="font-semibold">
                (<Field id="receiving_signatory_name" placeholder="ชื่อผู้มีอำนาจลงนาม" minWidth={16} />)
              </p>
              <p className="text-gray-600 text-xs">
                <Field id="receiving_signatory_position" placeholder="ตำแหน่ง" minWidth={12} />
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  // --------------------------------------------------------------------------
  // 2. Partner Agreement - 5 Pages
  // --------------------------------------------------------------------------
  if (templateId === "partner") {
    const c = partnerContent;
    const ourCompanyName = values.our_company_name || "บริษัท เครสท์ เซนโด จำกัด";
    const ourTaxId = values.our_tax_id || "0105558073755";
    const ourAddress = values.our_address || "สำนักงานใหญ่ ตั้งอยู่เลขที่ 8/40 เดอะ คอนเนค 37 ซอยช่างอากาศอุทิศ 10 แยก 1-2 แขวงดอนเมือง เขตดอนเมือง กรุงเทพมหานคร 10210";
    const ourSignatoryName = values.our_signatory_name || "นายศรายุทธ โกสิยารักษ์";
    const ourSignatoryPos = values.our_signatory_position || "กรรมการผู้จัดการ / CEO";

    if (pageNumber === 1) {
      const sec1 = c.sections?.[0] || {};
      const sec2 = c.sections?.[1] || {};
      return (
        <div className="document-body pt-2 text-[12px] leading-snug text-left">
          <h1 className="text-center">{c.title?.titleTh || "สัญญาแต่งตั้งพันธมิตรตัวแทนจำหน่าย"}</h1>
          <p className="subtitle text-center text-[15px] mb-1.5">{c.title?.titleEn || "(Partner Agreement)"}</p>

          <p className="text-left" style={{ marginBottom: "4px" }}>
            สัญญาฉบับนี้ทำขึ้น ณ วันที่ <Field id="contract_date_day" placeholder="17" minWidth={3} />{" "}
            เดือน <Field id="contract_date_month" placeholder="สิงหาคม" minWidth={8} />{" "}
            พ.ศ. <Field id="contract_date_year" placeholder="2569" minWidth={5} />
          </p>

          <p className="font-normal text-left" style={{ marginTop: "3px", marginBottom: "3px" }}>ระหว่าง:</p>

          <p className="indent-8 text-left" style={{ marginBottom: "3px" }}>
            {ourCompanyName} เลขทะเบียนนิติบุคคล {ourTaxId} {ourAddress}
            <br />
            (ซึ่งต่อไปในสัญญานี้จะเรียกว่า &ldquo;Distributor&rdquo; หรือ &ldquo;ผู้จัดจำหน่ายหลัก&rdquo;) ฝ่ายหนึ่ง
          </p>

          <p className="font-normal text-left" style={{ marginTop: "3px", marginBottom: "0px" }}>กับ</p>

          <p className="indent-8 text-left" style={{ marginBottom: "3px" }}>
            <Field id="reseller_name" placeholder="ระบุชื่อบริษัท Reseller" minWidth={24} /> เลขทะเบียนนิติบุคคล{" "}
            <Field id="reseller_registration_number" placeholder="XXXXXXXXXXXXX" minWidth={16} />{" "}
            สำนักงานใหญ่ ตั้งอยู่เลขที่{" "}
            <Field id="reseller_address" type="textarea" placeholder="ระบุที่อยู่" minWidth={30} />
            <br />
            (ซึ่งต่อไปในสัญญานี้จะเรียกว่า &ldquo;Reseller&rdquo; หรือ &ldquo;ตัวแทนจำหน่าย&rdquo;) อีกฝ่ายหนึ่ง
          </p>

          <p className="indent-8 text-left" style={{ marginTop: "6px", marginBottom: "6px" }}>
            คู่สัญญาทั้งสองฝ่ายตกลงทำสัญญาแต่งตั้งตัวแทนจำหน่าย เพื่อทำการตลาด นำเสนอ และจัดจำหน่ายผลิตภัณฑ์ ซอฟต์แวร์ และเครื่องมือทางไอที (ซึ่งต่อไปนี้เรียกว่า &ldquo;ผลิตภัณฑ์&rdquo;) โดยมีข้อกำหนดและเงื่อนไขดังต่อไปนี้:
          </p>

          <h2 className="mt-1 mb-0.5 text-left">{sec1.title}</h2>
          <p className="mb-0.5 text-left">{sec1.intro}</p>
          <ul className="list-none space-y-0.5 mb-1 text-[12px] text-left">
            {(sec1.subClauses || []).map((sub, idx) => (
              <li key={idx} className="pl-3">{sub}</li>
            ))}
          </ul>

          <h2 className="mt-1 mb-0.5 text-left">{sec2.title}</h2>
          <ul className="list-none space-y-0.5 text-[12px] text-left">
            {(sec2.subClauses || []).map((sub, idx) => (
              <li key={idx} className="pl-3">{sub}</li>
            ))}
          </ul>
        </div>
      );
    }

    if (pageNumber === 2) {
      const sec3 = c.sections?.[2] || {};
      const sec4 = c.sections?.[3] || {};
      return (
        <div className="document-body pt-2 text-[12px] leading-snug text-left">
          <h2 className="mt-1 mb-0.5 text-left">{sec3.title}</h2>
          {sec3.distributorObligations && (
            <div className="mb-1">
              <p className="font-bold pl-1 text-[12px]">3.1 หน้าที่และความรับผิดชอบของผู้จัดจำหน่ายหลัก:</p>
              <ul className="list-none space-y-0.5 pl-3">
                {sec3.distributorObligations.map((ob, idx) => (
                  <li key={idx}>{ob}</li>
                ))}
              </ul>
            </div>
          )}
          {sec3.resellerObligations && (
            <div className="mb-1">
              <p className="font-bold pl-1 text-[12px]">3.2 หน้าที่และความรับผิดชอบของตัวแทนจำหน่าย:</p>
              <ul className="list-none space-y-0.5 pl-3">
                {sec3.resellerObligations.map((ob, idx) => (
                  <li key={idx}>{ob}</li>
                ))}
              </ul>
            </div>
          )}

          <h2 className="mt-1 mb-0.5 text-left">{sec4.title}</h2>
          <ul className="list-none space-y-0.5 text-[12px] text-left">
            {(sec4.subClauses || []).map((sub, idx) => (
              <li key={idx} className="pl-3">{sub}</li>
            ))}
          </ul>
        </div>
      );
    }

    if (pageNumber === 3) {
      const sec5 = c.sections?.[3] || c.sections?.[4] || {};
      const sec6 = c.sections?.[5] || {};
      const sec7 = c.sections?.[6] || {};
      return (
        <div className="document-body pt-2 text-[12px] leading-snug text-left">
          <h2 className="mt-1 mb-0.5 text-left">{sec5.title}</h2>
          <ul className="list-none space-y-0.5 mb-1.5 text-[12px] text-left">
            {(sec5.subClauses || []).map((sub, idx) => (
              <li key={idx} className="pl-3">{sub}</li>
            ))}
          </ul>

          <h2 className="mt-1 mb-0.5 text-left">{sec6.title}</h2>
          <ul className="list-none space-y-0.5 mb-1.5 text-[12px] text-left">
            {(sec6.subClauses || []).map((sub, idx) => (
              <li key={idx} className="pl-3">{sub}</li>
            ))}
          </ul>

          <h2 className="mt-1 mb-0.5 text-left">{sec7.title}</h2>
          <ul className="list-none space-y-0.5 text-[12px] text-left">
            {(sec7.subClauses || []).map((sub, idx) => (
              <li key={idx} className="pl-3">{sub}</li>
            ))}
          </ul>
        </div>
      );
    }

    if (pageNumber === 4) {
      const sec8 = c.sections?.[7] || {};
      const sec9 = c.sections?.[8] || {};
      const sec10 = c.sections?.[9] || {};
      return (
        <div className="document-body pt-2 text-[12px] leading-snug text-left">
          <h2 className="mt-1 mb-0.5 text-left">{sec8.title}</h2>
          <ul className="list-none space-y-0.5 mb-1.5 text-[12px] text-left">
            {(sec8.subClauses || []).map((sub, idx) => (
              <li key={idx} className="pl-3">{sub}</li>
            ))}
          </ul>

          <h2 className="mt-1 mb-0.5 text-left">{sec9.title}</h2>
          <ul className="list-none space-y-0.5 mb-1.5 text-[12px] text-left">
            {(sec9.subClauses || []).map((sub, idx) => (
              <li key={idx} className="pl-3">{sub}</li>
            ))}
          </ul>

          <h2 className="mt-1 mb-0.5 text-left">{sec10.title}</h2>
          <ul className="list-none space-y-0.5 text-[12px] text-left">
            {(sec10.subClauses || []).map((sub, idx) => (
              <li key={idx} className="pl-3">{sub}</li>
            ))}
          </ul>
        </div>
      );
    }

    if (pageNumber === 5) {
      const sec11 = c.sections?.[10] || {};
      return (
        <div className="document-body pt-2 text-[12px] leading-snug text-left">
          <h2 className="mt-1 mb-0.5 text-left">{sec11.title}</h2>
          <ul className="list-none space-y-0.5 mb-4 text-[12px] text-left">
            {(sec11.subClauses || []).map((sub, idx) => (
              <li key={idx} className="pl-3">{sub}</li>
            ))}
          </ul>

          <p className="indent-8 text-left mb-6 text-[12px]">
            {c.witnessStatement || "สัญญานี้ทำขึ้นเป็นสองฉบับมีข้อความถูกต้องตรงกัน คู่สัญญาทั้งสองฝ่ายได้อ่านและเข้าใจข้อความโดยละเอียดตลอดแล้ว จึงได้ลงลายมือชื่อไว้เป็นหลักฐานสำคัญต่อหน้าพยาน"}
          </p>

          <div className="grid grid-cols-2 gap-8 text-center text-[12px]">
            <div className="flex flex-col items-center relative">
              <p className="font-bold mb-1">ผู้จัดจำหน่ายหลัก (Distributor)</p>
              <p className="font-bold mb-1">{ourCompanyName}</p>
              <div className="h-16 flex items-center justify-center relative w-full mb-0.5">
                {values.our_signature_image ? (
                  <img
                    src={values.our_signature_image}
                    alt="ลายเซ็นฝ่ายเรา"
                    className="max-h-14 max-w-[180px] object-contain select-none z-10"
                  />
                ) : null}
              </div>
              <p className="mb-2">ลงชื่อ ....................................................</p>
              <p className="font-semibold">({ourSignatoryName})</p>
              <p className="text-gray-600 text-xs">{ourSignatoryPos}</p>
              {values.company_seal !== false && (
                <div className="absolute right-2 top-8 pointer-events-none">
                  <CorporateSeal className="w-20 h-20" opacity={0.88} />
                </div>
              )}
            </div>

            <div className="flex flex-col items-center relative">
              <p className="font-bold mb-1">ตัวแทนจำหน่าย (Reseller)</p>
              <p className="font-bold mb-1">{values.reseller_name || "บริษัท ตัวแทนจำหน่าย จำกัด"}</p>
              <div className="h-16 flex items-center justify-center relative w-full mb-0.5">
                {values.counterparty_signature_image ? (
                  <img
                    src={values.counterparty_signature_image}
                    alt="ลายเซ็นคู่สัญญา"
                    className="max-h-14 max-w-[180px] object-contain select-none z-10"
                  />
                ) : null}
              </div>
              <p className="mb-2">ลงชื่อ ....................................................</p>
              <p className="font-semibold">
                (<Field id="reseller_signatory_name" placeholder="ชื่อผู้มีอำนาจลงนาม" minWidth={16} />)
              </p>
              <p className="text-gray-600 text-xs">
                <Field id="reseller_signatory_position" placeholder="ตำแหน่ง" minWidth={12} />
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  // --------------------------------------------------------------------------
  // 3. Distributor Agreement - 5 Pages
  // --------------------------------------------------------------------------
  if (templateId === "distributor") {
    const c = distContent;
    const ourCompanyName = values.our_company_name || "บริษัท เครสท์ เซนโด จำกัด";
    const ourAddress = values.our_address || "8/40 The Connect 37 ซอยช่างอากาศอุทิศ 10 แยก 1-2 แขวงดอนเมือง เขตดอนเมือง กรุงเทพมหานคร 10210";

    if (pageNumber === 1) {
      const sec1 = c.sections?.[0] || {};
      return (
        <div className="document-body">
          <h1>{c.title?.titleTh || "สัญญาแต่งตั้งและจัดจำหน่ายซอฟต์แวร์"}</h1>
          <p className="subtitle text-center text-[16px] mb-2">{c.title?.titleEn || "(Distributor and Reseller Master Agreement)"}</p>

          <p style={{ marginBottom: "5px" }}>
            สัญญาฉบับนี้ทำขึ้น ณ{" "}
            <Field id="contract_location" placeholder="กรุงเทพมหานคร" minWidth={14} />{" "}
            เมื่อวันที่ <Field id="contract_date_day" placeholder="17" minWidth={3} />{" "}
            เดือน <Field id="contract_date_month" placeholder="สิงหาคม" minWidth={8} />{" "}
            พ.ศ. <Field id="contract_date_year" placeholder="2569" minWidth={5} />
          </p>

          <p className="font-normal" style={{ marginTop: "4px", marginBottom: "4px" }}>ระหว่าง:</p>

          <p className="indent-8" style={{ marginBottom: "4px" }}>
            (1) {ourCompanyName} {ourAddress} ซึ่งต่อไปในสัญญานี้จะเรียกว่า &ldquo;ผู้จัดจำหน่ายหลัก&rdquo; (Distributor) ฝ่ายหนึ่ง
          </p>

          <p className="font-normal" style={{ marginTop: "4px", marginBottom: "4px" }}>กับ</p>

          <p className="indent-8" style={{ marginBottom: "4px" }}>
            (2) บริษัท/นิติบุคคล{" "}
            <Field id="reseller_name" placeholder="ระบุชื่อบริษัท Reseller" minWidth={24} />{" "}
            สำนักงานใหญ่ ตั้งอยู่เลขที่{" "}
            <Field id="reseller_address" type="textarea" placeholder="เลขที่ ... แขวง/ตำบล ... เขต/อำเภอ ... จังหวัด ... รหัสไปรษณีย์ ..." />
            <br />
            (ซึ่งต่อไปในสัญญานี้จะเรียกว่า &ldquo;Reseller&rdquo; หรือ &ldquo;ตัวแทนจำหน่ายต่อ&rdquo;) อีกฝ่ายหนึ่ง
          </p>

          <p className="indent-8" style={{ marginTop: "6px", marginBottom: "8px" }}>
            คู่สัญญาทั้งสองฝ่ายตกลงเข้าทำสัญญาแต่งตั้งตัวแทนจำหน่ายต่อ เพื่อทำการตลาด นำเสนอ และจัดจำหน่ายผลิตภัณฑ์ซอฟต์แวร์ และเครื่องมือทางไอที (ซึ่งต่อไปนี้เรียกว่า &ldquo;ผลิตภัณฑ์&rdquo;) โดยมีข้อกำหนดและเงื่อนไขดังต่อไปนี้:
          </p>

          <h2>{sec1.title}</h2>
          <ul className="list-none space-y-0.5">
            {(sec1.subClauses || []).map((sub, idx) => (
              <li key={idx} className="pl-4">{sub}</li>
            ))}
          </ul>
        </div>
      );
    }

    if (pageNumber === 2) {
      const sec2 = c.sections?.[1] || {};
      const sec3 = c.sections?.[2] || {};
      return (
        <div className="document-body pt-3">
          <h2>{sec2.title}</h2>
          <ul className="list-none space-y-1 mb-4">
            {(sec2.subClauses || []).map((sub, idx) => (
              <li key={idx} className="pl-4">{sub}</li>
            ))}
          </ul>

          <h2>{sec3.title}</h2>
          <ul className="list-none space-y-1">
            {(sec3.subClauses || []).map((sub, idx) => (
              <li key={idx} className="pl-4">{sub}</li>
            ))}
          </ul>
        </div>
      );
    }

    if (pageNumber === 3) {
      const sec4 = c.sections?.[3] || {};
      const sec5 = c.sections?.[4] || {};
      return (
        <div className="document-body pt-3">
          <h2>{sec4.title}</h2>
          <ul className="list-none space-y-1 mb-4">
            {(sec4.subClauses || []).map((sub, idx) => (
              <li key={idx} className="pl-4">{sub}</li>
            ))}
          </ul>

          <h2>{sec5.title}</h2>
          <ul className="list-none space-y-1">
            {(sec5.subClauses || []).map((sub, idx) => (
              <li key={idx} className="pl-4">{sub}</li>
            ))}
          </ul>
        </div>
      );
    }

    if (pageNumber === 4) {
      const sec6 = c.sections?.[5] || {};
      const sec7 = c.sections?.[6] || {};
      const sec8 = c.sections?.[7] || {};
      return (
        <div className="document-body pt-3">
          <h2>{sec6.title}</h2>
          <ul className="list-none space-y-1 mb-4">
            {(sec6.subClauses || []).map((sub, idx) => (
              <li key={idx} className="pl-4">{sub}</li>
            ))}
          </ul>

          <h2>{sec7.title}</h2>
          <ul className="list-none space-y-1 mb-4">
            {(sec7.subClauses || []).map((sub, idx) => (
              <li key={idx} className="pl-4">{sub}</li>
            ))}
          </ul>

          <h2>{sec8.title}</h2>
          <ul className="list-none space-y-1">
            {(sec8.subClauses || []).map((sub, idx) => (
              <li key={idx} className="pl-4">{sub}</li>
            ))}
          </ul>
        </div>
      );
    }

    if (pageNumber === 5) {
      const sec9 = c.sections?.[8] || {};
      const sec10 = c.sections?.[9] || {};
      return (
        <div className="document-body pt-3">
          <h2>{sec9.title}</h2>
          <ul className="list-none space-y-1 mb-4">
            {(sec9.subClauses || []).map((sub, idx) => (
              <li key={idx} className="pl-4">{sub}</li>
            ))}
          </ul>

          <h2>{sec10.title}</h2>
          <ul className="list-none space-y-1 mb-4">
            {(sec10.subClauses || []).map((sub, idx) => (
              <li key={idx} className="pl-4">{sub}</li>
            ))}
          </ul>

          <p className="indent-8 mb-6">
            {c.witnessStatement || "สัญญานี้ทำขึ้นเป็นสองฉบับมีข้อความถูกต้องตรงกัน คู่สัญญาทั้งสองฝ่ายได้อ่านและเข้าใจข้อความโดยละเอียดตลอดแล้ว จึงได้ลงลายมือชื่อไว้เป็นหลักฐานสำคัญต่อหน้าพยาน"}
          </p>

          <div className="grid grid-cols-2 gap-8 text-center">
            <div className="flex flex-col items-center relative">
              <p className="font-bold mb-1">ผู้จัดจำหน่ายหลัก (Distributor)</p>
              <p className="font-bold mb-1">{ourCompanyName}</p>
              <div className="h-16 flex items-center justify-center relative w-full mb-0.5">
                {values.our_signature_image ? (
                  <img
                    src={values.our_signature_image}
                    alt="ลายเซ็นฝ่ายเรา"
                    className="max-h-14 max-w-[180px] object-contain select-none z-10"
                  />
                ) : null}
              </div>
              <p className="mb-2">ลงชื่อ ....................................................</p>
              <p className="font-semibold">({values.our_signatory_name || "นายศรายุทธ โกสิยารักษ์"})</p>
              <p className="text-gray-600 text-xs">{values.our_signatory_position || "กรรมการผู้จัดการ / CEO"}</p>
              {values.company_seal !== false && (
                <div className="absolute right-2 top-8 pointer-events-none">
                  <CorporateSeal className="w-20 h-20" opacity={0.88} />
                </div>
              )}
            </div>

            <div className="flex flex-col items-center relative">
              <p className="font-bold mb-1">ตัวแทนจำหน่าย (Reseller)</p>
              <p className="font-bold mb-1">{values.reseller_name || "บริษัท ตัวแทนจำหน่าย จำกัด"}</p>
              <div className="h-16 flex items-center justify-center relative w-full mb-0.5">
                {values.counterparty_signature_image ? (
                  <img
                    src={values.counterparty_signature_image}
                    alt="ลายเซ็นคู่สัญญา"
                    className="max-h-14 max-w-[180px] object-contain select-none z-10"
                  />
                ) : null}
              </div>
              <p className="mb-2">ลงชื่อ ....................................................</p>
              <p className="font-semibold">
                (<Field id="reseller_signatory_name" placeholder="ชื่อผู้มีอำนาจลงนาม" minWidth={16} />)
              </p>
              <p className="text-gray-600 text-xs">
                <Field id="reseller_signatory_position" placeholder="ตำแหน่ง" minWidth={12} />
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  // --------------------------------------------------------------------------
  // 4. Notification Letter - 1 Page
  // --------------------------------------------------------------------------
  if (templateId === "notification") {
    const c = notifContent;
    const effectiveDate = values.effective_date || "16 กันยายน 2569";
    const signatoryName = values.signatory_name || values.our_signatory_name || "นายศรายุทธ โกสิยารักษ์";
    const signatoryPos = values.signatory_position || values.our_signatory_position || "กรรมการผู้จัดการ / CEO";

    return (
      <div className="document-body pt-2 text-[13px] leading-relaxed text-left">
        <div className="text-center mb-4">
          <h1 className="text-lg font-black text-gray-900 leading-tight">
            {c.title?.titleTh || "หนังสือแจ้งเปลี่ยนแปลงที่ตั้งสำนักงานใหญ่"}
          </h1>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {c.title?.titleEn || "NOTICE OF HEAD OFFICE RELOCATION"}
          </p>
        </div>

        <div className="space-y-1 mb-4 text-xs">
          <p>
            <span className="font-semibold text-gray-700">วันที่ / Date:</span>{" "}
            <Field id="doc_date" placeholder="01 กันยายน 2569" minWidth={16} />
          </p>
          <p>
            <span className="font-semibold text-gray-700">เรียน / Attn:</span>{" "}
            <Field id="recipient" placeholder="ท่านคู่ค้า ลูกค้า และพันธมิตรทางธุรกิจทุกท่าน" minWidth={35} />
          </p>
          <p>
            <span className="font-semibold text-gray-700">เรื่อง / Subject:</span>{" "}
            <Field id="subject" placeholder="แจ้งเปลี่ยนแปลงสถานที่ตั้งสำนักงานใหญ่แห่งใหม่" minWidth={35} />
          </p>
        </div>

        <p className="indent-8 mb-3 text-justify">
          {c.bodyParagraphTh || "บริษัท เครสท์ เซนโด จำกัด ขอเรียนแจ้งให้ท่านทราบว่า บริษัทฯ ได้ดำเนินการย้ายสถานที่ตั้งสำนักงานใหญ่แห่งใหม่ เพื่อรองรับการขยายตัวทางธุรกิจและการให้บริการที่มีประสิทธิภาพยิ่งขึ้น โดยมีผลบังคับใช้ตั้งแต่วันที่ 16 กันยายน 2569 เป็นต้นไป"}
        </p>

        {/* Address Comparison Cards */}
        <div className="grid grid-cols-2 gap-3.5 my-3">
          <div className="bg-[#f3f3f4] rounded-xl p-3 border border-gray-200">
            <p className="text-[11px] font-bold text-gray-700 pb-1 mb-1 border-b border-gray-300">
              ที่อยู่เดิม / Previous Address:
            </p>
            <p className="text-[10px] text-gray-800 font-medium">
              45 ซอยโกสุมรวมใจ 37 แขวงดอนเมือง เขตดอนเมือง กรุงเทพมหานคร 10210
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#fff5f5] to-white rounded-xl p-3 border-2 border-[#cb1717]">
            <div className="flex justify-between items-center pb-1 mb-1 border-b border-[#cb1717]/30">
              <span className="text-[11px] font-black text-[#af0e0e]">ที่อยู่ใหม่ / New Address:</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#cb1717] text-white">
                มีผล {effectiveDate}
              </span>
            </div>
            <p className="text-[10px] text-gray-900 font-bold">
              8/40 The Connect 37, ซอยช่างอากาศอุทิศ 10 แยก 1-2 แขวงดอนเมือง เขตดอนเมือง กรุงเทพมหานคร 10210
            </p>
          </div>
        </div>

        <p className="indent-8 mb-6 text-justify">
          {c.closingParagraphTh || "จึงเรียนมาเพื่อโปรดทราบและขอขอบพระคุณทุกท่านที่ให้ความไว้วางใจในการดำเนินธุรกิจร่วมกันด้วยดีเสมอมา"}
        </p>

        {/* Signatory */}
        <div className="text-right flex flex-col items-end pt-4 pr-6">
          <p className="mb-1 text-xs">ขอแสดงความนับถือ</p>
          <div className="h-14 flex items-center justify-end my-1">
            {values.our_signature_image ? (
              <img
                src={values.our_signature_image}
                alt="ลายเซ็น"
                className="max-h-12 max-w-[160px] object-contain select-none"
              />
            ) : null}
          </div>
          <p className="font-bold text-xs">({signatoryName})</p>
          <p className="text-gray-500 text-[11px]">{signatoryPos}</p>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Helper factory to create React component for templateRegistry pages
 */
export function createDynamicContractPage(templateId, pageNumber) {
  const Component = function DynamicPageWrapper(props) {
    return <DynamicContractPage templateId={templateId} pageNumber={pageNumber} {...props} />;
  };
  Component.displayName = `DynamicContractPage_${templateId}_${pageNumber}`;
  return Component;
}
