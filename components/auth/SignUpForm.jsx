"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";

// 4-Point Diamond Sparkle Star
function SparkleStar({ className = "w-4 h-4 text-white fill-white" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C12 6.627 17.373 12 24 12C17.373 12 12 17.373 12 24C12 17.373 6.627 12 0 12C6.627 12 12 6.627 12 0Z" />
    </svg>
  );
}

export default function SignUpForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreeTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);
    setError("");

    setTimeout(() => {
      setLoading(false);
      router.push("/two-step-verification");
    }, 600);
  };

  return (
    <div className="w-full">
      {/* Top Logo */}
      <div className="mb-6">
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
      <div className="mb-5">
        <h1 className="text-[28px] sm:text-[32px] font-black tracking-tight text-gray-900 leading-tight">
          Sign up
        </h1>
        <p className="mt-1 text-[13.5px] text-gray-500 font-normal">
          Create your account to get started.
        </p>
      </div>

      {/* Form Elements */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium animate-in fade-in duration-150">
            {error}
          </div>
        )}

        {/* Full Name Input */}
        <div>
          <label className="block text-[13px] font-semibold text-gray-800 mb-1">
            Full name
          </label>
          <div className="relative">
            <User
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-xl text-[13.5px] text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-primary focus:ring-3 focus:ring-primary/15 font-medium shadow-2xs"
            />
          </div>
        </div>

        {/* Email Input */}
        <div>
          <label className="block text-[13px] font-semibold text-gray-800 mb-1">
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
              className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-xl text-[13.5px] text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-primary focus:ring-3 focus:ring-primary/15 font-medium shadow-2xs"
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-[13px] font-semibold text-gray-800 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
              className="w-full h-11 pl-10 pr-10 bg-white border border-gray-200 rounded-xl text-[13.5px] text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-primary focus:ring-3 focus:ring-primary/15 font-medium shadow-2xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirm Password Input */}
        <div>
          <label className="block text-[13px] font-semibold text-gray-800 mb-1">
            Confirm password
          </label>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              className="w-full h-11 pl-10 pr-10 bg-white border border-gray-200 rounded-xl text-[13.5px] text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-primary focus:ring-3 focus:ring-primary/15 font-medium shadow-2xs"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              title={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Terms Checkbox */}
        <div className="pt-1">
          <label className="flex items-center gap-2 text-xs text-gray-600 select-none cursor-pointer hover:text-gray-900 transition-colors">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
            />
            <span className="text-[12.5px]">
              I agree to the{" "}
              <Link href="/terms" className="font-semibold text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-semibold text-primary hover:underline">
                Privacy Policy
              </Link>
            </span>
          </label>
        </div>

        {/* Primary CTA Submit Button with Flowing Gradient & White Text */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 animate-gradient-button flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] mt-4 select-none"
        >
          <SparkleStar className="w-4 h-4 text-white fill-white shrink-0" />
          <span className="font-bold text-white text-[14.5px] tracking-tight">
            {loading ? "Creating account..." : "Create account"}
          </span>
        </button>
      </form>

      {/* Footer Link */}
      <p className="mt-6 text-center text-xs text-gray-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-bold text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

