"use client";

import AuthLayoutShell from "@/components/auth/AuthLayoutShell";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthLayoutShell>
      <LoginForm />
    </AuthLayoutShell>
  );
}
