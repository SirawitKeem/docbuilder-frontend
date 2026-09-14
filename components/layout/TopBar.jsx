"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Search,
  Moon,
  Sun,
  Bell,
  BellOff,
  FileText,
  Plus,
  FolderOpen,
  LayoutGrid,
  Settings,
  LogOut,
  User,
  Clock,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  Send,
  Download,
  CopyPlus,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

import { useLanguage } from "@/context/LanguageContext";

export function TopBar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [openCommand, setOpenCommand] = useState(false);
  const { t } = useLanguage();
  const [userProfile, setUserProfile] = useState({
    fullName: "สิรวิทย์ เพชรจำรัส",
    email: "keem@crestzendo.com",
    avatar: "",
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.account) {
          setUserProfile({
            fullName: data.account.fullName || "สิรวิทย์ เพชรจำรัส",
            email: data.account.email || "keem@crestzendo.com",
            avatar: data.account.avatar || "",
          });
        }
      })
      .catch(() => {});
  }, []);

  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.warn("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Listen to client-side notification triggers
    const handleUpdate = () => {
      fetchNotifications();
    };
    window.addEventListener("docbuilder-notification-update", handleUpdate);
    window.addEventListener("focus", handleUpdate);

    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      window.removeEventListener("docbuilder-notification-update", handleUpdate);
      window.removeEventListener("focus", handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
    } catch (err) {
      console.warn("Failed to mark all notifications as read:", err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (notif.unread) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, unread: false } : n))
      );
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notif.id }),
      }).catch(() => {});
    }
    if (notif.link) {
      handleSelectRoute(notif.link);
    }
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return "เพิ่งสร้าง";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} ชั่วโมงที่แล้ว`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay === 1) return "เมื่อวาน";
    if (diffDay < 7) return `${diffDay} วันที่แล้ว`;
    return date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "email_sent":
        return {
          icon: Send,
          color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40",
        };
      case "document_exported":
        return {
          icon: Download,
          color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40",
        };
      case "document_created":
        return {
          icon: FileText,
          color: "text-primary bg-primary/10",
        };
      case "revision_created":
        return {
          icon: CopyPlus,
          color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40",
        };
      case "template_saved":
        return {
          icon: Sparkles,
          color: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40",
        };
      default:
        return {
          icon: Bell,
          color: "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800",
        };
    }
  };

  const handleSelectRoute = (path) => {
    setOpenCommand(false);
    if (path.startsWith("/settings") && typeof window !== "undefined") {
      window.sessionStorage.setItem("docbuilder-settings-return-path", pathname);
    }
    router.push(path);
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  const pathname = usePathname();
  const pageTitles = {
    "/": t('nav.dashboard') || "Dashboard",
    "/create": t('nav.createDocument') || "Create Document",
    "/create/quotation": "Quotation",
    "/create/partner": "Partner Agreement",
    "/create/nda": "NDA Agreement",
    "/create/distributor": "Distributor Agreement",
    "/create/notification": "Official Notification",
    "/create/custom": "Custom Document",
    "/documents": t('nav.myDocuments') || "My Documents",
    "/profile-data": t('nav.dataPresets') || "Profile Data",
    "/templates": t('nav.templates') || "Templates Catalog",
    "/history": "Sent History",
    "/settings": t('nav.settings') || "Settings",
    "/settings/account": t('nav.settings') || "Settings",
    "/settings/general": t('nav.settings') || "Settings",
    "/settings/email": t('nav.settings') || "Settings",
    "/settings/preferences": t('nav.settings') || "Settings",
  };
  const title = pageTitles[pathname] || "DocBuilder Workspace";

  return (
    <>
      <header className="flex h-14 w-full items-center justify-between bg-sidebar px-4 sm:px-6 select-none shrink-0 transition-colors">
        {/* Left Side: Page Title (Desktop) & Sidebar Trigger (Mobile) */}
        <div className="flex items-center gap-3">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-[#EEEEEE] dark:hover:bg-[#242424] transition-colors lg:hidden" />
          <h1 className="text-lg font-semibold tracking-[-0.01em] text-foreground min-w-0 truncate font-sans">
            {title}
          </h1>
        </div>

        {/* Right Side: Quick Search, Dark Mode Toggle, Notifications, User Avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search Button / Input (Cmd+K) */}
          <button
            onClick={() => setOpenCommand(true)}
            className="hidden md:flex items-center justify-between w-48 lg:w-56 h-9 px-3 rounded-[6px] border border-border bg-white dark:bg-[#1A1A1A] hover:bg-[#F6F6F6] dark:hover:bg-[#222222] text-muted-foreground text-xs font-normal transition-colors shadow-2xs group"
          >
            <div className="flex items-center gap-2 truncate">
              <Search size={14} className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              <span className="truncate">{t('topbar.searchPlaceholder') || "Search documents, templates, presets..."}</span>
            </div>
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold bg-muted/60 border border-border rounded text-muted-foreground shadow-2xs shrink-0">
              <span className="text-[10px]">⌘</span>K
            </kbd>
          </button>
          {/* Real Dark Mode Toggle Button */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9 rounded-lg border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center shadow-2xs"
            title={mounted && theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {mounted && theme === "dark" ? (
              <Sun size={17} className="text-amber-400" />
            ) : (
              <Moon size={17} />
            )}
          </button>

          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="relative h-9 w-9 rounded-lg border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center shadow-2xs"
                title={t('topbar.notifications') || "Notifications"}
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive ring-2 ring-surface animate-pulse" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-80 p-0 shadow-md border border-border bg-surface z-50 rounded-xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
                <DropdownMenuLabel className="p-0 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  {t('topbar.notifications') || "Notifications"}
                </DropdownMenuLabel>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-normal border-primary/30 text-primary">
                    {unreadCount} new
                  </Badge>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] text-muted-foreground hover:text-foreground font-medium underline"
                    >
                      {t('topbar.markAllRead') || "Mark all as read"}
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-border/60 bg-surface">
                {notifications.length === 0 ? (
                  <div className="py-8 px-4 text-center flex flex-col items-center justify-center text-muted-foreground">
                    <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center mb-2 text-muted-foreground/60">
                      <BellOff size={18} />
                    </div>
                    <p className="text-xs font-medium text-foreground">ไม่มีการแจ้งเตือน</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">การแจ้งเตือนกิจกรรมและเอกสารจะแสดงที่นี่</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const iconConfig = getNotificationIcon(n.type);
                    const ItemIcon = iconConfig.icon;
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3 text-xs transition-colors hover:bg-muted/60 cursor-pointer flex items-start gap-2.5 ${
                          n.unread ? "bg-primary/5 font-medium" : "text-muted-foreground"
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${iconConfig.color}`}>
                          <ItemIcon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-foreground leading-snug font-medium line-clamp-1">{n.title}</p>
                            {n.unread && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1" />
                            )}
                          </div>
                          {n.message && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                              {n.message}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock size={11} /> {formatRelativeTime(n.timestamp || n.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-2 border-t border-border text-center bg-muted/20">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSelectRoute("/history")}
                  className="w-full text-xs text-primary hover:text-primary hover:bg-primary/5 h-7 font-medium"
                >
                  {t('topbar.viewAllNotifications') || "ดูประวัติเอกสารทั้งหมด"}
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile Avatar with Name & Chevron Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-lg hover:bg-muted/60 transition-colors outline-none cursor-pointer group">
                <Avatar className="h-8 w-8 ring-1 ring-border shrink-0 overflow-hidden">
                  {userProfile.avatar ? (
                    <AvatarImage src={userProfile.avatar} alt={userProfile.fullName} className="object-cover w-full h-full" />
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                    {userProfile.fullName ? userProfile.fullName.slice(0, 2).toUpperCase() : "SP"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline-block text-xs font-semibold text-foreground tracking-tight max-w-[130px] truncate">
                  {userProfile.fullName}
                </span>
                <ChevronDown size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-56 shadow-md border border-border bg-surface z-50 rounded-xl">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold text-foreground leading-none truncate">{userProfile.fullName}</p>
                  <p className="text-xs text-muted-foreground leading-none truncate">{userProfile.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSelectRoute("/settings/account")} className="cursor-pointer">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{t('topbar.accountSettings') || "Account Settings"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSelectRoute("/documents")} className="cursor-pointer">
                <FolderOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{t('nav.myDocuments') || "My Documents"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSelectRoute("/profile-data")} className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{t('nav.dataPresets') || "Data Presets"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSelectRoute("/settings/account")} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{t('nav.settings') || "Settings"}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSelectRoute("/login")} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('nav.signOut') || "Sign out"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Command Search Dialog (Cmd+K) */}
      <CommandDialog open={openCommand} onOpenChange={setOpenCommand}>
        <CommandInput placeholder={t('topbar.searchPlaceholder') || "Search documents, templates, presets..."} />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Workspace">
            <CommandItem onSelect={() => handleSelectRoute("/")}>
              <FileText className="mr-2 h-4 w-4 text-primary" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelectRoute("/create")}>
              <Plus className="mr-2 h-4 w-4 text-primary" />
              <span>Create Document</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelectRoute("/documents")}>
              <FolderOpen className="mr-2 h-4 w-4 text-primary" />
              <span>My Documents</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelectRoute("/templates")}>
              <LayoutGrid className="mr-2 h-4 w-4 text-primary" />
              <span>Templates Catalog</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelectRoute("/profile-data")}>
              <FileText className="mr-2 h-4 w-4 text-primary" />
              <span>Data Presets</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Quick Create">
            <CommandItem onSelect={() => handleSelectRoute("/create/quotation")}>
              <FileText className="mr-2 h-4 w-4 text-primary" />
              <span>Quotation</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelectRoute("/create/partner")}>
              <FileText className="mr-2 h-4 w-4 text-primary" />
              <span>Partner Agreement</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelectRoute("/create/nda")}>
              <FileText className="mr-2 h-4 w-4 text-primary" />
              <span>NDA Agreement</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
