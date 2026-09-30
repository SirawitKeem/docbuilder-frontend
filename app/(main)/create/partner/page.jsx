"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function PartnerRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.get("templateId")) {
      params.set("templateId", "tmpl-partner-standard");
    }
    if (!params.get("categoryId")) {
      params.set("categoryId", "partner");
    }
    router.replace(`/create/custom?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function CreatePartnerPage() {
  return (
    <Suspense fallback={null}>
      <PartnerRedirect />
    </Suspense>
  );
}
