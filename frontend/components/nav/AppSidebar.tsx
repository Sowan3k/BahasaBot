"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Brain,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard",    icon: LayoutDashboard },
  { label: "AI Tutor",  href: "/chatbot",      icon: MessageSquare },
  { label: "Courses",   href: "/courses",      icon: BookOpen },
  { label: "Quiz",      href: "/quiz/adaptive", icon: Brain },
] as const;

export function AppSidebar() {
  // Default false — useEffect reads localStorage after mount to avoid SSR hydration mismatch
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    if (localStorage.getItem("sidebar-collapsed") === "true") {
      setCollapsed(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  function isActive(href: string) {
    const base = "/" + href.split("/")[1];
    const curr = "/" + (pathname?.split("/")[1] ?? "");
    return base === curr;
  }

  const userInitial = session?.user?.name?.[0]?.toUpperCase() ?? "U";
  const userName = session?.user?.name ?? "";

  return (
    <>
      {/* ── MOBILE: fixed top header bar (hidden on md+) ── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 h-14 bg-card border-b">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-md text-foreground hover:bg-muted transition-colors"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Image src="/Project Logo.png" width={28} height={28} alt="BahasaBot" className="rounded-md" />
          <span className="font-heading font-bold text-lg text-foreground">BahasaBot</span>
        </div>
        <ThemeToggle />
      </header>

      {/* ── MOBILE: overlay backdrop ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60] bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── MOBILE: slide-in drawer ── */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-[70] w-64 bg-card border-r flex flex-col transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Image src="/Project Logo.png" width={28} height={28} alt="BahasaBot" className="rounded-md" />
            <span className="font-heading font-bold text-lg">BahasaBot</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-md text-foreground hover:bg-muted transition-colors"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon size={20} className="shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-3 space-y-1">
          {userName && (
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                {userInitial}
              </div>
              <span className="text-xs font-medium text-muted-foreground truncate">{userName}</span>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 w-full py-2.5 px-3 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
          >
            <LogOut size={20} className="shrink-0" />
            Sign out
          </button>
        </div>
      </div>

      {/* ── DESKTOP: collapsible sidebar (hidden on mobile) ── */}
      <aside
        className={`hidden md:flex flex-col h-full bg-card border-r flex-shrink-0 transition-all duration-300 ease-in-out ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* ── Logo area ── */}
        <div className="border-b flex items-center justify-center h-16 px-3 shrink-0">
          {collapsed ? (
            <Link
              href="/dashboard"
              >
              <Image src="/Project Logo.png" width={36} height={36} alt="BahasaBot" className="rounded-lg" />
            </Link>
          ) : (
            <Link href="/dashboard" className="flex items-center gap-2 w-full px-1">
              <Image src="/Project Logo.png" width={32} height={32} alt="BahasaBot" className="rounded-lg shrink-0" />
              <span className="font-heading font-bold text-xl text-foreground">BahasaBot</span>
            </Link>
          )}
        </div>

        {/* ── Nav items ── */}
        <nav className="flex-1 p-2 space-y-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <div key={href} className="relative group/item">
                <Link
                  href={href}
                  className={`flex items-center gap-3 py-2.5 rounded-lg transition-colors w-full ${
                    collapsed ? "justify-center px-0" : "px-3"
                  } ${
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon size={20} className="shrink-0" />
                  {!collapsed && (
                    <span className={`text-sm ${active ? "font-semibold" : "font-medium"}`}>
                      {label}
                    </span>
                  )}
                </Link>

                {/* Tooltip — only shown when collapsed, appears on hover with 150ms delay */}
                {collapsed && (
                  <span
                    className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3
                               px-2 py-1 rounded bg-gray-900 text-white text-xs whitespace-nowrap
                               opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 delay-150 z-50"
                  >
                    {label}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Footer: user + theme + sign out + collapse toggle ── */}
        <div className="border-t p-2 shrink-0">
          {collapsed ? (
            <div className="flex flex-col items-center gap-1 py-1">
              {userName && (
                <div className="relative group/user">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold cursor-default select-none">
                    {userInitial}
                  </div>
                  <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 rounded bg-gray-900 text-white text-xs whitespace-nowrap opacity-0 group-hover/user:opacity-100 transition-opacity duration-150 delay-150 z-50">
                    {userName}
                  </span>
                </div>
              )}
              <ThemeToggle />
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                title="Sign out"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
              >
                <LogOut size={18} />
              </button>
              {/* Expand toggle */}
              <button
                onClick={() => setCollapsed(false)}
                title="Expand sidebar"
                className="w-8 h-8 mt-1 flex items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shadow-sm"
              >
                <ChevronRight size={14} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {userName && (
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                    {userInitial}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground truncate">{userName}</span>
                </div>
              )}
              <div className="px-3 py-1">
                <ThemeToggle />
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-3 w-full py-2.5 px-3 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
              >
                <LogOut size={18} className="shrink-0" />
                Sign out
              </button>
              {/* Collapse toggle */}
              <button
                onClick={() => setCollapsed(true)}
                title="Collapse sidebar"
                className="flex items-center gap-2 w-full py-2 px-3 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <ChevronLeft size={14} strokeWidth={2.5} />
                Collapse
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
