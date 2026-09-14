"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function AuthBackButton({ href = "/login", label = "Back" }) {
  return (
    <Link
      href={href}
      className="absolute top-4 left-4 sm:top-5 sm:left-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer z-30"
    >
      <ChevronLeft size={15} />
      <span>{label}</span>
    </Link>
  );
}
