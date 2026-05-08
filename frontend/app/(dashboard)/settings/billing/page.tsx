"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X, Sparkles, Zap, BookOpen, GraduationCap } from "lucide-react";
import { GlassCard } from "@/components/ui/animated-glassy-pricing";
import { RippleButton } from "@/components/ui/multi-type-ripple-buttons";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { ComingSoonModal } from "@/components/subscription/ComingSoonModal";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";

// ── Data ──────────────────────────────────────────────────────────────────────

const CURRENT_PLAN = SUBSCRIPTION_PLANS.find((p) => p.id === "free")!;
const PAID_PLANS   = SUBSCRIPTION_PLANS.filter((p) => p.id !== "free");

const FREE_FEATURES: Array<{ label: string; included: boolean }> = [
  { label: "30 chat messages / day",    included: true  },
  { label: "1 course generation / day", included: true  },
  { label: "Unlimited quiz attempts",   included: true  },
  { label: "Adaptive quiz",             included: false },
  { label: "Pronunciation audio",       included: false },
  { label: "Chat history",              included: false },
  { label: "Learning roadmap",          included: false },
];

const PLAN_ICONS = {
  power_pass:    <Zap          size={16} className="shrink-0" />,
  monthly_pro:   <BookOpen     size={16} className="shrink-0" />,
  semester_pass: <GraduationCap size={16} className="shrink-0" />,
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="relative min-h-full">
      <BackgroundPaths />

      <div className="relative z-10 max-w-2xl mx-auto py-6 px-4 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="p-2 rounded-lg hover:bg-black/8 dark:hover:bg-white/8 transition-colors text-foreground/60 hover:text-foreground"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-light tracking-tight text-foreground">
              Billing & Plans
            </h1>
            <p className="text-sm text-foreground/50">Manage your subscription</p>
          </div>
        </div>

        {/* ── Current plan ── */}
        <GlassCard className="overflow-hidden">
          {/* Plan header strip */}
          <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold text-foreground/40 uppercase tracking-widest mb-1">
                Current plan
              </p>
              <h2 className="font-heading text-4xl font-extralight tracking-[-0.02em] text-foreground leading-none">
                {CURRENT_PLAN.name}
              </h2>
              <p className="text-sm text-foreground/50 mt-1">{CURRENT_PLAN.tagline}</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-500/12 text-green-600 dark:text-green-400 text-xs font-semibold">
                ● Active
              </span>
              <div className="text-right">
                <span className="font-heading text-2xl font-extralight text-foreground">RM 0</span>
                <span className="text-xs text-foreground/40 ml-1">/ forever</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-5 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/12 to-transparent" />

          {/* Feature list */}
          <div className="px-5 py-4 space-y-2">
            <p className="text-[10px] font-semibold text-foreground/40 uppercase tracking-widest mb-3">
              What&apos;s included
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
              {FREE_FEATURES.map(({ label, included }) => (
                <div key={label} className="flex items-center gap-2">
                  {included
                    ? <Check size={13} className="text-primary shrink-0" />
                    : <X     size={13} className="text-foreground/25 shrink-0" />
                  }
                  <span className={`text-sm ${included ? "text-foreground" : "text-foreground/45"}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* ── Upgrade section ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Sparkles size={14} className="text-primary" />
            <p className="text-sm font-semibold text-foreground">Upgrade your plan</p>
          </div>

          {/* Mini plan cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PAID_PLANS.map((plan) => (
              <GlassCard
                key={plan.id}
                featured={plan.featured}
                className="relative p-4 flex flex-col gap-3"
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-semibold bg-primary text-primary-foreground whitespace-nowrap">
                    Most Popular
                  </span>
                )}

                {/* Plan name + icon */}
                <div className="flex items-start gap-2 pt-1">
                  <span className={`mt-0.5 ${plan.accentClass}`}>
                    {PLAN_ICONS[plan.id as keyof typeof PLAN_ICONS]}
                  </span>
                  <div>
                    <h3 className={`font-heading text-sm font-semibold leading-tight ${plan.accentClass}`}>
                      {plan.name}
                    </h3>
                    <p className="text-[11px] text-foreground/50 mt-0.5 leading-snug">
                      {plan.tagline}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-foreground/50">RM</span>
                  <span className="font-heading text-2xl font-extralight text-foreground tracking-tight">
                    {plan.priceRM}
                  </span>
                  <span className="text-[11px] text-foreground/40">/ {plan.period}</span>
                </div>

                {/* Top 3 key features */}
                <ul className="space-y-1 text-[11px] text-foreground/60">
                  <li className="flex items-center gap-1.5">
                    <Check size={11} className="text-primary shrink-0" />
                    {plan.chatLimitDaily} chats/day
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check size={11} className="text-primary shrink-0" />
                    {plan.courseGenLimitDaily} courses/day
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check size={11} className="text-primary shrink-0" />
                    All premium features
                  </li>
                </ul>

                <RippleButton
                  onClick={() => setModalOpen(true)}
                  className={`w-full py-2 rounded-lg text-xs font-semibold mt-auto border-0 transition-colors ${
                    plan.featured
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-black/8 dark:bg-white/8 text-foreground hover:bg-black/14 dark:hover:bg-white/14"
                  }`}
                >
                  Start free trial
                </RippleButton>
              </GlassCard>
            ))}
          </div>

          {/* See full comparison link */}
          <div className="text-center pt-1">
            <Link
              href="/pricing"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              See full plan comparison →
            </Link>
          </div>
        </div>

        {/* ── Notice ── */}
        <GlassCard className="p-4">
          <p className="text-xs text-foreground/45 text-center leading-relaxed">
            Payment integration is in development — all features are free of charge until launch.
          </p>
        </GlassCard>

      </div>

      <ComingSoonModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
