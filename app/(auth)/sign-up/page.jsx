"use client";

import AuthLayoutShell from "@/components/auth/AuthLayoutShell";
import SignUpForm from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <AuthLayoutShell>
      <SignUpForm />
    </AuthLayoutShell>
  );
}

