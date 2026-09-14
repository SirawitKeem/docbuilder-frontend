"use client";

import * as fabric from "fabric";

/**
 * Creates an Official Company Header Block
 */
export function createCompanyHeaderBlock({
  left = 56,
  top = 56,
  width = 682,
  companyName = "บริษัท เดอะ รีโคฟเวอรี่ แอดไวเซอร์ จำกัด",
  companyAddress = "45 ซอยโกสุมรวมใจ 37 แขวงดอนเมือง เขตดอนเมือง กรุงเทพมหานคร 10210",
  taxId = "0105554007189",
  phone = "02-1019884",
}) {
  const elements = [];

  // Company Name
  const nameText = new fabric.Textbox(companyName, {
    left: 70,
    top: 0,
    width: width - 80,
    fontSize: 15,
    fontWeight: "bold",
    fill: "#0F172A",
    fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
  });

  // Company Address & Tax ID
  const addressText = new fabric.Textbox(
    `${companyAddress}\nเลขประจำตัวผู้เสียภาษีอากร ${taxId} (สำนักงานใหญ่) | โทร: ${phone}`,
    {
      left: 70,
      top: 24,
      width: width - 80,
      fontSize: 11,
      lineHeight: 1.4,
      fill: "#475569",
      fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
    }
  );

  // Divider Line below header
  const dividerLine = new fabric.Line([0, 70, width, 70], {
    left: 0,
    top: 70,
    stroke: "#E2E8F0",
    strokeWidth: 1.5,
  });

  elements.push(nameText, addressText, dividerLine);

  return new fabric.Group(elements, {
    left,
    top,
    subTargetCheck: true,
  });
}

/**
 * Creates a Party Info Grid Box (To, Subject, Date)
 */
export function createPartyInfoGrid({
  left = 56,
  top = 160,
  width = 682,
  recipient = "ท่านคู่ค้าและลูกค้าผู้มีอุปการคุณ / Valued Business Partners",
  subject = "แจ้งเปลี่ยนแปลงที่อยู่สำนักงานใหญ่ / Change of Head Office Address",
  docDate = "01 กันยายน 2569",
}) {
  const elements = [];

  const boxBg = new fabric.Rect({
    left: 0,
    top: 0,
    width,
    height: 100,
    fill: "#F8FAFC",
    stroke: "#E2E8F0",
    strokeWidth: 1,
    rx: 6,
    ry: 6,
  });
  elements.push(boxBg);

  const toLabel = new fabric.Textbox("เรียน / To:", {
    left: 16,
    top: 14,
    width: 90,
    fontSize: 12,
    fontWeight: "bold",
    fill: "#334155",
    fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
  });
  const toVal = new fabric.Textbox(recipient, {
    left: 110,
    top: 14,
    width: width - 260,
    fontSize: 12,
    fill: "#0F172A",
    fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
  });

  const dateLabel = new fabric.Textbox("วันที่ / Date:", {
    left: width - 180,
    top: 14,
    width: 70,
    fontSize: 12,
    fontWeight: "bold",
    fill: "#334155",
    fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
    textAlign: "right",
  });
  const dateVal = new fabric.Textbox(docDate, {
    left: width - 105,
    top: 14,
    width: 95,
    fontSize: 12,
    fill: "#0F172A",
    fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
  });

  const subjDivider = new fabric.Line([16, 48, width - 16, 48], {
    left: 16,
    top: 48,
    stroke: "#E2E8F0",
    strokeWidth: 0.8,
  });

  const subjLabel = new fabric.Textbox("เรื่อง / Subject:", {
    left: 16,
    top: 58,
    width: 90,
    fontSize: 12,
    fontWeight: "bold",
    fill: "#334155",
    fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
  });
  const subjVal = new fabric.Textbox(subject, {
    left: 110,
    top: 58,
    width: width - 130,
    fontSize: 12,
    fontWeight: "600",
    fill: "#0F172A",
    fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
  });

  elements.push(toLabel, toVal, dateLabel, dateVal, subjDivider, subjLabel, subjVal);

  return new fabric.Group(elements, {
    left,
    top,
    subTargetCheck: true,
  });
}

/**
 * Creates a Terms & Conditions Box
 */
export function createTermsBox({
  left = 56,
  top = 680,
  width = 682,
}) {
  const elements = [];

  const boxBg = new fabric.Rect({
    left: 0,
    top: 0,
    width,
    height: 100,
    fill: "#FFFBEB",
    stroke: "#FDE68A",
    strokeWidth: 1,
    rx: 6,
    ry: 6,
  });
  elements.push(boxBg);

  const title = new fabric.Textbox("ข้อกำหนดและเงื่อนไข (Terms & Conditions):", {
    left: 16,
    top: 12,
    width: width - 32,
    fontSize: 12,
    fontWeight: "bold",
    fill: "#92400E",
    fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
  });

  const content = new fabric.Textbox(
    "1. กำหนดชำระเงินภายใน 30 วัน นับจากวันที่ได้รับใบแจ้งหนี้\n2. ราคานี้มีผลบังคับใช้ 30 วันนับจากวันที่ออกเอกสาร\n3. ขอสงวนสิทธิ์ในการเปลี่ยนแปลงเงื่อนไขตามข้อตกลงที่ระบุในสัญญาหลัก",
    {
      left: 16,
      top: 34,
      width: width - 32,
      fontSize: 11,
      lineHeight: 1.5,
      fill: "#78350F",
      fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
    }
  );

  elements.push(title, content);

  return new fabric.Group(elements, {
    left,
    top,
    subTargetCheck: true,
  });
}