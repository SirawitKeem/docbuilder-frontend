"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export default function InlineTermSelect({
  value = "",
  onChange,
  readOnly = false,
  className = "",
  options = ["7 days", "14 days", "30 days", "45 days", "60 days", "90 days"],
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (readOnly) {
    return <span className={`inline-block ${className}`}>{value}</span>;
  }

  return (
    <div ref={containerRef} className="relative inline-flex items-center justify-end w-full">
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        className={`px-1 py-0 rounded outline-none transition-colors duration-150 bg-transparent hover:bg-emerald-50/50 focus:bg-white focus:ring-1 focus:ring-emerald-500 ${className}`}
      />
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-0 text-gray-400 hover:text-emerald-700 transition-colors shrink-0 ml-0.5 flex items-center"
        title="เลือกเงื่อนไข"
      >
        <ChevronDown size={11} />
      </button>

      {/* Preset Term Options Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50 min-w-[90px] text-xs font-sans animate-in fade-in duration-100">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange?.(opt);
                setIsOpen(false);
              }}
              className="w-full text-right px-3 py-1 text-[11px] text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
