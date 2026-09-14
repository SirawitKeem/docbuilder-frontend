"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

// 4-Point Diamond Sparkle Star
function SparkleStar({ className = "w-4 h-4 text-white fill-white" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C12 6.627 17.373 12 24 12C17.373 12 12 17.373 12 24C12 17.373 6.627 12 0 12C6.627 12 12 6.627 12 0Z" />
    </svg>
  );
}

export default function TwoStepVerificationForm() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [trustDevice, setTrustDevice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance focus to next input box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError("");

    setTimeout(() => {
      setLoading(false);
      router.push("/");
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
          Two-step verification
        </h1>
        <p className="mt-1 text-[13.5px] text-gray-500 font-normal leading-relaxed">
          Enter the 6-digit code from your authenticator app to continue.
        </p>
      </div>

      {/* Form Elements */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium animate-in fade-in duration-150">
            {error}
          </div>
        )}

        {/* 6 OTP Input Boxes */}
        <div>
          <label className="block text-[13px] font-semibold text-gray-800 mb-2">
            Verification code
          </label>
          <div className="grid grid-cols-6 gap-2 sm:gap-2.5 on-paste={handlePaste}">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                autoFocus={idx === 0}
                className="w-full h-13 sm:h-14 text-center text-xl font-extrabold text-gray-900 bg-white border border-gray-200 rounded-xl focus:border-primary focus:ring-3 focus:ring-primary/15 outline-none transition-all shadow-2xs"
              />
            ))}
          </div>
        </div>

        {/* Options: Trust device & Backup code */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 text-gray-600 select-none cursor-pointer hover:text-gray-900 transition-colors">
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
            />
            <span className="font-medium text-[13px] text-gray-700">Trust this device for 30 days</span>
          </label>
          <button
            type="button"
            onClick={() => alert("Enter your backup code in the boxes above.")}
            className="font-semibold text-[13px] text-primary hover:underline cursor-pointer"
          >
            Use backup code
          </button>
        </div>

        {/* Primary CTA Submit Button with Flowing Gradient & White Text */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 animate-gradient-button flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] mt-4 select-none"
        >
          <SparkleStar className="w-4 h-4 text-white fill-white shrink-0" />
          <span className="font-bold text-white text-[14.5px] tracking-tight">
            {loading ? "Verifying..." : "Verify and continue"}
          </span>
        </button>
      </form>

      {/* Back Link */}
      <div className="mt-6 flex items-center gap-1.5 text-xs text-gray-500">
        <ArrowLeft size={14} className="text-gray-400 shrink-0" />
        <Link
          href="/login"
          className="font-bold text-primary hover:underline"
        >
          Back to sign in
        </Link>
      </div>

      {/* Security Info Card */}
      <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-purple-50/70 to-blue-50/50 border border-purple-100/70 flex items-start gap-3.5 shadow-2xs">
        <div className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center shrink-0 border border-purple-100 shadow-2xs">
          <ShieldCheck size={16} />
        </div>
        <div>
          <h4 className="text-[13px] font-bold text-gray-900 leading-tight">
            Your security matters
          </h4>
          <p className="text-[11.5px] text-gray-500 font-normal leading-relaxed mt-0.5">
            Two-step verification adds an extra layer of protection to keep your account secure.
          </p>
        </div>
      </div>
    </div>
  );
}

