"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FilePlus,
  Copy,
  Sparkle,
} from "@phosphor-icons/react";

import { useLanguage } from "@/context/LanguageContext";

// 4-Point Diamond Sparkle Star (matches Login & Brand style)
function SparkleStar({ className = "w-4 h-4 text-white fill-white" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C12 6.627 17.373 12 24 12C17.373 12 12 17.373 12 24C12 17.373 6.627 12 0 12C6.627 12 12 6.627 12 0Z" />
    </svg>
  );
}

function getFormattedDate() {
  const date = new Date();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export default function HeroSection({ userName }) {
  const { t } = useLanguage();
  const [greeting, setGreeting] = useState(t('greetings.welcomeBack') || "Welcome back");
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    const hour = new Date().getHours();
    let currentGreeting = t('greetings.evening') || "Good evening";
    if (hour >= 5 && hour < 12) currentGreeting = t('greetings.morning') || "Good morning";
    else if (hour >= 12 && hour < 17) currentGreeting = t('greetings.afternoon') || "Good afternoon";
    
    setGreeting(currentGreeting);
    setFormattedDate(getFormattedDate());
  }, [t]);

  return (
    <section className="relative overflow-hidden rounded-[12px] bg-surface border border-border p-6 sm:p-8 shadow-2xs select-none">
      {/* Decorative Subtle Gradient Glow Backdrop on the right */}
      <div
        role="presentation"
        className="pointer-events-none absolute -right-12 -top-12 h-[320px] w-[320px] rounded-full blur-[65px] bg-[radial-gradient(circle,rgba(124,58,237,0.14)_0%,rgba(96,165,250,0.08)_45%,transparent_75%)]"
      />
      <div
        role="presentation"
        className="pointer-events-none absolute right-[18%] -bottom-16 h-[240px] w-[240px] rounded-full blur-[55px] bg-[radial-gradient(circle,rgba(192,132,252,0.12)_0%,rgba(124,58,237,0.06)_50%,transparent_75%)]"
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        {/* Left Side: Greeting, Headline, & Actions */}
        <div className="max-w-xl text-left">
          {/* Top Pill Badge: Greeting & Formatted Date */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-primary text-[11px] font-medium mb-3 shadow-2xs dark:bg-violet-950/40 dark:border-violet-900/50 dark:text-violet-300">
            <Sparkle size={13} weight="fill" className="text-primary shrink-0" />
            <span>{greeting}</span>
            {formattedDate && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <span className="text-muted-foreground font-normal">{formattedDate}</span>
              </>
            )}
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-foreground leading-tight mb-2 font-sans">
            {t('home.headline', { name: userName || 'Keem' }) || `${userName || "Keem"} 👋`}
          </h1>

          {/* Description */}
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-5 font-normal">
            {t('home.description') || "ระบบสร้างจัดการเอกสาร"}
          </p>

          {/* Action Buttons: 2 buttons (Create Document & Templates Catalog) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/create"
              className="primary-button inline-flex items-center gap-2 h-9 px-4 rounded-[8px] text-white font-medium text-xs shadow-xs hover:opacity-95 transition-all cursor-pointer select-none"
            >
              <FilePlus size={16} weight="bold" />
              <span>{t('home.createDocument') || "Create Document"}</span>
            </Link>

            <Link
              href="/templates"
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-[8px] border border-border bg-surface hover:bg-muted text-foreground font-medium text-xs transition-colors cursor-pointer select-none shadow-2xs"
            >
              <Copy size={16} className="text-muted-foreground" />
              <span>{t('home.templatesCatalog') || "Templates Catalog"}</span>
            </Link>
          </div>
        </div>

        {/* Right Side: 3D Document Stack & Digital Seal Graphic */}
        <div className="hidden lg:flex items-center justify-center relative w-[340px] xl:w-[380px] h-[210px] shrink-0 pointer-events-none select-none pr-4">
          {/* Back Card (Quotation Mockup) */}
          <div className="absolute w-[205px] h-[165px] bg-white/80 dark:bg-[#1f1f1f]/85 backdrop-blur-md rounded-2xl border border-purple-200/70 dark:border-purple-900/40 shadow-lg transform translate-x-6 -translate-y-2.5 rotate-[6deg] p-3.5 flex flex-col justify-between opacity-85">
            <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-md bg-blue-500/20 flex items-center justify-center">
                  <span className="text-[9px] font-black text-blue-600">CZ</span>
                </div>
                <span className="text-[10px] font-bold text-foreground">QUOTATION</span>
              </div>
              <span className="text-[8px] font-medium text-muted-foreground">QT-2026-08</span>
            </div>
            <div className="space-y-1.5 py-1">
              <div className="h-1.5 w-3/4 bg-muted rounded-full" />
              <div className="h-1.5 w-full bg-muted/70 rounded-full" />
              <div className="h-1.5 w-1/2 bg-muted/70 rounded-full" />
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-border/50">
              <span className="text-[9px] font-semibold text-muted-foreground">Total</span>
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400">$125,000</span>
            </div>
          </div>

          {/* Front Card (NDA Contract Mockup with Stamp) */}
          <div className="absolute w-[220px] h-[180px] bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-lg rounded-2xl border border-purple-200 dark:border-purple-900/50 shadow-xl transform -translate-x-3 translate-y-1 -rotate-[3deg] p-3.5 flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-purple-100 dark:border-purple-900/40 pb-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-[#F5F3FF] dark:bg-purple-950/40 flex items-center justify-center border border-[#EDE9FE] dark:border-purple-900/30">
                  <SparkleStar className="w-3 h-3 text-primary fill-primary" />
                </div>
                <span className="text-[11px] font-black text-foreground tracking-tight">NDA AGREEMENT</span>
              </div>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300 text-[8px] font-black border border-emerald-100 dark:border-emerald-900/50">
                OFFICIAL
              </span>
            </div>

            {/* Skeleton Paragraph */}
            <div className="space-y-1.5 py-1.5">
              <div className="h-1.5 w-full bg-gradient-to-r from-purple-200/70 to-purple-100 dark:from-purple-800/40 dark:to-purple-900/30 rounded-full" />
              <div className="h-1.5 w-5/6 bg-purple-100/80 dark:bg-purple-900/20 rounded-full" />
              <div className="h-1.5 w-4/5 bg-purple-100/60 dark:bg-purple-900/20 rounded-full" />
              <div className="h-1.5 w-2/3 bg-purple-100/50 dark:bg-purple-900/20 rounded-full" />
            </div>

            {/* Signature & Digital Stamp */}
            <div className="flex items-end justify-between pt-1.5 border-t border-purple-50 dark:border-purple-900/30">
              <div className="space-y-0.5">
                <div className="h-1 w-14 bg-muted rounded-full" />
                <span className="text-[8px] text-muted-foreground font-medium">Crest Zendo Co.</span>
              </div>

              {/* Official Digital Seal Badge */}
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-dashed border-primary bg-violet-50 text-primary dark:bg-violet-950/40 dark:text-violet-300 shadow-2xs rotate-[-5deg]">
                <span className="text-[9px] font-black tracking-wider">SIGNED ✓</span>
              </div>
            </div>
          </div>

          {/* Floating Mini Badge 1: Top Right */}
          <div className="absolute -top-1 right-3 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-md border border-purple-100 dark:border-purple-900/50 shadow-md px-2.5 py-0.5 rounded-full flex items-center gap-1.5 text-[10px] font-bold text-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>4 Templates</span>
          </div>

          {/* Floating Mini Badge 2: Bottom Left */}
          <div className="absolute -bottom-1 left-2 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-md border border-purple-100 dark:border-purple-900/50 shadow-md px-2.5 py-0.5 rounded-full flex items-center gap-1 text-[10px] font-bold text-primary">
            <SparkleStar className="w-3 h-3 text-primary fill-primary" />
            <span>AI Ready</span>
          </div>

          {/* Floating Sparkle Stars */}
          <div className="absolute -top-2 left-6 text-primary animate-pulse">
            <SparkleStar className="w-5 h-5 text-primary fill-primary" />
          </div>
          <div className="absolute bottom-5 right-1 text-[#A855F7] animate-pulse">
            <SparkleStar className="w-3.5 h-3.5 text-[#A855F7] fill-[#A855F7]" />
          </div>
          <div className="absolute top-1/2 -left-2 text-[#60A5FA] animate-pulse">
            <SparkleStar className="w-4 h-4 text-[#60A5FA] fill-[#60A5FA]" />
          </div>
        </div>
      </div>
    </section>
  );
}