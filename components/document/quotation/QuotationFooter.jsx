import { useContext } from "react";
import { Globe } from "lucide-react";
import { quotationTemplate } from "@/lib/templates/quotation/schema";
import { QuotationDataContext } from "@/context/QuotationDataContext";
import InlineTextField from "./InlineTextField";

export default function QuotationFooter({ pageNumber = 1, totalPages = 1, issuerData }) {
  const quotationCtx = useContext(QuotationDataContext);

  const readOnly = quotationCtx ? quotationCtx.readOnly : true;
  const updateIssuer = quotationCtx ? quotationCtx.updateIssuer : () => {};

  const defaultIssuer = quotationTemplate.issuer;
  const issuer = { ...defaultIssuer, ...(issuerData || {}) };

  return (
    <div className="w-full text-sans shrink-0 pt-1" style={{ breakInside: "avoid" }}>
      {/* Top Contacts Section (Website) */}
      <div className="border-t border-gray-300 pt-1.5 pb-1.5 flex items-center justify-center gap-8 text-[10px] text-gray-800">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-[#0B5D39] text-white flex items-center justify-center shrink-0">
            <Globe size={9} />
          </div>
          <InlineTextField
            value={issuer.website}
            onChange={(v) => updateIssuer("website", v)}
            readOnly={readOnly}
            className="font-semibold text-gray-800 text-[9.5px]"
          />
        </div>
      </div>

      {/* Bottom Dark Green Bar with Slanted White Page Number Badge */}
      <div className="bg-[#0B5D39] h-6 text-white flex items-center justify-between pl-3 overflow-hidden relative font-sans rounded-2xs">
        <div className="flex-1 pr-4 min-w-0">
          <InlineTextField
            value={issuer.tagline !== undefined ? issuer.tagline : "PARTNER IN PERFORMANCE, COMMITTED TO YOUR SUCCESS"}
            onChange={(v) => updateIssuer("tagline", v)}
            readOnly={readOnly}
            placeholder="สโลแกน / ข้อความท้ายหน้า (เว้นว่างได้)..."
            className="font-extrabold text-[9px] tracking-wider uppercase text-white placeholder:text-white/40 block w-full truncate"
          />
        </div>

        {/* Slanted White Page Counter Tab */}
        <div className="h-full flex items-center pl-5 pr-4 bg-white text-gray-900 relative clip-slanted shadow-2xs shrink-0">
          <span className="font-bold text-[10px] tracking-wide text-gray-900 font-sans">
            Page {pageNumber} of {totalPages}
          </span>
        </div>
      </div>

      <style jsx>{`
        .clip-slanted {
          clip-path: polygon(10px 0, 100% 0, 100% 100%, 0 100%);
        }
      `}</style>
    </div>
  );
}