"use client";

import * as fabric from "fabric";

/**
 * Creates a Dual or Single Document Signature Block
 */
export function createSignatureBlock({
  type = "dual", // "dual" | "single"
  left = 56,
  top = 820,
  width = 682,
  primaryColor = "#1E293B",
  ourCompanyName = "บริษัท เครสท์ เซนโด จำกัด",
  ourSignatory = "นายศรายุทธ โกสิยารักษ์",
  ourPosition = "กรรมการผู้จัดการ / CEO",
  counterpartyTitle = "ผู้อนุมัติสั่งซื้อ / ผู้รับข้อมูล",
}) {
  const elements = [];

  if (type === "dual") {
    const colWidth = (width - 60) / 2; // ~311px each column

    // ── LEFT COLUMN: Disclosing / Issuer Party ──
    const leftCardBg = new fabric.Rect({
      left: 0,
      top: 0,
      width: colWidth,
      height: 180,
      fill: "#FAFAFA",
      stroke: "#E2E8F0",
      strokeWidth: 1,
      rx: 6,
      ry: 6,
    });
    elements.push(leftCardBg);

    const leftTitle = new fabric.Textbox(ourCompanyName, {
      left: 10,
      top: 14,
      width: colWidth - 20,
      fontSize: 12,
      fontWeight: "bold",
      fill: primaryColor,
      fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
      textAlign: "center",
    });

    const leftDotted = new fabric.Textbox("ลงชื่อ .....................................................", {
      left: 10,
      top: 85,
      width: colWidth - 20,
      fontSize: 11,
      fill: "#64748B",
      fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
      textAlign: "center",
    });

    const leftName = new fabric.Textbox(`( ${ourSignatory} )`, {
      left: 10,
      top: 112,
      width: colWidth - 20,
      fontSize: 11,
      fontWeight: "600",
      fill: "#1E293B",
      fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
      textAlign: "center",
    });

    const leftPos = new fabric.Textbox(ourPosition, {
      left: 10,
      top: 134,
      width: colWidth - 20,
      fontSize: 10.5,
      fill: "#64748B",
      fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
      textAlign: "center",
    });

    const leftDate = new fabric.Textbox("วันที่: ........ / ........ / ................", {
      left: 10,
      top: 154,
      width: colWidth - 20,
      fontSize: 10,
      fill: "#94A3B8",
      fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
      textAlign: "center",
    });

    elements.push(leftTitle, leftDotted, leftName, leftPos, leftDate);

    // ── RIGHT COLUMN: Receiving / Customer Party ──
    const rightX = colWidth + 60;
    const rightCardBg = new fabric.Rect({
      left: rightX,
      top: 0,
      width: colWidth,
      height: 180,
      fill: "#FAFAFA",
      stroke: "#E2E8F0",
      strokeWidth: 1,
      rx: 6,
      ry: 6,
    });
    elements.push(rightCardBg);

    const rightTitle = new fabric.Textbox(counterpartyTitle, {
      left: rightX + 10,
      top: 14,
      width: colWidth - 20,
      fontSize: 12,
      fontWeight: "bold",
      fill: primaryColor,
      fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
      textAlign: "center",
    });

    const rightDotted = new fabric.Textbox("ลงชื่อ .....................................................", {
      left: rightX + 10,
      top: 85,
      width: colWidth - 20,
      fontSize: 11,
      fill: "#64748B",
      fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
      textAlign: "center",
    });

    const rightName = new fabric.Textbox("( ..................................................... )", {
      left: rightX + 10,
      top: 112,
      width: colWidth - 20,
      fontSize: 11,
      fill: "#1E293B",
      fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
      textAlign: "center",
    });

    const rightPos = new fabric.Textbox("ตำแหน่ง: .................................................", {
      left: rightX + 10,
      top: 134,
      width: colWidth - 20,
      fontSize: 10.5,
      fill: "#64748B",
      fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
      textAlign: "center",
    });

    const rightDate = new fabric.Textbox("วันที่: ........ / ........ / ................", {
      left: rightX + 10,
      top: 154,
      width: colWidth - 20,
      fontSize: 10,
      fill: "#94A3B8",
      fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
      textAlign: "center",
    });

    elements.push(rightTitle, rightDotted, rightName, rightPos, rightDate);
  } else {
    // Single Signature Box
    const singleWidth = 260;
    const singleX = width - singleWidth;

    const singleTitle = new fabric.Textbox("ขอแสดงความนับถือ", {
      left: singleX,
      top: 0,
      width: singleWidth,
      fontSize: 13,
      textAlign: "center",
      fill: "#1E293B",
      fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
    });

    const singleDotted = new fabric.Textbox("( ..................................................... )", {
      left: singleX,
      top: 60,
      width: singleWidth,
      fontSize: 12,
      textAlign: "center",
      fill: "#64748B",
      fontFamily: "monospace",
    });

    const singleName = new fabric.Textbox(`${ourSignatory}\n${ourPosition}`, {
      left: singleX,
      top: 86,
      width: singleWidth,
      fontSize: 12,
      lineHeight: 1.35,
      textAlign: "center",
      fontWeight: "600",
      fill: "#1E293B",
      fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
    });

    elements.push(singleTitle, singleDotted, singleName);
  }

  const sigGroup = new fabric.Group(elements, {
    left,
    top,
    subTargetCheck: true,
  });

  return sigGroup;
}