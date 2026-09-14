"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  FilePlus,
  Folder,
  FileText,
  Copy,
  Gear,
  SignOut,
  SidebarSimple,
} from "@phosphor-icons/react";
import { BrandMark } from "@/components/ui/BrandMark";
import { SettingsNavigation } from "@/components/layout/SettingsNavigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { useLanguage } from "@/context/LanguageContext";

const getNavigationGroups = (t) => [
  {
    title: t('nav.workspace') || "WORKSPACE",
    items: [
      { name: t('nav.dashboard') || "Dashboard", href: "/", icon: SquaresFour, key: "Dashboard" },
      { name: t('nav.createDocument') || "Create Document", href: "/create", icon: FilePlus, highlight: true, key: "Create Document" },
      { name: t('nav.myDocuments') || "My Documents", href: "/documents", icon: Folder, key: "My Documents" },
      { name: t('nav.templates') || "Templates", href: "/templates", icon: Copy, key: "Templates" },
    ],
  },
  {
    title: t('nav.dataAndAssets') || "DATA & ASSETS",
    items: [
      { name: t('nav.dataPresets') || "Data Presets", href: "/profile-data", icon: FileText, key: "Data Presets" },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const settingsMode = pathname.startsWith("/settings");
  const { t } = useLanguage();

  const navigationGroups = getNavigationGroups(t);

  return (
    <Sidebar
      collapsible="icon"
      className="border-none bg-sidebar text-foreground select-none transition-[width] duration-280 ease-[cubic-bezier(0.16,1,0.3,1)]"
    >
      {settingsMode ? (
        /* Settings Mode Navigation (matching tenant-hub SettingsNavigation) */
        <SettingsNavigation collapsed={state === "collapsed"} />
      ) : (
        /* Standard Workspace Navigation */
        <>
          {/* Sidebar Header — 56px height (matching tenant-hub --topbar-height) */}
          <SidebarHeader className="h-14 flex flex-row items-center justify-between px-4 border-b-0 shrink-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <Link
              href="/"
              aria-label={t('nav.workspace') || "Workspace home"}
              className="flex items-center gap-2.5 min-w-0 group-data-[collapsible=icon]:hidden outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar rounded-[6px]"
            >
              <BrandMark />
              <span className="text-base font-medium leading-5 text-sidebar-foreground tracking-tight">
                DocBuilder
              </span>
            </Link>
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={state === "collapsed" ? (t('nav.expandSidebar') || "Expand sidebar") : (t('nav.collapseSidebar') || "Collapse sidebar")}
              title={state === "collapsed" ? (t('nav.expandSidebar') || "Expand sidebar") : (t('nav.collapseSidebar') || "Collapse sidebar")}
              className="size-8 rounded-[6px] text-muted-foreground hover:text-foreground hover:bg-[#EEEEEE] dark:hover:bg-[#242424] transition-colors shrink-0 flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring cursor-pointer"
            >
              <SidebarSimple
                size={19}
                className={`shrink-0 transition-transform duration-200 ${
                  state === "collapsed" ? "rotate-180" : ""
                }`}
              />
            </button>
          </SidebarHeader>

          {/* Sidebar Primary Navigation */}
          <SidebarContent className="px-3 py-2 space-y-3 overflow-y-auto scrollbar-none group-data-[collapsible=icon]:px-1.5">
            {navigationGroups.map((group, groupIdx) => (
              <SidebarGroup key={groupIdx} className="py-0 px-0">
                <SidebarGroupLabel className="text-[11px] font-medium text-muted-foreground tracking-[0.08em] uppercase px-3 py-1 group-data-[collapsible=icon]:hidden">
                  {group.title}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;

                      return (
                        <SidebarMenuItem key={item.key} className="flex justify-center">
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={item.name}
                            className={`relative h-9 text-sm leading-5 rounded-[6px] transition-colors duration-100 outline-none select-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${
                              isActive
                                ? "!bg-white !text-[#171717] font-medium shadow-card hover:!bg-white hover:!text-[#171717] dark:!bg-[#2B2B2B] dark:!text-[#FAFAFA] dark:shadow-none dark:hover:!bg-[#2B2B2B]"
                                : "font-normal text-[#525252] hover:bg-[#EEEEEE] hover:text-[#171717] dark:text-[#A3A3A3] dark:hover:bg-[#242424] dark:hover:text-[#FAFAFA]"
                            } group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center`}
                          >
                            <Link
                              href={item.href}
                              className="flex items-center gap-2 w-full px-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
                            >
                              <Icon
                                size={18}
                                weight={isActive ? "fill" : "regular"}
                                className={`size-[18px] shrink-0 transition-colors ${
                                  isActive
                                    ? "text-[#171717] dark:text-[#FAFAFA]"
                                    : "text-[#737373] group-hover:text-[#171717] dark:group-hover:text-[#FAFAFA]"
                                }`}
                              />
                              <span className="truncate group-data-[collapsible=icon]:hidden leading-normal py-0.5">
                                {item.name}
                              </span>

                              {item.highlight && !isActive && (
                                <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 group-data-[collapsible=icon]:hidden shrink-0">
                                  NEW
                                </span>
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          {/* Sidebar Footer — Workspace utilities matching tenant-hub (Settings & Sign out) */}
          <SidebarFooter className="p-3 border-t border-border/40 group-data-[collapsible=icon]:p-1.5 space-y-1 shrink-0">
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem className="flex justify-center">
                <SidebarMenuButton
                  asChild
                  isActive={settingsMode}
                  tooltip={t('nav.settings') || "Settings"}
                  className={`relative h-9 text-sm leading-5 rounded-[6px] transition-colors duration-100 outline-none select-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${
                    settingsMode
                      ? "!bg-white !text-[#171717] font-medium shadow-card hover:!bg-white hover:!text-[#171717] dark:!bg-[#2B2B2B] dark:!text-[#FAFAFA] dark:shadow-none dark:hover:!bg-[#2B2B2B]"
                      : "font-normal text-[#525252] hover:bg-[#EEEEEE] hover:text-[#171717] dark:text-[#A3A3A3] dark:hover:bg-[#242424] dark:hover:text-[#FAFAFA]"
                  } group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center`}
                >
                  <Link
                    href="/settings/account"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.sessionStorage.setItem("docbuilder-settings-return-path", pathname);
                      }
                    }}
                    className="flex items-center gap-2 w-full px-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
                  >
                    <Gear
                      size={18}
                      weight={settingsMode ? "fill" : "regular"}
                      className={`size-[18px] shrink-0 transition-colors ${
                        settingsMode
                          ? "text-[#171717] dark:text-[#FAFAFA]"
                          : "text-[#737373] group-hover:text-[#171717] dark:group-hover:text-[#FAFAFA]"
                      }`}
                    />
                    <span className="truncate group-data-[collapsible=icon]:hidden leading-normal py-0.5">
                      {t('nav.settings') || "Settings"}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem className="flex justify-center">
                <SidebarMenuButton
                  asChild
                  tooltip={t('nav.signOut') || "Sign out"}
                  className="relative h-9 text-sm leading-5 rounded-[6px] transition-colors duration-100 outline-none select-none font-normal text-[#525252] hover:bg-[#EEEEEE] hover:text-destructive dark:text-[#A3A3A3] dark:hover:bg-[#242424] dark:hover:text-destructive focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
                >
                  <Link
                    href="/login"
                    className="flex items-center gap-2 w-full px-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
                  >
                    <SignOut
                      size={18}
                      className="size-[18px] shrink-0 text-[#737373] group-hover:text-destructive transition-colors"
                    />
                    <span className="truncate group-data-[collapsible=icon]:hidden leading-normal py-0.5">
                      {t('nav.signOut') || "Sign out"}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </>
      )}
    </Sidebar>
  );
}

export default AppSidebar;
