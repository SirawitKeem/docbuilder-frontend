"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MagnifyingGlass,
  SignOut,
  UserCircle,
  SlidersHorizontal,
  Buildings,
  EnvelopeSimple,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

import { useLanguage } from "@/context/LanguageContext";

export const getDefaultSettingsGroups = (t) => [
  {
    label: t('groups.account') || "Account",
    items: [
      {
        href: "/settings/account",
        label: t('items.accountSecurity') || "Account & Security",
        description: "Personal profile and sign-in credentials",
        icon: UserCircle,
      },
      {
        href: "/settings/preferences",
        label: t('items.preferences') || "Preferences",
        description: "Appearance, theme, and notifications",
        icon: SlidersHorizontal,
      },
    ],
  },
  {
    label: t('groups.organization') || "Organization",
    items: [
      {
        href: "/settings/general",
        label: t('items.general') || "General",
        description: "Company details and authorized signers",
        icon: Buildings,
      },
    ],
  },
  {
    label: t('groups.system') || "System",
    items: [
      {
        href: "/settings/email",
        label: t('items.emailIntegration') || "Email Integration",
        description: "SMTP connection and delivery status",
        icon: EnvelopeSimple,
      },
    ],
  },
];

export function SettingsNavigation({
  groups,
  onBack,
  onSignOut,
  onNavigate,
  collapsed = false,
  backLabel,
}) {
  const { t } = useLanguage();
  const activeGroups = groups || getDefaultSettingsGroups(t);
  const activeBackLabel = backLabel || t('nav.backToWorkspace') || "Back to workspace";
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      const returnPath = typeof window !== "undefined"
        ? window.sessionStorage.getItem("docbuilder-settings-return-path")
        : null;
      const target = returnPath && !returnPath.startsWith("/settings") ? returnPath : "/";
      router.push(target);
    }
  };

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
    } else {
      router.push("/login");
    }
  };

  const filtered = activeGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        `${item.label} ${item.description}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
    }))
    .filter((group) => group.items.length);

  const sidebarButtonClass =
    "group flex h-9 items-center gap-2.5 rounded-[6px] px-3 text-sm font-normal leading-5 outline-none transition-colors duration-100 focus-visible:ring-2 focus-visible:ring-sidebar-ring";
  const sidebarButtonInactiveClass =
    "text-[#525252] hover:bg-[#EEEEEE] hover:text-[#171717] dark:text-[#A3A3A3] dark:hover:bg-[#242424] dark:hover:text-[#FAFAFA]";
  const sidebarButtonActiveClass =
    "!bg-white !text-[#171717] font-medium shadow-card hover:!bg-white hover:!text-[#171717] dark:!bg-[#2B2B2B] dark:!text-[#FAFAFA] dark:shadow-none dark:hover:!bg-[#2B2B2B]";

  return (
    <div className="flex min-h-0 flex-1 flex-col h-full select-none">
      {/* Top action: Back button and search */}
      <div className={cn("pt-4", collapsed ? "px-2" : "px-3")}>
        <button
          type="button"
          onClick={handleBack}
          title={collapsed ? activeBackLabel : undefined}
          className={cn(
            sidebarButtonClass,
            sidebarButtonInactiveClass,
            "w-full cursor-pointer",
            collapsed && "justify-center px-0",
          )}
        >
          <ArrowLeft
            size={16}
            className="shrink-0 text-[#737373] group-hover:text-[#171717] dark:group-hover:text-[#FAFAFA] transition-colors"
          />
          <span className={cn("truncate font-medium text-xs text-foreground", collapsed && "sr-only")}>
            {activeBackLabel}
          </span>
        </button>

        {!collapsed && (
          <div className="relative mt-3">
            <MagnifyingGlass
              size={14}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              aria-label={t('settings.searchPlaceholder') || "Search settings"}
              placeholder={t('settings.searchPlaceholder') || "Search settings..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setSearch("");
                if (e.key === "Enter" && filtered[0]?.items[0]) {
                  router.push(filtered[0].items[0].href);
                  setSearch("");
                  onNavigate?.();
                }
              }}
              className="h-8 w-full rounded-[6px] border border-border/80 bg-white dark:bg-[#202020] pl-8 pr-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/20 shadow-2xs"
            />
          </div>
        )}
      </div>

      {/* Nav List with Settings Groups */}
      <nav
        aria-label="Settings navigation"
        className={cn(
          "min-h-0 flex-1 overflow-y-auto pb-4 pt-4 space-y-4 scrollbar-none",
          collapsed ? "px-1.5" : "px-3",
        )}
      >
        {filtered.map((group) => (
          <div key={group.label} className="space-y-1">
            <p
              className={cn(
                "px-3 pb-1 text-[11px] font-medium text-muted-foreground tracking-[0.08em] uppercase",
                collapsed && "sr-only",
              )}
            >
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    sidebarButtonClass,
                    active ? sidebarButtonActiveClass : sidebarButtonInactiveClass,
                    "w-full",
                    collapsed && "justify-center px-0 size-9",
                  )}
                >
                  <Icon
                    size={18}
                    weight={active ? "fill" : "regular"}
                    className={cn(
                      "size-[18px] shrink-0 transition-colors",
                      active
                        ? "text-[#171717] dark:text-[#FAFAFA]"
                        : "text-[#737373] group-hover:text-[#171717] dark:group-hover:text-[#FAFAFA]",
                    )}
                  />
                  <span className={cn("truncate text-sm py-0.5", collapsed && "sr-only")}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}

        {!collapsed && !filtered.length && (
          <p className="px-3 py-4 text-xs text-muted-foreground text-center">
            No settings found.
          </p>
        )}
      </nav>

      {/* Bottom utility: Sign out */}
      <div className={cn("pb-4 pt-2 border-t border-border/50", collapsed ? "px-1.5" : "px-3")}>
        <button
          type="button"
          onClick={handleSignOut}
          title={collapsed ? (t('nav.signOut') || "Sign out") : undefined}
          className={cn(
            sidebarButtonClass,
            sidebarButtonInactiveClass,
            "w-full cursor-pointer",
            collapsed && "justify-center px-0 size-9",
          )}
        >
          <SignOut
            size={18}
            className="size-[18px] shrink-0 text-[#737373] group-hover:text-destructive transition-colors"
          />
          <span className={cn("truncate text-sm text-muted-foreground group-hover:text-destructive transition-colors", collapsed && "sr-only")}>
            {t('nav.signOut') || "Sign out"}
          </span>
        </button>
      </div>
    </div>
  );
}

export default SettingsNavigation;
