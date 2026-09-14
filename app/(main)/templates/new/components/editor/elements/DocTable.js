"use client";

import * as fabric from "fabric";

export const A4_TABLE_WIDTH = 682;
export const HEADER_HEIGHT = 32;
export const ROW_HEIGHT = 28;
export const SUMMARY_HEIGHT = 84;

export const CUSTOM_CANVAS_PROPS = [
  "id",
  "name",
  "isDocTable",
  "docTableData",
  "rawItems",
  "isPageFooterNumber",
  "isTokenField",
  "tokenKey",
  "rawTemplateText",
  "tokenDefaultValue",
  "lockMovementX",
  "lockMovementY",
  "lockRotation",
  "lockScalingX",
  "lockScalingY",
  "hasControls",
  "selectable",
  "opacity",
  "visible",
  "isUserGroup",
  "originX",
  "originY",
];

// Ensure FabricObject & Group serialize custom properties even with toJSON()
if (fabric && fabric.FabricObject) {
  fabric.FabricObject.customProperties = Array.from(
    new Set([...(fabric.FabricObject.customProperties || []), ...CUSTOM_CANVAS_PROPS])
  );
}
if (fabric && fabric.Group) {
  fabric.Group.customProperties = Array.from(
    new Set([...(fabric.Group.customProperties || []), ...CUSTOM_CANVAS_PROPS])
  );
}

/**
 * Builds the array of Fabric objects for DocTable
 */
export function buildDocTableElements(data) {
  const {
    width = A4_TABLE_WIDTH,
    themeColor = "#0F4C35",
    vatRate = 7,
    cols = [
      { title: "PRODUCT CODE", width: 105, align: "left" },
      { title: "DESCRIPTION", width: 330, align: "left" },
      { title: "QTY", width: 40, align: "center" },
      { title: "PRICE", width: 105, align: "right" },
      { title: "AMOUNT", width: 102, align: "right" },
    ],
    items = [
      { no: "CZ-001", desc: "บริการจัดทำและพัฒนาระบบเอกสารดิจิทัล Enterprise", qty: 1, price: 45000 },
      { no: "CZ-002", desc: "แพ็กเกจพื้นที่จัดเก็บข้อมูลบนคลาวด์และระบบรักษาความปลอดภัย", qty: 1, price: 15000 },
      { no: "CZ-003", desc: "บริการฝึกอบรมการใช้งานและสนับสนุนทางเทคนิครายปี (SLA 99.9%)", qty: 1, price: 12000 },
    ],
  } = data;

  const elements = [];

  // 1. Header Background
  const headerBg = new fabric.Rect({
    left: 0,
    top: 0,
    width,
    height: HEADER_HEIGHT,
    fill: themeColor,
    rx: 4,
    ry: 4,
  });
  elements.push(headerBg);

  // Header Titles
  let currX = 0;
  cols.forEach((col) => {
    const headerText = new fabric.Textbox(col.title, {
      left: currX + (col.align === "left" ? 10 : 0),
      top: 8,
      width: col.width - (col.align === "left" ? 10 : 0),
      fontSize: 10,
      fontWeight: "bold",
      fill: "#FFFFFF",
      fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
      textAlign: col.align,
    });
    elements.push(headerText);
    currX += col.width;
  });

  // 2. Data Rows
  let subtotal = 0;
  items.forEach((item, i) => {
    const rowY = HEADER_HEIGHT + i * ROW_HEIGHT;
    const itemAmount = (Number(item.qty) || 1) * (Number(item.price) || 0);
    subtotal += itemAmount;

    // Row Background (Zebra stripe)
    const rowBg = new fabric.Rect({
      left: 0,
      top: rowY,
      width,
      height: ROW_HEIGHT,
      fill: i % 2 === 0 ? "#FFFFFF" : "#F8FAFC",
      stroke: "#E2E8F0",
      strokeWidth: 0.8,
    });
    elements.push(rowBg);

    // Row Cells
    let cellX = 0;
    const priceFormatted = Number(item.price || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const amountFormatted = itemAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const cellValues = [`${item.no || i + 1}`, item.desc || "รายการ...", `${item.qty || 1}`, priceFormatted, amountFormatted];

    cols.forEach((col, cIdx) => {
      const cellText = new fabric.Textbox(cellValues[cIdx], {
        left: cellX + (col.align === "left" ? 10 : 0),
        top: rowY + 7,
        width: col.width - (col.align === "left" ? 10 : 0),
        fontSize: 11,
        fill: "#1E293B",
        fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
        textAlign: col.align,
      });
      elements.push(cellText);
      cellX += col.width;
    });
  });

  // 3. Summary Block
  const totalY = HEADER_HEIGHT + items.length * ROW_HEIGHT;
  const vatAmount = subtotal * (vatRate / 100);
  const grandTotal = subtotal + vatAmount;

  const summaryBg = new fabric.Rect({
    left: 0,
    top: totalY,
    width,
    height: SUMMARY_HEIGHT,
    fill: "#F1F5F9",
    stroke: "#CBD5E1",
    strokeWidth: 1,
    rx: 4,
    ry: 4,
  });
  elements.push(summaryBg);

  const summaryLabels = [
    { label: "รวมเป็นเงิน (Subtotal):", value: `${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} บาท`, y: totalY + 8, bold: false },
    { label: `ภาษีมูลค่าเพิ่ม (VAT ${vatRate}%):`, value: `${vatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} บาท`, y: totalY + 32, bold: false },
    { label: "จำนวนเงินรวมทั้งสิ้น (Grand Total):", value: `${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} บาท`, y: totalY + 56, bold: true, color: "#1E40AF" },
  ];

  summaryLabels.forEach((s) => {
    const lbl = new fabric.Textbox(s.label, {
      left: width - 360,
      top: s.y,
      width: 200,
      fontSize: 11.5,
      fontWeight: s.bold ? "bold" : "normal",
      fill: s.color || "#334155",
      fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
      textAlign: "right",
    });
    const val = new fabric.Textbox(s.value, {
      left: width - 150,
      top: s.y,
      width: 140,
      fontSize: 11.5,
      fontWeight: s.bold ? "bold" : "normal",
      fill: s.color || "#0F172A",
      fontFamily: "'Noto Sans Thai', 'Noto Sans', sans-serif",
      textAlign: "right",
    });
    elements.push(lbl, val);
  });

  return elements;
}

/**
 * Custom Fabric Class: DocTable
 * Supports dynamic row insertion/removal, VAT adjustments, and clean JSON serialization.
 */
export class DocTable extends fabric.Group {
  static type = "DocTable";

  constructor(data = {}, options = {}) {
    const tableData = {
      width: A4_TABLE_WIDTH,
      themeColor: data.themeColor || "#0F4C35",
      vatRate: data.vatRate !== undefined ? data.vatRate : 7,
      cols: data.cols || [
        { title: "PRODUCT CODE", width: 105, align: "left" },
        { title: "DESCRIPTION", width: 330, align: "left" },
        { title: "QTY", width: 40, align: "center" },
        { title: "PRICE", width: 105, align: "right" },
        { title: "AMOUNT", width: 102, align: "right" },
      ],
      items: data.items && data.items.length > 0 ? data.items : [
        { no: "CZ-001", desc: "บริการจัดทำและพัฒนาระบบเอกสารดิจิทัล Enterprise", qty: 1, price: 45000 },
        { no: "CZ-002", desc: "แพ็กเกจพื้นที่จัดเก็บข้อมูลบนคลาวด์และระบบรักษาความปลอดภัย", qty: 1, price: 15000 },
        { no: "CZ-003", desc: "บริการฝึกอบรมการใช้งานและสนับสนุนทางเทคนิครายปี (SLA 99.9%)", qty: 1, price: 12000 },
      ],
    };

    const elements = buildDocTableElements(tableData);

    // Clean options: strip undefined values so they don't overwrite Fabric defaults with undefined/NaN
    const cleanOptions = {};
    for (const [k, v] of Object.entries(options)) {
      if (v !== undefined) {
        cleanOptions[k] = v;
      }
    }

    super(elements, {
      left: 56,
      top: 320,
      originX: "left",
      originY: "top",
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      subTargetCheck: true,
      ...cleanOptions,
    });

    this.isDocTable = true;
    this.docTableData = tableData;
  }

  // ➕ Add Row Dynamically
  addRow(item = null) {
    const currentItems = [...this.docTableData.items];
    const newNo = `${currentItems.length + 1}`;
    const newItem = item || {
      no: newNo,
      desc: `รายการสินค้าลำดับที่ ${newNo}`,
      qty: 1,
      price: 10000,
    };
    currentItems.push(newItem);
    this.updateTableData({ items: currentItems });
  }

  // ➖ Remove Row Dynamically (Keeps at least 1 row)
  removeRow() {
    if (this.docTableData.items.length <= 1) return;
    const currentItems = this.docTableData.items.slice(0, -1);
    this.updateTableData({ items: currentItems });
  }

  // 🎨 Set Theme Color
  setThemeColor(color) {
    this.updateTableData({ themeColor: color });
  }

  // 🏷️ Set VAT Rate
  setVatRate(rate) {
    this.updateTableData({ vatRate: Number(rate) });
  }

  // 🔄 Rebuild table elements with preserved group position
  updateTableData(partialData) {
    this.docTableData = {
      ...this.docTableData,
      ...partialData,
    };

    // Remove all old elements
    const oldObjects = [...this.getObjects()];
    oldObjects.forEach((obj) => this.remove(obj));

    // Build and add new elements
    const newElements = buildDocTableElements(this.docTableData);
    newElements.forEach((el) => this.add(el));

    if (this.canvas) {
      this.setCoords();
      this.canvas.requestRenderAll();
      if (this.canvas.fire) {
        this.canvas.fire("object:modified", { target: this });
      }
    }
  }

  toObject(propertiesToInclude = []) {
    return super.toObject([
      "isDocTable",
      "docTableData",
      "originX",
      "originY",
      "scaleX",
      "scaleY",
      "angle",
      "lockMovementX",
      "lockMovementY",
      "lockRotation",
      "lockScalingX",
      "lockScalingY",
      "hasControls",
      "selectable",
      "opacity",
      "visible",
      ...propertiesToInclude,
    ]);
  }

  static async fromObject(object) {
    const data = object.docTableData || {
      themeColor: "#2563EB",
      vatRate: 7,
      items: [],
    };
    const cleanOptions = {};
    for (const [k, v] of Object.entries(object)) {
      if (v !== undefined && k !== "docTableData" && k !== "objects") {
        cleanOptions[k] = v;
      }
    }
    const instance = new DocTable(data, {
      left: object.left !== undefined ? object.left : 56,
      top: object.top !== undefined ? object.top : 320,
      originX: object.originX || "left",
      originY: object.originY || "top",
      scaleX: object.scaleX !== undefined ? object.scaleX : 1,
      scaleY: object.scaleY !== undefined ? object.scaleY : 1,
      angle: object.angle !== undefined ? object.angle : 0,
      opacity: object.opacity !== undefined ? object.opacity : 1,
      visible: object.visible !== false,
      lockMovementX: Boolean(object.lockMovementX),
      lockMovementY: Boolean(object.lockMovementY),
      lockRotation: Boolean(object.lockRotation),
      lockScalingX: Boolean(object.lockScalingX),
      lockScalingY: Boolean(object.lockScalingY),
      hasControls: object.hasControls !== undefined ? object.hasControls : !object.lockMovementX,
      selectable: object.selectable !== undefined ? object.selectable : true,
      ...cleanOptions,
    });
    return instance;
  }
}

// Register class with Fabric registry for serialization/deserialization safety
if (fabric.classRegistry) {
  fabric.classRegistry.setClass(DocTable, "DocTable");
  fabric.classRegistry.setClass(DocTable, "docTable");
}

export function createDocTable(options = {}) {
  return new DocTable(options, options);
}