"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Brain,
  Settings,
  ShieldCheck,
  LogOut,
  Map,
  Menu,
  X,
  Flame,
  Star,
  Gamepad2,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { profileApi } from "@/lib/api";

const BASE_NAV_ITEMS = [
  { label: "Dashboard",  href: "/dashboard",       icon: LayoutDashboard },
  { label: "AI Tutor",   href: "/chatbot",         icon: MessageSquare },
  { label: "Courses",    href: "/courses",         icon: BookOpen },
  { label: "Quiz",       href: "/quiz/adaptive",   icon: Brain },
  { label: "My Journey", href: "/journey",         icon: Map },
  { label: "Games",      href: "/games/spelling",  icon: Gamepad2 },
  { label: "Settings",   href: "/settings",        icon: Settings },
] as const;

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem("sidebar-collapsed") === "true"
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const handleCollapse = (value: boolean) => {
    setCollapsed(value);
    localStorage.setItem("sidebar-collapsed", String(value));
  };

  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.getProfile().then((r) => r.data),
    enabled: status === "authenticated",
    staleTime: 5 * 60 * 1000,
  });

  const isAdmin = profileData?.role === "admin";
  const streakCount = profileData?.streak_count ?? 0;
  const xpTotal = profileData?.xp_total ?? 0;

  const navItems = isAdmin
    ? [...BASE_NAV_ITEMS, { label: "Admin", href: "/admin", icon: ShieldCheck } as const]
    : BASE_NAV_ITEMS;

  function isActive(href: string) {
    const base = "/" + href.split("/")[1];
    const curr = "/" + (pathname?.split("/")[1] ?? "");
    return base === curr;
  }

  const userInitial = session?.user?.name?.[0]?.toUpperCase() ?? "U";
  const userName = session?.user?.name ?? "";

  const xpInBand = xpTotal % 100;
  const nextMilestone = Math.floor(xpTotal / 100) * 100 + 100;

  return (
    <>
      {/* ── MOBILE: fixed top header (hidden on md+) ── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 h-14 bg-card border-b">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2.5 rounded-md text-foreground hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
        <Link href="/dashboard" className="flex items-center">
          <Image src="/Logo new (1).svg" width={113} height={36} alt="BahasaBot" className="object-contain" />
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle variant="icon" />
          <NotificationBell panelSide="left" />
        </div>
      </header>

      {/* ── MOBILE: overlay ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60] bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── MOBILE: slide-in drawer ── */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-[70] w-[280px] bg-sidebar border-r flex flex-col transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b shrink-0">
          <div className="flex items-center">
            <Image src="/Logo new (1).svg" width={126} height={40} alt="BahasaBot" className="object-contain" />
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2.5 rounded-md text-foreground hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 py-3 px-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-muted/40"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-3 space-y-2">
          {userName && (
            <div className="flex items-center gap-2.5 px-1 py-1">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                {userInitial}
              </div>
              <span className="text-sm font-medium text-foreground truncate">{userName}</span>
            </div>
          )}
          <div className="flex items-center gap-3 px-1 py-1">
            <div className="flex items-center gap-1">
              <Flame size={13} className={streakCount > 0 ? "text-orange-500" : "text-muted-foreground"} />
              <span className="text-xs font-semibold tabular-nums">{streakCount}</span>
              <span className="text-xs text-muted-foreground">streak</span>
            </div>
            <div className="w-px h-3 bg-border shrink-0" />
            <div className="flex items-center gap-1">
              <Star size={12} className="text-yellow-500" />
              <span className="text-xs font-semibold tabular-nums">{xpTotal} XP</span>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 w-full py-2.5 px-3 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
          >
            <LogOut size={18} className="shrink-0" />
            Sign out
          </button>
        </div>
      </div>

      {/* ── DESKTOP: collapsible sidebar ── */}
      {/*
        relative so the collapse/expand handle button can be absolutely positioned
        on the right border at vertical center.
      */}
      <aside
        data-tour="sidebar"
        className={`hidden md:flex flex-col h-full bg-sidebar border-r flex-shrink-0 transition-all duration-300 ease-in-out relative z-[1] ${
          collapsed ? "w-[60px]" : "w-60"
        }`}
      >
        {/* ── Collapse / Expand handle — sits on the right border, vertically centered ── */}
        <button
          onClick={() => handleCollapse(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-[60] w-6 h-6 rounded-full bg-card border border-border shadow-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center cursor-pointer"
        >
          {collapsed
            ? <ChevronRight size={12} strokeWidth={2.5} />
            : <ChevronLeft size={12} strokeWidth={2.5} />
          }
        </button>

        {/* ── Logo area ── */}
        <div
          className={`flex items-center h-16 shrink-0 ${
            collapsed ? "justify-center px-0" : "justify-start px-3"
          }`}
        >
          {collapsed ? (
            <Link href="/dashboard" className="flex items-center justify-center">
              <div className="relative w-9 h-9 flex-shrink-0">
                <Image src="/Logo new only box (1).svg" alt="BahasaBot" fill sizes="36px" className="object-contain" />
              </div>
            </Link>
          ) : (
            /* Full-width logo — fills the space left by the removed ThemeToggle */
            <Link href="/dashboard" className="flex items-center w-full">
              <Image src="/Logo new (1).svg" width={176} height={52} alt="BahasaBot" className="object-contain" />
            </Link>
          )}
        </div>

        {/* ── Nav items ── */}
        <nav className={`flex-1 px-2 py-3 space-y-0.5 ${collapsed ? "overflow-hidden" : "overflow-y-auto"}`}>
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            const tourId = `nav-${href.split("/")[1]}`;
            return (
              <div key={href} data-tour={tourId} className="relative group/item">
                <Link
                  href={href}
                  className={`flex items-center rounded-lg transition-colors ${
                    collapsed
                      ? "justify-center w-10 h-10 mx-auto"
                      : "gap-3 px-3 py-2.5"
                  } ${
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-muted/40"
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && (
                    <span className={`text-sm ${active ? "font-semibold" : "font-medium"}`}>
                      {label}
                    </span>
                  )}
                </Link>
                {collapsed && (
                  <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 rounded-md bg-popover border border-border text-foreground text-xs whitespace-nowrap opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 delay-100 z-50 shadow-md">
                    {label}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Utility strip — Bell + ThemeToggle, centered below nav ── */}
        <div className={`flex items-center justify-center gap-3 py-3 ${collapsed ? "flex-col" : "flex-row"}`}>
          <ThemeToggle variant="icon" />
          <NotificationBell panelSide="right" panelDirection="up" />
        </div>

        {/* ── Footer — single border-t divider ── */}
        <div className="border-t shrink-0">
          {collapsed ? (
            /* ── Collapsed footer ── */
            <div className="flex flex-col items-center gap-2 py-3">
              {/* Avatar */}
              {userName && (
                <div className="relative group/user">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold cursor-default select-none">
                    {userInitial}
                  </div>
                  <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 rounded-md bg-popover border border-border text-foreground text-xs whitespace-nowrap opacity-0 group-hover/user:opacity-100 transition-opacity duration-150 delay-100 z-50 shadow-md">
                    {userName}
                  </span>
                </div>
              )}
              {/* Streak */}
              <div className="relative group/streak w-10 h-8 flex items-center justify-center">
                <div className="flex items-center gap-0.5">
                  <Flame size={13} className={streakCount > 0 ? "text-orange-500" : "text-muted-foreground"} />
                  <span className="text-[11px] font-bold tabular-nums">{streakCount}</span>
                </div>
                <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 rounded-md bg-popover border border-border text-foreground text-xs whitespace-nowrap opacity-0 group-hover/streak:opacity-100 transition-opacity duration-150 delay-100 z-50 shadow-md">
                  {streakCount} day streak
                </span>
              </div>
              {/* XP */}
              <div className="relative group/xp w-10 h-8 flex items-center justify-center">
                <div className="flex items-center gap-0.5">
                  <Star size={12} className="text-yellow-500" />
                  <span className="text-[11px] font-bold tabular-nums">{xpTotal}</span>
                </div>
                <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 rounded-md bg-popover border border-border text-foreground text-xs whitespace-nowrap opacity-0 group-hover/xp:opacity-100 transition-opacity duration-150 delay-100 z-50 shadow-md">
                  {xpTotal} XP total
                </span>
              </div>
              {/* Sign out */}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                title="Sign out"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            /* ── Expanded footer ── */
            <div className="flex flex-col gap-3 py-4 px-4">
              {/* User row */}
              {userName && (
                <div className="flex items-center gap-2 w-full">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[11px] font-bold shrink-0">
                    {userInitial}
                  </div>
                  <span className="text-sm font-medium text-foreground truncate">{userName}</span>
                </div>
              )}

              {/* Streak + XP */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Flame size={13} className={streakCount > 0 ? "text-orange-500" : "text-muted-foreground"} />
                  <span className="text-xs font-semibold tabular-nums">{streakCount}</span>
                  <span className="text-xs text-muted-foreground">streak</span>
                </div>
                <div className="w-px h-3 bg-border shrink-0" />
                <div className="flex items-center gap-1.5">
                  <Star size={12} className="text-yellow-500" />
                  <span className="text-xs font-semibold tabular-nums">{xpTotal} XP</span>
                </div>
              </div>

              {/* XP progress bar */}
              <div className="w-full space-y-1">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-yellow-500 transition-all duration-500"
                    style={{ width: `${Math.min(xpInBand, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground text-center tabular-nums">
                  {xpInBand} / 100 XP · next milestone {nextMilestone}
                </p>
              </div>

              {/* Sign out */}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2 py-1.5 px-3 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-muted transition-colors w-full"
              >
                <LogOut size={15} className="shrink-0" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
