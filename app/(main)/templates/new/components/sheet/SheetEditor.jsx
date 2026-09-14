"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Save,
  ArrowLeft,
  Download,
  Braces,
  Table,
  Check,
  ChevronDown,
  Sparkles
} from "lucide-react";
import "@fortune-sheet/react/dist/index.css";
import { revertTokensInSheetData } from "@/lib/tokens/sheetTokenEngine";

// Dynamically import FortuneSheet with SSR disabled
const Workbook = dynamic(
  () => import("@fortune-sheet/react").then((mod) => mod.Workbook),
  { ssr: false }
);

const DEFAULT_SHEET_DATA = [
  {
    name: "Summary",
    id: "sheet_01",
    status: 1,
    order: 0,
    row: 30,
    column: 15,
    celldata: [
      // Title
      { r: 0, c: 0, v: { v: "Calculation & Summary Sheet (แบบฟอร์มคำนวณ)", m: "Calculation & Summary Sheet", ct: { t: "s" } } },
      
      // Info Block with Tokens
      { r: 2, c: 0, v: { v: "Customer / Company:", m: "Customer / Company:", ct: { t: "s" } } },
      { r: 2, c: 1, v: { v: "{{customer_name}}", m: "{{customer_name}}", ct: { t: "s" } } },
      { r: 2, c: 3, v: { v: "Document No:", m: "Document No:", ct: { t: "s" } } },
      { r: 2, c: 4, v: { v: "{{quotation_no}}", m: "{{quotation_no}}", ct: { t: "s" } } },

      { r: 3, c: 0, v: { v: "Issue Date:", m: "Issue Date:", ct: { t: "s" } } },
      { r: 3, c: 1, v: { v: "{{issue_date}}", m: "{{issue_date}}", ct: { t: "s" } } },
      { r: 3, c: 3, v: { v: "Contact Person:", m: "Contact Person:", ct: { t: "s" } } },
      { r: 3, c: 4, v: { v: "{{contact_name}}", m: "{{contact_name}}", ct: { t: "s" } } },

      // Table Header (Row 5)
      { r: 5, c: 0, v: { v: "No.", m: "No.", ct: { t: "s" }, bg: "#F1F5F9", bl: 1 } },
      { r: 5, c: 1, v: { v: "Description (รายละเอียดสินค้า/บริการ)", m: "Description", ct: { t: "s" }, bg: "#F1F5F9", bl: 1 } },
      { r: 5, c: 2, v: { v: "Qty", m: "Qty", ct: { t: "s" }, bg: "#F1F5F9", bl: 1 } },
      { r: 5, c: 3, v: { v: "Unit Price (THB)", m: "Unit Price (THB)", ct: { t: "s" }, bg: "#F1F5F9", bl: 1 } },
      { r: 5, c: 4, v: { v: "Amount (THB)", m: "Amount (THB)", ct: { t: "s" }, bg: "#F1F5F9", bl: 1 } },

      // Row 6 (Item 1)
      { r: 6, c: 0, v: { v: 1, m: "1", ct: { t: "n" } } },
      { r: 6, c: 1, v: { v: "Cloud Security & Storage Services", m: "Cloud Security & Storage Services", ct: { t: "s" } } },
      { r: 6, c: 2, v: { v: 2, m: "2", ct: { t: "n" } } },
      { r: 6, c: 3, v: { v: 15000, m: "15,000", ct: { t: "n" } } },
      { r: 6, c: 4, v: { f: "=C7*D7", v: 30000, m: "30,000", ct: { t: "n" } } },

      // Row 7 (Item 2)
      { r: 7, c: 0, v: { v: 2, m: "2", ct: { t: "n" } } },
      { r: 7, c: 1, v: { v: "Monthly Maintenance & Support (SLA 24/7)", m: "Monthly Maintenance & Support", ct: { t: "s" } } },
      { r: 7, c: 2, v: { v: 1, m: "1", ct: { t: "n" } } },
      { r: 7, c: 3, v: { v: 25000, m: "25,000", ct: { t: "n" } } },
      { r: 7, c: 4, v: { f: "=C8*D8", v: 25000, m: "25,000", ct: { t: "n" } } },

      // Row 9 (Subtotal)
      { r: 9, c: 3, v: { v: "Subtotal:", m: "Subtotal:", ct: { t: "s" }, bl: 1 } },
      { r: 9, c: 4, v: { f: "=SUM(E7:E8)", v: 55000, m: "55,000", ct: { t: "n" }, bl: 1 } },

      // Row 10 (VAT 7%)
      { r: 10, c: 3, v: { v: "VAT 7%:", m: "VAT 7%:", ct: { t: "s" } } },
      { r: 10, c: 4, v: { f: "=E10*0.07", v: 3850, m: "3,850", ct: { t: "n" } } },

      // Row 11 (Grand Total)
      { r: 11, c: 3, v: { v: "Grand Total:", m: "Grand Total:", ct: { t: "s" }, bl: 1, bg: "#FEF3C7" } },
      { r: 11, c: 4, v: { f: "=E10+E11", v: 58850, m: "58,850", ct: { t: "n" }, bl: 1, bg: "#FEF3C7" } },
    ]
  }
];

const AVAILABLE_TOKENS = [
  { key: "{{customer_name}}", label: "Customer / Company Name", sample: "บริษัท สยามพารากอน รีเทล จำกัด" },
  { key: "{{quotation_no}}", label: "Document Number", sample: "CZ26090001" },
  { key: "{{issue_date}}", label: "Document Date", sample: "1 กันยายน 2569" },
  { key: "{{contact_name}}", label: "Contact Person", sample: "คุณสมชาย ใจดี" },
  { key: "{{company_name}}", label: "Our Company Name", sample: "บริษัท เครสท์ เซนโด จำกัด" },
  { key: "{{tax_id}}", label: "Tax Identification Number", sample: "0105558073755" },
  { key: "{{grand_total}}", label: "Grand Total Amount", sample: "58,850 THB" },
];

export default function SheetEditor({
  templateName = "New Spreadsheet Template",
  categoryName = "Spreadsheet Forms",
  initialSheetData = null,
  onSave,
  saving = false,
}) {
  const [currentTitle, setCurrentTitle] = useState(templateName);
  const [sheetData, setSheetData] = useState(() => {
    if (Array.isArray(initialSheetData) && initialSheetData.length > 0) {
      return initialSheetData;
    }
    return DEFAULT_SHEET_DATA;
  });

  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const hasUnsavedChangesRef = useRef(false);

  useEffect(() => {
    if (templateName) {
      setCurrentTitle(templateName);
    }
  }, [templateName]);

  useEffect(() => {
    if (initialSheetData && Array.isArray(initialSheetData) && initialSheetData.length > 0) {
      setSheetData(initialSheetData);
    }
  }, [initialSheetData]);

  // Handle Sheet Data Change from FortuneSheet
  const handleSheetChange = useCallback((newData) => {
    setSheetData(newData);
    hasUnsavedChangesRef.current = true;
  }, []);

  // 🛡️ High-Performance Targeted Sanitizer (Scoped strictly to Toolbar & Modal popups - Zero Impact on Grid Typing)
  useEffect(() => {
    const sanitizeNode = (el) => {
      if (!el || !el.getAttribute) return;
      const aria = el.getAttribute("aria-label");
      if (aria && (/[\u4e00-\u9fa5]/.test(aria) || aria.includes("Border: Border") || aria.includes("Merge cells: Merge cells"))) {
        el.setAttribute(
          "aria-label",
          aria
            .replace(/:\s*\u8FB9\u6846\u8BBE\u7F6E/g, "")
            .replace(/:\s*\u5408\u5E76\u5355\u5143\u683C/g, "")
            .replace(/Border:\s*Border/g, "Border")
            .replace(/Merge cells:\s*Merge cells/g, "Merge cells")
            .replace(/\u8FB9\u6846\u8BBE\u7F6E/g, "Border")
            .replace(/\u5408\u5E76\u5355\u5143\u683C/g, "Merge cells")
            .replace(/\u88C1\u526A/g, "Crop")
            .replace(/\u6062\u590D\u539F\u56FE/g, "Restore")
            .replace(/\u5220\u9664/g, "Delete")
        );
      }
      const title = el.getAttribute("title");
      if (title && /[\u4e00-\u9fa5]/.test(title)) {
        el.setAttribute(
          "title",
          title
            .replace(/\u8FB9\u6846\u8BBE\u7F6E/g, "Border")
            .replace(/\u5408\u5E76\u5355\u5143\u683C/g, "Merge cells")
            .replace(/\u88C1\u526A/g, "Crop")
            .replace(/\u6062\u590D\u539F\u56FE/g, "Restore")
            .replace(/\u5220\u9664/g, "Delete")
        );
      }
    };

    // Run once on mount for toolbar buttons
    const runTargetedSanitizer = () => {
      document.querySelectorAll(".fortune-toolbar [aria-label], .fortune-toolbar [title], .luckysheet-modal-controll-btn").forEach(sanitizeNode);
    };
    runTargetedSanitizer();

    // Observe ONLY popup/dialog creation (shallow observation, NOT observing grid/cells)
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.addedNodes.length > 0) {
          runTargetedSanitizer();
          break;
        }
      }
    });

    const fortuneContainer = document.querySelector(".fortune-sheet-container") || document.querySelector("main");
    if (fortuneContainer) {
      observer.observe(fortuneContainer, {
        childList: true,
        subtree: false, // Shallow observation only, completely ignores canvas and cell edits
      });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Save Flow
  const handleSave = () => {
    // 🛡️ Zero-Leakage: Ensure raw tokens are preserved
    const cleanSheetData = revertTokensInSheetData(sheetData);

    if (onSave) {
      onSave({
        name: currentTitle,
        categoryName,
        editorType: "sheet",
        canvasPreset: null,
        sheetData: cleanSheetData,
        pageCount: 0,
        pages: [],
      });
      hasUnsavedChangesRef.current = false;
    }
  };

  // Export .xlsx Flow
  const handleExportXlsx = async () => {
    try {
      setIsExporting(true);
      const res = await fetch("/api/export-xlsx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheetData,
          fileName: `${currentTitle || "Spreadsheet"}.xlsx`,
        }),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentTitle || "Spreadsheet"}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export .xlsx error:", err);
      alert("Failed to export .xlsx file");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToken = (tokenKey) => {
    navigator.clipboard.writeText(tokenKey);
    setCopiedToken(tokenKey);
    setTimeout(() => setCopiedToken(null), 1800);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F8FAFC] overflow-hidden">
      {/* ── TOP TOOLBAR ── */}
      <header className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between shadow-2xs z-30 shrink-0">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3">
          <Link
            href="/templates"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Back to Templates"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <Table size={18} />
            </div>

            <div className="flex flex-col">
              <input
                type="text"
                value={currentTitle}
                onChange={(e) => {
                  setCurrentTitle(e.target.value);
                  hasUnsavedChangesRef.current = true;
                }}
                placeholder="Spreadsheet template name..."
                className="text-sm font-black text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-emerald-500 focus:outline-hidden px-1 py-0.5 transition-colors max-w-sm"
              />
              <span className="text-[10px] font-bold text-gray-400 px-1">
                {categoryName} • Sheets Mode (.xlsx)
              </span>
            </div>
          </div>
        </div>

        {/* Center: Token Inserter & Export Button */}
        <div className="flex items-center gap-2">
          {/* Dynamic Token Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsTokenDropdownOpen(!isTokenDropdownOpen)}
              className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/80 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Braces size={14} />
              <span>Insert Dynamic Tokens</span>
              <ChevronDown size={13} />
            </button>

            {isTokenDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1 mb-1 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-500">Click to Copy Token</span>
                  <Sparkles size={12} className="text-purple-500" />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {AVAILABLE_TOKENS.map((token) => (
                    <button
                      key={token.key}
                      type="button"
                      onClick={() => handleCopyToken(token.key)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <div className="text-xs font-mono font-bold text-purple-700 group-hover:text-purple-800">
                          {token.key}
                        </div>
                        <div className="text-[10px] text-gray-400">{token.label}</div>
                      </div>
                      {copiedToken === token.key ? (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <Check size={12} /> Copied!
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-300 group-hover:text-purple-500">
                          Copy
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Export .xlsx Direct Button */}
          <button
            type="button"
            onClick={handleExportXlsx}
            disabled={isExporting}
            className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Download size={14} className="text-emerald-600" />
            <span>{isExporting ? "Exporting..." : "Download .xlsx"}</span>
          </button>
        </div>

        {/* Right: Save Template */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save size={14} />
            <span>{saving ? "Saving..." : "Save Template"}</span>
          </button>
        </div>
      </header>

      {/* ── MAIN SPREADSHEET CANVAS ── */}
      <main className="flex-1 w-full h-[calc(100vh-3.5rem)] relative overflow-hidden bg-white">
        <Workbook
          data={sheetData}
          onChange={handleSheetChange}
          lang="en"
          showToolbar={true}
          showFormulaBar={true}
          showSheetTabs={true}
          allowEdit={true}
        />
      </main>
    </div>
  );
}