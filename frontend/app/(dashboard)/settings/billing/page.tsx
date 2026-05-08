"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, Check, X, ExternalLink, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/animated-glassy-pricing";
import { RippleButton } from "@/components/ui/multi-type-ripple-buttons";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { ComingSoonModal } from "@/components/subscription/ComingSoonModal";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";

const CURRENT_PLAN = SUBSCRIPTION_PLANS.find((p) => p.id === "free")!;
const FREE_FEATURES: Array<{ label: string; included: boolean }> = [
  { label: "30 chat messages per day", included: true },
  { label: "1 course generation per day", included: true },
  { label: "Unlimited quiz attempts", included: true },
  { label: "Adaptive quiz", included: false },
  { label: "Pronunciation audio", included: false },
  { label: "Chat history", included: false },
  { label: "Learning roadmap", included: false },
];

export default function BillingPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="relative min-h-full">
      <BackgroundPaths />

      <div className="relative z-10 max-w-2xl mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="p-2 rounded-lg hover:bg-black/8 dark:hover:bg-white/8 transition-colors text-foreground/60 hover:text-foreground"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-light tracking-tight text-foreground">Billing & Plans</h1>
            <p className="text-sm text-foreground/50">Manage your subscription</p>
          </div>
        </div>

        {/* Current plan card */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <CreditCard size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-foreground/50 uppercase tracking-wide">Current Plan</p>
                <h2 className="font-heading text-xl font-light tracking-tight text-foreground">{CURRENT_PLAN.name}</h2>
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-semibold">
              Active
            </span>
          </div>

          <p className="text-sm text-foreground/60">
            You are on the <strong className="text-foreground">Free plan</strong> — no charge, no
            expiry, no credit card required.
          </p>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/15 to-transparent" />

          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">What you get</p>
            <div className="space-y-1.5">
              {FREE_FEATURES.map(({ label, included }) => (
                <div key={label} className="flex items-center gap-2.5">
                  {included ? (
                    <Check size={14} className="text-primary shrink-0" />
                  ) : (
                    <X size={14} className="text-foreground/30 shrink-0" />
                  )}
                  <span className={`text-sm ${included ? "text-foreground" : "text-foreground/50"}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Upgrade CTA */}
        <GlassCard featured className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            <h2 className="font-heading text-base font-semibold text-foreground">Unlock more with a paid plan</h2>
          </div>
          <p className="text-sm text-foreground/60 leading-relaxed">
            Upgrade to get adaptive quizzes, pronunciation audio, full chat history, your learning
            roadmap, and much higher daily limits. The{" "}
            <strong className="text-foreground">7-Day Power Pass (RM 35)</strong> is perfect if
            your exam is coming up.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <RippleButton
              onClick={() => { window.location.href = "/pricing"; }}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors border-0"
            >
              <ExternalLink size={14} />
              View all plans
            </RippleButton>
            <RippleButton
              onClick={() => setModalOpen(true)}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold border border-black/15 dark:border-white/15 text-foreground bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Start free trial
            </RippleButton>
          </div>
        </GlassCard>

        {/* Notice */}
        <GlassCard className="p-4">
          <p className="text-xs text-foreground/50 text-center leading-relaxed">
            Payment integration is in development and will be available after launch.
            All features are currently free of charge.{" "}
            <Link href="/pricing" className="text-primary hover:underline">
              Learn more →
            </Link>
          </p>
        </GlassCard>
      </div>

      <ComingSoonModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
