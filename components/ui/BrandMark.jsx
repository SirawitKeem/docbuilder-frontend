"use client";

import React from "react";

export function BrandMark({ className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`ally-brand-tile grid size-8 shrink-0 place-items-center ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/ally-mark-white.svg"
        alt="Ally"
        className="relative z-10 size-[23px] select-none"
      />
    </span>
  );
}

export default BrandMark;
