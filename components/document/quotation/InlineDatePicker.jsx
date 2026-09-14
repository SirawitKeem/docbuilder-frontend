"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";

export function formatDateToDisplay(isoOrText) {
  if (!isoOrText) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrText)) {
    const [y, m, d] = isoOrText.split("-");
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"
    ];
    const monthStr = monthNames[parseInt(m, 10) - 1] || m;
    return `${parseInt(d, 10)} ${monthStr} ${y}`;
  }
  return isoOrText;
}

export function parseDisplayToISO(displayStr) {
  if (!displayStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(displayStr)) return displayStr;
  const parsed = Date.parse(displayStr);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return d.toISOString().split("T")[0];
  }
  return "";
}

export default function InlineDatePicker({
  value = "",
  onChange,
  readOnly = false,
  className = "",
  placeholder = "เลือกวันที่...",
}) {
  const [showPicker, setShowPicker] = useState(false);
  const isoValue = parseDisplayToISO(value);
  const displayValue = formatDateToDisplay(value);

  if (readOnly) {
    return <span className={`inline-block ${className}`}>{displayValue}</span>;
  }

  return (
    <div className="relative inline-flex items-center justify-end w-full">
      <input
        type="text"
        value={displayValue}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={`px-1 py-0 rounded outline-none transition-colors duration-150 bg-transparent hover:bg-emerald-50/50 focus:bg-white focus:ring-1 focus:ring-emerald-500 cursor-pointer ${className}`}
      />
      
      {/* Calendar Icon Button */}
      <div className="relative shrink-0 ml-0.5">
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="p-0 text-gray-400 hover:text-emerald-700 transition-colors flex items-center"
          title="เลือกจากปฏิทิน"
        >
          <Calendar size={12} />
        </button>

        {/* Hidden Native Date Input */}
        <input
          type="date"
          value={isoValue}
          onChange={(e) => {
            if (e.target.value) {
              const formatted = formatDateToDisplay(e.target.value);
              onChange?.(formatted);
            }
            setShowPicker(false);
          }}
          className="absolute right-0 top-0 opacity-0 w-5 h-5 cursor-pointer"
        />
      </div>
    </div>
  );
}
