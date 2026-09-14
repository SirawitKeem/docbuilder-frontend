"use client";

import AuthBackButton from "@/components/ui/AuthBackButton";
import Antigravity from "@/components/auth/Antigravity";

// Dual Sparkle Stars above Ally DOC Header (matches image reference)
function DualSparkleIcon({ className = "w-6 h-6 text-primary" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M16.5 1C16.5 5.694 20.306 9.5 25 9.5C20.306 9.5 16.5 13.306 16.5 18C16.5 13.306 12.694 9.5 8 9.5C12.694 9.5 16.5 5.694 16.5 1Z" />
      <path d="M7 14.5C7 17.538 9.462 20 12.5 20C9.462 20 7 22.462 7 25.5C7 22.462 4.538 20 1.5 20C4.538 20 7 17.538 7 14.5Z" />
    </svg>
  );
}

// 4-Point Diamond Sparkle Star
function SparkleStar({ className = "w-4 h-4 text-primary" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C12 6.627 17.373 12 24 12C17.373 12 12 17.373 12 24C12 17.373 6.627 12 0 12C6.627 12 12 6.627 12 0Z" />
    </svg>
  );
}

// AI-Powered Automation (8-Point Geometric Star)
function AiSparkleIcon({ className = "w-5 h-5 text-primary" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m12 2.5-2.2 6.3a2 2 0 0 1-1.2 1.2L2.5 12l6.1 2a2 2 0 0 1 1.2 1.2l2.2 6.3 2.2-6.3a2 2 0 0 1 1.2-1.2l6.1-2-6.1-2a2 2 0 0 1-1.2-1.2L12 2.5Z" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

// Smart Templates Card Icon
function TemplateCardIcon({ className = "w-5 h-5 text-[#3B66FF]" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="18" x="3" y="3" rx="4" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
      <circle cx="6" cy="6" r="0.75" fill="currentColor" />
    </svg>
  );
}

// Secure & Reliable Shield Icon
function SecurityShieldIcon({ className = "w-5 h-5 text-[#6366F1]" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default function AuthLayoutShell({
  children,
  showBack = false,
  backHref = "/login",
}) {
  return (
    <main className="h-screen w-screen bg-[#FBFBFE] text-foreground antialiased font-sans flex items-center justify-center p-0 m-0 overflow-hidden select-none">
      {/* Main Container: calc(100vw - 24px) × calc(100vh - 24px) with rounded-[14px] */}
      <div
        className="w-[calc(100vw-24px)] h-[calc(100vh-24px)] rounded-[14px] border border-[#EAEAEA] bg-white grid grid-cols-1 lg:grid-cols-2 overflow-hidden shadow-xs relative"
        style={{ margin: "12px" }}
      >
        {/* Left Panel: Clean Sign-in Form (50% Width on Desktop) */}
        <div className="flex flex-col justify-center items-center px-6 sm:px-12 lg:px-16 py-8 relative bg-white overflow-y-auto z-10">
          {/* Optional Back Button */}
          {showBack && (
            <div className="absolute top-6 left-6">
              <AuthBackButton href={backHref} label="Back" />
            </div>
          )}

          <div className="w-full max-w-[420px] my-auto">
            {children}
          </div>
        </div>

        {/* Right Panel: AI Product Introduction & Antigravity 3D Particle Canvas */}
        <div className="relative hidden lg:flex flex-col justify-center px-12 xl:px-18 py-12 bg-white border-l border-[#F0F0F3] overflow-hidden select-none">

          {/* ========================================================= */}
          {/* ANTIGRAVITY 3D CONIC PARTICLE EFFECT (COMPACT & RESPONSIVE)*/}
          {/* ========================================================= */}
          <Antigravity
            count={280}
            magnetRadius={12}
            ringRadius={5.8}
            waveSpeed={0.6}
            waveAmplitude={0.8}
            particleSize={0.85}
            lerpSpeed={0.035}
            autoAnimate
            particleVariance={1}
            rotationSpeed={0.2}
            depthFactor={0.5}
            pulseSpeed={1.8}
            particleShape="capsule"
            fieldStrength={10}
          />

          {/* Soft Diffuse Glow Backdrop for Rich Depth */}
          <div
            role="presentation"
            className="pointer-events-none absolute right-[-5%] top-[25%] h-[420px] w-[420px] rounded-full blur-[65px] bg-[radial-gradient(circle,rgba(124,58,237,0.30)_0%,rgba(192,132,252,0.15)_45%,transparent_90%)]"
          />

          {/* Decorative Subtle Arc in Bottom-Right Corner */}
          <div
            role="presentation"
            className="absolute -bottom-24 -right-24 w-[520px] h-[520px] rounded-full border-[1.5px] border-white pointer-events-none drop-shadow-xs z-10"
          />

          {/* Right Panel Main Content */}
          <div className="relative z-10 space-y-6 max-w-md">
            {/* Brand Header */}
            <div>
              <div className="flex items-center gap-1.5 mb-3.5">
                <span className="text-[30px] sm:text-[34px] font-black tracking-tight text-gray-900 font-sans">
                  Ally DOC
                </span>
                <DualSparkleIcon className="w-6 h-6 text-primary shrink-0 mb-3.5" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F0F2FF] border border-[#DDE2FF] text-[#4F46E5] text-[12px] font-semibold shadow-2xs">
                <SparkleStar className="w-3 h-3 text-[#4F46E5] shrink-0" />
                <span>AI-Powered Document Automation</span>
              </div>
            </div>

            {/* Headline */}
            <div>
              <h2 className="text-3xl xl:text-[38px] font-black tracking-tight leading-[1.16]">
                <span className="bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#60A5FA] bg-clip-text text-transparent block">
                  Smart templates.
                </span>
                <span className="bg-gradient-to-r from-[#2563EB] via-[#6366F1] to-[#A855F7] bg-clip-text text-transparent block">
                  Smarter workflows.
                </span>
              </h2>
              <p className="mt-3 text-xs xl:text-[14px] text-gray-500 font-normal leading-relaxed max-w-sm">
                Build, manage, and automate your documents with AI intelligence and beautiful templates.
              </p>
            </div>

            {/* Feature Highlights List */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-full bg-violet-50 border border-violet-100 text-primary flex items-center justify-center shrink-0 shadow-2xs">
                  <AiSparkleIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xs xl:text-sm font-bold text-gray-900 leading-snug">
                    AI-Powered Automation
                  </h3>
                  <p className="text-[12px] text-gray-500 font-normal mt-0.5">
                    Let AI handle repetitive document tasks
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[#3B82F6] flex items-center justify-center shrink-0 shadow-2xs">
                  <TemplateCardIcon className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <div>
                  <h3 className="text-xs xl:text-sm font-bold text-gray-900 leading-snug">
                    Smart Templates
                  </h3>
                  <p className="text-[12px] text-gray-500 font-normal mt-0.5">
                    Professional templates for every need
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-full bg-[#EEF2FF] border border-[#E0E7FF] text-[#6366F1] flex items-center justify-center shrink-0 shadow-2xs">
                  <SecurityShieldIcon className="w-5 h-5 text-[#6366F1]" />
                </div>
                <div>
                  <h3 className="text-xs xl:text-sm font-bold text-gray-900 leading-snug">
                    Secure & Reliable
                  </h3>
                  <p className="text-[12px] text-gray-500 font-normal mt-0.5">
                    Enterprise-grade security you can trust
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}