"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, X, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { ShaderCanvas, GlassCard } from "@/components/ui/animated-glassy-pricing";
import { RippleButton } from "@/components/ui/multi-type-ripple-buttons";
import { PricingCard } from "@/components/subscription/PricingCard";
import { ComingSoonModal } from "@/components/subscription/ComingSoonModal";
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from "@/lib/subscription-plans";

// ── Feature comparison table ──────────────────────────────────────────────────

type FeatureKey = keyof Pick<
  SubscriptionPlan,
  | "chatLimitDaily"
  | "courseGenLimitDaily"
  | "quizAttempts"
  | "adaptiveQuiz"
  | "pronunciationAudio"
  | "chatHistory"
  | "learningRoadmap"
  | "activeSessions"
>;

interface TableRow {
  label: string;
  key: FeatureKey;
  format?: (val: SubscriptionPlan[FeatureKey]) => React.ReactNode;
}

const TABLE_ROWS: TableRow[] = [
  {
    label: "Chat messages / day",
    key: "chatLimitDaily",
    format: (v) => <span className="text-xs font-semibold tabular-nums text-foreground">{v}</span>,
  },
  {
    label: "Course generation / day",
    key: "courseGenLimitDaily",
    format: (v) => <span className="text-xs font-semibold tabular-nums text-foreground">{v}</span>,
  },
  {
    label: "Quiz attempts",
    key: "quizAttempts",
    format: (v) => <span className="text-xs font-semibold text-foreground">{v}</span>,
  },
  { label: "Adaptive quiz", key: "adaptiveQuiz" },
  { label: "Pronunciation audio", key: "pronunciationAudio" },
  { label: "Chat history", key: "chatHistory" },
  { label: "Learning roadmap", key: "learningRoadmap" },
  {
    label: "Active sessions",
    key: "activeSessions",
    format: (v) => <span className="text-xs font-semibold tabular-nums text-foreground">{v}</span>,
  },
];

function CellValue({ row, plan }: { row: TableRow; plan: SubscriptionPlan }) {
  const val = plan[row.key];
  if (row.format) return <>{row.format(val as SubscriptionPlan[FeatureKey])}</>;
  if (typeof val === "boolean") {
    return val
      ? <Check size={15} className="text-primary mx-auto" />
      : <X size={15} className="text-foreground/25 mx-auto" />;
  }
  return <span className="text-xs font-semibold text-foreground">{String(val)}</span>;
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: "Why is pricing in MYR?",
    a: "BahasaBot is built for international students at Malaysian public universities. MYR pricing reflects local purchasing power and is aligned with the cost of study in Malaysia.",
  },
  {
    q: "What payment methods will be accepted?",
    a: "We are integrating Stripe for international credit/debit cards and ToyyibPay for Malaysian FPX (online banking). Paddle may also be available for users operating from certain countries.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel your subscription or free trial at any time before the billing date. No charges will be applied if you cancel before the trial ends.",
  },
  {
    q: "Is the Free plan really free?",
    a: "Yes — the Free plan is completely free, forever. No credit card required. You get 30 chat messages and 1 course generation per day with no time limit.",
  },
  {
    q: "Why does the 7-Day Pass have more course generations than Monthly Pro?",
    a: "Exam crammers need to generate multiple topic-specific courses in a single sitting. The 7-Day Power Pass is designed for this use case — 10 courses per day lets you cover every topic before your exam.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <GlassCard className="overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        {q}
        {open
          ? <ChevronUp size={16} className="shrink-0 text-foreground/40" />
          : <ChevronDown size={16} className="shrink-0 text-foreground/40" />
        }
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-foreground/60 leading-relaxed border-t border-black/8 dark:border-white/8">
          <p className="pt-4">{a}</p>
        </div>
      )}
    </GlassCard>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [modalOpen, setModalOpen] = useState(false);

  const getCtaLabel = (plan: SubscriptionPlan) => {
    if (plan.id === "free") return "Get Started Free";
    return "Start Free Trial";
  };

  const handleCta = (plan: SubscriptionPlan) => {
    if (plan.id === "free") {
      window.location.href = "/register";
      return;
    }
    setModalOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Animated WebGL background */}
      <ShaderCanvas />

      {/* Sticky nav */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4
        backdrop-blur-[20px] bg-background/40 border-b border-black/10 dark:border-white/8">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Link href="/dashboard" className="flex items-center">
            <Image src="/Logo new (1).svg" width={130} height={40} alt="BahasaBot" className="object-contain" />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <RippleButton
            onClick={() => { window.location.href = "/register"; }}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors border-0"
          >
            Get started free
          </RippleButton>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-14 space-y-24">

        {/* ── Hero ── */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="font-heading text-5xl sm:text-6xl font-extralight leading-tight tracking-[-0.03em] bg-clip-text text-transparent bg-gradient-to-r from-foreground via-primary to-accent">
            Choose Your Path to<br />Bahasa Mastery
          </h1>
          <p className="text-base sm:text-lg text-foreground/70 leading-relaxed max-w-xl mx-auto">
            BahasaBot helps international students at Malaysian universities ace their mandatory
            Bahasa Malaysia subject — from beginner greetings to conversational fluency.
            Start free, upgrade when exam season hits.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium">
            ✨ 7-day free trial available — card required, cancel anytime
          </div>
        </section>

        {/* ── Pricing cards ── */}
        <section className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                featured={plan.featured}
                ctaLabel={getCtaLabel(plan)}
                onCtaClick={() => handleCta(plan)}
              />
            ))}
          </div>
          <p className="text-center text-xs text-foreground/40 pt-2">
            All prices in Malaysian Ringgit (MYR). Payment integration launching soon.
          </p>
        </section>

        {/* ── Feature comparison table ── */}
        <section className="space-y-5">
          <div className="text-center space-y-1">
            <h2 className="font-heading text-2xl font-light text-foreground tracking-tight">Compare Plans</h2>
            <p className="text-sm text-foreground/50">Everything you get at each tier, side by side.</p>
          </div>

          <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Header row */}
                <div className="grid grid-cols-5 border-b border-black/10 dark:border-white/8">
                  <div className="px-4 py-3 text-xs font-semibold text-foreground/40 uppercase tracking-wide">
                    Feature
                  </div>
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <div
                      key={plan.id}
                      className={`px-4 py-3 text-center ${plan.featured ? "bg-primary/8" : ""}`}
                    >
                      <p className={`text-xs font-bold ${plan.accentClass}`}>{plan.name}</p>
                      <p className="text-[10px] text-foreground/40 mt-0.5">
                        {plan.priceRM === 0 ? "Free" : `RM${plan.priceRM}`}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Data rows */}
                {TABLE_ROWS.map((row, i) => (
                  <div
                    key={row.key}
                    className={`grid grid-cols-5 border-b border-black/8 dark:border-white/5 last:border-0 ${i % 2 !== 0 ? "bg-black/[0.03] dark:bg-white/[0.03]" : ""}`}
                  >
                    <div className="px-4 py-3 text-xs text-foreground/50 flex items-center">
                      {row.label}
                    </div>
                    {SUBSCRIPTION_PLANS.map((plan) => (
                      <div
                        key={plan.id}
                        className={`px-4 py-3 flex items-center justify-center text-center ${plan.featured ? "bg-primary/5" : ""}`}
                      >
                        <CellValue row={row} plan={plan} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </section>

        {/* ── 7-day trial callout ── */}
        <section>
          <GlassCard featured className="px-6 sm:px-10 py-10 text-center space-y-4">
            <h2 className="font-heading text-2xl font-light text-foreground tracking-tight">
              Try everything free for 7 days
            </h2>
            <p className="text-sm text-foreground/60 max-w-xl mx-auto leading-relaxed">
              Add a card to start your free trial on any paid plan. You get immediate access to all
              features. If you cancel before day 7,{" "}
              <strong className="text-foreground">you are not charged at all</strong>. After day 7,
              your card is automatically billed and your full plan unlocks. You can cancel anytime.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center pt-2">
              <RippleButton
                onClick={() => setModalOpen(true)}
                className="px-6 py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md border-0"
              >
                Start your free trial
              </RippleButton>
              <RippleButton
                onClick={() => { window.location.href = "/register"; }}
                className="px-6 py-3 rounded-xl text-sm font-semibold border border-black/15 dark:border-white/15 text-foreground bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Start with Free plan
              </RippleButton>
            </div>
            <p className="text-xs text-foreground/40">
              No charge until trial ends · Cancel before day 7 for zero cost · One card per account
            </p>
          </GlassCard>
        </section>

        {/* ── FAQ ── */}
        <section className="space-y-5 max-w-2xl mx-auto w-full">
          <h2 className="font-heading text-2xl font-light text-foreground text-center tracking-tight">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </section>

        {/* ── Footer CTA ── */}
        <section className="text-center space-y-5 pt-4 pb-8">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/10 to-transparent mb-8" />
          <h2 className="font-heading text-2xl font-light text-foreground tracking-tight">
            Ready to master Bahasa Malaysia?
          </h2>
          <p className="text-sm text-foreground/50">
            Join students already learning with BahasaBot — start free today.
          </p>
          <RippleButton
            onClick={() => setModalOpen(true)}
            className="px-8 py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md border-0"
          >
            Start your free trial
          </RippleButton>
          <p className="text-xs text-foreground/40">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </section>
      </main>

      <ComingSoonModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
