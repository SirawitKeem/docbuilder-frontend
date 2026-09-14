"use client";

import AuthLayoutShell from "@/components/auth/AuthLayoutShell";
import TwoStepVerificationForm from "@/components/auth/TwoStepVerificationForm";

export default function TwoStepVerificationPage() {
  return (
    <AuthLayoutShell>
      <TwoStepVerificationForm />
    </AuthLayoutShell>
  );
}

