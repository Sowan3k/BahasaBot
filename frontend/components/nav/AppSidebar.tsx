"use client";

// Shared sidebar navigation used by both the dashboard layout and the chatbot layout.
// Includes a collapse/expand toggle — clicking the chevron hides labels and shows icon-only nav.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "My Courses", href: "/courses" },
  { label: "Chatbot",    href: "/chatbot" },
  { label: "Practice Quiz", href: "/quiz/adaptive" },
] as const;

export function AppSidebar() {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const { data: session } = useSession();

  // Match the first path segment so sub-routes stay highlighted
  function isActive(href: string) {
    const navBase = "/" + href.split("/")[1];
    const currentBase = "/" + (pathname?.split("/")[1] ?? "");
    return navBase === currentBase;
  }

  return (
    // Wrapper is relative so the toggle button can sit on the right border edge
    // without being clipped by the aside's own overflow-hidden
    <div className="relative shrink-0 flex">
      <aside
        className={`border-r flex flex-col bg-card transition-[width] duration-200 overflow-hidden ${
          open ? "w-56" : "w-12"
        }`}
      >
        {/* ── Brand ── */}
        <div className={`border-b flex items-center justify-center ${open ? "py-5" : "py-3"}`}>
          {open ? (
            <Link href="/dashboard">
              <Image
                src="/Project Logo.png"
                alt="BahasaBot"
                width={140}
                height={70}
                priority
                className="object-contain"
              />
            </Link>
          ) : (
            <Link href="/dashboard">
              <Image
                src="/Project Logo.png"
                alt="BahasaBot"
                width={36}
                height={36}
                priority
                className="object-contain"
              />
            </Link>
          )}
        </div>

        {/* ── Nav links ── */}
        <nav className={`flex-1 space-y-1 ${open ? "p-3" : "p-2"}`}>
          {NAV_ITEMS.map(({ label, href }) => {
            const active = isActive(href);

            if (!open) {
              return (
                <Link
                  key={href}
                  href={href}
                  title={label}
                  className={`flex items-center justify-center w-8 h-8 rounded-md text-xs font-bold transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {label[0]}
                </Link>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* ── Footer: user info + sign out ── */}
        <div className={`border-t ${open ? "p-3 space-y-1" : "p-2 flex flex-col items-center"}`}>
          {open ? (
            <>
              {session?.user?.name && (
                <p
                  className="px-3 py-1 text-xs font-medium text-muted-foreground truncate"
                  title={session.user.email ?? ""}
                >
                  {session.user.name}
                </p>
              )}
              <div className="px-3 py-1">
                <ThemeToggle />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm text-muted-foreground hover:text-destructive"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <ThemeToggle className="scale-75 origin-left" />
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                title="Sign out"
                className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
              >
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* ── Collapse toggle — centered on the right border edge ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-50
          w-7 h-7 flex items-center justify-center
          rounded-full bg-card border-2 border-border shadow-md
          text-foreground hover:bg-muted
          transition-colors"
        title={open ? "Collapse sidebar" : "Expand sidebar"}
      >
        {open ? <ChevronLeft size={18} strokeWidth={2.5} /> : <ChevronRight size={18} strokeWidth={2.5} />}
      </button>
    </div>
  );
}
