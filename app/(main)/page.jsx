"use client";

import { useEffect, useState } from "react";
import HeroSection from "@/components/home/HeroSection";
import TemplateGrid from "@/components/home/TemplateGrid";
import RecentDocumentsTable from "@/components/home/RecentDocumentsTable";

export default function HomePage() {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((u) => setUserName(u?.name || "Admin"))
      .catch(() => setUserName("Admin"));
  }, []);

  return (
    <div className="space-y-6">
      <HeroSection userName={userName} />
      <TemplateGrid />
      <RecentDocumentsTable />
    </div>
  );
}
