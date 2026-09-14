"use client";

import React from "react";
import AppSidebar from "./Sidebar";
import { TopBar } from "./TopBar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function LayoutShell({ children }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-h-screen bg-sidebar text-foreground transition-colors duration-200">
          <TopBar />
          <main className="flex-1 bg-white dark:bg-[#171717] lg:rounded-tl-[16px] lg:border-t lg:border-l lg:border-[#e5e5e5] dark:lg:border-[#262626] p-6 lg:p-8 w-full shadow-2xs transition-[border-radius] duration-280 ease-[cubic-bezier(0.16,1,0.3,1)]">
            <div className="max-w-[1500px] w-full mx-auto">
              {children}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
