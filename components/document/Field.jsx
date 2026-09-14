"use client";

import { useState } from "react";
import { useDocumentField } from "@/context/DocumentFieldsContext";

// คำนวณความกว้างตัวอักษรภาษาไทยโดยตัดสระบน/ล่าง และวรรณยุกต์ (Zero-width diacritics) ออก
function getThaiVisualWidth(str) {
  if (!str) return 0;
  const baseChars = str.replace(/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g, "");
  return baseChars.length;
}

export default function Field({ id, placeholder, type = "text", minWidth = 4 }) {
  const { value, setValue, readOnly } = useDocumentField(id);
  const [focused, setFocused] = useState(false);
  const isEmpty = !value;

  // โหมด Review / Print / PDF — แสดงเป็นข้อความในเนื้อเอกสารจริง
  if (readOnly) {
    if (isEmpty) {
      return <span className="inline-block border-b border-gray-400 min-w-[3ch] px-0.5">&nbsp;</span>;
    }
    return type === "textarea" ? (
      <span className="whitespace-pre-line font-inherit" style={{ textRendering: "optimizeLegibility" }}>{value}</span>
    ) : (
      <span className="font-inherit" style={{ textRendering: "optimizeLegibility" }}>{value}</span>
    );
  }

  const stateClasses = focused
    ? "border-primary-500 bg-white ring-1 ring-primary-300"
    : isEmpty
    ? "border-b border-dashed border-primary-400 bg-primary-50/60 hover:bg-primary-100/80"
    : "border-b border-primary-300 bg-primary-50/40 hover:bg-primary-100/60";

  if (type === "textarea") {
    const visualLen = getThaiVisualWidth(value);
    const placeholderLen = getThaiVisualWidth(placeholder);
    const calcWidth = value
      ? Math.max(minWidth || 10, visualLen + 0.2)
      : Math.max(minWidth || 10, placeholderLen + 0.2);

    return (
      <textarea
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        rows={1}
        style={{
          width: `${Math.min(calcWidth, 55)}ch`,
          textRendering: "optimizeLegibility",
          WebkitAppearance: "none",
          appearance: "none",
        }}
        className={`inline-block align-baseline max-w-full px-0.5 py-0 mx-0 rounded-2xs outline-none transition-colors duration-150 resize-y text-inherit font-inherit leading-normal ${stateClasses}`}
      />
    );
  }

  // คำนวณความกว้างอินพุทให้ฟิตพอดีกับตัวอักษร ไม่กินพื้นที่บรรทัดจนดันข้อความขึ้นบรรทัดใหม่ต่างจากโหมด Preview
  const visualLen = getThaiVisualWidth(value);
  const placeholderLen = getThaiVisualWidth(placeholder);
  const calcWidth = value
    ? Math.max(minWidth || 2, visualLen + 0.1)
    : Math.max(minWidth || 2, placeholderLen + 0.1);

  return (
    <input
      type="text"
      value={value || ""}
      placeholder={placeholder}
      onChange={(e) => setValue(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: `${calcWidth}ch`,
        textRendering: "optimizeLegibility",
        WebkitAppearance: "none",
        appearance: "none",
      }}
      className={`inline-block align-baseline max-w-full px-0.5 py-0 mx-0 rounded-2xs outline-none transition-colors duration-150 text-inherit font-inherit ${stateClasses}`}
    />
  );
}