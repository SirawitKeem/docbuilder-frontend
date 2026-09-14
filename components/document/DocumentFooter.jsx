export default function DocumentFooter({ title, pageNumber, totalPages }) {
  const displayTitle = title ? title.toUpperCase() : "NON-DISCLOSURE AGREEMENT";

  return (
    <div className="mt-4 pt-2 shrink-0 w-full">
      <div className="flex items-center justify-between gap-4 w-full">
        {/* Green Bar with Title inside */}
        <div className="flex-1 relative h-5 flex items-center overflow-hidden rounded-xs">
          {/* Main Green Bar with right angled cut */}
          <div
            className="absolute inset-0 bg-[#1B7B51]"
            style={{
              clipPath: "polygon(0 0, 90.8% 0, 90% 100%, 0% 100%)",
            }}
          />
          {/* White Title Text */}
          <span className="relative z-10 text-white text-[10px] font-bold tracking-wider pl-3 truncate max-w-[80%] uppercase">
            {displayTitle}
          </span>
          {/* Black Parallelogram Slash */}
          <div
            className="absolute h-full w-4 bg-[#191919]"
            style={{
              left: "91%",
              clipPath: "polygon(26% 0, 100% 0, 76% 100%, 0% 100%)",
            }}
          />
        </div>

        {/* Page Number - Right Aligned Flush */}
        <span className="text-[11px] font-medium text-gray-800 whitespace-nowrap text-right shrink-0">
          Page {pageNumber} of {totalPages}
        </span>
      </div>
    </div>
  );
}