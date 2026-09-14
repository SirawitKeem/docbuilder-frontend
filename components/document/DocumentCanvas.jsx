"use client";

import DocumentHeader from "./DocumentHeader";
import DocumentFooter from "./DocumentFooter";

// A4 ratio 210 x 297mm — 794 x 1123px ที่ 96dpi
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

export default function DocumentCanvas({
  logo,
  footerTitle,
  currentPage,
  totalPages,
  zoom = 100,
  hasHeader = true,
  hasFooter = true,
  children,
}) {
  return (
    <div className="flex-1 overflow-auto bg-gray-100 flex justify-center py-8">
      <div
        style={{
          width: A4_WIDTH,
          transform: `scale(${zoom / 100})`,
          transformOrigin: "top center",
        }}
      >
        <div
          className="bg-white shadow-document"
          style={{ width: A4_WIDTH, minHeight: A4_HEIGHT, height: A4_HEIGHT }}
        >
          <div
            className="flex flex-col font-noto-looped overflow-hidden"
            style={{
              padding: `${hasHeader ? "28px" : "0px"} 48px ${hasFooter ? "28px" : "0px"} 48px`,
              height: A4_HEIGHT,
              boxSizing: "border-box",
            }}
          >
            {hasHeader && <DocumentHeader logo={logo} />}
            <div className="flex-1 min-h-0 flex flex-col">{children}</div>
            {hasFooter && (
              <DocumentFooter
                title={footerTitle}
                pageNumber={currentPage}
                totalPages={totalPages}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}