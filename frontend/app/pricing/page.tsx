"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { PricingCard } from "@/components/subscription/PricingCard";
import { ComingSoonModal } from "@/components/subscription/ComingSoonModal";
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from "@/lib/subscription-plans";

// ── Feature comparison table rows ────────────────────────────────────────────

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
    format: (v) => <span className="text-xs font-semibold tabular-nums">{v}</span>,
  },
  {
    label: "Course generation / day",
    key: "courseGenLimitDaily",
    format: (v) => <span className="text-xs font-semibold tabular-nums">{v}</span>,
  },
  {
    label: "Quiz attempts",
    key: "quizAttempts",
    format: (v) => <span className="text-xs font-semibold">{v}</span>,
  },
  { label: "Adaptive quiz", key: "adaptiveQuiz" },
  { label: "Pronunciation audio", key: "pronunciationAudio" },
  { label: "Chat history", key: "chatHistory" },
  { label: "Learning roadmap", key: "learningRoadmap" },
  {
    label: "Active sessions",
    key: "activeSessions",
    format: (v) => <span className="text-xs font-semibold tabular-nums">{v}</span>,
  },
];

function CellValue({ row, plan }: { row: TableRow; plan: SubscriptionPlan }) {
  const val = plan[row.key];
  if (row.format) return <>{row.format(val as SubscriptionPlan[FeatureKey])}</>;
  if (typeof val === "boolean") {
    return val
      ? <Check size={16} className="text-green-500 mx-auto" />
      : <X size={16} className="text-muted-foreground/40 mx-auto" />;
  }
  return <span className="text-xs font-semibold">{String(val)}</span>;
}

// ── FAQ data ──────────────────────────────────────────────────────────────────

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
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors"
      >
        {q}
        {open ? <ChevronUp size={16} className="shrink-0 text-muted-foreground" /> : <ChevronDown size={16} className="shrink-0 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border bg-muted/20">
          <p className="pt-4">{a}</p>
        </div>
      )}
    </div>
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
      // Route to register for free plan; no modal needed
      window.location.href = "/register";
      return;
    }
    setModalOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <BackgroundPaths />

      {/* Nav bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0">
        <Link href="/" className="flex items-center">
          <Image src="/Logo new (1).svg" width={140} height={44} alt="BahasaBot" className="object-contain" />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Get started free
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-20">

        {/* ── Hero ── */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            Choose Your Path to<br />
            <span className="text-primary">Bahasa Mastery</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <p className="text-center text-xs text-muted-foreground pt-2">
            All prices in Malaysian Ringgit (MYR). Payment integration launching soon.
          </p>
        </section>

        {/* ── Feature comparison table ── */}
        <section className="space-y-5">
          <div className="text-center space-y-1">
            <h2 className="font-heading text-2xl font-bold text-foreground">Compare Plans</h2>
            <p className="text-sm text-muted-foreground">Everything you get at each tier, side by side.</p>
          </div>

          {/* Horizontal scroll wrapper for mobile — mirrors admin/users/page.tsx pattern */}
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <div className="min-w-[600px]">
              {/* Header row */}
              <div className="grid grid-cols-5 border-b border-border">
                <div className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Feature
                </div>
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`px-4 py-3 text-center ${plan.featured ? "bg-primary/5" : ""}`}
                  >
                    <p className={`text-xs font-bold ${plan.accentClass}`}>{plan.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {plan.priceRM === 0 ? "Free" : `RM${plan.priceRM}`}
                    </p>
                  </div>
                ))}
              </div>

              {/* Data rows */}
              {TABLE_ROWS.map((row, i) => (
                <div
                  key={row.key}
                  className={`grid grid-cols-5 border-b border-border/50 last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                >
                  <div className="px-4 py-3 text-xs text-muted-foreground flex items-center">
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
        </section>

        {/* ── 7-day free trial callout ── */}
        <section className="relative rounded-2xl bg-primary/5 border border-primary/20 overflow-hidden px-6 sm:px-10 py-10 text-center space-y-4">
          <h2 className="font-heading text-2xl font-bold text-foreground">Try everything free for 7 days</h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Add a card to start your free trial on any paid plan. You get immediate access to all
            features. If you cancel before day 7, <strong className="text-foreground">you are not
            charged at all</strong>. After day 7, your card is automatically billed and your full
            plan unlocks. You can cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center pt-2">
            <button
              onClick={() => setModalOpen(true)}
              className="px-6 py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
            >
              Start your free trial
            </button>
            <Link
              href="/register"
              className="px-6 py-3 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors"
            >
              Start with Free plan
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            No charge until trial ends · Cancel before day 7 for zero cost · One card per account
          </p>
        </section>

        {/* ── FAQ ── */}
        <section className="space-y-5 max-w-2xl mx-auto w-full">
          <h2 className="font-heading text-2xl font-bold text-foreground text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </section>

        {/* ── Footer CTA ── */}
        <section className="text-center space-y-4 border-t border-border pt-12">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            Ready to master Bahasa Malaysia?
          </h2>
          <p className="text-sm text-muted-foreground">
            Join students already learning with BahasaBot — start free today.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-8 py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md"
          >
            Start your free trial
          </button>
          <p className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </section>
      </main>

      <ComingSoonModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
