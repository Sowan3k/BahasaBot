"use client";

import Link from "next/link";
import { User, Lock, Info, ChevronRight } from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";

const SETTINGS_ITEMS = [
  {
    href: "/settings/profile",
    icon: User,
    label: "Profile",
    description: "Update your display name, native language, and learning goal",
  },
  {
    href: "/settings/password",
    icon: Lock,
    label: "Password",
    description: "Change your account password",
  },
  {
    href: "/settings/about",
    icon: Info,
    label: "About BahasaBot",
    description: "Project information, credits, and academic details",
  },
] as const;

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your profile, security, and account preferences
        </p>
      </div>

      <GlowCard className="bg-card divide-y divide-border overflow-hidden !rounded-xl">
        {SETTINGS_ITEMS.map(({ href, icon: Icon, label, description }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
            <ChevronRight
              size={16}
              className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0"
            />
          </Link>
        ))}
      </GlowCard>
    </div>
  );
}
