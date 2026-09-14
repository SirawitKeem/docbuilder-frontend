"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";

// 4-Point Diamond Sparkle Star
function SparkleStar({ className = "w-4 h-4 text-white fill-white" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C12 6.627 17.373 12 24 12C17.373 12 12 17.373 12 24C12 17.373 6.627 12 0 12C6.627 12 12 6.627 12 0Z" />
    </svg>
  );
}

export default function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="w-full">
      {/* Top Logo */}
      <div className="mb-7">
        <Image
          src="/logo_ally.png"
          alt="Ally Doc"
          width={92}
          height={40}
          priority
          className="h-9 w-auto object-contain select-none"
        />
      </div>

      {/* Title & Subtitle */}
      <div className="mb-6">
        <h1 className="text-[28px] sm:text-[32px] font-black tracking-tight text-gray-900 leading-tight">
          Reset your password
        </h1>
        <p className="mt-1.5 text-[13.5px] text-gray-500 font-normal leading-relaxed">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {submitted ? (
        <div className="space-y-5 py-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold leading-relaxed">
            ✓ We&apos;ve sent a password reset link to <strong className="font-bold text-emerald-900">{email}</strong>. Please check your inbox.
          </div>

          <Link
            href="/login"
            className="w-full h-12 animate-gradient-button flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] select-none text-white font-bold text-[14px]"
          >
            <SparkleStar className="w-4 h-4 text-white fill-white shrink-0" />
            <span>Back to sign in</span>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium animate-in fade-in duration-150">
              {error}
            </div>
          )}

          {/* Email Input */}
          <div>
            <label className="block text-[13px] font-semibold text-gray-800 mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full h-11.5 pl-10 pr-4 bg-white border border-gray-200 rounded-xl text-[13.5px] text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-primary focus:ring-3 focus:ring-primary/15 font-medium shadow-2xs"
              />
            </div>
          </div>

          {/* Primary CTA Submit Button with Flowing Gradient & White Text */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 animate-gradient-button flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] mt-5 select-none"
          >
            <SparkleStar className="w-4 h-4 text-white fill-white shrink-0" />
            <span className="font-bold text-white text-[14px]">
              {loading ? "Sending..." : "Send reset link"}
            </span>
          </button>
        </form>
      )}

      {/* Footer Navigation Link */}
      <div className="mt-8 pt-2 flex items-center gap-1.5 text-xs text-gray-500">
        <ArrowLeft size={14} className="text-gray-400 shrink-0" />
        <span>Remember your password?</span>
        <Link
          href="/login"
          className="font-bold text-primary hover:underline ml-0.5"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

