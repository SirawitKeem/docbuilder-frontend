"use client";

import { useState } from "react";

export default function InlineTextField({
  value = "",
  onChange,
  placeholder = "",
  readOnly = false,
  className = "",
  type = "text",
  numeric = false,
  multiline = false,
  style = {},
}) {
  const [focused, setFocused] = useState(false);
  const isEmpty = value === undefined || value === null || value === "";

  const isUnderlined = typeof value === "string" && (value.includes("<u>") || value.includes("</u>"));
  const cleanValue = typeof value === "string" ? value.replace(/<\/?u>/g, "") : value;

  if (readOnly) {
    if (isEmpty) {
      return (
        <span
          style={{ textRendering: "optimizeLegibility", ...style }}
          className={`inline-block select-none opacity-0 ${className}`}
        >
          &nbsp;
        </span>
      );
    }
    const isBlock = /\bblock\b/.test(className);
    return (
      <span
        style={{ textRendering: "optimizeLegibility", ...(isBlock ? { display: "block" } : {}), ...style }}
        className={`px-0.5 py-0 ${multiline ? "whitespace-pre-line" : ""} ${isUnderlined ? "font-bold" : ""} ${className}`}
      >
        {cleanValue}
      </span>
    );
  }

  const isWhiteText = /\btext-white\b/.test(className);
  const hasCustomWidth = /\bw-\[|\bw-auto\b|\bw-\d+/.test(className);

  const baseStateClasses = focused
    ? isWhiteText
      ? "bg-black/20 ring-1 ring-white/70 shadow-2xs"
      : "bg-white ring-1 ring-emerald-500 shadow-2xs"
    : "bg-transparent hover:bg-emerald-50/40";

  const widthClass = hasCustomWidth ? "" : "w-full max-w-full";

  if (multiline) {
    return (
      <textarea
        value={value || ""}
        placeholder={placeholder}
        rows={1}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          textRendering: "optimizeLegibility",
          WebkitAppearance: "none",
          appearance: "none",
          ...style,
        }}
        className={`px-0.5 py-0 rounded outline-none transition-colors duration-150 resize-none ${widthClass} ${baseStateClasses} ${isUnderlined ? "font-bold" : ""} ${className}`}
      />
    );
  }

  return (
    <input
      type={type}
      value={value === undefined || value === null ? "" : value}
      placeholder={placeholder}
      onChange={(e) => onChange?.(numeric ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        textRendering: "optimizeLegibility",
        WebkitAppearance: "none",
        appearance: "none",
        ...style,
      }}
      className={`px-0.5 py-0 rounded outline-none transition-colors duration-150 ${widthClass} placeholder:text-gray-300 placeholder:font-normal ${baseStateClasses} ${isUnderlined ? "font-bold" : ""} ${className}`}
    />
  );
}
